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
        // Resend's published error type does not carry `statusCode`, though the API
        // returns one, and `name` is a narrow union that widens badly here. Read both
        // through one structural cast rather than `any`, so the shape stays checked.
        const { name, statusCode } = error as {
            name?: string;
            statusCode?: number;
        };
        console.error('[Resend] send failed:', {
            name,
            statusCode,
            message: error.message,
        });
        throw new Error(
            `Resend error [${statusCode ?? 'unknown'}] ${name ?? ''}: ${error.message}`,
        );
    }
};
