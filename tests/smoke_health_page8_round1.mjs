// tests/smoke_health_page8_round1.mjs
//
// Round-1 mount/render/unmount lifecycle smoke for the page8 breeding
// page. The page lifts the scaffold's inline JS verbatim, so this smoke
// exercises:
//   - empty-state path (no rows loaded → bp-empty message + scaffold badge)
//   - auto-derivation via window.state.perSampleStats (top-1% F_ROH path)
//   - JSON upload via _bpIngestText (the file-upload pipeline simulated
//     without going through the file input)
//   - export-CSV path (no-op exporter via Blob+URL stubs in the polyfill)
//   - hatchery-health hand-off: when page9 has been mounted and a focal
//     cohort exists, the breeding table picks up the verdict row
//   - unmount() clears _pageState

const WORKSPACE = process.env.WORKSPACE || '/home/claude/workspace/atlas-workspace';
const { installDom, resetNodes, ensureNode } = await import(`${WORKSPACE}/tests/_dom_polyfill.mjs`);
installDom();
const page8 = await import(`${WORKSPACE}/atlases/population/pages/health/page8.js`);
const state = await import(`${WORKSPACE}/atlases/population/pages/health/page8/_state.js`);

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log('  ✓', label); }
  else      { fail++; console.log('  ✗', label, extra ? ' — ' + extra : ''); }
}
function group(name) { console.log('\n--- ' + name + ' ---'); }

// -----------------------------------------------------------------------------
group('Module exports');
check('page8.mount',                  typeof page8.mount === 'function');
check('page8.unmount',                typeof page8.unmount === 'function');
check('page8.refreshPage8',           typeof page8.refreshPage8 === 'function');
check('page8.PAGE8_META.id===page8',  page8.PAGE8_META && page8.PAGE8_META.id === 'page8');

// -----------------------------------------------------------------------------
group('Smoke: mount() with empty window.state → empty-state DOM');
resetNodes();
// Wipe any prior _breedingPage state across mounts
if (globalThis.window) { globalThis.window.state = {}; }

const root = ensureNode('app-root');
const atlasState = { population: {} };
let mountErr = null;
try { await page8.mount(root, atlasState, {}); }
catch (e) { mountErr = e; }
check('mount() ran without throwing',                       mountErr === null, mountErr ? mountErr.message : '');

const badge   = ensureNode('bpStatusBadge');
const table   = ensureNode('bpTableSlot');
const sources = ensureNode('bpSourceCards');
check('#bpStatusBadge shows scaffold message',              badge.textContent.includes('scaffold'));
check('#bpStatusBadge has class "planned"',                 badge.classList.contains('planned'));
check('#bpTableSlot has bp-empty message',                  table.innerHTML.includes('bp-empty'));
check('#bpTableSlot empty message references upload',       table.innerHTML.includes('breeding_highlights.json'));
check('#bpSourceCards rendered (6 cards)',                  sources.innerHTML.includes('Diversity') &&
                                                            sources.innerHTML.includes('Markers') &&
                                                            sources.innerHTML.includes('total rows'));

// -----------------------------------------------------------------------------
group('Smoke: _pageState live-binding + stash');
check('_pageState set after mount',                         !!state._pageState);
check('atlasState.population._page8State === _pageState',   atlasState.population._page8State === state._pageState);

// -----------------------------------------------------------------------------
group('Auto-derivation via window.state.perSampleStats (top-1% F_ROH)');
window.state.perSampleStats = [
  { sample: 'CGA001', F_ROH: 0.10 },
  { sample: 'CGA002', F_ROH: 0.15 },
  { sample: 'CGA003', F_ROH: 0.20 },
  { sample: 'CGA004', F_ROH: 0.35 },
  { sample: 'CGA005', F_ROH: 0.50 },
];
window._bpRender();
const rows = window._bpAllRows();
const flagged = rows.find(r => r.sample === 'CGA005' && r.source === 'Diversity');
check('CGA005 surfaced as top-1% F_ROH row',                !!flagged);
check('flagged row.status === "red"',                       flagged && flagged.status === 'red');
check('table renders the flagged sample',                   table.innerHTML.includes('CGA005'));
check('badge now reports rows count (no longer scaffold)',  !badge.textContent.includes('scaffold'));
check('badge has class "ready"',                            badge.classList.contains('ready'));

