// Smoke tests for population-atlas page3.js's panel envelope status.
//
// page3 has 6 panel-slot mockups (data-pa-slot=ngsadmix_q_round1 …
// evaladmix). The mount-time probe is the richest yet:
//   - 4 slots map to wired layer types (2 ngsadmix_q, 2 population_slot
//     with payload.slot filtering)
//   - 2 slots are deliberately unwired ("no action") — they advertise that
//   - one slot type (population_slot) requires fetching each envelope to
//     read payload.slot, exactly like diversity-atlas page1
//
// Run from population-atlas root:
//   node atlases/population/pages/structure/test_page3_envelope_status.js
import { listLayers, getLayer } from '../../shared/api_client.js';

// ----- fake DOM ---------------------------------------------------------
class FakeFoot {
  constructor() {
    this.children = [];
    this.className = 'panel-slot-foot';
  }
  querySelector(sel) {
    if (sel === '.pa-envelope-status') {
      return this.children.find(c => c.className === 'pa-envelope-status') || null;
    }
    return null;
  }
  appendChild(c) { this.children.push(c); return c; }
}
class FakePanel {
  constructor(slotName) {
    this._attrs = { 'data-pa-slot': slotName };
    this._foot = new FakeFoot();
  }
  getAttribute(k) { return this._attrs[k]; }
  querySelector(sel) {
    if (sel === '.panel-slot-foot') return this._foot;
    return null;
  }
}
class FakeRoot {
  constructor(panels) { this._panels = panels; }
  querySelectorAll(sel) {
    if (sel === '[data-pa-slot]') return this._panels;
    return [];
  }
}
globalThis.document = {
  createElement(tag) {
    return { tagName: tag, className: '', textContent: '', title: '', style: {} };
  },
  querySelectorAll() { return []; },
};

// ----- fetch mock -------------------------------------------------------
const _routes = [];
const _calls  = [];
function _route(p, fn) { _routes.push({ p, fn }); }
function _reset()      { _routes.length = 0; _calls.length = 0; }
globalThis.fetch = async (url, init) => {
  _calls.push({ url, init });
  for (const r of _routes) if (r.p(url, init)) return _make(await r.fn(url, init));
  return _make({ status: 404, body: { error: 'no route', url } });
};
function _make({ status = 200, body = null, text = null } = {}) {
  const ok = status >= 200 && status < 300;
  const t = text ?? (body == null ? '' : JSON.stringify(body));
  return { ok, status, async json() { return body != null ? body : JSON.parse(t); }, async text() { return t; } };
}
function eq(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    console.error(`FAIL: ${msg}\n  expected: ${JSON.stringify(b)}\n  got: ${JSON.stringify(a)}`);
    process.exit(1);
  }
  console.log(`  ok: ${msg}`);
}

// ----- mirror page3.js helpers (byte-equivalent) ------------------------

const _SLOT_LAYER_MAPPING = {
  ngsadmix_q_round1: { layer_type: 'ngsadmix_q',      slot_filter: null,                 hint: 'staging_ngsadmix_q_v0' },
  ngsadmix_q_round2: { layer_type: 'ngsadmix_q',      slot_filter: null,                 hint: 'staging_ngsadmix_q_v0' },
  ngsrelate_kinship: { layer_type: 'population_slot', slot_filter: 'ngsrelate_kinship',  hint: 'import_slot → staging_population_slot_v0' },
  pcangsd_pca:       { layer_type: 'population_slot', slot_filter: 'pcangsd_pca',        hint: 'import_slot → staging_population_slot_v0' },
  natora:            { mapping: null,                 hint: 'no action wired (NAToRA + ngsRelate output not yet ingested)' },
  evaladmix:         { mapping: null,                 hint: 'no action wired (evalAdmix output not yet ingested)' },
};

async function _probeSlot(rule) {
  if (rule.mapping === null) return { count: 0, latest: null, unwired: true };
  let rows;
  try {
    const list = await listLayers({ layer_type: rule.layer_type, stage: 'staging', limit: 200 });
    rows = (list && list.layers) || [];
  } catch (_e) { return { count: 0, latest: null, error: true }; }
  if (rule.slot_filter == null) {
    return { count: rows.length, latest: rows[rows.length - 1] || null };
  }
  let matched = [];
  for (const row of rows) {
    try {
      const env = await getLayer(row.layer_id);
      const slot = env && env.payload && env.payload.slot;
      if (slot === rule.slot_filter) matched.push(env);
    } catch (_e) { continue; }
  }
  matched.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  return { count: matched.length, latest: matched[matched.length - 1] || null };
}

