# LABELED EXPERIMENT: behavioral fit of the JS crowd-drift formula to the served binary (2026-11-07)

Script: devtools/fit-crowdpush.js (builds mutated ca2.js copies in /tmp; default JS untouched).
Gate: FULLST=1 STEPS=30, 100 trials x 2 states, 3 reps per variant. Reference unmodified JS: ratio ~2.8x (js envVx ~0.30 vs wasm ~0.84). PASS band: within 0.35.

| variant | PASS | js envVx range | note |
|---------|------|----------------|------|
| cpush x1.5 | 0/3 | 0.32-0.39 | |
| cpush x2 | 0/3 | 0.35-0.48 | |
| cpush x2.5 | 0/3 | 0.52-0.60 | closest with nocrowdf |
| cpush x3 | 0/3 | 0.47-0.53 | no further gain vs x2.5 - saturation |
| nocrowdf (drop min(1,crowd)) | 0/3 | 0.58-0.63 | closest with x2.5 |
| sqrt(crowd) | 0/3 | 0.30-0.44 | |

wasm envVx stable 0.75-0.96 across all runs.

## Result: the simple magnitude/crowd-factor fit family FAILS. JS envV saturates ~0.6 even at 3x cpush while
the served binary sustains 0.75-0.96 - the served formula differs STRUCTURALLY (injection count, an extra
term, or a different equilibrium), not just in scale. Reinforces CA-25: alignment needs the v6/v8b source;
behavioral fitting would be guesswork layered on an unknown formula. Experiment closed, not merged.
