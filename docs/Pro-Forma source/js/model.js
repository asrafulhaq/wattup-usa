/* WattUpUSA Site Pro-Forma — financial model (browser port of scripts/model.py).
   Kept line-for-line faithful to the Python model so the calculator and the
   command-line pipeline always produce identical numbers. */

// ----- Reference anchors (WattUp ROI report standard — do not change) -----
const REF_CHARGERS = 16;
const REF_UTIL = 0.25;
const REF_KWH_MONTH = 1164800;   // kWh/mo at reference
const REF_HOST_MRR = 32702;      // $/mo host revenue-share at reference
const HOURS_MONTH = (24 * 365) / 12;  // 730

// The rated power implied by the original reference anchors (~398.9 kW). Kept
// only so the legacy reference-scaling path stays comparable; rated power is
// now an input, because it is a hardware choice that changes per deployment.
const REF_POWER_KW = REF_KWH_MONTH / (REF_CHARGERS * HOURS_MONTH * REF_UTIL);

// Python's round() is round-half-to-even. Match it exactly so the browser and
// the Python pipeline never disagree by a dollar.
function pyround(v, nd) {
  if (!isFinite(v)) return 0;
  const f = Math.pow(10, nd || 0);
  const x = v * f;
  const fl = Math.floor(x);
  const diff = x - fl;
  let r;
  if (diff === 0.5) {
    // Exact tie: round half to even, like Python.
    r = (fl % 2 === 0) ? fl : fl + 1;
  } else {
    // Not a tie. A tolerance window here would wrongly capture values that sit
    // a hair above .5 (e.g. 192.50000000000003), which Python rounds up.
    r = Math.round(x);
  }
  return r / f;
}

const DESIGN_DEFAULTS = {
  accent: '#3B7DFF',
  accent_dk: '#2C63D9',
  ink: '#0E1116',
  green: '#16A34A',
  eyebrow: 'Site Pro-Forma &nbsp;\u2022&nbsp; DC Fast-Charging',
  title1: 'Revenue',
  title2: 'Pro-Forma',
  badge: 'Confidential',
  footer: 'WattUpUSA \u00b7 Confidential Pro-Forma',
  design_caption: 'To-scale site design'
};

const DEFAULT_MARKET = {
  util_score: '4.4/5', util_rank: 'HIGH',
  ev_adoption: '9.02%', ev_adoption_yoy: '+15% YoY',
  aadt: '42,549', amenities: '20+',
  l3_ports_10mi: 945, l3_stations_10mi: 111, hwy_dist: '2.3 mi',
  county_ev_total: '269,260', county_ev_proj_2027: '382,150',
  county_ev_proj_growth: '+42%', purchasing_power: '39%',
  pop_density: '1,527/km\u00b2'
};

const DEFAULT_INPUTS = {
  location: { address: '', city: '', county: '', utility: '', ahj: '' },
  prepared_by: 'Akshay Patel',
  prepared_email: 'akshay@wattupusa.com',
  prepared_date: '',
  chargers: 16,
  ports_per_charger: 2,
  charger_power_kw: 310,
  battery_kwh_per_unit: 215,
  utilization: 0.25,
  capex_per_charger: 652000,
  escalation: 0.04,
  price_kwh: 0.55,
  grid_cost_kwh: 0.25,
  proc_fee: 0.035,
  host_share: 0.10,
  kwh_per_visit: 50.0,
  opex_avoid_annual: 128000,
  flat_lease_month: 11200,
  net_sw_port_yr: 500,
  om_charger_yr: 3000,
  ins_charger_yr: 2200,
  txn_tax_rate: 0.0,
  full_opex_deduction: true,
  opex_sens_utils: [0.25, 0.20, 0.15, 0.10],
  design: {},
  market: {}
};

function fmt(n, nd) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: nd === undefined ? 0 : nd,
    maximumFractionDigits: nd === undefined ? 0 : nd
  });
}

