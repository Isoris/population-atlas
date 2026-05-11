// atlases/population/pages/qc/page2.js
// =============================================================================
// page2 — Population Atlas QC scaffold (stage: qc)
//
// Round-1 scaffold. Static HTML fragment with three cards: "what this page
// shows" descriptive copy, QC thresholds grid (mean_coverage / callable
// fraction / missingness / contamination / natora kinship), planned-panels
// grid (coverage histogram + missingness-vs-coverage scatter). No JS-driven
// rendering yet — wires to MODULE_QC outputs in round 2+.
//
// Source: legacy/Population_atlas.html lines 851-934 (#page2 body), extracted
// verbatim. Inline grid-template-columns moved to population.css.
// =============================================================================

import { _pageState, _setActiveState } from './page2/_state.js';

export function renderPage2(/* state */) { return; }

export const PAGE2_META = {
  id: 'page2',
  stage: 'qc',
  label: 'QC',
  static: true,
};

export function refreshPage2(state) {
  if (state) _setActiveState(state);
  return renderPage2(state || _pageState || {});
}

export async function mount(root, atlasState, registry) {
  const legacyState = _buildLegacyState(atlasState);
  _setActiveState(legacyState);
  try { refreshPage2(legacyState); }
  catch (e) { console.warn('page2.mount: refreshPage2 threw —', e); }
  if (atlasState.population) atlasState.population._page2State = legacyState;
}

export async function unmount(root) { _setActiveState(null); }

function _buildLegacyState(atlasState) {
  const pop = atlasState.population || {};
  return Object.assign({}, pop);
}
