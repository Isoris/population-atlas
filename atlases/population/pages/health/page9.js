// atlases/population/pages/health/page9.js
// =============================================================================
// page9 — Population Atlas hatchery-health F_ROH × H plane (stage: health)
//
// Round-1 migration. The scaffold's inline hatchery-health JS (legacy
// Population_atlas.html lines ~2614-3071) is lifted VERBATIM into this module:
// FHH_VERDICTS verdict table, _fhhEnsureState UI state, _fhhResolveHRef
// species-aware reference resolution, _fhhClassify quadrant assignment,
// _fhhParseTsv/_fhhIngestText upload pipeline, _fhhRender* renderers
// (summary cards + SVG scatter + comparator table), _fhhExportCsv, _fhhWire
// toolbar wiring.
//
// All `window._fhh*` exports + `window.FHH_VERDICTS` preserved so the
// breeding page (page8) can still call `_fhhEnsureState()` / `_fhhFocalCohort()`
// / `_fhhClassify()` from its auto-derivation hook, and the scaffold's test
// surface still works.
//
// What changed from the legacy:
//   - Wrapped in mount/unmount lifecycle for the atlas-core router.
//   - Tab-click hook (legacy line 3048) replaced by explicit mount() call.
//   - File-input `style="display:none"` moved to population.css as
//     .pop-file-hidden; SVG-slot inline margin moved to .pop-fhh-plot-slot.
//
// Pattern: page-with-substantial-JS (same as page8 breeding migration).
// =============================================================================

import { _pageState, _setActiveState } from './page9/_state.js';

function _fhhEnsureWindowState() {
  if (typeof window === 'undefined') return;
  if (typeof window.state === 'undefined') window.state = {};
}

// ---------------------------------------------------------------------------
// VERBATIM-LIFTED logic from legacy Population_atlas.html (lines 2614-3071).
// ---------------------------------------------------------------------------

const FHH_VERDICTS = {
  'good':              { label: 'Healthy — outbred on diversity-replete background',         klass: 'fhh-good'    },
  'review_inbreeding': { label: 'Recent inbreeding only — outcrossable',                     klass: 'fhh-review'  },
  'review_erosion':    { label: 'Diversity erosion only — bottlenecked but not inbred',      klass: 'fhh-review'  },
  'caution':           { label: 'Caution — historical erosion + recent inbreeding',          klass: 'fhh-caution' },
};

function _fhhEnsureState() {
  _fhhEnsureWindowState();
  if (!window.state._hatcheryHealth) {
    window.state._hatcheryHealth = {
      cohorts: [],
      metadata: {},
    };
  }
  return window.state._hatcheryHealth;
}

function _fhhResolveHRef(cohort, allCohorts) {
  if (typeof cohort.H_ref === 'number' && cohort.H_ref > 0) return cohort.H_ref;
  if (cohort.species) {
    const peers = allCohorts.filter(c =>
      c.species === cohort.species && typeof c.H_per_site === 'number');
    if (peers.length > 0) {
      const peerHRef = peers.reduce((m, c) => Math.max(m, c.H_per_site), 0);
      if (peerHRef > 0) return peerHRef;
    }
  }
  const allH = allCohorts.map(c => c.H_per_site).filter(v => typeof v === 'number');
  if (allH.length > 0) return Math.max.apply(null, allH);
  return null;
}

function _fhhClassify(cohort, allCohorts) {
  const hRef = _fhhResolveHRef(cohort, allCohorts);
  const ratio = (typeof cohort.H_per_site === 'number' && hRef && hRef > 0)
    ? (cohort.H_per_site / hRef) : null;
  const froh = cohort.F_ROH;
  if (typeof froh !== 'number' || ratio == null) {
    return { verdict: null, h_ratio: ratio, F_ROH: froh, h_ref: hRef };
  }
  let frohCut = 0.10, ratioCut = 0.5;
  const valid = allCohorts.filter(c =>
    typeof c.F_ROH === 'number' && typeof c.H_per_site === 'number');
  if (valid.length >= 2) {
    const frohs = valid.map(c => c.F_ROH).sort((a, b) => a - b);
    const ratios = valid.map(c => {
      const ref = _fhhResolveHRef(c, allCohorts);
      return (ref && ref > 0) ? c.H_per_site / ref : null;
    }).filter(v => v != null).sort((a, b) => a - b);
    const med = arr => arr[Math.floor(arr.length / 2)];
    if (frohs.length > 0)  frohCut  = med(frohs);
    if (ratios.length > 0) ratioCut = med(ratios);
  }
  const highFroh = froh >= frohCut;
  const highH = ratio >= ratioCut;
  let verdict;
  if (!highFroh && highH)       verdict = 'good';
  else if ( highFroh && highH)  verdict = 'review_inbreeding';
  else if (!highFroh && !highH) verdict = 'review_erosion';
  else                          verdict = 'caution';
  return { verdict, h_ratio: ratio, F_ROH: froh, h_ref: hRef, frohCut, ratioCut };
}

function _fhhIsValidJson(parsed) {
  return parsed && typeof parsed === 'object' && Array.isArray(parsed.cohorts);
}

function _fhhParseTsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return null;
  const header = lines[0].split('\t').map(s => s.trim().toLowerCase());
  const idx = name => header.indexOf(name);
  const cohorts = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    const get = name => idx(name) >= 0 ? (parts[idx(name)] || '').trim() : '';
    const num = name => { const v = get(name); return (v === '' || v === 'NA') ? null : Number(v); };
    cohorts.push({
      cohort:    get('cohort'),
      species:   get('species'),
      F_ROH:     num('f_roh'),
      H_per_site: num('h_per_site'),
      H_ref:     num('h_ref'),
      citation:  get('citation'),
      notes:     get('notes'),
      is_focal:  get('is_focal').toLowerCase() === 'true' || get('is_focal') === '1',
    });
  }
  return { metadata: {}, cohorts };
}

function _fhhIngestText(text, filename) {
  const ui = _fhhEnsureState();
  let parsed = null;
  if (filename && /\.tsv$|\.txt$/i.test(filename)) {
    parsed = _fhhParseTsv(text);
  } else {
    try { parsed = JSON.parse(text); } catch (_) {
      try { parsed = _fhhParseTsv(text); } catch (__) { parsed = null; }
    }
  }
  if (!parsed) { console.warn('[fhh] could not parse', filename); return; }
  if (!_fhhIsValidJson(parsed)) {
    console.warn('[fhh] expected `cohorts` array');
    return;
  }
  ui.cohorts = parsed.cohorts.map(c => ({
    cohort:     c.cohort || c.name || 'unnamed',
    species:    c.species || null,
    F_ROH:      typeof c.F_ROH === 'number' ? c.F_ROH : null,
    H_per_site: typeof c.H_per_site === 'number' ? c.H_per_site : null,
    H_ref:      typeof c.H_ref === 'number' ? c.H_ref : null,
    citation:   c.citation || null,
    notes:      c.notes || null,
    is_focal:   c.is_focal === true,
    ref_url:    c.ref_url || null,
  })).filter(c => typeof c.F_ROH === 'number' && typeof c.H_per_site === 'number');
  if (parsed.metadata) ui.metadata = Object.assign({}, ui.metadata, parsed.metadata);
  _fhhRender();
  // Re-render the breeding page if it has been mounted and exposed _bpRender.
  if (typeof window !== 'undefined' && typeof window._bpRender === 'function') {
    try { window._bpRender(); } catch (e) { console.warn('[fhh] breeding refresh failed:', e); }
  }
}

function _fhhEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _fhhFocalCohort() {
  const ui = _fhhEnsureState();
  if (!ui.cohorts || ui.cohorts.length === 0) return null;
  const flagged = ui.cohorts.filter(c => c.is_focal);
  if (flagged.length > 0) return flagged[0];
  const sorted = ui.cohorts.slice().sort((a, b) => (b.F_ROH || 0) - (a.F_ROH || 0));
  return sorted[0];
}

function _fhhRenderSummaryCards() {
  const ui = _fhhEnsureState();
  const slot = document.getElementById('fhhSummaryCards');
  if (!slot) return;
  if (ui.cohorts.length === 0) { slot.innerHTML = ''; return; }
  const counts = { good: 0, review_inbreeding: 0, review_erosion: 0, caution: 0 };
  for (const c of ui.cohorts) {
    const r = _fhhClassify(c, ui.cohorts);
    if (r.verdict) counts[r.verdict] = (counts[r.verdict] || 0) + 1;
  }
  const card = (label, value, klass) =>
    '<div class="bp-source-card">' +
      '<div class="bp-sc-value ' + klass + '">' + value + '</div>' +
      '<div class="bp-sc-label">' + label + '</div>' +
    '</div>';
  slot.innerHTML =
    card('Healthy', counts.good, 'fhh-good') +
    card('Recent inbreeding', counts.review_inbreeding, 'fhh-review') +
    card('Diversity erosion', counts.review_erosion, 'fhh-review') +
    card('Caution', counts.caution, 'fhh-caution') +
    card('Cohorts loaded', ui.cohorts.length, '');
}

function _fhhRenderPlot() {
  const ui = _fhhEnsureState();
  const slot = document.getElementById('fhhPlotSlot');
  if (!slot) return;
  if (ui.cohorts.length === 0) {
    slot.innerHTML = '<div class="fhh-empty">No cohorts loaded yet. ' +
      'Upload a <code>hatchery_health.json</code> via the toolbar below ' +
      'to plot points on the F_ROH × H plane.</div>';
    return;
  }
  const W = 720, H = 420;
  const pad = { l: 60, r: 180, t: 20, b: 50 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  let maxFroh = 0.05, maxRatio = 0.5;
  for (const c of ui.cohorts) {
    const r = _fhhClassify(c, ui.cohorts);
    if (typeof r.F_ROH === 'number') maxFroh = Math.max(maxFroh, r.F_ROH);
    if (typeof r.h_ratio === 'number') maxRatio = Math.max(maxRatio, r.h_ratio);
  }
  maxFroh = Math.min(1.0, Math.ceil(maxFroh * 10) / 10 + 0.05);
  maxRatio = Math.min(1.5, Math.ceil(maxRatio * 10) / 10 + 0.1);
  const xScale = v => pad.l + (v / maxFroh) * innerW;
  const yScale = v => pad.t + innerH - (v / maxRatio) * innerH;
  let frohCut = 0.10, ratioCut = 0.5;
  const valid = ui.cohorts.filter(c =>
    typeof c.F_ROH === 'number' && typeof c.H_per_site === 'number');
  if (valid.length >= 2) {
    const frohs = valid.map(c => c.F_ROH).sort((a, b) => a - b);
    const ratios = valid.map(c => _fhhClassify(c, ui.cohorts).h_ratio)
      .filter(v => v != null).sort((a, b) => a - b);
    const med = arr => arr[Math.floor(arr.length / 2)];
    if (frohs.length > 0)  frohCut  = med(frohs);
    if (ratios.length > 0) ratioCut = med(ratios);
  }
  const tickFmt = v => (v < 0.01 ? v.toFixed(3) : v.toFixed(2));
  let svg = '<svg class="fhh-plot-svg" viewBox="0 0 ' + W + ' ' + H +
            '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="F_ROH × H plane scatter">';
  svg += '<line class="fhh-plot-axis" x1="' + pad.l + '" y1="' + (H - pad.b) +
         '" x2="' + (W - pad.r) + '" y2="' + (H - pad.b) + '" />';
  svg += '<line class="fhh-plot-axis" x1="' + pad.l + '" y1="' + pad.t +
         '" x2="' + pad.l + '" y2="' + (H - pad.b) + '" />';
  for (let i = 0; i <= 5; i++) {
    const v = (maxFroh / 5) * i;
    const x = xScale(v);
    svg += '<line class="fhh-plot-axis" x1="' + x + '" y1="' + (H - pad.b) +
           '" x2="' + x + '" y2="' + (H - pad.b + 4) + '" />';
    svg += '<text class="fhh-plot-tick" x="' + x + '" y="' + (H - pad.b + 16) +
           '" text-anchor="middle">' + tickFmt(v) + '</text>';
  }
  for (let i = 0; i <= 5; i++) {
    const v = (maxRatio / 5) * i;
    const y = yScale(v);
    svg += '<line class="fhh-plot-axis" x1="' + (pad.l - 4) + '" y1="' + y +
           '" x2="' + pad.l + '" y2="' + y + '" />';
    svg += '<text class="fhh-plot-tick" x="' + (pad.l - 8) + '" y="' + (y + 3) +
           '" text-anchor="end">' + v.toFixed(2) + '</text>';
  }
  svg += '<text class="fhh-plot-axis-label" x="' + (pad.l + innerW / 2) +
         '" y="' + (H - 10) + '" text-anchor="middle">F_ROH</text>';
  svg += '<text class="fhh-plot-axis-label" x="' + 14 + '" y="' + (pad.t + innerH / 2) +
         '" transform="rotate(-90,14,' + (pad.t + innerH / 2) + ')" text-anchor="middle">H / H_ref</text>';
  svg += '<line class="fhh-plot-quadrant-line" x1="' + xScale(frohCut) + '" y1="' + pad.t +
         '" x2="' + xScale(frohCut) + '" y2="' + (H - pad.b) + '" />';
  svg += '<line class="fhh-plot-quadrant-line" x1="' + pad.l + '" y1="' + yScale(ratioCut) +
         '" x2="' + (W - pad.r) + '" y2="' + yScale(ratioCut) + '" />';
  svg += '<text class="fhh-plot-quadrant-label" x="' + (pad.l + 8) + '" y="' + (pad.t + 14) + '">healthy</text>';
  svg += '<text class="fhh-plot-quadrant-label" x="' + (W - pad.r - 8) + '" y="' + (pad.t + 14) + '" text-anchor="end">recent inbreeding</text>';
  svg += '<text class="fhh-plot-quadrant-label" x="' + (pad.l + 8) + '" y="' + (H - pad.b - 8) + '">erosion only</text>';
  svg += '<text class="fhh-plot-quadrant-label" x="' + (W - pad.r - 8) + '" y="' + (H - pad.b - 8) + '" text-anchor="end">caution</text>';
  for (const c of ui.cohorts) {
    const r = _fhhClassify(c, ui.cohorts);
    if (!r.verdict) continue;
    const x = xScale(r.F_ROH);
    const y = yScale(r.h_ratio);
    const klass = FHH_VERDICTS[r.verdict].klass;
    const focal = c.is_focal ? ' fhh-focal' : '';
    svg += '<circle class="fhh-plot-point ' + klass + focal + '" cx="' + x +
           '" cy="' + y + '" r="' + (c.is_focal ? 7 : 5) + '">' +
           '<title>' + _fhhEsc(c.cohort) + ' — F_ROH ' + r.F_ROH.toFixed(3) +
           ', H/H_ref ' + r.h_ratio.toFixed(2) + ' — ' + FHH_VERDICTS[r.verdict].label +
           '</title></circle>';
    const labelClass = 'fhh-plot-label' + (c.is_focal ? ' fhh-plot-label-focal' : '');
    svg += '<text class="' + labelClass + '" x="' + (x + (c.is_focal ? 10 : 8)) +
           '" y="' + (y + 3) + '">' + _fhhEsc(c.cohort) + '</text>';
  }
  svg += '</svg>';
  slot.innerHTML = svg;
}

function _fhhRenderTable() {
  const ui = _fhhEnsureState();
  const slot = document.getElementById('fhhTableSlot');
  if (!slot) return;
  if (ui.cohorts.length === 0) {
    slot.innerHTML = '<div class="fhh-empty">No cohorts loaded.</div>';
    return;
  }
  const head = '<thead><tr>' +
    '<th>Cohort</th>' +
    '<th>Species</th>' +
    '<th>F_ROH</th>' +
    '<th>H per site</th>' +
    '<th>H / H_ref</th>' +
    '<th>Verdict</th>' +
    '</tr></thead>';
  const body = ui.cohorts.map(c => {
    const r = _fhhClassify(c, ui.cohorts);
    const verdict = r.verdict ? FHH_VERDICTS[r.verdict] : null;
    const verdictCell = verdict
      ? '<span class="' + verdict.klass + '">' + _fhhEsc(verdict.label) + '</span>'
      : '<span class="fhh-neutral">—</span>';
    const focalMarker = c.is_focal
      ? '<span class="fhh-focal-marker">FOCAL</span>'
      : '';
    const ratioStr = (typeof r.h_ratio === 'number')
      ? r.h_ratio.toFixed(2) +
        (r.h_ref ? '<br><span class="fhh-citation">H_ref ' + r.h_ref.toExponential(2) + '</span>' : '')
      : '<span class="fhh-citation">no H_ref</span>';
    const citation = c.citation
      ? '<br><span class="fhh-citation">' + _fhhEsc(c.citation) + '</span>'
      : '';
    return '<tr>' +
      '<td class="fhh-cohort">' + focalMarker + _fhhEsc(c.cohort) + citation + '</td>' +
      '<td>' + (c.species ? '<i>' + _fhhEsc(c.species) + '</i>' : '—') + '</td>' +
      '<td class="fhh-num">' + (typeof r.F_ROH === 'number' ? r.F_ROH.toFixed(3) : '—') + '</td>' +
      '<td class="fhh-num">' + (typeof c.H_per_site === 'number' ? c.H_per_site.toExponential(2) : '—') + '</td>' +
      '<td class="fhh-num">' + ratioStr + '</td>' +
      '<td>' + verdictCell + '</td>' +
      '</tr>';
  }).join('');
  slot.innerHTML = '<table class="fhh-table">' + head + '<tbody>' + body + '</tbody></table>';
}

function _fhhRender() {
  const ui = _fhhEnsureState();
  _fhhRenderSummaryCards();
  _fhhRenderPlot();
  _fhhRenderTable();
  const badge = document.getElementById('fhhStatusBadge');
  const tableBadge = document.getElementById('fhhTableBadge');
  if (badge) {
    if (ui.cohorts.length === 0) {
      badge.textContent = 'scaffold · load hatchery_health.json to plot';
      badge.classList.add('planned');
      badge.classList.remove('ready');
    } else {
      const focal = _fhhFocalCohort();
      const verdict = focal ? _fhhClassify(focal, ui.cohorts).verdict : null;
      const verdictLabel = verdict ? FHH_VERDICTS[verdict].label : 'no focal verdict';
      badge.innerHTML = ui.cohorts.length + ' cohorts plotted · focal: ' +
        (verdict ? '<span class="' + FHH_VERDICTS[verdict].klass + '">' + _fhhEsc(verdictLabel) + '</span>' : verdictLabel);
      badge.classList.remove('planned');
      badge.classList.add('ready');
    }
  }
  if (tableBadge) {
    tableBadge.textContent = ui.cohorts.length + ' cohort' +
      (ui.cohorts.length === 1 ? '' : 's') + ' loaded';
  }
}

function _fhhExportCsv() {
  const ui = _fhhEnsureState();
  if (ui.cohorts.length === 0) return;
  const header = ['cohort','species','F_ROH','H_per_site','H_ref','H_ratio','verdict','verdict_label','citation','notes','is_focal'];
  const csvCell = v => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [header.join(',')];
  for (const c of ui.cohorts) {
    const r = _fhhClassify(c, ui.cohorts);
    const verdict = r.verdict ? FHH_VERDICTS[r.verdict] : null;
    lines.push([
      c.cohort, c.species, c.F_ROH, c.H_per_site, c.H_ref,
      r.h_ratio != null ? r.h_ratio.toFixed(4) : '',
      r.verdict || '', verdict ? verdict.label : '',
      c.citation, c.notes, c.is_focal ? 'true' : 'false',
    ].map(csvCell).join(','));
  }
  const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hatchery_health.csv';
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 250);
}

