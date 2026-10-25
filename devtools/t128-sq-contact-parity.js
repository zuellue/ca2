// t128: focused SQ>0 JS/wasm contact parity (main 25 Oct): t74 never drives sq>0, so the eased-squash
// contact path (effR in interact 1:1 sim.rs) needs its own control.
// Part A: easing OFF both sides (p[87]=p[88]=0, JS stepSquash not run) - pure contact: 1 frame, compare
//   per-cell x/y/vx/vy + event counts. Part B: easing ON - compare final sq per cell (easing arithmetic parity).
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'ca2.js'), 'utf8');
function fn(name) { const i = src.indexOf('function ' + name + '('); if (i < 0) throw name; let j = src.indexOf('{', i), d = 0, k = j; for (; k < src.length; k++) { if (src[k] == '{') d++; else if (src[k] == '}') { d--; if (!d) break; } } return src.slice(i, k + 1); }
function vr(name) { const i = src.indexOf('var ' + name + ' = '); let j = src.indexOf('{', i), d = 0, k = j; for (; k < src.length; k++) { if (src[k] == '{') d++; else if (src[k] == '}') { d--; if (!d) break; } } return src.slice(i, k + 1) + ';'; }
const names = ['rand2D', 'normCol', 'speedOf', 'mutGenome', 'mixGenome', 'newShape', 'mixShape', 'mutateGene', 'Cell', 'clusterSize', 'joinCluster', 'fuseCells', 'interact', 'reproduce', 'checkSurvival', 'limit', 'misfit', 'update', 'organic', 'keepIn', 'divide', 'wallPull', 'carrySide', 'effR'];
const code = `var UI_END=800,CELL_END=1300;
var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var clamp=function(v,a,b){return v<a?a:v>b?b:v;};var lerp=function(a,b,t){return a+(b-a)*t;};var map=function(v,a,b,c,d){return c+(d-c)*(v-a)/(b-a);};
${vr('P')}
P.wallCarry=1;P.wallSpread=0.5;P.wallSmoothMs=60;P.squashMax=0.18;P.squashIn=0.45;P.squashOut=0.08;P.senseR=1.6;P.senseSlow=0.25;P.senseTurn=0.12;P.senseDelay=0.5;P.crowdGain=0.12;P.crowdRel=0.02;P.crowdSlow=0.5;P.crowdPush=0.3;P.minEnergyForReproduction=1e9;P.reproChance=0;P.divideOn=0;P.eatMergeOn=0;P.symbiogenesisOn=0;P.habitatOn=0;P.habitatBirthCap=2;P.cellLife=0;P.cellLifeVar=0.3;P.crowdTol=0.5;P.orgLifeDie=-0.005;P.orgLifeGrow=1.0025;P.orgBirth=1.005;P.orgDead=-0.0025;P.orgBrain=0.008;P.orgR90=0.0025;P.symEnergy=0.00075;P.symBreak=0.0002;P.symBreakDist=3;P.eatDistF=0.85;P.fuseDistF=0.6;P.symDistF=1.1;
function habAte(){}function habReap(){}
var cells=[],food=[],ev={birth:0,death:0,hit:0,oob:0},clusterSeq=0,env={spd:1,app:0.5,bnd:1,col:null},cmean={};
var cont={x:0,y:0,w:400,h:400,wvx0:0,wvx1:0,wvy0:0,wvy1:0},mouse={x:-1e9,y:-1e9,over:false},resizeDrag=false,frameDtf=16.67;
var frameT=0;
function birthCapF(){return 1;}
${names.map(fn).join('\n')}
return {P:P,Cell:Cell,get cells(){return cells;},set cells(v){cells=v;},ev:ev,cont:cont,
 frame:function(){for(var i=cells.length-1;i>=0;i--){var c=cells[i];update(c);checkSurvival(c);for(var k=i-1;k>=0;k--)interact(c,cells[k]);if(P.boundAware&&c.alive)keepIn(c);}}};`;
