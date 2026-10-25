// t130: deterministic fixed-dt pair harness (owner 25 Oct block 77d).
// node + node-canvas, no browser: virtual clock dt = 1000/fps exactly, seeded Math.random, frozen preset
// (fetch stub), same stateB inject, same boundary-motion script, N frames, prod and candidate step by step.
// usage: node devtools/t130-deterministic-pair.js <engineA.js> <engineB.js> <state.json> <preset.json> [N=220] [seed=1] [fps=60]
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
let createCanvas, registerFont;
try { ({ createCanvas, registerFont } = require('canvas')); } catch (e) { console.error('FATAL: npm i canvas (node-canvas) required'); process.exit(1); }
const [engineA, engineB, statePath, presetPath] = process.argv.slice(2);
const N = +(process.argv[6] || 220), SEED = +(process.argv[7] || 1), FPS = +(process.argv[8] || 60);
const DT = 1000 / FPS;
if (!engineA || !engineB || !statePath || !presetPath) { console.error('usage: t130 <engineA> <engineB> <state> <preset> [N] [seed] [fps]'); process.exit(1); }
const STATE = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const PRESET_TXT = fs.readFileSync(presetPath, 'utf8');

function makeRng(seed) { let s = seed >>> 0; return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function stubEl(tag) {
  const cls = new Set();
  const el = { tagName: (tag || 'div').toUpperCase(), children: [], dataset: {}, value: '', textContent: '', type: '', checked: false, id: '', _html: '',
    style: { setProperty() {}, removeProperty() {} },
    classList: { add(c) { cls.add(c); }, remove(c) { cls.delete(c); }, toggle(c) { cls.has(c) ? cls.delete(c) : cls.add(c); }, contains(c) { return cls.has(c); } },
    setAttribute() {}, getAttribute() { return null; }, removeAttribute() {},
    appendChild(c) { el.children.push(c); c.parentNode = el; return c; }, removeChild() {}, insertBefore() {}, remove() {},
    addEventListener(t, f) { (el._ls = el._ls || {}); (el._ls[t] = el._ls[t] || []).push(f); },
    removeEventListener() {},
    dispatchEvent(e) { e.target = el; ((el._ls || {})[e.type] || []).slice().forEach(f => f(e)); },
    focus() {}, blur() {}, click() {}, matches() { return false; }, closest() { return null; }, contains() { return false; }, querySelector(sel) { el._qs = el._qs || {}; if (el._qs[sel]) return el._qs[sel];
      const last = String(sel).split(/[\s>]+/).pop() || 'div'; const tag = (last.replace(/^[.#]/, '') || 'div').toLowerCase();
      let hit = el.children.find(c => (c.tagName || '').toLowerCase() === tag);
      if (!hit) { hit = stubEl(tag); el.appendChild(hit); }
      el._qs[sel] = hit; return hit; }, querySelectorAll() { return [] },
    getBoundingClientRect() { return { x: 0, y: 0, left: 0, top: 0, width: 900, height: 600, right: 900, bottom: 600 }; } };
  el.offsetLeft = 0; el.offsetTop = 0; el.offsetWidth = 0; el.offsetHeight = 0; el.scrollTop = 0; el.scrollLeft = 0; el.clientWidth = 0; el.clientHeight = 0;
  Object.defineProperty(el, 'childNodes', { get() { return el.children; } });
  Object.defineProperty(el, 'firstChild', { get() { return el.children[0] || null; } });
  Object.defineProperty(el, 'innerHTML', { get() { return el._html; }, set(v) { el._html = String(v); const tags = String(v).match(/<(\w+)/g) || [];
      tags.forEach(t => el.appendChild(stubEl(t.slice(1).toLowerCase()))); } });
  return el;
}

async function runEngine(enginePath, label) {
  const V = { clock: 1000, rafQ: [], timers: [] };
  let pumpCount = 0; const clockStart = V.clock;
  const rng = makeRng(SEED);
  const engineDir = path.dirname(path.resolve(enginePath));
  registerFont(path.join(engineDir, 'Ca2-Thin.ttf'), { family: 'Ca2-Thin' });
  const reg2 = path.join('/home/sandbox/ca2', 'Ca2-Thin.ttf'); if (!fs.existsSync(path.join(engineDir, 'Ca2-Thin.ttf')) && fs.existsSync(reg2)) registerFont(reg2, { family: 'Ca2-Thin' });
  function mkCanvas() { const c = createCanvas(900, 600); c._ls = {}; c.style = { setProperty() {} }; c.id = ''; c.classList = stubEl('canvas').classList;
    c.addEventListener = (t, f) => { (c._ls[t] = c._ls[t] || []).push(f); }; c.removeEventListener = () => {};
    c.dispatchEvent = (e) => { e.target = c; ((c._ls || {})[e.type] || []).slice().forEach(f => f(e)); };
    c.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, width: 900, height: 600, right: 900, bottom: 600 }); return c; }
  const ids = {};
  const doc = stubEl('document');
  doc.getElementById = (id) => { if (!ids[id]) { ids[id] = (id === 'c' || id === 'g') ? mkCanvas() : stubEl('div'); ids[id].id = id; } return ids[id]; };
  doc.createElement = (t) => t === 'canvas' ? mkCanvas() : stubEl(t);
  doc.createElementNS = (ns, t) => stubEl(t);
  doc.querySelector = (sel) => sel === 'canvas' ? doc.getElementById('c') : stubEl('div');
  doc.querySelectorAll = () => [];
  doc.documentElement = stubEl('html'); doc.head = stubEl('head'); doc.body = stubEl('body');
  doc.fonts = { load: () => Promise.resolve(), ready: Promise.resolve() };
  const store = {};
  const sandbox = {
    console, Math: Object.assign(Object.create(Math), { random: rng }),
    document: doc, navigator: { userAgent: 'node-t130', maxTouchPoints: 0 },
    location: { search: process.env.T130_SEARCH || '', href: 'http://t130.local/', pathname: '/', hash: '' },
    performance: { now: () => V.clock },
    requestAnimationFrame: (f) => { V.rafQ.push(f); return V.rafQ.length; },
    cancelAnimationFrame: () => {},
    setTimeout: (f, ms) => { V.timers.push({ f, at: V.clock + (ms || 0) }); return V.timers.length; },
    clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    fetch: async (url, opt) => {
      const u = String(url);
      if (/\.wasm/.test(u)) { const fn = u.replace(/\?.*$/, ''); const p = path.join(engineDir, fn); if (!fs.existsSync(p)) throw new Error('http 404 ' + fn); return { ok: true, status: 200, arrayBuffer: async () => fs.readFileSync(p).buffer }; }
      if (opt && opt.method === 'POST') return { ok: true, json: async () => ({ ok: 1 }) };
      return { ok: true, status: 200, json: async () => JSON.parse(PRESET_TXT), text: async () => PRESET_TXT };
    },
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    WebAssembly, JSON, Object, Array, Float32Array, Float64Array, Uint8ClampedArray, Uint32Array, Int32Array, Uint8Array, Int8Array, Int16Array, Uint16Array };
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
  sandbox.innerWidth = 900; sandbox.innerHeight = 600; sandbox.devicePixelRatio = 1;
  sandbox.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
  const winLs = {};
  sandbox.addEventListener = (t, f) => { (winLs[t] = winLs[t] || []).push(f); }; sandbox.removeEventListener = () => {};
  function fireWin(t, e) { (winLs[t] || []).slice().forEach(f => f(e)); }
  sandbox.Image = function () { return stubEl('img'); };
  sandbox.Promise = Promise; sandbox.Date = Date; sandbox.Error = Error; sandbox.TypeError = TypeError; sandbox.Map = Map; sandbox.Set = Set; sandbox.Symbol = Symbol;
  sandbox.isFinite = isFinite; sandbox.isNaN = isNaN; sandbox.parseFloat = parseFloat; sandbox.parseInt = parseInt; sandbox.Number = Number; sandbox.String = String; sandbox.Boolean = Boolean; sandbox.RegExp = RegExp; sandbox.Function = Function; sandbox.encodeURIComponent = encodeURIComponent; sandbox.decodeURIComponent = decodeURIComponent;
  sandbox.getComputedStyle = () => ({ getPropertyValue: () => '', width: '900px', height: '600px' });
  sandbox.history = { replaceState() {}, pushState() {} }; sandbox.scrollTo = () => {}; sandbox.scroll = () => {};
  sandbox.requestIdleCallback = (f) => 0; sandbox.cancelIdleCallback = () => {};
  sandbox.AudioContext = undefined; sandbox.webkitAudioContext = undefined;
  sandbox.getSelection = () => ({ removeAllRanges() {}, addRange() {} });
  sandbox.MutationObserver = class { constructor(f) {} observe() {} disconnect() {} };
  sandbox.ResizeObserver = class { constructor(f) {} observe() {} disconnect() {} };
  sandbox.IntersectionObserver = class { constructor(f) {} observe() {} disconnect() {} };
  // trace array installed AT INJECT (see below) so trace ids are inject-index aligned
  vm.createContext(sandbox);
  vm.runInContext('Math.random = window.__rng;', Object.assign(sandbox, { __rng: rng }), { filename: 'seed.js' });
  const src = fs.readFileSync(enginePath, 'utf8');
  vm.runInContext(src, sandbox, { filename: path.basename(enginePath) });
  // let async boot (wasm instantiate, preset fetch) settle
  for (let i = 0; i < 30; i++) { await new Promise(r => setImmediate(r)); pump(); }
  const ca2 = sandbox.__ca2;
  if (!ca2 || !ca2.getCells) throw new Error(label + ': __ca2 missing after boot');
  // settle intro batched spawn + boot morph: pump until full population and no trans
  for (let i = 0; i < 300; i++) { pump(); await new Promise(r => setImmediate(r)); } // fixed pre-inject pump: deterministic PRNG position, population fully replaced by inject below
  for (let i = 0; i < 600 && ca2.trans; i++) { pump(); await new Promise(r => setImmediate(r)); }
  if (ca2.trans) throw new Error(label + ': trans did not drain');
  if (!ca2.getCells().length) throw new Error(label + ': empty population at inject');
  console.error(label + ': pre-inject n=' + ca2.getCells().length);
  // panel hover: freeze auto re-deals (t127 parity)
  doc.getElementById('panel').classList.add('hov');
  ca2.setKey('fps', FPS); ca2.setKey('separatorOn', 1); if (process.env.T130_RES) ca2.setKey('resolution', +process.env.T130_RES); // render-only knob: sim semantics untouched, speeds the JS fallback path
  // inject stateB (t127 verbatim semantics)
  const INJ = STATE, cs0 = ca2.getCells();
  while (cs0.length < INJ.cells.length) { const tp0 = cs0[cs0.length - 1], d0 = Object.create(Object.getPrototypeOf(tp0)); Object.assign(d0, tp0); d0.g = JSON.parse(JSON.stringify(tp0.g)); d0.shp = JSON.parse(JSON.stringify(tp0.shp)); cs0.push(d0); }
  INJ.cells.forEach((sc, i) => { const c = cs0[i]; for (const k in sc) { if (k === 'g' || k === 'shp') c[k] = JSON.parse(JSON.stringify(sc[k])); else c[k] = sc[k]; } });
  cs0.length = INJ.cells.length;
  cs0.forEach(q => { q.envVx = 0; q.envVy = 0; }); // stateB carries no envV; zero the boot residue so both engines start with identical dynamic state
  if (process.env.T130_TRACE) { // inject-index identity: trace stays off through boot; ids = stateB index for injected cells, 1000+ for births (cross-pair aligned)
    sandbox.__ca2trace = [];
    const objToIdx = new WeakMap(); cs0.forEach((q, i) => objToIdx.set(q, i)); let birthId = 1000;
    sandbox.__ca2traceIdFn = (tc) => { const i = objToIdx.get(tc); return i !== undefined ? i : birthId++; };
    var __injReceipt = cs0.slice(0, 85).map((q, i) => ({ i, idFnOk: sandbox.__ca2traceIdFn(q) === i, x: +q.x.toFixed(3), y: +q.y.toFixed(3), radius: +q.radius.toFixed(3), vx: +q.vx.toFixed(3), vy: +q.vy.toFixed(3), energy: +q.energy.toFixed(4), sq: +q.sq.toFixed(4) }));
  }
  const fd0 = ca2.getFood(); fd0.length = 0; INJ.food.forEach(f => fd0.push({ x: f.x, y: f.y, r: f.r }));
  ca2.cont.x = INJ.cont.x; ca2.cont.y = INJ.cont.y; ca2.cont.w = INJ.cont.w; ca2.cont.h = INJ.cont.h; ca2.cont.tw = INJ.cont.w; ca2.cont.th = INJ.cont.h; ca2.cont.ew = INJ.cont.w; ca2.cont.eh = INJ.cont.h; ca2.cont.rawW = INJ.cont.w; ca2.cont.rawH = INJ.cont.h; ca2.cont.user = true;
  if (ca2.clampTargets) ca2.clampTargets();
  // re-seed post-boot so both engines enter the drag with identical PRNG streams (wasm s0/s1 are passed per-step from JS Math.random)
  const rng2 = makeRng(SEED);
  vm.runInContext('Math.random = window.__rng2;', Object.assign(sandbox, { __rng2: rng2 }), { filename: 'reseed.js' });
  // per-ti full-state verify
  const idMap = new WeakMap(); let nextTi = 0;
  let mism = 0; cs0.forEach((q, i) => { idMap.set(q, nextTi++); const s = INJ.cells[i]; if (!s || Math.abs(q.x - s.x) > 0.01 || Math.abs(q.y - s.y) > 0.01 || Math.abs(q.radius - s.radius) > 0.01 || Math.abs((q.vx||0) - (s.vx||0)) > 0.01 || Math.abs((q.vy||0) - (s.vy||0)) > 0.01 || Math.abs((q.energy||0) - (s.energy||0)) > 0.001 || Math.abs((q.sq||0) - (s.sq||0)) > 0.001) mism++; });
  const births = [], deaths = []; let prevAlive = new Set(); cs0.forEach(q => prevAlive.add(idMap.get(q)));
  const meta = { pumpsBeforeInject: pumpCount, clockAtInject: V.clock - clockStart };
  if (typeof __injReceipt !== 'undefined') { meta.injectReceipt = __injReceipt; meta.injectReceiptAllOk = __injReceipt.length === 85 && __injReceipt.every(r => r.idFnOk); }
  if (process.env.T130_TRACE && sandbox.__ca2trace) { const pre = sandbox.__ca2trace.filter(r => r[1] === 'pre').map(r => r[0]); meta.trfAtInject = pre.length ? Math.max.apply(null, pre) + 1 : 0; } // first post-inject sim-step frame
  function pump() { pumpCount++; V.clock += DT; const q = V.rafQ.splice(0); q.forEach(f => { try { f(V.clock); } catch (e) { console.error(label + ' frame EXC: ' + (e && e.stack || e).slice(0, 500)); process.exit(2); } }); }
  const COS8 = [1, 0.7071, 0, -0.7071, -1, -0.7071, 0, 0.7071], SIN8 = [0, 0.7071, 1, 0.7071, 0, -0.7071, -1, -0.7071];
  function nearContact(q) { const c = ca2.cont, r = q.radius;
    if (q.x - c.x < r + 30 || c.x + c.w - q.x < r + 30 || q.y - c.y < r + 30 || c.y + c.h - q.y < r + 30) return 1;
    if (ca2.sepInk) for (let k = 0; k < 8; k++) { for (const d of [r + 8, r + 28]) { if (ca2.sepInk(q.x + COS8[k] * d, q.y + SIN8[k] * d)) return 1; } }
    return 0; }
  function snapshot() { const out = []; const nowAlive = new Set(); cs0.forEach(q => { if (!q.alive) return; let ti = idMap.get(q); if (ti === undefined) { ti = nextTi++; idMap.set(q, ti); births.push([frames.length, ti]); } nowAlive.add(ti); out.push([ti, +q.x.toFixed(3), +q.y.toFixed(3), +q.vx.toFixed(3), +q.vy.toFixed(3), +q.radius.toFixed(3), +Math.hypot(q.envVx || 0, q.envVy || 0).toFixed(3), nearContact(q)]); });
    prevAlive.forEach(ti => { if (!nowAlive.has(ti)) deaths.push([frames.length, ti]); }); prevAlive = nowAlive;
    return { cont: [+ca2.cont.x.toFixed(3), +ca2.cont.y.toFixed(3), +ca2.cont.w.toFixed(3), +ca2.cont.h.toFixed(3)], n: out.length, cells: out }; }
  const cv = doc.getElementById('c');
  const fire = (t, x, y) => { const e = { type: t, clientX: x, clientY: y, buttons: t === 'mouseup' ? 0 : 1, target: cv, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} }; cv.dispatchEvent(e); fireWin(t, e); };
  const frames = [];
  pump(); frames.push(snapshot());
  const y = Math.round(ca2.cont.y + ca2.cont.h / 2), x0 = Math.round(ca2.cont.x + 2), half = Math.round(ca2.cont.w * 0.25), d = half / 5;
  fire('mousedown', x0, y); pump(); frames.push(snapshot());
  for (let i = 1; i <= 5; i++) { fire('mousemove', x0 + Math.round(i * d), y); for (let k = 0; k < 4; k++) { pump(); frames.push(snapshot()); } }
  for (let h = 0; h < 118; h++) { pump(); frames.push(snapshot()); } // 1+1+20+118+20+60 = 220 recorded frames exactly
  for (let j = 4; j >= 0; j--) { fire('mousemove', x0 + Math.round(j * d), y); for (let k = 0; k < 4; k++) { pump(); frames.push(snapshot()); } }
  fire('mouseup', x0, y);
  for (let r = 0; r < 60; r++) { pump(); frames.push(snapshot()); }
  if (process.env.T130_TRACE && sandbox.__ca2trace) fs.writeFileSync('/tmp/t130-trace-' + label + '.json', JSON.stringify(sandbox.__ca2trace));
  meta.totalPumps = pumpCount; meta.meanDtMs = +((V.clock - clockStart) / pumpCount).toFixed(3); meta.births = births; meta.deaths = deaths;
  return { label, engine: path.basename(enginePath), simOn: (ca2.simOn === undefined ? 'unavail' : ca2.simOn), initCheck: { n: cs0.length, mism }, meta, frames };
}

function trajOf(run) { const T = {}; run.frames.forEach((f, fi) => f.cells.forEach(c => { (T[c[0]] = T[c[0]] || {})[fi] = [c[1], c[2]]; })); return T; }
function rowAt(run, ti, fi) { const f = run.frames[fi]; if (!f) return null; const n = +ti; for (const c of f.cells) if (c[0] === n) return c; return null; }
function metrics(run) {
  const T = trajOf(run); let osc = 0, oscCells = 0, steps = 0, maxStep = 0, totPath = 0;
  Object.keys(T).forEach(ti => { const F = T[ti], ks = Object.keys(F).map(Number).sort((a, b) => a - b); let fl = 0, ps = 0, path = 0;
    for (let i = 1; i < ks.length; i++) { const a = F[ks[i - 1]], b = F[ks[i]]; if (ks[i] !== ks[i - 1] + 1) continue; const dx = b[0] - a[0], dy = b[1] - a[1], s = Math.hypot(dx, dy); path += s; steps++; if (s > maxStep) maxStep = s;
      const sx = Math.abs(dx) > 1 ? Math.sign(dx) : 0, sy = Math.abs(dy) > 1 ? Math.sign(dy) : 0;
      if (sx && ps && ((ps & 3) === 1 && sx !== (ps & 1 ? 1 : -1) * 1)) fl++; // simple: count any sign change
      if (sx && (ps & 4) && sx !== ((ps >> 2) & 1 ? 1 : -1)) fl++;
      ps = (sx ? (sx > 0 ? 5 : 4) : 0); }
    if (fl) { osc += fl; oscCells++; } totPath += path; });
  const cont0 = run.frames[0].cont; let maxSame = 0; const hist = {};
  run.frames.forEach(f => { const seen = {}; f.cells.forEach(c => { const off = Math.round((c[1] - f.cont[0]) * 10) / 10; if (off < 3) { seen[off] = (seen[off] || 0) + 1; if (seen[off] > maxSame) maxSame = seen[off]; } }); });
  // lifetime + contact + radius-band normalization (main 25 Oct): per-frame rows carry [ti,x,y,vx,vy,r,envV,near]
  const flipState = {}; let aliveFrames = 0, contactFrames = 0, flipsContact = 0; const band = { 'r<=96': [0, 0], '96<r<=200': [0, 0], 'r>200': [0, 0] }; const lifetimes = [];
  Object.keys(T).forEach(ti => { const F = T[ti], ks = Object.keys(F).map(Number).sort((a, b) => a - b); lifetimes.push(ks.length);
    for (let i = 1; i < ks.length; i++) { if (ks[i] !== ks[i - 1] + 1) continue; const row = rowAt(run, ti, ks[i]); if (!row) continue; aliveFrames++; const r = row[5], near = row[7];
      const b = r <= 96 ? 'r<=96' : (r <= 200 ? '96<r<=200' : 'r>200'); band[b][1]++;
      const a2 = T[ti][ks[i - 1]], b2 = T[ti][ks[i]]; const dx = b2[0] - a2[0], dy = b2[1] - a2[1];
      const sx = Math.abs(dx) > 1 ? Math.sign(dx) : 0, sy = Math.abs(dy) > 1 ? Math.sign(dy) : 0;
      const fs = flipState[ti] = flipState[ti] || { x: 0, y: 0 };
      const flipped = (sx && fs.x && sx !== fs.x) || (sy && fs.y && sy !== fs.y);
      if (sx) fs.x = sx; if (sy) fs.y = sy;
      if (flipped) { if (near) flipsContact++; band[b][0]++; }
      if (near) contactFrames++; } });
  return { cellsTracked: Object.keys(T).length, oscFlips: osc, oscCells, meanPath: steps ? +(totPath / Object.keys(T).length).toFixed(2) : 0, maxStep: +maxStep.toFixed(2), maxSameCoord: maxSame,
    aliveFrames, contactFrames, pathPerAliveFrame: aliveFrames ? +(totPath / aliveFrames).toFixed(3) : 0,
    oscPerContactFrame: contactFrames ? +(flipsContact / contactFrames).toFixed(4) : null,
    oscByBand: Object.fromEntries(Object.entries(band).map(([k, v]) => [k, { flips: v[0], frames: v[1], rate: v[1] ? +(v[0] / v[1]).toFixed(4) : null }])),
    lifetimes: lifetimes.length ? { min: Math.min.apply(null, lifetimes), med: lifetimes.sort((a, b) => a - b)[lifetimes.length >> 1], max: Math.max.apply(null, lifetimes) } : null };
}

(async () => {
  const A = await runEngine(engineA, 'A'), B = await runEngine(engineB, 'B');
  const det = engineA === engineB ? (JSON.stringify(A.frames) === JSON.stringify(B.frames)) : null;
  console.log(JSON.stringify({ N, SEED, FPS, determinismSelfCheck: det, A: { label: A.label, engine: A.engine, simOn: A.simOn, initCheck: A.initCheck, meta: A.meta, metrics: metrics(A) }, B: { label: B.label, engine: B.engine, simOn: B.simOn, initCheck: B.initCheck, meta: B.meta, metrics: metrics(B) } }, null, 1));
  fs.writeFileSync('/tmp/t130-' + A.label + '.frames.json', JSON.stringify(A.frames));
  fs.writeFileSync('/tmp/t130-' + B.label + '.frames.json', JSON.stringify(B.frames));
})().catch(e => { console.error('FATAL', e && e.stack || e); process.exit(1); });
