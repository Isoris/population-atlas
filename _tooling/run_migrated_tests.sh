#!/usr/bin/env bash
# population-atlas/_tooling/run_migrated_tests.sh
#
# Run all migrated-page tests for the Population Atlas.
#
# Round 1 (2026-05-11): nine pages migrated from legacy/Population_atlas.html
# into atlases/population/. Unit + smoke per page.
#
#   qc        : page1 (samples), page2 (QC)
#   structure : page3 (families & clusters), page4 (heterozygosity ↗),
#               page5 (diversity ↗), page6 (inbreeding ↗)
#   health    : page8 (breeding), page9 (hatchery health — F_ROH × H plane)
#   help      : page7 (about)
#
# The harness expects $WORKSPACE to be the assembled workspace root
# (created by atlas-core/build/assemble.sh) where atlases/_index.json
# lists 'population'. The smoke tests resolve their imports via
# $WORKSPACE/atlases/population/... so the same harness works whether
# you point at:
#   - the unified workspace (post-assemble.sh, all atlases together), or
#   - the population-atlas source tree directly (set
#     WORKSPACE=$(pwd)/.. when running from population-atlas/_tooling/).
set -u
WS="${WORKSPACE:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$WS"
export WORKSPACE="$WS"

UNITS=(
  test_qc_page1.js
  test_qc_page2.js
  test_structure_page3.js
  test_structure_page4.js
  test_structure_page5.js
  test_structure_page6.js
  test_help_page7.js
  test_health_page8.js
  test_health_page9.js
)

SMOKES=(
  smoke_qc_page1_round1.mjs
  smoke_qc_page2_round1.mjs
  smoke_structure_page3_round1.mjs
  smoke_structure_page4_round1.mjs
  smoke_structure_page5_round1.mjs
  smoke_structure_page6_round1.mjs
  smoke_help_page7_round1.mjs
  smoke_health_page8_round1.mjs
  smoke_health_page9_round1.mjs
)

TOTAL_P=0
TOTAL_F=0
NO_RESULTS=()
FAILURES=()

for f in "${UNITS[@]}" "${SMOKES[@]}"; do
  out=$(node "tests/$f" 2>&1)
  p=$(echo "$out" | grep -oP 'pass:\s*\K\d+' | tail -1)
  fa=$(echo "$out" | grep -oP 'fail:\s*\K\d+' | tail -1)
  if [ -z "$p" ]; then
    echo "  ✗ $f -> NO_RESULT"
    echo "$out" | tail -10
    TOTAL_F=$((TOTAL_F + 1))
    NO_RESULTS+=("$f")
  else
    if [ "$fa" != "0" ]; then
      echo "  ✗ $f -> pass=$p fail=$fa"
      FAILURES+=("$f")
    else
      printf "  ✓ %-50s %3d\n" "$f" "$p"
    fi
    TOTAL_P=$((TOTAL_P + p))
    TOTAL_F=$((TOTAL_F + fa))
  fi
done

echo "==================="
echo "TOTAL: pass=$TOTAL_P fail=$TOTAL_F"
if [ "${#FAILURES[@]}" -gt 0 ]; then
  echo "FAILURES: ${FAILURES[*]}"
fi
if [ "${#NO_RESULTS[@]}" -gt 0 ]; then
  echo "NO_RESULT: ${NO_RESULTS[*]}"
fi

if [ "$TOTAL_F" -gt 0 ]; then
  exit 1
fi
