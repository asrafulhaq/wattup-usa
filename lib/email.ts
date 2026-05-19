import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export const sendMail = async ({
    email,
    subject,
    html,
}: {
    email: string;
    subject: string;
    html: string;
}) => {
    const { error } = await resend.emails.send({
        from: process.env.MAIL_FROM ?? 'WattUp <noreply@wattup.com>',
        to: email,
        subject,
        html,
    });

    if (error) {
        console.error('[Resend] send failed:', {
            name: (error as any).name,
            statusCode: (error as any).statusCode,
            message: error.message,
        });
        throw new Error(`Resend error [${(error as any).statusCode ?? 'unknown'}] ${(error as any).name ?? ''}: ${error.message}`);
    }
};
