// atlases/population/pages/structure/page6.js
// =============================================================================
// page6 — Population Atlas inbreeding cohort-summary lens (stage: structure)
//
// Round-1 scaffold. Pure cross-reference card. Cohort-level F_ROH headline
// numbers + ROH bin-schema grid + Diversity-Atlas depth pointer. No JS-driven
// rendering.
//
// Source: legacy/Population_atlas.html lines 1211-1307 (#page6 body).
// =============================================================================

import { _pageState, _setActiveState } from './page6/_state.js';

export function renderPage6(/* state */) { return; }

export const PAGE6_META = {
  id: 'page6',
  stage: 'structure',
  label: 'inbreeding ↗',
  static: true,
};

export function refreshPage6(state) {
  if (state) _setActiveState(state);
  return renderPage6(state || _pageState || {});
}

export async function mount(root, atlasState, registry) {
  const legacyState = _buildLegacyState(atlasState);
  _setActiveState(legacyState);
  try { refreshPage6(legacyState); }
  catch (e) { console.warn('page6.mount: refreshPage6 threw —', e); }
  if (atlasState.population) atlasState.population._page6State = legacyState;
}

export async function unmount(root) { _setActiveState(null); }

function _buildLegacyState(atlasState) {
  const pop = atlasState.population || {};
  return Object.assign({}, pop);
}
