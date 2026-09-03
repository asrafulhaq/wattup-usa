/* WattUpUSA Pro-Forma Builder — app shell: form, live preview, export. */

const LS_KEY = 'wattup_proforma_scenarios_v1';
const LS_LAST = 'wattup_proforma_last_v1';

let INPUTS = deepClone(DEFAULT_INPUTS);
let IMAGES = { cover: null, aerial: null, design: null };   // data URLs
let GALLERY = [];                               // [{ src, caption }]
let EVPIN = { status: '', detail: '' };
let ASSETS = {};                                // logo data URLs
let MODEL = null;
let DOC_HTML = '';
let zoom = 0.62;

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

/* ---------------- field definitions ---------------- */
const SECTIONS = [
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
    id: 'prep', n: '7', title: 'Preparer & branding',
    fields: [
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

/* ---------------- path helpers ---------------- */
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), obj);
}
function setPath(obj, path, val) {
  const parts = path.split('.');
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof o[parts[i]] !== 'object' || o[parts[i]] === null) o[parts[i]] = {};
    o = o[parts[i]];
  }
  o[parts[parts.length - 1]] = val;
}

/* ---------------- form rendering ---------------- */
function fieldHtml(f) {
  const id = 'f_' + f.k.replace(/\./g, '_');
  const cls = 'f' + (f.half ? ' half' : '');
  let ctrl = '';
  const raw = getPath(INPUTS, f.k);

  if (f.type === 'evpin') {
    ctrl = `<div class="evpin">
      <div class="unit"><input type="text" id="evpinUrl" placeholder="https://evpin.com/report/…"></div>
      <button class="btn sm" id="evpinGo" style="width:100%; margin-top:8px">Import from link</button>
      <div class="orline"><span>or paste the report text</span></div>
      <textarea id="evpinText" rows="3" placeholder="Select all on the EVpin report page and paste here"></textarea>
      <button class="btn sm" id="evpinGoText" style="width:100%; margin-top:8px">Read pasted text</button>
      <div class="evstat ${EVPIN.status}" ${EVPIN.detail ? '' : 'hidden'}>${EVPIN.detail}</div>
    </div>`;
  } else if (f.type === 'gallery') {
    const rows = GALLERY.map((g, i) => `<div class="grow" data-i="${i}">
      <img src="${g.src}"/>
      <div class="gmeta">
        <input type="text" class="gcap" data-i="${i}" value="${String(g.caption || '').replace(/"/g, '&quot;')}"
               placeholder="Caption (optional) — e.g. North drive aisle, 8 cabinets">
        <div class="gbtns">
          <button class="gb" data-move="up" data-i="${i}" title="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="gb" data-move="down" data-i="${i}" title="Move down" ${i === GALLERY.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="gb del" data-del="${i}" title="Remove">✕</button>
        </div>
      </div>
    </div>`).join('');
    ctrl = `<div class="gallery">
      ${rows}
      <div class="drop" id="galDrop">Click or drop images — placement plans, renderings, elevations</div>
      <input type="file" accept="image/*" multiple class="hide" id="galFile">
      ${GALLERY.length ? `<div class="gcount">${GALLERY.length} image${GALLERY.length > 1 ? 's' : ''} · ${Math.ceil(GALLERY.length / 6)} added page${GALLERY.length > 6 ? 's' : ''}</div>` : ''}
    </div>`;
  } else if (f.type === 'image') {
    const src = IMAGES[f.slot];
    ctrl = `<div class="drop${src ? ' has' : ''}" data-slot="${f.slot}" id="${id}">
      ${src ? `<img src="${src}"/><span class="clr" data-clear="${f.slot}">remove</span>`
        : 'Click or drop an image'}
    </div><input type="file" accept="image/*" class="hide" data-file="${f.slot}">`;
  } else if (f.type === 'select') {
    const cur = String(raw);
    ctrl = `<select id="${id}" data-k="${f.k}" data-type="select">` +
      f.options.map(o => `<option value="${o.v}"${o.v === cur ? ' selected' : ''}>${o.l}</option>`).join('') +
      `</select>`;
  } else if (f.type === 'color') {
    ctrl = `<input type="color" id="${id}" data-k="${f.k}" data-type="color" value="${raw || '#3B7DFF'}">`;
  } else if (f.type === 'pctlist') {
    const v = (raw || []).map(x => (Number(x) * 100)).join(', ');
    ctrl = `<input type="text" id="${id}" data-k="${f.k}" data-type="pctlist" value="${v}" placeholder="25, 20, 15, 10">`;
  } else if (f.type === 'number') {
    const shown = raw === undefined || raw === null || raw === ''
      ? '' : (f.scale ? +(Number(raw) * f.scale).toFixed(4) : raw);
    ctrl = `<div class="unit"><input type="number" id="${id}" data-k="${f.k}" data-type="number"
      ${f.scale ? `data-scale="${f.scale}"` : ''} ${f.step ? `step="${f.step}"` : ''}
      ${f.min !== undefined ? `min="${f.min}"` : ''} value="${shown}">
      ${f.unit ? `<span class="u">${f.unit}</span>` : ''}</div>`;
  } else {
    ctrl = `<input type="text" id="${id}" data-k="${f.k}" data-type="text"
      value="${String(raw === undefined || raw === null ? '' : raw).replace(/"/g, '&quot;')}"
      placeholder="${f.ph || ''}">`;
  }

  return `<div class="${cls}"><label for="${id}">${f.label}</label>${ctrl}
    ${f.hint ? `<div class="hint">${f.hint}</div>` : ''}</div>`;
}

