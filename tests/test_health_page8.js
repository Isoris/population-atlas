// tests/test_health_page8.js
//
// Unit test for the page8 breeding page (Population Atlas, health stage).
// Round-1 migration of the scaffold's inline breeding-page JS — verifies
// the lifecycle exports + PAGE8_META shape. The page's behaviour (auto-
// derivation hooks, JSON ingest, rendering) is exercised by the smoke
// test (smoke_health_page8_round1.mjs) which provides a DOM polyfill.
//
// This unit test stays DOM-free; the only side effect of mount() this
// test triggers is the `window._bp*` legacy-contract exposure. We assert
// those land on globalThis after mount().

import * as page8 from '../atlases/population/pages/health/page8.js';
import * as state from '../atlases/population/pages/health/page8/_state.js';

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log('  ✓', label); }
  else      { fail++; console.log('  ✗', label, extra ? ' — ' + extra : ''); }
}
function group(name) { console.log('\n--- ' + name + ' ---'); }

// -----------------------------------------------------------------------------
group('page8.js: lifecycle entry-points');
check('exports mount',                       typeof page8.mount === 'function');
check('exports unmount',                     typeof page8.unmount === 'function');
check('exports refreshPage8 (wrapper)',      typeof page8.refreshPage8 === 'function');

// -----------------------------------------------------------------------------
group('page8.js: PAGE8_META (page-with-JS, no static flag)');
check('exports PAGE8_META',                  page8.PAGE8_META && typeof page8.PAGE8_META === 'object');
check('PAGE8_META.id === "page8"',           page8.PAGE8_META.id === 'page8');
check('PAGE8_META.stage === "health"',       page8.PAGE8_META.stage === 'health');
check('PAGE8_META.label === "breeding"',     page8.PAGE8_META.label === 'breeding');
check('PAGE8_META.static NOT set',           !('static' in page8.PAGE8_META) || page8.PAGE8_META.static !== true);

// -----------------------------------------------------------------------------
group('_state.js: live-binding pattern');
check('exports _pageState',                  '_pageState' in state);
check('exports _setActiveState',             typeof state._setActiveState === 'function');
check('_pageState starts null',              state._pageState === null);
state._setActiveState({ marker: 'A' });
check('_setActiveState mutates _pageState',  state._pageState && state._pageState.marker === 'A');
state._setActiveState(null);

// -----------------------------------------------------------------------------
// The mount() lifecycle exposes legacy `window._bp*` exports for tests +
// cross-page hand-off (page9 → page8 hatchery-health-row dispatch).
// We can't test mount() without DOM here, but we can verify that calling
// it with a minimal stub DOES at minimum populate window.BP_SOURCE_DEFS
// (which is set inside mount() — no DOM ops required for that line).
//
// Minimal stub DOM polyfill — just enough for _bpRender's getElementById
// returns-null branches.
group('mount() exposes legacy window._bp* + BP_* contracts (smoke-light)');
globalThis.window = globalThis;
globalThis.document = {
  getElementById: (_id) => null,
  createElement: (_tag) => ({ click() {}, remove() {} }),
  body: { appendChild() {} },
};
const atlasState = { population: {} };
const registry = {};
const root = {};
let mountErr = null;
try { await page8.mount(root, atlasState, registry); }
catch (e) { mountErr = e; }
check('mount() does not throw on null-DOM stub',          mountErr === null, mountErr ? mountErr.message : '');
check('window._bpRender exposed',                          typeof window._bpRender === 'function');
check('window._bpEnsureState exposed',                     typeof window._bpEnsureState === 'function');
check('window._bpAllRows exposed',                         typeof window._bpAllRows === 'function');
check('window._bpAutoDiversityRows exposed',               typeof window._bpAutoDiversityRows === 'function');
check('window._bpAutoRelatednessRows exposed',             typeof window._bpAutoRelatednessRows === 'function');
check('window._bpAutoBurdenRows exposed',                  typeof window._bpAutoBurdenRows === 'function');
check('window._bpAutoInversionRows exposed',               typeof window._bpAutoInversionRows === 'function');
check('window._bpAutoMarkerRows exposed',                  typeof window._bpAutoMarkerRows === 'function');
check('window._bpAutoHatcheryHealthRow exposed',           typeof window._bpAutoHatcheryHealthRow === 'function');
check('window._bpIngestText exposed',                      typeof window._bpIngestText === 'function');
check('window._bpExportCsv exposed',                       typeof window._bpExportCsv === 'function');
check('window._bpParseTsv exposed',                        typeof window._bpParseTsv === 'function');
check('window._bpIsValidJson exposed',                     typeof window._bpIsValidJson === 'function');
check('window.BP_SOURCE_DEFS exposed',                     window.BP_SOURCE_DEFS && typeof window.BP_SOURCE_DEFS === 'object');
check('window.BP_STATUS_LABELS exposed',                   window.BP_STATUS_LABELS && typeof window.BP_STATUS_LABELS === 'object');

