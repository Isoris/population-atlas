// atlases/population/pages/health/page8.js
// =============================================================================
// page8 — Population Atlas breeding / sample highlights (stage: health)
//
// Round-1 migration. The scaffold's inline breeding-page JS (legacy
// Population_atlas.html lines ~2017-2612) is lifted VERBATIM into this module:
// auto-derivation hooks (Diversity / Relatedness / Burden / Inversions /
// Markers / HatcheryHealth), JSON+TSV upload parser, filter + sort + render +
// CSV export, toolbar wiring. All `window._bp*` exports preserved so the
// hatchery-health page (page9) can still call `_bpRender()` after its own
// ingest, and the scaffold's test surface still works.
//
// What changed from the legacy:
//   - Wrapped in mount/unmount lifecycle for the atlas-core router.
//   - The tab-click hook (legacy line 2580) is replaced by the explicit mount
//     call (the router calls mount() when navigating to #/population/page8).
//   - File-input `style="display:none"` moved to population.css as
//     .pop-file-hidden (page-fragment cleanliness).
//   - `_bpAutoHatcheryHealthRow` still references `_fhhEnsureState` /
//     `_fhhFocalCohort` / `_fhhClassify` / `window.FHH_VERDICTS` — those are
//     exposed by page9.js when it mounts; if page9 hasn't been visited yet,
//     the function returns [] (graceful no-op, same as the scaffold).
//
// Pattern: page-with-substantial-JS (analogous to the Inversion Atlas's page1
// with its multi-panel renderer). _state.js carries the page-private UI state;
// the verbatim logic lives in this module.
// =============================================================================

import { _pageState, _setActiveState } from './page8/_state.js';

// -----------------------------------------------------------------------------
// VERBATIM-LIFTED logic from legacy Population_atlas.html (lines 2017-2612).
// -----------------------------------------------------------------------------
//
// `window.state` is the legacy shared atlas-state container. Pages 8 and 9
// share it (page9 also reads/writes window.state._hatcheryHealth and the
// shared cohort list). It is initialised lazily here so this module is safe
// to mount before any other page has set it up.

function _bpEnsureWindowState() {
  if (typeof window === 'undefined') return;
  if (typeof window.state === 'undefined') window.state = {};
}

// ── Empirical thresholds for "top-1%" auto-flagging ────────────────────────
const BP_TOP_QUANTILE = 0.99;        // top 1%
const BP_BOTTOM_QUANTILE = 0.01;     // bottom 1% (used for low-π flagging)

// ── Source styling ─────────────────────────────────────────────────────────
const BP_SOURCE_DEFS = {
  'Diversity':   { default_status: 'green',  ref_url: 'Diversity_atlas.html#page1' },
  'Relatedness': { default_status: 'yellow', ref_url: '#page3' },
  'Burden':      { default_status: 'red',    ref_url: null },
  'Inversions':  { default_status: 'green',  ref_url: 'Inversion_atlas.html#page18' },
  'Markers':     { default_status: 'green',  ref_url: 'Inversion_atlas.html#page18' },
};

const BP_STATUS_LABELS = {
  'green':  'useful',
  'yellow': 'review',
  'red':    'caution',
};

function _bpEnsureState() {
  _bpEnsureWindowState();
  if (!window.state._breedingPage) {
    window.state._breedingPage = {
      view_mode: 'simple',
      filter_status: 'all',
      filter_source: 'all',
      user_rows: [],
      derived_rows: [],
      metadata: {},
    };
  }
  return window.state._breedingPage;
}

// ── Auto-derivation hooks ─────────────────────────────────────────────────

