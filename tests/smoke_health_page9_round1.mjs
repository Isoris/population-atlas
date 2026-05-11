// tests/smoke_health_page9_round1.mjs
//
// Round-1 mount/render/unmount lifecycle smoke for the page9 hatchery-
// health F_ROH × H plane. Exercises the verbatim-lifted JS through
// real DOM nodes:
//   - empty-state path (no cohorts loaded → fhh-empty message + scaffold badge)
//   - JSON upload via _fhhIngestText (the four-quadrant verdict assignment)
//   - SVG scatter rendered into #fhhPlotSlot (verify <svg> + per-cohort
//     <circle> + verdict-coloured <text> labels)
//   - comparator table rendered into #fhhTableSlot with FOCAL marker
//   - export-CSV path (no-op exporter via Blob+URL stubs in the polyfill)
//   - _fhhFocalCohort + _fhhResolveHRef behaviour through window contract
//   - unmount() clears _pageState

const WORKSPACE = process.env.WORKSPACE || '/home/claude/workspace/atlas-workspace';
const { installDom, resetNodes, ensureNode } = await import(`${WORKSPACE}/tests/_dom_polyfill.mjs`);
installDom();
const page9 = await import(`${WORKSPACE}/atlases/population/pages/health/page9.js`);
const state = await import(`${WORKSPACE}/atlases/population/pages/health/page9/_state.js`);

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log('  ✓', label); }
  else      { fail++; console.log('  ✗', label, extra ? ' — ' + extra : ''); }
}
function group(name) { console.log('\n--- ' + name + ' ---'); }

// -----------------------------------------------------------------------------
group('Module exports');
check('page9.mount',                   typeof page9.mount === 'function');
check('page9.unmount',                 typeof page9.unmount === 'function');
check('page9.refreshPage9',            typeof page9.refreshPage9 === 'function');
check('page9.PAGE9_META.id===page9',   page9.PAGE9_META && page9.PAGE9_META.id === 'page9');

// -----------------------------------------------------------------------------
group('Smoke: mount() with empty cohorts → empty-state DOM');
resetNodes();
if (globalThis.window) { globalThis.window.state = {}; }

const root = ensureNode('app-root');
const atlasState = { population: {} };
let mountErr = null;
try { await page9.mount(root, atlasState, {}); }
catch (e) { mountErr = e; }
check('mount() ran without throwing',                       mountErr === null, mountErr ? mountErr.message : '');

const plot      = ensureNode('fhhPlotSlot');
const table     = ensureNode('fhhTableSlot');
const summary   = ensureNode('fhhSummaryCards');
const badge     = ensureNode('fhhStatusBadge');
const tBadge    = ensureNode('fhhTableBadge');
check('#fhhPlotSlot shows fhh-empty message',               plot.innerHTML.includes('fhh-empty'));
check('#fhhPlotSlot empty message references upload',       plot.innerHTML.includes('hatchery_health.json'));
check('#fhhTableSlot empty message',                        table.innerHTML.includes('fhh-empty'));
check('#fhhSummaryCards empty (no cohorts)',                summary.innerHTML === '');
check('#fhhStatusBadge shows scaffold text',                badge.textContent.includes('scaffold'));
check('#fhhTableBadge populated even when empty',           tBadge.textContent.includes('0 cohorts'));

// -----------------------------------------------------------------------------
group('Smoke: _pageState live-binding');
check('_pageState set after mount',                         !!state._pageState);
check('atlasState.population._page9State === _pageState',   atlasState.population._page9State === state._pageState);

// -----------------------------------------------------------------------------
group('Smoke: window contract exposed (FHH_VERDICTS + helpers)');
check('window.FHH_VERDICTS exposed',                        window.FHH_VERDICTS && typeof window.FHH_VERDICTS === 'object');
check('window._fhhClassify exposed',                        typeof window._fhhClassify === 'function');
check('window._fhhFocalCohort exposed',                     typeof window._fhhFocalCohort === 'function');
check('window._fhhResolveHRef exposed',                     typeof window._fhhResolveHRef === 'function');
check('FHH_VERDICTS has 4 verdicts',                        ['good', 'review_inbreeding', 'review_erosion', 'caution']
                                                              .every(k => window.FHH_VERDICTS[k]));

// -----------------------------------------------------------------------------
group('Ingest: 4-cohort JSON exercising all four quadrants');
const fixture = {
  metadata: { panel_name: 'unit test' },
  cohorts: [
    { cohort: 'A_healthy',  species: 'X',                F_ROH: 0.05, H_per_site: 0.015, H_ref: 0.015 },
    { cohort: 'B_inbred',   species: 'X', is_focal: true, F_ROH: 0.40, H_per_site: 0.014, H_ref: 0.015 },
    { cohort: 'C_eroded',   species: 'X',                F_ROH: 0.05, H_per_site: 0.003, H_ref: 0.015 },
    { cohort: 'D_caution',  species: 'X',                F_ROH: 0.40, H_per_site: 0.003, H_ref: 0.015 },
    { cohort: 'E_mid',      species: 'X',                F_ROH: 0.20, H_per_site: 0.008, H_ref: 0.015 },
  ],
};
window._fhhIngestText(JSON.stringify(fixture), 'test.json');