function renderForm() {
  const rail = document.getElementById('rail');
  const scrollTop = rail.scrollTop;
  const openState = [...rail.querySelectorAll('details.sec')].map(d => d.open);
  const intro = `<div class="intro">
    <b>Fill the left rail, watch the document build on the right.</b>
    Every figure — throughput, the six Permitted Operating Cost lines, the host share, the
    10-year projection and both charts — recalculates as you type. When it looks right, hit
    <b>Save as PDF</b> and send it to the host. Nothing leaves this browser — use
    <b>Export JSON</b> to keep a site's inputs and reload them later.
  </div>`;
  rail.innerHTML = intro + SECTIONS.map((s, si) => {
    // pack half-width fields into rows
    let out = '', i = 0;
    while (i < s.fields.length) {
      const f = s.fields[i];
      if (f.half && s.fields[i + 1] && s.fields[i + 1].half) {
        out += `<div class="row">${fieldHtml(f)}${fieldHtml(s.fields[i + 1])}</div>`;
        i += 2;
      } else {
        out += fieldHtml(f);
        i += 1;
      }
    }
    return `<details class="sec"${si <= 2 ? ' open' : ''}>
      <summary><span class="n">${s.n}</span>${s.title}<span class="chev"></span></summary>
      <div class="body">
        ${s.note ? `<div class="note-box">${s.note}</div>` : ''}
        ${out}
      </div>
    </details>`;
  }).join('');

  if (openState.length) {
    rail.querySelectorAll('details.sec').forEach((d, i) => { if (openState[i] !== undefined) d.open = openState[i]; });
    rail.scrollTop = scrollTop;
  }

  rail.querySelectorAll('input[data-k], select[data-k]').forEach(el => {
    const ev = (el.dataset.type === 'color' || el.tagName === 'SELECT') ? 'change' : 'input';
    el.addEventListener(ev, onFieldChange);
  });
  wireEvpin(rail);
  wireGallery(rail);

  rail.querySelectorAll('.drop[data-slot]').forEach(d => {
    const slot = d.dataset.slot;
    const fileInput = rail.querySelector(`input[data-file="${slot}"]`);
    d.addEventListener('click', e => {
      if (e.target.dataset.clear) { IMAGES[slot] = null; renderForm(); recompute(); return; }
      fileInput.click();
    });
    d.addEventListener('dragover', e => { e.preventDefault(); d.classList.add('over'); });
    d.addEventListener('dragleave', () => d.classList.remove('over'));
    d.addEventListener('drop', e => {
      e.preventDefault(); d.classList.remove('over');
      if (e.dataTransfer.files[0]) loadImage(slot, e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', e => {
      if (e.target.files[0]) loadImage(slot, e.target.files[0]);
    });
  });
}

/* ---------- EVpin import ---------- */

function evpinSet(status, detail) { EVPIN = { status, detail }; }

function applyEvpin(parsed) {
  const filled = [];
  const put = (path, val, label) => {
    if (val === undefined || val === null || val === '') return;
    setPath(INPUTS, path, val);
    filled.push(label + ' \u2192 ' + val);
  };
  for (const [k, v] of Object.entries(parsed.location || {})) put('location.' + k, v, k.replace(/_/g, ' '));
  for (const [k, v] of Object.entries(parsed.market || {})) put('market.' + k, v, k.replace(/_/g, ' '));
  if (parsed.deal) {
    if (parsed.deal.utilization) put('deal.utilization', parsed.deal.utilization, 'utilization');
    if (parsed.deal.price_kwh) put('deal.price_kwh', parsed.deal.price_kwh, 'retail price');
  }
  return filled;
}

async function runEvpin(mode, rail) {
  const urlEl = rail.querySelector('#evpinUrl');
  const txtEl = rail.querySelector('#evpinText');
  let text = '';
  try {
    if (mode === 'url') {
      const u = (urlEl.value || '').trim();
      if (!u) { evpinSet('warn', 'Paste the EVpin report link first.'); renderForm(); return; }
      evpinSet('busy', 'Reading the report\u2026');
      renderForm();
      const got = await evpinFetchText(u);
      text = got.text;
    } else {
      text = (txtEl.value || '').trim();
      if (text.length < 60) { evpinSet('warn', 'Paste more of the report \u2014 that is too short to read.'); renderForm(); return; }
    }
  } catch (e) {
    evpinSet('warn', e.message + '. Open the report, select all, and paste the text below instead.');
    renderForm();
    return;
  }

  const parsed = parseEvpin(text);
  const filled = applyEvpin(parsed);
  if (!filled.length) {
    evpinSet('warn', 'Nothing recognisable in that report. Paste the full report text and try again, or fill the fields by hand.');
  } else {
    evpinSet('ok', 'Filled ' + filled.length + ' field' + (filled.length > 1 ? 's' : '') + ': ' + filled.join(' \u00b7 '));
  }
  renderForm();
  recompute();
  if (filled.length) toast('EVpin report imported \u2014 ' + filled.length + ' fields filled');
}

function wireEvpin(rail) {
  const go = rail.querySelector('#evpinGo');
  const goT = rail.querySelector('#evpinGoText');
  if (go) go.addEventListener('click', () => runEvpin('url', rail));
  if (goT) goT.addEventListener('click', () => runEvpin('text', rail));
  const u = rail.querySelector('#evpinUrl');
  if (u) u.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); runEvpin('url', rail); } });
}

