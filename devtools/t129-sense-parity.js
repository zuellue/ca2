// t129: focused sensing-band JS/wasm parity (item 64 directive 1, main 25 Oct): t74 runs with sensing OFF
// (stub P leaves senseSlow/senseTurn undefined) and t128 only asserts contact/sq decisions, so the new
// sensing code in keepIn/keep_in needs its own control. One cell per trial in the band [z, z*senseR),
// one frame per engine with t74's exact RNG sync, compare x/y/vx/vy/sq. Control trials at the container
// centre measure update()-class divergence so a band-only mismatch is attributable to the sensing math.
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'ca2.js'), 'utf8');
function fn(name) { const i = src.indexOf('function ' + name + '('); if (i < 0) throw name; let j = src.indexOf('{', i), d = 0, k = j; for (; k < src.length; k++) { if (src[k] == '{') d++; else if (src[k] == '}') { d--; if (!d) break; } } return src.slice(i, k + 1); }
function vr(name) { const i = src.indexOf('var ' + name + ' = '); let j = src.indexOf('{', i), d = 0, k = j; for (; k < src.length; k++) { if (src[k] == '{') d++; else if (src[k] == '}') { d--; if (!d) break; } } return src.slice(i, k + 1) + ';'; }
const names = ['rand2D', 'normCol', 'speedOf', 'mutGenome', 'mixGenome', 'newShape', 'mixShape', 'mutateGene', 'Cell', 'clusterSize', 'joinCluster', 'fuseCells', 'interact', 'reproduce', 'checkSurvival', 'limit', 'misfit', 'update', 'organic', 'keepIn', 'divide', 'wallPull', 'carrySide', 'effR'];
const code = `var UI_END=800,CELL_END=1300;
var rnd=function(a,b){if(b===undefined){b=a;a=0;}return a+Math.random()*(b-a);};var clamp=function(v,a,b){return v<a?a:v>b?b:v;};var lerp=function(a,b,t){return a+(b-a)*t;};var map=function(v,a,b,c,d){return c+(d-c)*(v-a)/(b-a);};
${vr('P')}
P.genomeOn=1;P.wallCarry=1;P.wallSpread=0.5;P.wallSmoothMs=60;P.squashMax=0.18;P.squashIn=0.45;P.squashOut=0.08;P.senseR=1.6;P.senseSlow=0.25;P.senseTurn=0.12;P.senseDelay=0.5;P.minEnergyForReproduction=1e9;P.reproChance=0;P.divideOn=0;P.eatMergeOn=0;P.symbiogenesisOn=0;P.habitatOn=0;P.habitatBirthCap=2;P.cellLife=0;P.cellLifeVar=0.3;P.crowdTol=0.5;P.orgLifeDie=-0.005;P.orgLifeGrow=1.0025;P.orgBirth=1.005;P.orgDead=-0.0025;P.orgBrain=0.008;P.orgR90=0.0025;P.symEnergy=0.00075;P.symBreak=0.0002;P.symBreakDist=3;P.eatDistF=0.85;P.fuseDistF=0.6;P.symDistF=1.1;
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
(async () => {
  const E = (await WebAssembly.instantiate(wasm, {})).instance.exports;
  function packWasm(cs) {
    const n = cs.length, cap = n + 16;
    const cp = E.sim_cells(cap), fxp = E.sim_food(1), cmp = E.sim_cm(1), cip = E.sim_cm_ids(), pp = E.sim_params();
    const buf = E.memory.buffer, cf = new Float64Array(buf, cp, cap * 25), p = new Float64Array(buf, pp, 93);
    cs.forEach((c, i) => { const b = i * 25, g = c.g; cf.set([c.x, c.y, c.vx, c.vy, c.radius, c.energy, c.gene, 1, c.maxSpeed, c.speedModifier, c.hostility, c.mutationRate, c.sv, c.cl || 0, -1, g.spd, g.app, g.bnd, g.col[0], g.col[1], g.col[2], c.comp || 0, 0, 0, c.sq || 0], b); });
    E.sim_set_n(n); E.sim_set_nf(0); E.sim_cm_count(0);
    p[7] = 1; // genomeOn (P_GENOME=7, not 22 - t128 pack leaves it 0, pinning wasm bnd to 1)
    p[0] = J.P.interactionRadius; p[9] = 0; p[12] = 0.001; p[13] = J.P.foodEnergyValue; p[16] = J.P.CELL_RADIUS; p[17] = J.P.foodGrowMax; p[18] = 0; p[20] = J.P.UNIVERSE_SIZE; p[22] = 1; p[23] = 70; p[24] = 0.8; p[25] = J.P.restless; p[28] = J.P.mergeGene; p[29] = 0; p[30] = 0; p[31] = J.P.energyGainFromInteraction; p[32] = J.P.GENE_MIN; p[33] = J.P.GENE_MAX; p[34] = 1e9; p[35] = J.P.clusterMax; p[36] = J.P.genomeMut; p[37] = J.P.mutationRateRange; p[38] = J.P.metaballStrength;
    p[39] = 1; p[40] = 0.5; p[41] = 1; p[49] = 0; p[50] = 0; p[51] = 400; p[52] = 400; p[53] = 0; p[54] = 0; p[56] = 0;
    p[57] = 0; p[58] = J.P.reproMinAgeMs || 0; p[59] = 0; p[60] = J.P.crowdTol; p[61] = J.P.orgLifeDie; p[62] = J.P.orgLifeGrow; p[63] = J.P.orgBirth; p[64] = J.P.orgDead; p[65] = J.P.orgBrain; p[66] = J.P.orgR90; p[67] = J.P.symEnergy; p[68] = J.P.symBreak; p[69] = J.P.symBreakDist; p[70] = J.P.eatDistF; p[71] = J.P.fuseDistF; p[72] = J.P.symDistF;
    p[78] = 16.67; p[79] = 0; p[84] = 1; p[85] = 0.5; p[86] = 0.18; p[87] = 0.45; p[88] = 0.08; p[89] = 1.6; p[90] = 0.25; p[91] = 0.12; p[92] = 0.5; // sensing ON, both engines
    return cp;
  }
  function readWasm(n) {
    const cf = new Float64Array(E.memory.buffer, E.sim_cells_ptr(), (n + 16) * 25), out = [];
    for (let i = 0; i < n; i++) { const b = i * 25; out.push({ x: cf[b], y: cf[b + 1], vx: cf[b + 2], vy: cf[b + 3], sq: cf[b + 24] }); }
    return out;
  }
  function mkCell(x, y, vx, vy, bnd, gene, ms) {
    const c = new J.Cell(x, y, 5, 5);
    c.radius = 5; c.energy = 50; c.shp = { t: 0 }; c.sq = 0; c.sqS = 0; c.vx = vx; c.vy = vy;
    c.g.bnd = bnd; c.gene = gene; c.maxSpeed = ms; return c;
  }
  const trials = [];
  const bz = J.P.boundZone;
  for (const bnd of [0.3, 0.65, 1.1]) for (const gene of [0.13, 0.57, 0.91]) for (const ms of [2, 5]) {
    const z = Math.max(0, Math.min(bz * bnd, 400 / 2.5, 400 / 2.5)), pos = z * 1.2; // inside [z, z*1.6) for every wall
    trials.push({ tag: 'L', c: [pos, 200, -0.5, 0, bnd, gene, ms] });
    trials.push({ tag: 'R', c: [400 - pos, 200, 0.5, 0, bnd, gene, ms] });
    trials.push({ tag: 'T', c: [200, pos, 0, -0.5, bnd, gene, ms] });
    trials.push({ tag: 'B', c: [200, 400 - pos, 0, 0.5, bnd, gene, ms] });
  }
  for (const gene of [0.13, 0.57, 0.91]) for (const ms of [2, 5]) trials.push({ tag: 'C', c: [200, 200, 0.5, -0.3, 0.65, gene, ms] }); // centre controls: update()-class divergence
  let exact = 0, worst = null; const rows = [];
  for (const t of trials) {
    const c = mkCell.apply(null, t.c); J.cells = [c];
    const cp = packWasm([c]);
    J.ev.hit = 0; Math.random = xorSeed(111, 222);
    J.frame(); E.sim_step(111, 222);
    // JS render-path ease (stepSquash equivalent, same as t128): wasm runs it inside sim_step, JS must apply it here
    { const g2 = 0, bx = c.x - 0 - g2, by = c.y - 0 - g2, rf = Math.max(1, Math.min(bx, 400 - g2 - bx, by, 400 - g2 - by));
      const tg = Math.max(Math.min(Math.max(1 - Math.max(0, rf - c.radius) / 8, 0), 1), c.sqS || 0);
      const ek = 16.67 * 0.06, rate = tg > (c.sq || 0) ? 0.45 : 0.08;
      c.sq = (c.sq || 0) + (tg - (c.sq || 0)) * (1 - Math.pow(1 - rate, ek)); c.sqS = 0; }
    const q = readWasm(1)[0];
    const r = { tag: t.tag, bnd: t.c[4], gene: t.c[5], ms: t.c[6], dx: +(c.x - q.x).toFixed(6), dy: +(c.y - q.y).toFixed(6), dvx: +(c.vx - q.vx).toFixed(6), dvy: +(c.vy - q.vy).toFixed(6), dsq: +((c.sq || 0) - q.sq).toFixed(6), jsVx: +c.vx.toFixed(6), wVx: +q.vx.toFixed(6), jsVy: +c.vy.toFixed(6), wVy: +q.vy.toFixed(6) };
    const md = Math.max(Math.abs(r.dx), Math.abs(r.dy), Math.abs(r.dvx), Math.abs(r.dvy), Math.abs(r.dsq));
    if (md === 0) exact++; if (!worst || md > worst.md) worst = { md: md, row: r };
    rows.push(r);
  }
  const band = rows.filter(r => r.tag !== 'C'), ctrl = rows.filter(r => r.tag === 'C');
  const bandExact = band.filter(r => Math.max(Math.abs(r.dx), Math.abs(r.dy), Math.abs(r.dvx), Math.abs(r.dvy), Math.abs(r.dsq)) === 0).length;
  const ctrlExact = ctrl.filter(r => Math.max(Math.abs(r.dx), Math.abs(r.dy), Math.abs(r.dvx), Math.abs(r.dvy), Math.abs(r.dsq)) === 0).length;
  console.log(JSON.stringify({ trials: rows.length, exact: exact, bandExact: bandExact + '/' + band.length, ctrlExact: ctrlExact + '/' + ctrl.length, worst: worst, diverged: rows.filter(r => Math.max(Math.abs(r.dx), Math.abs(r.dy), Math.abs(r.dvx), Math.abs(r.dvy), Math.abs(r.dsq)) > 0).slice(0, 6) }));
  process.exit(0);
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });
