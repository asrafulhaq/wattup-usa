/**
 * Switchable consent-management platform (CMP) loader.
 *
 * The active vendor is chosen by env var — set exactly ONE:
 *   NEXT_PUBLIC_COOKIEYES_ID    → CookieYes (site ID from its script URL)
 *   NEXT_PUBLIC_COOKIEBOT_CBID  → Cookiebot (Domain Group ID)
 * If both are set, CookieYes wins (the default vendor).
 *
 * Whichever loads must be the first synchronous script in <head> (after the
 * Consent Mode defaults) — auto-blocking can only intercept scripts that
 * load after it.
 */

export type ActiveCmp =
    | { provider: 'cookiebot'; id: string }
    | { provider: 'cookieyes'; id: string };

export function getActiveCmp(): ActiveCmp | null {
    const cookieyesId = process.env.NEXT_PUBLIC_COOKIEYES_ID;
    const cookiebotCbid = process.env.NEXT_PUBLIC_COOKIEBOT_CBID;
    if (cookieyesId) return { provider: 'cookieyes', id: cookieyesId };
    if (cookiebotCbid) return { provider: 'cookiebot', id: cookiebotCbid };
    return null;
}

export function CmpScript() {
    const cmp = getActiveCmp();
    if (!cmp) return null;

    if (cmp.provider === 'cookiebot') {
        return (
            <script
                id='Cookiebot'
                src='https://consent.cookiebot.com/uc.js'
                data-cbid={cmp.id}
                data-blockingmode='auto'
            />
        );
    }

    // CookieYes — auto-blocking is enabled in its dashboard, not per-tag
    return (
        <script
            id='cookieyes'
            src={`https://cdn-cookieyes.com/client_data/${cmp.id}/script.js`}
        />
    );
}
