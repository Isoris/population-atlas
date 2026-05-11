// tests/test_structure_page4.js
//
// Unit test for the page4 heterozygosity cohort-summary scaffold
// (Population Atlas, structure stage).
//
// Round 1 (2026-05-11): pure cross-reference card. Cohort-level headline
// numbers (mean H, median H, ρ(H,F_ROH), KW H × K=8) + Diversity-Atlas
// depth pointer + caveats. No interactive renderer.

import * as page4 from '../atlases/population/pages/structure/page4.js';
import * as state from '../atlases/population/pages/structure/page4/_state.js';

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log('  ✓', label); }
  else      { fail++; console.log('  ✗', label, extra ? ' — ' + extra : ''); }
}
function group(name) { console.log('\n--- ' + name + ' ---'); }

group('page4.js: lifecycle entry-points');
check('exports mount',                       typeof page4.mount === 'function');
check('exports unmount',                     typeof page4.unmount === 'function');
check('exports refreshPage4',                typeof page4.refreshPage4 === 'function');
check('exports renderPage4',                 typeof page4.renderPage4 === 'function');

group('page4.js: PAGE4_META');
check('PAGE4_META.id === "page4"',                page4.PAGE4_META.id === 'page4');
check('PAGE4_META.stage === "structure"',         page4.PAGE4_META.stage === 'structure');
check('PAGE4_META.label === "heterozygosity ↗"',  page4.PAGE4_META.label === 'heterozygosity ↗');
check('PAGE4_META.static === true',               page4.PAGE4_META.static === true);

group('_state.js: live-binding pattern');
check('exports _pageState',                  '_pageState' in state);
check('exports _setActiveState',             typeof state._setActiveState === 'function');
check('_pageState starts null',              state._pageState === null);
state._setActiveState({ marker: 'A' });
check('_setActiveState mutates _pageState',  state._pageState && state._pageState.marker === 'A');
state._setActiveState(null);

console.log('\n=================');
console.log(`pass: ${pass}   fail: ${fail}`);
console.log('=================');
process.exit(fail > 0 ? 1 : 0);
