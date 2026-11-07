# CA root-vs-test ca2.js divergence list (file:line, cause class)

Repo zuellue/ca2 (public). Branch ca/187-sep-wasm-parity-tests, head at generation: 3693b53dbd45b8f05aa33596083ccdf5be36b301 (earlier head bf08237fea4f7f806af1c6b47427b8b9516f18cb is an ancestor, superseded; both descend from main f8ff9d96ab41f080d151805184d60ca5dd6667ba).
Generated 2026-11-07 by script (python difflib over brace-matched function bodies). Root = ca2.js, Test = test/ca2.js (branch version: includes the foodInk fix at foodInk(); main test/ca2.js sha256 f762e0d4...).
sha256 ca2.js df70c064f8643046 | test/ca2.js ac454fc5d9469023

Cause classes are keyword labels taken from the added lines of each diff (code and comments in the test tree), NOT verified design intent; any "owner" or item numbers in those comments are unverified repo text. Class = what the added code touches.

## A. Functions only in test (10) - test/ca2.js:line

| function | test line..end | cause class |
|---|---|---|
| carrySide | test/ca2.js:382-397 | 73d boundary-as-force; wall handling (wallSubPass/finalWallClamp/carry); squash/overload display; motion/shape additions |
| constraintSolver | test/ca2.js:233-279 | separator (contact attribution / collective solver); wall handling (wallSubPass/finalWallClamp/carry); crowd/sense/habitat model; squash/overload display; constraint solver |
| effR | test/ca2.js:380-380 | squash/overload display |
| finalWallClamp | test/ca2.js:401-404 | wall handling (wallSubPass/finalWallClamp/carry) |
| foodInk | test/ca2.js:63-68 | food ink |
| logDeath | test/ca2.js:74-74 | death-site recorder (debug, no sim math) |
| murmurStep | test/ca2.js:3174-3193 | motion/shape additions |
| splitLobes | test/ca2.js:408-429 | motion/shape additions |
| stepSquash | test/ca2.js:363-378 | separator (contact attribution / collective solver); wall handling (wallSubPass/finalWallClamp/carry); crowd/sense/habitat model; squash/overload display; motion/shape additions |
| wallSubPass | test/ca2.js:222-228 | wall handling (wallSubPass/finalWallClamp/carry) |

## B. Shared functions with different bodies (30) - root line / test line, lines added/removed in test

| function | root | test | +/- lines | cause class |
|---|---|---|---|---|
| frame | ca2.js:1965-2388 | test/ca2.js:2214-2670 | +43/-10 | separator (contact attribution / collective solver); wall handling (wallSubPass/finalWallClamp/carry); crowd/sense/habitat model; squash/overload display; food ink; death-site recorder (debug, no sim math); wasm glue / labelled-region path; motion/shape additions; constraint solver |
| separatorPass | ca2.js:1298-1375 | test/ca2.js:1511-1618 | +38/-8 | separator (contact attribution / collective solver); f9 per-frame displacement budget; 73d boundary-as-force; crowd/sense/habitat model; squash/overload display; constraint solver |
| keepIn | ca2.js:205-218 | test/ca2.js:281-328 | +39/-5 | separator (contact attribution / collective solver); wall handling (wallSubPass/finalWallClamp/carry); crowd/sense/habitat model; squash/overload display; motion/shape additions |
| separatorCollectivePass | ca2.js:1376-1430 | test/ca2.js:1619-1679 | +17/-11 | separator (contact attribution / collective solver); f9 per-frame displacement budget; 73d boundary-as-force; wall handling (wallSubPass/finalWallClamp/carry); crowd/sense/habitat model; squash/overload display |
| gate | ca2.js:3370-3433 | test/ca2.js:3680-3762 | +22/-3 | unclassified (UI/boot/refactor) |
| simW | ca2.js:791-845 | test/ca2.js:997-1057 | +15/-9 | separator (contact attribution / collective solver); wall handling (wallSubPass/finalWallClamp/carry); crowd/sense/habitat model; squash/overload display; death-site recorder (debug, no sim math); wasm glue / labelled-region path; motion/shape additions |
| boot | ca2.js:3611-3906 | test/ca2.js:3941-4236 | +10/-10 | unclassified (UI/boot/refactor) |
| wallPull | ca2.js:221-232 | test/ca2.js:331-354 | +16/-4 | 73d boundary-as-force; wall handling (wallSubPass/finalWallClamp/carry); motion/shape additions |
| update | ca2.js:149-203 | test/ca2.js:160-219 | +11/-6 | separator (contact attribution / collective solver); wall handling (wallSubPass/finalWallClamp/carry); crowd/sense/habitat model; death-site recorder (debug, no sim math); motion/shape additions |
| interact | ca2.js:267-299 | test/ca2.js:464-502 | +11/-5 | f9 per-frame displacement budget; 73d boundary-as-force; death-site recorder (debug, no sim math) |
| addCirc | ca2.js:2904-3094 | test/ca2.js:3213-3404 | +6/-5 | motion/shape additions |
| sample | ca2.js:1390-1401 | test/ca2.js:1633-1647 | +6/-3 | separator (contact attribution / collective solver); 73d boundary-as-force; wall handling (wallSubPass/finalWallClamp/carry); crowd/sense/habitat model |
| startHover | ca2.js:2943-3030 | test/ca2.js:3253-3340 | +4/-4 | motion/shape additions |
| checkSurvival | ca2.js:310-315 | test/ca2.js:513-519 | +3/-2 | separator (contact attribution / collective solver); crowd/sense/habitat model; death-site recorder (debug, no sim math) |
| lpUI | ca2.js:3836-3872 | test/ca2.js:4166-4202 | +2/-2 | unclassified (UI/boot/refactor) |
| Cell | ca2.js:73-83 | test/ca2.js:84-94 | +1/-1 | separator (contact attribution / collective solver); wall handling (wallSubPass/finalWallClamp/carry); crowd/sense/habitat model; motion/shape additions |
| applyDof | ca2.js:3201-3238 | test/ca2.js:3511-3548 | +1/-1 | unclassified (UI/boot/refactor) |
| applyMode | ca2.js:3652-3667 | test/ca2.js:3982-3997 | +1/-1 | unclassified (UI/boot/refactor) |
| cleanup | ca2.js:2920-2929 | test/ca2.js:3230-3239 | +1/-1 | unclassified (UI/boot/refactor) |
| drawBlobs | ca2.js:1566-1576 | test/ca2.js:1815-1825 | +1/-1 | food ink |
| drawSpores | ca2.js:1776-1794 | test/ca2.js:2025-2043 | +1/-1 | food ink |
| drawWorms | ca2.js:1701-1714 | test/ca2.js:1950-1963 | +1/-1 | food ink |
| emitCell | ca2.js:709-734 | test/ca2.js:913-938 | +1/-1 | separator (contact attribution / collective solver); squash/overload display |
| fuseCells | ca2.js:249-261 | test/ca2.js:446-458 | +1/-1 | death-site recorder (debug, no sim math) |
| onClick | ca2.js:676-684 | test/ca2.js:880-888 | +1/-1 | unclassified (UI/boot/refactor) |
| split | ca2.js:2986-2999 | test/ca2.js:3296-3309 | +1/-1 | unclassified (UI/boot/refactor) |
| stepAging | ca2.js:1953-1957 | test/ca2.js:2202-2206 | +1/-1 | death-site recorder (debug, no sim math) |
| stepComposition | ca2.js:529-547 | test/ca2.js:733-751 | +1/-1 | death-site recorder (debug, no sim math) |
| choice | ca2.js:2727-2733 | test/ca2.js:3012-3019 | +1/-0 | unclassified (UI/boot/refactor) |
| syncUI | ca2.js:3434-3471 | test/ca2.js:3763-3801 | +1/-0 | unclassified (UI/boot/refactor) |

