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
