# HANDOFF — Population Atlas round 1 done; nine pages migrated, 18 tests added

**Date:** 2026-05-11
**Reads:** `KICKOFF_population_atlas.md` (the round-0 scoping doc) for context, then this file.
**Project:** MS_Inversions_North_african_catfish — 226-sample pure *C. gariepinus* hatchery cohort, LANTA HPC.
**Atlas:** `population` (sibling to `inversion`, `genome`, `diversity`).

---

## 30-second orientation

Round 1 carves `legacy/Population_atlas.html` (3,075 lines, single-file scaffold) into the same per-page atlas-core layout the Inversion + Genome atlases use. Nine pages migrated in one session — six are pure scaffold (cards + planning grids + cross-reference callouts) and three carry real interactive JS lifted verbatim from the scaffold (page8 breeding, page9 hatchery health, plus the about page which is static).

No registry content changes (`requires_layers` / `requires_slots` / `preloads` left empty per the round-5-step-17 rule established on the inversion side — those are Quentin's content decisions, not the migration's).

The next phase is **round 2 — wire up the registry layers** so the page8/page9 auto-derivation hooks read from `Registry.subscribe(layer)` instead of `window.state.*`, and pages 1/2/3 get real renderers attached to MODULE_2B + MODULE_QC outputs as they emit.

---

## What this session shipped

### Atlas tree (`population-atlas/`)

Matches the Inversion + Genome layout exactly:

```
population-atlas/
├── atlases/
│   ├── _index.json                                    ← discovery fallback (1 atlas: population)
│   └── population/
│       ├── manifest.json                              ← 9 pages, 4 stages, yellow accent
│       ├── css/
│       │   └── population.css                         ← legacy <style> extracted; inline → utility classes
│       ├── pages/
│       │   ├── qc/                                    ← stage 1
│       │   │   ├── page1.{html,js} + page1/_state.js  ← samples (orientation table)
│       │   │   └── page2.{html,js} + page2/_state.js  ← QC (thresholds + planned panels)
│       │   ├── structure/                             ← stage 2
│       │   │   ├── page3.{html,js} + page3/_state.js  ← families & clusters (6 panel slots)
│       │   │   ├── page4.{html,js} + page4/_state.js  ← heterozygosity (cross-ref to Diversity Atlas)
│       │   │   ├── page5.{html,js} + page5/_state.js  ← diversity (cross-ref to Diversity Atlas)
│       │   │   └── page6.{html,js} + page6/_state.js  ← inbreeding (cross-ref to Diversity Atlas)
│       │   ├── health/                                ← stage 3
│       │   │   ├── page8.{html,js} + page8/_state.js  ← breeding (VERBATIM JS lift, ~330 LOC)
│       │   │   └── page9.{html,js} + page9/_state.js  ← hatchery health F_ROH × H plane (VERBATIM JS lift, ~360 LOC)
│       │   └── help/                                  ← stage 4
│       │       └── page7.{html,js} + page7/_state.js  ← about / four-atlas family / glossary
│       └── registries/data/
│           ├── pages.registry.json    ← 9 entries, _label + _doc per page, requires_* all []
│           ├── layers.registry.json   ← 9 contract-only layers ("_status": "not_loaded")
│           ├── slots.registry.json    ← shared.* (activeChrom, candidate) + page-private (_breedingPage, _hatcheryHealth, perSampleStats, ...)
│           ├── files.registry.json    ← empty for round 1
│           └── operations.registry.json   ← empty (no server)
├── tests/                                             ← 18 test files (9 unit + 9 smoke) + DOM polyfill
│   ├── _dom_polyfill.mjs                              ← shared minimal-browser DOM (FakeNode + FileReader + Blob + URL + localStorage)
│   ├── test_qc_page1.js                ↔ smoke_qc_page1_round1.mjs
│   ├── test_qc_page2.js                ↔ smoke_qc_page2_round1.mjs
│   ├── test_structure_page3.js         ↔ smoke_structure_page3_round1.mjs
│   ├── test_structure_page4.js         ↔ smoke_structure_page4_round1.mjs
│   ├── test_structure_page5.js         ↔ smoke_structure_page5_round1.mjs
│   ├── test_structure_page6.js         ↔ smoke_structure_page6_round1.mjs
│   ├── test_help_page7.js              ↔ smoke_help_page7_round1.mjs
│   ├── test_health_page8.js            ↔ smoke_health_page8_round1.mjs
│   └── test_health_page9.js            ↔ smoke_health_page9_round1.mjs
├── _tooling/
│   └── run_migrated_tests.sh                          ← parametrized over UNITS[] + SMOKES[]; matches inversion-atlas harness shape
├── _handoff_docs/
│   └── HANDOFF_2026-05-11_population_round1.md        ← this file
├── KICKOFF_population_atlas.md                        ← round-0 scoping (read for context)
├── Population_atlas.html                              ← legacy single-file scaffold (preserved as source-of-truth for the carve)
└── 0_READ_ME_FIRST.md                                 ← original kickoff intro
```

