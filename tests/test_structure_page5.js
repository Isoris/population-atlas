// tests/test_structure_page5.js
//
// Unit test for the page5 diversity cohort-summary scaffold
// (Population Atlas, structure stage). Cohort-level θπ headline numbers
// + available-scales grid + Diversity-Atlas depth pointer.

import * as page5 from '../atlases/population/pages/structure/page5.js';
import * as state from '../atlases/population/pages/structure/page5/_state.js';

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log('  ✓', label); }
  else      { fail++; console.log('  ✗', label, extra ? ' — ' + extra : ''); }
}
function group(name) { console.log('\n--- ' + name + ' ---'); }

group('page5.js: lifecycle entry-points');
check('exports mount',                       typeof page5.mount === 'function');
check('exports unmount',                     typeof page5.unmount === 'function');
check('exports refreshPage5',                typeof page5.refreshPage5 === 'function');
check('exports renderPage5',                 typeof page5.renderPage5 === 'function');

group('page5.js: PAGE5_META');
check('PAGE5_META.id === "page5"',                page5.PAGE5_META.id === 'page5');
check('PAGE5_META.stage === "structure"',         page5.PAGE5_META.stage === 'structure');
check('PAGE5_META.label === "diversity ↗"',       page5.PAGE5_META.label === 'diversity ↗');
check('PAGE5_META.static === true',               page5.PAGE5_META.static === true);

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