// -----------------------------------------------------------------------------
group('BP_SOURCE_DEFS: round-1 contract shape');
const src = window.BP_SOURCE_DEFS;
check('Diversity source defined',                          src.Diversity && typeof src.Diversity === 'object');
check('Relatedness source defined',                        src.Relatedness && typeof src.Relatedness === 'object');
check('Burden source defined',                             src.Burden && typeof src.Burden === 'object');
check('Inversions source defined',                         src.Inversions && typeof src.Inversions === 'object');
check('Markers source defined',                            src.Markers && typeof src.Markers === 'object');
check('Diversity default_status === "green"',              src.Diversity.default_status === 'green');
check('Relatedness default_status === "yellow"',           src.Relatedness.default_status === 'yellow');
check('Burden default_status === "red"',                   src.Burden.default_status === 'red');

// -----------------------------------------------------------------------------
group('BP_STATUS_LABELS: green/yellow/red traffic-light labels');
check('green → "useful"',                                  window.BP_STATUS_LABELS.green === 'useful');
check('yellow → "review"',                                 window.BP_STATUS_LABELS.yellow === 'review');
check('red → "caution"',                                   window.BP_STATUS_LABELS.red === 'caution');

// -----------------------------------------------------------------------------
group('_bpAutoDiversityRows: top-1% F_ROH cut');
window.state = {};
window.state.perSampleStats = [
  { sample: 'S1', F_ROH: 0.10 },
  { sample: 'S2', F_ROH: 0.20 },
  { sample: 'S3', F_ROH: 0.30 },
  { sample: 'S4', F_ROH: 0.40 }, // top
  { sample: 'S5', F_ROH: 0.50 }, // top
];
const divRows = window._bpAutoDiversityRows();
check('flags at least one sample at top-1% F_ROH',         divRows.length >= 1);
const flagged = divRows.find(r => r.sample === 'S5');
check('top sample S5 is flagged',                          !!flagged);
check('flagged row source === "Diversity"',                flagged && flagged.source === 'Diversity');
check('flagged row status === "red"',                      flagged && flagged.status === 'red');
check('flagged row _origin === "auto:froh_top"',           flagged && flagged._origin === 'auto:froh_top');

// -----------------------------------------------------------------------------
group('_bpIsValidJson + _bpParseTsv (pure helpers)');
check('_bpIsValidJson({rows:[]}) === true',                window._bpIsValidJson({ rows: [] }) === true);
check('_bpIsValidJson({}) === false',                      window._bpIsValidJson({}) === false);
check('_bpIsValidJson(null) === false',                    window._bpIsValidJson(null) === false);
const tsv = 'sample\thighlight\tvalue\tsource\tstatus\nCGA001\thigh inb.\tF_ROH=0.4\tDiversity\tred';
const parsed = window._bpParseTsv(tsv);
check('_bpParseTsv parses 1 row',                          parsed && parsed.rows && parsed.rows.length === 1);
check('parsed row.sample === "CGA001"',                    parsed && parsed.rows[0].sample === 'CGA001');
check('parsed row.status === "red"',                       parsed && parsed.rows[0].status === 'red');

// -----------------------------------------------------------------------------
group('unmount() clears _pageState');
let unmountErr = null;
try { await page8.unmount(root); }
catch (e) { unmountErr = e; }
check('unmount() does not throw',                          unmountErr === null, unmountErr ? unmountErr.message : '');
check('_pageState cleared by unmount',                     state._pageState === null);

// -----------------------------------------------------------------------------
console.log('\n=================');
console.log(`pass: ${pass}   fail: ${fail}`);
console.log('=================');
process.exit(fail > 0 ? 1 : 0);
