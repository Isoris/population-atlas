// tests/smoke_qc_page1_round1.mjs
//
// Round-1 mount/render/unmount lifecycle smoke test for page1 samples
// (Population Atlas, qc stage). Static-scaffold pattern.

const WORKSPACE = process.env.WORKSPACE || '/home/claude/workspace/atlas-workspace';
const { installDom, resetNodes, ensureNode } = await import(`${WORKSPACE}/tests/_dom_polyfill.mjs`);
installDom();
const page1 = await import(`${WORKSPACE}/atlases/population/pages/qc/page1.js`);
const state = await import(`${WORKSPACE}/atlases/population/pages/qc/page1/_state.js`);

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log('  ✓', label); }
  else      { fail++; console.log('  ✗', label, extra ? ' — ' + extra : ''); }
}
function group(name) { console.log('\n--- ' + name + ' ---'); }

group('Module exports');
check('mount export',        typeof page1.mount === 'function');
check('unmount export',      typeof page1.unmount === 'function');
check('refreshPage1 export', typeof page1.refreshPage1 === 'function');

group('Smoke: mount() runs without throwing');
resetNodes();
const root = ensureNode('app-root');
const atlasState = { population: {} };
const registry = {};
let err = null;
try { await page1.mount(root, atlasState, registry); }
catch (e) { err = e; }
check('mount() returned cleanly', err === null, err ? err.message : '');

group('Smoke: _pageState live-binding');
check('_pageState set after mount',                       !!state._pageState);
check('atlasState.population._page1State stashed',        atlasState.population._page1State !== undefined);
check('stash identity-equal to _pageState',               atlasState.population._page1State === state._pageState);

group('Smoke: refreshPage1(state) re-render path');
const reState = { marker: 'B' };
let rerr = null;
try { page1.refreshPage1(reState); }
catch (e) { rerr = e; }
check('refreshPage1(state) does not throw',               rerr === null, rerr ? rerr.message : '');
check('_pageState updated to reState',                    state._pageState === reState);

group('Smoke: unmount()');
let uerr = null;
try { await page1.unmount(root); }
catch (e) { uerr = e; }
check('unmount() does not throw',                         uerr === null, uerr ? uerr.message : '');
check('_pageState cleared by unmount',                    state._pageState === null);

console.log('\n=================');
console.log(`pass: ${pass}   fail: ${fail}`);
console.log('=================');
process.exit(fail > 0 ? 1 : 0);