function _bpAutoDiversityRows() {
  const ps = window.state.perSampleStats;
  if (!Array.isArray(ps) || ps.length === 0) return [];
  const out = [];
  const frohValid = ps.filter(s => typeof s.F_ROH === 'number');
  if (frohValid.length > 0) {
    const sorted = frohValid.slice().sort((a, b) => a.F_ROH - b.F_ROH);
    const cutIdx = Math.floor(sorted.length * BP_TOP_QUANTILE);
    const cut = sorted[Math.min(cutIdx, sorted.length - 1)].F_ROH;
    for (const s of frohValid) {
      if (s.F_ROH >= cut && s.F_ROH > 0) {
        out.push({
          sample: s.sample,
          highlight: 'High inbreeding' + (s.F_ROH_top_chrom ? ' on ' + s.F_ROH_top_chrom : ''),
          value: 'F_ROH = ' + s.F_ROH.toFixed(3) + ' (top 1%)',
          source: 'Diversity',
          status: 'red',
          notes: 'top-1% F_ROH cut = ' + cut.toFixed(3),
          ref_url: 'Diversity_atlas.html#page5',
          _origin: 'auto:froh_top',
        });
      }
    }
  }
  const piValid = ps.filter(s => typeof s.theta_pi === 'number');
  if (piValid.length > 0) {
    const sorted = piValid.slice().sort((a, b) => a.theta_pi - b.theta_pi);
    const cutIdx = Math.floor(sorted.length * BP_TOP_QUANTILE);
    const cut = sorted[Math.min(cutIdx, sorted.length - 1)].theta_pi;
    for (const s of piValid) {
      if (s.theta_pi >= cut) {
        out.push({
          sample: s.sample,
          highlight: 'Very high nucleotide diversity',
          value: 'θπ = ' + s.theta_pi.toFixed(5) + ' (top 1%)',
          source: 'Diversity',
          status: 'green',
          notes: 'top-1% θπ cut = ' + cut.toFixed(5),
          ref_url: 'Diversity_atlas.html#page2',
          _origin: 'auto:pi_top',
        });
      }
    }
  }
  return out;
}

function _bpAutoRelatednessRows() {
  const fc = window.state.familyClusters;
  if (!fc || !Array.isArray(fc.clusters) || fc.clusters.length === 0) return [];
  const sorted = fc.clusters.slice().sort((a, b) => (b.members || []).length - (a.members || []).length);
  const top = sorted[0];
  if (!top || !Array.isArray(top.members) || top.members.length < 2) return [];
  const n = top.members.length;
  return top.members.map(sample => ({
    sample,
    highlight: 'Member of largest family cluster',
    value: 'family size = ' + n,
    source: 'Relatedness',
    status: 'yellow',
    notes: 'cluster_id = ' + (top.cluster_id || '?'),
    ref_url: '#page3',
    _origin: 'auto:family_largest',
  }));
}

function _bpAutoBurdenRows() {
  const ps = window.state.perSampleStats;
  if (!Array.isArray(ps) || ps.length === 0) return [];
  const valid = ps.filter(s => typeof s.deleterious_burden === 'number');
  if (valid.length === 0) return [];
  const sorted = valid.slice().sort((a, b) => a.deleterious_burden - b.deleterious_burden);
  const cutIdx = Math.floor(sorted.length * BP_TOP_QUANTILE);
  const cut = sorted[Math.min(cutIdx, sorted.length - 1)].deleterious_burden;
  const out = [];
  for (const s of valid) {
    if (s.deleterious_burden >= cut) {
      out.push({
        sample: s.sample,
        highlight: 'High deleterious load' + (s.burden_top_chrom ? ' on ' + s.burden_top_chrom : ''),
        value: 'burden = ' + s.deleterious_burden.toFixed(2) + ' (top 1%)',
        source: 'Burden',
        status: 'red',
        notes: 'SIFT4G + VESM_650M score',
        ref_url: null,
        _origin: 'auto:burden_top',
      });
    }
  }
  return out;
}

function _bpAutoInversionRows() {
  const ic = window.state.inversionCarriers;
  if (!Array.isArray(ic) || ic.length === 0) return [];
  const out = [];
  for (const e of ic) {
    if (typeof e.frequency_in_cohort === 'number' && e.frequency_in_cohort <= 0.05 && e.sample && e.inversion_id) {
      out.push({
        sample: e.sample,
        highlight: 'Rare inversion haplotype carrier',
        value: e.inversion_id + ' (cohort freq = ' + (e.frequency_in_cohort * 100).toFixed(1) + '%)',
        source: 'Inversions',
        status: 'green',
        notes: e.notes || '',
        ref_url: 'Inversion_atlas.html#page18',
        _origin: 'auto:inv_rare',
      });
    }
  }
  return out;
}

