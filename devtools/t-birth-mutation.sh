#!/bin/sh
# t-birth-mutation.sh - negative test: with auto birth readback (CA-38c reconciliation),
# a real JS/wasm birth difference must STILL be reported as divergence, never clean.
# Baseline (test/ca2.js) must be CLEAN; the fixture (devtools/ca2-birth-mutant.js,
# divide energy split perturbed) must produce a SEED/FAIL verdict.
set -u
cd "$(dirname "$0")/.."
CFG="TRACE2=1 CA2TRIG=1 FULLST=1 SET=divideOn=1,divideAt=0.5,interactionRadius=0 STEPS=10"
BASE=$(eval env $CFG CA_JS=test/ca2.js OUT=/tmp/tbm-base.txt sh devtools/ca2-parity-run.sh)
echo "baseline: $BASE"
case "$BASE" in CLEAN*) :;; *) echo "FAIL: baseline not clean"; exit 1;; esac
for FIX in ca2-birth-mutant ca2-radius-mutant ca2-sq-mutant ca2-sqs-mutant ca2-crowd-mutant ca2-envv-mutant ca2-age-mutant; do
  MUT=$(eval env $CFG CA_JS=devtools/$FIX.js OUT=/tmp/tbm-$FIX.txt sh devtools/ca2-parity-run.sh)
  echo "$FIX: $MUT"
  case "$MUT" in CLEAN*) echo "FAIL: $FIX counted clean - divergence was masked"; exit 1;; SEED*|FAIL*) :;; *) echo "FAIL: $FIX errored or unexpected verdict ($MUT) - a crash does not prove detection"; exit 1;; esac
done
# CA-40 residual: on the flagged path the eat-range test must use the loop-entry radius;
# a live-radius mutant (devtools/ca2-eatrange-mutant.js) must diverge on an eating config.
ECFG="FEED=24 TRACE2=1 CA2TRIG=1 FULLST=1 STATESEED=1 SET=divideOn=1,divideAt=0.5,interactionRadius=0,foodEatR=8 STEPS=30"
EBASE=$(env $ECFG CA_JS=test/ca2.js OUT=/tmp/tbm-eat-base.txt ARGV="1 40 160 1" sh devtools/ca2-parity-run.sh)
echo "eat baseline: $EBASE"
case "$EBASE" in CLEAN*) :;; *) echo "FAIL: eat baseline not clean"; exit 1;; esac
EMUT=$(env $ECFG CA_JS=devtools/ca2-eatrange-mutant.js OUT=/tmp/tbm-eat-mut.txt ARGV="1 40 160 1" sh devtools/ca2-parity-run.sh)
echo "ca2-eatrange-mutant: $EMUT"
case "$EMUT" in CLEAN*) echo "FAIL: ca2-eatrange-mutant counted clean - divergence was masked"; exit 1;; SEED*|FAIL*) :;; *) echo "FAIL: ca2-eatrange-mutant errored or unexpected verdict ($EMUT) - a crash does not prove detection"; exit 1;; esac
# shp guard: a flagged-path fixture creating t=1 string cells must trip SHPGUARD; the
# guard line must be present - a non-clean verdict alone does not prove the guard fired.
SMUT=$(env $ECFG CA_JS=devtools/ca2-shpstring-mutant.js OUT=/tmp/tbm-shp.txt ARGV="1 40 160 1" sh devtools/ca2-parity-run.sh)
echo "ca2-shpstring-mutant: $SMUT"
case "$SMUT" in CLEAN*) echo "FAIL: shpstring mutant counted clean"; exit 1;; *) :;; esac
grep -q '^SHPGUARD FAIL' /tmp/tbm-shp.txt || { echo "FAIL: SHPGUARD line missing - the non-clean verdict did not come from the guard"; exit 1; }
echo "PASS: all mutations detected"
