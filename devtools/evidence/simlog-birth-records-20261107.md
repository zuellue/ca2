# sim_log record parity (CA-18, measured 2026-11-07 ~21:42 +03)

Harness: devtools/t70-interact-iso-served.js BIRTH=1 LOGCHK=1 (200x40x160x4, plus 50x20x200x2 with
SET=reproChance=0.02): per wasm step, sim_log records (4-float [kid, parent0, parent1, kind]) vs the
step's out counters (out[0] birth, out[1] divide, out[4] fuse).

Measured: kind1 (divide) log == out[1] EXACT (9990==9990; 690==690). kind3 (fuse) log == out[4] EXACT
(134==134; 2==2). No malformed records, all parent indices in range. kind2 (birth): log 7 of 697
counted at 20 cells / reproChance 0.02 (~1%), 3903 of 13893 at 40 cells / 0.5 (~28%), 560 of 8927 at 0.05.

Reading: the birth gap is NOT buffer-headroom (256 slots free, ~7 births/step at the tiny config, 99%
still unlogged) and NOT record corruption. In the 51dce62 source, reproduce() increments out[0] BEFORE
new_kid() and returns early (no log) when new_kid fails - so out[0] counts attempts, the log counts
successes. But the failure rate implied here (~72-99%) is far above what cap exhaustion explains, while
the BIRTH counter parity (CA-3/CA-13, js birth ~= wasm out[0] within 3%) still holds and population-
sensitive counters match - so either the served binary's new_kid fails far more often than the f9
source's (without population divergence, which would mean the kids exist but the log write is skipped),
or the served binary counts births on a second unlogged path. Unresolvable without the served source:
third served-vs-source gap, with the CA-12 order artifact and the CA-15 crowdPush drift. CA-7 input.

LOGCHK verdict gates on: kind1/kind3 exact, no malformed records, 0 < kind2 <= out[0]. The kind2
ratio is printed as a measured line, not gated.
