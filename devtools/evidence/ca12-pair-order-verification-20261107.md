# gap1 (CA-12 pair order) verification on the alignment branch (2026-11-07): ALREADY ALIGNED, no patch needed

sim.rs step() (51dce62:470-495): `for i in (0..n0).rev()` with inner `for k in (0..i).rev() { interact(i, k) }` - descending pairs, update(i)+check_survival(i) before the cell's pairs, keep_in(i) after, REM flag + deferred removal.

ca2.js JS fallback loop (test/ca2.js:2275-2297, CA-13): `for (i = cells.length-1; i>=0; i--)` with `for (k = i-1; k >= 0; k--) interact(c, cells[k])` - same descending order, update/checkSurvival before pairs, keepIn after, deferred death post-pass. interact argument order matches (a=cells[i], b=cells[k], i>k both sides).

Harness loop (devtools/t70-interact-iso-served.js:20): same descending shape.

The chance-gated drift the pair order caused was fixed in CA-13 (c8c7f1b): BIRTH 800x4 PASSes with 3% counters. No remaining JS<->wasm pair-order divergence. The CA-12 t133 budget artifact (served enforces the per-cell displacement budget, fresh 51dce62 build does not on small-maxSpeed cells) is a v6/v8b-fixes-on-top-of-51dce62 difference in the pair-resolve clamp, not an iteration-order difference, and it does not move any t70 verdict.

NOTE on the earlier anticipation probe: FULLST walls are STATIC (cont.wvx*=0), so the anticipation block never fires in FULLST and the STEPS=14 flip-to-PASS after its removal was run-to-run noise, not mechanism. crowdPush envV in FULLST comes from the crowd-drift channel only. The sustained-wasm-envV mechanism at STEPS 22+ remains open; next probes: per-step envV injection accounting (LOGCHK-style envV ledger per channel: crowd-drift vs contact-resolve vs separation), then the drift-condition edge (`c.x - x0 < z` centre-based vs any radius/eased-radius difference in x0..y1 between engines).
