// atlases/population/pages/help/page7.js
// =============================================================================
// page7 — Population Atlas about / help page (stage: help)
//
// Round-1 scaffold. Static help page mirroring the Inversion Atlas page5 +
// Genome Atlas page1 templates. Eight cards: what-this-is, four-atlas family
// table (ADR-14), why pages 4/5/6 are summary-only, data-sources grid, phasing
// roadmap, glossary, cross-references, what's-new in v1.3 / v1.2. Pure
// declarative HTML; no JS-driven rendering.
//
// Source: legacy/Population_atlas.html lines 1676-1931 (#page7 body). Inline
// `style="color: var(--accent);"` on the <a> tags was lifted into population.css
// as .pop-link-accent so the fragment renders identically without inline CSS.
// =============================================================================

import { _pageState, _setActiveState } from './page7/_state.js';

export function renderPage7(/* state */) { return; }

export const PAGE7_META = {
  id: 'page7',
  stage: 'help',
  label: 'about',
  static: true,
};

export function refreshPage7(state) {
  if (state) _setActiveState(state);
  return renderPage7(state || _pageState || {});
}

export async function mount(root, atlasState, registry) {
  const legacyState = _buildLegacyState(atlasState);
  _setActiveState(legacyState);
  try { refreshPage7(legacyState); }
  catch (e) { console.warn('page7.mount: refreshPage7 threw —', e); }
  if (atlasState.population) atlasState.population._page7State = legacyState;
}

export async function unmount(root) { _setActiveState(null); }

function _buildLegacyState(atlasState) {
  const pop = atlasState.population || {};
  return Object.assign({}, pop);
}
