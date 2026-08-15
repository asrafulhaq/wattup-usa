'use client';

declare global {
    interface Window {
        Cookiebot?: { renew: () => void };
        revisitCkyConsent?: () => void;
    }
}

/**
 * CCPA/CPRA opt-out link — reopens the consent dialog of whichever CMP is
 * active (Cookiebot or CookieYes). Renders nothing until a CMP is configured.
 */
export function DoNotSellLink({ className }: { className?: string }) {
    // literal env references so Next.js inlines them into the client bundle
    const enabled = Boolean(
        process.env.NEXT_PUBLIC_COOKIEBOT_CBID ||
            process.env.NEXT_PUBLIC_COOKIEYES_ID
    );
    if (!enabled) return null;

    // CookieYes binds clicks on .cky-banner-element itself once banner.js
    // loads; the onClick is a fallback for Cookiebot (and late loads).
    const openPreferences = () => {
        if (window.revisitCkyConsent) window.revisitCkyConsent();
        else if (window.Cookiebot) window.Cookiebot.renew();
    };

    // NOTE: Coalition's "Missing Do Not Sell Link" scan text-matches the
    // phrase "Do Not Sell ... My Personal Information" on the homepage —
    // this shorter label will not satisfy that check.
    return (
        <button
            type='button'
            onClick={openPreferences}
            className={`cky-banner-element ${className ?? ''}`}>
            Manage Cookies
        </button>
    );
}
