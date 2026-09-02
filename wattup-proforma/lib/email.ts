import { Resend } from 'resend';

/**
 * Resend client for this app.
 *
 * Deliberately a copy of wattup-frontend's, not an import: the two apps share no
 * code (ADR 0001 section 3), and each holds its own API key so one can be revoked
 * without taking down the other's mail.
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
        from: process.env.MAIL_FROM ?? 'WattUp <noreply@send.wattupusa.com>',
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
 * it. Styled to match the dark login screen so it does not read as phishing.
 */
function otpTemplate(otp: string) {
    const subject = `${otp} is your WattUp sign-in code`;

    const text = [
        `Your WattUp Site Pro-Forma Builder sign-in code is: ${otp}`,
        ``,
        `It expires in 10 minutes and can be used once.`,
        `If you did not request this code, you can ignore this email.`,
        ``,
        `WattUpUSA · Confidential`,
    ].join('\n');

    const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#0B0E13;color:#E9EDF3;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif">
  <div style="max-width:392px;margin:0 auto">
    <div style="background:#12171F;border:1px solid rgba(255,255,255,.09);
      border-radius:12px;padding:28px">
      <h1 style="margin:0 0 6px;font-size:17px;font-weight:700">Site Pro-Forma Builder</h1>
      <p style="margin:0 0 22px;color:#9BA6B6;font-size:13px;line-height:1.5">
        Enter this code to sign in.</p>
      <p style="margin:0 0 22px;font-size:32px;font-weight:700;letter-spacing:.18em;
        font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${otp}</p>
      <p style="margin:0;color:#9BA6B6;font-size:12.5px;line-height:1.5">
        It expires in 10 minutes and can be used once.<br>
        If you did not request this code, you can ignore this email.</p>
    </div>
    <p style="text-align:center;color:#6C7787;font-size:11.5px;margin:22px 0 0">
      WattUpUSA · Confidential</p>
  </div>
</body></html>`;

    return { subject, html, text };
}
