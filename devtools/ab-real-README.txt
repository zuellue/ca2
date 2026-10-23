ab-real: real-time A/B, test only (not production).
Source: t-ab-real.js (run: node devtools/t-ab-real.js <seed> <port>, from a tree containing devtools/harness.js + dbg-inject.js).
Params: default P, 760x460 desktop, seeded LCG Math.random (seed*2654435761), 8 s warm-up, 10 samples every 4 s. Seeds 1,2,3. Serial, one Chrome.
BASE = origin/main e74a12e (/tmp/base2); CAND = food-ink-wings-r2 b4aea65183c2.
Limits: not same-initial-state (spawn RNG diverges by design; real-time clock not virtual); n=3; fps ~3 in sandbox so no cost data.
Harness failure: devtools/t-ab-virtual.js (virtual clock + stepped rAF) hangs on first __step(20) after 120-frame warm-up on BOTH trees (harness defect, cause not found; not run through CDP pause). Not included as evidence.
