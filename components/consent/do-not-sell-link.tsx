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

    const openPreferences = () => {
        if (window.revisitCkyConsent) window.revisitCkyConsent();
        else if (window.Cookiebot) window.Cookiebot.renew();
    };

    return (
        <button type='button' onClick={openPreferences} className={className}>
            Do Not Sell or Share My Personal Information
        </button>
    );
}
