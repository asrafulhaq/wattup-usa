/**
 * The control panel's field definitions.
 *
 * The SECTIONS array below is COPIED VERBATIM out of private/tool/js/app.js, not
 * retyped, so that every note, hint, label, placeholder, unit, step and default
 * reaches the React panel exactly as the static tool had it. Nothing here is
 * presentation: the notes are the explanations the sales team relies on, and
 * tests/proforma/sections-parity.test.ts re-parses app.js and fails if the two
 * ever drift apart.
 */

/** A field's editor. Each maps to one component under components/builder/fields/. */
export type FieldType =
    | 'text'
    | 'number'
    | 'select'
    | 'color'
    | 'pctlist'
    | 'image'
    | 'gallery'
    | 'evpin';

export interface FieldOption {
    /** Serialised value. 'true' and 'false' become real booleans on change. */
    v: string;
    l: string;
}

export interface Field {
    /** Dot path into the inputs object, or a '_'-prefixed pseudo key for images. */
    k: string;
    label: string;
    type: FieldType;
    /** Placeholder. */
    ph?: string;
    /** Explanatory line under the control. */
    hint?: string;
    /** Renders at half width, pairing with the next half field. */
    half?: boolean;
    unit?: string;
    step?: number;
    min?: number;
    /** Display multiplier: 100 shows a stored 0.2 as 20. */
    scale?: number;
    options?: FieldOption[];
    /** Which image slot an 'image' field writes. */
    slot?: 'cover' | 'aerial' | 'design';
}

export interface Section {
    id: string;
    /** The badge number shown in the accordion header. */
    n: string;
    title: string;
    /** Trusted HTML authored in this repo, never user input. */
    note?: string;
    fields: Field[];
}

/**
 * The paragraph above the sections. Verbatim from renderForm() in app.js.
 */
export const RAIL_INTRO_HTML =
    '<b>Fill the left rail, watch the document build on the right.</b> ' +
    'Every figure \u2014 throughput, the six Permitted Operating Cost lines, the host share, the ' +
    '10-year projection and both charts \u2014 recalculates as you type. When it looks right, hit ' +
    '<b>Save as PDF</b> and send it to the host. Nothing leaves this browser \u2014 use ' +
    "<b>Export JSON</b> to keep a site's inputs and reload them later.";

/** Sections 0, 1 and 2 stand open on first load, as they always have. */
export const DEFAULT_OPEN_SECTIONS = 3;