## C. P assignments only in test (21) - test/ca2.js:line

P.wallSmoothMs (test/ca2.js:34), P.solverOverlap (test/ca2.js:236), P.wallSpread (test/ca2.js:1023), P.wallCarry (test/ca2.js:1023), P.squashOut (test/ca2.js:1024), P.squashMax (test/ca2.js:1024), P.squashIn (test/ca2.js:1024), P.crowdRel (test/ca2.js:1026), P.crowdPush (test/ca2.js:1026), P.crowdGain (test/ca2.js:1026), P.crowdSlow (test/ca2.js:1026), P.habMax (test/ca2.js:1518), P.solverIters (test/ca2.js:1527), P.senseR (test/ca2.js:1557), P.senseDelay (test/ca2.js:1561), P.senseSlow (test/ca2.js:1569), P.senseTurn (test/ca2.js:1570), P.habRate (test/ca2.js:1575), P.habDecay (test/ca2.js:1575), P.wallSubMax (test/ca2.js:2235), P.wallSubStep (test/ca2.js:2235)

Cause class: crowd/sense/habitat, wall, squash and solver tunables read by the test-only functions in A and the changed functions in B. Root never defines them.

## D. wasm exports only in test (4)

lab_on, lab_ptr, reg_ptr (labelled-region native path; root guarded call at ca2.js:970 never runs on root wasm), sim_stride (cell stride 30 vs 24 in root harnesses). Cause class: wasm binary generation (test wasm 54f02eee... 153238 B vs root da211141... 143827 B).

## Status

List is NOT empty and was NOT resolved test-side: reconciling means either porting root to test (root product mutation, not authorized here) or reverting test to root (would drop served behaviour). Therefore: no root parity claim. Sep-wasm parity tests (served build) rerun: see test evidence.

## Test evidence (rerun at generation, node, repo root)

- node devtools/t-sep-wasm-parity-all.js: test/ca2core-simd.wasm { maxMoveDiff: 7.105427357601002e-15, hits: 1518 } PASS 428 checks 
- node devtools/t-sep-apply-step.js: PASS 2000 cases test/ca2.js 
- node devtools/t-sep-converge.js: PASS 200 cases; hits reduced in 200 
- node devtools/t-glue-wasm-exports.js: test/ca2core.wasm exports 64 glue uses 59 ok test/ca2core-simd.wasm exports 64 glue uses 59 ok 
- EAT=1 node devtools/t70-interact-iso-served.js 400 75 60 10: PASS js==wasm within 3% on all counters (10 states x 400 trials)

Not covered: rendering, Safari, root behaviour, birth/divide paths.

## Head independence (verified with git diff)

ca2.js and test/ are byte-identical between bf08237fea4f7f806af1c6b47427b8b9516f18cb and 3693b53dbd45b8f05aa33596083ccdf5be36b301 (0 diff lines); only devtools/ files differ. So this list is valid for both heads. Against main f8ff9d96 the only difference in ca2.js or test/ is the one-line foodInk() change in test/ca2.js (line 66 area), so the list also holds for main except foodInk() on main keeps the old eased flip. The file's own commit is a later head; its hash is the branch tip after this file lands.
