#!/bin/sh
# Runner fail-closed contract (R2AH 2026-11-08): missing required keys, unseeded
# FULLST, and all-zero required counters must be ERROR (exit 2), never "clean".
# Reproduces the 2026-11-08 empty-CFG false clean as a negative test.
fails=0
chk() { # $1 desc, $2 expected-exit, $3 expected-text, then the command in $@
  d=$1; x=$2; t=$3; shift 3
  out=$("$@" 2>&1); rc=$?
  if [ "$rc" = "$x" ] && echo "$out" | grep -q "$t"; then echo "PASS: $d"; else echo "FAIL: $d (exit=$rc out=$(echo "$out" | head -1))"; fails=1; fi
}
EATCFG() { FEED=24 TRACE2=1 CA2TRIG=1 FULLST=1 STATESEED=1 SET=divideOn=1,divideAt=0.5,interactionRadius=0,foodEatR=8 STEPS=3 ARGV="1 40 160 1" OUT="$1" sh devtools/ca2-parity-run.sh; }
chk "missing required key errors" 2 "missing-required-env STATESEED" \
  env REQUIRE=FULLST,STATESEED TRACE2=1 FULLST=1 OUT=/tmp/rfc1.txt sh devtools/ca2-parity-run.sh
chk "unseeded FULLST refused when SEEDED-FULLST required" 2 "unseeded-FULLST" \
  env REQUIRE=SEEDED-FULLST TRACE2=1 CA2TRIG=1 FULLST=1 OUT=/tmp/rfc2.txt sh devtools/ca2-parity-run.sh
chk "unseeded FULLST verdict comparison still allowed (battery mode)" 0 "CLEAN" \
  env TRACE2=1 CA2TRIG=1 FULLST=1 SET=divideOn=1,divideAt=0.5,interactionRadius=0 STEPS=2 OUT=/tmp/rfc2b.txt sh devtools/ca2-parity-run.sh
chk "empty-CFG probe errors (the 2026-11-08 false clean)" 2 "missing-required-env FULLST" \
  env REQUIRE=FULLST,STATESEED,TRACE2 OUT=/tmp/rfc3.txt sh devtools/ca2-parity-run.sh
chk "vacuous required counter errors" 2 "vacuous-counter fuse" \
  env REQUIRE=FULLST,STATESEED,TRACE2 NEEDCOUNT=fuse FEED=24 TRACE2=1 CA2TRIG=1 FULLST=1 STATESEED=1 SET=divideOn=1,divideAt=0.5,interactionRadius=0,foodEatR=8 STEPS=3 ARGV="1 40 160 1" OUT=/tmp/rfc4.txt sh devtools/ca2-parity-run.sh
chk "positive control: divide counter nonzero, run clean" 0 "CLEAN" \
  env REQUIRE=FULLST,STATESEED,TRACE2 NEEDCOUNT=divide FEED=24 TRACE2=1 CA2TRIG=1 FULLST=1 STATESEED=1 SET=divideOn=1,divideAt=0.5,interactionRadius=0,foodEatR=8 STEPS=3 ARGV="1 40 160 1" OUT=/tmp/rfc5.txt sh devtools/ca2-parity-run.sh
# hostile REQUIRE keys must be rejected before eval (R2AH on add39a4c: punctuation-leading bypass)
chk "hostile key: semicolon" 2 "bad-require-key" \
  env 'REQUIRE=FOO;echo PWNED' TRACE2=1 FULLST=1 OUT=/tmp/rfc6.txt sh devtools/ca2-parity-run.sh
chk "hostile key: leading dash" 2 "bad-require-key" \
  env 'REQUIRE=-x' TRACE2=1 FULLST=1 OUT=/tmp/rfc7.txt sh devtools/ca2-parity-run.sh
chk "hostile key: leading digit" 2 "bad-require-key" \
  env 'REQUIRE=9BAD' TRACE2=1 FULLST=1 OUT=/tmp/rfc8.txt sh devtools/ca2-parity-run.sh
chk "hostile key: dollar" 2 "bad-require-key" \
  env 'REQUIRE=A$B' TRACE2=1 FULLST=1 OUT=/tmp/rfc9.txt sh devtools/ca2-parity-run.sh
[ $fails = 0 ] && echo "FAILCLOSED: all checks pass" || exit 1
