'use server';

import { sendMail } from '@/lib/email';
import {
    driverInquiryConfirmation,
    driverInquiryNotification,
    hostInquiryNotification,
} from '@/lib/mail/contact';
import { z } from 'zod';

const CONTACT_EMAIL =
    process.env.CONTACT_EMAIL ?? process.env.ADMIN_EMAIL ?? 'admin@wattup.com';

const MESSAGE_MAX = 500;

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const driverSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    message: z
        .string()
        .min(10, 'Message must be at least 10 characters')
        .max(MESSAGE_MAX, `Message cannot exceed ${MESSAGE_MAX} characters`),
    agreedToTerms: z.literal(true, {
        errorMap: () => ({ message: 'You must agree to the data processing terms' }),
    }),
});

export const hostSchema = z.object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    location: z.string().min(2, 'Please enter a valid location'),
    parkingSpaces: z.string().min(1, 'Please enter the number of parking spaces'),
    contactInfo: z
        .string()
        .min(5, 'Please provide your contact information')
        .max(MESSAGE_MAX, `Contact info cannot exceed ${MESSAGE_MAX} characters`),
    agreedToTerms: z.literal(true, {
        errorMap: () => ({ message: 'You must agree to the data processing terms' }),
    }),
});

export type DriverFormData = z.infer<typeof driverSchema>;
export type HostFormData = z.infer<typeof hostSchema>;

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
