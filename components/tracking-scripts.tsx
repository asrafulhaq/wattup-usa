import { getSiteSettings } from '@/app/_actions/settingsActions';
import { cacheLife, cacheTag } from 'next/cache';
import Script from 'next/script';

async function getTrackingIds() {
    'use cache';
    cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
    cacheTag('siteSettings');
    const settings = await getSiteSettings();
    return {
        gaId:
            settings?.googleAnalyticsId ||
            process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
        gtmId:
            settings?.googleTagManagerId ||
            process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID,
        pixelId: settings?.metaPixelId,
    };
}

/** GTM loader — place inside <head> as high as possible */
export async function GtmHeadScript() {
    const { gtmId } = await getTrackingIds();
    if (!gtmId) return null;
    return (
        // eslint-disable-next-line @next/next/next-script-for-ga
        <script
            id='google-tag-manager'
            dangerouslySetInnerHTML={{
                __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
            }}
        />
    );
}

/** GTM noscript fallback — place immediately after opening <body> */
export async function GtmBodyNoscript() {
    const { gtmId } = await getTrackingIds();
    if (!gtmId) return null;
    return (
        <noscript>
            <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                height='0'
                width='0'
                style={{ display: 'none', visibility: 'hidden' }}
            />
        </noscript>
    );
}

/** GA, Meta Pixel — place anywhere in <body> */
export async function TrackingScripts() {
    const { gaId, pixelId } = await getTrackingIds();

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

            {/* Meta Pixel */}
            {pixelId && (
                <>
                    <Script id='meta-pixel' strategy='afterInteractive'>
                        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
                    </Script>
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
                </>
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