function _bpAutoMarkerRows() {
  const mc = window.state.markerControls;
  if (!Array.isArray(mc) || mc.length === 0) return [];
  const roleLabel = {
    'positive_INV': 'Marker positive control',
    'positive_HET': 'Marker heterozygote control',
    'negative_STD': 'Marker negative control',
  };
  const valueLabel = {
    'positive_INV': 'INV/INV',
    'positive_HET': 'STD/INV (HET)',
    'negative_STD': 'STD/STD',
  };
  return mc.map(e => ({
    sample: e.sample,
    highlight: roleLabel[e.role] || 'Marker control',
    value: (e.marker_id || '?') + ' ' + (valueLabel[e.role] || ''),
    source: 'Markers',
    status: 'green',
    notes: e.notes || '',
    ref_url: 'Inversion_atlas.html#page18',
    _origin: 'auto:marker_' + (e.role || 'control'),
  })).filter(r => r.sample);
}

function _bpAutoHatcheryHealthRow() {
  if (typeof window._fhhEnsureState !== 'function') return [];
  const fhh = window._fhhEnsureState();
  if (!fhh.cohorts || fhh.cohorts.length === 0) return [];
  const focal = (typeof window._fhhFocalCohort === 'function') ? window._fhhFocalCohort() : null;
  if (!focal) return [];
  const cls = window._fhhClassify(focal, fhh.cohorts);
  if (!cls.verdict) return [];
  const verdictDef = window.FHH_VERDICTS && window.FHH_VERDICTS[cls.verdict];
  if (!verdictDef) return [];
  const ratioStr = (typeof cls.h_ratio === 'number') ? cls.h_ratio.toFixed(2) : '—';
  return [{
    sample: focal.cohort || 'focal cohort',
    highlight: 'Hatchery-health verdict',
    highlight_html: 'Hatchery-health verdict: <span class="' + verdictDef.klass + '">' +
                    _bpEsc(verdictDef.label) + '</span>',
    value: 'F_ROH ' + (typeof cls.F_ROH === 'number' ? cls.F_ROH.toFixed(3) : '—') +
           ' · H/H_ref ' + ratioStr,
    source: 'Diversity',
    status: cls.verdict === 'good' ? 'green' :
            (cls.verdict === 'caution' ? 'red' : 'yellow'),
    notes: 'cohort-level (F_ROH × H plane). ' +
           (focal.notes || ''),
    ref_url: '#page9',
    _origin: 'auto:hatchery_health',
  }];
}

function _bpDerivedRows() {
  return []
    .concat(_bpAutoDiversityRows())
    .concat(_bpAutoRelatednessRows())
    .concat(_bpAutoBurdenRows())
    .concat(_bpAutoInversionRows())
    .concat(_bpAutoMarkerRows())
    .concat(_bpAutoHatcheryHealthRow());
}

function _bpAllRows() {
  const ui = _bpEnsureState();
  const derived = _bpDerivedRows();
  const userKey = r => (r.sample || '') + '||' + (r.source || '');
  const userMap = new Map(ui.user_rows.map(r => [userKey(r), r]));
  const out = [];
  for (const r of derived) {
    const k = userKey(r);
    if (userMap.has(k)) {
      out.push(Object.assign({}, r, userMap.get(k), { _origin: 'overlaid' }));
      userMap.delete(k);
    } else {
      out.push(r);
    }
  }
  for (const r of userMap.values()) {
    out.push(Object.assign({}, r, { _origin: r._origin || 'user' }));
  }
  return out;
}

// ── Upload parsing ────────────────────────────────────────────────────────
function _bpIsValidJson(parsed) {
  return parsed && typeof parsed === 'object' && Array.isArray(parsed.rows);
}
function _bpParseTsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return null;
  const header = lines[0].split('\t').map(s => s.trim().toLowerCase());
  const idx = name => header.indexOf(name);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    const get = name => idx(name) >= 0 ? (parts[idx(name)] || '').trim() : '';
    rows.push({
      sample:    get('sample') || get('sample_id'),
      highlight: get('highlight'),
      value:     get('value'),
      source:    get('source'),
      status:    (get('status') || '').toLowerCase(),
      notes:     get('notes'),
      ref_url:   get('ref_url'),
    });
  }
  return { metadata: {}, rows };
}

