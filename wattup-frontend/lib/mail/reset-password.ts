import { baseTemplate, button, heading, muted, paragraph } from './base';

export function resetPasswordTemplate({
    name,
    url,
}: {
    name?: string;
    url: string;
}): { subject: string; html: string } {
    const greeting = name ? `Hi ${name},` : 'Hi there,';

    const body = `
        ${heading('Reset your password')}
        ${paragraph(`${greeting}<br/>We received a request to reset the password for your WattUp account. Click the button below to choose a new password.`)}
        ${paragraph('If you didn&rsquo;t make this request, you can safely ignore this email &mdash; your password will remain unchanged.')}
        ${button('Reset Password', url)}
        ${muted('This link expires in <strong style="color:rgba(17,24,39,0.65);">1 hour</strong>. For security, never share this link with anyone.')}
    `;

    return {
        subject: 'Reset your WattUp password',
        html: baseTemplate(body),
    };
}
