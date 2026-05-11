// atlases/population/pages/qc/page1.js
// =============================================================================
// page1 — Population Atlas samples / orientation table (stage: qc)
//
// Round-1 scaffold. Static HTML fragment with three cards: "what this page
// shows" descriptive copy, planned-columns field schema table, and an ASCII
// mock-up of the eventual sortable table. No JS-driven rendering yet — the
// sortable table ships when the MODULE_2B per-sample JSON layer lands
// (registered as `per_sample_stats` in layers.registry.json).
//
// Source: legacy/Population_atlas.html lines 724-846 (#page1 body), extracted
// verbatim. Inline styles on the ASCII block were lifted into population.css
// as .pop-ascii-block / .pop-ascii-foot so the fragment renders identically
// without inline CSS.
//
// Pattern: static-scaffold (matches the Inversion Atlas page5 help-page +
// Genome Atlas page1 templates). mount() builds a no-op _pageState;
// unmount() clears it. Future rounds wire refreshPage1() to a real JSON
// loader + sortable-table renderer.
// =============================================================================

import { _pageState, _setActiveState } from './page1/_state.js';

export function renderPage1(/* state */) {
  // No-op. Scaffold is static HTML. Round 2+ wires the sortable table.
  return;
}

export const PAGE1_META = {
  id: 'page1',
  stage: 'qc',
  label: 'samples',
  static: true,
};

export function refreshPage1(state) {
  if (state) _setActiveState(state);
  return renderPage1(state || _pageState || {});
}

export async function mount(root, atlasState, registry) {
  const legacyState = _buildLegacyState(atlasState);
  _setActiveState(legacyState);

  try { refreshPage1(legacyState); }
  catch (e) { console.warn('page1.mount: refreshPage1 threw —', e); }

  if (atlasState.population) atlasState.population._page1State = legacyState;
}

export async function unmount(root) {
  _setActiveState(null);
}

function _buildLegacyState(atlasState) {
  const pop = atlasState.population || {};
  return Object.assign({}, pop);
}
