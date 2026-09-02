import { statusLabelFor } from '@/lib/locations/public';
import type { StationStatus } from '@/lib/locations/types';

/**
 * How a build state is drawn in the dashboard.
 *
 * The wording comes from lib/locations/public so the dashboard says exactly what a
 * visitor sees. Only the colour is decided here, because only the dashboard has one.
 */

export const STATUS_ORDER: StationStatus[] = ['LIVE', 'UNDER_CONSTRUCTION', 'PLANNED'];

export const STATUS_CLASSES: Record<StationStatus, string> = {
    LIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    UNDER_CONSTRUCTION: 'bg-amber-50 text-amber-700 border-amber-200',
    PLANNED: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const STATUS_OPTIONS = STATUS_ORDER.map(status => ({
    value: status,
    label: statusLabelFor(status),
}));

export { statusLabelFor };
