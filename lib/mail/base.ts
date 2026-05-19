const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const LOGO_LIGHT_MODE = 'https://res.cloudinary.com/dsfms7jb4/image/upload/v1779187456/logo_dark_kxdk23.svg';
const LOGO_DARK_MODE  = 'https://res.cloudinary.com/dsfms7jb4/image/upload/v1779187457/logo_vxmx1s.svg';

export function baseTemplate(content: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; }

    /* ── Mobile ──────────────────────────────────────────────────────────── */
    @media only screen and (max-width: 600px) {
      .outer-wrap  { padding: 0 !important; }
      .email-card  { border-radius: 0 !important; width: 100% !important; }
      .accent-row  { border-radius: 0 !important; }
      .footer-row  { border-radius: 0 !important; }
      .header-cell { padding: 20px 20px 18px !important; }
      .body-cell   { padding: 28px 20px 24px !important; }
      .footer-cell { padding: 16px 20px !important; }
    }

    /* ── Dark mode — swap logos + darken chrome ──────────────────────────── */
    @media (prefers-color-scheme: dark) {
      .logo-light  { display: none   !important; max-height: 0 !important; overflow: hidden !important; }
      .logo-dark   { display: block  !important; }
      .header-cell { background-color: #1d1d1d !important; border-color: #333 !important; }
      .body-cell   { background-color: #262626 !important; border-color: #333 !important; }
      .footer-cell { background-color: #1d1d1d !important; border-color: #333 !important; }
    }
    @media (prefers-color-scheme: light) {
      .logo-light  { display: block !important; }
      .logo-dark   { display: none  !important; max-height: 0 !important; overflow: hidden !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5;min-width:100%;">
    <tr>
      <td class="outer-wrap" align="center" style="padding:48px 16px 40px;">

        <!--[if mso]><table width="580" cellpadding="0" cellspacing="0" role="presentation"><tr><td><![endif]-->
        <table class="email-card" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:580px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

          <!-- ── Blue accent strip ──────────────────────────────────── -->
          <tr>
            <td class="accent-row" style="background:#197dff;height:4px;font-size:0;line-height:0;border-radius:12px 12px 0 0;">&nbsp;</td>
          </tr>

          <!-- ── Logo header ───────────────────────────────────────── -->
          <tr>
            <td class="header-cell" style="background:#ffffff;padding:28px 40px 24px;border-left:1px solid #e8e8e8;border-right:1px solid #e8e8e8;border-bottom:1px solid #f0f0f0;">
              <a href="${APP_URL}" style="text-decoration:none;display:inline-block;">
                <!-- Light mode logo (dark colored) -->
                <img
                  class="logo-light"
                  src="${LOGO_LIGHT_MODE}"
                  alt="WattUp"
                  height="28"
                  style="display:block;height:28px;width:auto;border:0;"
                />
                <!-- Dark mode logo (light/white colored) — hidden by default -->
                <img
                  class="logo-dark"
                  src="${LOGO_DARK_MODE}"
                  alt="WattUp"
                  height="28"
                  style="display:none;height:28px;width:auto;border:0;max-height:0;overflow:hidden;"
                />
              </a>
            </td>
          </tr>

          <!-- ── Body ───────────────────────────────────────────────── -->
          <tr>
            <td class="body-cell" style="background:#ffffff;padding:40px 40px 36px;border-left:1px solid #e8e8e8;border-right:1px solid #e8e8e8;">
              ${content}
            </td>
          </tr>

          <!-- ── Footer ─────────────────────────────────────────────── -->
          <tr>
            <td class="footer-cell footer-row" style="background:#f4f4f5;border-top:1px solid #ebebeb;border-radius:0 0 12px 12px;padding:20px 40px;border-left:1px solid #e8e8e8;border-right:1px solid #e8e8e8;border-bottom:1px solid #e8e8e8;">
              <p style="margin:0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:12px;font-weight:400;color:rgba(45,45,45,0.45);line-height:1.6;letter-spacing:-0.01em;text-align:center;">
                &copy; ${new Date().getFullYear()} WattUp USA. All rights reserved.<br/>
                This email was sent by WattUp. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ── heading ──────────────────────────────────────────────────────────────────
   Matches contact-info.tsx h3:
   text-[28px] font-bold leading-[110%] tracking-[-3%] text-dark (#2d2d2d)
*/
export function heading(text: string): string {
    return `<h1 style="margin:0 0 16px;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:28px;font-weight:700;color:#2d2d2d;letter-spacing:-0.03em;line-height:110%;">${text}</h1>`;
}

/* ── paragraph ────────────────────────────────────────────────────────────────
   Matches contact page body:
   text-[16px] font-normal leading-[130%] tracking-[-3%] text-dark/70
*/
export function paragraph(text: string): string {
    return `<p style="margin:0 0 16px;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:16px;font-weight:400;color:rgba(45,45,45,0.7);line-height:130%;letter-spacing:-0.03em;">${text}</p>`;
}

/* ── muted ────────────────────────────────────────────────────────────────────
   Fine print / disclaimers — rgba(45,45,45,0.45)
*/
export function muted(text: string): string {
    return `<p style="margin:24px 0 0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:13px;font-weight:400;color:rgba(45,45,45,0.45);line-height:1.6;letter-spacing:-0.02em;">${text}</p>`;
}

/* ── button ───────────────────────────────────────────────────────────────────
   Matches SubmitButton in contact-form-centered.tsx:
   h-14 px-8 rounded-[10px] bg-primary text-white text-[18px] font-bold tracking-tight
*/
export function button(label: string, href: string): string {
    return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
      <tr>
        <td style="border-radius:10px;background:#197dff;">
          <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:56px;mso-wrap-style:none;" arcsize="18%" stroke="f" fillcolor="#197dff"><v:textbox inset="0px,0px,0px,0px"><center style="color:#ffffff;font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:700;"><![endif]-->
          <a href="${href}" style="display:inline-block;padding:16px 32px;background:#197dff;color:#ffffff;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:-0.02em;white-space:nowrap;line-height:1;">
            ${label}
          </a>
          <!--[if mso]></center></v:textbox></v:roundrect><![endif]-->
        </td>
      </tr>
    </table>`;
}

/* ── badge ────────────────────────────────────────────────────────────────────
   Inline role/category pill — blue accent
*/
export function badge(text: string): string {
    return `<span style="display:inline-block;padding:3px 10px;background:#eff6ff;color:#197dff;border:1px solid #bfdbfe;border-radius:100px;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:12px;font-weight:600;letter-spacing:-0.01em;">${text}</span>`;
}