const M64=(1n<<64n)-1n;
function xorSeed(a,b){let s0=(BigInt(a>>>0)<<32n)|0x9E3779B9n,s1=(BigInt(b>>>0)<<32n)|0x85EBCA6Bn;const f=function(){f.n++;let x=s0,y=s1;s0=y;x=(x^(x<<23n))&M64;s1=(x^y^(x>>17n)^(y>>26n))&M64;return Number(((s1+y)&M64)>>11n)/9007199254740992;};f.n=0;return f;}
const J = new Function(code)();
const wasm = fs.readFileSync(path.join(__dirname, '..', 'wasm', 'target', 'wasm32-unknown-unknown', 'release', 'ca2core.wasm'));
const SQV = +(process.argv[2] === undefined ? 0.5 : process.argv[2]); // control: 0 = squash path inert
function mkCells() {
  const cs = [], mk2 = (x, y, r) => { const c = new J.Cell(x, y, 5, 5); c.radius = r; c.energy = 50; c.shp = { t: 0 }; c.sq = SQV; c.vx = 0; c.vy = 0; return c; };
  if (process.argv[3] === 'thresh') { cs.push(mk2(200, 200, 5), mk2(208, 205, 5)); } // threshold pair: raw sum 10 > dist 9.43 > eased sum 9.1 - hit flips ONLY if the eased radius is applied
else { cs.push(mk2(200, 200, 30), mk2(208, 205, 30)); } // overlapping pair (dist ~9.4 < interactionRadius 12)
cs.push(mk2(5, 150, 20), mk2(12, 250, 20)); // 2 at the left wall
  return cs;
}
(async () => {
  const E = (await WebAssembly.instantiate(wasm, {})).instance.exports;
  function packWasm(cs, ease) {
    const n = cs.length, cap = n + 16;
    const cp = E.sim_cells(cap), fxp = E.sim_food(1), cmp = E.sim_cm(1), cip = E.sim_cm_ids(), pp = E.sim_params();
    const buf = E.memory.buffer, cf = new Float64Array(buf, cp, cap * 29), p = new Float64Array(buf, pp, 97);
    cs.forEach((c, i) => { const b = i * 29, g = c.g; cf.set([c.x, c.y, c.vx, c.vy, c.radius, c.energy, c.gene, 1, c.maxSpeed, c.speedModifier, c.hostility, c.mutationRate, c.sv, c.cl || 0, -1, g.spd, g.app, g.bnd, g.col[0], g.col[1], g.col[2], c.comp || 0, 0, 0, c.sq || 0], b); });
    E.sim_set_n(n); E.sim_set_nf(0); E.sim_cm_count(0);
    p[7] = 1; // genomeOn (P_GENOME=7): without it wasm pins bnd to 1 while JS uses c.g.bnd
    p[0] = J.P.interactionRadius; p[9] = 0; p[12] = 0.001; p[13] = J.P.foodEnergyValue; p[16] = J.P.CELL_RADIUS; p[17] = J.P.foodGrowMax; p[18] = 0; p[20] = J.P.UNIVERSE_SIZE; p[22] = 1; p[23] = 70; p[24] = 0.8; p[25] = J.P.restless; p[28] = J.P.mergeGene; p[29] = 0; p[30] = 0; p[31] = J.P.energyGainFromInteraction; p[32] = J.P.GENE_MIN; p[33] = J.P.GENE_MAX; p[34] = 1e9; p[35] = J.P.clusterMax; p[36] = J.P.genomeMut; p[37] = J.P.mutationRateRange; p[38] = J.P.metaballStrength;
    p[39] = 1; p[40] = 0.5; p[41] = 1; p[49] = 0; p[50] = 0; p[51] = 400; p[52] = 400; p[53] = 0; p[54] = 0; p[56] = 0;
    p[57] = 0; p[58] = J.P.reproMinAgeMs || 0; p[59] = 0; p[60] = J.P.crowdTol; p[61] = J.P.orgLifeDie; p[62] = J.P.orgLifeGrow; p[63] = J.P.orgBirth; p[64] = J.P.orgDead; p[65] = J.P.orgBrain; p[66] = J.P.orgR90; p[67] = J.P.symEnergy; p[68] = J.P.symBreak; p[69] = J.P.symBreakDist; p[70] = J.P.eatDistF; p[71] = J.P.fuseDistF; p[72] = J.P.symDistF;
    p[78] = 16.67; p[79] = 0; p[84] = 1; p[85] = 0.5; p[86] = 0.18; p[87] = ease ? 0.45 : 0; p[88] = ease ? 0.08 : 0; p[89] = 1.6; p[90] = 0.25; p[91] = 0.12; p[92] = 0.5; p[93] = 0.12; p[94] = 0.02; p[95] = 0.5; p[96] = 0.3; // crowding field on, both engines (item 64 directive 4) // sensing on, both engines (item 64 directive 1)
    return cp;
  }
  function readWasm(cp, n) {
    const cf = new Float64Array(E.memory.buffer, E.sim_cells_ptr(), (n + 16) * 29), out = [];
    for (let i = 0; i < n; i++) { const b = i * 29; out.push({ x: cf[b], y: cf[b + 1], vx: cf[b + 2], vy: cf[b + 3], r: cf[b + 4], sq: cf[b + 24], crowd: cf[b + 25], sqs: cf[b + 28] }); } // 25: crowding field, 28: wall-press signal out (item 64)
    const o = new Float64Array(E.memory.buffer, E.sim_out(), 32);
    return { cells: out, hit: o[6], oob: o[7] };
  }
  for (const ease of [0, 1]) {
    const cs = mkCells(); J.cells = cs;
    const cp = packWasm(cs, ease);
    J.ev.hit = 0; Math.random = xorSeed(111, 222); // exact RNG sync with sim_step(111, 222) (t74 method)
    J.frame(); // JS engine: 1 frame (update/interact/keepIn order matches sim.rs step)
    E.sim_step(111, 222);
    if (ease) { // the squash ease is a JS post-pass for BOTH engines now (item 64 directive 2, stepSquash): target = pressure signals only (sqS + crowding field), no geometry term (architect finding c); the wasm press signal arrives via the SQS slot
      for (const c of cs) { if (!c.alive) continue;
        var tg = Math.max(c.sqS || 0, Math.min(1, c.crowd || 0));
        var ek = 16.67 * 0.06, rate = tg > (c.sq || 0) ? 0.45 : 0.08;
        c.sq = (c.sq || 0) + (tg - (c.sq || 0)) * (1 - Math.pow(1 - rate, ek)); c.sqS = 0; } }
    const wPre = null; // (wasm rows get the identical post-pass below, after read)
    const w = readWasm(cp, cs.length);
    if (ease) for (const q of w.cells) { var tg2 = Math.max(q.sqs || 0, Math.min(1, q.crowd || 0)), rate2 = tg2 > q.sq ? 0.45 : 0.08; q.sq = q.sq + (tg2 - q.sq) * (1 - Math.pow(1 - rate2, 16.67 * 0.06)); } // same post-pass as the JS rows
    const rows = cs.map((c, i) => {
      const q = w.cells[i];
      return { i: i, dx: +(c.x - q.x).toFixed(4), dy: +(c.y - q.y).toFixed(4), dvx: +(c.vx - q.vx).toFixed(4), dvy: +(c.vy - q.vy).toFixed(4), dsq: +((c.sq || 0) - q.sq).toFixed(4), jsSq: +(c.sq || 0).toFixed(4), wSq: +q.sq.toFixed(4) };
    });
    console.log(JSON.stringify({ sq: SQV, ease: ease, hitJS: J.ev.hit, hitWasm: w.hit, oobWasm: w.oob, rows: rows }));
  }
  process.exit(0);
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });
