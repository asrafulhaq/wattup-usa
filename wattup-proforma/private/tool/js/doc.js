/* WattUpUSA Site Pro-Forma — document renderer (browser port of scripts/build_html.py).
   Produces the identical standalone 6-page Letter HTML document. */

function usd(n) {
  const v = Math.round(Number(n) || 0);
  const s = Math.abs(v).toLocaleString('en-US');
  return (v < 0 ? '-$' : '$') + s;
}
function n0(v) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 }); }
function pct(v, nd) { return (Number(v) * 100).toFixed(nd === undefined ? 1 : nd) + '%'; }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function docCss(dsg) {
  return `
@page { size: Letter; margin: 0; }
* { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
:root {
  --blue:${dsg.accent}; --blue-dk:${dsg.accent_dk}; --ink:${dsg.ink}; --ink2:#1A1F27;
  --slate:#5A6472; --muted:#8A94A6; --line:#E7EAF0; --bg:#FFFFFF;
  --soft:#F5F7FB; --green:${dsg.green}; --pill:#EEF3FF;
}
html,body { font-family:'Helvetica Neue',Arial,sans-serif; color:var(--ink); background:#525659; }
.page { width:8.5in; height:11in; background:var(--bg); position:relative; overflow:hidden; page-break-after:always; }
.page:last-child { page-break-after:auto; }
.pad { padding:0.62in 0.66in; }

/* ---------- COVER ---------- */
.cover { background:var(--ink); color:#fff; height:11in; position:relative; overflow:hidden; }
.cover .glow { position:absolute; width:900px; height:900px; border-radius:50%;
  background:radial-gradient(circle, rgba(59,125,255,0.28) 0%, rgba(59,125,255,0) 62%);
  top:-260px; right:-260px; }
.cover .glow2 { position:absolute; width:640px; height:640px; border-radius:50%;
  background:radial-gradient(circle, rgba(59,125,255,0.16) 0%, rgba(59,125,255,0) 66%);
  bottom:-220px; left:-200px; }
.cover-inner { position:relative; z-index:2; padding:0.7in 0.7in; height:100%; display:flex; flex-direction:column; }
.cover-logo { height:44px; }
.cover .eyebrow { margin-top:auto; font-size:11px; letter-spacing:3.2px; text-transform:uppercase; color:var(--blue); font-weight:700; }
.cover h1 { font-size:52px; line-height:1.04; font-weight:800; letter-spacing:-1.2px; margin-top:14px; }
.cover h1 .lite { color:var(--muted); font-weight:300; }
.cover .addr { margin-top:22px; font-size:17px; color:#D4DAE4; font-weight:500; }
.cover .addr .sub { color:var(--muted); font-size:14px; margin-top:3px; }
.cover .kpis { display:flex; gap:0; margin-top:40px; border-top:1px solid rgba(255,255,255,0.12); border-bottom:1px solid rgba(255,255,255,0.12); }
.cover .kpi { flex:1; padding:22px 4px 22px 0; }
.cover .kpi + .kpi { padding-left:22px; border-left:1px solid rgba(255,255,255,0.1); padding-right:0; }
.cover .kpi .v { font-size:27px; font-weight:800; letter-spacing:-0.5px; }
.cover .kpi .v .u { font-size:14px; color:var(--muted); font-weight:600; }
.cover .kpi .l { font-size:10.5px; color:var(--muted); text-transform:uppercase; letter-spacing:1.4px; margin-top:6px; }
.cover .foot { margin-top:34px; display:flex; justify-content:space-between; align-items:flex-end; }
.cover .foot .prep { font-size:12px; color:#C4CBD6; }
.cover .foot .prep b { color:#fff; }
.cover .badge { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--muted); border:1px solid rgba(255,255,255,0.2); padding:7px 12px; border-radius:40px; }

/* ---------- SHARED ---------- */
.hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:26px; }
.hdr .tag { font-size:10.5px; letter-spacing:2.6px; text-transform:uppercase; color:var(--blue); font-weight:700; }
.hdr .mk { height:22px; }
.sec-title { font-size:24px; font-weight:800; letter-spacing:-0.6px; }
.sec-sub { font-size:13px; color:var(--slate); margin-top:6px; line-height:1.5; }
.rule { height:3px; width:46px; background:var(--blue); border-radius:2px; margin:14px 0 22px; }

/* metric cards */
.grid { display:grid; gap:12px; }
.g4 { grid-template-columns:repeat(4,1fr); }
.g3 { grid-template-columns:repeat(3,1fr); }
.g2 { grid-template-columns:repeat(2,1fr); }
.card { border:1px solid var(--line); border-radius:12px; padding:16px 16px; background:var(--bg); }
.card .v { font-size:23px; font-weight:800; letter-spacing:-0.5px; }
.card .v .u { font-size:12px; color:var(--muted); font-weight:600; }
.card .l { font-size:10.5px; color:var(--slate); text-transform:uppercase; letter-spacing:1px; margin-top:7px; }
.card.blue { background:var(--blue); border-color:var(--blue); color:#fff; }
.card.blue .l { color:rgba(255,255,255,0.82); }
.card.blue .v .u { color:rgba(255,255,255,0.85); }
.card.dark { background:var(--ink); border-color:var(--ink); color:#fff; }
.card.dark .l { color:var(--muted); }
.card.dark .v .u { color:#AEB8C6; }
.card.soft { background:var(--soft); border-color:var(--soft); }

/* tables */
table { width:100%; border-collapse:collapse; font-size:12.5px; }
.tbl th { background:var(--ink); color:#fff; text-align:left; padding:9px 14px; font-size:10.5px; letter-spacing:1px; text-transform:uppercase; font-weight:700; }
.tbl th:first-child { border-radius:8px 0 0 0; }
.tbl th:last-child { border-radius:0 8px 0 0; text-align:right; }
.tbl td { padding:8px 14px; border-bottom:1px solid var(--line); }
.tbl td:last-child { text-align:right; }
.tbl tr:nth-child(even) td { background:var(--soft); }
.tbl .lbl { color:var(--slate); }
.tbl .val { font-weight:700; }

/* projection table */
.proj th, .proj td { text-align:right; padding:6px 12px; font-size:11.5px; }
.proj th:first-child, .proj td:first-child { text-align:left; }
.proj th { background:var(--ink); color:#fff; font-size:10px; letter-spacing:0.8px; text-transform:uppercase; }
.proj td { border-bottom:1px solid var(--line); }
.proj tr:nth-child(even) td { background:var(--soft); }
.proj .yr { font-weight:700; }
.proj .muted { color:var(--muted); }
.proj .pos { color:var(--green); font-weight:600; }
.proj .cum { font-weight:800; color:var(--blue-dk); }
.proj tfoot td { background:var(--ink)!important; color:#fff; font-weight:800; border:none; padding:10px 12px; }
.proj tfoot td:first-child { border-radius:0 0 0 8px; }
.proj tfoot td:last-child { border-radius:0 0 8px 0; }

/* chart */
.chartbox { border:1px solid var(--line); border-radius:14px; padding:14px 18px 6px; margin-top:4px; }
.legend { display:flex; gap:20px; margin-bottom:8px; font-size:11.5px; color:var(--slate); }
.legend .dot { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:6px; vertical-align:middle; }
.axlbl { font-size:10px; fill:var(--muted); text-anchor:middle; }

/* two column layouts */
.split { display:grid; grid-template-columns:1.15fr 1fr; gap:22px; align-items:start; }
.aerial { width:100%; max-height:2.6in; object-fit:cover; border-radius:12px; border:1px solid var(--line); display:block; }
.cap { font-size:10.5px; color:var(--muted); margin-top:8px; text-align:center; }

/* assumption list */
.alist { display:grid; grid-template-columns:1fr 1fr; gap:0 26px; }
.arow { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid var(--line); font-size:12.5px; }
.arow .k { color:var(--slate); }
.arow .v { font-weight:700; }

/* market pills */
.pills { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
.pill { display:flex; justify-content:space-between; align-items:center; border:1px solid var(--line); border-radius:10px; padding:10px 14px; }
.pill .k { font-size:11.5px; color:var(--slate); }
.pill .v { font-weight:800; font-size:15px; }
.pill .v .tag { font-size:9px; background:var(--pill); color:var(--blue-dk); padding:2px 7px; border-radius:20px; margin-left:6px; font-weight:700; letter-spacing:0.5px; vertical-align:middle; }

/* callout */
.callout { background:linear-gradient(120deg,var(--ink) 0%, #1B2230 100%); color:#fff; border-radius:14px; padding:18px 24px; position:relative; overflow:hidden; }
.callout .g { position:absolute; width:360px; height:360px; border-radius:50%; background:radial-gradient(circle,rgba(59,125,255,0.3),transparent 62%); top:-160px; right:-120px; }
.callout .lbl { font-size:10.5px; letter-spacing:2px; text-transform:uppercase; color:var(--blue); font-weight:700; position:relative; }
.callout .big { font-size:38px; font-weight:800; letter-spacing:-1px; margin-top:6px; position:relative; }
.callout .txt { font-size:12.5px; color:#C4CBD6; margin-top:8px; line-height:1.55; position:relative; max-width:92%; }

.pgnum { position:absolute; bottom:0.42in; right:0.66in; font-size:10px; color:var(--muted); letter-spacing:1px; }
.pgnum .b { color:var(--ink); font-weight:700; }
.footline { position:absolute; bottom:0.42in; left:0.66in; font-size:9.5px; color:var(--muted); letter-spacing:0.5px; }

.note { font-size:10px; color:var(--muted); line-height:1.45; margin-top:11px; }

/* opex tables */
.opex th, .opex td { text-align:right; padding:7px 12px; font-size:11.5px; }
.opex th:first-child, .opex td:first-child { text-align:left; }
.opex th { background:var(--ink); color:#fff; font-size:9.5px; letter-spacing:0.8px; text-transform:uppercase; padding:8px 12px; font-weight:700; }
.opex th:first-child { border-radius:8px 0 0 0; }
.opex th:last-child { border-radius:0 8px 0 0; }
.opex td { border-bottom:1px solid var(--line); }
.opex tr:nth-child(even) td { background:var(--soft); }
.opex .cat { font-weight:700; }
.opex .basis { font-weight:400; font-size:9.5px; color:var(--muted); margin-top:3px; line-height:1.35; }
.opex .pct { font-weight:700; color:var(--blue-dk); }
.opex tfoot td { background:var(--ink)!important; color:#fff; font-weight:800; border:none; padding:12px; font-size:12px; }
.opex tfoot td:first-child { border-radius:0 0 0 8px; }
.opex tfoot td:last-child { border-radius:0 0 8px 0; }
.sens tr.base td { background:var(--pill)!important; }
/* placement gallery */
.gal { display:grid; gap:14px; margin-top:2px; }
.gal.g-1 { grid-template-columns:1fr; }
.gal.g-2 { grid-template-columns:1fr; }
.gal.g-3 { grid-template-columns:1fr 1fr; }
.gal.g-4 { grid-template-columns:1fr 1fr; }
.gal.g-6 { grid-template-columns:1fr 1fr; }
.gal { align-items:start; }
.gal .fig { border:1px solid var(--line); border-radius:12px; background:#fff; overflow:hidden; display:flex; flex-direction:column; }
.gal .fig img { width:100%; height:auto; max-height:var(--ih,3.3in); object-fit:contain; background:var(--soft); display:block; }
.gal .fig .fc { font-size:10.5px; color:var(--slate); padding:8px 12px; border-top:1px solid var(--line); background:#fff; }
.gal .fig .fc b { color:var(--ink); font-weight:700; }
.gal .fig.wide { grid-column:1 / -1; }
.galnote { font-size:10px; color:var(--muted); line-height:1.5; margin-top:14px; }
.sens .bt { font-size:8px; background:var(--blue); color:#fff; padding:2px 6px; border-radius:20px; margin-left:7px; font-weight:700; letter-spacing:0.6px; vertical-align:middle; }
`;
}


