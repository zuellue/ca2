# CA-18 RESOLUTION (alignment branch): kind2 "gap" was counter semantics, not a binary/source gap (2026-11-07)

sim.rs:179: divide increments BOTH out[0] (births) and out[1] (divides) and logs kind1. reproduce (sim.rs:398/407) increments out[0] and logs kind2 only. So out[0] = reproduce-births + divide-births, kind2 = reproduce-births only, and kind2 == out[0]-out[1] EXACTLY.

Verified on the fresh 51dce62 build AND served binary:
- 200x40x160x4: kind2 4430 == out[0] 12765 - out[1] 8335. EXACT.
- 50x20x200x2 reproChance=0.02: kind2 4 == 656-652. EXACT.
- kind1==out[1], kind3==out[4] exact as before; 0 malformed.

JS agrees already: ev.birth counts all birth paths (reproduce 510, divide 436, lobe 426, ...). No engine change needed - the LOGCHK gate now encodes the identity. Gap list for CA-7 drops to 3: CA-12 pair order, CA-15/19 crowdPush, CA-20 birth cap.
