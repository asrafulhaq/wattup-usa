/**
 * The HTML wrapper and text helpers behind every email this app sends.
 *
 * Dark mode, and why it is built this way (checklist B.14). Three groups of clients,
 * three mechanisms:
 *
 * 1. Clients that honour `prefers-color-scheme` (Apple Mail, iOS Mail and the others
 *    that read the media query) only do so when the mail opts in with both
 *    `<meta name="color-scheme">` and `<meta name="supported-color-schemes">` plus the
 *    matching `:root` declaration. Without the metas Apple Mail keeps the light
 *    rendering; with the metas but without a complete dark block it would have left
 *    #2d2d2d text on the darkened cards. The block therefore restyles every element
 *    that carries a colour, including the ones the templates add (panels, code pills,
 *    links, strong text), which is why the templates carry class names.
 *
 * 2. Outlook.com and the Outlook apps do not read the media query. They recolour the
 *    mail themselves and tag the elements they touched with `data-ogsc` (colour) and
 *    `data-ogsb` (background). Every dark rule is emitted a second time under
 *    `[data-ogsc] .x, [data-ogsb] .x` so those clients get this palette instead of
 *    their own guess. darkCss() emits both forms from one list so they cannot drift.
 *
 * 3. Gmail (web, Android, iOS) ignores `prefers-color-scheme` entirely and, in its
 *    dark theme, inverts the light rendering on its own. The light rendering is built
 *    to survive that: the card is the `--card` token (white) but nothing on it is pure
 *    black, so an inversion gives light grey on near black rather than glaring white
 *    on black; every text colour is a solid hex, never an rgba() over white, because
 *    an inverting client composites alpha against the background it just flipped (a
 *    45% grey over a near black card vanishes) and Outlook desktop drops rgba()
 *    altogether and falls back to black; and both logos are PNGs that carry their own
 *    background, because no client inverts images.
 *
 * Palette. Light values are the app's :root tokens; dark values are the `.dark` block
 * in app/globals.css, converted to hex because no mail client renders oklch() or
 * var(). Alpha tokens are composited over the surface they sit on.
 *
 *   surface  token               light     dark
 *   canvas   --background         #f4f4f5   #393939
 *   card     --card               #ffffff   #1d1816   oklch(0.214 0.009 43.1)
 *   panel    --muted              #f4f4f5   #2b2422   oklch(0.268 0.011 36.5)
 *   heading  --card-foreground    #2d2d2d   #fbfaf9   oklch(0.986 0.002 67.8)
 *   body     --text-description   #6c6c6c   #bbbab9   70% white over the card
 *   muted    --text-muted         #a1a1a1   #8e8c8b   50% white over the card
 *   border   --border             #e8e8e8   #342f2d   10% white over the card
 *   link     --primary(-light)    #197dff   #2f80ff   4.7:1 on the card; #197dff is 4.5:1
 *   button   --primary            #197dff   #197dff   white label in both
 *   pill     primary tint         #eff6ff   #283143   15% primary over the panel
 *
 * The one-time code and the invitation password sit in the pill. In dark mode the
 * digits are --card-foreground on the tinted pill (12.5:1) rather than the brand blue
 * (3.5:1): a code has to be readable at a glance, and the blue survives in the pill's
 * border, the label above it and the button below.
 *
 * The light muted grey (#a1a1a1, 2.6:1 on white) is the site's text-dark/45, kept as
 * it is: raising it is a design decision, not a rendering one.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// Logos are PNG renditions (Cloudinary f_png): Gmail and Outlook do not render SVG in email.
// The default (light-mode) logo also carries its own white, rounded background (c_pad,b_white):
// Gmail ignores prefers-color-scheme and darkens cell backgrounds itself, but never touches
// images, so a self-backgrounded logo stays legible in both modes in every client. The
// .logo-light/.logo-dark swap below still serves clients that honour the media query.
const LOGO_LIGHT_MODE = 'https://res.cloudinary.com/dsfms7jb4/image/upload/f_png,w_320,h_96,c_pad,b_white,r_16/v1779187456/logo_dark_kxdk23.png';
const LOGO_DARK_MODE  = 'https://res.cloudinary.com/dsfms7jb4/image/upload/f_png,w_320/v1779187457/logo_vxmx1s.png';

/*
 * The dark rules, one list, emitted twice by darkCss(): inside the media query for the
 * clients that honour it, and under the Outlook.com attribute selectors. Every
 * declaration is made !important because it has to beat an inline light style.
 * Add a class here whenever a template introduces an element with a colour; the
 * render script's coverage check fails otherwise.
 */
