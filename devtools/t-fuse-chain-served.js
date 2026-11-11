#!/usr/bin/env node
// CA-47 diagnostic: deterministic multi-fuse fixtures against the served wasm.
// Exit 0 only if every comparison is CLEAN and at least one repeated-parent chain fired.
// A SEED is a completed comparison, not a crash. Nonzero/missing verdict is an error.
const fs = require('fs');
const path = require('path');
const os = require('os');
const {spawnSync} = require('child_process');
const root = path.resolve(__dirname, '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ca47-'));
const rows = [];
const total = 24;
for (let seed = 1; seed <= total; seed++) {
  const n = seed % 2 ? 4 : 5;
  const reverse = seed % 4 >= 2;
  const cells = [];
  const shift = Math.floor((seed - 1) / 4) * 0.013;
  for (let i = 0; i < n; i++) cells.push({
    x: 40 + i * 2, y: 40 + (i % 2) * 2, radius: 8 - i,
    energy: 40 + i, vx: 0, vy: 0, maxSpeed: 0, speedModifier: 1, hostility: 0,
    g: {spd: 0.7 + i * 0.17 + shift, app: 0.4 + i * 0.12,
      bnd: 0.8 + i * 0.16 - shift, col: [0.5, 0.5, 0.5]}
  });
  if (reverse) cells.reverse();
  const fixture = path.join(dir, `seed-${seed}.json`);
  const out = path.join(dir, `seed-${seed}.out`);
  fs.writeFileSync(fixture, JSON.stringify(cells));
  const run = spawnSync('sh', ['devtools/ca2-parity-run.sh'], {
    cwd: root, encoding: 'utf8', timeout: 30000,
    env: {...process.env, OUT: out, CELLSJSON: fixture, STATESEED: String(seed),
      STEPS: '1', CA2FUSEFIX: '1', EAT: '1', TRACE2: '1', CA2TRIG: '1', FULLST: '1',
      EVT: '1', ARGV: '1 4 160 1', NEEDCOUNT: 'fuse', REQUIRE: 'SEEDED-FULLST',
      SET: 'divideOn=0,interactionRadius=200,eatDistF=0.85,fuseDistF=20,mergeGene=100,symDistF=1.1,reproMinAgeMs=100,eatChance=0,mergeChance=1,reproChance=0'}
  });
  const verdict = (run.stdout || '').match(/^(CLEAN|SEED|FAIL|ERROR).*$/m);
  const kind = verdict ? verdict[1] : 'ERROR';
  const expected = {CLEAN: 0, SEED: 1, FAIL: 1, ERROR: 2};
  const crashed = !!run.error || run.signal !== null || !verdict || run.status !== expected[kind] || kind === 'ERROR';
  const text = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  const depths = new Map();
  let chainDepth = 0, fuses = 0;
  for (const m of text.matchAll(/^FUSED .*? big=(\d+) sm=(\d+) br=([\d.]+) sr=([\d.]+)/gm)) {
    // Historical EVT field labels name the caller/callee, not the radius winner.
    const a = +m[1], b = +m[2];
    const winner = +m[3] >= +m[4] ? a : b;
    const loser = winner === a ? b : a;
    const depth = Math.max(depths.get(winner) || 0, depths.get(loser) || 0) + 1;
    depths.set(winner, depth); depths.delete(loser);
    chainDepth = Math.max(chainDepth, depth); fuses++;
  }
  const pair = text.match(/^  js   (.+)\n  wasm (.+)$/m);
  let diff = null;
  if (pair) {
    const js = JSON.parse(pair[1]), wasm = JSON.parse(pair[2]); diff = {};
    for (const k of Object.keys(js)) if (js[k] !== wasm[k]) diff[k] = js[k] - wasm[k];
  }
  rows.push({seed, n, reverse, kind: crashed ? 'ERROR' : kind, exit: run.status,
    fuses, chainDepth, diff});
}
const summary = {total, completed: rows.filter(r => r.kind !== 'ERROR').length,
  crashed: rows.filter(r => r.kind === 'ERROR').length, unrun: total - rows.length,
  clean: rows.filter(r => r.kind === 'CLEAN').length,
  divergent: rows.filter(r => r.kind === 'SEED' || r.kind === 'FAIL').length,
  repeatedParentCases: rows.filter(r => r.chainDepth >= 2).length,
  maxChainDepth: Math.max(...rows.map(r => r.chainDepth))};
console.log(JSON.stringify({summary, rows, artifacts: dir}, null, 2));
process.exitCode = summary.crashed ? 2 : summary.clean === total && summary.repeatedParentCases ? 0 : 1;
