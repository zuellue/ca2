# Food / parasite project tests (preserved, no runtime code)

Pure-node units (run against the current ca2.js, extract the real functions): t-food-spot-unit, t-pushout-unit, t-guard-allink-unit, t-density-setter-unit, t-parasite-circle-unit.
Browser traces (headless Chrome via harness.js + dbg-inject.js): t-food-ink, t-mode2-trace, t-intro-trace, t-mass-trace, t-circle-live, t-circle-starve, t-wings-shot, t-wing-strip, t-mobile-state, t-energy-ab, t-food-highshare.

Results files: mass-r3-results.txt, mass-r4-results.txt (900+ dots NOT reached; max 20 and 8), r3-live-results.txt, density-setter-before-after.txt, ab-real-results.txt, ab-real-README.txt.

Limits, stated plainly:
- t-ab-virtual.js is a FAILURE harness (it hangs, also on the baseline). It is not a passing test.
- t-ab-real.js: 3 seeds, real time, FPS about 3 in a CPU-starved sandbox. Not snapshot parity, no valid cost number. Spawn RNG diverges on purpose.
- The original live case (4 dots on ink at n=922) was NOT reproduced. A candidate cause (applyKey foodDensity spawn without ink exclusion) is fixed, but causality is not shown.
- Cost is unmeasured. No performance claim.
