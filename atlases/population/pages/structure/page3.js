// atlases/population/pages/structure/page3.js
// =============================================================================
// page3 — Population Atlas families & genetic clusters scaffold (stage: structure)
//
// Round-1 scaffold. Two-round structure-analysis design (all 226 + NAToRA-pruned
// 81) with six planned-panel slots: NGSadmix Q-bar (round 1 + round 2), kinship
// heatmap, NAToRA pruning diagram, PCAngsd PCA, evalAdmix residuals. No
// JS-driven rendering yet — wires to MODULE_2B in round 2+.
//
// Source: legacy/Population_atlas.html lines 939-1013 (#page3 body).
//
// Envelope-aware status annotations (2026-05-14): mount() probes the
// action pipeline for the three population layer types and appends a
// one-line summary inside each .panel-slot-foot showing how many
// captures are currently registered for that slot. See
// _SLOT_LAYER_MAPPING for the slot ↔ layer-type ↔ filter chain. Pure
// additive — the scaffold renders identically when no envelopes exist.
// =============================================================================

import { _pageState, _setActiveState } from './page3/_state.js';
import { listLayers, getLayer } from '../../shared/api_client.js';

export function renderPage3(/* state */) { return; }

export const PAGE3_META = {
  id: 'page3',
  stage: 'structure',
  label: 'families & clusters',
  static: true,
};

export function refreshPage3(state) {
  if (state) _setActiveState(state);
  return renderPage3(state || _pageState || {});
}

// ---------------------------------------------------------------------------
// Slot ↔ layer mapping
// ---------------------------------------------------------------------------
// Keys match data-pa-slot attributes in page3.html. Each entry describes
// how to count envelopes for that slot. A null `mapping` means "no
// action wired yet" — the badge advertises that explicitly so users
// know which scaffolds are still placeholders.
const _SLOT_LAYER_MAPPING = {
  ngsadmix_q_round1: { layer_type: 'ngsadmix_q',      slot_filter: null,                 hint: 'staging_ngsadmix_q_v0' },
  ngsadmix_q_round2: { layer_type: 'ngsadmix_q',      slot_filter: null,                 hint: 'staging_ngsadmix_q_v0' },
  ngsrelate_kinship: { layer_type: 'population_slot', slot_filter: 'ngsrelate_kinship',  hint: 'import_slot → staging_population_slot_v0' },
  pcangsd_pca:       { layer_type: 'population_slot', slot_filter: 'pcangsd_pca',        hint: 'import_slot → staging_population_slot_v0' },
  natora:            { mapping: null,                 hint: 'no action wired (NAToRA + ngsRelate output not yet ingested)' },
  evaladmix:         { mapping: null,                 hint: 'no action wired (evalAdmix output not yet ingested)' },
};

// Probe one slot: return { count, latest } where `latest` is the
// most-recent matching envelope's index row (or full envelope when
// slot-filtering required fetching payloads).
async function _probeSlot(rule) {
  if (rule.mapping === null) return { count: 0, latest: null, unwired: true };
  let rows;
  try {
    const list = await listLayers({
      layer_type: rule.layer_type, stage: 'staging', limit: 200,
    });
    rows = (list && list.layers) || [];
  } catch (_e) { return { count: 0, latest: null, error: true }; }

  if (rule.slot_filter == null) {
    return { count: rows.length, latest: rows[rows.length - 1] || null };
  }
  // Filter on payload.slot — needs a getLayer fetch per row.
  let matched = [];
  for (const row of rows) {
    try {
      const env = await getLayer(row.layer_id);
      const slot = env && env.payload && env.payload.slot;
      if (slot === rule.slot_filter) matched.push(env);
    } catch (_e) { continue; }
  }
  matched.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  return { count: matched.length, latest: matched[matched.length - 1] || null };
}

// Append a status line to the panel-slot's `.panel-slot-foot` div.
function _renderPanelEnvelopeStatus(panel, slotName, result) {
  const foot = panel.querySelector('.panel-slot-foot');
  if (!foot) return;
  let line = foot.querySelector('.pa-envelope-status');
  if (!line) {
    line = (typeof document !== 'undefined')
      ? document.createElement('div') : { className: '', textContent: '', title: '' };
    line.className = 'pa-envelope-status';
    if (line.style) {
      Object.assign(line.style, {
        marginTop: '4px',
        fontSize: '11px',
        fontStyle: 'italic',
        color: '#888',
      });
    }
    foot.appendChild(line);
  }
  const rule = _SLOT_LAYER_MAPPING[slotName] || {};
  if (result.unwired) {
    line.textContent = `◌  ${rule.hint || 'no action wired'}`;
    line.title = '';
    return;
  }
  if (result.error) {
    line.textContent = '◌  envelope index unreachable';
    line.title = '';
    return;
  }
  if (result.count === 0) {
    line.textContent = `◌  0 captures (run \`atlas_action submit\` against ${rule.hint || 'the matching action'})`;
    line.title = '';
    return;
  }
  const latest = result.latest || {};
  const layer_id = latest.layer_id || (latest.layer_id || '?');
  line.textContent =
    `●  ${result.count} capture${result.count === 1 ? '' : 's'} ` +
    `· latest: ${layer_id}`;
  const created = latest.created_at || (latest.created_at || '?');
  line.title =
    `layer_type=${rule.layer_type}` +
    (rule.slot_filter ? `, payload.slot=${rule.slot_filter}` : '') +
    `, created_at=${created}`;
}

async function _annotateAllPanels(root) {
  const panels = (root && typeof root.querySelectorAll === 'function')
    ? root.querySelectorAll('[data-pa-slot]')
    : (typeof document !== 'undefined'
        ? document.querySelectorAll('[data-pa-slot]')
        : []);
  if (!panels || panels.length === 0) return;
  // Probe sequentially — the index is tiny and serializing keeps the
  // mocked-fetch tests deterministic.
  for (const panel of panels) {
    const slotName = panel.getAttribute('data-pa-slot');
    const rule = _SLOT_LAYER_MAPPING[slotName];
    if (!rule) continue;
    const result = await _probeSlot(rule);
    _renderPanelEnvelopeStatus(panel, slotName, result);
  }
}

export async function mount(root, atlasState, registry) {
  const legacyState = _buildLegacyState(atlasState);
  _setActiveState(legacyState);
  try { refreshPage3(legacyState); }
  catch (e) { console.warn('page3.mount: refreshPage3 threw —', e); }
  if (atlasState.population) atlasState.population._page3State = legacyState;

  // Envelope status annotation runs asynchronously after the synchronous
  // scaffold render. Any failure leaves the panel-slot-foot text alone.
  _annotateAllPanels(root).catch(
    (e) => console.warn('page3.mount: _annotateAllPanels threw —', e),
  );
}

export async function unmount(root) { _setActiveState(null); }

function _buildLegacyState(atlasState) {
  const pop = atlasState.population || {};
  return Object.assign({}, pop);
}