/* ---------- placement gallery ---------- */

function addGalleryFiles(files) {
  const list = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (!list.length) return;
  let pending = list.length;
  list.forEach(f => {
    const r = new FileReader();
    r.onload = () => {
      GALLERY.push({ src: r.result, caption: '' });
      if (--pending === 0) { renderForm(); recompute(); }
    };
    r.onerror = () => { if (--pending === 0) { renderForm(); recompute(); } };
    r.readAsDataURL(f);
  });
}

function wireGallery(rail) {
  const drop = rail.querySelector('#galDrop');
  const file = rail.querySelector('#galFile');
  if (drop && file) {
    drop.addEventListener('click', () => file.click());
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('over');
      addGalleryFiles(e.dataTransfer.files);
    });
    file.addEventListener('change', e => { addGalleryFiles(e.target.files); e.target.value = ''; });
  }
  rail.querySelectorAll('.gcap').forEach(el => {
    el.addEventListener('input', e => {
      const i = Number(e.target.dataset.i);
      if (GALLERY[i]) { GALLERY[i].caption = e.target.value; recompute(); }
    });
  });
  rail.querySelectorAll('.gb').forEach(b => {
    b.addEventListener('click', e => {
      const i = Number(b.dataset.i !== undefined ? b.dataset.i : b.dataset.del);
      if (b.dataset.del !== undefined) {
        GALLERY.splice(Number(b.dataset.del), 1);
      } else if (b.dataset.move === 'up' && i > 0) {
        [GALLERY[i - 1], GALLERY[i]] = [GALLERY[i], GALLERY[i - 1]];
      } else if (b.dataset.move === 'down' && i < GALLERY.length - 1) {
        [GALLERY[i + 1], GALLERY[i]] = [GALLERY[i], GALLERY[i + 1]];
      } else return;
      renderForm(); recompute();
    });
  });
}

