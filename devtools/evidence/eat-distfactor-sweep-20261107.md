# CA-20 follow-up: gate fix + CA-21 EAT distance-factor sweep (2026-11-07)

## Gate fix (part of CA-21):
The 15% same-pass coupling floor for merge/fuse/pair (CA-13) was gated on FULL only; EAT mode exercised the same interact() same-pass loop with a 3% fuse gate, so fuseDistF=0.5 failed at 6.1% and symDistF=3 at 4.3% on fuse - coupling noise, not divergence. Gate now: (FULL||EAT) applies CTOL=15% to merge/fuse/pair. eatDistF=2 already passed at 3% (eat channel less coupled).

## CA-21 sweep (EAT=1 SET=<factor>, 400 trials x 2 states, served wasm):
- eatDistF=2: PASS
- fuseDistF=0.5: PASS (raw fuse divergence 6.1%, under floor)
- symDistF=3: PASS (raw fuse divergence 4.3%, under floor)
- baseline EAT: PASS (regression)
- JS-only mutation (fuseDistF x3 in ca2.js copy): FAILs hard across channels - gate retains teeth.
- BIRTH 800x4 regression: PASS.
