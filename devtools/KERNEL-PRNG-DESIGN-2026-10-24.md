# Kernel-internal PRNG compatibility design (DRAFT for review, no kernel-stream code written)
Base: wasm-jsrnd-spike @ d69eb5bd. Kernel stream semantics unchanged while measuring.

## 1. Measured (one 15 s headless run per mode, jsrnd=1, foodMode set via setKey; devtools/t-kernel-hits.js on a patched COPY of ca2.js with a counter before each `E.<kernel>(` call; raw: devtools/cmp-traces/kernel-hits-2026-10-24.txt)
Headless frame rate is low, so counts are small. They show reachability only, not rates on a device (ölçülmedi).
| foodMode | kernel calls (15 s) | new hooks | fsN | JS-stream Math.random total |
|---|---|---|---|---|
| 1 life | fd1_tick 3, sw_run 2, tr_run 5, pa_run 5, bs_run 5 | lbN 0 | 1 | 6606 |
| 2 blobs | sw_run 5, pa_run 6, bs_run 6, tr_run 4 | lbN 0 | 2527 | 6232 |
| 3 swarm | sw_run 7, pa_run 6, bs_run 6, tr_run 5 | lbN 0 | 2447 | 8956 |
| 4 worms | wm_run 2, sw_run 5, pa_run 6, bs_run 6, tr_run 4 | wmN 0 | 2871 | 4793 |
| 5 spores | sp_run 2, sw_run 4, pa_run 6, bs_run 6, tr_run 4 | n/a | 5507 | 6244 |
- Hooks lifeBirths (lbN) and wormGrowSplit (wmN) were hit 0 times in every mode where they could apply. Measured, consistent with the source reading: they sit in the JS body after stepFoodW/stepWormsW.
- sw_run shows calls in modes other than 3 (2..7 per run). Cause not diagnosed (ölçülmedi); it may be calls before the mode switch took effect.
- The earlier mode-4 "timeout" was my shell loop (two ~90 s runs in one 120 s tool call), not a harness fault; the single run above completes.
- Sampled (1 in 10) Math.random callers are dominated by the wasm import js_rnd; the JS draw sites are small. Not a CPU claim.

## 2. Source-derived (read, not measured)
- fd1.rs, swarm.rs, worms.rs, spores.rs, parasites.rs, tr.rs each own an xorshift128+ r01() seeded from 2 JS Math.random draws per call, plus an 8-draw warm-up. bs.rs has no PRNG.
- r01 call sites: fd1 2, swarm 8, worms 9, spores 9, parasites 13, tr 3.
- sim.rs already has the jsrnd pattern: Sim::rnd01 calls js_rnd.
- swarm.rs order read against the JS stepSwarm body: per item vx then vy jitter; then c<2 gate 0.3, c>5 gate 0.4, birth gate 0.3 (&& can_birth), then a, b, r; refill: cx, cy then 4 x (a, b, r). Matches the JS body statement order, by reading only.
- fd1.rs birth: one r01 per accepted candidate, same as the JS body (this is what post_life_births mirrors).
- Not read yet: worms.rs, spores.rs, parasites.rs, tr.rs order against their JS bodies. Equivalence for them is unknown.

## 3. Compatibility choices
A. Keep (current default): kernel PRNG, seeded by 2 JS draws. Stream differs from the JS route by design: distribution-only, never parity. No change.
B. jsrnd feature only: each kernel r01() calls js_rnd; the warm-up and the 2 JS seed draws are removed (feature-gated, default path untouched). Target stream = the JS fallback body stream. Needs, per kernel:
   1. extraction of the REAL JS fallback body, run on identical state with a seeded Math.random against the kernel with js_rnd bound to the same stream;
   2. comparison of every output field and the draw count; faults as degraded.
   Only kernels where the order check passes would move. A kernel that does not match its JS body must stay as is and be listed as incompatible.