let _fhhWired = false;
function _fhhWire() {
  if (_fhhWired) return;
  _fhhWired = true;
  const $load  = document.getElementById('fhhLoadBtn');
  const $input = document.getElementById('fhhLoadInput');
  if ($load && $input) {
    $load.addEventListener('click', () => $input.click());
    $input.addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = ev => _fhhIngestText(ev.target.result, f.name);
      r.readAsText(f);
      $input.value = '';
    });
  }
  const $csv = document.getElementById('fhhExportCsvBtn');
  if ($csv) $csv.addEventListener('click', _fhhExportCsv);
  const $reset = document.getElementById('fhhResetBtn');
  if ($reset) $reset.addEventListener('click', () => {
    const ui = _fhhEnsureState();
    ui.cohorts = [];
    _fhhRender();
    if (typeof window !== 'undefined' && typeof window._bpRender === 'function') {
      try { window._bpRender(); } catch (e) { console.warn('[fhh] breeding refresh failed:', e); }
    }
  });
}

// -----------------------------------------------------------------------------
// Atlas-router lifecycle
// -----------------------------------------------------------------------------

export const PAGE9_META = {
  id: 'page9',
  stage: 'health',
  label: 'hatchery health',
};

export function refreshPage9(state) {
  if (state) _setActiveState(state);
  _fhhWire();
  _fhhRender();
}

export async function mount(root, atlasState, registry) {
  _fhhEnsureWindowState();
  _fhhWired = false;
  const legacyState = _buildLegacyState(atlasState);
  _setActiveState(legacyState);

  try { _fhhWire(); _fhhRender(); }
  catch (e) { console.warn('[page9.mount] initial render failed:', e); }

  if (atlasState.population) atlasState.population._page9State = legacyState;

  if (typeof window !== 'undefined') {
    window._fhhRender = _fhhRender;
    window._fhhEnsureState = _fhhEnsureState;
    window._fhhClassify = _fhhClassify;
    window._fhhFocalCohort = _fhhFocalCohort;
    window._fhhResolveHRef = _fhhResolveHRef;
    window._fhhIngestText = _fhhIngestText;
    window._fhhExportCsv = _fhhExportCsv;
    window._fhhParseTsv = _fhhParseTsv;
    window._fhhIsValidJson = _fhhIsValidJson;
    window.FHH_VERDICTS = FHH_VERDICTS;
  }
}

export async function unmount(root) {
  _setActiveState(null);
  _fhhWired = false;
}

function _buildLegacyState(atlasState) {
  const pop = atlasState.population || {};
  return Object.assign({}, pop);
}