// Spot-check classifications against the FHH_VERDICTS quadrant map.
const allC = window.state._hatcheryHealth.cohorts;
const cA = window._fhhClassify(allC.find(c => c.cohort === 'A_healthy'), allC);
const cB = window._fhhClassify(allC.find(c => c.cohort === 'B_inbred'),  allC);
const cC = window._fhhClassify(allC.find(c => c.cohort === 'C_eroded'),  allC);
const cD = window._fhhClassify(allC.find(c => c.cohort === 'D_caution'), allC);
check('A_healthy → good',                                   cA.verdict === 'good', `got: ${cA.verdict}`);
check('B_inbred → review_inbreeding',                       cB.verdict === 'review_inbreeding', `got: ${cB.verdict}`);
check('C_eroded → review_erosion',                          cC.verdict === 'review_erosion', `got: ${cC.verdict}`);
check('D_caution → caution',                                cD.verdict === 'caution', `got: ${cD.verdict}`);

// -----------------------------------------------------------------------------
group('DOM after ingest: SVG scatter + comparator table rendered');
check('#fhhPlotSlot now contains <svg>',                    plot.innerHTML.includes('<svg'));
check('SVG contains a <circle> per cohort (>=5)',           (plot.innerHTML.match(/<circle/g) || []).length >= 5);
check('SVG contains axis labels (F_ROH and H / H_ref)',     plot.innerHTML.includes('F_ROH') &&
                                                            plot.innerHTML.includes('H / H_ref'));
check('SVG quadrant labels present',                        plot.innerHTML.includes('healthy') &&
                                                            plot.innerHTML.includes('caution'));
check('#fhhTableSlot now contains <table class="fhh-table">',
      table.innerHTML.includes('<table class="fhh-table">'));
check('table contains a FOCAL marker for B_inbred',         table.innerHTML.includes('FOCAL'));
check('table contains the four verdict classes used',       table.innerHTML.includes('fhh-good') &&
                                                            table.innerHTML.includes('fhh-review') &&
                                                            table.innerHTML.includes('fhh-caution'));

// -----------------------------------------------------------------------------
group('Summary cards: 4 verdict counts + cohorts-loaded card');
check('#fhhSummaryCards now populated',                     summary.innerHTML.includes('Cohorts loaded'));
check('summary mentions Healthy / Recent inbreeding / Diversity erosion / Caution',
      summary.innerHTML.includes('Healthy') &&
      summary.innerHTML.includes('Recent inbreeding') &&
      summary.innerHTML.includes('Diversity erosion') &&
      summary.innerHTML.includes('Caution'));

// -----------------------------------------------------------------------------
group('Status badge: now reports cohorts-plotted + focal verdict');
check('badge no longer scaffold',                           !badge.textContent.includes('scaffold'));
check('badge mentions "cohorts plotted"',                   badge.innerHTML.includes('cohorts plotted'));
check('badge mentions "focal:"',                            badge.innerHTML.includes('focal:'));
check('badge has class "ready"',                            badge.classList.contains('ready'));

// -----------------------------------------------------------------------------
group('_fhhFocalCohort: is_focal flag picked up');
const focal = window._fhhFocalCohort();
check('focal cohort === B_inbred (is_focal flagged)',       focal && focal.cohort === 'B_inbred');

// -----------------------------------------------------------------------------
group('TSV upload roundtrip');
const tsv = 'cohort\tspecies\tF_ROH\tH_per_site\tH_ref\nT1\tX\t0.1\t0.012\t0.015\nT2\tX\t0.3\t0.005\t0.015';
window._fhhIngestText(tsv, 'test.tsv');
const cohortsAfterTsv = window.state._hatcheryHealth.cohorts;
check('after TSV ingest: 2 cohorts',                        cohortsAfterTsv.length === 2);
check('first cohort.cohort === "T1"',                       cohortsAfterTsv[0].cohort === 'T1');
check('first cohort.F_ROH === 0.1',                         Math.abs(cohortsAfterTsv[0].F_ROH - 0.1) < 1e-9);

// -----------------------------------------------------------------------------
group('Export CSV path');
let csvErr = null;
try { window._fhhExportCsv(); }
catch (e) { csvErr = e; }
check('_fhhExportCsv() does not throw with polyfill',       csvErr === null, csvErr ? csvErr.message : '');

// -----------------------------------------------------------------------------
group('Invalid JSON ignored');
const beforeBad = window.state._hatcheryHealth.cohorts.length;
window._fhhIngestText('{bogus}', 'bad.json');
check('cohorts unchanged after invalid input',              window.state._hatcheryHealth.cohorts.length === beforeBad);

// -----------------------------------------------------------------------------
group('unmount() clears _pageState');
let uerr = null;
try { await page9.unmount(root); }
catch (e) { uerr = e; }
check('unmount() does not throw',                           uerr === null, uerr ? uerr.message : '');
check('_pageState cleared by unmount',                      state._pageState === null);

// -----------------------------------------------------------------------------
console.log('\n=================');
console.log(`pass: ${pass}   fail: ${fail}`);
console.log('=================');
process.exit(fail > 0 ? 1 : 0);