function onFieldChange(e) {
  const el = e.target;
  const k = el.dataset.k, t = el.dataset.type;
  let v;
  if (t === 'number') {
    v = el.value === '' ? '' : Number(el.value);
    if (el.dataset.scale && v !== '') v = v / Number(el.dataset.scale);
  } else if (t === 'select') {
    v = el.value === 'true' ? true : (el.value === 'false' ? false : el.value);
  } else if (t === 'pctlist') {
    v = el.value.split(',').map(x => parseFloat(x.trim()) / 100).filter(x => !isNaN(x) && x > 0);
    if (!v.length) v = [0.25, 0.20, 0.15, 0.10];
  } else {
    v = el.value;
  }
  setPath(INPUTS, k, v);
  recompute();
}

function loadImage(slot, file) {
  const fr = new FileReader();
  fr.onload = () => { IMAGES[slot] = fr.result; renderForm(); recompute(); };
  fr.readAsDataURL(file);
}

/* ---------------- compute + preview ---------------- */
let rafId = null;
/* Pages in the current document. The gallery adds one page per 6 images, so
   this is not a constant — the preview frame is sized from it. */
let PAGE_COUNT = 6;
const galleryPageCount = n => Math.ceil((n || 0) / 6);
function recompute() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    MODEL = buildModel(INPUTS);
    const A = Object.assign({}, ASSETS);
    A.cover = IMAGES.cover || ASSETS.cover_default;
    if (IMAGES.aerial) A.aerial = IMAGES.aerial;
    if (IMAGES.design) A.design = IMAGES.design;
    A.gallery = GALLERY;
    PAGE_COUNT = 6 + galleryPageCount(GALLERY.length);
    const pc = document.getElementById('pgcount');
    if (pc) pc.textContent = PAGE_COUNT + ' pages \u00b7 US Letter \u00b7 live preview';
    DOC_HTML = renderDoc(MODEL, A);
    document.getElementById('preview').srcdoc = DOC_HTML;
    // The frame is a fixed-height element, so it must grow with the gallery or
    // the trailing pages are cut off.
    applyZoom();
    // Layout is only measurable once the new srcdoc has parsed.
    const _pf = document.getElementById('preview');
    _pf.addEventListener('load', fitPages, { once: true });
    setTimeout(fitPages, 60);
    renderKpis();
    persistLast();
  });
}

function renderKpis() {
  const he = MODEL.host_economics, opx = MODEL.opex, comp = MODEL.competitive, ops = MODEL.operations_y1;
  const cards = [
    { l: 'Host revenue / mo', v: usd(he.mrr_y1), c: 'hi' },
    { l: '10-year host revenue', v: usd(he.ten_yr_total), c: '' },
    { l: 'vs. flat lease (10-yr)', v: '+' + usd(comp.ten_yr_advantage), c: 'good' },
    { l: 'Operating cost', v: '$' + opx.per_kwh.toFixed(4) + '<span class="u">/kWh</span>', c: 'warn' },
    { l: 'OpEx % of gross', v: (opx.pct_gross * 100).toFixed(1) + '<span class="u">%</span>', c: 'warn' }
  ];
  document.getElementById('kpis').innerHTML = cards.map(c =>
    `<div class="kpi ${c.c}"><div class="v">${c.v}</div><div class="l">${c.l}</div></div>`).join('');
}

/* ---------------- footer-collision guard ----------------
   Page height is fixed at 11in and the footer is absolutely positioned, so
   content that grows past the safe area slides underneath it instead of
   reflowing. Font metrics differ per machine (the document asks for Helvetica
   Neue, which not every OS has), so a layout that clears the footer here can
   collide elsewhere. After each render we measure real clearance and, if a
   page is short, scale that page's content down just enough to clear — capped,
   so it degrades gently rather than colliding. */
const FIT_MIN_GAP = 8;      // px of clearance we insist on
const FIT_MIN_SCALE = 0.88; // never shrink a page more than this

