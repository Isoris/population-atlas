// tests/test_structure_page3.js
//
// Unit test for the page3 families & genetic clusters scaffold
// (Population Atlas, structure stage).
//
// Round 1 (2026-05-11): static scaffold migrated from legacy
// Population_atlas.html lines 939-1013. Six planned-panel slots
// (NGSadmix Q-bars × 2, kinship heatmap, NAToRA diagram, PCAngsd PCA,
// evalAdmix residuals). Wires to MODULE_2B outputs in round 2.

import * as page3 from '../atlases/population/pages/structure/page3.js';
import * as state from '../atlases/population/pages/structure/page3/_state.js';

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log('  ✓', label); }
  else      { fail++; console.log('  ✗', label, extra ? ' — ' + extra : ''); }
}
function group(name) { console.log('\n--- ' + name + ' ---'); }

group('page3.js: lifecycle entry-points');
check('exports mount',                       typeof page3.mount === 'function');
check('exports unmount',                     typeof page3.unmount === 'function');
check('exports refreshPage3 (wrapper)',      typeof page3.refreshPage3 === 'function');
check('exports renderPage3 (renderer)',      typeof page3.renderPage3 === 'function');

group('page3.js: PAGE3_META');
check('exports PAGE3_META',                       page3.PAGE3_META && typeof page3.PAGE3_META === 'object');
check('PAGE3_META.id === "page3"',                page3.PAGE3_META.id === 'page3');
check('PAGE3_META.stage === "structure"',         page3.PAGE3_META.stage === 'structure');
check('PAGE3_META.label === "families & clusters"', page3.PAGE3_META.label === 'families & clusters');
check('PAGE3_META.static === true',               page3.PAGE3_META.static === true);

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
