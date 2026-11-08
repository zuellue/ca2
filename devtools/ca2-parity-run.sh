#!/bin/sh
# ca2-parity-run.sh - CA parity comparison runner with strict crash accounting.
# A comparison is CLEAN only when the harness exits 0 AND prints the expected
# verdict marker. A crash, nonzero exit, or missing verdict is ERROR - never clean.
#
# Normal run: env (TRACE2/CA2TRIG/SET/STEPS/CA_JS/...) passes through;
#   ARGV (default "1 30 220 1") and MARKER (default "TR2 per-step") select the
#   harness argv and the verdict line to require.
#   Prints CLEAN | SEED step=<n> | FAIL | ERROR <why>; exit 0/1/1/2.
# --selfcheck: runs devtools/ca2-selfcheck-crash.js (deliberate crash); the run
#   MUST be reported as a failure. Prints SELFCHECK PASS/FAIL; exit 0/1.
set -u
cd "$(dirname "$0")/.."
OUT="${OUT:-/tmp/ca2-parity-run-out.txt}"
ARGV="${ARGV:-1 30 220 1}"
MARKER="${MARKER:-TR2 per-step}"

if [ "${1:-}" = "--selfcheck" ]; then
  TRACE2=1 CA2TRIG=1 STEPS=1 CA_JS=devtools/ca2-selfcheck-crash.js \
    node devtools/t70-interact-iso-served.js $ARGV > "$OUT" 2>&1
  rc=$?
  mcount=$(grep -c "$MARKER" "$OUT" || true)
  if [ "$rc" -ne 0 ] || [ "$mcount" -eq 0 ]; then
    echo "SELFCHECK PASS: deliberate crash reported as failure (exit=$rc, verdict lines=$mcount)"
    exit 0
  fi
  echo "SELFCHECK FAIL: deliberate crash counted as clean"
  exit 1
fi

node devtools/t70-interact-iso-served.js $ARGV > "$OUT" 2>&1
rc=$?
if [ "$rc" -ne 0 ]; then echo "ERROR exit=$rc"; exit 2; fi
V=$(grep -m1 "$MARKER" "$OUT" || true)
if [ -z "$V" ]; then echo "ERROR no-verdict (marker '$MARKER' missing)"; exit 2; fi
if echo "$V" | grep -q FAIL; then echo "FAIL: $V"; exit 1; fi
if echo "$V" | grep -q PASS; then echo "CLEAN: $V"; exit 0; fi
if echo "$MARKER" | grep -q ORACLE; then
  RAW=$(echo "$V" | sed -n 's/.*raw mismatched states \([0-9]*\).*/\1/p')
  POST=$(echo "$V" | sed -n 's/.*post-stepSquash \([0-9]*\).*/\1/p')
  if [ "${RAW:-x}" = "0" ] && [ "${POST:-x}" = "0" ]; then echo "CLEAN: $V"; exit 0; fi
  echo "SEED raw-mismatched=${RAW:-?} post-squash=${POST:-?}: $V"; exit 1
fi
if grep -q 'TR2 FIRST DIVERGENCE' "$OUT"; then
  ST=$(grep -m1 'TR2 FIRST DIVERGENCE' "$OUT" | sed -n 's/.*step \([0-9]*\).*/\1/p')
  echo "SEED step=$ST"
  exit 1
fi
FIRST=$(echo "$V" | grep -o '[0-9][0-9]*\.[0-9][0-9]*' | grep -vn '^0\.0000$' | head -1 | cut -d: -f1 || true)
if [ -n "$FIRST" ]; then echo "SEED step=$((FIRST-1))"; exit 1; fi
echo "CLEAN: $V"; exit 0
