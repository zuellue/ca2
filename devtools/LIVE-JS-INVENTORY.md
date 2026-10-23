# Live frame compute inventory (source audit, 23 Oct 18:06, branch wasm-cluster-r3 base main a07c677)

Method: read ca2.js frame() (line ~1752) and every stage function; "W" hooks found by grep (stepFoodW, foodKeepInW, stepBlobsPassW, stepSwarmW, stepWormsW, stepSporesW, stepParasitesW, transPassW, buildSourcesW, simW, liveGenW, bandW, LW/applyLW, WC.field). Cost per stage is UNMEASURED ("ölçülmedi") in this audit unless stated. Nothing here is a speed claim.

## In Rust/wasm (JS fallback kept; ?nowasm=1, ?nosim=1, ?nolivewasm=1)
- simW -> sim.rs sim_step: update, interact, keepIn, check_survival, cluster_state (side RNG stream), newShape/mixShape, births/fusions. Evidence: t74 A lockstep 0/1000 divergence (births/leave off), t138 shape lockstep 0/60000 mismatches. Unmirrored randomness: stochastic leave 0.0005 and the Math.random reseed per frame.
- stepFoodW, foodKeepInW, stepBlobsPassW (mode 2), stepSwarmW (mode 3), stepWormsW (mode 4), stepSporesW, stepParasitesW (core), transPassW (stepTrans), buildSourcesW, bandW, WC.field (metaball field, f64 default).
- stepLive resident port: liveGenW, live.rs (t136 24000 gens bit-exact; no measured live speedup).
- separatorCollectivePass: has wasm refs (partial; not re-verified this round).

## Still JS in the live frame (compute, not DOM/canvas/GL)
- Food ink mask logic from the landed food feature: foodSpot, foodOnInk, foodPushOut, foodInkGuard, foodFreeIdx, applyKey foodDensity spawn loop. New code, JS only.
- parasiteCircles overlay (glyph-circle belief) and wing-shape geometry: JS after the wasm parasite core.
- separatorPass (78 lines, 8 loops), sepDiskHit, sepBodyHit, sepSources: JS (the collective pass is the only part with a wasm ref).
- stepHabitat, stepAging, reseedFood, randomize, wallPull: JS.
- emitCell, colorAt, shapeStat, tally and axis text, hover loop over cells: JS.
- JS-side unpack of sim results (kids/births, shape objects) after simW: JS by design (objects live in JS).
- sprayWave: JS.

## Stays JS by contract (DOM/canvas/WebGL, not compute)
drawMetaballs (GL), drawAxis, HUD/DOF drawing, applyKey/DOM, audio.

## Precision
Everything above is f64 in wasm except the optional metaball f32 field (WC.fieldF), which is OFF by default and not decided (visual decision open; default unchanged).

## Gaps before calling the port complete (open)
1. Live same-input parity for the JS-resident stages above is not measured; they are not ported.
2. Live event distribution: wasm vs JS shows a ~12% death/eaten pooled difference in uncontrolled runs (t140) and +9% death at n=1 in matched-dt run (t142 seed 1). Unexplained; controlled no-random diagnostic pending.
3. Per-stage cost of the JS-resident stages is unmeasured.

## Work breakdown (23 Oct 18:08, proposed order; each step = small commit on a wasm branch, own parity test, JS fallback kept, no main/deploy until ready)
0. Live wiring shadow diagnostic: real simW pack/unpack vs JS fallback with the same mirrored sim.rs PRNG, per-frame state compare, stop at first difference. (Chrome, <1 min)
1. wallPull + stepAging + stepHabitat + reseedFood: small, per-frame, pure number crunching. Port to wasm, node lockstep test against the JS functions on the same inputs.
2. Food-ink compute: foodSpot/foodOnInk/foodPushOut/foodInkGuard/foodFreeIdx + applyKey foodDensity spawn (mask is a byte image; port needs the mask in wasm memory). Parity vs the landed JS on the same masks (tests t-food-spot-unit, t-pushout-unit, t-guard-allink-unit, t-density-setter-unit exist).
3. parasiteCircles overlay and wing geometry: after the parasite core, glyph-circle belief; parity vs t-parasite-circle-unit cases.
4. separatorPass (+ sepDiskHit/sepBodyHit/sepSources): largest remaining JS compute loop (8 loops). Port the collision/push computation; the DOM/canvas parts stay JS.
5. emitCell/colorAt/shapeStat/tally/hover: smaller, after the above.
Disjoint scopes if specialists help: (1), (2)+(3) food/parasite, (4) separator. Each only touches its own function plus a thin hook, so they can run in parallel branches; ca2.js hook edits must rebase on current main.