C. Keep the kernel PRNG and mirror it in JS (seed + state transfer): rejected for scope, because it would add a Rust-PRNG substitute to the JS route, which is not approved.
Recommended: B, one kernel at a time, order fd1_tick, sw_run, wm_run, sp_run, tr_run, pa_run (by increasing r01 sites). Every kernel needs its own boundary test before moving.

## 4. Open
- 1711/1715 (swarm life JS body): its degraded-only behaviour is its own scope. Under B it becomes the parity reference for sw_run, not an active-path port.
- Random-comparator sort (line ~598) and unhit callers are untouched.
- f32/f64 metaball and stepLive default remain main's decisions.

## 5. Results 2026-10-24 (after main's go for B on fd1 only)
### 5a. fd1 baseline (t-fd1-baseline.js: REAL stepFood/stepFoodW/wallPull/lifeBirthsJs; JS body vs current default kernel; 6000 scenarios, seeded Math.random, identical full state)
- Food all inside the plate (4241 scenarios): count, x, y, foodStat identical to the JS body; 0 mismatches. Draw count differs by design (kernel: 2 seed draws; JS: one per birth). r values only range-checked.
- Food outside the plate (1759 scenarios): 1370 mismatch in count/position/stat. Cause (source-derived, matches the failing class): fd1_flow clamps to the raw plate box [cont.x, cont.x+w], while the JS body's wallPull clamps to the inset box (foodSize/2 and boundGap). The default kernel therefore differs from the JS body for out-of-plate food, independent of the PRNG. Not fixed (default kernel stays; writers own behavior fixes).
- fd1_tick returns -1 for non-finite positions, but stepFoodW has already set foodT = now, so the JS fallback body sees the timer set and skips the tick: the tick is dropped, not recomputed in JS (measured in t-fd1-fault.js NaN/Inf cases, for candidate; same glue in default).
### 5b. fd1 candidate (jsrnd feature only): r01 -> js_rnd, no warm-up, no seed draws (fd1_jsrnd export; glue passes 0 seeds); fault after consumed draws = no redraw, tick skipped, WC.fdDeg, WC.fd1Off.
- t-fd1-baseline candidate: all-inside 4241 scenarios: 0 mismatch in count/x/y/stat AND 0 draw-count and 0 r mismatch against the JS body (same seeded stream). Outside class: stream mismatch 506 follows from the flow clamp discrepancy above (different positions -> different births), not from the PRNG change.
- t-fd1-fault.js: empty and 1-dot food equal the JS route; NaN/Inf: tick dropped, 0 draws (JS route would draw 192); fault at draw k=1..39: 39 cases, 0 bad (draws consumed = k+1, no JS redraw, food unchanged, kernel disabled afterwards).
- Page exercise (jsrnd=1, foodMode=1, 25 s, one run): fwFd=6, fdDeg=0, fd1Off=false, postOff=false. Hook-exercise only.
- Both jsrnd binaries tested; default binaries untouched and not rebuilt.
### 5c. Other four kernels, source draw-order read (no harness yet)
- worms.rs vs JS: wander draw, gates, r, fission draws (a,sp,fr,ph), spawn x,y,len, a,sp,fr,ph, link r: same site sequence. DISCREPANCY: the growth/fission loop runs worms ascending in the kernel (`for w in 0..nw`) but descending in the JS body (`for (i = worms.length - 1; i >= 0; i--)`), so with one shared stream the per-worm draws land on different worms. Incompatible until the order is aligned (writer fix) and a harness confirms.
- spores.rs vs JS: site sequence matches by reading (nm, a2, v, r, ph per mote; retire gate 0.4; vx, vy jitter; settle 0.75; spawn gate 0.35 then x,y,r,ph); both loops run descending. Unverified by harness.
- tr.rs vs JS (line ~617): x jitter, y jitter, then the (late && 0.08) gate after the d<14 test: matches by reading. Loop direction not compared.
- parasites.rs vs JS: spawn gate 0.08, cell pick, a; ph; cursor-follow x,y jitter; retreat jitter; host-follow jitter; birth a. The kernel has TWO birth sites (127, 140) vs ONE in the JS body (2089), and the cursor path is owned by the cursor writer (slots 82..87). Not comparable without a harness and the writer's input.
### 5d. sw_run calls in non-swarm modes (measured with timestamps, patched copy, mode 2, one run)
- 4 sw_run calls, all BEFORE the foodMode set (performance.now before: P.foodMode was 3 in those calls); 0 calls after the set. So the earlier sw_run counts in modes 1,2,4,5 were pre-switch calls of the default swarm mode, not initialization and not an active kernel in the set mode.
- Mode 2/4/5 counts from the first table must be read with that: only the kernels listed after the mode set were not separated by timestamp except sw_run (other kernels ölçülmedi after-set).
### 5e. Wording clarification (per main)
- The source JS fallback body can be the parity reference for an active Rust kernel (e.g. sw_run); only the separate fallback-hook port (lifeBirths, wormGrowSplit) is degraded-only scope and not active-path progress.

