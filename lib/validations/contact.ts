import { z } from 'zod';

export const MESSAGE_MAX = 500;

export const driverSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    message: z
        .string()
        .min(10, 'Message must be at least 10 characters')
        .max(MESSAGE_MAX, `Message cannot exceed ${MESSAGE_MAX} characters`),
    agreedToTerms: z.boolean().refine(val => val === true, {
        message: 'You must agree to the data processing terms',
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
    agreedToTerms: z.boolean().refine(val => val === true, {
        message: 'You must agree to the data processing terms',
    }),
});

export type DriverFormData = z.infer<typeof driverSchema>;
export type HostFormData = z.infer<typeof hostSchema>;
