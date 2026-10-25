# Bundle custody note (77d-a v3-receipt-bundle-873f3104.tgz)

Bundle sha256: 77932a8e7d548649566fb8878fd8f00251b2d7785bfea9f24406d499ffeecf94 (358373 bytes).
Status: RESEARCH / REJECTED candidate. Not accepted, not deployed, not production.

Payload identity check against ../ (already-filed custody), 2026-10-25:
  ca2-base-a62be62.js        IDENTICAL to ../pins/ca2-candidate-base-a62be62.js (fa19b337...)
  ca2-v3-receipt.js          IDENTICAL to ../ca2-effR-v3-receipt-candidate-9cfb6375.js (47eb81ad...)
  ca2-v3-ovassert.js         IDENTICAL to ../ca2-effR-v3-ovassert-a3e4341e.js (1b6ed1e7...)
  ca2-v3-receipt.patch       IDENTICAL to ../ca2-effR-v3-receipt-4e9e4aa3.patch
  test-effr-v3-receipt.mjs   differs from ../test-effr-v3-receipt-61d069ef.mjs ONLY in
                             the two referenced filenames (self-contained layout)
  test-effr-v3-solver-chain.mjs differs from ../test-effr-v3-solver-chain-7fb9473a.mjs
                             ONLY in the two referenced filenames
Only the bundle README.md (kept here verbatim) was missing material; payloads are not
duplicated. To reproduce with the bundle layout, unpack the original tgz; the custody
copies one level up run as: node <test> with base.js/cand renamed per the test header.
