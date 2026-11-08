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
for FIX in ca2-birth-mutant ca2-radius-mutant ca2-sq-mutant ca2-crowd-mutant ca2-envv-mutant ca2-age-mutant; do
  MUT=$(eval env $CFG CA_JS=devtools/$FIX.js OUT=/tmp/tbm-$FIX.txt sh devtools/ca2-parity-run.sh)
  echo "$FIX: $MUT"
  case "$MUT" in CLEAN*) echo "FAIL: $FIX counted clean - divergence was masked"; exit 1;; SEED*|FAIL*) :;; *) echo "FAIL: $FIX errored or unexpected verdict ($MUT) - a crash does not prove detection"; exit 1;; esac
done
echo "PASS: all mutations detected"
