'use server';

import { sendMail } from '@/lib/email';
import {
    driverInquiryConfirmation,
    driverInquiryNotification,
    hostInquiryNotification,
} from '@/lib/mail/contact';
import { driverSchema, hostSchema, type DriverFormData, type HostFormData } from '@/lib/validations/contact';

const CONTACT_EMAIL =
    process.env.CONTACT_EMAIL ?? process.env.ADMIN_EMAIL ?? 'admin@wattup.com';

type ActionResult = { success: true } | { error: string };

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function submitDriverInquiry(data: DriverFormData): Promise<ActionResult> {
    const parsed = driverSchema.safeParse(data);
    if (!parsed.success) {
        return { error: parsed.error.errors[0]?.message ?? 'Invalid form data' };
    }

    const { name, email, message } = parsed.data;

    try {
        await Promise.all([
            sendMail({
                email: CONTACT_EMAIL,
                ...driverInquiryNotification({ name, email, message }),
            }),
            sendMail({
                email,
                ...driverInquiryConfirmation({ name }),
            }),
        ]);

        return { success: true };
    } catch (err) {
        console.error('[contact] driver inquiry failed:', err);
        return { error: 'Failed to send your inquiry. Please try again.' };
    }
}

export async function submitHostInquiry(data: HostFormData): Promise<ActionResult> {
    const parsed = hostSchema.safeParse(data);
    if (!parsed.success) {
        return { error: parsed.error.errors[0]?.message ?? 'Invalid form data' };
    }

    const { companyName, location, parkingSpaces, contactInfo } = parsed.data;

    try {
        await sendMail({
            email: CONTACT_EMAIL,
            ...hostInquiryNotification({ companyName, location, parkingSpaces, contactInfo }),
        });

        return { success: true };
    } catch (err) {
        console.error('[contact] host inquiry failed:', err);
        return { error: 'Failed to send your inquiry. Please try again.' };
    }
}
