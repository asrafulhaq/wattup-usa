import { Resend } from 'resend';
import { baseTemplate, heading, muted, paragraph } from './mail-base';

/**
 * Resend client for this app.
 *
 * Deliberately a copy of wattup-frontend's, not an import: the two apps share no
 * code (ADR 0001 section 3). The API key and the sender, though, are shared with
 * the frontend by client decision (2 Sep 2026), superseding ADR 0001 D10, which
 * gave this app its own key and a send subdomain. RESEND_API_KEY and MAIL_FROM
 * carry the frontend's values, and revoking that key stops both apps' mail.
 */

// Constructed on first send, not at import. `new Resend('')` throws when the key
// is empty, and this module is imported for maskEmail by routes that must be able
// to answer "503: RESEND_API_KEY is missing" (lib/env.ts) rather than fail to load.
let client: Resend | undefined;

function resend(): Resend {
    return (client ??= new Resend(process.env.RESEND_API_KEY));
}

type OtpMail = { email: string; otp: string; type: string };

/** Truncate an address for logs. Full addresses belong in activity_log, not here. */
export function maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!domain) return '***';
    return `${user.slice(0, 2)}***@${domain}`;
}

export async function sendOtpEmail({ email, otp, type }: OtpMail): Promise<void> {
    if (type !== 'sign-in') return;

    const { subject, html, text } = otpTemplate(otp);

    const { error } = await resend().emails.send({
        from: process.env.MAIL_FROM ?? 'WattUp <noreply@wattupusa.com>',
        replyTo: process.env.MAIL_REPLY_TO,
        to: email,
        subject,
        html,
        text,
    });

    if (error) {
        // A provider failure is ours to see, and the one place that sees it is
        // the after() catch in lib/auth.ts, which logs it with the masked
        // address. The code never appears. The caller of request-code has long
        // since received the same generic response as everyone else.
        throw new Error(`Resend ${(error as { name?: string }).name ?? 'error'}: ${error.message}`);
    }
}

/**
 * Plain text and HTML, both carrying the digits as selectable text rather than an
 * image, the ten minute expiry, and a line telling an unexpecting reader to ignore
 * it. The HTML is built on the same wrapper, type and palette as the dashboard's
 * password-reset and invitation mail (lib/mail-base.ts), so a member who receives
 * both sees one brand. The PRD's "matches the dark login screen" is superseded by
 * the client's instruction of 2 Sep 2026 that every pro-forma surface uses the
 * frontend's design.
 *
 * The code stays in the subject on purpose: mail clients surface it in the
 * notification, so the member need not open the message.
 */
export function otpTemplate(otp: string): { subject: string; html: string; text: string } {
    const subject = `${otp} is your WattUp sign-in code`;
    const year = new Date().getFullYear();

    const text = [
        `Your WattUp sign-in code is: ${otp}`,
        ``,
        `Enter it to sign in to the Site Pro-Forma Builder.`,
        `It expires in 10 minutes and can be used once.`,
        `If you did not request this code, you can ignore this email.`,
        ``,
        `© ${year} WattUp USA. All rights reserved.`,
        `This email was sent by WattUp. Please do not reply to this email.`,
    ].join('\n');

    const body = `
        ${heading('Your sign-in code')}
        ${paragraph('Enter this code to sign in to the WattUp Site Pro-Forma Builder.')}
        ${codePanel(otp)}
        ${muted('This code expires in <strong class="muted-strong" style="color:#646973;">10 minutes</strong> and can be used once. If you did not request this code, you can ignore this email.')}
    `;

    return { subject, html: baseTemplate(body), text };
}

/*
 * The six digits, treated like the credentials panel in the dashboard's invitation
 * mail: the #f4f4f5 panel with an uppercase label, and the value as a blue <code>
 * pill on #eff6ff. Text, never an image, so it can be selected and copied; monospaced
 * and letter-spaced so it reads at a glance. The pill's right padding is the left
 * padding minus one letter-space (0.2em of 36px), so the digits sit centred. The
 * panel, panel-label, code and muted-strong classes are the hooks the base's dark
 * rules restyle (lib/mail-base.ts explains the palette).
 */
function codePanel(otp: string): string {
    return `<table class="panel" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;border:1px solid #e8e8e8;border-radius:10px;margin:24px 0 0;overflow:hidden;">
          <tr>
            <td align="center" style="padding:20px 20px 0;">
              <p class="panel-label" style="margin:0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:11px;font-weight:700;color:#a4a4a5;letter-spacing:0.06em;text-transform:uppercase;">One-time code</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 20px 24px;">
              <code class="code" style="display:inline-block;font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:700;color:#197dff;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 17px 12px 24px;letter-spacing:0.2em;line-height:1;">${otp}</code>
            </td>
          </tr>
        </table>`;
}
