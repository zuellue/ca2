#!/bin/sh
# ca2-feed-repro.sh - CA-40 fed+eating divergence repro (exact lane config).
# Food eating requires SET=foodEatR=<px>: the harness strips the app preset that
# sets P.foodEatR, so without it fd < radius+undefined = NaN and nothing ever
# eats (a "clean" run without this SET is no-eat, not parity). eatChance is the
# cell-eat-cell path, unrelated. Every run prints FEED eats js=<n> (0 = config
# error). The runner keeps evidence at $OUT.keep-* on any non-CLEAN verdict.
# Exit status: 0 only when every run completed (CLEAN or SEED verdict); any
# ERROR/crash or unrun case exits 1. Judge the result by the printed counts.
set -u
cd "$(dirname "$0")/.."
N="${1:-10}"
SEEDS=0; CLEAN=0; ERR=0; DONE=0
for i in $(seq 1 "$N"); do
  R=$(FEED=24 TRACE2=1 CA2TRIG=1 FULLST=1 SET=divideOn=1,divideAt=0.5,interactionRadius=0,foodEatR=8 STEPS=30 CA_JS=test/ca2.js OUT=/tmp/feed-repro-$i.txt ARGV="1 40 160 1" sh devtools/ca2-parity-run.sh)
  EATS=$(grep -m1 'FEED eats' /tmp/feed-repro-$i.txt || true)
  FIRST=$(grep -m1 'TR2 FIRST' /tmp/feed-repro-$i.txt || true)
  echo "run$i: $R | $EATS $FIRST"
  case "$R" in
    CLEAN*) CLEAN=$((CLEAN+1)); DONE=$((DONE+1));;
    SEED*) SEEDS=$((SEEDS+1)); DONE=$((DONE+1));;
    *) ERR=$((ERR+1));;
  esac
done
UNRUN=$((N-DONE-ERR))
echo "summary: completed=$DONE (clean=$CLEAN seeds=$SEEDS) crashed_or_error=$ERR unrun=$UNRUN of $N (expect seeds>0 while the eat-path attribution is open)"
if [ "$ERR" -ne 0 ] || [ "$UNRUN" -ne 0 ] || [ "$DONE" -ne "$N" ]; then exit 1; fi
exit 0