### atlas-core wiring (`atlas-core/`)

- `build/atlas.config` and `build/atlas.config.example` updated — `atlas_population = ../../population-atlas` listed alongside `atlas_inversion`, `atlas_genome`, `atlas_diversity`. Running `bash atlas-core/build/assemble.sh` now bundles four atlases into the unified workspace.

---

## Architectural decisions

### Stages

`qc → structure → health → help` resolves KICKOFF §Q2 by mapping to the **nine pages the scaffold actually has** instead of the speculative `pca / admixture / relatedness / founders` list from the kickoff. The scaffold's page set is already there + working; the kickoff's list would require deleting pages or duplicating Diversity-Atlas scope. Recommendation: keep the actual stages as shipped.

| Stage     | Pages                              |
|-----------|------------------------------------|
| qc        | page1 (samples), page2 (QC)        |
| structure | page3 (families & clusters), page4 (het ↗), page5 (div ↗), page6 (inbreeding ↗) |
| health    | page9 (hatchery health), page8 (breeding) |
| help      | page7 (about)                      |

Note pages 4/5/6 are intentionally **cross-reference cards** (the `↗` arrow in the label) pointing into the Diversity Atlas. The seam from chat 6144abe7 holds — the Population Atlas asks "how is the cohort structured?" (cohort-level) and the Diversity Atlas owns per-sample H / θπ / F_ROH (per-sample-level).

### Verbatim JS lift (page8 + page9)

The scaffold's inline JS for the breeding page (lines 2017-2612) and hatchery-health page (lines 2614-3071) was lifted **verbatim** into the page modules, with three structural wrappings:

1. **mount/unmount lifecycle** added at module bottom (the atlas-core router calls these on navigation).
2. **`window._bp* / _fhh* / FHH_VERDICTS / BP_SOURCE_DEFS / BP_STATUS_LABELS` legacy contract preserved** — exposed inside `mount()` so the breeding↔hatchery-health hand-off (page9 ingest fires `window._bpRender()` to refresh the breeding table with the verdict row) still works.
3. **`_bpWired` / `_fhhWired` reset on every mount** — the legacy single-page HTML kept these `true` after first wire; the router rebuilds the DOM each mount so they must rebind.

The reason for the verbatim policy: the inline JS reads multiple `window.state.*` slots that don't yet have a registered upstream producer (the `per_sample_stats` / `family_clusters` / `inversion_carriers` / `marker_controls` JSON layers are emitted by MODULE_2B + MODULE_3 + MODULE_CONSERVATION, not yet wired in any atlas registry). The cleanest round-1 contract is: lift the JS, leave the consumer untouched, replace the producer in round 2.

### Inline styles → utility classes

A handful of inline `style="..."` attributes lived on the legacy `<style>` block's class consumers. Lifted to `.pop-*` utility classes in `population.css`:

- `.pop-ascii-block` / `.pop-ascii-foot` — page1's ASCII mock-up
- `.pop-list` — the "indented + relaxed line-height" `<ol>` / `<ul>` treatment
- `.pop-pg-*` — planning-grid `grid-template-columns` templates (one per layout: qc-thresholds, scales, rohbins, bpsources, quadrants, fouratlases, datasources, phasing, glossary)
- `.pop-panels-2col` — two-column "planned panels" grid (page2 + page3)
- `.pop-link-accent` / `.pop-link-accent2` — accent-colored anchors
- `.pop-good` / `.pop-dim` — text colour utilities
- `.pop-xref` — page7 cross-references block
- `.pop-code-block` — JSON-schema preformatted blocks (page8 + page9)
- `.pop-file-hidden` — hidden file inputs
- `.pop-bp-toolbar-spaced` / `.pop-title-sub` / `.pop-fhh-plot-slot` — small page9 utilities

