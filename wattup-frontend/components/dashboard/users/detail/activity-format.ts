import {
    isPermission,
    isRole,
    PERMISSION_LABELS,
    ROLE_LABELS,
    type Permission,
    type Role,
} from '@/lib/permissions';

/**
 * Turning one activity_log row into something a person can read (checklist 4c.6).
 *
 * Pure and client safe, so the table and a test both read the same rules. Both apps
 * write to that table and neither validates the other's `meta`, so everything here
 * treats a row as data of unknown shape: a missing key, a null, a number where a
 * string was expected and an event this build has never heard of all have to render as
 * something, and never as "null" or as raw JSON.
 */

const DASH = '—';

/** For an IP address, a user agent, or anything else a row may simply not carry. */
export function orDash(value: unknown): string {
    if (typeof value !== 'string') return DASH;
    const trimmed = value.trim();
    return trimmed === '' ? DASH : trimmed;
}

// ─── App ──────────────────────────────────────────────────────────────────────

const APP_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    proforma: 'Pro-forma',
};

export function appLabel(app: string): string {
    return APP_LABELS[app] ?? titleCase(app);
}

/** Tailwind classes per app, so the two are told apart at a glance. */
export function appBadgeClasses(app: string): string {
    return app === 'proforma'
        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
        : 'bg-slate-100 text-slate-600 border border-slate-200';
}

// ─── Event ────────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
    // Pro-forma's gate.
    'signin.success': 'Signed in',
    'signin.failed': 'Sign-in refused',
    'code.requested': 'Sign-in code sent',
    'code.refused': 'Sign-in code refused',
    // The dashboard.
    'permission.granted': 'Permission granted',
    'permission.revoked': 'Permission revoked',
    'role.changed': 'Role changed',
    'role_permission.changed': 'Role default changed',
    'user.banned': 'Banned',
    'user.unbanned': 'Ban lifted',
    'user.created': 'Account created',
    'user.deleted': 'Account deleted',
    'settings.updated': 'Site settings updated',
};

/**
 * A readable name for an event. An event this build does not know is title-cased
 * rather than hidden: the other app deploys separately and may write one first.
 */
export function eventLabel(event: string): string {
    return EVENT_LABELS[event] ?? titleCase(event.replace(/[._]/g, ' '));
}

/** Refusals and bans read differently from the rest, so the row can carry a tone. */
export function eventTone(event: string): 'neutral' | 'good' | 'bad' {
    if (event === 'signin.success') return 'good';
    if (
        event === 'signin.failed' ||
        event === 'code.refused' ||
        event === 'user.banned' ||
        event === 'user.deleted' ||
        event === 'permission.revoked'
    ) {
        return 'bad';
    }
    return 'neutral';
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

/** Why the gate said no, in words. Both apps' reason vocabularies, in one place. */
const REASON_LABELS: Record<string, string> = {
    rate_limited_ip: 'too many requests from that address',
    rate_limited_email: 'too many codes for that address',
    not_member: 'no pro-forma access',
    banned: 'the account is banned',
    send_failed: 'the email could not be sent',
    invalid_code: 'wrong code',
    expired: 'the code had expired',
    attempts_exhausted: 'too many attempts on one code',
    unknown: 'reason not recorded',
};

function reasonLabel(value: unknown): string | null {
    if (typeof value !== 'string' || value.trim() === '') return null;
    return REASON_LABELS[value] ?? value.replace(/_/g, ' ');
}

function roleLabel(value: unknown): string | null {
    if (typeof value !== 'string' || value.trim() === '') return null;
    return isRole(value) ? ROLE_LABELS[value as Role] : value;
}

function permissionLabel(value: unknown): string | null {
    if (typeof value !== 'string' || value.trim() === '') return null;
    return isPermission(value) ? PERMISSION_LABELS[value as Permission] : value;
}

function titleCase(value: string): string {
    const trimmed = value.trim();
    if (trimmed === '') return '';
    return trimmed[0].toUpperCase() + trimmed.slice(1);
}

/** "headScripts" and "site_name" both become "Head scripts" and "Site name". */
function humaniseKey(key: string): string {
    return titleCase(
        key
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/[._-]+/g, ' ')
            .toLowerCase()
    );
}

/** At most three items named, then a count, so one long list cannot own the row. */
function shortList(values: readonly string[]): string {
    if (values.length <= 3) return values.join(', ');
    return `${values.slice(0, 3).join(', ')} and ${values.length - 3} more`;
}

function scalar(value: unknown): string | null {
    if (typeof value === 'string') return value.trim() === '' ? null : value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        const items = value.map(scalar).filter((item): item is string => item !== null);
        return items.length === 0 ? null : shortList(items);
    }
    return null;
}

/**
 * A one-line summary of a row's `meta`, or null when there is nothing worth saying.
 *
 * The events this app and pro-forma write have known shapes and get a sentence each.
 * Anything else falls through to "key: value" pairs, which is still readable and still
 * not JSON; an object nested inside meta is skipped rather than stringified, because
 * "[object Object]" in an audit trail is worse than a shorter line.
 */
export function summariseMeta(event: string, meta: unknown): string | null {
    if (meta === null || typeof meta !== 'object' || Array.isArray(meta)) return null;
    const bag = meta as Record<string, unknown>;

    switch (event) {
        case 'role.changed': {
            const from = roleLabel(bag.from);
            const to = roleLabel(bag.to);
            if (from && to) return `${from} to ${to}`;
            return to ? `to ${to}` : null;
        }
        case 'permission.granted':
        case 'permission.revoked': {
            const permission = permissionLabel(bag.permission);
            return permission ? `"${permission}"` : null;
        }
        case 'role_permission.changed': {
            const permission = permissionLabel(bag.permission);
            const role = roleLabel(bag.role);
            if (permission && role) return `"${permission}" for ${role}`;
            return permission ?? role;
        }
        case 'user.created':
        case 'user.deleted': {
            const role = roleLabel(bag.role);
            return role ? `as ${role}` : null;
        }
        case 'user.banned': {
            const reason = scalar(bag.reason);
            return reason ? `reason: ${reason}` : null;
        }
        case 'settings.updated': {
            const fields = Array.isArray(bag.fields)
                ? bag.fields.filter((field): field is string => typeof field === 'string')
                : [];
            if (fields.length === 0) return null;
            const named = shortList(fields.map(humaniseKey));
            return `${fields.length} ${fields.length === 1 ? 'field' : 'fields'}: ${named}`;
        }
        case 'signin.failed':
        case 'code.refused': {
            const reason = reasonLabel(bag.reason);
            const detail = scalar(bag.limit) ?? scalar(bag.code);
            if (reason && detail) return `${reason} (${detail})`;
            return reason;
        }
        default:
            break;
    }

    const parts: string[] = [];
    for (const [key, value] of Object.entries(bag)) {
        const rendered = scalar(value);
        if (rendered !== null) parts.push(`${humaniseKey(key)}: ${rendered}`);
    }
    return parts.length === 0 ? null : shortList(parts);
}

/**
 * Who the row is about, from this page's point of view: the user is the subject of the
 * event, the one who carried it out, or both.
 */
export function activityRole(
    row: { userId: string | null; actorUserId: string | null },
    userId: string
): 'subject' | 'actor' | 'both' {
    const isSubject = row.userId === userId;
    const isActor = row.actorUserId === userId;
    if (isSubject && isActor) return 'both';
    return isActor ? 'actor' : 'subject';
}