function _renderPanelEnvelopeStatus(panel, slotName, result) {
  const foot = panel.querySelector('.panel-slot-foot');
  if (!foot) return;
  let line = foot.querySelector('.pa-envelope-status');
  if (!line) {
    line = document.createElement('div');
    line.className = 'pa-envelope-status';
    foot.appendChild(line);
  }
  const rule = _SLOT_LAYER_MAPPING[slotName] || {};
  if (result.unwired) { line.textContent = `◌  ${rule.hint || 'no action wired'}`; line.title = ''; return; }
  if (result.error)   { line.textContent = '◌  envelope index unreachable'; line.title = ''; return; }
  if (result.count === 0) {
    line.textContent = `◌  0 captures (run \`atlas_action submit\` against ${rule.hint || 'the matching action'})`;
    line.title = '';
    return;
  }
  const latest = result.latest || {};
  const layer_id = latest.layer_id || '?';
  line.textContent =
    `●  ${result.count} capture${result.count === 1 ? '' : 's'} ` +
    `· latest: ${layer_id}`;
  const created = latest.created_at || '?';
  line.title =
    `layer_type=${rule.layer_type}` +
    (rule.slot_filter ? `, payload.slot=${rule.slot_filter}` : '') +
    `, created_at=${created}`;
}

async function _annotateAllPanels(root) {
  const panels = root && typeof root.querySelectorAll === 'function'
    ? root.querySelectorAll('[data-pa-slot]') : [];
  if (!panels || panels.length === 0) return;
  for (const panel of panels) {
    const slotName = panel.getAttribute('data-pa-slot');
    const rule = _SLOT_LAYER_MAPPING[slotName];
    if (!rule) continue;
    const result = await _probeSlot(rule);
    _renderPanelEnvelopeStatus(panel, slotName, result);
  }
}

// Helper: find the status line in a panel
function _statusOf(panel) {
  return panel._foot.children.find(c => c.className === 'pa-envelope-status');
}

// ----- tests ------------------------------------------------------------

console.log('full mix: 2 ngsadmix_q + 1 pcangsd + 1 kinship + unwired natora/evaladmix:');
{
  _reset();
  // listLayers route — returns different envelopes by layer_type
  _route(
    (url) => url.startsWith('/api/layers?') && url.includes('layer_type=ngsadmix_q'),
    () => ({ body: { layers: [
      { layer_id: 'ngsadmix_q_main_226_hatchery_k2' },
      { layer_id: 'ngsadmix_q_main_226_hatchery_k8' },
    ], n: 2, total: 2 } }),
  );
  _route(
    (url) => url.startsWith('/api/layers?') && url.includes('layer_type=population_slot'),
    () => ({ body: { layers: [
      { layer_id: 'population_slot_main_226_hatchery_aa' },
      { layer_id: 'population_slot_main_226_hatchery_bb' },
    ], n: 2, total: 2 } }),
  );
  _route(
    (url) => url === '/api/layers/population_slot_main_226_hatchery_aa',
    () => ({ body: {
      layer_id: 'population_slot_main_226_hatchery_aa',
      created_at: '2026-05-13T10:00:00Z',
      payload: { slot: 'ngsrelate_kinship' },
    } }),
  );
  _route(
    (url) => url === '/api/layers/population_slot_main_226_hatchery_bb',
    () => ({ body: {
      layer_id: 'population_slot_main_226_hatchery_bb',
      created_at: '2026-05-14T15:00:00Z',
      payload: { slot: 'pcangsd_pca' },
    } }),
  );

  const slotNames = ['ngsadmix_q_round1','ngsadmix_q_round2','ngsrelate_kinship','natora','pcangsd_pca','evaladmix'];
  const panels = slotNames.map(s => new FakePanel(s));
  await _annotateAllPanels(new FakeRoot(panels));

  // ngsadmix_q_round1 → 2 captures of ngsadmix_q
  const r1 = _statusOf(panels[0]);
  if (!r1.textContent.includes('2 captures')) {
    console.error(`FAIL: ngsadmix_q_round1 should show 2 captures, got: ${r1.textContent}`);
    process.exit(1);
  }
  console.log('  ok: ngsadmix_q_round1 advertises 2 captures');

  // ngsadmix_q_round2 → same data (no round distinction in current envelopes)
  const r2 = _statusOf(panels[1]);
  if (!r2.textContent.includes('2 captures')) {
    console.error(`FAIL: ngsadmix_q_round2 should also show 2 captures, got: ${r2.textContent}`);
    process.exit(1);
  }
  console.log('  ok: ngsadmix_q_round2 advertises 2 captures');

  // ngsrelate_kinship → 1 (filtered by payload.slot)
  const r3 = _statusOf(panels[2]);
  if (!r3.textContent.includes('1 capture ')) {
    console.error(`FAIL: ngsrelate_kinship should show 1 capture, got: ${r3.textContent}`);
    process.exit(1);
  }
  console.log('  ok: ngsrelate_kinship advertises 1 capture (singular)');

  // natora → unwired
  const r4 = _statusOf(panels[3]);
  if (!r4.textContent.includes('no action wired')) {
    console.error(`FAIL: natora should advertise unwired, got: ${r4.textContent}`);
    process.exit(1);
  }
  console.log('  ok: natora advertises unwired status');

  // pcangsd_pca → 1
  const r5 = _statusOf(panels[4]);
  if (!r5.textContent.includes('1 capture ')) {
    console.error(`FAIL: pcangsd_pca should show 1 capture, got: ${r5.textContent}`);
    process.exit(1);
  }
  console.log('  ok: pcangsd_pca advertises 1 capture');

  // evaladmix → unwired
  const r6 = _statusOf(panels[5]);
  if (!r6.textContent.includes('no action wired')) {
    console.error(`FAIL: evaladmix should advertise unwired, got: ${r6.textContent}`);
    process.exit(1);
  }
  console.log('  ok: evaladmix advertises unwired status');
}