function buildModel(INP) {
  const g = (k, dflt) => (INP[k] === undefined || INP[k] === null || INP[k] === '' ? dflt : INP[k]);

  const loc_in = Object.assign({ address: '', city: '', county: '', utility: '', ahj: '' }, INP.location || {});
  const chargers = Number(g('chargers', 16));
  const ports_per_charger = Number(g('ports_per_charger', 2));
  const ports = chargers * ports_per_charger;
  const power_kw = Number(g('charger_power_kw', 310));
  const battery_kwh_unit = Number(g('battery_kwh_per_unit', 215));
  const util = Number(g('utilization', 0.25));
  const capex_per_charger = Number(g('capex_per_charger', 652000));
  const escalation = Number(g('escalation', 0.04));
  const price = Number(g('price_kwh', 0.55));
  const grid_cost = Number(g('grid_cost_kwh', 0.25));
  const proc_fee = Number(g('proc_fee', 0.035));
  const host_share = Number(g('host_share', 0.10));
  const kwh_per_visit = Number(g('kwh_per_visit', 50.0));
  const opex_avoid_annual = Number(g('opex_avoid_annual', 128000));
  const flat_lease_month = Number(g('flat_lease_month', 11200));
  const prepared_by = g('prepared_by', 'Akshay Patel');
  const prepared_email = g('prepared_email', 'akshay@wattupusa.com');
  const prepared_date = INP.prepared_date || '';

  // ----- Permitted Operating Cost inputs (lease Section 5.1(b) categories) -----
  const net_sw_port_yr = Number(g('net_sw_port_yr', 500));
  const om_charger_yr = Number(g('om_charger_yr', 3000));
  const ins_charger_yr = Number(g('ins_charger_yr', 2200));
  const txn_tax_rate = Number(g('txn_tax_rate', 0.0));
  const full_opex_deduction = g('full_opex_deduction', true);
  const opex_sens_utils = g('opex_sens_utils', [0.25, 0.20, 0.15, 0.10]);

  const design = Object.assign({}, DESIGN_DEFAULTS, INP.design || {});

  // ----- Hardware & throughput -----
  // Rated power is an input. Throughput is charger count x rated power x hours
  // x utilization, so changing the cabinet spec flows through every figure in
  // the document: gross revenue, the six operating-cost lines, the host share
  // and the 10-year projection.
  const P = power_kw;
  const battery_kwh_total = chargers * battery_kwh_unit;
  const modeled_kwh_month = chargers * P * HOURS_MONTH * util;
  const modeled_kwh_year = modeled_kwh_month * 12;
  const visits_month = pyround(modeled_kwh_month / kwh_per_visit);
  const visits_year = visits_month * 12;

  // ----- Year-1 revenue economics -----
  const gross_rev_month = modeled_kwh_month * price;
  const elec_cost_month = modeled_kwh_month * grid_cost;
  const proc_cost_month = gross_rev_month * proc_fee;
  const net_margin_month = gross_rev_month - elec_cost_month - proc_cost_month;

  // ----- Full six-category Permitted Operating Cost stack (Year 1) -----
  const net_sw_month = (net_sw_port_yr * ports) / 12.0;
  const om_month = (om_charger_yr * chargers) / 12.0;
  const ins_month = (ins_charger_yr * chargers) / 12.0;
  const txn_tax_month = gross_rev_month * txn_tax_rate;
  const fixed_opex_month = net_sw_month + om_month + ins_month;
  const total_opex_month = elec_cost_month + proc_cost_month + fixed_opex_month + txn_tax_month;
  const net_charging_rev_month = gross_rev_month - total_opex_month;
  const opex_per_kwh = modeled_kwh_month ? total_opex_month / modeled_kwh_month : 0;
  const opex_pct_gross = gross_rev_month ? total_opex_month / gross_rev_month : 0;

  const line = (label, basis, monthly) => ({
    label, basis,
    monthly: pyround(monthly),
    annual: pyround(monthly * 12),
    per_kwh: modeled_kwh_month ? pyround(monthly / modeled_kwh_month, 4) : 0,
    pct_gross: gross_rev_month ? pyround(monthly / gross_rev_month, 4) : 0
  });

  const opex_lines = [
    line('(i) Electricity, demand &amp; delivery charges',
      '$' + grid_cost.toFixed(2) + '/kWh blended, incl. demand &amp; subscription charges', elec_cost_month),
    line('(ii) Payment &amp; transaction processing',
      (proc_fee * 100).toFixed(1) + '% of gross charging revenue', proc_cost_month),
    line('(iii) Network, software &amp; connectivity',
      '$' + fmt(net_sw_port_yr) + ' per port / year (' + ports + ' ports)', net_sw_month),
    line('(iv) Operations, maintenance &amp; repairs',
      '$' + fmt(om_charger_yr) + ' per charger / year (' + chargers + ' units)', om_month),
    line('(v) Insurance on the EV charging facilities',
      '$' + fmt(ins_charger_yr) + ' per charger / year', ins_month),
    line('(vi) Transaction-based sales / use / excise tax',
      txn_tax_rate === 0 ? 'Pass-through; not applicable to CA kWh sales today'
        : (txn_tax_rate * 100).toFixed(2) + '% of gross charging revenue', txn_tax_month)
  ];

  // Utilization sensitivity on the operating-cost ratio (max 4 rows)
  const seen = {};
  (opex_sens_utils || []).concat([util]).forEach(x => { seen[pyround(Number(x), 4)] = true; });
  let cands = Object.keys(seen).map(Number).sort((a, b) => b - a);
  while (cands.length > 4) {
    const others = cands.filter(u => Math.abs(u - util) > 1e-9);
    let drop = others[0];
    others.forEach(u => { if (Math.abs(u - util) < Math.abs(drop - util)) drop = u; });
    cands = cands.filter(u => u !== drop);
  }
  const sens = cands.map(u => {
    const k = chargers * P * HOURS_MONTH * u;
    const gr = k * price;
    const tot = k * grid_cost + gr * proc_fee + fixed_opex_month + gr * txn_tax_rate;
    return {
      util: u, kwh_month: pyround(k), gross_month: pyround(gr),
      opex_month: pyround(tot),
      per_kwh: k ? pyround(tot / k, 4) : 0,
      pct_gross: gr ? pyround(tot / gr, 4) : 0,
      host_month: pyround((gr - tot) * host_share),
      is_base: Math.abs(u - util) < 1e-9
    };
  });

  // ----- Host revenue-share -----
  const scale = (chargers / REF_CHARGERS) * (util / REF_UTIL) * (P / REF_POWER_KW);
  const host_mrr_y1 = full_opex_deduction
    ? pyround(net_charging_rev_month * host_share)
    : pyround(REF_HOST_MRR * scale);
  const host_annual_y1 = pyround(host_mrr_y1 * 12);
  const per_charger_month = chargers ? pyround(host_mrr_y1 / chargers) : 0;

  // ----- 10-year projection with compounding escalation on host share -----
  const years = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const host_rev = years.map(y => pyround(host_annual_y1 * Math.pow(1 + escalation, y - 1)));
  const cum_host = []; let c = 0;
  host_rev.forEach(r => { c += r; cum_host.push(c); });
  const ten_yr_host_total = host_rev.reduce((a, b) => a + b, 0);

  // ----- Competitive: flat ground lease (held constant) -----
  const flat_lease_annual = flat_lease_month * 12;
  const flat_lease_rev = years.map(() => flat_lease_annual);
  const cum_flat = []; c = 0;
  flat_lease_rev.forEach(r => { c += r; cum_flat.push(c); });
  const annual_diff = host_annual_y1 - flat_lease_annual;
  const ten_yr_advantage = ten_yr_host_total - flat_lease_rev.reduce((a, b) => a + b, 0);

  const capex_avoid = capex_per_charger * chargers;
  const market = Object.assign({}, DEFAULT_MARKET, INP.market || {});

  return {
    location: {
      address: loc_in.address, city: loc_in.city, utility: loc_in.utility,
      ahj: loc_in.ahj, county: loc_in.county
    },
    prepared: { by: prepared_by, email: prepared_email, date: prepared_date },
    assumptions: {
      chargers, ports, ports_per_charger, escalation,
      charger_power_kw: pyround(P, 1),
      battery_kwh_per_unit: pyround(battery_kwh_unit, 1),
      battery_kwh_total: pyround(battery_kwh_total, 1),
      site_power_kw: pyround(chargers * P, 1),
      utilization: util, price_kwh: price, grid_cost_kwh: grid_cost,
      proc_fee, host_share, hours: '24/7/365',
      kwh_per_visit: pyround(kwh_per_visit, 1),
      capex_per_charger, capex_total: capex_per_charger * chargers
    },
    operations_y1: {
      modeled_kwh_month: pyround(modeled_kwh_month),
      modeled_kwh_year: pyround(modeled_kwh_year),
      visits_month, visits_year,
      gross_rev_month: pyround(gross_rev_month),
      elec_cost_month: pyround(elec_cost_month),
      proc_cost_month: pyround(proc_cost_month),
      net_margin_month: pyround(net_margin_month),
      fixed_opex_month: pyround(fixed_opex_month),
      total_opex_month: pyround(total_opex_month),
      net_charging_rev_month: pyround(net_charging_rev_month)
    },
    opex: {
      lines: opex_lines,
      total_month: pyround(total_opex_month),
      total_annual: pyround(total_opex_month * 12),
      per_kwh: pyround(opex_per_kwh, 4),
      pct_gross: pyround(opex_pct_gross, 4),
      fixed_month: pyround(fixed_opex_month),
      fixed_annual: pyround(fixed_opex_month * 12),
      sensitivity: sens
    },
    host_economics: {
      mrr_y1: host_mrr_y1, annual_y1: host_annual_y1,
      per_charger_month, ten_yr_total: ten_yr_host_total
    },
    competitive: {
      flat_lease_month, flat_lease_annual,
      wattup_month: host_mrr_y1, wattup_annual: host_annual_y1,
      annual_diff, ten_yr_advantage
    },
    avoidance: { capex: capex_avoid, opex_annual: opex_avoid_annual },
    projection: { years, host_rev, cum_host, flat_lease_annual: flat_lease_rev, cum_flat },
    market,
    design
  };
}