function fitPages() {
  const f = document.getElementById('preview');
  let doc;
  try { doc = f.contentDocument; } catch (e) { return; }
  if (!doc || !doc.body) return;
  const adjusted = [];
  doc.querySelectorAll('.page').forEach((page, i) => {
    const pad = page.querySelector('.pad');
    const foot = page.querySelector('.footline');
    if (!pad || !foot) return;
    pad.style.transform = '';
    pad.style.transformOrigin = 'top center';
    const kids = [].slice.call(pad.children)
      .filter(c => !c.classList.contains('footline') && !c.classList.contains('pgnum'));
    const last = kids[kids.length - 1];
    if (!last) return;
    const footTop = foot.getBoundingClientRect().top;
    const padTop = pad.getBoundingClientRect().top;
    const contentBottom = last.getBoundingClientRect().bottom;
    const gap = footTop - contentBottom;
    if (gap >= FIT_MIN_GAP) return;
    const usable = footTop - padTop - FIT_MIN_GAP;
    const needed = contentBottom - padTop;
    const scale = Math.max(FIT_MIN_SCALE, usable / needed);
    pad.style.transform = 'scale(' + scale.toFixed(4) + ')';
    adjusted.push({ page: i + 1, gap: Math.round(gap), scale: +scale.toFixed(3) });
  });
  if (adjusted.length) console.warn('[proforma] pages scaled to clear the footer:', adjusted);
  return adjusted;
}

/* ---------------- zoom ---------------- */
function applyZoom() {
  const paper = document.getElementById('paper');
  const frame = document.getElementById('preview');
  const DPI = 96;
  const docH = 11 * PAGE_COUNT * DPI;           // US Letter pages, unscaled
  frame.style.height = docH + 'px';
  paper.style.transform = `scale(${zoom})`;
  paper.style.width = (8.5 * DPI) + 'px';
  paper.style.height = (docH * zoom) + 'px';
  document.getElementById('zoomval').textContent = Math.round(zoom * 100) + '%';
}
function fitZoom() {
  const avail = document.querySelector('.viewer').clientWidth - 48;
  zoom = Math.max(0.25, Math.min(1.0, avail / (8.5 * 96)));
  document.getElementById('zoom').value = String(zoom);
  applyZoom();
}

/* ---------------- export ---------------- */
/* The live frame carries any footer-guard scaling; fall back to the raw markup. */
function currentDocHtml() {
  try {
    const d = document.getElementById('preview').contentDocument;
    if (d && d.documentElement) return '<!doctype html>' + d.documentElement.outerHTML;
  } catch (e) {}
  return DOC_HTML;
}

