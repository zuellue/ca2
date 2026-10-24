# New-food radius (r) draw sites, ca2.js @ a299a65a (grep `r: Math.random()`), 2026-10-24
Static audit only. Hit counts per site: ölçülmedi (no instrumented run yet).
Transform at every site: r = one unconditional Math.random() draw, stored as-is (identity, no arithmetic).
Order is draw-after-foodSpot where foodSpot is used (foodSpot's own draws are already Rust-driven).

| line | site | draw context | status |
|---|---|---|---|
| 508 | newRefresh fresh food loop | foodSpot -> r | JS, unported |
| 604 | planComposition fresh food (!P.foodLife) | foodSpot -> r | JS, unported |
| 1549 | blob 3x3 seed, gated by `Math.random()<0.55` then r | conditional | JS, unported |
| 1569 | life-step birth out.push, r after n===3 test | conditional on state | JS, unported |
| 1600 | addBlobDot r,a,f,q (4 draws) | unconditional | JS, unported |
| 1711 | swarm birth: gate 0.3, jitter x,y, then r | conditional | JS, unported |
| 1715 | swarm 12x4 refill: cx,cy, per-dot jitter x,y then r | loop | JS, unported |
| 1723 | worm create len loop | loop | JS, unported |
| 1785 | worm grow gate 0.45 then r | conditional | JS, unported |
| 1812 | newSpore r,ph | 2 draws | JS, unported |
| 2175 | frame ambient spawn (after ambientFoodSpawn decision) | foodSpot -> r | decision ported, r JS |
| 2203 | pendingSpawn sp.food loop | foodSpot -> r | JS, unported |
| 2853 | out-of-frame spawn loop | foodSpot -> r | JS, unported |
Not r sites but still JS draws: 137, 598 (random-comparator sort), 2917, 3783.
Plan: port conditional gates (1549,1569,1711,1785) via the Rust-decides/JS-draws/applies pattern; plain r assignment stays transport.

## Correction + status 2026-10-24 (after port work)
- 1549 is the JS fallback of reseedFood; the Rust-driven blob loop (post_reseed_blobs) already covers it in jsrnd mode (earlier port).
- 1569 (life birth, now lifeBirths/post_life_births) and 1785 (worm growth+fission, now wormGrowSplit/post_worm_step): ported + boundary/fault tests pass,
  BUT both sit in the JS fallback body AFTER stepFoodW (fd1_tick) / stepWormsW. In normal wasm mode the kernels run instead (kernel-internal PRNG seeded by 2 JS draws),
  so these hooks are not reached. Page exercise (jsrnd=1, foodMode=1, 20 s, one run): lbN=0, i.e. 0 hits. Mode 4 page run not completed (harness timeout), wmN unmeasured.
- 1711/1715 (swarm life) is likewise the JS body after stepSwarmW (sw_run). Not ported: porting it would only affect the fallback; the real draw source in wasm mode is the kernel PRNG.
- Therefore the remaining reachable new-food r draws in wasm mode are inside fd1/sw/worm/spore kernels (Rust PRNG), which is the kernel-PRNG compatibility design item.
