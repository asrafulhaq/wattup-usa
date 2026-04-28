import nodemailer from 'nodemailer';

export const mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendMail = async ({
    email,
    subject,
    html,
}: {
    email: string;
    subject: string;
    html: string;
}) => {
    await mailer.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: email,
        subject,
        html,
    });
};

