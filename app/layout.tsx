import { getSiteSettings } from '@/app/_actions/settingsActions';
import {
    JsonLd,
    buildOrganizationSchema,
    buildServiceSchema,
    buildWebSiteSchema,
} from '@/components/json-ld';
import { InjectHeadScripts } from '@/components/inject-head-scripts';
import {
    BodyEndScripts,
    BodyStartScripts,
    TrackingScripts,
} from '@/components/tracking-scripts';
import { homeImages } from '@/lib/images/home';
import { sharedImageUrls } from '@/lib/images/shared';
import { videoUrls } from '@/lib/images/videos';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
    variable: '--font-sans',
    subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'https://wattup-usa.vercel.app/';
    const settings = await getSiteSettings();
    const ogImageUrl = homeImages.hero1Md;

    return {
        metadataBase: new URL(baseUrl),
        title: {
            default:
                'WattupUSA | EV Charging Solutions for Properties & Drivers',
            template: '%s | WattupUSA',
        },
        description:
            'Partner with WattupUSA to bring seamless EV charging to your property, or find a reliable charger near you. The future of mobility starts here.',
        keywords: [
            'EV Charging',
            'Electric Vehicle',
            'EV Charger Installation',
            'Commercial EV Charging',
            'WattupUSA',
            'EV Drivers',
            'Property Management EV',
        ],
        robots: 'index, follow',
        openGraph: {
            type: 'website',
            locale: 'en_US',
            url: baseUrl,
            title: 'WattupUSA | EV Charging Solutions for Properties & Drivers',
            description:
                'Bring seamless EV charging to your property or find a reliable WattUp charger near you.',
            siteName: 'WattupUSA',
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: 'WattupUSA EV Charging',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: 'WattupUSA | EV Charging Solutions',
            description:
                'The future of mobility starts with WattUp. Partner with us to install EV chargers or find a station near you.',
            images: [ogImageUrl],
            creator: '@wattupusa',
        },
        icons: {
            icon: [],
            apple: {
                url: '/assets/icons/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        },
        verification: {
            google:
                settings?.googleSiteVerification ||
                process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
                '',
        },
    };
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'https://wattup-usa.vercel.app';
    const settings = await getSiteSettings();

    const orgName = settings?.orgName || 'WattupUSA';
    const orgUrl = settings?.orgUrl || baseUrl;
    const orgDescription =
        settings?.orgDescription ||
        'WattupUSA provides turnkey EV charging solutions for property owners, fleet operators, and drivers — delivering seamless charging infrastructure across the United States.';

    const organizationSchema = buildOrganizationSchema({
        name: orgName,
        url: orgUrl,
        description: orgDescription,
        phone: settings?.orgPhone ?? undefined,
        email: settings?.orgEmail ?? undefined,
        address: settings?.orgAddress ?? undefined,
        logoUrl: settings?.orgLogoUrl ?? undefined,
        twitter: settings?.orgTwitter ?? undefined,
        linkedin: settings?.orgLinkedin ?? undefined,
        facebook: settings?.orgFacebook ?? undefined,
        instagram: settings?.orgInstagram ?? undefined,
    });

    const webSiteSchema = buildWebSiteSchema({
        name: orgName,
        url: orgUrl,
        description: orgDescription,
    });

    const serviceSchema = buildServiceSchema({ orgUrl, orgName });

    return (
        <html
            scroll-behavior='smooth'
            lang='en'
            className={cn(
                'font-sans',
                plusJakartaSans.variable,
                plusJakartaSans.variable
            )}>
            <head>
                <link
                    rel='icon'
                    href={sharedImageUrls.faviconLightSq}
                    media='(prefers-color-scheme: dark)'
                />
                <link
                    rel='icon'
                    href={sharedImageUrls.faviconDarkSq}
                    media='(prefers-color-scheme: light)'
                />
                <link rel='preconnect' href='https://res.cloudinary.com' />
                <link rel='preload' as='image' href={videoUrls.video1} />

                {/* AEO: JSON-LD Structured Data */}
                <JsonLd schema={organizationSchema} />
                <JsonLd schema={webSiteSchema} />
                <JsonLd schema={serviceSchema} />

                {/* Custom head scripts from admin — client-injected into document.head */}
                {settings?.headScripts && (
                    <InjectHeadScripts html={settings.headScripts} />
                )}
            </head>
            <body
                suppressHydrationWarning
                className={cn(
                    'font-sans antialiased mx-auto',
                    plusJakartaSans.variable
                )}>
                {/* Custom body-start scripts from admin */}
                <Suspense fallback={null}>
                    <BodyStartScripts />
                </Suspense>

                {children}

                <Toaster richColors position='top-right' duration={4000} />

                {/* Custom body-end scripts from admin */}
                <Suspense fallback={null}>
                    <BodyEndScripts />
                </Suspense>

                {/* All tracking scripts (GA, GTM, Meta Pixel) */}
                <Suspense fallback={null}>
                    <TrackingScripts />
                </Suspense>
            </body>
        </html>
    );
}
