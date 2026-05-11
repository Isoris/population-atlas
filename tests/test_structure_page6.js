// tests/test_structure_page6.js
//
// Unit test for the page6 inbreeding cohort-summary scaffold
// (Population Atlas, structure stage). Cohort-level F_ROH headline
// numbers + ROH bin-schema grid + Diversity-Atlas depth pointer.

import * as page6 from '../atlases/population/pages/structure/page6.js';
import * as state from '../atlases/population/pages/structure/page6/_state.js';

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log('  ✓', label); }
  else      { fail++; console.log('  ✗', label, extra ? ' — ' + extra : ''); }
}
function group(name) { console.log('\n--- ' + name + ' ---'); }

group('page6.js: lifecycle entry-points');
check('exports mount',                       typeof page6.mount === 'function');
check('exports unmount',                     typeof page6.unmount === 'function');
check('exports refreshPage6',                typeof page6.refreshPage6 === 'function');
check('exports renderPage6',                 typeof page6.renderPage6 === 'function');

group('page6.js: PAGE6_META');
check('PAGE6_META.id === "page6"',                page6.PAGE6_META.id === 'page6');
check('PAGE6_META.stage === "structure"',         page6.PAGE6_META.stage === 'structure');
check('PAGE6_META.label === "inbreeding ↗"',      page6.PAGE6_META.label === 'inbreeding ↗');
check('PAGE6_META.static === true',               page6.PAGE6_META.static === true);

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
