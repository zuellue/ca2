#!/bin/sh
# t-birth-mutation.sh - negative test: with auto birth readback (CA-38c reconciliation),
# a real JS/wasm birth difference must STILL be reported as divergence, never clean.
# Baseline (test/ca2.js) must be CLEAN; the fixture (devtools/ca2-birth-mutant.js,
# divide energy split perturbed) must produce a SEED/FAIL verdict.
set -u
cd "$(dirname "$0")/.."
CFG="TRACE2=1 CA2TRIG=1 FULLST=1 SET=divideOn=1,divideAt=0.5,interactionRadius=0 STEPS=10"
BASE=$(eval env $CFG CA_JS=test/ca2.js OUT=/tmp/tbm-base.txt sh devtools/ca2-parity-run.sh)
MUT=$(eval env $CFG CA_JS=devtools/ca2-birth-mutant.js OUT=/tmp/tbm-mut.txt sh devtools/ca2-parity-run.sh)
echo "baseline: $BASE"
echo "mutant:   $MUT"
case "$BASE" in CLEAN*) :;; *) echo "FAIL: baseline not clean"; exit 1;; esac
case "$MUT" in CLEAN*) echo "FAIL: mutant counted clean - readback is masking real birth differences"; exit 1;; SEED*|FAIL*|ERROR*) echo "PASS: birth mutation detected ($MUT)"; exit 0;; *) echo "FAIL: unexpected verdict"; exit 1;; esac
