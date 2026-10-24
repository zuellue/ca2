# Spike regression + artifact record (2026-10-23, head before this commit 944d4b9c0d2ba3ac7cf9f117f2a478e174c87640)

sha256sum of ACTUAL files (generated, not typed):
```
c0cbec4f016d2954f8bd1315a949aa7ddb1b210316c9053386a97321774af1f6  ca2core.wasm
09ff540ef9ac4c5817497af2211f1f1dab001d7776c3adfbfa5997ff75433cbb  ca2core-simd.wasm
c20e82e02b263306268ac8e623a379bcf1ebf47178b8a9dbeaa871ea248a7cb9  ca2core-jsrnd.wasm
c8c2deaa9f6ea015dd570c80e6b3e5440b71cc39d8b2a33d6c51d3916f3ad510  ca2core-jsrnd-simd.wasm
rebuilt-from-spike-source (not committed):
bb14de503ed965418dc8fdc57db7615a977025e824220c703978cfad7f091d10  wasm/target/wasm32-unknown-unknown/release/ca2core.wasm
64d9d2e14835c581da90a6fd179383bb46d28037290b85d7cb121722b4d4a9ef  wasm/target-simd/wasm32-unknown-unknown/release/ca2core.wasm
```

Node regression results on the REBUILT non-SIMD default (shipped non-SIMD gave identical output on t144/post/foodspawn/guard). SIMD default NOT covered (ölçülmedi):
- t144-cursor-parity: of 12, mismatches []
- t-post-parity: hab 72198 checks 0 mismatch 0 ulp; wall 80894/0; age 61262/0
- t-foodspawn-parity: 300 scenarios, 4500 spots, 0 mismatch, 0 draw-count mismatch
- t-guard-parity: 600 scenarios, 0 mismatch
- t-circles-wings-parity: 3200 OOD frames, 162492 checks, 0 mismatch, circOff unset
- t-fdm-parity: 1.6M sin/cos, 0 mismatch
- t-sepbody-parity: 20000 cases, 0 mismatch, maxUlp 0
- t-ood-domain: PASS

Cost (devtools/t-cost-fixture.js, node v22.23.3, sim_step only, n=55 nf=19 ncm=0, fixed replay array for jsrnd, 417 draws/step): median us/step, 3 reps:
 default shipped nonSIMD 40.2/37.7/40.1; default rebuilt nonSIMD 39.4/37.8/38.7; jsrnd nonSIMD 42.8/42.4/44.7
 default shipped SIMD 40.2/38.1/38.0; default rebuilt SIMD 38.7/38.1/40.2; jsrnd SIMD 43.4/44.8/46.3
Not a browser, whole-simW, or +12% claim.