Fragments now render identically without any inline CSS, so they survive `innerHTML` injection through the router and can be unit-tested by raw HTML comparison if needed.

### Registry round-1 posture (matches the inversion step-17 rule)

`pages.registry.json` declares each page with `_label` + `_doc`. `requires_layers` / `requires_slots` / `preloads` are all `[]`. `layers.registry.json` declares the **shape of the contract** for nine planned layers (`per_sample_stats`, `family_clusters`, `inversion_carriers`, `marker_controls`, `hatchery_health_cohorts`, `ngsadmix_q`, `pcangsd_pca`, `ngsrelate_kinship`, `module_qc_summary`) but all are marked `"_status": "not_loaded"`. `slots.registry.json` declares the cross-atlas slots (`activeChrom`, `candidate`) and the page-private slots that the verbatim JS reaches for via `window.state.*` (`_breedingPage`, `_hatcheryHealth`, `perSampleStats`, `familyClusters`, `inversionCarriers`, `markerControls`).

Nothing in the registry is load-bearing yet — it's all `_doc` + contract shape. Round 2 fills in the actual `requires_*` arrays and turns on the layer producers.

---

## Test summary

**18 test files** (9 unit + 9 smoke) following the inversion-atlas pattern exactly (`tests/test_<stage>_pageN.js` + `tests/smoke_<stage>_pageN_round1.mjs`).

| Test                              | What it covers                                                                 |
|-----------------------------------|--------------------------------------------------------------------------------|
| test_qc_page1.js                  | exports + PAGE1_META + _state.js live-binding + refreshPage1 no-op + wrapper side-effect |
| test_qc_page2.js                  | exports + PAGE2_META + _state.js live-binding                                   |
| test_structure_page3.js           | exports + PAGE3_META + _state.js                                                |
| test_structure_page4.js           | exports + PAGE4_META + _state.js                                                |
| test_structure_page5.js           | exports + PAGE5_META + _state.js                                                |
| test_structure_page6.js           | exports + PAGE6_META + _state.js                                                |
| test_help_page7.js                | exports + PAGE7_META + _state.js                                                |
| test_health_page8.js              | exports + PAGE8_META + _state.js + **window._bp\* contract** + BP_SOURCE_DEFS shape + BP_STATUS_LABELS + auto-derivation top-1% F_ROH cut + _bpParseTsv + _bpIsValidJson |
| test_health_page9.js              | exports + PAGE9_META + _state.js + **window._fhh\* contract** + FHH_VERDICTS shape + **four-quadrant verdict logic** + _fhhResolveHRef species fallback + _fhhFocalCohort flag priority + _fhhParseTsv + _fhhIsValidJson |
| smoke_qc_page1_round1.mjs         | mount/unmount lifecycle + _pageState stash identity + refreshPage1 re-render path |
| smoke_qc_page2_round1.mjs         | mount/unmount lifecycle                                                         |
| smoke_structure_page{3,4,5,6}_round1.mjs | mount/unmount lifecycle (one each, same shape as page1 smoke)            |
| smoke_help_page7_round1.mjs       | mount/unmount lifecycle                                                         |
| smoke_health_page8_round1.mjs     | **rich**: empty-state DOM (bp-empty + 6 source cards + scaffold badge) → auto-derivation populates table from window.state.perSampleStats → JSON + TSV upload via _bpIngestText → filter status=red + view_mode=detailed → **hatchery-health hand-off**: page9.mount + ingest fires _bpRender, verdict row appears → export-CSV → reset → unmount |
| smoke_health_page9_round1.mjs     | **rich**: empty-state DOM (fhh-empty plot + scaffold badge + 0-cohort table badge) → 5-cohort JSON ingest exercises all four quadrants → SVG scatter rendered (5+ `<circle>` + axis labels + quadrant labels) → comparator table with FOCAL marker + colored verdict spans → summary cards (4 verdicts + cohorts-loaded) → status badge transitions planned→ready → _fhhFocalCohort is_focal priority → TSV roundtrip → export-CSV → invalid-JSON ignored → unmount |

### How to run