// -----------------------------------------------------------------------------
group('User JSON upload via _bpIngestText (sample + highlight)');
const userJson = JSON.stringify({
  metadata: { panel_name: 'unit test' },
  rows: [
    { sample: 'CGA999', highlight: 'manual flag', value: 'note', source: 'Markers', status: 'green' },
  ],
});
window._bpIngestText(userJson, 'test.json');
const rowsAfter = window._bpAllRows();
const manual = rowsAfter.find(r => r.sample === 'CGA999');
check('user row appears after _bpIngestText',               !!manual);
check('user row.source === "Markers"',                      manual && manual.source === 'Markers');
check('user row.status === "green"',                        manual && manual.status === 'green');
check('user row.notes / _origin tagged',                    manual && (manual._origin === 'user' || manual._origin === 'overlaid'));

// -----------------------------------------------------------------------------
group('TSV upload via _bpIngestText');
const userTsv = 'sample\thighlight\tvalue\tsource\tstatus\nCGA888\ttsv flag\t0.42\tInversions\tgreen';
window._bpIngestText(userTsv, 'test.tsv');
const rowsTsv = window._bpAllRows();
const tsvRow = rowsTsv.find(r => r.sample === 'CGA888');
check('TSV-upload row appears',                             !!tsvRow);
check('TSV row.source === "Inversions"',                    tsvRow && tsvRow.source === 'Inversions');

// -----------------------------------------------------------------------------
group('Filter: status="red" + view_mode="detailed"');
const ui = window._bpEnsureState();
ui.filter_status = 'red';
ui.view_mode = 'detailed';
window._bpRender();
const filtered = window._bpFilteredRows(window._bpAllRows(), ui);
check('filter status=red keeps only red rows',
      filtered.every(r => r.status === 'red'),
      `actual statuses: ${filtered.map(r => r.status).join(',')}`);
check('detailed view bp-detailed class in table',
      table.innerHTML.includes('bp-detailed'));

// Reset filters for subsequent assertions
ui.filter_status = 'all';
ui.view_mode = 'simple';
window._bpRender();

// -----------------------------------------------------------------------------
group('Hatchery-health hand-off — page9 → page8 verdict row');
const page9 = await import(`${WORKSPACE}/atlases/population/pages/health/page9.js`);
await page9.mount(ensureNode('app-root-p9'), { population: {} }, {});
// Populate one focal cohort
window._fhhIngestText(JSON.stringify({
  cohorts: [
    { cohort: 'this_study',  species: 'X', is_focal: true,
      F_ROH: 0.40, H_per_site: 0.003, H_ref: 0.015 },
    { cohort: 'wild_peer',   species: 'X',
      F_ROH: 0.05, H_per_site: 0.015, H_ref: 0.015 },
  ],
}), 'test.json');
window._bpRender();
const allRowsHH = window._bpAllRows();
const hhRow = allRowsHH.find(r => r._origin === 'auto:hatchery_health');
check('hatchery-health verdict row surfaced on breeding page',  !!hhRow);
check('verdict row.sample is the focal cohort name',            hhRow && hhRow.sample === 'this_study');
check('verdict row uses highlight_html (colored verdict)',      hhRow && typeof hhRow.highlight_html === 'string' && hhRow.highlight_html.includes('fhh-caution'));

// -----------------------------------------------------------------------------
group('Export CSV (Blob+URL polyfill present, no-op exporter)');
let csvErr = null;
try { window._bpExportCsv(); }
catch (e) { csvErr = e; }
check('_bpExportCsv() does not throw with polyfill',        csvErr === null, csvErr ? csvErr.message : '');

// -----------------------------------------------------------------------------
group('Reset: drop user rows → table back to auto-derived only');
ui.user_rows = [];
window._bpRender();
const after = window._bpAllRows();
check('after reset: CGA999 (user) gone',                    !after.find(r => r.sample === 'CGA999'));
check('after reset: CGA005 (auto F_ROH) still present',     !!after.find(r => r.sample === 'CGA005'));

// -----------------------------------------------------------------------------
group('unmount() clears _pageState');
let uerr = null;
try { await page8.unmount(root); }
catch (e) { uerr = e; }
check('unmount() does not throw',                           uerr === null, uerr ? uerr.message : '');
check('_pageState cleared by unmount',                      state._pageState === null);

// -----------------------------------------------------------------------------
console.log('\n=================');
console.log(`pass: ${pass}   fail: ${fail}`);
console.log('=================');
process.exit(fail > 0 ? 1 : 0);