Larger-n cost (SYNTHETIC scale-up, MULT=4 via devtools/t-cost-fixture.js: 4x the captured rows with seeded re-randomised x,y in the plate, copies' sym=-1; n=220, nf=76; jsrnd 1829 draws/step; node, sim_step only), median us/step, 3 reps:
 default shipped nonSIMD 406.6/425.2/405.5; rebuilt nonSIMD 427.5/436.4/400.5; jsrnd nonSIMD 474.8/456.4/428.6
 default shipped SIMD 431.7/443.3/388.8; rebuilt SIMD 435.6/430.7/426.9; jsrnd SIMD 469.3/449.0/428.3
Noise is about +-20 us per rep; not a captured world, not browser/simW.

Shadow full-config (symbiosis/eatMerge/selection/genome on, reproChance 0.3, real Math.random import, diag ulp tol 4096): nonSIMD 3 runs 68 newborns popD/life bit-equal; SIMD 1 valid run 49 frames, 3373 cells seen, draws 34162=34162, 26 newborns bit-equal, no diff (1 more run was a world reset, discarded).

Legacy-save / load-order (TEST fixtures, labelled; config-only saves, no Cell state is persisted):
- Load order (ca2.js): load() applies saved P (key must exist in P, finite number) -> cached 'ca2.global' applyG -> pending -> REMOTE preset pullG (https://ca2-presets.middots.workers.dev/, applyG over saved P unless key in ca2.pending). An unblocked headless run therefore shows the remote preset (cellLife 255, cellLifeVar 1, reproChance 0.02) instead of the saved P. t-legacy-save.js blocks that fetch (test-only) so the saved P is what loads.
- fixtures/ca2config-v6-real.json: actual output of the current build's save() after setKey(cellLife 120, cellLifeVar 0.5, reproChance 0.4). fixtures/ca2config-v5-approx.json: v5 schema (5fbd7f3 save shape: {v,P,autoRefresh,lockParams,bgTarget,bgIndex}) built from the real v5 build's 118-key P (v5 P has NO cellLife/cellLifeVar), reproChance 0.4; an approximation, not a captured browser save. A v3 (0be78a6) fixture was not obtainable.
- Result, remote preset blocked, ?jsrnd=1 nonSIMD and SIMD, 1 run each per fixture: v6 real: P.cellLife 120, cellLifeVar 0.5 -> wasm p[96]=120, p[97]=0.5; newborn life range 61.1-179.9 / 60.6-179.8 (= 120*(1+-0.5)); 122 and 106 cells, 0 non-finite popD/life, no simOff/err/page errors. v5 approx: defaults 240/0.3 -> p[96]=240, p[97]=0.3; reproChance 0.4 applied; life 175.0-311.6 / 169.9-308.4 (= 240*(1+-0.3)); 34 and 41 cells, 0 bad. No claim for v3/v4, nor for an unblocked remote preset path.

## SIMD default node regression (24 Oct 01:49, closes the "SIMD default NOT covered" line above)
Binaries (sha256sum generated): shipped ca2core-simd.wasm 09ff540ef9ac4c5817497af2211f1f1dab001d7776c3adfbfa5997ff75433cbb; rebuilt-from-spike-source wasm/target-simd/.../ca2core.wasm 64d9d2e14835c581da90a6fd179383bb46d28037290b85d7cb121722b4d4a9ef.
Both binaries, same 8 tests, same outputs: t144-cursor-parity mismatches 0; t-post-parity hab 72198/0 ulp0, wall 80894/0, age 61262/0; t-foodspawn-parity 300 scen 4500 spots 0 mismatch 0 draw mismatch; t-guard-parity 600/0; t-circles-wings-parity 162492 checks 0 mismatch, rng count mismatch 0; t-fdm-parity 1.6M 0 mismatch; t-sepbody-parity 20000 cases 0 mismatch maxUlp 0; t-ood-domain PASS.
Node-only, per-module parity; not browser, not whole-simW.

## Full-range fdlibm reduction (24 Oct 02:11) - wasm/src/fdm.rs, flag-gated, DEFAULT OFF
Added __kernel_rem_pio2 (Payne-Hanek, prec 2) + e_rem_pio2 large branch; 2/pi table (66 x 24-bit) generated from big-int pi (first 6 and last 2 words match fdlibm), PIo2 constants checked against pi/2 24-bit chunks. Enabled only via exported fdm_set_large(1); default LARGE=false keeps the OOD fallback for callers beyond the medium range.
Correction found while testing: V8's medium-range threshold is hi-word 0x413921fb (~1.647e6), not 8.2e5; in_domain and sin/cos now use the medium path up to that threshold (bit-equal in test), large path above.
devtools/t-fdm-large.js (LARGE on): 1,200,030 sin/cos checks vs V8 Math.sin/cos incl. exponents to 2^1023, +-MAX_VALUE, 1e6-1e9 band, 1e6-1e36: 0 mismatch (Object.is). A first draft that routed 8.2e5-1.65e6 through the large path gave 125 mismatches (V8 uses medium there) - fixed, not hidden.
Default-off regression on the rebuilt binary (sha256 a702da6e4a2020f58d71c7d06e16309069ca574f9aa4478254e1de852067e9c0, NOT committed, NOT copied to ca2core.wasm): t-fdm-parity 1.6M/0, t-ood-domain PASS, t-circles-wings 162492/0, t-post-parity 0, t144 mismatches [].
Not done: callers still treat |x|>1.647e6 as OOD (flag off), JS fallback retained; no browser/SIMD run of this change; shipped ca2core*.wasm not rebuilt on this branch.

### Full-range reduction validation, 24 Oct 02:13
- Table: all 66 words of IPIO2 compared with an independent derivation (Gauss-Legendre pi, 2400 bits) vs the Machin-derived committed table: 66/66 equal. Algorithm contract (kernel_rem_pio2 prec 2, jk 4, PIo2 8 terms verified against pi/2 24-bit chunks) is the fdlibm/V8 one; evidence of correctness is the V8 bit-equality tests below, not the table alone.
- devtools/t-fdm-edge.js (38536 checks): +-40 adjacent doubles around hi-word 0x413921fb boundary and around 8.2e5, +-0, subnormals, NaN, +-Inf, +-MAX, powers of two 2^-1022..2^1023, k*pi/2 k<=5000 and +1ulp. Flag ON: 0 mismatch. Flag OFF: 35 mismatches, all beyond the threshold (libm fallback, flagged OOD), 0 inside the verified domain.
- Both builds (non-SIMD a702da6e4a2020f58d71c7d06e16309069ca574f9aa4478254e1de852067e9c0; SIMD rebuilt 5cd7e37e6ae8997e8c3f4f5b384c8a697ff7cdcf5cbaaba8deb82a89a9c9aaf3, neither committed): t-fdm-large 1,200,030/0, t-fdm-edge as above, t-fdm-parity 1.6M/0, t-ood-domain PASS, circles-wings 162492/0, post 0, sepbody 20000/0, guard 600/0, foodspawn 300/0.
- NOT done: default flip, caller OOD handling (circles.rs/parasites.rs/post.rs still return -2 on OOD when flag off), browser-path run, shipped binaries unchanged.

## Integration: full-range reduction default ON, both binaries rebuilt and copied (24 Oct 02:47)
Source: fdm.rs LARGE default true (in_domain true for all finite). Binaries (sha256sum generated, equal to the build outputs): ca2core.wasm a94dbf3f8e25f0517df0e02fd881dfd04557fdcf45a056a38e16d8bd665dbf26 ; ca2core-simd.wasm bdd56ede0b344cc8b70eeb82780a1070be8c340101f2f919c348a8c6d183b6a7. (Previous shipped c0cbec4f.../09ff540e... remain in git history.)
Node, both builds: t-fdm-large 1,200,030/0; t-fdm-parity 1.6M/0; t-fdm-edge flag on 0 mismatch; t-circles-wings 162492/0; t-post-parity 0; t-sepbody-parity default 20000/0 AND with huge T (TMAX 1e7, 1e10, 1e30, 1e150) 20000/0 each (so sepBody trig args beyond the old domain are bit-equal to JS); t-ood-domain updated to the new contract (huge args compute in Rust, >=0; OODMODE=fallback with flag off keeps the old negative-return contract) PASS in both modes.
Browser smoke (t143 fixed clock, default SIMD and ?nosimd=1, 10 s): sim:true, simOff false, liveOff false, simErr null. This is a boot/path smoke only.
CAVEAT (measured): the t143 fixed-clock fixture is NOT run-to-run deterministic. Same shipped binary, same seed 12345, 10 s: merge 54 fuse 11 (earlier run) vs merge 28 fuse 7 (re-run 02:45). So rebuilt-vs-shipped behavior cannot be compared with it; the earlier JS-vs-wasm n=4 comparisons carry that unexplained variance too.
NOT done: hab/wing/circles large-argument parity against JS (only sepbody checked with huge T), browser behavior comparison, drivers.

### Large-argument caller parity vs JS (24 Oct 02:57, shipped-candidate binaries a94dbf3f.../bdd56ede...)
- hab (post_hab) with huge clock: t-post-parity TMAX=500,1e7,1e10,1e30,1e150 (SIMD binary): habChecks 72198, habTouchedMismatch 0, maxUlp 0 each; wall 80894/0, age 61262/0. 
- circles pc_move (huge ph 1e9 / huge clock / both, 3200 frames) on ca2core.wasm: pcMoveNegativeReturns 0 (was 2400 with the old OOD fallback), mismatch 0, state and global draw count compared each frame, circOff unset.
- sepBody: see above (TMAX to 1e150, 20000 each, 0 mismatch).
- NOT covered: wing (pw_run) huge-argument parity vs JS (only t-ood-domain nonnegative return), parasites.rs huge-ph path beyond pc_move, non-SIMD hab TMAX sweep.

### Wing + non-SIMD hab large-arg parity (24 Oct 03:11, ca2core.wasm a94dbf3f...)
- t-circles-wings-parity with PHBIG (parasite ph += rnd*PHBIG before the wing pass, identical in JS and wasm states) = 1e7, 1e10, 1e100: 162540 checks, mismatch 0, stateMismatchFrames 0, maxAbsCoordDiff 0, rng count mismatch 0, usedWasmWings 36000 (every wing frame ran in Rust, none fell back). (Harness compares recorded ctx args with its stated tolerance 1e-9; maxAbsCoordDiff 0.)
- non-SIMD t-post-parity TMAX 1e10 and 1e150: hab 72198/0 ulp 0, wall 80894/0, age 61262/0.

## 2026-10-24 03:32 t143 fixture work state (NOT an accepted fix)
- Fix A (seeded Math.random, rdy-synced steps): measured, 4 samples identical then diverged.
- Fix B (fake-clock timers): page main thread blocks after __step(120), Profiler.enable times out; cause not isolated (hypothesis only: sync spin on fake performance.now).
- Fix C (real timers gated off after rdy, in t143-fixedstep.js): UNVALIDATED. Two TRACE runs gave 0 B and 767 B traces (devtools/failed-traces/). No repeatability proof. No comparative claim.
- t-foodspot-jsrnd: 30000 checks, 0 mismatch, 0 draw-count mismatch (non-SIMD+SIMD jsrnd). Browser integration of the ca2.js hook: not run (ölçülmedi). Default binaries unchanged (a94dbf3f, bdd56ede).
- foodSpot hook fault rule (03:58): env.js_rnd counted in WC.rndN; exception after >=1 consumed draw -> return null (no JS redraw), before any draw -> JS body. t-foodspot-fault: 1600 checks (588 faults after consumed draws, 400 before any draw), 0 mismatch, both jsrnd binaries. Real page not tested.
- Fault rows are a separate class from parity: after consumed draws the hook skips the spawn (null) and sets postOff, NOT pure-JS semantics (cost: one skipped spawn + wasm food path off for the session). Next call after any fault: 988 checks, runs JS body, 0 wasm draws, equals pure JS, 0 bad.
- reseedFood blob loop in Rust (post_reseed_blobs, jsrnd only, hook in ca2.js reseedFood). t-reseed-jsrnd: 600 scenarios, 63498 food dots, 0 mismatch (x,y,r Object.is, budget, born, total draw count) on both jsrnd binaries. FAULT=1 is a separate degraded class (not parity). Real page not run. Default binaries unchanged.
- Same-page hook exercise (t-hook-page.js, headless Chrome, 30 s, 2026-10-24 04:26-04:28), NOT a behavior comparison:
  - ?jsrnd=1&nosimd=1 default world: rsN=4, fsN=0 (foodSpot not called in default foodMode 2), postOff false, no page errors.
  - ?jsrnd=1 SIMD default: rsN=5, fsN=0, postOff false, no errors.
  - ?jsrnd=1&nosimd=1 with setKey foodMode=0, foodReseed=1: fsN=2448, rsN=5, postOff false, no errors.
  - Pixel/behavior/statistics vs JS: ölçülmedi.
- habSeed + Cell ctor in Rust (sim.rs Sim::hab_seed, lib.rs sim_hab_in/out/seed, jsrnd only; hook in ca2.js habSeed, ?jsrnd=1). Uses fdm cos/sin for rand2D (V8-exact). Fault rule as foodSpot (consumed draws -> no cell, degraded, own WC.hsOff flag; not simOff).
  t-habseed-jsrnd: 20000 scenarios, 580000 fields Object.is, total draw count, 0 mismatch, both jsrnd binaries.
  Page: hook NOT exercised (hsN=0 in two 30 s runs with habitatOn/Floor/FedMin/Conv/Sun/UNIVERSE_SIZE keys; cause of no seeding not diagnosed). Real-page habSeed: ölçülmedi.
  Default binaries NOT updated this commit (shipped a94dbf3f/bdd56ede stay). A default rebuild of the changed sim.rs hashes differently (3cbeba22...), cause unverified (suspect line-number metadata); Rust sources under cfg(jsrnd) only.
  t-habseed-fault (degraded class, not parity): 2500 checks (500 fault before any draw, 1825 after consumed draws, 2325 next-call-after-fault -> JS, 0 draws in wasm), 0 mismatch, both jsrnd binaries. t-habseed-jsrnd harness fixed (3bab5746 pushed a test that crashed on the new hook, ReferenceError WC; fixed here).
- Default rebuild hash delta (2026-10-24 05:02), grounded by a section-wise diff of repo ca2core.wasm (a94dbf3f, built 02:46) vs the rebuilt target binary (3cbeba22): same size 218454; every section identical (type, function, code 190813 B, export, ...) except the data section, 4 bytes at offsets 1322, 6686, 6702, 6718. Each is the u32 line field of a panic Location record for src/sim.rs, all shifted +26 (e.g. 0x226 -> 0x240), the length of the code inserted into sim.rs above them. The executable code section is byte-identical. Defaults still not replaced.
- habSeed hook page exercise (forced, NOT natural): ?jsrnd=1&nosimd=1, setKey habitatOn=1, habitatFloor=1e5, habitatFedMin=0, habitatConv=50, UNIVERSE_SIZE=5000, plus 200 injected food dots {fed:100} pushed into getFood() at t0. Result after 8 s: WC.hsN=38 == habStat.seed=38, no errors. Control ?nowasm=1 same injection: hsN=0, habStat.seed=14 (JS body). Earlier hsN=0 runs had no surviving food (cells eat it at once; foodN=0), plus one read taken before the seeds happened. Natural-seeding rate in the default world: ölçülmedi. Pixel/behavior vs JS: ölçülmedi.

## 2026-10-24 05:40 t143 repeatability (shipped-state ca2core.wasm a94dbf3f, seed 12345, 10 s, 60 trace samples; traces in devtools/repeat-traces/)
- Fix B hang: NOT a JS spin. Debugger.pause got no paused event on a hung Runtime.evaluate; with grain=1 (software WebGL) during __step(120) it is slow/native-bound. Moving setKey grain=0/autoQuality=0/... BEFORE __step(120) removed the 30 s CDP timeouts in 8 of 8 following runs (step120 = 0.7-1.0 s). Intermittent before that (about 1 in 2-3 runs).
- Fix C (real timers gated by __tOn=false after rdy, preset host blocked, seeded Math.random from page start) + 8 s real-time settle before the first stepped frame: pair A/B -> 60/60 samples IDENTICAL; pair 3/4 -> IDENTICAL to each other but different from A/B (steps 725 vs 723).
- Root cause of the cross-batch difference (measured): the step index at which body.rdy appears varies 3 vs 5 between runs ("rdy at step 3/5"). Padding to a fixed 12 pre-swap steps equalizes the step counter (142 vs 142) but NOT the residual pre-swap state (sample 0: food 98 vs 203, merges 0 vs 12, parasites 2 vs 2): the 2 extra real steps before rdy change state that survives the cell swap (food is cleared, but counters, parasite/live state, fleeT do not).
- So: whole-trace repeat holds within pairs only. Cross-run repeatability: NOT proven. No comparative behavior claim. Next: remove the pre-swap residue (reset counters/parasites/live state at the swap, or force the first frame deterministically) and require >=3 identical whole traces across separate batches.

## 2026-10-24 05:53 t143 readiness control (test-only changes in t143-fixedstep.js: TON=0 gates page timers from t0, RDYSLEEP, no stepped frame while WC.ok is pending, PAD, RDYLOG)
- RDYLOG showed the rdy step (3 vs 5) tracks WC.ok (wasm compile finishing) flipping at different step indices, even with 1.5 s real sleeps between steps. With "no stepped frame while WC.ok pending" the rdy step was 3 in 9 of 9 runs.
- Whole-trace repeat after that control, 3 separate batches (fh1-3 in repeat-traces/): fh1 == fh2 (60/60), fh3 differs from them from sample 0 (food 39 vs 222, births 7 vs 99, frameDtfLast 50.0 vs 83.3). Cross-batch repeat still NOT proven. Unidentified residual input before/at the swap; candidates: other async work (separator mask/image decode, secondary wasm modules/fetches) completing at different step indices; not measured yet.
- Nothing in shipped/runtime code was changed for this; all edits are in devtools/ (test-only).

## 2026-10-24 06:20 t143 repeatability: ROOT CAUSE + proof (same shipped binary a94dbf3f/bdd56ede default SIMD, seed 12345, 10 s, 60 samples)
- Method: per-draw Math.random call-site log (first 3600 draws) for two differing boots. Run 1 began with 3 draws from ca2.js:2547 (liveStart(), called at boot from savedLive at ca2.js:2884), run 2 did not. savedLive comes from localStorage, which the first page load can save() before the fixture's Page.reload (race). That changed the boot order and draw count (gate draw counts 2831 vs 2265 at the same step 12).
- Test-only fix: localStorage.clear()/sessionStorage.clear() in the injected pre-boot script (devtools/t143-fixedstep.js). With it the Math.random draw count at the gate was 2831 in both of 2 runs.
- Result: 4 separate runs (fi1-4 in devtools/repeat-traces/): whole 60-sample trace sha256 identical in all 4 (also identical to earlier fh3 trace, which was the odd one out of fh1-3), and the final result lines identical. Controls in place: seeded Math.random from page start, preset host blocked, real timers gated off (TON=0), 8 s settle, no stepped frame while WC.ok pending, rdy step padded to 12, storage cleared, grain=0 etc. before __step(120).
- Scope: this proves repeatability of the fixture for this binary/seed/10 s only. It is NOT a comparison: shipped-vs-rebuilt and JS-vs-wasm runs are still owed. No production code changed (devtools only).

## 2026-10-24 06:26 comparison matrix CONFIG (results follow separately; nothing below is a result)
- Conditions: main = origin/main da2fbd0e19836c7aa441fbd48a81bfa681350056 worktree (its own ca2.js and binaries; ROOT=/tmp/ca2main) vs cand = wasm-jsrnd-spike (this commit's ca2.js; default binaries a94dbf3f/bdd56ede), each with wasm (default) and ?nowasm=1. Seeds 12345, 7, 21, 99; seed 12345 twice (a/b) as per-condition repeat baseline. Scripts: devtools/cmp-runcmp.sh, devtools/cmp-matrix.sh; fixture devtools/t143-fixedstep.js with TON=0, RDYSLEEP=300, TRACE=1, 10 s, SEED env.
- Interpretation limits: main vs cand compares WHOLE builds (ca2.js + binaries), not an isolated wasm-code effect. Default wasm uses its Rust PRNG, JS uses the seeded Math.random: trajectories unmirrored, distribution-only. 4 seeds is small; no broad statistical claim.
- Metric: counters read from the final result line: merge, fuse, pair, eaten, birth, death, divide (ev counters since the cell swap); the +12% question's own metric definition is main's; this matrix reports the raw counters and denominators (frames, engine dt) and no derived % until that definition is fixed.

## Provenance of the "+12%" metric (recovered 2026-10-24 06:27 from my own 2026-10-21 01:05-01:09 transcript: tool output of /tmp/cmp.py on f_js1/f_w1/f_js2/f_w2)
- Origin is my own early observation, not a user-stated number: 2 paired live runs per mode (70 s each, frozen params UNIVERSE_SIZE 56, CELL_RADIUS 34, interactionRadius 12, baseMutationRate 9.6, mutationRateRange 2.6; JS = ?nosim=1 vs wasm), real-time rAF frames as denominator (729/775 and 720/778 frames). Metric: event counts per 1000 frames.
- merge per 1000 frames: JS 3820.3, 3790.3; wasm 3273.5, 3394.6 (wasm -14.3%, -10.4%). fuse per 1000 frames: JS 1187.9, 1163.9; wasm 996.1, 1041.1 (-16.1%, -10.6%). Births/deaths: no consistent direction (b: JS 6006.9/7668.1 vs W 5540.6/6137.5; d: 9142.7/10740.3 vs 8591.0/9295.6).
- So "12%" = wasm lower than JS in merge and fuse per 1000 live frames, n=2 pairs, uncontrolled dt/RNG (unmirrored), no repeat baseline. It is a hypothesis-generating observation, not a validated effect. The fixed-step matrix reports raw per-10 s counters at an equal 120 engine frames (so the denominator is identical by construction) plus per-1000-engine-frame values.

## 2026-10-24 06:59 comparison matrix PARTIAL results (seed 12345 complete; seeds 7/21/99 in progress)
Pins: main = origin/main da2fbd0e19836c7aa441fbd48a81bfa681350056 (own ca2.js+binaries); cand = wasm-jsrnd-spike (commit of this file), default binaries a94dbf3f/bdd56ede. Raw artifacts: devtools/cmp-traces/ (TRACE + result line per run, matrix.log).
Counter and denominator definitions (from devtools/t143-fixedstep.js source):
- steps (__fn) = fake-clock rAF steps in the page: single steps until body.rdy + padding to 12, then __step(120) (warm-up, before the swap), then 600 sample steps (NF = round(10000/16.667)). 12+120+600 = 732 (matches).
- frames (__fc) = rAF callbacks of the test's own counter loop, started at the cell swap: 600 sample steps (+1 from the initial call) = 601. sdt = sum of min(100, dt) of those callbacks = 10000 ms fake clock.
- Event counters (merge, fuse, pair, eaten, birth, death, divide) = __ca2 counters at the end minus the baseline __b0 taken at the cell swap. They count the 600 sample steps (10 s fake time) only; the pre-swap steps and the 120 warm-up steps are excluded. At the swap: 24 seeded cells replace cells, food is cleared, Math.random is replaced by the seeded generator (seed from SEED env).
- Engine frames: the engine's frame() runs on a 12 fps gate (engine dt 83.335 ms). The number "120 engine frames" is arithmetic (fleeT delta 10000.2 / 83.335) and was NOT counted: DTLOG was off (engFrames 0), and origin/main has no fleeT variable (engFleeT_delta reads 0 there), so engine frames on main are ölçülmedi.
- The old +12% metric (per 1000 live rAF frames) is not this denominator.
Seed 12345, 10 s, a and b per condition (counters and whole-trace sha256 identical in a and b for all four):
| condition | merge | fuse | pair | eaten | birth | death | divide | n_end |
| main wasm | 38 | 11 | 15 | 37 | 111 | 76 | 46 | 59 |
| main nowasm | 6 | 2 | 4 | 10 | 35 | 26 | 34 | 35 |
| cand wasm | 14 | 5 | 4 | 11 | 53 | 37 | 52 | 43 |
| cand nowasm | 80 | 26 | 33 | 31 | 179 | 123 | 125 | 92 |
Seed 7 so far (a only): main wasm 14/12/10/36/162/79/78; main nowasm 13/2/5/21/123/52/43.
Reading: no consistent wasm-vs-JS direction (cand wasm < cand JS, main wasm > main JS), and main JS vs cand JS differs by 6 vs 80 merges, so ca2.js differences or unmirrored RNG start dominate; no isolated wasm effect, no percentage, no parity claim. One seed so far.

## 2026-10-24 07:14 matrix update (a runs only for seeds 7/21/99; seed 99 candjs pending)
merge/fuse/pair/eaten/birth/death/divide, 600 sample steps, 10 s fake clock:
seed 7: main wasm 14/12/10/36/162/79/78; main nowasm 13/2/5/21/123/52/43; cand wasm 8/3/1/24/161/90/72; cand nowasm 81/39/29/23/156/124/85
seed 21: main wasm 9/2/7/9/32/24/32; main nowasm 20/6/4/9/61/32/54; cand wasm 78/21/29/33/152/120/102; cand nowasm 57/18/22/40/158/104/60
seed 99: main wasm 26/5/7/19/86/44/60; main nowasm 33/14/19/41/117/83/45; cand wasm 15/5/10/12/83/83/81; cand nowasm pending
No repeat (b) for seeds 7/21/99. No consistent wasm-vs-JS direction across seeds or builds; whole-build confound; no parity or causal claim.

## 2026-10-24 07:15 matrix complete (a runs, seeds 7/21/99) + binary-vintage isolation
seed 99 cand nowasm: 84/47/54/28/148/117/65 (merge/fuse/pair/eaten/birth/death/divide). Seed 99 repeat (b): not run.
Isolation: identical candidate ca2.js, wasm mode, binaries swapped from default a94dbf3f/bdd56ede (commit dda3ac5) to the previous commit ef11298 binaries c0cbec4f/09ff540e (pre fdm-full-range-default). Seeds 12345 and 7, 10 s, one run each: counters identical to cand wasm (14/5/4/11/53/37/52; 8/3/1/24/161/90/72) and TRACE sha256 identical (49f3a1be7c40, bef370498db6). So those two binary vintages do not differ in this fixture. This is NOT the main binary (da211141), and does not isolate a wasm-vs-JS effect. Raw: cmp-traces/cmp-old-a-*.

## 2026-10-24 07:20 remaining Math.random driver inventory (measured, jsrnd=1, cand default jsrnd binaries, seed 12345, 600 sample steps, ONE run)
Tool: devtools/t155-callers.js (t143 with a caller-counting wrapper around the seeded generator; draws counted after the swap). Raw: devtools/cmp-traces/callers-jsrnd-s12345.txt. Seed 7 gave the same shape (js_rnd 116796) with function-level counts only.
Draws by caller (ca2.js line): js_rnd@735 (Rust-driven ports) 97708; rnd helper@13 1290 (caller hidden by helper); stepSwarmW@1593 838 (vx/vy init of fresh food); planComposition@543/544 534 each, @550 117, @537 2, anon sort comparator @552 518; compSpawns@589 312, @592 26 (+ Cell ctor @78/@82 26 each, newShape/mutateGene ~100); stepSwarmW@1595 240, stepParasitesW@1823 240, transPassW@603 156 (each = 2 seed draws per call for sw_run / pa_run / tr_run, whose inner draws use the Rust PRNG, not the JS stream); frame@2114 121, @2115 120; fadeA@479 13.
Total JS-side draws other than js_rnd: about 5.3k vs 97.7k js_rnd (about 5% of draws). JS CPU share of these sites: ölçülmedi (no profile taken).

## 2026-10-24 07:21 CPU profile (devtools/t156-prof.js, CDP Profiler 200us sampling over the 600 sample steps; headless test Chrome, seed 12345, ONE run per mode) + rnd-helper callers resolved
Self time top: jsrnd=1: drawImage 34.1%, wasm mb_field_f32 32.3%, JS paintKnobs 10.4%, getBoundingClientRect 7.6%, GC 3.0% (total 7362 ms of samples). default wasm: mb_field_f32 44.0%, drawImage 26.3%, paintKnobs 8.2%, getBoundingClientRect 6.9%, GC 2.5% (total 6933 ms). Every JS function containing the Math.random sites (planComposition, compSpawns, stepSwarmW, frame, newShape...) is under 1% self time in the first-run listing (frame 0.7%). Caveat: headless Chrome canvas/GPU path is not the user's device; per-frame cost on a real device is ölçülmedi. Raw: cmp-traces/prof-*.txt.
rnd-helper callers resolved (callers2-jsrnd-s12345.txt): planComposition@550 560 (pace/dl/durK/bend per cell), compSpawns@591/592 78/98 (child position/pace/durK/bend), Cell ctor @78-86 (156+52+...), mutGenome@98/99 78 each, newShape@107-114 ~270 total, mutateGene@137/138 26 each. No opaque category remains.
