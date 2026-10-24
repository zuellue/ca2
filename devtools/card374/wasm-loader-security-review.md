# Security review: wasm loader module (card 20261024-374-ca)

- Repo/branch: zuellue/ca2 @ wasm-jsrnd-spike, commit c57e892b8f4713924fe7a8410a8fd887e5a25e08 (verified by clone + ls-remote, 2026-10-24)
- Scope (per card): the wasm fetch/instantiate path and the query-flag (?jsrnd=) override surface. Review only, no runtime change.
- Reviewer: independent verify pass; all line numbers against the pinned commit.

## Surface under review

- ca2.js:814-821 — capability probe (WebAssembly + SIMD validate), flag parse, artifact select, fetch, arrayBuffer, WebAssembly.instantiate, export adoption.
- Query flags: ?nowasm=1 (ca2.js:814), ?nosimd=1 (:815), ?jsrnd=1 (:816), ?nosim=1 (checked at call sites, e.g. :644, :2182; 27 uses).
- Import surface: exactly one host import, env.js_rnd (ca2.js:818), declared in Rust only under the jsrnd feature (e.g. wasm/src/tr.rs:22, fd1.rs:15, fd2.rs:6).
- Referenced artifacts (all present on the branch): ca2core.wasm, ca2core-simd.wasm, ca2core-jsrnd.wasm, ca2core-jsrnd-simd.wasm. sha256 at the pinned commit:
  - a94dbf3f8e25f0517df0e02fd881dfd04557fdcf45a056a38e16d8bd665dbf26  ca2core.wasm
  - bdd56ede0b344cc8b70eeb82780a1070be8c340101f2f919c348a8c6d183b6a7  ca2core-simd.wasm
  - 5c2597e3e9767b423c2453e75af593fb39f6f8c3008c1835e4938d6ada6ddef4  ca2core-jsrnd.wasm
  - f06d0246c8810ee55b669627931f7116ef2b4456df494af48023cc1bff767f92  ca2core-jsrnd-simd.wasm

## Grain artifact check (card 017 input)

The card 20261024-017-ca evidence names a NEW artifact ca2core-grain.wasm on branch card017-grain-parity. That branch exists (@ 454efa489882f87d6f398135464c9ae2f20e146e, ls-remote readback), but on wasm-jsrnd-spike ca2core-grain.wasm is neither present nor referenced by ca2.js, grain.js, or index.html (grep). The grain wasm introduces no new loader surface in the code under review; grain.js itself is pure WebGL2 shader + an embedded blue-noise tile and never fetches a wasm binary.

## Findings

### F1 (low) - no export-shape / ABI validation before WC.ok = true
ca2.js:819. The loader adopts e.memory, e.cells_ptr, e.out_ptr, e.mb_field, e.mb_field_f32 by name and probes only e.sim_step. A stale-but-valid binary can then throw outside the guarded call sites: e.g. WC.field(nw, bw, bh, ...) at ca2.js:991 runs in the frame path with no try/catch, so an ABI mismatch surfaces as per-frame exceptions instead of a clean JS fallback. The pairing hazard is real because cache-busters are independent: index.html:179 pins ca2.js?v=202610231815 while the wasm pin at ca2.js:818 is ?v=202610221624, so a deploy that changes both artifacts but forgets one pin can mix versions. Recommendation: before WC.ok = true, verify the required export set (and ideally a numeric ABI-version export) and fail into the existing catch path on any miss.

### F2 (low, defense-in-depth only) - no integrity pinning of the wasm bytes
ca2.js:818. The bytes are compiled but not hash-checked after fetch. Current exposure is nil: the artifacts are same-origin statics on GitHub Pages, and anyone who can swap a binary on the origin can already swap the page's JS, so a pin adds nothing against the live threat model. It would matter only if the artifacts are ever served through a third-party CDN/proxy or a deploy pipeline split from the HTML/JS. No change recommended today; note for a future hosting change.

### F3 (info) - ?jsrnd=1 is a public, undocumented behavior switch
ca2.js:816. The flag is matchable by anyone on the client and swaps both the artifact and the PRNG source: under jsrnd the Rust side draws from the real Math.random stream through env.js_rnd and ignores the sim seed arguments (wasm/src/tr.rs:38 `let _ = (s0, s1);`). This is the spike's stated purpose and has no privilege boundary to cross (pure client-side artwork state), so it is not a vulnerability; recorded so the flag's effect is deliberate when the spike decision is made.

## Checked, no findings

- No URL injection through flags: the artifact name is a hardcoded ternary (ca2.js:818); flag text never enters the URL. All four selectable artifacts are same-origin statics.
- Fail-closed loader: HTTP error, invalid bytes, compile failure, or a missing env.js_rnd import (e.g. jsrnd binary under a non-jsrnd name) all land in .catch with WC.ok left false and the pure-JS path running (ca2.js:818-821).
- Flag parsing: /[?&]flag=1/ requires ? or & before the flag name; a match can only select among the four artifacts or disable wasm/simd/sim call sites. It cannot fetch anything else, and it does not reach the admin/Worker surface.
- env.js_rnd is the only host capability handed to the module (ca2.js:818); it is one-way (wasm pulls a random f64) and exposes no page state. The ln argument is ignored in JS.
- Buffer-form instantiate (not instantiateStreaming) avoids the MIME-type failure mode on static hosting; no eval/new Function in the loader path.
- grain.js carries no wasm surface (see grain check above).
- Out of scope but adjacent: the admin unlock runs a Worker-returned module via new Function (ca2.js:3746-3749). It is gated by the Worker's code verification, is untouched by the query flags, and was not reviewed here; flag it as the surface to examine if a wider review is ever ordered.

## Landing note (coordinator, 2026-10-24)
Review only, branch-only; no fixes, no deploy, no merge. Findings F1-F3 are static-analysis potentials, not exploit or runtime proof. F2's "current exposure is nil" reads too absolute: it rests on the existing same-origin hosting assumption and is not proof of zero risk. The adjacent admin-unlock new Function surface (ca2.js:3746-3749) is out of scope here and unreviewed.
