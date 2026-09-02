import { baseTemplate, badge, button, heading, muted, paragraph } from './base';

export function inviteUserTemplate({
    name,
    email,
    password,
    role,
    invitedBy,
}: {
    name: string;
    email: string;
    password: string;
    role: string;
    invitedBy: string;
}): { subject: string; html: string } {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const loginUrl = `${APP_URL}/admin`;

    const credentialsTable = `
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;border:1px solid #e8e8e8;border-radius:10px;margin:24px 0 0;overflow:hidden;">
          <tr>
            <td style="padding:16px 20px 0;">
              <p style="margin:0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:11px;font-weight:700;color:rgba(45,45,45,0.4);letter-spacing:0.06em;text-transform:uppercase;">Your login credentials</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 20px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td width="90" style="padding:8px 0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:13px;font-weight:600;color:rgba(45,45,45,0.5);letter-spacing:-0.02em;vertical-align:top;">Email</td>
                  <td style="padding:8px 0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:14px;font-weight:500;color:#2d2d2d;letter-spacing:-0.03em;word-break:break-all;">${email}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:0;line-height:0;font-size:0;border-top:1px solid #e8e8e8;"></td>
                </tr>
                <tr>
                  <td width="90" style="padding:8px 0 18px;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:13px;font-weight:600;color:rgba(45,45,45,0.5);letter-spacing:-0.02em;vertical-align:top;">Password</td>
                  <td style="padding:8px 0 18px;">
                    <code style="font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:700;color:#197dff;background:#eff6ff;padding:4px 10px;border-radius:6px;letter-spacing:0.02em;">${password}</code>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
    `;

    const body = `
        ${heading('Welcome to WattUp')}
        ${paragraph(`Hi ${name},<br/><strong style="color:#2d2d2d;font-weight:700;">${invitedBy}</strong> has invited you to join WattUp as ${badge(role)}.`)}
        ${paragraph('Your account is ready. Use the credentials below to sign in &mdash; we recommend changing your password after your first login.')}
        ${credentialsTable}
        ${button('Sign In to WattUp', loginUrl)}
        ${muted('If you believe you received this invitation by mistake, you can ignore this email. Your account will remain inactive until you sign in.')}
    `;

    return {
        subject: `You've been invited to WattUp`,
        html: baseTemplate(body),
    };
}
