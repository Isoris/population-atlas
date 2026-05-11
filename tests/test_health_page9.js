// tests/test_health_page9.js
//
// Unit test for the page9 hatchery-health F_ROH × H plane (Population
// Atlas, health stage). Round-1 migration of the scaffold's inline
// hatchery-health JS — verifies lifecycle exports + PAGE9_META + the
// four-quadrant verdict logic (pure function, no DOM needed).

import * as page9 from '../atlases/population/pages/health/page9.js';
import * as state from '../atlases/population/pages/health/page9/_state.js';

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log('  ✓', label); }
  else      { fail++; console.log('  ✗', label, extra ? ' — ' + extra : ''); }
}
function group(name) { console.log('\n--- ' + name + ' ---'); }

// -----------------------------------------------------------------------------
group('page9.js: lifecycle entry-points');
check('exports mount',                       typeof page9.mount === 'function');
check('exports unmount',                     typeof page9.unmount === 'function');
check('exports refreshPage9 (wrapper)',      typeof page9.refreshPage9 === 'function');

// -----------------------------------------------------------------------------
group('page9.js: PAGE9_META (page-with-JS)');
check('exports PAGE9_META',                            page9.PAGE9_META && typeof page9.PAGE9_META === 'object');
check('PAGE9_META.id === "page9"',                     page9.PAGE9_META.id === 'page9');
check('PAGE9_META.stage === "health"',                 page9.PAGE9_META.stage === 'health');
check('PAGE9_META.label === "hatchery health"',        page9.PAGE9_META.label === 'hatchery health');
check('PAGE9_META.static NOT set',                     !('static' in page9.PAGE9_META) || page9.PAGE9_META.static !== true);

// -----------------------------------------------------------------------------
group('_state.js: live-binding pattern');
check('exports _pageState',                  '_pageState' in state);
check('exports _setActiveState',             typeof state._setActiveState === 'function');
check('_pageState starts null',              state._pageState === null);
state._setActiveState({ marker: 'A' });
check('_setActiveState mutates _pageState',  state._pageState && state._pageState.marker === 'A');
state._setActiveState(null);

// -----------------------------------------------------------------------------
// Minimal stub DOM polyfill — same approach as test_health_page8.js. The
// mount() lifecycle exposes window._fhh* + window.FHH_VERDICTS even when
// the DOM is null (the renderer skips slots it can't find).
group('mount() exposes legacy window._fhh* + FHH_VERDICTS contracts');
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
try { await page9.mount(root, atlasState, registry); }
catch (e) { mountErr = e; }
check('mount() does not throw on null-DOM stub',          mountErr === null, mountErr ? mountErr.message : '');
check('window._fhhRender exposed',                         typeof window._fhhRender === 'function');
check('window._fhhEnsureState exposed',                    typeof window._fhhEnsureState === 'function');
check('window._fhhClassify exposed',                       typeof window._fhhClassify === 'function');
check('window._fhhFocalCohort exposed',                    typeof window._fhhFocalCohort === 'function');
check('window._fhhResolveHRef exposed',                    typeof window._fhhResolveHRef === 'function');
check('window._fhhIngestText exposed',                     typeof window._fhhIngestText === 'function');
check('window._fhhExportCsv exposed',                      typeof window._fhhExportCsv === 'function');
check('window._fhhParseTsv exposed',                       typeof window._fhhParseTsv === 'function');
check('window._fhhIsValidJson exposed',                    typeof window._fhhIsValidJson === 'function');
check('window.FHH_VERDICTS exposed',                       window.FHH_VERDICTS && typeof window.FHH_VERDICTS === 'object');

// -----------------------------------------------------------------------------
group('FHH_VERDICTS: four-quadrant verdict map');
const V = window.FHH_VERDICTS;
check('verdict "good" defined',                       V.good && typeof V.good === 'object');
check('verdict "review_inbreeding" defined',          V.review_inbreeding && typeof V.review_inbreeding === 'object');
check('verdict "review_erosion" defined',             V.review_erosion && typeof V.review_erosion === 'object');
check('verdict "caution" defined',                    V.caution && typeof V.caution === 'object');
check('good.klass === "fhh-good"',                    V.good.klass === 'fhh-good');
check('review_inbreeding.klass === "fhh-review"',     V.review_inbreeding.klass === 'fhh-review');
check('review_erosion.klass === "fhh-review"',        V.review_erosion.klass === 'fhh-review');
check('caution.klass === "fhh-caution"',              V.caution.klass === 'fhh-caution');

// -----------------------------------------------------------------------------
// Pure-function tests for _fhhClassify — the four quadrants of the
// F_ROH × H plane. Two-cohort fixture so the median-cut path runs (the
// scaffold's `if (valid.length >= 2)` branch). For 2 cohorts, the
// "median" is the upper element after sorting; both cohorts end up
// satisfying `>= cut` for their own values. Test below uses a 5-cohort
// fixture so each quadrant has a clear assignment.
group('_fhhClassify: four-quadrant verdict (5-cohort fixture)');
const cohorts = [
  { cohort: 'A_healthy', species: 'X', F_ROH: 0.05, H_per_site: 0.015, H_ref: 0.015 },
  { cohort: 'B_inbred',  species: 'X', F_ROH: 0.40, H_per_site: 0.014, H_ref: 0.015 },
  { cohort: 'C_eroded',  species: 'X', F_ROH: 0.05, H_per_site: 0.003, H_ref: 0.015 },
  { cohort: 'D_caution', species: 'X', F_ROH: 0.40, H_per_site: 0.003, H_ref: 0.015 },
  { cohort: 'E_mid',     species: 'X', F_ROH: 0.20, H_per_site: 0.008, H_ref: 0.015 },
];
const vA = window._fhhClassify(cohorts[0], cohorts);
const vB = window._fhhClassify(cohorts[1], cohorts);
const vC = window._fhhClassify(cohorts[2], cohorts);
const vD = window._fhhClassify(cohorts[3], cohorts);
check('A (low F_ROH, high H/H_ref) → good',           vA.verdict === 'good', `got: ${vA.verdict}`);
check('B (high F_ROH, high H/H_ref) → review_inbreeding',
                                                      vB.verdict === 'review_inbreeding', `got: ${vB.verdict}`);
check('C (low F_ROH, low H/H_ref) → review_erosion',  vC.verdict === 'review_erosion', `got: ${vC.verdict}`);
check('D (high F_ROH, low H/H_ref) → caution',        vD.verdict === 'caution', `got: ${vD.verdict}`);
check('A.h_ratio === 1.0',                            Math.abs(vA.h_ratio - 1.0) < 1e-9);
check('A.h_ref === 0.015',                            Math.abs(vA.h_ref - 0.015) < 1e-9);

// -----------------------------------------------------------------------------
group('_fhhClassify: missing data → verdict=null (graceful)');
const partial = { cohort: 'partial', F_ROH: 0.10 };  // no H_per_site
const vP = window._fhhClassify(partial, [partial]);
check('partial cohort → verdict null',                vP.verdict === null);

// -----------------------------------------------------------------------------
group('_fhhResolveHRef: species-aware fallback');
const noRef = { cohort: 'noref', species: 'X', F_ROH: 0.1, H_per_site: 0.005 };
const peer  = { cohort: 'peer',  species: 'X', F_ROH: 0.05, H_per_site: 0.020 };  // higher H
const peerY = { cohort: 'peerY', species: 'Y', F_ROH: 0.5, H_per_site: 0.030 };   // different species
const all = [noRef, peer, peerY];
const ref = window._fhhResolveHRef(noRef, all);
check('species-X peer used as H_ref fallback (0.020)', Math.abs(ref - 0.020) < 1e-9, `got: ${ref}`);

// -----------------------------------------------------------------------------
group('_fhhFocalCohort: is_focal flag wins over highest-F_ROH');
window.state = {};
window.state._hatcheryHealth = {
  cohorts: [
    { cohort: 'X', F_ROH: 0.40 },                      // highest F_ROH
    { cohort: 'Y', F_ROH: 0.20, is_focal: true },      // flagged focal
    { cohort: 'Z', F_ROH: 0.10 },
  ],
  metadata: {},
};
const focal = window._fhhFocalCohort();
check('focal cohort honours is_focal flag',           focal && focal.cohort === 'Y');

// Drop is_focal — falls back to highest-F_ROH
window.state._hatcheryHealth.cohorts[1].is_focal = false;
const focal2 = window._fhhFocalCohort();
check('falls back to highest-F_ROH when no is_focal', focal2 && focal2.cohort === 'X');

// -----------------------------------------------------------------------------
group('_fhhIsValidJson + _fhhParseTsv (pure helpers)');
check('_fhhIsValidJson({cohorts:[]}) === true',       window._fhhIsValidJson({ cohorts: [] }) === true);
check('_fhhIsValidJson({}) === false',                window._fhhIsValidJson({}) === false);
const tsv = 'cohort\tspecies\tF_ROH\tH_per_site\tH_ref\nA\tX\t0.1\t0.01\t0.015';
const parsed = window._fhhParseTsv(tsv);
check('_fhhParseTsv parses 1 cohort',                 parsed && parsed.cohorts && parsed.cohorts.length === 1);
check('parsed cohort.cohort === "A"',                 parsed && parsed.cohorts[0].cohort === 'A');
check('parsed cohort.F_ROH === 0.1',                  parsed && Math.abs(parsed.cohorts[0].F_ROH - 0.1) < 1e-9);

// -----------------------------------------------------------------------------
group('unmount() clears _pageState');
let unmountErr = null;
try { await page9.unmount(root); }
catch (e) { unmountErr = e; }
check('unmount() does not throw',                     unmountErr === null, unmountErr ? unmountErr.message : '');
check('_pageState cleared by unmount',                state._pageState === null);

// -----------------------------------------------------------------------------
console.log('\n=================');
console.log(`pass: ${pass}   fail: ${fail}`);
console.log('=================');
process.exit(fail > 0 ? 1 : 0);