function _bpIngestText(text, filename) {
  const ui = _bpEnsureState();
  let parsed = null;
  if (filename && /\.tsv$|\.txt$/i.test(filename)) {
    parsed = _bpParseTsv(text);
  } else {
    try { parsed = JSON.parse(text); } catch (_) {
      try { parsed = _bpParseTsv(text); } catch (__) { parsed = null; }
    }
  }
  if (!parsed) { console.warn('[breedingPage] could not parse', filename); return; }
  if (!_bpIsValidJson(parsed)) {
    console.warn('[breedingPage] file does not match schema (expected `rows` array)');
    return;
  }
  const validRows = [];
  for (const r of parsed.rows) {
    if (!r.sample || !r.highlight) continue;
    const src = r.source || '';
    const status = (r.status || '').toLowerCase();
    const validStatus = ['green', 'yellow', 'red'].includes(status)
      ? status
      : ((BP_SOURCE_DEFS[src] && BP_SOURCE_DEFS[src].default_status) || 'green');
    validRows.push({
      sample: r.sample,
      highlight: r.highlight,
      value: r.value || '',
      source: src,
      status: validStatus,
      notes: r.notes || '',
      ref_url: r.ref_url || (BP_SOURCE_DEFS[src] && BP_SOURCE_DEFS[src].ref_url) || null,
      _origin: 'user',
    });
  }
  ui.user_rows = validRows;
  if (parsed.metadata) ui.metadata = Object.assign({}, ui.metadata, parsed.metadata);
  _bpRender();
}

// ── Filtering ─────────────────────────────────────────────────────────────
function _bpFilteredRows(rows, ui) {
  return rows.filter(r => {
    if (ui.filter_status !== 'all' && r.status !== ui.filter_status) return false;
    if (ui.filter_source !== 'all' && r.source !== ui.filter_source) return false;
    return true;
  });
}

// ── Render ────────────────────────────────────────────────────────────────
function _bpEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _bpRenderSourceCards(rows) {
  const counts = { Diversity: 0, Relatedness: 0, Burden: 0, Inversions: 0, Markers: 0, _other: 0 };
  for (const r of rows) {
    if (counts.hasOwnProperty(r.source)) counts[r.source] += 1;
    else counts._other += 1;
  }
  const cards = ['Diversity','Relatedness','Burden','Inversions','Markers'].map(src =>
    '<div class="bp-source-card">' +
      '<div class="bp-sc-value">' + counts[src] + '</div>' +
      '<div class="bp-sc-label">' + src + '</div>' +
    '</div>'
  );
  cards.push('<div class="bp-source-card">' +
    '<div class="bp-sc-value">' + rows.length + '</div>' +
    '<div class="bp-sc-label">total rows</div>' +
  '</div>');
  const slot = document.getElementById('bpSourceCards');
  if (slot) slot.innerHTML = cards.join('');
}

