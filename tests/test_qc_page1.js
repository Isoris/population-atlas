// tests/test_qc_page1.js
//
// Unit test for the page1 samples scaffold (Population Atlas, qc stage).
// Verifies the round-1 thin-loader-stub export shape — no DOM use.
//
// Round 1 (2026-05-11): static scaffold migrated from legacy
// Population_atlas.html lines 724-846. Pattern matches the Inversion
// Atlas's page5 (help) + Genome Atlas's page1 — pure declarative HTML,
// no JS-driven rendering yet. The renderer (refreshPage1) is a degenerate
// no-op; phase B wires the sortable JSON-driven samples table.

import * as page1 from '../atlases/population/pages/qc/page1.js';
import * as state from '../atlases/population/pages/qc/page1/_state.js';

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log('  ✓', label); }
  else      { fail++; console.log('  ✗', label, extra ? ' — ' + extra : ''); }
}
function group(name) { console.log('\n--- ' + name + ' ---'); }

// -----------------------------------------------------------------------------
group('page1.js: lifecycle entry-points');
check('exports mount',                       typeof page1.mount === 'function');
check('exports unmount',                     typeof page1.unmount === 'function');
check('exports refreshPage1 (wrapper)',      typeof page1.refreshPage1 === 'function');
check('exports renderPage1 (renderer)',      typeof page1.renderPage1 === 'function');

// -----------------------------------------------------------------------------
group('page1.js: PAGE1_META static-page metadata');
check('exports PAGE1_META',                  page1.PAGE1_META && typeof page1.PAGE1_META === 'object');
check('PAGE1_META.id === "page1"',           page1.PAGE1_META.id === 'page1');
check('PAGE1_META.stage === "qc"',           page1.PAGE1_META.stage === 'qc');
check('PAGE1_META.label === "samples"',      page1.PAGE1_META.label === 'samples');
check('PAGE1_META.static === true',          page1.PAGE1_META.static === true);

// -----------------------------------------------------------------------------
group('_state.js: live-binding pattern');
check('exports _pageState',                  '_pageState' in state);
check('exports _setActiveState',             typeof state._setActiveState === 'function');
check('_pageState starts null',              state._pageState === null);
state._setActiveState({ marker: 'A' });
check('_setActiveState mutates _pageState',  state._pageState && state._pageState.marker === 'A');
state._setActiveState(null);
check('_setActiveState(null) clears',        state._pageState === null);

// -----------------------------------------------------------------------------
group('Pure helpers: renderPage1 is a no-op (static scaffold)');
let r1 = undefined;
let r1err = null;
try { r1 = page1.renderPage1({ foo: 1 }); } catch (e) { r1err = e; }
check('renderPage1(state) returns undefined (no-op)',
      r1 === undefined && r1err === null,
      r1err ? r1err.message : `actual: ${r1}`);

// -----------------------------------------------------------------------------
group('refreshPage1(state) wrapper sets _pageState as a side effect');
state._setActiveState(null);
const synthState = { marker: 'B' };
page1.refreshPage1(synthState);
check('_pageState set after refreshPage1(state)',
      state._pageState === synthState);

// -----------------------------------------------------------------------------
group('refreshPage1() with no args: degenerate fallback (does not throw)');
state._setActiveState({ marker: 'C' });
let fbOK = true; let fbErr = null;
try { page1.refreshPage1(); }
catch (e) { fbOK = false; fbErr = e; }
check('refreshPage1() no-arg fallback runs without throwing',
      fbOK, fbErr ? fbErr.message : '');

state._setActiveState(null);

// -----------------------------------------------------------------------------
console.log('\n=================');
console.log(`pass: ${pass}   fail: ${fail}`);
console.log('=================');
process.exit(fail > 0 ? 1 : 0);
