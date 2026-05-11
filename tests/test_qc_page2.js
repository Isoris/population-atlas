// tests/test_qc_page2.js
//
// Unit test for the page2 QC scaffold (Population Atlas, qc stage).
// Same static-scaffold shape as page1; no DOM use.
//
// Round 1 (2026-05-11): static scaffold migrated from legacy
// Population_atlas.html lines 851-934. Cards: "what this page shows" +
// QC thresholds + planned-panels grid (coverage histogram + missingness
// scatter). Wires to MODULE_QC outputs in round 2.

import * as page2 from '../atlases/population/pages/qc/page2.js';
import * as state from '../atlases/population/pages/qc/page2/_state.js';

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log('  ✓', label); }
  else      { fail++; console.log('  ✗', label, extra ? ' — ' + extra : ''); }
}
function group(name) { console.log('\n--- ' + name + ' ---'); }

group('page2.js: lifecycle entry-points');
check('exports mount',                       typeof page2.mount === 'function');
check('exports unmount',                     typeof page2.unmount === 'function');
check('exports refreshPage2 (wrapper)',      typeof page2.refreshPage2 === 'function');
check('exports renderPage2 (renderer)',      typeof page2.renderPage2 === 'function');

group('page2.js: PAGE2_META static-page metadata');
check('exports PAGE2_META',                  page2.PAGE2_META && typeof page2.PAGE2_META === 'object');
check('PAGE2_META.id === "page2"',           page2.PAGE2_META.id === 'page2');
check('PAGE2_META.stage === "qc"',           page2.PAGE2_META.stage === 'qc');
check('PAGE2_META.label === "QC"',           page2.PAGE2_META.label === 'QC');
check('PAGE2_META.static === true',          page2.PAGE2_META.static === true);

group('_state.js: live-binding pattern');
check('exports _pageState',                  '_pageState' in state);
check('exports _setActiveState',             typeof state._setActiveState === 'function');
check('_pageState starts null',              state._pageState === null);
state._setActiveState({ marker: 'A' });
check('_setActiveState mutates _pageState',  state._pageState && state._pageState.marker === 'A');
state._setActiveState(null);
check('_setActiveState(null) clears',        state._pageState === null);

group('refreshPage2(state) wrapper sets _pageState');
state._setActiveState(null);
const synthState = { marker: 'B' };
page2.refreshPage2(synthState);
check('_pageState set after refreshPage2(state)',
      state._pageState === synthState);
state._setActiveState(null);

console.log('\n=================');
console.log(`pass: ${pass}   fail: ${fail}`);
console.log('=================');
process.exit(fail > 0 ? 1 : 0);