function _bpRenderTable(rows, ui) {
  const slot = document.getElementById('bpTableSlot');
  if (!slot) return;
  const filtered = _bpFilteredRows(rows, ui);
  if (filtered.length === 0) {
    const msg = (rows.length === 0)
      ? 'No rows yet. Load a <code>breeding_highlights.json</code> via the toolbar, or wait for the cohort’s per-sample F_ROH / family-cluster / burden / inversion-carrier / marker-control JSON layers to populate auto-rows.'
      : 'No rows match the current filters.';
    slot.innerHTML = '<div class="bp-empty">' + msg + '</div>';
    return;
  }
  const statusOrder = { 'red': 0, 'yellow': 1, 'green': 2 };
  const sorted = filtered.slice().sort((a, b) => {
    const sa = statusOrder[a.status] != null ? statusOrder[a.status] : 9;
    const sb = statusOrder[b.status] != null ? statusOrder[b.status] : 9;
    if (sa !== sb) return sa - sb;
    return String(a.sample).localeCompare(String(b.sample));
  });
  const isDetailed = ui.view_mode === 'detailed';
  const head = '<thead><tr>' +
    '<th>Sample</th>' +
    '<th>Highlight</th>' +
    '<th>Value</th>' +
    '<th>Source</th>' +
    (isDetailed ? '<th class="bp-detail-only">Status</th>' : '') +
    (isDetailed ? '<th class="bp-detail-only">Notes / origin</th>' : '') +
    '</tr></thead>';
  const body = sorted.map(r => {
    const dotClass = 'bp-' + (r.status || 'green');
    const sourceCell = r.ref_url
      ? '<a href="' + _bpEsc(r.ref_url) + '">' + _bpEsc(r.source) + '</a>'
      : _bpEsc(r.source);
    const sourceWithDot = '<span class="bp-dot ' + dotClass + '"></span>' + sourceCell;
    const highlightCell = (typeof r.highlight_html === 'string' && r.highlight_html)
      ? r.highlight_html
      : _bpEsc(r.highlight);
    const valueCell = '<div>' + _bpEsc(r.value) + '</div>' +
      (isDetailed && r.notes ? '<div class="bp-notes">' + _bpEsc(r.notes) + '</div>' : '');
    return '<tr>' +
      '<td class="bp-sample">' + _bpEsc(r.sample) + '</td>' +
      '<td>' + highlightCell + '</td>' +
      '<td class="bp-value">' + valueCell + '</td>' +
      '<td class="bp-source">' + sourceWithDot + '</td>' +
      (isDetailed ? '<td class="bp-detail-only"><span class="bp-dot-label">' +
                     _bpEsc(BP_STATUS_LABELS[r.status] || r.status) + '</span></td>' : '') +
      (isDetailed ? '<td class="bp-detail-only bp-notes">' + _bpEsc(r._origin || '') + '</td>' : '') +
      '</tr>';
  }).join('');
  const tableClass = 'bp-table ' + (isDetailed ? 'bp-detailed' : 'bp-simple');
  slot.innerHTML = '<table class="' + tableClass + '">' + head + '<tbody>' + body + '</tbody></table>';
}

function _bpRefreshSourceFilter(rows) {
  const $sel = document.getElementById('bpFilterSource');
  if (!$sel) return;
  const ui = _bpEnsureState();
  const present = new Set(rows.map(r => r.source).filter(s => s));
  const ordered = ['Diversity','Relatedness','Burden','Inversions','Markers']
    .filter(s => present.has(s))
    .concat(Array.from(present).filter(s => !['Diversity','Relatedness','Burden','Inversions','Markers'].includes(s)));
  const opts = ['<option value="all">all sources</option>']
    .concat(ordered.map(s => '<option value="' + _bpEsc(s) + '"' +
      (s === ui.filter_source ? ' selected' : '') + '>' + _bpEsc(s) + '</option>'));
  $sel.innerHTML = opts.join('');
}

function _bpRender() {
  const ui = _bpEnsureState();
  const rows = _bpAllRows();
  ui.derived_rows = _bpDerivedRows();
  _bpRenderSourceCards(rows);
  _bpRefreshSourceFilter(rows);
  _bpRenderTable(rows, ui);
  const badge = document.getElementById('bpStatusBadge');
  if (badge) {
    if (rows.length === 0) {
      badge.textContent = 'scaffold · 0 rows · load breeding_highlights.json or upstream JSON layers to populate';
      badge.classList.add('planned');
      badge.classList.remove('ready');
    } else {
      badge.textContent = rows.length + ' rows · ' +
        ui.derived_rows.length + ' auto-derived · ' +
        ui.user_rows.length + ' user-supplied';
      badge.classList.remove('planned');
      badge.classList.add('ready');
    }
  }
  const $simple = document.getElementById('bpViewSimpleBtn');
  const $detail = document.getElementById('bpViewDetailedBtn');
  if ($simple && $detail) {
    $simple.classList.toggle('active', ui.view_mode === 'simple');
    $detail.classList.toggle('active', ui.view_mode === 'detailed');
  }
}

