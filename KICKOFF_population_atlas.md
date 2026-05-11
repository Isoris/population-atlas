# 🟢 KICKOFF — Population Atlas migration

**Date:** 2026-05-07
**Atlas ID (proposed):** `population`
**Repo (proposed):** `population-atlas` (sibling to
`catfish-population-analysis`, the analysis-pipeline repo)
**Cohort:** 226-sample pure *C. gariepinus* hatchery cohort, LANTA.
**Status:** No migration yet. Round 0 / scoping.

---

## What exists today

A single-file scaffold HTML:
- `Population_atlas.html` — ~63 KB. Older single-link `tabBar`
  pattern (only links to Inversion Atlas, doesn't yet have the
  four-atlas dropdown).

Cross-link rewrite already done in chat 07759823 (filename references
now use the canonical `Inversion_atlas.html` / `Genome_atlas.html` /
`Diversity_atlas.html` names).

Beyond the scaffold, there is **no real content yet** — no pages,
no per-page modules, no registries, no tests, no handoff docs.

The **analysis pipeline** that feeds this atlas, however, is real:
`catfish-population-analysis` repo (per the four-repo split in
chat 6144abe7), holding MODULE_2A (Beagle GL prep) and MODULE_2B
(population structure: PCAngsd, NGSadmix, evalAdmix, ngsRelate,
NAToRA).

---

## What this atlas is for

Per the v4 session memory:
*"Population Atlas — Samples / QC / Families / Heterozygosity /
Diversity / Inbreeding."*

Note that "Heterozygosity / Diversity / Inbreeding" overlaps with
the **Diversity Atlas's** scope. There is a genuine seam here that
you've already drawn (chat 6144abe7):

- **Population Atlas** answers *"how is the cohort structured?"*
  → cohort-level objects: PCs, K, kinship, the unrelated subset.
- **Diversity Atlas** answers *"how diverse is each sample, and
  where?"* → per-sample objects: H, θπ tracks, ROH BEDs.

The v4 memory line listed "Heterozygosity / Diversity / Inbreeding"
under Population Atlas because that line predates the seam. The
**newer, correct boundary** is the one in chat 6144abe7.

---

## Open questions for Quentin (must answer before round 1)

### Q1 — page list, per the correct (cohort-level) boundary

Likely pages, given the cohort-level scope:

| # | Page | What it shows | Source |
|---|---|---|---|
| 1 | `samples_qc` | Per-sample QC, coverage, mapping rate, sex inference | MODULE_2A outputs |
| 2 | `pca` | PCA / PCAngsd cohort-level scatter, scree, loadings | MODULE_2B/02_pcangsd |
| 3 | `admixture` | NGSadmix K=2..K_max, log-likelihood, evalAdmix residuals | MODULE_2B/03_ngsadmix |
| 4 | `relatedness` | ngsRelate kinship matrix, NAToRA unrelated subset | MODULE_2B/04_relatedness |
| 5 | `canonical_K` | Final-K decision, ancestry labels per sample | MODULE_2B/05_canonical_K |
| 6 | `families` | Pedigree / first-degree relative network | derived from ngsRelate |
| 7 | `founder_space` | EFHD (effective founder haplotype diversity), per-chromosome FD_chr | chat 84f73a99 — EFHD framework |

Some of these overlap with what's already been built for the
manuscript (Results 2: "admixed broodstock population context").
Round 1 should pick the **most stable, most needed-for-manuscript**
page and migrate it.

Decide:
- Which pages are in scope for this atlas?
- Which is round-1's first page? Recommended: `pca` or
  `admixture` — both are visually load-bearing for the manuscript
  and have stable upstream data.

### Q2 — stages

Likely candidates:
- **`qc`** (samples_qc)
- **`structure`** (pca, admixture, canonical_K)
- **`relatedness`** (relatedness, families)
- **`founders`** (founder_space)

Decide: 2/3/4 stages? Labels?

### Q3 — does the Population Atlas need a popstats-style server?

The Inversion Atlas has a real popstats server
(`atlases/inversion/server/popstats_server.py`) for live data
queries. The Population Atlas's data is **mostly small, static
outputs** (PCA coords, K matrices, kinship — kilobyte-to-megabyte
scale), so it probably doesn't need a server — JSON layers loaded
from disk should be enough.

Decide: no-server (default), or carve a slim server later?

### Q4 — overlap with Diversity Atlas (the H / F_ROH question)

The v4 memory line says the Population Atlas covers
"Heterozygosity / Diversity / Inbreeding," but the corrected
analysis-repo boundary (chat 6144abe7) puts per-sample H and
F_ROH in the Diversity Atlas.

The cleanest answer: **per-sample diversity metrics belong in the
Diversity Atlas**; the Population Atlas may include them only as
covariates of a cohort-level structure view (e.g., color PCA dots
by F_ROH).

Decide:
- (a) Strict separation — H/F_ROH only in Diversity Atlas, never
  shown in Population Atlas. Recommended.
- (b) Soft overlap — Diversity Atlas is canonical, but Population
  Atlas may borrow individual fields for visualization.
- (c) Wait — defer this decision to round 3+ when overlap
  actually appears.

