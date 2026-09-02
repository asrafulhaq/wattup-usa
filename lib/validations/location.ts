import { z } from 'zod';

/**
 * What the dashboard is allowed to save for a location.
 *
 * Parsed on the server, not only in the form. A server action is a callable endpoint, so
 * the form's own validation is a convenience for the person typing and proves nothing
 * about what actually arrives.
 */

export const CONNECTOR_TYPES = ['CCS1', 'NACS', 'CCS2', 'CHAdeMO'] as const;
export const STATION_STATUSES = ['LIVE', 'UNDER_CONSTRUCTION', 'PLANNED'] as const;

/** Lowercase, hyphenated, no leading or trailing hyphen. It ends up in a public URL. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value: string): string {
    return value
        .toLowerCase()
        // NFKD splits an accented letter into the letter plus a combining mark, and the
        // mark is then dropped rather than being turned into a hyphen by the next line.
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

const connectorSchema = z.object({
    type: z.enum(CONNECTOR_TYPES),
    // Zero is meaningful: it records "this type was considered and there are none of it".
    count: z.number().int().min(0).max(999),
});

export const locationSchema = z.object({
    slug: z
        .string()
        .trim()
        .min(1, 'A URL slug is required')
        .max(120)
        .regex(SLUG_PATTERN, 'Use lowercase letters, numbers and hyphens only'),

    // ── Public ────────────────────────────────────────────────────────────────
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(160),
    street: z.string().trim().min(2, 'Street is required').max(200),
    city: z.string().trim().min(1, 'City is required').max(120),
    region: z.string().trim().min(1, 'State or region is required').max(120),
    postalCode: z.string().trim().min(1, 'Postal code is required').max(20),
    // ISO-3166 alpha-2, so the finder can grow past the US without a schema change.
    country: z.string().trim().length(2, 'Use a two letter country code').toUpperCase(),

    // Bounds are the real ones, not a formality: a transposed pair puts a Californian
    // site in the Indian Ocean, and the map draws it there without complaint.
    latitude: z.number().min(-90, 'Latitude is out of range').max(90, 'Latitude is out of range'),
    longitude: z
        .number()
        .min(-180, 'Longitude is out of range')
        .max(180, 'Longitude is out of range'),

    market: z.string().trim().min(1).max(60),
    status: z.enum(STATION_STATUSES),
    goLiveYear: z
        .number()
        .int()
        .min(2000, 'Year looks wrong')
        .max(2100, 'Year looks wrong'),
    county: z.string().trim().max(120),
    countyFips: z.string().trim().max(10),
    maxPowerKw: z.number().int().min(1, 'Power must be at least 1kW').max(5000),
    chargerCount: z.number().int().min(0).max(999),

    /** Null means no tariff has been set, which the site renders as "Being confirmed". */
    pricePerKwh: z.number().min(0).max(99.9999).nullable(),

    published: z.boolean(),

    // ── Search and social ────────────────────────────────────────────────────
    // Empty strings become null: a blank override must fall back to the generated
    // value, not publish an empty <title>.
    metaTitle: z
        .string()
        .trim()
        .max(70, 'Google truncates titles past about 60 characters')
        .nullable()
        .transform(value => value || null),
    metaDescription: z
        .string()
        .trim()
        .max(200, 'Google truncates descriptions past about 160 characters')
        .nullable()
        .transform(value => value || null),
    imageUrl: z
        .string()
        .trim()
        .max(600)
        .nullable()
        .transform(value => value || null)
        .refine(
            value => value === null || /^https?:\/\//.test(value),
            'Enter a full URL starting with http:// or https://'
        ),
    imagePublicId: z.string().trim().max(300).nullable().transform(value => value || null),
    noIndex: z.boolean(),

    /** Amenity slugs. Validated against the catalogue in the action, not here. */
    amenities: z.array(z.string().trim().min(1)).max(200),
    connectors: z.array(connectorSchema).max(CONNECTOR_TYPES.length),

    // ── Private. Shown in the dashboard, never projected to the browser. ──────
    signedNumber: z.number().int().min(0).max(100000).nullable(),
    initialNotes: z.string().trim().max(2000),
    pipelineRef: z.string().trim().max(120),
    company: z.string().trim().max(200),
    addressRaw: z.string().trim().max(400),
    noticeAddress: z.string().trim().max(400),
    apn: z.string().trim().max(120),
    siteScore: z.number().min(0).max(5).nullable(),
    switchgearCount: z.number().int().min(0).max(999).nullable(),
    switchgearOrderedDate: z.string().trim().max(40).nullable(),
    salesRep: z.string().trim().max(120),
});

export type LocationInput = z.infer<typeof locationSchema>;

export const amenitySchema = z.object({
    slug: z
        .string()
        .trim()
        .min(1, 'A slug is required')
        .max(60)
        // Underscores are allowed here and not in a location slug: amenity slugs are
        // filter values in a query string, not path segments, and the seeded catalogue
        // already uses car_wash and pet_friendly.
        .regex(/^[a-z0-9_]+(?:-[a-z0-9_]+)*$/, 'Use lowercase letters, numbers, hyphens and underscores'),
    label: z.string().trim().min(1, 'A label is required').max(80),
    icon: z.string().trim().min(1).max(60),
    sortOrder: z.number().int().min(0).max(10000),
    active: z.boolean(),
});

export type AmenityInput = z.infer<typeof amenitySchema>;
