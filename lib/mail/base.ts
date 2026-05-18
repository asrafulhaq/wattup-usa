const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

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
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5;min-width:100%;">
    <tr>
      <td align="center" style="padding:48px 16px 40px;">

        <!--[if mso]><table width="560" cellpadding="0" cellspacing="0" role="presentation"><tr><td><![endif]-->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;">

          <!-- ── Header ─────────────────────────────────────────── -->
          <tr>
            <td style="background:#197dff;border-radius:14px 14px 0 0;padding:28px 40px 24px;text-align:left;">
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td>
                    <a href="${APP_URL}" style="text-decoration:none;">
                      <img
                        src="${APP_URL}/assets/images/shared/logo.svg"
                        alt="WattUp"
                        height="26"
                        style="display:block;height:26px;border:0;"
                      />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Body ──────────────────────────────────────────── -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 36px;border-left:1px solid #e8e8e8;border-right:1px solid #e8e8e8;">
              ${content}
            </td>
          </tr>

          <!-- ── Footer ────────────────────────────────────────── -->
          <tr>
            <td style="background:#ffffff;border-top:1px solid #f0f0f0;border-radius:0 0 14px 14px;padding:20px 40px 24px;border-left:1px solid #e8e8e8;border-right:1px solid #e8e8e8;border-bottom:1px solid #e8e8e8;">
              <p style="margin:0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:12px;color:rgba(17,24,39,0.4);line-height:1.6;text-align:center;">
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

export function button(label: string, href: string): string {
    return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
      <tr>
        <td style="background:#197dff;border-radius:10px;">
          <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:50px;mso-wrap-style:none;" arcsize="20%" stroke="f" fillcolor="#197dff"><v:textbox inset="0px,0px,0px,0px"><center style="color:#ffffff;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:600;"><![endif]-->
          <a href="${href}" style="display:inline-block;padding:14px 32px;background:#197dff;color:#ffffff;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:-0.01em;white-space:nowrap;">
            ${label}
          </a>
          <!--[if mso]></center></v:textbox></v:roundrect><![endif]-->
        </td>
      </tr>
    </table>`;
}

export function heading(text: string): string {
    return `<h1 style="margin:0 0 16px;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:24px;font-weight:700;color:#0f1117;letter-spacing:-0.03em;line-height:1.2;">${text}</h1>`;
}

export function paragraph(text: string): string {
    return `<p style="margin:0 0 16px;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:15px;font-weight:400;color:rgba(17,24,39,0.7);line-height:1.7;">${text}</p>`;
}

export function muted(text: string): string {
    return `<p style="margin:24px 0 0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:13px;color:rgba(17,24,39,0.45);line-height:1.6;">${text}</p>`;
}

export function badge(text: string): string {
    return `<span style="display:inline-block;padding:3px 10px;background:#eff6ff;color:#197dff;border:1px solid #bfdbfe;border-radius:100px;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:12px;font-weight:600;letter-spacing:0.01em;">${text}</span>`;
}
