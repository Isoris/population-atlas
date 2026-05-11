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
// =============================================================================

import { _pageState, _setActiveState } from './page3/_state.js';

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

export async function mount(root, atlasState, registry) {
  const legacyState = _buildLegacyState(atlasState);
  _setActiveState(legacyState);
  try { refreshPage3(legacyState); }
  catch (e) { console.warn('page3.mount: refreshPage3 threw —', e); }
  if (atlasState.population) atlasState.population._page3State = legacyState;
}

export async function unmount(root) { _setActiveState(null); }

function _buildLegacyState(atlasState) {
  const pop = atlasState.population || {};
  return Object.assign({}, pop);
}