## 6. fd1 behaviour fixes (jsrnd-only, separate from the PRNG migration; commit after e93a08c3)
- Fix 1: fd1_flow_wp = exact port of wallPull(f, foodSize/2, false) for out-of-plate dots (inset box, gap, rFit, midpoint branch, JS min/max NaN semantics). Glue uses it only when WC.jsrnd && E.fd1_flow_wp.
- Fix 2: when fd1_flow_wp or fd1_tick returns -1 (no draw consumed), the timer is restored (foodT = foodT0) and inflow is not counted, so the JS body runs the whole step; before this, the tick was dropped.
- Consumed-draw fault behaviour unchanged (no redraw, tick skipped, WC.fdDeg, WC.fd1Off); inflow is not counted in that degraded case.
- Evidence: t-fd1-baseline.js, 6000 scenarios (8 classes x 750: inside, outside, dense lattice, empty, non-finite NaN/+-Inf, degenerate plate x1<x0, odd P (boundGap undefined/NaN/negative, foodSize NaN/negative/500), far plate 1e6): candidate vs JS body: 0 mismatch in count/x/y/stat/draws/r on BOTH jsrnd binaries. Same harness on the DEFAULT binary: mismatches in outside, dense-with-outside and non-finite classes (kept as the default's measured behaviour, untouched).
- t-fd1-fault.js: NaN/Inf now equal the JS route (192 draws each, steps 1); fault at draw k: 39 cases, 0 bad.
- Limits: far plates beyond ~1e9 (float key aliasing vs Rust i64 keys) not covered; Math.random stream is the seeded harness stream, not the browser's.

## 7. sw_run (active default-mode kernel): baseline + PRNG-migration candidate (jsrnd only). Wall rule NOT fixed.
- Harness: devtools/t-sw-baseline.js (REAL stepSwarm/stepSwarmW/swPackJs/swPackRust/clamp), 4000 scenarios, 9 classes (inside, outside, dense, empty, nonfinite, freshvel, lifeoff, lowpop, interior; ~444-445 each), seeded stream, draws counted.
- Default binary vs JS body: everything mismatches in life/jitter classes because the streams differ by design (distribution-only). The default kernel cannot be compared structurally; hence the candidate.
- Candidate (swarm.rs r01 -> js_rnd, no seed/warm-up draws under the feature; sw_run_jsrnd export; glue passes 0 seeds; consumed-draw fault = no redraw, step skipped, WC.swRunDeg, WC.swRunOff): vs the REAL JS body, same seeded stream:
  - 3012 of 3028 scenarios without an edge-touch in the kernel output: ok, 16 not ok (see cascade note). 972 scenarios with a kernel edge-touch: all 972 not ok.
  - Classes with 0 mismatches: empty (n=0, refill), nonfinite (kernel -1 -> JS body), interior (444 scenarios, plate 2000x2000, dots centred, life on/off: count, x, y, vx, vy, r, stat, swT, draws all identical).
- The structural discrepancy (measured, source-derived cause): the JS body pulls dots outside the plate gradually (`f.x += (clamp(f.x, x0+1, x1-1) - f.x) * 0.25`, vel *= 0.8), the kernel hard-clamps to the plate box (vel *= 0.8). Other JS fallback bodies (fd1 via wallPull, spores) use the absolute rule, and the kernel comment cites the absolute wall rule; the swarm JS body is the odd one out (stale vs the absolute-wall rule; which is intended: not decided by me).
- Diagnostic (NOT a fix): the same harness against a copy of the JS body with the pull replaced by `f.x = clamp(f.x, x0, x1); f.y = clamp(f.y, y0, y1)` (real source untouched): candidate matches in ALL finite classes (inside, outside, dense, empty, freshvel, lifeoff, lowpop, interior), 0 mismatch incl. draws and r. The nonfinite class mismatches there only because the kernel -1 fallback runs the real (gradual) body while the diagnostic copy is hard-wall: an artifact of the diagnostic, not a defect (real vs real: 0 mismatch).
- The 16 non-touch mismatches (4 inspected: differences 1e-3..1e-1 in x/y/vx, one count) are consistent with a cascade from a wall-touched dot that is absent from the kernel output (died) altering later neighbours (in-place updates); the hard-wall diagnostic removes all but the nonfinite artifact, which supports but does not prove this.
- Fault (t-sw-fault.js, both binaries): fault at draw k=1..59 (598 draws per step): 59 cases, 0 bad; grid-too-large (1e9 dot, -1, no kernel draws) falls to the JS body with equal draws (364) and equal result.
- Not yet: fix choice for the wall rule (kernel -> gradual, or JS body -> absolute wall) ; far/aliased grid keys; default-binary change; sw_run NOT declared compatible until the wall rule is resolved.

## 8. sw_run wall rule aligned to the REAL gradual JS body (jsrnd-only behaviour fix; main's decision: reference stays the unmodified stepSwarm body)
- swarm.rs under the jsrnd feature: x += (clamp(x, x0+1, x1-1) - x) * 0.25 (same for y), vel *= 0.8, JS clamp semantics (v<a ? a : v>b ? b : v). Default build keeps the hard clamp; real JS body unchanged.
- t-sw-baseline.js candidate vs the REAL JS body, 4000 scenarios, both jsrnd binaries: 0 mismatch in every class (count, x, y, vx, vy, r, stat, swT, draws). Classes (n): inside 445, outside 445, dense 445, empty 445, nonfinite 444, freshvel 444, lifeoff 444, lowpop 444, interior 444.
- Wall rule engaged (real JS result differs from the hard-wall diagnostic copy): 1326 scenarios, all 0 mismatch. The earlier 16 non-edge mismatches are gone with the wall rule aligned (cause confirmed by measurement: wall cascade), 0 of 4000 now.
- Faults (t-sw-fault.js, both binaries): 59 cases, 0 bad; grid-too-large 364 draws equal.
- Limits: seeded stream, not the browser's; far/aliased grid keys beyond the 1e9 test not covered; hook exercise separate; sw_run compatibility claimed only for these classes.

## 9. Worm candidate evidence ledger (commit e2622771 + harness follow-up)
Diff ledger (worms): BEHAVIOR alignment (feature only): growth loop descending; fission uses post-growth length (grown link stays in the tail); dd = hypot||1. STREAM migration: r01 -> js_rnd, no seed/warm-up draws, wm_run_jsrnd export, consumed-draw fault rule (WC.wmRunOff/wmRunDeg), new food links ordered by creation sequence. JS body unmodified.
t-worm-baseline.js, 5000 scenarios (10 classes x 500: normal, edge, gone, empty, cap, len8_9, nonfinite, tinydd, zerolen, coincident), both jsrnd binaries identical: draw-count mismatch 0; not bit-equal: 34/5000 (corrected from 35 typo; per-class sum) (normal 1, edge 1, gone 3, cap 26, tinydd 2, zerolen 1), 1-ulp float differences. nonfinite: 398/500 scenarios make wm_run return -1 and run the JS body (so they compare JS with JS, not the kernel); 102 reach the kernel.
Trig test: in a standalone wasm build (same toolchain), sin/cos differ from V8 in 1701/200000 and 1833/200000 random operands, atan2 0/200000. The ca2core kernel's sin/cos/atan2 (dbg exports in a scratch build) equal that standalone wasm on 200000/200000 operands, and differ from V8 in 1762 (sin), 1848 (cos), 0 (atan2). With the JS route's Math.sin/cos/atan2 replaced by the standalone wasm functions (TRIGWASM=...), mismatch is 0/5000 for all classes except one nonfinite scenario (t=3056): there the kernel returned -1 and the B route ran the JS body with V8 trig, while A used the wasm functions; replay of worm 5's heading with the exact operands gives V8-trig ...0749 (= B) and wasm-trig ...07493 (= A). So that one is a harness-route artifact, not a kernel difference.
t-worm-fault.js: 28 fault cases (draw k=1..28 of 29), 0 bad, both binaries; no kernel run after a fault.
Page exercise (hook only, not parity): ?jsrnd=1, foodMode 4, 30 s: fwWm=7, fwWmErr=null, wmRunDeg=0.
Fault counter semantics (t-worm-fault.js): the js_rnd import increments WC.rndN on every call, then increments n, and throws BEFORE calling Math.random when n>k. So at fault threshold k: k calls return a real Math.random draw (r.n == k Math.random draws consumed), the (k+1)-th call is counted in rndN but consumes no draw (rndN == k+1). No extra draw is consumed.

## 10. Spores jsrnd candidate ledger
STREAM migration (jsrnd only): spores.rs r01 -> js_rnd(5), no seed/warm-up; sp_run_jsrnd export; consumed-draw fault rule (WC.spRunOff/spRunDeg); finite pre-scan before any draw (previously -1 could return after draws were consumed, shifting the stream for the JS-body fallback: measured 377 draw-count mismatches in the nonfinite class before this fix).
BEHAVIOR alignment (jsrnd only): (1) cap gate: JS spores.length includes motes pushed mid-loop, kernel cur_len now adds nm per burst; (2) mote speed: JS rnd(0.6,1.8) = 0.6 + r*(1.8-0.6) with 1.8-0.6 = 1.2000000000000002, kernel literal 1.2 differed in the last bit; (3) ca2.js stepSporesW restores sporeLast when the kernel returns -1 under jsrnd (before: the fallback saw dtms 0 vs the capped 200: age differed by exactly 200).
t-spore-baseline.js: 5000 scenarios, 11 classes (~455 each). Both binaries identical. Draw-count mismatch 0. Not bit-equal vs V8 reference: 699/5000 (normal 15, burstdue 166, crowded 29, gone 8, nonfinite 3, rootsWant 8, edge 16, noLast 5, goneInFood 449, landing/empty 0). With the JS route's sin/cos/atan2 replaced by wasm trig (diagnostic only): 462 = nonfinite 14 (the 398 JS-fallback scenarios run the JS body with V8 trig on route B: artifact) + goneInFood 448; every other class 0.
goneInFood = KNOWN KERNEL-PATH DIFFERENCE, not parity: the W path (stepSporesW, existing code) purges every gone-flagged item from food[] at the end; the JS body only removes the spores it retires itself. Real eaters splice food when they set gone (ca2.js 215, 959), so this state may be rare; paths that set gone without splice (1339/1358/1359) purge their own. Reachability in the live page: ölçülmedi.
t-spore-fault.js: 248 cases (k=1..248 of 249 draws), 0 bad both binaries; sporeLast stays advanced on a faulted step (step skipped, timer consumed).
Page exercise (hook only, not parity): ?jsrnd=1, foodMode 5, 30 s: fwSp=7, fwSpErr=null, spRunDeg=0.
