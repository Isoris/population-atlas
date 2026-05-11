// tests/smoke_qc_page2_round1.mjs
//
// Round-1 mount/render/unmount lifecycle smoke for page2 QC scaffold.

const WORKSPACE = process.env.WORKSPACE || '/home/claude/workspace/atlas-workspace';
const { installDom, resetNodes, ensureNode } = await import(`${WORKSPACE}/tests/_dom_polyfill.mjs`);
installDom();
const page2 = await import(`${WORKSPACE}/atlases/population/pages/qc/page2.js`);
const state = await import(`${WORKSPACE}/atlases/population/pages/qc/page2/_state.js`);

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log('  ✓', label); }
  else      { fail++; console.log('  ✗', label, extra ? ' — ' + extra : ''); }
}
function group(name) { console.log('\n--- ' + name + ' ---'); }

group('Module exports');
check('mount export',        typeof page2.mount === 'function');
check('unmount export',      typeof page2.unmount === 'function');
check('refreshPage2 export', typeof page2.refreshPage2 === 'function');

group('Smoke: mount() / unmount() lifecycle');
resetNodes();
const root = ensureNode('app-root');
const atlasState = { population: {} };
let err = null;
try { await page2.mount(root, atlasState, {}); } catch (e) { err = e; }
check('mount() returned cleanly',                    err === null, err ? err.message : '');
check('atlasState.population._page2State stashed',   atlasState.population._page2State !== undefined);
check('_pageState set after mount',                  !!state._pageState);

let uerr = null;
try { await page2.unmount(root); } catch (e) { uerr = e; }
check('unmount() does not throw',                    uerr === null, uerr ? uerr.message : '');
check('_pageState cleared by unmount',               state._pageState === null);

console.log('\n=================');
console.log(`pass: ${pass}   fail: ${fail}`);
console.log('=================');
process.exit(fail > 0 ? 1 : 0);
