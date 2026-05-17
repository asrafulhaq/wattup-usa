import { getSiteSettings } from '@/app/_actions/settingsActions';
import { cacheLife, cacheTag } from 'next/cache';
import Script from 'next/script';

export async function TrackingScripts() {
    'use cache';
    cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
    cacheTag('siteSettings');

    const settings = await getSiteSettings();

    const gaId =
        settings?.googleAnalyticsId ||
        process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
    const gtmId =
        settings?.googleTagManagerId ||
        process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;
    const pixelId = settings?.metaPixelId;

    return (
        <>
            {/* Google Analytics */}
            {gaId && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                        strategy='afterInteractive'
                    />
                    <Script id='google-analytics' strategy='afterInteractive'>
                        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
                    </Script>
                </>
            )}

            {/* Google Tag Manager */}
            {gtmId && (
                <Script id='google-tag-manager' strategy='afterInteractive'>
                    {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
                </Script>
            )}

            {/* Meta Pixel */}
            {pixelId && (
                <Script id='meta-pixel' strategy='afterInteractive'>
                    {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
                </Script>
            )}

            {/* GTM noscript fallback */}
            {gtmId && (
                <noscript>
                    <iframe
                        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                        height='0'
                        width='0'
                        style={{ display: 'none', visibility: 'hidden' }}
                    />
                </noscript>
            )}

            {/* Meta Pixel noscript fallback */}
            {pixelId && (
                <noscript>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        height='1'
                        width='1'
                        style={{ display: 'none' }}
                        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                        alt=''
                    />
                </noscript>
            )}
        </>
    );
}

export async function BodyStartScripts() {
    'use cache';
    cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
    cacheTag('siteSettings');

    const settings = await getSiteSettings();
    if (!settings?.bodyStartScripts) return null;
    return (
        <div
            dangerouslySetInnerHTML={{ __html: settings.bodyStartScripts }}
            suppressHydrationWarning
        />
    );
}

export async function BodyEndScripts() {
    'use cache';
    cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
    cacheTag('siteSettings');

    const settings = await getSiteSettings();
    if (!settings?.bodyEndScripts) return null;
    return (
        <div
            dangerouslySetInnerHTML={{ __html: settings.bodyEndScripts }}
            suppressHydrationWarning
        />
    );
}