/* ---- optional placement / rendering gallery pages ---- */
function galleryPages(images, dsg, loc, asm, A) {
  const imgs = (images || []).filter(x => x && x.src);
  if (!imgs.length) return '';
  const chunks = [];
  for (let i = 0; i < imgs.length; i += 6) chunks.push(imgs.slice(i, i + 6));

  // usable image-area height per page, in inches
  function heights(n) {
    if (n === 1) return { rows: 1, h: 6.95 };
    if (n === 2) return { rows: 2, h: 3.38 };
    if (n === 3) return { rows: 2, h: 3.38 };
    if (n === 4) return { rows: 2, h: 3.38 };
    return { rows: 3, h: 2.22 };
  }

  return chunks.map((chunk, ci) => {
    const n = chunk.length;
    const gcls = n === 5 || n === 6 ? 'g-6' : 'g-' + n;
    const H = heights(n).h;
    const figs = chunk.map((im, i) => {
      const wide = (n === 3 && i === 0) || (n === 5 && i === 0);
      const cap = (im.caption || '').trim();
      return `<figure class="fig${wide ? ' wide' : ''}" style="--ih:${H}in">
        <img src="${im.src}" alt=""/>
        ${cap ? `<figcaption class="fc">${cap}</figcaption>` : ''}
      </figure>`;
    }).join('');

    const sub = ci === 0
      ? `Proposed placement of the ${asm.chargers} dual-port cabinets (${asm.ports} ports) at ${loc.address}. Layouts are indicative and subject to final utility service design, ADA circulation review and ${loc.ahj || 'AHJ'} permitting.`
      : `Additional placement and visualization views for ${loc.address} (continued).`;

    return `
<!-- ================= PLACEMENT GALLERY ================= -->
<div class="page"><div class="pad">
  <div class="hdr"><div class="tag">03 &nbsp;/&nbsp; Site Placement</div><img class="mk" src="${A.mark_dark}"/></div>
  <div class="sec-title">${ci === 0 ? 'Charger placement &amp; site visualization' : 'Charger placement &amp; site visualization (cont.)'}</div>
  <div class="rule"></div>
  <div class="sec-sub" style="max-width:96%">${sub}</div>
  <div class="gal ${gcls}">${figs}</div>
  <div class="footline">${dsg.footer}</div>
  <div class="pgnum"><span class="b">03</span> / 06</div>
</div></div>
`;
  }).join('');
}