### Q5 — repo location

Two natural homes:
- **(a) Its own repo** `population-atlas/`, sibling to the
  analysis repo `catfish-population-analysis/`. Most consistent
  with the four-repo split. Recommended.
- **(b) Inside `catfish-population-analysis/`** as a `docs/atlas/`
  subdir. Tighter coupling to analysis outputs.

Decide: (a) or (b)?

---

## First-round plan (once Q1–Q5 are answered)

### Round 0 (this kickoff)
- ✅ Folder created, scaffold HTML dropped in.
- ✅ This kickoff doc read.
- ⏳ Q1–Q5 answered.
- ⏳ Genome Atlas round 1 completed first (recommended — Genome
  Atlas is smaller and becomes the template). If you want to start
  Population first, that's fine, but expect to write the skeleton
  from scratch following the Inversion Atlas reference.

### Round 1 — skeleton + first page
Goal: boot `atlas-core` with the Population Atlas + one page
rendering. Same shape as the Genome Atlas's round 1.

Steps:
1. **Create `population-atlas/` repo** mirroring `inversion-atlas/`.
2. **Write `manifest.json`** (`atlas_id: "population"`, stages from
   Q2, pages from Q1, registries stubbed empty).
3. **Carve out one page** from `Population_atlas.html` (or build
   one fresh if the scaffold doesn't have it yet). Use the
   Inversion Atlas's **page7 template** (thin loader stub) if the
   page is just a renderer; use the **page15 template** (real DOM
   helper) if there's a real chip toggle / interaction.
4. **Unit + smoke tests** for the page.
5. **Test harness** with the one page.
6. **Verify**: harness passes, page renders.
7. **Write the round-1 handoff** + bump CONTINUE_HERE.

Estimated time: 1.5–2.5 hours including the skeleton work.

### Recommended first page

**`pca`** — it's visually load-bearing for the manuscript (Results
2), the upstream data is stable (PCAngsd outputs), and the
rendering is well-understood (scatter plot + scree). If the
existing scaffold has a PCA placeholder, even better.

Alternative: **`admixture`** — also load-bearing for the
manuscript, but the NGSadmix K decision is still being audited so
the upstream may change. PCA is the lower-risk first page.

### Round 2+
One page per round.

---

## Reference paths in the Inversion Atlas

Same as the Genome Atlas kickoff. Specifically:

- Manifest shape: `inversion-atlas/atlases/inversion/manifest.json`
- Pages registry: `.../registries/data/pages.registry.json`
- Page template (simple): `.../pages/review/page7.{html,js}` +
  `page7/_state.js`
- Page template (real DOM): `.../pages/discovery/page15.{html,js}`
- Page template (big with sub-modules): `.../pages/discovery/page1/`
- Unit test: `inversion-atlas/tests/test_review_page7.js`
- Smoke test: `inversion-atlas/tests/smoke_review_page7_round5.mjs`
- Harness: `inversion-atlas/_tooling/run_migrated_tests.sh`
- Migration recipe: `handoff/PAGE_MIGRATION_RECIPE.md`
- Architectural-discipline rule (registry content out-of-scope):
  `handoff/HANDOFF_2026-05-07_chat38_round5_step17_done.md`

---

## What round 1 should NOT do

- **Don't try to wire up the manuscript figures yet.** Figure-to-
  page mapping is a late-stage decision.
- **Don't blur the Population / Diversity boundary** (per Q4) — if
  in doubt, leave H/F_ROH out of the Population Atlas and let the
  Diversity Atlas own them.
- **Don't import MODULE_2A / 2B analysis code into the atlas
  repo.** The atlas only consumes outputs. The analysis lives in
  `catfish-population-analysis/`.

---

## Cross-atlas boundary checklist

Before starting Population Atlas round 1, confirm with the
Diversity Atlas kickoff that the two haven't both claimed the
same page:

| Metric | Belongs in |
|---|---|
| PCA / PCAngsd / NGSadmix / K | Population |
| ngsRelate / NAToRA / kinship matrix | Population |
| Per-sample H / θπ / F_ROH | Diversity |
| ROH atlas / ROH length classes | Diversity |
| Ancestry-Q stratification (per-sample) | Diversity (consumes labels from Population) |
| Inversion calls / breakpoints | Inversion (atlas) |
| Assembly stats / synteny / TE density | Genome |

The hand-off between Population and Diversity is **ancestry
labels**: Population produces them (canonical K assignment per
sample), Diversity consumes them as a covariate.

---

## Three-cohort discipline

The Population Atlas describes the **226-sample pure *C.
gariepinus* hatchery cohort**. Same cohort as the Inversion Atlas
and the Diversity Atlas. **Not** the F₁ hybrid (that's the Genome
Atlas only), **not** the wild *C. macrocephalus* (future paper).

---

## What to do right now

1. Decide on Q1–Q5 (above).
2. Drop `Population_atlas.html` into
   `~/Atlas_workspace/population-atlas/`.
3. Drop this kickoff into the same folder.
4. If you haven't yet, schedule the **Genome Atlas round 1 first**
   (it becomes the template). Otherwise schedule Population round
   1 directly.
