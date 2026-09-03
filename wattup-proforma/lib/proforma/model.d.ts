/**
 * Types for the ported engine in model.js.
 *
 * Hand written, because model.js is vendor source that must not be edited and
 * carries no annotations of its own. If the two ever disagree, model.js is right
 * and this file is the defect: it describes the engine, it does not constrain it.
 */

export interface ProformaLocation {
    address: string;
    city: string;
    county: string;
    utility: string;
    ahj: string;
}

/** Cover and header styling. Every key is optional; the engine fills its own defaults. */
export interface ProformaDesign {
    accent?: string;
    accent_dk?: string;
    ink?: string;
    green?: string;
    eyebrow?: string;
    title1?: string;
    title2?: string;
    badge?: string;
    footer?: string;
    design_caption?: string;
}

/** Every market figure is free text, because it is transcribed off an EVpin report. */
export interface ProformaMarket {
    util_score?: string;
    util_rank?: string;
    ev_adoption?: string;
    ev_adoption_yoy?: string;
    aadt?: string;
    amenities?: string;
    l3_ports_10mi?: string | number;
    l3_stations_10mi?: string | number;
    hwy_dist?: string;
    county_ev_total?: string;
    county_ev_proj_2027?: string;
    county_ev_proj_growth?: string;
    purchasing_power?: string;
    pop_density?: string;
}

/**
 * What the form collects. Numbers are stored in their natural unit, so a 20%
 * utilization is 0.2 here and the field displays 20: the `scale` on the field
 * definition is what bridges the two.
 */
export interface ProformaInputs {
    location: ProformaLocation;
    prepared_by: string;
    prepared_email: string;
    prepared_date: string;
    validity_days: number;
    chargers: number;
    ports_per_charger: number;
    charger_power_kw: number;
    battery_kwh_per_unit: number;
    utilization: number;
    capex_per_charger: number;
    escalation: number;
    price_kwh: number;
    grid_cost_kwh: number;
    proc_fee: number;
    host_share: number;
    kwh_per_visit: number;
    opex_avoid_annual: number;
    flat_lease_month: number;
    net_sw_port_yr: number;
    om_charger_yr: number;
    ins_charger_yr: number;
    txn_tax_rate: number;
    /** true bills the host share off Net Charging Revenue; false is the legacy scaling. */
    full_opex_deduction: boolean;
    opex_sens_utils: number[];
    design: ProformaDesign;
    market: ProformaMarket;
    [key: string]: unknown;
}

export interface ProformaOpexLine {
    [key: string]: unknown;
}

export interface ProformaModel {
    location: ProformaLocation;
    prepared: {
        by: string;
        email: string;
        date: string;
        validity_days: number;
        issued: string;
        /** Empty when validity_days is 0, which is what leaves the cover line off. */
        expires: string;
    };
    assumptions: Record<string, number | string>;
    operations_y1: Record<string, number>;
    opex: {
        lines: ProformaOpexLine[];
        total_month: number;
        total_annual: number;
        per_kwh: number;
        pct_gross: number;
        fixed_month: number;
        fixed_annual: number;
        sensitivity: unknown[];
    };
    host_economics: {
        mrr_y1: number;
        annual_y1: number;
        per_charger_month: number;
        ten_yr_total: number;
    };
    competitive: {
        flat_lease_month: number;
        flat_lease_annual: number;
        wattup_month: number;
        wattup_annual: number;
        annual_diff: number;
        ten_yr_advantage: number;
    };
    avoidance: { capex: number; opex_annual: number };
    projection: {
        years: number[];
        host_rev: number[];
        cum_host: number[];
        flat_lease_annual: number[];
        cum_flat: number[];
    };
    market: ProformaMarket;
    design: Required<ProformaDesign>;
}

export declare const DEFAULT_INPUTS: ProformaInputs;
export declare const DESIGN_DEFAULTS: Required<ProformaDesign>;
export declare const DEFAULT_MARKET: ProformaMarket;
export declare function buildModel(inputs: ProformaInputs): ProformaModel;
export declare function fmt(n: number, nd?: number): string;
export declare function pyround(v: number, nd: number): number;