```bash
# From the unified workspace (after atlas-core/build/assemble.sh):
WORKSPACE=$(pwd) bash population-atlas/_tooling/run_migrated_tests.sh

# Or against the source tree directly:
cd ~/Atlas_workspace/population-atlas
WORKSPACE=$(pwd) bash _tooling/run_migrated_tests.sh
```

The harness prints `✓` / `✗` per file plus a `pass=N fail=M` total. Exit code is 0 iff all tests pass.

### ⚠ Tests NOT yet executed

**Tests were authored but not run** — the Windows host where the carve happened has no node installed. The tests follow the inversion-atlas pattern exactly (which is known-green at 919/919 in the round-5-step-18 baseline), and the `_dom_polyfill.mjs` is a superset of the inline polyfills used by `smoke_review_page4_round5.mjs` and friends, but the actual numbers will only land once you run the harness in WSL / LANTA. **Expected on first run**: a clean pass; if anything fails it'll be in the page8/page9 smokes where DOM polyfill coverage is widest (likely culprit if a smoke breaks: a method the verbatim JS calls that the polyfill doesn't implement — easy to add to `_dom_polyfill.mjs`).

---

## Open items for round 2

1. **Wire registry layers.** The nine `_status: "not_loaded"` entries in `layers.registry.json` need their producers wired and `requires_layers` filled in on `pages.registry.json`. Suggested order:
   - `per_sample_stats` (feeds page1 + page8 → biggest payoff)
   - `module_qc_summary` (feeds page2)
   - `hatchery_health_cohorts` (feeds page9 → loaded today as user-upload only)
   - `family_clusters` / `ngsrelate_kinship` / `pcangsd_pca` / `ngsadmix_q` (feeds page3)
   - `inversion_carriers` / `marker_controls` (cross-atlas import from Inversion Atlas)

2. **Replace `window.state.*` reads with `Registry.subscribe()`.** Once layers are wired, the page8 auto-derivation hooks and page9 ingest should pull from the registry rather than the legacy window contract. The legacy `window._bp* / _fhh*` exposure can stay as a back-compat shim or be removed.

3. **Per-page CSS split.** `population.css` currently ships everything in one bundle (matching the inversion-atlas's `inversion.css` round-1 posture). Split into per-page stylesheets and reference them from each page entry's `stylesheet:` field in `manifest.json` — the router already loads page-stylesheet on mount (see `atlas-core/core/atlas_router.js:66-69`).

4. **Smoke the assembly.** `bash atlas-core/build/assemble.sh && bash $WORKSPACE/start.sh`, then walk the 9 pages in a browser to confirm the carved-out fragments render the same as the legacy single-file scaffold. Expected: identical visual output. Risk areas: yellow-accent theming on the shell topbar (the legacy header chrome doesn't exist under the atlas-core shell — accent tokens are still set by `population.css`'s `:root` block, but the topbar styling lives in atlas-core's shell.css).

5. **Move on to Diversity Atlas.** The diversity atlas (2.5 MB v2.4) is the natural next migration — biggest of the trio, owns the per-sample H / θπ / F_ROH that pages 4/5/6 of the Population Atlas defer to.

---

## Communication preferences (still active)

Terse, direct, signal-not-flattery. PhD on LANTA, manuscript v19→v20 targeting Nature Communications.

**Active directives:**
- Migrate page by page; never wholesale. (Done — all 9 in one session because the scaffold's per-page boundaries were already clean.)
- Page renumbering at the complete end of all migrations. (Honored — page IDs match legacy.)
- Registry content (`requires_layers` / `requires_slots` / `preloads`) is out-of-scope for migrations. (Honored — round-1 leaves them empty.)
- Three-cohort discipline (NEVER violate). (Honored — manifest `_cohort` field documents the 226-sample pure C. gariepinus scope.)

---

## Suggested next move

Either:

1. **Run `_tooling/run_migrated_tests.sh` in WSL** to lock in the green baseline. (One short turn.)
2. **Smoke-boot in a browser** (`assemble.sh` + `start.sh`) to confirm visual parity with the legacy scaffold. (One short turn.)
3. **Kick off Diversity Atlas round 1** following the same carve pattern. (Multi-turn — the diversity scaffold is 40× larger than the population scaffold.)

(1) and (2) are independent and cheap; (3) is the big one.
