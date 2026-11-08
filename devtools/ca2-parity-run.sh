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
# Fail-closed (opt-in): REQUIRE=comma-list of env keys that must be non-empty (pseudo-key
#   SEEDED-FULLST also refuses FULLST=1 without STATESEED); NEEDCOUNT=comma-list of TR2CH
#   counters that must be nonzero on some side. Gates apply only when supplied; a default
#   unseeded FULLST run stays allowed verdict-only. NEEDCOUNT proves non-vacuity, not
#   parity - the verdict path still catches event divergence. Violations: ERROR exit 2.
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

# fail-closed probe contract (R2AH 2026-11-08, qualified): the gates apply only when the
# caller supplies REQUIRE/NEEDCOUNT. Without them the runner is unchanged: a default
# unseeded FULLST comparison stays allowed as a verdict-only run (birth-mutation battery
# mode), never a seeded gate. REQUIRE=a,b: each named env var must be set non-empty
# (identifiers are allowlist-validated before evaluation; SEEDED-FULLST is a pseudo-key
# handled below, never evaluated). REQUIRE=SEEDED-FULLST additionally refuses FULLST=1
# without STATESEED - the empty-CFG false-clean class. NEEDCOUNT=a,b: each named counter
# (birth,divide,eaten,merge,fuse,pair,hit,death) must be nonzero on at least one side in
# the TR2CH lines. NEEDCOUNT proves NON-VACUITY only (the gate fired at least once on
# some side); it does not prove parity - the verdict path still compares js vs wasm per
# step and catches event divergence. Any violation is ERROR, never clean.
if [ "${REQUIRE:-}" ]; then
  for rq in $(echo "$REQUIRE" | tr ',' ' '); do
    case "$rq" in SEEDED-FULLST) continue ;; esac
    case "$rq" in
      ""|[0-9]*|*[!A-Za-z0-9_]*)
        echo "ERROR bad-require-key $rq (not an env identifier)"; exit 2 ;;
    esac
    eval "rv=\${$rq:-}"
    if [ -z "$rv" ]; then echo "ERROR missing-required-env $rq"; exit 2; fi
  done
fi
case ",${REQUIRE:-}," in
  *,SEEDED-FULLST,*)
    if [ "${FULLST:-}" = "1" ] && [ -z "${STATESEED:-}" ]; then
      echo "ERROR unseeded-FULLST (STATESEED required for a gated parity run)"; exit 2
    fi ;;
esac

node devtools/t70-interact-iso-served.js $ARGV > "$OUT" 2>&1
rc=$?
if [ "${NEEDCOUNT:-}" ]; then
  for nc in $(echo "$NEEDCOUNT" | tr ',' ' '); do
    nsum=$(grep -E '^TR2CH (js|wasm) ' "$OUT" | grep -o "$nc=[0-9]*" | awk -F= '{s+=$2} END {print s+0}')
    if [ "$nsum" = "0" ]; then cp "$OUT" "$OUT.keep-vacuous-$$"; echo "ERROR vacuous-counter $nc (zero on both sides, every state)"; exit 2; fi
  done
fi
keep() { cp "$OUT" "$OUT.keep-$(date +%Y%m%d-%H%M%S)-$$"; } # evidence is never overwritten: non-CLEAN runs leave a timestamped copy
if grep -q 'TR2 FIRST DIVERGENCE' "$OUT"; then
  ST=$(grep -m1 'TR2 FIRST DIVERGENCE' "$OUT" | sed -n 's/.*step \([0-9]*\).*/\1/p')
  keep
  echo "SEED step=$ST"
  exit 1
fi
if [ "$rc" -ne 0 ]; then keep; echo "ERROR exit=$rc"; exit 2; fi
V=$(grep -m1 "$MARKER" "$OUT" || true)
if [ -z "$V" ]; then keep; echo "ERROR no-verdict (marker '$MARKER' missing)"; exit 2; fi
if echo "$V" | grep -q FAIL; then keep; echo "FAIL: $V"; exit 1; fi
if echo "$V" | grep -q PASS; then echo "CLEAN: $V"; exit 0; fi
if echo "$MARKER" | grep -q ORACLE; then
  RAW=$(echo "$V" | sed -n 's/.*raw mismatched states \([0-9]*\).*/\1/p')
  POST=$(echo "$V" | sed -n 's/.*post-stepSquash \([0-9]*\).*/\1/p')
  if [ "${RAW:-x}" = "0" ] && [ "${POST:-x}" = "0" ]; then echo "CLEAN: $V"; exit 0; fi
  keep
  echo "SEED raw-mismatched=${RAW:-?} post-squash=${POST:-?}: $V"; exit 1
fi
FIRST=$(echo "$V" | grep -o '[0-9][0-9]*\.[0-9][0-9]*' | grep -vn '^0\.0000$' | head -1 | cut -d: -f1 || true)
if [ -n "$FIRST" ]; then echo "SEED step=$((FIRST-1))"; exit 1; fi
echo "CLEAN: $V"; exit 0
