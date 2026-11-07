# CA-18 RESOLUTION (alignment branch): kind2 "gap" was counter semantics, not a binary/source gap (2026-11-07)

sim.rs:179: divide increments BOTH out[0] (births) and out[1] (divides) and logs kind1. reproduce (sim.rs:398/407) increments out[0] and logs kind2 only. So out[0] = reproduce-births + divide-births, kind2 = reproduce-births only, and kind2 == out[0]-out[1] EXACTLY.

Verified on the fresh 51dce62 build AND served binary:
- 200x40x160x4: kind2 4430 == out[0] 12765 - out[1] 8335. EXACT.
- 50x20x200x2 reproChance=0.02: kind2 4 == 656-652. EXACT.
- kind1==out[1], kind3==out[4] exact as before; 0 malformed.

JS agrees already: ev.birth counts all birth paths (reproduce 510, divide 436, lobe 426, ...). No engine change needed - the LOGCHK gate now encodes the identity. Gap list for CA-7 drops to 3: CA-12 pair order, CA-15/19 crowdPush, CA-20 birth cap.

## Addendum: CA-20 birth-cap mechanism probe (same branch, reverted)
Tried aligning JS birthCapF + reproduce pop-check to live count: NO effect (birth js 27589 vs wasm 29177 at cap 0.5, same as unpatched). Rust capf (sim.rs:445) uses self.n which NEVER decreases (dead flagged REM=1, live -= 1 at sim.rs:495, no swap-remove), i.e. Rust caps by total-ever-born - strictly stronger than JS's live-ish count, which predicts wasm births FEWER, the opposite of the observation. So the cap path does not explain the gap; the leading candidate is downstream population drift from the CA-15 crowdPush divergence amplified by the steep cap/n curve at tight caps. Plan: re-test CA-20 after the CA-15 crowdPush alignment lands; if it goes green, CA-20 was never an independent gap.
