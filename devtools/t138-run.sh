#!/bin/sh
# t138 f9 behavior reconstruction - exact reproduction (owner block 93d).
# Needs: checkout of branch organic-walls (t130 harness) at $CA2, node + node-canvas at $NODE_PATH,
# engine dirs: $ENG/tr8F8R/ and $ENG/tr8F9R/ each holding ca2.js (the pinned instrumented build),
# ca2core.wasm, ca2core-simd.wasm (per MANIFEST shas) and Ca2-Thin.ttf.
# Fixtures (identical on organic-walls and f8-pressure-force): devtools/t130-evidence/pins/{stateB,livepreset}.json
# and devtools/t130-evidence/t130m-motion-base-s1.json.
set -eu
CA2=${CA2:-/home/sandbox/ca2}; ENG=${ENG:-/tmp/eng}; P=$CA2/devtools/t130-evidence/pins
RUN="node $CA2/devtools/t130-deterministic-pair.js"
ENV="T130_RES=0.4 T130_TRACE=1"
# A/A controls (replay OFF): determinismSelfCheck must be true
env $ENV $RUN $ENG/tr8F8R/ca2.js $ENG/tr8F8R/ca2.js $P/stateB.json $P/livepreset.json 220 1 60 > t138-aa-f8-s1.json
env $ENV $RUN $ENG/tr8F9R/ca2.js $ENG/tr8F9R/ca2.js $P/stateB.json $P/livepreset.json 220 1 60 > t138-aa-f9-s1.json
# Paired f8 vs f9 under the pinned 77d replay script, seeds 1-3, motion witness ON
for s in 1 2 3; do
  env $ENV T130_MOTION=1 T130_REPLAY=$CA2/devtools/t130-evidence/t130m-motion-base-s1.json \
    $RUN $ENG/tr8F8R/ca2.js $ENG/tr8F9R/ca2.js $P/stateB.json $P/livepreset.json 220 $s 60 > t138r-pair-s$s.json
done
# Bounded nosim mechanism diagnostic (JS mirror path; witness-grade only, NOT matrix-comparable)
env T130_RES=0.4 T130_SEARCH='?nosim=1' T130_BOOT_SETTLE=40 T130_HOLD_SCALE=0.25 \
  $RUN $ENG/tr8F8R/ca2.js $ENG/tr8F9R/ca2.js $P/stateB.json $P/livepreset.json 55 1 60 > t138n-pair-nosim-s1.json
