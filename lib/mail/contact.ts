import { baseTemplate, badge, heading, muted, paragraph } from './base';

// ─── Admin notification ───────────────────────────────────────────────────────

export function driverInquiryNotification({
    name,
    email,
    message,
}: {
    name: string;
    email: string;
    message: string;
}): { subject: string; html: string } {
    const body = `
        ${heading('New Driver Support Inquiry')}
        ${paragraph(`You received a new inquiry from a driver via the WattUp contact form. ${badge('Driver Support')}`)}
        ${detailsTable([
            { label: 'Name', value: name },
            { label: 'Email', value: `<a href="mailto:${email}" style="color:#197dff;text-decoration:none;">${email}</a>` },
            { label: 'Message', value: message, multiline: true },
        ])}
        ${muted('This inquiry was submitted through the WattUp contact form.')}
    `;

    return {
        subject: `[Driver Support] New inquiry from ${name}`,
        html: baseTemplate(body),
    };
}

export function hostInquiryNotification({
    companyName,
    location,
    parkingSpaces,
    contactInfo,
}: {
    companyName: string;
    location: string;
    parkingSpaces: string;
    contactInfo: string;
}): { subject: string; html: string } {
    const body = `
        ${heading('New Host Partnership Inquiry')}
        ${paragraph(`A business has submitted a host partnership request via the WattUp contact form. ${badge('Host Partnership')}`)}
        ${detailsTable([
            { label: 'Company', value: companyName },
            { label: 'Location', value: location },
            { label: 'Parking Spaces', value: parkingSpaces },
            { label: 'Contact Info', value: contactInfo, multiline: true },
        ])}
        ${muted('This inquiry was submitted through the WattUp contact form.')}
    `;

    return {
        subject: `[Host Partnership] New inquiry from ${companyName}`,
        html: baseTemplate(body),
    };
}

// ─── User confirmation ────────────────────────────────────────────────────────

export function driverInquiryConfirmation({
    name,
}: {
    name: string;
}): { subject: string; html: string } {
    const body = `
        ${heading('We received your message')}
        ${paragraph(`Hi ${name},<br/>Thank you for reaching out to WattUp. We&rsquo;ve received your inquiry and a member of our support team will get back to you shortly.`)}
        ${paragraph('In the meantime, you can explore our <a href="https://wattupusa.com/faq" style="color:#197dff;text-decoration:none;">FAQ page</a> for quick answers to common questions.')}
        ${muted('If you have anything urgent to add, simply reply to this email.')}
    `;

    return {
        subject: `We received your inquiry — WattUp Support`,
        html: baseTemplate(body),
    };
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function detailsTable(
    rows: { label: string; value: string; multiline?: boolean }[]
): string {
    const rowsHtml = rows
        .map(
            ({ label, value, multiline }) => `
        <tr>
          <td style="padding:10px 20px 0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:11px;font-weight:600;color:rgba(17,24,39,0.4);letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;vertical-align:top;">
            ${label}
          </td>
        </tr>
        <tr>
          <td style="padding:4px 20px ${multiline ? '14px' : '10px'};font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:14px;font-weight:500;color:#0f1117;line-height:1.6;${multiline ? 'white-space:pre-wrap;' : ''}border-bottom:1px solid #f0f0f0;">
            ${value}
          </td>
        </tr>`
        )
        .join('');

    return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:10px;margin:20px 0 0;overflow:hidden;">
      <tr><td style="padding:16px 20px 0;">
        <p style="margin:0 0 4px;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;font-size:11px;font-weight:600;color:rgba(17,24,39,0.4);letter-spacing:0.06em;text-transform:uppercase;">Inquiry Details</p>
      </td></tr>
      ${rowsHtml}
      <tr><td style="padding:10px 0 0;"></td></tr>
    </table>`;
}
