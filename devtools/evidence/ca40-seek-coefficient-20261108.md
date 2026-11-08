# CA-40 seek-nudge association (RESOLVED 2026-11-08) + residual eat-path seed (OPEN)

## Resolved: seek nudge association
The served binary pre-multiplies the food-seek coefficient `k = 0.5*app*(maxSpeed*0.1+0.2)`
and applies it as `v += (dot - pos)/bd * k`. The shipped JS evaluates
`(((dot-pos)/bd*0.5)*app)*(maxSpeed*0.1+0.2)` left-to-right, which rounds the nudge
1 ulp off on roughly half of lattice-seek inputs. FEED lattice mode exercises the seek
every cell every step, so FEED configs diverged ~100% of runs at step 0-1 with a
single 1-2 ulp velocity-component flip (the original "CA-40 eat-path" signature; eating
was a red herring - FEED+no-eat+boundAware=0 reproduces it on the same states).

Method: harness STATESEED=<k> makes mkState deterministic (makeRng(1000+2k, 5000+2k)),
so a diverging state replays bit-identically. 45 seeded captures extracted via
devtools/ca2-seek-probe.js (SEEK print: pre-seek velocity, target dot, bd, app, maxSpeed,
nudge components; PRE/END prints around the frame keepIn). The f10 limit (limit(c,
maxSpeed*speedModifier) at frame close) binds on speedModifier<1 cells and must be
included when matching dump values. Candidate associations scored against the wasm
readback over 45 cells x 2 components (vx, vy):
- `(dx/bd) * (0.5*app*kn)` 90/90 (chosen; the Rust-idiomatic pre-multiplied coefficient)
- `((dx/bd)*0.5) * (app*kn)` and `(kn*0.5*app) * (dx/bd)` also 90/90 (indistinguishable
  on these inputs; all three share the grouped-coefficient structure)
- shipped JS chain 44/90 (matches exactly the non-flipped components - consistency check)
Ruled out along the way: nudge association inside the eat block (no velocity writes there),
splice vs flag removal (V1 probe), keepIn/wallPull/crowd forms (bit-exact chain
reproduction on captured states; boundAware=0 still seeded), divide draw sequence
(population/eat counts bit-match), bd hypot-vs-sqrt (identical on every captured input).

Fix: test/ca2.js behind globalThis.CA2_TRIG_MSUN (flag-free path keeps the shipped
association bit-identical). Verification: 45/45 seeded FEED replays CLEAN (STEPS=10),
mutation battery 6/6 SEED + baseline CLEAN, runner selfcheck PASS, OFF battery
(default 4x200 PASS, FULLST10 PASS, flag-free unchanged), nir x20 CLEAN,
ORACLE=800 CA2TRIG=1 no required-channel mismatches.

## Open: residual eat-path seed (second mechanism)
With the seek aligned, FEED+eat (foodEatRate>0) 30-step runs still diverge 20/20, but
the horizon moved from step 0-1 to steps 1-12 and the signature changed to
macro/population-class (paired-cell identity mismatch, |dp| up to ~3e2 - a divide-gate
or population event, not a 1-ulp velocity flip). Next: seeded replay + eat-event probe
(per-dot eat roll records) to attribute; candidates: eat-roll threshold
(1-exp(-frameDtf*rate/1000)) association, mid-loop radius growth in the eat-range test
(hoisted vs live), removal ordering vs the wasm's within-step food view.
