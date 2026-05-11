// atlases/population/pages/structure/page4.js
// =============================================================================
// page4 — Population Atlas heterozygosity cohort-summary lens (stage: structure)
//
// Round-1 scaffold. Pure cross-reference card pointing to the Diversity Atlas's
// deeper per-sample tables. Cohort-level headline numbers (mean H, median H,
// ρ(H,F_ROH), KW H × K=8) + Diversity-Atlas depth pointer + caveats. No
// JS-driven rendering — equivalent to the Inversion Atlas page5 (help) pattern.
//
// Source: legacy/Population_atlas.html lines 1018-1097 (#page4 body).
// =============================================================================

import { _pageState, _setActiveState } from './page4/_state.js';

export function renderPage4(/* state */) { return; }

export const PAGE4_META = {
  id: 'page4',
  stage: 'structure',
  label: 'heterozygosity ↗',
  static: true,
};

export function refreshPage4(state) {
  if (state) _setActiveState(state);
  return renderPage4(state || _pageState || {});
}

export async function mount(root, atlasState, registry) {
  const legacyState = _buildLegacyState(atlasState);
  _setActiveState(legacyState);
  try { refreshPage4(legacyState); }
  catch (e) { console.warn('page4.mount: refreshPage4 threw —', e); }
  if (atlasState.population) atlasState.population._page4State = legacyState;
}

export async function unmount(root) { _setActiveState(null); }

function _buildLegacyState(atlasState) {
  const pop = atlasState.population || {};
  return Object.assign({}, pop);
}
