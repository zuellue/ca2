// Deliberately crashing engine for the parity runner self-check:
// sh devtools/ca2-parity-run.sh --selfcheck must report this run as a failure.
function update(c) { throw new Error('SELFCHECK deliberate crash'); }
