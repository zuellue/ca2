# Root vs test/ inventory, measured 2026-11-07 01:03 +03 on branch ca/187-sep-wasm-parity-tests (test/ca2.js includes foodInk fix; main f8ff9d96 test/ca2.js sha256 f762e0d4...)

Command: node devtools/t-root-vs-test-inventory.js

```
files (sha256[:12], bytes):
  ca2.js             df70c064f864 352499 | test ac454fc5d946 390513 DIFF
  ca2core.wasm       da21114199b8 143827 | test 54f02eee3810 153238 DIFF
  ca2core-simd.wasm  3fc2ec0ffe76 144387 | test 20763187d26d 153786 DIFF
  index.html         aa7e00dbdbca 21343 | test 3878db62a1f2 21408 DIFF
  grain.js           1dd0c30f1824 24096 | test 1dd0c30f1824 24096 SAME
  audio.js           1f9efcf0574f 7191 | test 1f9efcf0574f 7191 SAME
functions: root 237 test 247 | only in test 10 | only in root 0
 only in test: carrySide constraintSolver effR finalWallClamp foodInk logDeath murmurStep splitLobes stepSquash wallSubPass
 only in root: (none)
P assignments: root 101 test 122 | only in test 21 : crowdGain crowdPush crowdRel crowdSlow habDecay habMax habRate senseDelay senseR senseSlow senseTurn solverIters solverOverlap squashIn squashMax squashOut wallCarry wallSmoothMs wallSpread wallSubMax wallSubStep
 only in root: (none)
wasm exports: root 60 test 64 | only in test: lab_on lab_ptr reg_ptr sim_stride | only in root: (none)
```

Reading: root is a strict subset of test/ (nothing exists only in root): 10 functions, 21 P keys and 4 wasm exports (lab_on, lab_ptr, reg_ptr, sim_stride) exist only in test/. grain.js and audio.js are identical. Root vs test BEHAVIOUR equivalence is neither claimed nor expected; promoting test to root is an owner-gated decision.
