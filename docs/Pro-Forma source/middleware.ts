/**
 * WattUpUSA Site Pro-Forma Builder — access gate.
 *
 * Runs on Vercel's edge before any file is served. The password lives in the
 * SITE_PASSWORD environment variable and is never sent to the browser; what the
 * browser gets is an HMAC-signed expiry cookie it cannot forge without
 * GATE_SECRET. Brand assets are left open so the login screen can show the
 * wordmark before sign-in.
 */

export const config = {
  matcher: '/((?!_vercel|assets/|favicon).*)',
};

const COOKIE = 'wu_gate';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const enc = new TextEncoder();

async function key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function sign(value: string, secret: string): Promise<string> {
  const mac = await crypto.subtle.sign('HMAC', await key(secret), enc.encode(value));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Length-safe, non-short-circuiting comparison. */
function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function ticket(secret: string): Promise<string> {
  const exp = String(Date.now() + MAX_AGE * 1000);
  return `${exp}.${await sign(exp, secret)}`;
}

async function ticketValid(raw: string | undefined, secret: string): Promise<boolean> {
  if (!raw) return false;
  const dot = raw.lastIndexOf('.');
  if (dot < 1) return false;
  const exp = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return sameString(sig, await sign(exp, secret));
}

function page(error: boolean, next: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>WattUpUSA · Site Pro-Forma Builder</title>
<link rel="icon" href="/assets/favicon.svg">
<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700,400&display=swap">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--blue:#3B7DFF;--ink:#0B0E13;--ink-1:#12171F;--line:rgba(255,255,255,.09);
        --line-2:rgba(255,255,255,.16);--text:#E9EDF3;--text-2:#9BA6B6;--text-3:#6C7787}
  html,body{min-height:100%}
  body{min-height:100vh;background:var(--ink);color:var(--text);
       font-family:'Satoshi',-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif;
       font-size:14px;-webkit-font-smoothing:antialiased;
       display:flex;align-items:center;justify-content:center;padding:24px;
       background-image:radial-gradient(900px 520px at 50% -8%,rgba(59,125,255,.16),transparent 70%)}
  .card{width:100%;max-width:392px}
  .brand{display:flex;justify-content:center;margin-bottom:30px}
  .brand img{height:26px;width:auto;display:block}
  .box{background:var(--ink-1);border:1px solid var(--line);border-radius:12px;padding:28px}
  h1{font-size:17px;font-weight:700;letter-spacing:-.01em;margin-bottom:6px}
  .sub{color:var(--text-2);font-size:13px;line-height:1.5;margin-bottom:22px}
  label{display:block;font-size:11px;font-weight:500;letter-spacing:.09em;
        text-transform:uppercase;color:var(--text-3);margin-bottom:8px}
  input{width:100%;background:#0B0E13;border:1px solid var(--line-2);border-radius:8px;
        color:var(--text);padding:11px 13px;font-size:14px;outline:none;transition:border-color .12s}
  input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,125,255,.16)}
  button{width:100%;margin-top:16px;background:var(--blue);border:0;border-radius:8px;
         color:#fff;font-size:14px;font-weight:700;padding:12px;cursor:pointer;transition:background .12s}
  button:hover{background:#2C63D9}
  .err{display:flex;gap:8px;align-items:flex-start;background:rgba(240,72,72,.09);
       border:1px solid rgba(240,72,72,.3);color:#FFB4B4;border-radius:8px;
       padding:10px 12px;font-size:12.5px;line-height:1.45;margin-bottom:18px}
  .foot{text-align:center;color:var(--text-3);font-size:11.5px;margin-top:22px;line-height:1.6}
</style></head>
<body>
  <div class="card">
    <div class="brand"><img src="/assets/logo_type_light.svg" alt="WattUpUSA"></div>
    <div class="box">
      <h1>Site Pro-Forma Builder</h1>
      <p class="sub">Internal underwriting tool. Enter the team password to continue.</p>
      ${error ? '<div class="err"><span>That password is not right. Check with Harshil if you need it.</span></div>' : ''}
      <form method="POST" action="/__gate">
        <input type="hidden" name="next" value="${next.replace(/"/g, '&quot;')}">
        <label for="pw">Team password</label>
        <input id="pw" name="password" type="password" autocomplete="current-password"
               autofocus required>
        <button type="submit">Enter</button>
      </form>
      <p class="foot">WattUpUSA · Confidential</p>
    </div>
  </div>
</body></html>`;

  return new Response(html, {
    status: error ? 401 : 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

function misconfigured(): Response {
  return new Response(
    'This deployment is missing SITE_PASSWORD or GATE_SECRET. Set both in the Vercel project ' +
      'environment variables and redeploy.',
    { status: 503, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } },
  );
}

function safeNext(raw: string | null): string {
  // Only same-site absolute paths, so the gate can't be used as an open redirect.
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const password = process.env.SITE_PASSWORD;
  const secret = process.env.GATE_SECRET;
  if (!password || !secret) return misconfigured();

  const url = new URL(request.url);

  // Sign out.
  if (url.pathname === '/__logout') {
    const res = new Response(null, { status: 302, headers: { location: '/' } });
    res.headers.append('set-cookie', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
    return res;
  }

  // Login submission.
  if (url.pathname === '/__gate') {
    if (request.method !== 'POST') return page(false, '/');
    const form = await request.formData();
    const attempt = String(form.get('password') ?? '');
    const next = safeNext(String(form.get('next') ?? '/'));
    if (!sameString(attempt, password)) return page(true, next);

    const res = new Response(null, { status: 302, headers: { location: next } });
    res.headers.append(
      'set-cookie',
      `${COOKIE}=${await ticket(secret)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
    );
    return res;
  }

  // Everything else needs a valid ticket.
  const jar = request.headers.get('cookie') ?? '';
  const found = jar.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  if (await ticketValid(found?.slice(COOKIE.length + 1), secret)) return undefined;

  return page(false, url.pathname + url.search);
}