function printDoc() {
  const f = document.getElementById('preview');
  try {
    f.contentWindow.focus();
    f.contentWindow.print();
  } catch (err) {
    openTab();
  }
}
function openTab() {
  const blob = new Blob([currentDocHtml()], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) { downloadFile(slug() + '.html', currentDocHtml(), 'text/html'); toast('Popup blocked — downloaded the document instead'); }
}
function slug() {
  const a = (INPUTS.location.address || 'WattUpUSA_ProForma').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return 'WattUpUSA_ProForma_' + a;
}
function downloadFile(name, content, mime) {
  const blob = new Blob([content], { type: mime || 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function exportInputs() {
  const out = deepClone(INPUTS);
  downloadFile(slug() + '_inputs.json', JSON.stringify(out, null, 2), 'application/json');
  toast('inputs.json downloaded — drop it into the Python pipeline as-is');
}
function importInputs(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const j = JSON.parse(fr.result);
      INPUTS = Object.assign(deepClone(DEFAULT_INPUTS), j);
      INPUTS.location = Object.assign({}, DEFAULT_INPUTS.location, j.location || {});
      INPUTS.design = j.design || {};
      INPUTS.market = j.market || {};
      renderForm(); recompute();
      toast('Inputs loaded');
    } catch (e) { toast('That file is not valid JSON'); }
  };
  fr.readAsText(file);
}

/* ---------------- scenarios (in-session; use Export JSON for a durable copy) ---------------- */
const MEM = {};
function safeGet(k) { return MEM[k] === undefined ? null : MEM[k]; }
function safeSet(k, v) { MEM[k] = v; return true; }

function persistLast() {
  safeSet(LS_LAST, JSON.stringify({ inputs: INPUTS, images: IMAGES, gallery: GALLERY }));
}
function restoreLast() {
  const raw = safeGet(LS_LAST);
  if (!raw) return false;
  try {
    const j = JSON.parse(raw);
    if (!j.inputs) return false;
    INPUTS = Object.assign(deepClone(DEFAULT_INPUTS), j.inputs);
    if (j.images) IMAGES = Object.assign({ cover: null, aerial: null, design: null }, j.images);
    if (Array.isArray(j.gallery)) GALLERY = j.gallery;
    return true;
  } catch (e) { return false; }
}
function saveScenario() {
  const name = prompt('Name this scenario (e.g. the site address):', INPUTS.location.address || '');
  if (!name) return;
  let all = {};
  try { all = JSON.parse(safeGet(LS_KEY) || '{}'); } catch (e) { all = {}; }
  all[name] = deepClone(INPUTS);
  safeSet(LS_KEY, JSON.stringify(all));
  renderScenarios();
  toast('Saved "' + name + '" for this session — use Export JSON to keep it');
}
function renderScenarios() {
  let all = {};
  try { all = JSON.parse(safeGet(LS_KEY) || '{}'); } catch (e) { all = {}; }
  const names = Object.keys(all);
  const sel = document.getElementById('scen');
  sel.innerHTML = '<option value="">Saved scenarios…</option>' +
    names.map(n => `<option value="${n.replace(/"/g, '')}">${n}</option>`).join('');
  sel.classList.toggle('hide', names.length === 0);
}
function loadScenario(name) {
  let all = {};
  try { all = JSON.parse(safeGet(LS_KEY) || '{}'); } catch (e) { all = {}; }
  if (!all[name]) return;
  INPUTS = Object.assign(deepClone(DEFAULT_INPUTS), all[name]);
  renderForm(); recompute();
  toast('Loaded "' + name + '"');
}

let toastT = null;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------------- boot ---------------- */
/* The cover photograph, and any other raster shipped with the tool. Same reasoning as
   svgDataUrl below: the document lives in a srcdoc iframe and is printed to PDF, and a
   data URL is the one form that survives both without a network fetch. */
async function rasterDataUrl(path) {
  try {
    const r = await fetch(path);
    const blob = await r.blob();
    return await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  } catch (e) {
    return path;   // relative path still resolves inside srcdoc in most browsers
  }
}

async function svgDataUrl(path) {
  try {
    const r = await fetch(path);
    const txt = await r.text();
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(txt)));
  } catch (e) {
    return path;   // relative path still resolves inside srcdoc in most browsers
  }
}

async function boot() {
  ASSETS.logo_type_light = await svgDataUrl('assets/logo_type_light.svg');
  ASSETS.mark_dark = await svgDataUrl('assets/mark_dark.svg');
  // The cover photograph every document starts with. This is WattUpUSA's own station
  // render, taken from the live tool's js/brand.js, where it ships as an embedded data
  // URL under the key station_wide. Section 5 replaces it per site; nothing has to be
  // uploaded for a cover to look finished.
  ASSETS.cover_default = await rasterDataUrl('assets/render-station-wide.jpg');

  if (!restoreLast()) {
    // seed with the reference deal so the preview is never empty
    INPUTS.location = {
      address: '8052 Talbert Avenue',
      city: 'Huntington Beach, CA 92646',
      county: 'Orange County',
      utility: 'Southern California Edison',
      ahj: 'City of Huntington Beach'
    };
  }

  renderForm();
  renderScenarios();
  recompute();
  fitZoom();

  document.getElementById('btnPrint').addEventListener('click', printDoc);
  document.getElementById('btnTab').addEventListener('click', openTab);
  document.getElementById('btnExport').addEventListener('click', exportInputs);
  document.getElementById('btnSave').addEventListener('click', saveScenario);
  document.getElementById('btnReset').addEventListener('click', () => {
    if (!confirm('Clear every field back to the WattUpUSA defaults?')) return;
    INPUTS = deepClone(DEFAULT_INPUTS);
    IMAGES = { cover: null, aerial: null, design: null };
    GALLERY = [];
    renderForm(); recompute();
  });
  document.getElementById('fileImport').addEventListener('change', e => {
    if (e.target.files[0]) importInputs(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('btnImport').addEventListener('click', () =>
    document.getElementById('fileImport').click());
  document.getElementById('scen').addEventListener('change', e => {
    if (e.target.value) loadScenario(e.target.value);
    e.target.value = '';
  });
  document.getElementById('zoom').addEventListener('input', e => {
    zoom = Number(e.target.value); applyZoom();
  });
  document.getElementById('btnFit').addEventListener('click', fitZoom);
  window.addEventListener('resize', () => applyZoom());
}

boot();