/* d = model output, A = { logo_type_light, mark_dark, aerial?, design? } image sources */
/* Every free-text field on this document can originate from an imported EVpin
   report, so escape it before it reaches the markup. Numbers, colors and font
   stacks pass through unchanged because escaping is a no-op on them. */
function escHtml(v) {
  // entity-aware: the model's own labels legitimately carry &amp; and &nbsp;,
  // so a bare & is escaped but an existing entity is left intact.
  return String(v)
    .replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]{1,10}|#\d{1,6}|#x[0-9a-fA-F]{1,6});)/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escDeep(v) {
  if (typeof v === 'string') return escHtml(v);
  if (Array.isArray(v)) return v.map(escDeep);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v)) o[k] = escDeep(v[k]);
    return o;
  }
  return v;
}

// only data: and blob: image sources are ever legitimate here
function safeSrc(v) {
  const t = String(v || '').trim();
  return /^(data:image\/|blob:|assets\/)/i.test(t) ? t : '';
}

function renderDoc(d, A) {
  d = escDeep(d);
  A = Object.assign({}, A);
  A.gallery = (A.gallery || [])
    .map(g => ({ src: safeSrc(g && g.src), caption: escHtml((g && g.caption) || '') }))
    .filter(g => g.src);
  for (const k of ['logo_type_light', 'mark_dark', 'aerial', 'design']) {
    if (A[k]) A[k] = safeSrc(A[k]);
  }
  const loc = d.location, asm = d.assumptions, ops = d.operations_y1;
  const he = d.host_economics, comp = d.competitive, av = d.avoidance;
  const proj = d.projection, mkt = d.market, opx = d.opex;
  const dsg = Object.assign({}, DESIGN_DEFAULTS, d.design || {});
  const prep = d.prepared || {};

  const today = new Date();
  const _by = prep.by || '';
  const _email = prep.email || '';
  const _date = prep.date || (MONTHS[today.getMonth()] + ' ' + today.getDate() + ', ' + today.getFullYear());
  const _gen = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();
  const has_aerial = !!(A && A.aerial);
  const has_design = !!(A && A.design);
  const _gal = galleryPages((A && A.gallery) || [], dsg, loc, asm, A);

  // Build 10-year projection rows
  let proj_rows = '';
  proj.years.forEach((yr, i) => {
    proj_rows += `<tr>
      <td class="yr">Year ${yr}</td>
      <td>${usd(proj.host_rev[i])}</td>
      <td class="muted">${usd(proj.flat_lease_annual[i])}</td>
      <td class="pos">+${usd(proj.host_rev[i] - proj.flat_lease_annual[i])}</td>
      <td class="cum">${usd(proj.cum_host[i])}</td>
    </tr>`;
  });

  // Chart geometry for cumulative revenue area chart
  const cum_host = proj.cum_host, cum_flat = proj.cum_flat;
  const maxv = cum_host[cum_host.length - 1] || 1;
  const W = 720, H = 300;
  const padL = 8, padR = 8, padT = 12, padB = 28;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = cum_host.length;
  const X = i => padL + (plotW * i) / (n - 1);
  const Y = v => padT + plotH * (1 - v / maxv);
  const host_pts = cum_host.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
  const flat_pts = cum_flat.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
  const host_area = `${padL},${padT + plotH} ` + host_pts + ` ${padL + plotW},${padT + plotH}`;
  const xlabels = proj.years.map((yy, i) =>
    `<text x="${X(i).toFixed(1)}" y="${H - 8}" class="axlbl">${yy}</text>`).join('');
  const gridlines = [0, 0.25, 0.5, 0.75, 1].map(t =>
    `<line x1="${padL}" y1="${padT + plotH * (1 - t)}" x2="${W - padR}" y2="${padT + plotH * (1 - t)}" stroke="#EEF1F6" stroke-width="1"/>`).join('');
  const dots = cum_host.map((v, i) =>
    `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3.4" fill="${dsg.accent}"/>`).join('');

  // Revenue bridge (Y1 monthly) bars
  const bars = [
    ['Gross Charging Rev', ops.gross_rev_month, dsg.accent],
    ['Electricity Cost', -ops.elec_cost_month, '#1A1A1A'],
    ['Processing Fees', -ops.proc_cost_month, '#8A94A6'],
    ['Network / O&amp;M / Ins.', -(ops.fixed_opex_month || 0), '#B7BFCC'],
    ['Net Charging Revenue', ops.net_charging_rev_month !== undefined ? ops.net_charging_rev_month : ops.net_margin_month, '#22C55E']
  ];
  const NB = bars.length, BSLOT = 720.0 / NB, BW = BSLOT - 26;
  const gmax = ops.gross_rev_month || 1;
  const barsSvg = bars.map((b, i) => {
    const lbl = b[0], v = b[1], col = b[2];
    const h = Math.max((Math.min(Math.abs(v), gmax) / gmax) * 150, 3);
    const bx = i * BSLOT + 13;
    return `
      <rect x="${bx.toFixed(1)}" y="${(170 - h).toFixed(1)}" width="${BW.toFixed(1)}" height="${h.toFixed(1)}" rx="5" fill="${col}"/>
      <text x="${(bx + BW / 2).toFixed(1)}" y="${(160 - h).toFixed(1)}" text-anchor="middle" font-size="11.5" font-weight="800" fill="#0E1116">${v < 0 ? '-' : ''}$${n0(Math.abs(v))}</text>
      <text x="${(bx + BW / 2).toFixed(1)}" y="188" text-anchor="middle" font-size="9.5" fill="#5A6472">${lbl}</text>`;
  }).join('');

  // ---- Operating-cost page tables ----
  let opex_rows = '', opex_total_row = '', opex_sens_rows = '';
  opx.lines.forEach(ln => {
    opex_rows += `<tr>
      <td class="cat">${ln.label}<div class="basis">${ln.basis}</div></td>
      <td>${usd(ln.annual)}</td>
      <td>${usd(ln.monthly)}</td>
      <td>$${ln.per_kwh.toFixed(4)}</td>
      <td class="pct">${pct(ln.pct_gross)}</td>
    </tr>`;
  });
  opex_total_row = `<tr><td>Total Permitted Operating Costs</td>
      <td>${usd(opx.total_annual)}</td><td>${usd(opx.total_month)}</td>
      <td>$${opx.per_kwh.toFixed(4)}</td><td>${pct(opx.pct_gross)}</td></tr>`;
  opx.sensitivity.forEach(s => {
    const mark = s.is_base ? ' class="base"' : '';
    const tag = s.is_base ? ' <span class="bt">BASE CASE</span>' : '';
    opex_sens_rows += `<tr${mark}>
      <td class="yr">${pct(s.util, 0)} utilization${tag}</td>
      <td>${n0(s.kwh_month)}</td>
      <td>${usd(s.gross_month)}</td>
      <td>$${s.per_kwh.toFixed(4)}</td>
      <td>${pct(s.pct_gross)}</td>
      <td class="cum">${usd(s.host_month)}</td>
    </tr>`;
  });

  const aerialBlock = has_aerial
    ? `<img class="aerial" src="${A.aerial}"/><div class="cap">${loc.address}, ${loc.city} — site aerial</div>`
    : '';
  const designBlock = has_design
    ? `<img class="aerial" style="margin-top:14px; max-height:1.45in; object-fit:cover" src="${A.design}"/><div class="cap">${dsg.design_caption} — ${asm.chargers} dual-port chargers, ${asm.ports} ports</div>`
    : '';

  let _html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>WattUpUSA Pro-Forma — ${loc.address}</title>
<style>${docCss(dsg)}</style></head>
<body>

<!-- ================= COVER ================= -->
<div class="page cover">
  <div class="glow"></div><div class="glow2"></div>
  <div class="cover-inner">
    <img class="cover-logo" src="${A.logo_type_light}" alt="WattUpUSA"/>
    <div class="eyebrow">${dsg.eyebrow}</div>
    <h1>${dsg.title1}<br><span class="lite">${dsg.title2}</span></h1>
    <div class="addr">${loc.address}
      <div class="sub">${loc.city} &nbsp;·&nbsp; ${loc.county}</div>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="v">${usd(he.ten_yr_total)}</div><div class="l">10-Yr Host Revenue</div></div>
      <div class="kpi"><div class="v">${usd(he.mrr_y1)}<span class="u">/mo</span></div><div class="l">Year 1 MRR</div></div>
      <div class="kpi"><div class="v">${asm.chargers}<span class="u"> × ${asm.ports_per_charger}</span></div><div class="l">Dual-Port Chargers · ${asm.ports} Ports</div></div>
    </div>

    <div class="foot">
      <div class="prep">Prepared by <b>WattUpUSA</b> &nbsp;·&nbsp; ${_by}<br>${_email} &nbsp;·&nbsp; ${_date}</div>
      <div class="badge">${dsg.badge}</div>
    </div>
  </div>
</div>

<!-- ================= PAGE 2 — EXEC SUMMARY ================= -->
<div class="page"><div class="pad">
  <div class="hdr"><div class="tag">01 &nbsp;/&nbsp; Executive Summary</div><img class="mk" src="${A.mark_dark}"/></div>
  <div class="sec-title">A high-demand DCFC site in the heart of ${loc.county}</div>
  <div class="rule"></div>
  <div class="sec-sub" style="max-width:96%">This pro-forma models a ${asm.chargers}-charger (${asm.ports}-port) DC fast-charging deployment at ${loc.address} under WattUpUSA's turnkey revenue-share structure. WattUpUSA funds, installs, owns and operates the equipment — the host contributes the site and shares in the upside with zero capital outlay.</div>

  <div class="grid g4" style="margin-top:24px">
    <div class="card blue"><div class="v">${usd(he.ten_yr_total)}</div><div class="l">10-Year Host Revenue</div></div>
    <div class="card"><div class="v">${usd(he.annual_y1)}</div><div class="l">Year 1 Annual Revenue</div></div>
    <div class="card"><div class="v">${usd(he.per_charger_month)}<span class="u">/mo</span></div><div class="l">Per-Charger Income</div></div>
    <div class="card dark"><div class="v">+${usd(comp.ten_yr_advantage)}</div><div class="l">vs. Flat Lease (10-Yr)</div></div>
  </div>

  <div class="grid g3" style="margin-top:12px">
    <div class="card soft"><div class="v">${usd(av.capex)}</div><div class="l">Host CapEx Avoided</div></div>
    <div class="card soft"><div class="v">${usd(av.opex_annual)}<span class="u">/yr</span></div><div class="l">Host OpEx Avoided</div></div>
    <div class="card soft"><div class="v">${mkt.util_score}</div><div class="l">Site Utilization Score · ${mkt.util_rank}</div></div>
  </div>

  <div class="callout" style="margin-top:22px">
    <div class="g"></div>
    <div class="lbl">The Bottom Line</div>
    <div class="big">${usd(comp.annual_diff)} more per year</div>
    <div class="txt">Under WattUpUSA's revenue share, the host earns ${usd(comp.wattup_month)}/month versus roughly ${usd(comp.flat_lease_month)}/month under a conventional flat ground lease — an incremental ${usd(comp.annual_diff)} annually and ${usd(comp.ten_yr_advantage)} over the 10-year horizon, with no capital, operating, or maintenance burden on the host.</div>
  </div>

  <div class="split" style="margin-top:24px; grid-template-columns:${has_aerial ? '1.15fr 1fr' : '1fr'}">
    <div>
      <div style="font-size:13px; font-weight:800; margin-bottom:10px;">Why this site works</div>
      <div class="alist" style="grid-template-columns:${has_aerial ? '1fr' : '1fr 1fr'}">
        <div class="arow"><span class="k">EV adoption (${loc.county})</span><span class="v">${mkt.ev_adoption} · ${mkt.ev_adoption_yoy}</span></div>
        <div class="arow"><span class="k">Annual avg. daily traffic</span><span class="v">${mkt.aadt} vehicles</span></div>
        <div class="arow"><span class="k">Amenities within 10-min walk</span><span class="v">${mkt.amenities}</span></div>
        <div class="arow"><span class="k">Distance from highway exit</span><span class="v">${mkt.hwy_dist}</span></div>
      </div>
    </div>
    <div>
      ${aerialBlock}
    </div>
  </div>

  <div class="footline">${dsg.footer}</div>
  <div class="pgnum"><span class="b">02</span> / 06</div>
</div></div>

<!-- ================= PAGE 3 — ASSUMPTIONS & UNIT ECONOMICS ================= -->
<div class="page"><div class="pad">
  <div class="hdr"><div class="tag">02 &nbsp;/&nbsp; Operating Assumptions</div><img class="mk" src="${A.mark_dark}"/></div>
  <div class="sec-title">Inputs &amp; unit economics</div>
  <div class="rule"></div>

  <div class="split" style="grid-template-columns:1fr 1fr; margin-top:4px">
    <div>
      <div style="font-size:13px; font-weight:800; margin-bottom:12px;">Deployment assumptions</div>
      <div class="alist" style="grid-template-columns:1fr">
        <div class="arow"><span class="k">Number of chargers (dual-port)</span><span class="v">${asm.chargers} units</span></div>
        <div class="arow"><span class="k">Total charging ports</span><span class="v">${asm.ports} ports</span></div>
        <div class="arow"><span class="k">Rated power per charger</span><span class="v">${asm.charger_power_kw} kW</span></div>
        <div class="arow"><span class="k">Battery capacity per unit</span><span class="v">${n0(asm.battery_kwh_per_unit)} kWh</span></div>
        <div class="arow"><span class="k">CapEx per charger</span><span class="v">${usd(asm.capex_per_charger)}</span></div>
        <div class="arow"><span class="k">Total project CapEx</span><span class="v">${usd(asm.capex_total)}</span></div>
        <div class="arow"><span class="k">Utilization rate</span><span class="v">${pct(asm.utilization, 0)}</span></div>
        <div class="arow"><span class="k">Charging price</span><span class="v">$${asm.price_kwh.toFixed(2)}/kWh</span></div>
        <div class="arow"><span class="k">Grid / energy cost</span><span class="v">$${asm.grid_cost_kwh.toFixed(2)}/kWh</span></div>
        <div class="arow"><span class="k">Payment processing fee</span><span class="v">${pct(asm.proc_fee)}</span></div>
        <div class="arow"><span class="k">Host revenue share</span><span class="v">${pct(asm.host_share, 0)}</span></div>
        <div class="arow"><span class="k">Operating hours</span><span class="v">${asm.hours}</span></div>
      </div>
    </div>
    <div>
      <div style="font-size:13px; font-weight:800; margin-bottom:12px;">Modeled throughput (Year 1)</div>
      <div class="grid g2">
        <div class="card"><div class="v">${n0(ops.modeled_kwh_month)}</div><div class="l">kWh / month</div></div>
        <div class="card"><div class="v">${n0(ops.modeled_kwh_year)}</div><div class="l">kWh / year</div></div>
        <div class="card"><div class="v">${n0(ops.visits_month)}</div><div class="l">Charging visits / mo</div></div>
        <div class="card"><div class="v">${n0(ops.visits_year)}</div><div class="l">Charging visits / yr</div></div>
      </div>
      <div class="note" style="margin-top:14px">Throughput derived from ${asm.chargers} dual-port chargers (${asm.ports} ports) at ${asm.charger_power_kw} kW per cabinet and ${pct(asm.utilization, 0)} utilization, averaging ${asm.kwh_per_visit} kWh per session across 24/7 operation. Each cabinet carries ${n0(asm.battery_kwh_per_unit)} kWh of on-board storage (${n0(asm.battery_kwh_total)} kWh site-wide), buffering peak draw; its demand-charge benefit is already priced into the blended energy cost.</div>
      ${designBlock}
    </div>
  </div>

  <div style="font-size:13px; font-weight:800; margin:26px 0 12px;">Monthly gross-to-net bridge (Year 1)</div>
  <div class="chartbox" style="padding:20px">
    <svg viewBox="0 0 720 210" width="100%">${barsSvg}</svg>
  </div>
  <div class="note" style="margin-bottom:0.3in">Gross charging revenue reflects total driver-paid energy at $${asm.price_kwh.toFixed(2)}/kWh. Net Charging Revenue is shown after all six categories of Permitted Operating Costs — energy at $${asm.grid_cost_kwh.toFixed(2)}/kWh blended, ${pct(asm.proc_fee)} payment processing, and network, O&amp;M and insurance — each itemized on the following page. The host revenue share of ${usd(he.mrr_y1)}/month in Year 1 is calculated on Net Charging Revenue, with no host exposure to any of these costs.</div>

  <div class="footline">${dsg.footer}</div>
  <div class="pgnum"><span class="b">03</span> / 06</div>
</div></div>

${_gal}

<!-- ================= PAGE 4 — OPERATING COST STRUCTURE ================= -->
<div class="page"><div class="pad">
  <div class="hdr"><div class="tag">03 &nbsp;/&nbsp; Operating Cost Structure</div><img class="mk" src="${A.mark_dark}"/></div>
  <div class="sec-title">Permitted Operating Costs</div>
  <div class="rule"></div>
  <div class="sec-sub" style="max-width:97%">Net Charging Revenue is Gross Charging Revenue less the six defined categories of Permitted Operating Costs — and only those categories. WattUpUSA corporate overhead, salaries, legal, consulting, marketing, financing costs, debt service, depreciation and income taxes are expressly excluded and are never charged against the host share.</div>

  <div class="grid g3" style="margin-top:18px">
    <div class="card blue"><div class="v">$${opx.per_kwh.toFixed(2)}<span class="u">/kWh</span></div><div class="l">Average Operating Cost</div></div>
    <div class="card dark"><div class="v">${(opx.pct_gross * 100).toFixed(0)}<span class="u">% of gross</span></div><div class="l">Operating Cost Ratio</div></div>
    <div class="card soft"><div class="v">${usd(opx.total_annual)}<span class="u">/yr</span></div><div class="l">Year 1 Operating Costs</div></div>
  </div>

  <table class="opex" style="margin-top:16px">
    <thead><tr><th>Permitted Operating Cost category &amp; basis</th><th>Annual</th><th>Monthly</th><th>$/kWh</th><th>% of gross</th></tr></thead>
    <tbody>${opex_rows}</tbody>
    <tfoot>${opex_total_row}</tfoot>
  </table>

  <div style="font-size:13px; font-weight:800; margin:18px 0 9px;">Operating cost ratio across utilization scenarios</div>
  <table class="opex sens">
    <thead><tr><th>Scenario</th><th>kWh / mo</th><th>Gross rev / mo</th><th>OpEx $/kWh</th><th>% of gross</th><th>Host share / mo</th></tr></thead>
    <tbody>${opex_sens_rows}</tbody>
  </table>

  <div class="note" style="font-size:9.5px; margin-top:10px">Fixed operating costs (network, O&amp;M, insurance) total ${usd(opx.fixed_annual)}/year and do not vary with throughput, which is why the operating cost ratio holds within a narrow band even at materially lower utilization. Benchmarks: U.S. DOE Alternative Fuels Data Center (routine maintenance up to $400/charger/yr; DCFC extended warranties above $800/charger/yr per the California Energy Commission) · afdc.energy.gov/fuels/electricity-infrastructure-maintenance-and-operation. NREL/TP-5400-91021 (2024), which identifies the demand charge as the largest single driver of station economics · docs.nrel.gov/docs/fy24osti/91021.pdf. Charging-management software at $122–$465 per DC port/yr · ASTSBC schedule TRA25-03, Oct 2025.</div>

  <div class="footline">${dsg.footer}</div>
  <div class="pgnum"><span class="b">04</span> / 06</div>
</div></div>

<!-- ================= PAGE 5 — 10-YEAR PROJECTION ================= -->
<div class="page"><div class="pad">
  <div class="hdr"><div class="tag">04 &nbsp;/&nbsp; 10-Year Projection</div><img class="mk" src="${A.mark_dark}"/></div>
  <div class="sec-title">Host revenue vs. flat ground lease</div>
  <div class="rule"></div>
  <div class="sec-sub" style="max-width:96%">Cumulative host revenue under the WattUpUSA revenue-share model compared to a conventional flat lease of ${usd(comp.flat_lease_month)}/month over the 10-year term.</div>

  <div class="chartbox" style="margin-top:18px">
    <div class="legend">
      <span><span class="dot" style="background:var(--blue)"></span>WattUpUSA revenue share (cumulative)</span>
      <span><span class="dot" style="background:#8A94A6"></span>Flat ground lease (cumulative)</span>
    </div>
    <svg viewBox="0 0 ${W} ${H}" width="100%">
      <defs>
        <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${dsg.accent}" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="${dsg.accent}" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      ${gridlines}
      <polygon points="${host_area}" fill="url(#ga)"/>
      <polyline points="${flat_pts}" fill="none" stroke="#8A94A6" stroke-width="2.5" stroke-dasharray="5,4"/>
      <polyline points="${host_pts}" fill="none" stroke="${dsg.accent}" stroke-width="3.2"/>
      ${dots}
      ${xlabels}
    </svg>
  </div>

  <table class="proj" style="margin-top:20px">
    <thead><tr><th>Period</th><th>WattUp Host Rev</th><th>Flat Lease</th><th>Advantage</th><th>Cumulative</th></tr></thead>
    <tbody>${proj_rows}</tbody>
    <tfoot><tr><td>10-Year Total</td><td>${usd(proj.host_rev.reduce((a, b) => a + b, 0))}</td><td>${usd(proj.flat_lease_annual.reduce((a, b) => a + b, 0))}</td><td>+${usd(comp.ten_yr_advantage)}</td><td>${usd(proj.cum_host[proj.cum_host.length - 1])}</td></tr></tfoot>
  </table>
  <div class="note" style="margin-bottom:0.3in">Host revenue share escalates ${pct(asm.escalation, 0)} annually, reflecting a corresponding ${pct(asm.escalation, 0)} year-over-year rise in energy and charging rates; the flat ground lease is held constant. No utilization ramp or network expansion is assumed. Actual results scale with EV adoption, which is growing ${mkt.ev_adoption_yoy} in ${loc.county}.</div>

  <div class="footline">${dsg.footer}</div>
  <div class="pgnum"><span class="b">05</span> / 06</div>
</div></div>

<!-- ================= PAGE 6 — MARKET & DEAL STRUCTURE ================= -->
<div class="page"><div class="pad">
  <div class="hdr"><div class="tag">05 &nbsp;/&nbsp; Market Intelligence</div><img class="mk" src="${A.mark_dark}"/></div>
  <div class="sec-title">Location &amp; demand fundamentals</div>
  <div class="rule"></div>

  <div class="pills" style="margin-top:4px">
    <div class="pill"><span class="k">Site utilization score</span><span class="v">${mkt.util_score} <span class="tag">${mkt.util_rank}</span></span></div>
    <div class="pill"><span class="k">EV adoption · county</span><span class="v">${mkt.ev_adoption} <span class="tag">${mkt.ev_adoption_yoy}</span></span></div>
    <div class="pill"><span class="k">Registered EVs · county</span><span class="v">${mkt.county_ev_total}</span></div>
    <div class="pill"><span class="k">Projected EVs · 2027</span><span class="v">${mkt.county_ev_proj_2027} <span class="tag">${mkt.county_ev_proj_growth}</span></span></div>
    <div class="pill"><span class="k">Annual avg daily traffic</span><span class="v">${mkt.aadt}</span></div>
    <div class="pill"><span class="k">L3 ports within 10 mi</span><span class="v">${mkt.l3_ports_10mi}</span></div>
    <div class="pill"><span class="k">Entry-EV purchasing power</span><span class="v">${mkt.purchasing_power}</span></div>
    <div class="pill"><span class="k">Population density</span><span class="v">${mkt.pop_density}</span></div>
  </div>

  <div class="grid" style="grid-template-columns:1fr 1fr; margin-top:18px">
    <div class="card soft"><div class="v">${loc.utility}</div><div class="l">Serving Utility</div></div>
    <div class="card soft"><div class="v">${loc.ahj}</div><div class="l">Permitting Jurisdiction (AHJ)</div></div>
  </div>

  <div style="font-size:13px; font-weight:800; margin:26px 0 12px;">The WattUpUSA structure</div>
  <table class="tbl">
    <thead><tr><th>Host provides</th><th>WattUpUSA delivers</th></tr></thead>
    <tbody>
      <tr><td class="lbl">Site / parking real estate</td><td class="val">Full capital funding of equipment</td></tr>
      <tr><td class="lbl">Utility access &amp; basic coordination</td><td class="val">Turnkey installation &amp; permitting</td></tr>
      <tr><td class="lbl">Long-term site agreement</td><td class="val">Ownership, O&amp;M, warranty &amp; network</td></tr>
      <tr><td class="lbl">Zero capital contribution</td><td class="val">Monthly revenue share to host</td></tr>
    </tbody>
  </table>

  <div class="callout" style="margin-top:22px">
    <div class="g"></div>
    <div class="lbl">Net-Net for the Host</div>
    <div class="big">${usd(he.ten_yr_total)} over 10 years</div>
    <div class="txt">${usd(av.capex)} in capital expenditure avoided, ${usd(av.opex_annual)}/year in operating costs avoided, and a growing revenue stream tied to one of the strongest EV-demand corridors in ${loc.county} — all with no capital risk to the host.</div>
  </div>

  <div class="note">Figures are modeled projections based on WattUpUSA's standard revenue-share assumptions and EVpin.com site intelligence for ${loc.address} (generated ${_gen}). Actual performance will vary with utilization, energy pricing, and EV adoption. This document is confidential and prepared for evaluation purposes only. Source: WattUpUSA ROI model; EVpin.com; Experian Automotive.</div>

  <div class="footline">${dsg.footer} · ${_date}</div>
  <div class="pgnum"><span class="b">06</span> / 06</div>
</div></div>

</body></html>`;

  // ---- auto page numbering: the gallery may add pages, so renumber everything ----
  const _pgCount = (_html.match(/<div class="pgnum">/g) || []).length;
  const _total = _pgCount + 1;   // + cover
  let _pi = 1;
  const _pad = v => String(v).padStart(2, '0');
  _html = _html.replace(/<div class="pgnum"><span class="b">\d+<\/span> \/ \d+<\/div>/g, () => {
    _pi += 1;
    return `<div class="pgnum"><span class="b">${_pad(_pi)}</span> / ${_pad(_total)}</div>`;
  });
  let _ti = 0;
  _html = _html.replace(/(<div class="tag">)\d+(\s*&nbsp;)/g, (m, a, b) => {
    _ti += 1;
    return a + _pad(_ti) + b;
  });
  return _html;
}