const DARK_RULES: ReadonlyArray<readonly [selector: string, declarations: string]> = [
    ['.logo-light', 'display:none;max-height:0;overflow:hidden'],
    ['.logo-dark', 'display:block'],
    ['body, .email-canvas', 'background-color:#393939'],
    ['.email-card', 'box-shadow:0 1px 3px rgba(0,0,0,0.4)'],
    ['.accent-row', 'background-color:#197dff'],
    ['.header-cell, .body-cell', 'background-color:#1d1816;border-color:#342f2d'],
    ['.footer-cell', 'background-color:#2b2422;border-color:#342f2d'],
    ['.heading, .text-strong, .panel-value', 'color:#fbfaf9'],
    ['.paragraph, .muted-strong', 'color:#bbbab9'],
    ['.muted, .footer-text', 'color:#8e8c8b'],
    ['.link', 'color:#2f80ff'],
    ['.button-cell, .button', 'background-color:#197dff;color:#ffffff'],
    ['.panel', 'background-color:#2b2422;border-color:#403a38'],
    ['.panel-label', 'color:#959291'],
    ['.panel-divider', 'border-color:#403a38'],
    ['.code, .badge', 'background-color:#283143;border-color:#25436f;color:#fbfaf9'],
];

function darkCss(): string {
    const important = (declarations: string): string =>
        declarations
            .split(';')
            .filter(Boolean)
            .map((declaration) => `${declaration.trim()} !important`)
            .join('; ');

    const media = DARK_RULES
        .map(([selector, declarations]) => `      ${selector} { ${important(declarations)}; }`)
        .join('\n');

    const outlook = DARK_RULES
        .map(([selector, declarations]) => {
            const prefixed = selector
                .split(',')
                .map((single) => single.trim())
                .flatMap((single) => [`[data-ogsc] ${single}`, `[data-ogsb] ${single}`])
                .join(', ');
            return `    ${prefixed} { ${important(declarations)}; }`;
        })
        .join('\n');

    return `@media (prefers-color-scheme: dark) {\n${media}\n    }\n${outlook}`;
}

export function baseTemplate(content: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
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

    /* ── Light: pin the logo swap for clients that report a scheme ───────── */
    @media (prefers-color-scheme: light) {
      .logo-light  { display: block !important; }
      .logo-dark   { display: none  !important; max-height: 0 !important; overflow: hidden !important; }
    }

    /* ── Dark: the media query, then the same rules for Outlook.com ──────── */
    ${darkCss()}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table class="email-canvas" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5;min-width:100%;">
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
                <!-- Dark mode logo (light/white colored), hidden by default -->
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
              <p class="footer-text" style="margin:0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:12px;font-weight:400;color:#a1a1a1;line-height:1.6;letter-spacing:-0.01em;text-align:center;">
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
    return `<h1 class="heading" style="margin:0 0 16px;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:28px;font-weight:700;color:#2d2d2d;letter-spacing:-0.03em;line-height:110%;">${text}</h1>`;
}

/* ── paragraph ────────────────────────────────────────────────────────────────
   Matches contact page body:
   text-[16px] font-normal leading-[130%] tracking-[-3%] text-dark/70, as the solid #6c6c6c
*/
export function paragraph(text: string): string {
    return `<p class="paragraph" style="margin:0 0 16px;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:16px;font-weight:400;color:#6c6c6c;line-height:130%;letter-spacing:-0.03em;">${text}</p>`;
}

/* ── muted ────────────────────────────────────────────────────────────────────
   Fine print and disclaimers: text-dark/45, as the solid #a1a1a1
*/
export function muted(text: string): string {
    return `<p class="muted" style="margin:24px 0 0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:13px;font-weight:400;color:#a1a1a1;line-height:1.6;letter-spacing:-0.02em;">${text}</p>`;
}

/* ── button ───────────────────────────────────────────────────────────────────
   Matches SubmitButton in contact-form-centered.tsx:
   h-14 px-8 rounded-[10px] bg-primary text-white text-[18px] font-bold tracking-tight
*/
export function button(label: string, href: string): string {
    return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
      <tr>
        <td class="button-cell" style="border-radius:10px;background:#197dff;">
          <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:56px;mso-wrap-style:none;" arcsize="18%" stroke="f" fillcolor="#197dff"><v:textbox inset="0px,0px,0px,0px"><center style="color:#ffffff;font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:700;"><![endif]-->
          <a class="button" href="${href}" style="display:inline-block;padding:16px 32px;background:#197dff;color:#ffffff;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:-0.02em;white-space:nowrap;line-height:1;">
            ${label}
          </a>
          <!--[if mso]></center></v:textbox></v:roundrect><![endif]-->
        </td>
      </tr>
    </table>`;
}

/* ── badge ────────────────────────────────────────────────────────────────────
   Inline role/category pill, blue accent
*/
export function badge(text: string): string {
    return `<span class="badge" style="display:inline-block;padding:3px 10px;background:#eff6ff;color:#197dff;border:1px solid #bfdbfe;border-radius:100px;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:12px;font-weight:600;letter-spacing:-0.01em;">${text}</span>`;
}