export const SECTIONS: Section[] = [
  {
    id: 'evpin', n: '0', title: 'Import from EVpin',
    note: 'Paste a shareable EVpin report link and the calculator fills the location, market and demand fields for you. If the report sits behind a login the link cannot be read \u2014 open it, select all, and paste the text into the second box instead. Anything the report does not state is left alone.',
    fields: [{ k: '_evpin', label: '', type: 'evpin' }]
  },
  {
    id: 'loc', n: '1', title: 'Location',
    note: 'Straight off the EVpin site report. The address, city and county print on the cover and drive the narrative copy throughout.',
    fields: [
      { k: 'location.address', label: 'Street address', type: 'text', ph: '8052 Talbert Avenue' },
      { k: 'location.city', label: 'City, state ZIP', type: 'text', ph: 'Huntington Beach, CA 92646' },
      { k: 'location.county', label: 'County', type: 'text', ph: 'Orange County' },
      { k: 'location.utility', label: 'Serving utility', type: 'text', ph: 'Southern California Edison', half: true },
      { k: 'location.ahj', label: 'Permitting AHJ', type: 'text', ph: 'City of Huntington Beach', half: true }
    ]
  },
  {
    id: 'hw', n: '2', title: 'Charger hardware',
    note: 'The equipment specification, set by hand per site. Rated power drives throughput directly \u2014 charger count \u00d7 rated power \u00d7 730 hours \u00d7 utilization \u2014 so changing it moves gross revenue, every operating-cost line, the host share and the 10-year projection. Battery capacity is the on-board buffer per cabinet; it prints on the assumptions page and sizes the site\u2019s total storage.',
    fields: [
      { k: 'charger_power_kw', label: 'Rated power per charger', type: 'number', step: 5, min: 1, unit: 'kW', half: true,
        hint: 'Nameplate output per cabinet. Default 310 kW.' },
      { k: 'battery_kwh_per_unit', label: 'Battery capacity per unit', type: 'number', step: 5, min: 0, unit: 'kWh', half: true,
        hint: 'On-board storage per cabinet. Default 215 kWh.' }
    ]
  },
  {
    id: 'deal', n: '3', title: 'Deployment & deal terms',
    note: 'Charger count and utilization drive throughput against the rated power set in the hardware section above.',
    fields: [
      { k: 'chargers', label: 'Chargers', type: 'number', step: 1, min: 1, unit: 'units', half: true },
      { k: 'ports_per_charger', label: 'Ports per charger', type: 'number', step: 1, min: 1, unit: 'ports', half: true },
      { k: 'utilization', label: 'Utilization rate', type: 'number', scale: 100, step: 0.5, unit: '%', half: true },
      { k: 'kwh_per_visit', label: 'kWh per session', type: 'number', step: 1, unit: 'kWh', half: true },
      { k: 'price_kwh', label: 'Charging price', type: 'number', step: 0.01, unit: '$/kWh', half: true },
      { k: 'host_share', label: 'Host revenue share', type: 'number', scale: 100, step: 0.5, unit: '%', half: true },
      { k: 'capex_per_charger', label: 'CapEx per charger', type: 'number', step: 1000, unit: '$', half: true },
      { k: 'escalation', label: 'Annual escalation', type: 'number', scale: 100, step: 0.5, unit: '%', half: true },
      { k: 'flat_lease_month', label: 'Flat-lease benchmark', type: 'number', step: 100, unit: '$/mo', half: true },
      { k: 'opex_avoid_annual', label: 'Host OpEx avoided', type: 'number', step: 1000, unit: '$/yr', half: true }
    ]
  },
  {
    id: 'opex', n: '4', title: 'Permitted operating costs',
    note: 'The six categories under lease <b>Section 5.1(b)</b>. Net Charging Revenue is gross less these and only these — corporate overhead, legal, marketing, financing and taxes stay excluded.',
    fields: [
      { k: 'grid_cost_kwh', label: '(i) Electricity, blended', type: 'number', step: 0.01, unit: '$/kWh', half: true },
      { k: 'proc_fee', label: '(ii) Payment processing', type: 'number', scale: 100, step: 0.1, unit: '%', half: true },
      { k: 'net_sw_port_yr', label: '(iii) Network & software', type: 'number', step: 25, unit: '$/port/yr', half: true },
      { k: 'om_charger_yr', label: '(iv) O&M and repairs', type: 'number', step: 100, unit: '$/chgr/yr', half: true },
      { k: 'ins_charger_yr', label: '(v) Insurance', type: 'number', step: 100, unit: '$/chgr/yr', half: true },
      { k: 'txn_tax_rate', label: '(vi) Transaction tax', type: 'number', scale: 100, step: 0.05, unit: '%', half: true },
      {
        k: 'full_opex_deduction', label: 'Host share basis', type: 'select', options: [
          { v: 'true', l: 'Net Charging Revenue (all six costs)' },
          { v: 'false', l: 'Legacy reference scaling' }
        ]
      },
      { k: 'opex_sens_utils', label: 'Sensitivity scenarios', type: 'pctlist', hint: 'Comma-separated utilization rates. The base case is always included; the table prints the four most distinct rows.' }
    ]
  },
  {
    id: 'img', n: '5', title: 'Site imagery',
    note: 'All optional. The cover ships with a WattUpUSA station photograph; add one here to use this site instead. The aerial sits on the executive summary and the to-scale layout on the operating-assumptions page.',
    fields: [
      { k: '_img_cover', label: 'Cover photograph (replaces the default)', type: 'image', slot: 'cover' },
      { k: '_img_aerial', label: 'Site aerial (executive summary)', type: 'image', slot: 'aerial' },
      { k: '_img_design', label: 'To-scale site design (operating assumptions)', type: 'image', slot: 'design' },
      { k: '_gallery', label: 'Charger placement & renderings', type: 'gallery',
        hint: 'Added as their own Site Placement page after the operating assumptions, six per page, auto-laid-out and auto-numbered. The rest of the document is untouched.' }
    ]
  },
  {
    id: 'mkt', n: '6', title: 'Market intelligence',
    note: 'Copy these from the EVpin report. Blank fields fall back to the reference-site values — overwrite anything you cannot verify.',
    fields: [
      { k: 'market.util_score', label: 'Utilization score', type: 'text', ph: '4.4/5', half: true },
      { k: 'market.util_rank', label: 'Rank label', type: 'text', ph: 'HIGH', half: true },
      { k: 'market.ev_adoption', label: 'EV adoption', type: 'text', ph: '9.02%', half: true },
      { k: 'market.ev_adoption_yoy', label: 'Adoption YoY', type: 'text', ph: '+15% YoY', half: true },
      { k: 'market.aadt', label: 'Avg daily traffic', type: 'text', ph: '42,549', half: true },
      { k: 'market.amenities', label: 'Amenities (10-min)', type: 'text', ph: '20+', half: true },
      { k: 'market.hwy_dist', label: 'Highway distance', type: 'text', ph: '2.3 mi', half: true },
      { k: 'market.l3_ports_10mi', label: 'L3 ports · 10 mi', type: 'text', ph: '945', half: true },
      { k: 'market.county_ev_total', label: 'County EVs today', type: 'text', ph: '269,260', half: true },
      { k: 'market.county_ev_proj_2027', label: 'County EVs 2027', type: 'text', ph: '382,150', half: true },
      { k: 'market.county_ev_proj_growth', label: 'Projected growth', type: 'text', ph: '+42%', half: true },
      { k: 'market.purchasing_power', label: 'EV purchasing power', type: 'text', ph: '39%', half: true },
      { k: 'market.pop_density', label: 'Population density', type: 'text', ph: '1,527/km²', half: true }
    ]
  },
  {
    id: 'prep', n: '7', title: 'Preparer, validity & branding',
    note: 'The validity window prints on the cover as <b>Valid through</b>, so the deal points cannot be read as open-ended. Set it to 0 to leave the line off.',
    fields: [
      { k: 'validity_days', label: 'Proposal valid for', type: 'number', unit: 'days', step: 1, min: 0, half: true },
      { k: 'prepared_by', label: 'Prepared by', type: 'text', half: true },
      { k: 'prepared_email', label: 'Email', type: 'text', half: true },
      { k: 'prepared_date', label: 'Date on document', type: 'text', ph: 'blank = today', half: true },
      { k: 'design.badge', label: 'Confidentiality badge', type: 'text', ph: 'Confidential', half: true },
      { k: 'design.title1', label: 'Cover title, line 1', type: 'text', ph: 'Revenue', half: true },
      { k: 'design.title2', label: 'Cover title, line 2', type: 'text', ph: 'Pro-Forma', half: true },
      { k: 'design.accent', label: 'Accent colour', type: 'color', half: true },
      { k: 'design.ink', label: 'Cover / header ink', type: 'color', half: true },
      { k: 'design.footer', label: 'Footer line', type: 'text', ph: 'WattUpUSA · Confidential Pro-Forma' },
      { k: 'design.design_caption', label: 'Layout image caption', type: 'text', ph: 'To-scale site design' }
    ]
  }
];
