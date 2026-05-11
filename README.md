# population-atlas

Cohort-summary lens for the 226-sample pure *C. gariepinus* hatchery cohort: samples, QC, families & genetic clusters (PCAngsd / NGSadmix / ngsRelate / NAToRA), cohort-level heterozygosity / diversity / inbreeding summaries, hatchery-health verdict (F_ROH × H plane), and a breeding-committee sample-highlights table. Companion atlas to `inversion-atlas`, `diversity-atlas`, and `genome-atlas`; shares the `atlas-core` engine.

## Layout

```
atlases/population/              — atlas package (paired with atlas-core)
  manifest.json                  — atlas declaration: 9 pages, 4 stages, yellow accent
  pages/
    qc/                          — page1 samples · page2 QC
    structure/                   — page3 families & clusters · page4 het ↗ · page5 div ↗ · page6 inbreeding ↗
    health/                      — page8 breeding · page9 hatchery health (F_ROH × H plane)
    help/                        — page7 about
  registries/data/               — pages / layers / slots / files / operations registries
  css/population.css             — atlas-wide stylesheet (yellow/amber accent)

Population_atlas.html            — legacy single-file scaffold (kept as carve source-of-truth)
KICKOFF_population_atlas.md      — round-0 kickoff doc (page list, open questions)
0_READ_ME_FIRST.md               — overview of the four-atlas migration
_handoff_docs/, _tooling/, tests/   — convention from inversion-atlas
```

## Build

```sh
# in atlas-core/
bash build/assemble.sh
cd ../atlas-workspace/
bash start.sh
# then open http://localhost:8000/#/population/page1
```

`atlas-core/build/atlas.config` already lists this atlas as `atlas_population = ../../population-atlas`.

## Tests

```sh
WORKSPACE=$(pwd) bash _tooling/run_migrated_tests.sh
```

9 unit + 9 smoke tests (one of each per page). Pages 8 and 9 carry rich DOM-driven smokes that exercise the verbatim-lifted breeding-page and F_ROH × H plane logic; pages 1-7 are static-scaffold lifecycle smokes.

## Cohort discipline

Describes the **226-sample pure *C. gariepinus* hatchery cohort**. Same cohort as the Inversion Atlas and the Diversity Atlas. **Not** the F₁ hybrid (that's the Genome Atlas only); **not** the wild *C. macrocephalus* (future paper).

## Cross-atlas seam (with Diversity Atlas)

| Metric                                  | Belongs in |
|-----------------------------------------|------------|
| PCA / PCAngsd / NGSadmix / K            | Population |
| ngsRelate / NAToRA / kinship matrix     | Population |
| Per-sample H / θπ / F_ROH               | Diversity  |
| ROH atlas / ROH length classes          | Diversity  |
| Ancestry-Q stratification (per-sample)  | Diversity (consumes labels from Population) |

Pages 4 (heterozygosity ↗), 5 (diversity ↗), 6 (inbreeding ↗) are intentionally **cross-reference cards** pointing to the matching Diversity Atlas pages — the `↗` glyph in the label flags this.

## Status

Round 1 ships nine pages carved out of the legacy scaffold, all lifecycle-wrapped for the `atlas-core` router. Page8 (breeding) and page9 (hatchery health) carry the scaffold's interactive JS lifted verbatim; pages 1-7 are scaffold-only and await renderers in round 2. Registry content (`requires_layers` / `requires_slots` / `preloads`) is empty by design — those are content decisions, not migration decisions. See `_handoff_docs/HANDOFF_2026-05-11_population_round1.md` for the full round-1 log and round-2 plan.