console.log('empty index → all wired slots show 0 captures, unwired stay as such:');
{
  _reset();
  _route(() => true, () => ({ body: { layers: [], n: 0, total: 0 } }));
  const slotNames = ['ngsadmix_q_round1','pcangsd_pca','natora'];
  const panels = slotNames.map(s => new FakePanel(s));
  await _annotateAllPanels(new FakeRoot(panels));

  if (!_statusOf(panels[0]).textContent.includes('0 captures')) {
    console.error(`FAIL: ngsadmix_q_round1 should show 0 captures: ${_statusOf(panels[0]).textContent}`);
    process.exit(1);
  }
  console.log('  ok: 0 captures for wired empty slot');
  if (!_statusOf(panels[2]).textContent.includes('no action wired')) {
    console.error(`FAIL: natora should still advertise unwired: ${_statusOf(panels[2]).textContent}`);
    process.exit(1);
  }
  console.log('  ok: unwired slot stays unwired even when index is empty');
}

console.log('fetch error → wired slots show "envelope index unreachable":');
{
  _reset();
  _route(() => true, () => ({ status: 503, text: 'unavailable' }));
  const panel = new FakePanel('ngsadmix_q_round1');
  await _annotateAllPanels(new FakeRoot([panel]));
  if (!_statusOf(panel).textContent.includes('envelope index unreachable')) {
    console.error(`FAIL: 5xx should produce unreachable message: ${_statusOf(panel).textContent}`);
    process.exit(1);
  }
  console.log('  ok: 5xx produces "envelope index unreachable"');
}

console.log('most-recent envelope wins when 2 captures match the slot filter:');
{
  _reset();
  _route(
    (url) => url.startsWith('/api/layers?'),
    () => ({ body: { layers: [
      { layer_id: 'L_older' },
      { layer_id: 'L_newer' },
    ], n: 2, total: 2 } }),
  );
  _route(
    (url) => url === '/api/layers/L_older',
    () => ({ body: { layer_id: 'L_older', created_at: '2026-05-10T00:00:00Z',
                     payload: { slot: 'pcangsd_pca' } } }),
  );
  _route(
    (url) => url === '/api/layers/L_newer',
    () => ({ body: { layer_id: 'L_newer', created_at: '2026-05-14T00:00:00Z',
                     payload: { slot: 'pcangsd_pca' } } }),
  );
  const panel = new FakePanel('pcangsd_pca');
  await _annotateAllPanels(new FakeRoot([panel]));
  const s = _statusOf(panel);
  if (!s.textContent.includes('latest: L_newer')) {
    console.error(`FAIL: should show L_newer as latest: ${s.textContent}`);
    process.exit(1);
  }
  console.log('  ok: most-recent envelope chosen by created_at');
  if (!s.textContent.includes('2 captures')) {
    console.error(`FAIL: should count 2 captures: ${s.textContent}`);
    process.exit(1);
  }
  console.log('  ok: count is 2');
  if (!s.title.includes('payload.slot=pcangsd_pca')) {
    console.error(`FAIL: title should mention payload.slot: ${s.title}`);
    process.exit(1);
  }
  console.log('  ok: title carries payload.slot filter');
}

console.log('idempotent: second annotate pass updates existing status line, not appends:');
{
  _reset();
  let n = 0;
  _route(
    () => true,
    () => {
      n++;
      return { body: { layers: n === 1 ? [{ layer_id: 'L1' }] : [], n: n === 1 ? 1 : 0, total: n === 1 ? 1 : 0 } };
    },
  );
  const panel = new FakePanel('ngsadmix_q_round1');
  await _annotateAllPanels(new FakeRoot([panel]));
  await _annotateAllPanels(new FakeRoot([panel]));
  const statusLines = panel._foot.children.filter(c => c.className === 'pa-envelope-status');
  eq(statusLines.length, 1, 'status line is not duplicated');
}

console.log('unknown data-pa-slot is ignored:');
{
  _reset();
  _route(() => true, () => ({ body: { layers: [], n: 0, total: 0 } }));
  const panel = new FakePanel('totally_unknown_slot');
  await _annotateAllPanels(new FakeRoot([panel]));
  // Status line should NOT have been created (no rule for unknown slot).
  eq(panel._foot.children.length, 0, 'no status appended for unknown slot');
}

console.log('\nALL OK');
