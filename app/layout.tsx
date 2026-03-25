import { sharedImageUrls } from '@/lib/images/shared';
import Footer from '@/components/home/footer';
import { Navbar } from '@/components/home/navbar';
import { cn } from '@/lib/utils';
import { homeImages } from '@/lib/images/home';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
    variable: '--font-sans',
    subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'https://wattup-usa.vercel.app/';
    const ogImageUrl = homeImages.hero1Md;
    const twitterImageUrl = ogImageUrl;

    return {
        metadataBase: new URL(baseUrl),
        title: {
            default:
                'WattUp USA | EV Charging Solutions for Properties & Drivers',
            template: '%s | WattUp USA',
        },
        description:
            'Partner with WattUp USA to bring seamless EV charging to your property, or find a reliable charger near you. The future of mobility starts here.',

        keywords: [
            'EV Charging',
            'Electric Vehicle',
            'EV Charger Installation',
            'Commercial EV Charging',
            'WattUp USA',
            'EV Drivers',
            'Property Management EV',
        ],
        robots: 'index, follow',
        openGraph: {
            type: 'website',
            locale: 'en_US',
            url: baseUrl,
            title: 'WattUp USA | EV Charging Solutions for Properties & Drivers',
            description:
                'Bring seamless EV charging to your property or find a reliable WattUp charger near you.',
            siteName: 'WattUp USA',
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: 'WattUp USA EV Charging',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: 'WattUp USA | EV Charging Solutions',
            description:
                'The future of mobility starts with WattUp. Partner with us to install EV chargers or find a station near you.',
            images: [twitterImageUrl],
            creator: '@wattupusa',
        },
        icons: {
            icon: [
                // Only PWA/manifest-sized icons here — tab favicon is handled
                // by theme-aware <link> tags in the <head> below
         /*        {
                    url: '/assets/icons/android-chrome-192x192.png',
                    sizes: '192x192',
                    type: 'image/png',
                },
                {
                    url: '/assets/icons/android-chrome-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                }, */
            ],
            apple: {
                url: '/assets/icons/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        },
        verification: {
            google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
        },
    };
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            scroll-behavior='smooth'
            lang='en'
            className={cn('font-sans', plusJakartaSans.variable)}>
            <head>
                {/* Theme-aware favicons — browser picks based on system color scheme */}
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
            </head>
            <body
                suppressHydrationWarning
                className={`${plusJakartaSans.variable} antialiased  mx-auto `}>
                <noscript>
                    <iframe
                        src={`https://www.googletagmanager.com/ns.html?id=${`seo.googleTagManagerId`}`}
                        height='0'
                        width='0'
                        style={{ display: 'none', visibility: 'hidden' }}
                    />
                </noscript>
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${`seo.googleAnalyticsId`}`}
                        strategy='afterInteractive'
                    />
                    <Script id='google-analytics' strategy='afterInteractive'>
                        {`
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());

                                gtag('config', '${`seo.googleAnalyticsId`}');
                            `}
                    </Script>
                </>

                <Script id='google-tag-manager' strategy='afterInteractive'>
                    {`
                        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                        })(window,document,'script','dataLayer','${`seo.googleTagManagerId`}');
                        `}
                </Script>

                {/*  <SmoothScroll /> */}
                <div className='flex min-h-screen w-full flex-col bg-background selection:bg-primary/20 mx-auto'>
                    {/* The Navbar floats absolutely over the entire Hero */}
                    <Navbar />
                    {children}
                    <Footer />
                </div>
            </body>
        </html>
    );
}




