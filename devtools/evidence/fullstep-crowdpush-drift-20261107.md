# FULLST finding: served binary injects ~2-3x the JS crowd-drift envV over 30 full steps (measured 2026-11-07 ~21:38 +03)

Harness: devtools/t70-interact-iso-served.js FULLST=1 (CA-15): full-step (p[56]=0) multi-step parity on
wall-fired constant-population states; the wasm side runs the app's full wasm-mode frame
(pack -> sim_step -> readback with sqS=max accumulation -> dead sweep -> stepSquash post-pass).
Channels compared as distributions over live cells (mean|v| + p95|v|): sq, sqS, crowd, envVx, envVy.

STEPS=10 (100 trials x 40 cells x box 160, several state configs incl. 300 trials x 60 x 200): PASS -
all channels within mean 25% / p95 35%. Mutation (JS keepIn press x0.5) FAILs on all channels. This is the locked-in test.

STEPS=30 (same states): FAIL - envVx mean|v| js 0.37 wasm 0.82, envVy js 0.32 wasm 0.70 (p95 1.6/3.2, 1.4/3.1).
Bisect: ZERO=crowdPush (p[96]=0 both sides) makes STEPS=30 PASS; ZERO=senseSlow,senseTurn does not;
SET=boundZone=200 (every pressed cell in-zone) widens the gap to ~3.2x. So the divergence sits in the
crowdPush along-edge drift injection rate, not the zone geometry or sensing.

Source check: 51dce62 (byte-verified f9 source) keep_in crowd block is textually 1:1 with current
ca2.js keepIn (same cpush formula, same press>0 gate, same z tests). CA-11 BOUND (keepIn-only) parity
passes at STEPS=30 with crowdPush active. Conclusion: the SERVED binary (54f02eee, 51dce62+later
rebuilds) applies the crowd drift differently from every in-repo source in FULL-step mode only -
another concrete input for the CA-7 port ruling: the served binary matches no repo source tree.
