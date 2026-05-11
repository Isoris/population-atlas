// atlases/population/pages/structure/page5.js
// =============================================================================
// page5 — Population Atlas diversity cohort-summary lens (stage: structure)
//
// Round-1 scaffold. Pure cross-reference card. Cohort-level headline θπ
// numbers + available-scales grid + Diversity-Atlas depth pointer. No
// JS-driven rendering.
//
// Source: legacy/Population_atlas.html lines 1103-1206 (#page5 body).
// =============================================================================

import { _pageState, _setActiveState } from './page5/_state.js';

export function renderPage5(/* state */) { return; }

export const PAGE5_META = {
  id: 'page5',
  stage: 'structure',
  label: 'diversity ↗',
  static: true,
};

export function refreshPage5(state) {
  if (state) _setActiveState(state);
  return renderPage5(state || _pageState || {});
}

export async function mount(root, atlasState, registry) {
  const legacyState = _buildLegacyState(atlasState);
  _setActiveState(legacyState);
  try { refreshPage5(legacyState); }
  catch (e) { console.warn('page5.mount: refreshPage5 threw —', e); }
  if (atlasState.population) atlasState.population._page5State = legacyState;
}

export async function unmount(root) { _setActiveState(null); }

function _buildLegacyState(atlasState) {
  const pop = atlasState.population || {};
  return Object.assign({}, pop);
}