function _bpExportCsv() {
  const ui = _bpEnsureState();
  const rows = _bpFilteredRows(_bpAllRows(), ui);
  const header = ['sample','highlight','value','source','status','notes','ref_url','origin'];
  const csvCell = v => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([r.sample, r.highlight, r.value, r.source, r.status, r.notes, r.ref_url, r._origin]
      .map(csvCell).join(','));
  }
  const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'breeding_highlights.csv';
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 250);
}

// ── Wire toolbar (idempotent per mount) ────────────────────────────────────
// The mount lifecycle rebuilds the DOM each time, so _bpWired is reset on each
// mount() call (not persisted between mounts the way the legacy single-page
// HTML kept it).
let _bpWired = false;
function _bpWire() {
  if (_bpWired) return;
  _bpWired = true;
  const ui = _bpEnsureState();
  const $simple = document.getElementById('bpViewSimpleBtn');
  const $detail = document.getElementById('bpViewDetailedBtn');
  if ($simple) $simple.addEventListener('click', () => { ui.view_mode = 'simple'; _bpRender(); });
  if ($detail) $detail.addEventListener('click', () => { ui.view_mode = 'detailed'; _bpRender(); });
  const $fs = document.getElementById('bpFilterStatus');
  if ($fs) $fs.addEventListener('change', () => { ui.filter_status = $fs.value; _bpRender(); });
  const $fsrc = document.getElementById('bpFilterSource');
  if ($fsrc) $fsrc.addEventListener('change', () => { ui.filter_source = $fsrc.value; _bpRender(); });
  const $load = document.getElementById('bpLoadBtn');
  const $input = document.getElementById('bpLoadInput');
  if ($load && $input) {
    $load.addEventListener('click', () => $input.click());
    $input.addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = ev => _bpIngestText(ev.target.result, f.name);
      r.readAsText(f);
      $input.value = '';
    });
  }
  const $csv = document.getElementById('bpExportCsvBtn');
  if ($csv) $csv.addEventListener('click', _bpExportCsv);
  const $reset = document.getElementById('bpResetBtn');
  if ($reset) $reset.addEventListener('click', () => {
    ui.user_rows = [];
    _bpRender();
  });
}

// -----------------------------------------------------------------------------
// Atlas-router lifecycle
// -----------------------------------------------------------------------------

export const PAGE8_META = {
  id: 'page8',
  stage: 'health',
  label: 'breeding',
};

export function refreshPage8(state) {
  if (state) _setActiveState(state);
  _bpWire();
  _bpRender();
}

export async function mount(root, atlasState, registry) {
  _bpEnsureWindowState();
  _bpWired = false;  // fresh DOM each mount, so wiring must rebind
  const legacyState = _buildLegacyState(atlasState);
  _setActiveState(legacyState);

  try { _bpWire(); _bpRender(); }
  catch (e) { console.warn('[page8.mount] initial render failed:', e); }

  if (atlasState.population) atlasState.population._page8State = legacyState;

  // Expose hooks for tests + cross-page hand-off (matches legacy contract).
  if (typeof window !== 'undefined') {
    window._bpRender = _bpRender;
    window._bpEnsureState = _bpEnsureState;
    window._bpAllRows = _bpAllRows;
    window._bpDerivedRows = _bpDerivedRows;
    window._bpAutoDiversityRows = _bpAutoDiversityRows;
    window._bpAutoRelatednessRows = _bpAutoRelatednessRows;
    window._bpAutoBurdenRows = _bpAutoBurdenRows;
    window._bpAutoInversionRows = _bpAutoInversionRows;
    window._bpAutoMarkerRows = _bpAutoMarkerRows;
    window._bpAutoHatcheryHealthRow = _bpAutoHatcheryHealthRow;
    window._bpIngestText = _bpIngestText;
    window._bpFilteredRows = _bpFilteredRows;
    window._bpExportCsv = _bpExportCsv;
    window._bpIsValidJson = _bpIsValidJson;
    window._bpParseTsv = _bpParseTsv;
    window.BP_SOURCE_DEFS = BP_SOURCE_DEFS;
    window.BP_STATUS_LABELS = BP_STATUS_LABELS;
  }
}

export async function unmount(root) {
  _setActiveState(null);
  _bpWired = false;
}

function _buildLegacyState(atlasState) {
  const pop = atlasState.population || {};
  return Object.assign({}, pop);
}
