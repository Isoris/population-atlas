// tests/test_help_page7.js
//
// Unit test for the page7 about / help page (Population Atlas, help stage).
// Static help page mirroring the Inversion Atlas page5 + Genome Atlas
// page1 templates.

import * as page7 from '../atlases/population/pages/help/page7.js';
import * as state from '../atlases/population/pages/help/page7/_state.js';

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log('  ✓', label); }
  else      { fail++; console.log('  ✗', label, extra ? ' — ' + extra : ''); }
}
function group(name) { console.log('\n--- ' + name + ' ---'); }

group('page7.js: lifecycle entry-points');
check('exports mount',                       typeof page7.mount === 'function');
check('exports unmount',                     typeof page7.unmount === 'function');
check('exports refreshPage7',                typeof page7.refreshPage7 === 'function');
check('exports renderPage7',                 typeof page7.renderPage7 === 'function');

group('page7.js: PAGE7_META');
check('PAGE7_META.id === "page7"',                page7.PAGE7_META.id === 'page7');
check('PAGE7_META.stage === "help"',              page7.PAGE7_META.stage === 'help');
check('PAGE7_META.label === "about"',             page7.PAGE7_META.label === 'about');
check('PAGE7_META.static === true',               page7.PAGE7_META.static === true);

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
