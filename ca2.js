// CA2 - browser port of rr2ll2ia3target11.pde (sim, HUD, axis lines) with a redesigned config panel.
(function () {
  'use strict';
  var cv = document.getElementById('c'), cvg = document.getElementById('g');
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, DPR = 1;
  // line layer: axis and boundary lines live on their own canvas at the exact device resolution (the plate canvas can run at a
  // different pixel ratio and would resample them). One effective width in whole device pixels feeds every line, CSS and canvas.
  var lnc = document.createElement('canvas'); lnc.id = 'ln'; document.body.appendChild(lnc); var lctx = lnc.getContext('2d'), DD = 1;
  function LW() { return P.axisWidth > 0 ? Math.max(1, Math.round(P.axisWidth * DD)) / DD : 0; }
  function snapC(c, S) { S = S || DD; var wd = Math.round(LW() * S), h = (wd % 2) / 2; return (Math.round(c * S - h) + h) / S; }
  function applyLW() { document.documentElement.style.setProperty('--lw', LW() + 'px'); }
  var rnd = function (a, b) { if (b === undefined) { b = a; a = 0; } return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var map = function (v, a, b, c, d) { return c + (d - c) * (v - a) / (b - a); };
  function rand2D() { var a = Math.random() * 6.283185307; return { x: Math.cos(a), y: Math.sin(a) }; }

  // ---- parameters (names follow the pde) ----
  var P = {
    UNIVERSE_SIZE: 75, baseMutationRate: 5, mutationRateRange: 2, interactionRadius: 20, CELL_RADIUS: 10,
    GENE_MIN: -18, GENE_MAX: 18, minRadius: 5, maxRadius: 75, baseMaxSpeed: 10, maxSpeedVariation: 15,
    energyConsumptionRate: 0.058, energyGainFromInteraction: 0.004, minEnergyForReproduction: 0.22,
    THRESHOLD: 0.2, metaballStrength: 0.02, foodDensity: 0.025, foodEnergyValue: 5,
    minRefreshInterval: 10, maxRefreshInterval: 20, slowDownRadius: 20, speedReductionFactor: 50.3,
    grain: 1, grainAmount: 1, grainStrength: 4.8, grainSize: 1.2, grainSoft: 0.5, grainChroma: 0.5, grainDev: 0.4, grainFine: 0.25, grainCrystal: 0.4, grainCloud: 0.45, grainFps: 24, fps: 60, containerCorner: 18,
    resolution: 1, margin: 28, gap: 14, textScale: 1, areaMin: 0.3, areaMax: 1,
    colorSpeed: 0.5, morphEase: 0.5, pixelRatio: 0, autoQuality: 1, showHud: 1, showAxis: 1, showFood: 0, axisLayer: 0, genomeOn: 1, genomeMut: 0.12, divideOn: 1, divideAt: 2.2, eatMergeOn: 1, eatRatio: 1.3, eatChance: 0.15, mergeChance: 0.03, mergeGene: 8, symbiosisOn: 1, symbiogenesisOn: 1, clusterCohesion: 0.35, clusterMax: 8, parasiteOn: 1, parasiteFrac: 0.06, parasiteDrain: 0.02, parasiteEff: 0.8, selectOn: 1, selStrength: 1, foodGrow: 1, foodGrowAmt: 0.6, foodGrowMax: 3, foodShrink: 0.01, cellMorph: 1, respawnMorph: 1, cellMorphMs: 1200, boundAware: 1, boundGap: 0, boundZone: 70, boundForce: 0.8, centerGap: 18, diagLen: 0.9, axisWidth: 1, panelAlpha: 1, panelWidth: 340, blurWidth: 340, blurStrength: 16, cursorSens: 0.75, cursorSize: 1, cursorLockMs: 900, titleCircles: 1, circleHold: 1, titleLead: 1.3, titleTrack: 1,
    audioOn: 1, audioVol: 0.15, audioMode: 0, audioTone: 1600, audioMod: 0.6, audioCrackle: 0.5, audioWidth: 0.5, audioMicro: 0, audioMicroPitch: 1200, audioMicroDecay: 70, audioMicroRand: 0.5, foodColor: '#c86400', foodAlpha: 1, foodSize: 1, foodShow: 1
  };
  // owner's chosen defaults (23:04)
  P.audioFadeMs = 5000;
  P.cfgFont = 0; P.cfgFontSize = 13; P.cfgCase = 0; P.lineColor = '#111111'; P.autoInvert = 1; P.axisColor = ''; P.circColor = ''; P.ruleColor = ''; P.dragMargin = 8; P.edgeGrab = 10; P.restless = 0.8; P.edgeFit = 1; P.boundZoneR = 1.5; P.blobOutline = 1; P.plateOverlap = 0.25; P.parasiteHard = 12; P.parasiteSight = 4000; P.parasiteNerv = 0.6; P.parasiteHardMs = 20000;
  P.foodMode = 2; P.foodBlobR = 70; P.foodBlobDots = 8; P.foodLife = 1; P.foodLifeMs = 300; P.foodLifeCell = 4; P.foodEatR = 0.4;
  Object.assign(P, {"UNIVERSE_SIZE": 55.95868745026389, "baseMutationRate": 9.628232288701716, "mutationRateRange": 2.6268439511457253, "interactionRadius": 12.016352372548786, "CELL_RADIUS": 34.57106164334512, "GENE_MIN": -18, "GENE_MAX": 18, "minRadius": 50, "maxRadius": 150, "baseMaxSpeed": 2, "maxSpeedVariation": 30, "energyConsumptionRate": 0.058, "energyGainFromInteraction": 0.004, "minEnergyForReproduction": 2.5, "THRESHOLD": 0.19, "metaballStrength": 0.024, "foodDensity": 0.023801395385356694, "foodEnergyValue": 20, "minRefreshInterval": 2, "maxRefreshInterval": 9, "slowDownRadius": 9, "speedReductionFactor": 37.5, "grain": 1, "grainAmount": 1.22, "grainStrength": 9.2, "grainSize": 0.3, "grainSoft": 0.82, "grainChroma": 1, "grainDev": 0.23, "grainFine": 0.25, "grainCrystal": 0.4, "grainCloud": 0.45, "grainFps": 12, "fps": 12, "containerCorner": 29, "resolution": 1, "margin": 10, "gap": 26, "textScale": 0.8, "areaMin": 0.1, "areaMax": 1, "colorSpeed": 0.74, "morphEase": 0.7, "pixelRatio": 2, "autoQuality": 1, "showHud": 1, "showAxis": 1, "showFood": 1, "axisLayer": 0, "genomeOn": 1, "genomeMut": 0.5, "divideOn": 1, "divideAt": 6, "eatMergeOn": 1, "eatRatio": 3, "eatChance": 1, "mergeChance": 0.03, "mergeGene": 8, "clusterCohesion": 0.19, "clusterMax": 10, "parasiteOn": 1, "parasiteFrac": 0.32, "parasiteDrain": 0.02, "parasiteEff": 1, "selectOn": 1, "selStrength": 4, "foodGrow": 1, "foodGrowAmt": 5, "foodGrowMax": 8, "foodShrink": 0.1, "cellMorph": 1, "respawnMorph": 1, "cellMorphMs": 2350, "boundAware": 1, "boundZone": 20, "boundForce": 3, "centerGap": 120, "diagLen": 0.83, "axisWidth": 2.3, "panelAlpha": 0, "panelWidth": 340, "blurWidth": 340, "cursorSens": 0.75, "cursorSize": 0.31, "cursorLockMs": 3000, "titleCircles": 1, "circleHold": 1, "audioOn": 1, "audioVol": 0.53, "audioMode": 1, "audioTone": 2120, "audioMod": 1, "audioCrackle": 1, "audioWidth": 1, "audioMicro": 3, "audioMicroPitch": 380, "audioMicroDecay": 400, "audioMicroRand": 1, "foodColor": "#000000", "foodAlpha": 1, "foodSize": 3.5, "foodShow": 0.51, "audioFadeMs": 5000, "dragMargin": 24, "edgeGrab": 20, "restless": 3, "edgeFit": 0.3, "boundZoneR": 0.1, "blobOutline": 1, "plateOverlap": 0.5, "parasiteHard": 39.5, "parasiteSight": 4000, "parasiteNerv": 1, "parasiteHardMs": 20000, "foodMode": 3, "foodBlobR": 70, "foodBlobDots": 8, "foodLife": 1, "foodLifeMs": 300, "foodLifeCell": 4, "foodEatR": 0.26});
  // eating radius is a fixed px distance, independent of cell radius (owner 20 Oct: no factor); migrate the stored factor with the preset radius
  P.foodEatR = Math.round(P.foodEatR * P.CELL_RADIUS * 100) / 100;
  P.focusIdleMs = 4000; P.focusInMs = 4000; P.focusOutMs = 380; P.focusDepth = 14; // idle depth-of-field blur: wait, slow blur-in, swift refocus, depth px
  P.cellShapes = 1; // heritable body plans: round / string / lobed (render expands a cell into metaball sources)
  var DEFAULTS = JSON.parse(JSON.stringify(P));
  var TYPE_SIZE_MAX = 4; // general font size ceiling (owner 21 Oct): the knob range and the layout clamp below share this one value
  var autoRefresh = true, lockParams = false;
  var BGS = [[233,233,233],[22,22,22],[255,0,0],[0,255,0],[0,0,255]];
  // title-circle hover colors: the palette's own black (22,22,22 - not pitch black) and white, plus its R G B (owner 21 Oct)
  var CIRCLE_COLS = [[22,22,22],[255,255,255],[255,0,0],[0,255,0],[0,0,255]];
  var bgIndex = 0, bg = [255,255,255], bgTarget = [233,233,233];
  
  var ready = false, parasites = [], clusterSeq = 0, env = { spd: 1, app: 0.5, bnd: 1, col: null }, cmean = {};
  var cells = [], food = [], ev = { birth: 0, death: 0, hit: 0, oob: 0 }, maxOut = 0;
  var cont = { x: 0, y: 0, w: 0, h: 0, tw: 0, th: 0, ew: 0, eh: 0, rawW: 0, rawH: 0 };
  var mouse = { x: 0, y: 0, over: false };
  var hovering = false, hoverCol = [255,255,255];
  var refreshInterval = 10, lastRefresh = performance.now();
  var keyHeld = '';
  var eased = { total: [0,0,0,1], title: [0,0,0,1], coor: [0,0,0,1], axis: [0,0,0,1], r: [255,0,0,1], g: [0,255,0,1], b: [0,0,255,1] };
  var fps = 0;

  // ---- cells ----
  function Cell(x, y, gene, mr) {
    this.x = x; this.y = y; var v = rand2D(); this.popD = UI_END + Math.random() * (CELL_END - UI_END);
    this.sv = rnd(-1, 1); this.maxSpeed = Math.max(0, P.baseMaxSpeed + this.sv * P.maxSpeedVariation);
    this.vx = v.x * this.maxSpeed; this.vy = v.y * this.maxSpeed;
    this.gene = gene; this.alive = true; this.radius = P.CELL_RADIUS; this.energy = 12; this.mutationRate = mr;
    this.hostility = Math.random(); this.speedModifier = rnd(0.7, 2.3);
    var k0 = gene > 2 ? 0 : gene < -2 ? 1 : 2, cv = [0.12, 0.12, 0.12]; cv[k0] = 0.76;
    this.g = { spd: 1 + rnd(-0.3, 0.3), app: rnd(0.05, 0.95), bnd: 1 + rnd(-0.4, 0.4), col: normCol([cv[0] + rnd(0, 0.1), cv[1] + rnd(0, 0.1), cv[2] + rnd(0, 0.1)]) };
    this.cl = 0; this.maxSpeed = this.maxSpeed * (P.genomeOn ? this.g.spd : 1); this.shp = newShape(null);
  }
  function normCol(v) { var s = v[0] + v[1] + v[2] || 1; return [v[0] / s, v[1] / s, v[2] / s]; }
  function speedOf(c) { return Math.max(0, P.baseMaxSpeed + c.sv * P.maxSpeedVariation) * (P.genomeOn ? c.g.spd : 1); }
  function mutGenome(g, a) {
    return { spd: clamp(g.spd * (1 + rnd(-a, a)), 0.5, 1.6), app: clamp(g.app + rnd(-a, a), 0, 1), bnd: clamp(g.bnd * (1 + rnd(-a, a)), 0.5, 2),
      col: normCol([Math.max(0.001, g.col[0] + rnd(-a, a) * 0.5), Math.max(0.001, g.col[1] + rnd(-a, a) * 0.5), Math.max(0.001, g.col[2] + rnd(-a, a) * 0.5)]) };
  }
  function mixGenome(a, b) { return { spd: (a.spd + b.spd) / 2, app: (a.app + b.app) / 2, bnd: (a.bnd + b.bnd) / 2, col: normCol([(a.col[0] + b.col[0]) / 2, (a.col[1] + b.col[1]) / 2, (a.col[2] + b.col[2]) / 2]) }; }
  // ---- body plans: round (0), string (1, a chain of discs along the heading), lobed (2, main disc + orbiting satellites).
  // Heritable, mutates with genomeMut; only the renderer sees the plan (a cell becomes several metaball sources).
  function newShape(par) {
    if (!par) {
      var u = Math.random();
      if (u < 0.35) return { t: 0, asp: 1, th: 1, wig: 0, wsp: 1, sat: 0, ph: rnd(6.2832), ph2: rnd(6.2832), dir: rnd(6.2832) };
      if (u < 0.8) return { t: 1, asp: rnd(1.3, 6), th: rnd(0.3, 1.0), wig: rnd(0.15, 1.1), wsp: rnd(0.5, 1.8), sat: 0, ph: rnd(6.2832), ph2: rnd(6.2832), dir: rnd(6.2832) };
      return { t: 2, asp: 1, th: 1, wig: 0, wsp: rnd(0.3, 1.4), sat: 2 + (Math.random() < 0.4 ? 1 : 0), ph: rnd(6.2832), ph2: rnd(6.2832), dir: rnd(6.2832) };
    }
    var a = P.genomeMut, s = { t: par.t, asp: par.asp, th: par.th, wig: par.wig, wsp: par.wsp, sat: par.sat, ph: rnd(6.2832), ph2: rnd(6.2832), dir: par.dir };
    if (Math.random() < a * 0.4) s.t = Math.floor(rnd(3)); // a rare body-plan jump
    s.asp = clamp(s.asp * (1 + rnd(-a, a)), 1.15, 7); s.th = clamp(s.th * (1 + rnd(-a, a) * 0.6), 0.25, 1.1);
    s.wig = clamp(s.wig + rnd(-a, a) * 0.8, 0, 1.4); s.wsp = clamp(s.wsp * (1 + rnd(-a, a) * 0.5), 0.2, 2.5);
    if (s.t === 0) { s.asp = 1; s.th = 1; s.wig = 0; }
    if (s.t === 1 && s.asp < 1.25) s.asp = 1.3;
    if (s.t === 2 && !s.sat) s.sat = 2 + (Math.random() < 0.4 ? 1 : 0);
    return s;
  }
  function mixShape(a2, b2) {
    if (!a2) return b2 ? newShape(b2) : newShape(null); if (!b2) return newShape(a2);
    var s = newShape(a2); s.t = Math.random() < 0.5 ? a2.t : b2.t;
    s.asp = (a2.asp + b2.asp) / 2; s.th = (a2.th + b2.th) / 2; s.wig = (a2.wig + b2.wig) / 2; s.wsp = (a2.wsp + b2.wsp) / 2; s.sat = Math.max(a2.sat || 0, b2.sat || 0);
    if (s.t === 1 && s.asp < 1.25) s.asp = 1.3;
    if (s.t === 2 && !s.sat) s.sat = 2;
    return s;
  }
  // fitness against the current environment (0 = perfectly adapted, 1 = far off). A refresh draws a new environment.
  function misfit(c) {
    var e = env, g = c.g, m = (Math.abs(g.spd - e.spd) / 1.1 + Math.abs(g.app - e.app) + Math.abs(g.bnd - e.bnd) / 1.5) / 3;
    if (e.col) { var cd = (Math.abs(g.col[0] - e.col[0]) + Math.abs(g.col[1] - e.col[1]) + Math.abs(g.col[2] - e.col[2])) / 2; m = (m * 3 + cd * 1.5) / 4.5; }
    return Math.min(1, m);
  }
  function newEnv() { env = { spd: rnd(0.7, 1.35), app: rnd(0.2, 0.9), bnd: rnd(0.7, 1.6), col: normCol([rnd(0.05, 1), rnd(0.05, 1), rnd(0.05, 1)]) }; }
  function limit(c, m) { var s = Math.hypot(c.vx, c.vy); if (s > m && s > 0) { c.vx *= m / s; c.vy *= m / s; } }
  function mutateGene(g) {
    var r = Math.random(), a;
    if (r < 0.26) a = Math.random() < 0.5 ? -1 : 1; else if (r < 0.9) a = Math.random() < 0.5 ? -2 : 2; else a = Math.random() < 0.5 ? -3 : 3;
    return clamp(g + a, P.GENE_MIN, P.GENE_MAX);
  }
  function organic(c) {
    var n = 0, left = null, right = null, R = P.interactionRadius;
    for (var i = 0; i < cells.length; i++) {
      var o = cells[i]; if (o === c || !o.alive) continue;
      var dx = o.x - c.x, dy = o.y - c.y;
      if (dx * dx + dy * dy < R * R) {
        n++;
        if (o.x < c.x && (!left || o.x > left.x)) left = o;
        if (o.x > c.x && (!right || o.x < right.x)) right = o;
      }
    }
    var life = c.alive ? ((n < 2 || n > 3) ? -0.005 : 1.0025) : (n === 3 ? 1.005 : -0.0025);
    var brain = n === 2 ? 0.008 : 0;
    var r90 = ((left ? 1 : 0) ^ (right ? 1 : 0)) ? 0.0025 : 0;
    var d = rand2D(), t = life + brain + r90 + rnd(-0.1, 0.1);
    c.vx += d.x * t; c.vy += d.y * t;
    var q = rand2D(); c.vx = lerp(c.vx, q.x * c.maxSpeed, 0.04); c.vy = lerp(c.vy, q.y * c.maxSpeed, 0.04);
    limit(c, c.maxSpeed * (resizeDrag ? 1 + P.restless * 1.5 : 1));
  }
  function update(c) {
    if (!c.alive) return;
    var dm = Math.hypot(c.x - mouse.x, c.y - mouse.y), sm = dm < P.slowDownRadius ? P.speedReductionFactor : 1;
    var r = rand2D(); c.vx += r.x * 0.2 * sm; c.vy += r.y * 0.2 * sm;
    limit(c, c.maxSpeed * sm * c.speedModifier * (resizeDrag ? 1 + P.restless * 1.5 : 1));
    organic(c);
    c.x += c.vx; c.y += c.vy;
    if (c.shp && c.shp.t === 1) { // a string turns into its drift and swims with a side-to-side wave
      var sh2 = c.shp; sh2.svx = (sh2.svx || 0) * 0.94 + c.vx * 0.06; sh2.svy = (sh2.svy || 0) * 0.94 + c.vy * 0.06;
      var spv = Math.hypot(sh2.svx, sh2.svy);
      if (spv > 0.15) { var wa = Math.atan2(sh2.svy, sh2.svx), daa = wa - sh2.dir; while (daa > 3.1416) daa -= 6.2832; while (daa < -3.1416) daa += 6.2832; sh2.dir += daa * 0.12; }
      var swk = Math.sin(performance.now() / 700 * (1 + sh2.wsp) + sh2.ph) * sh2.wig * 0.05 * (c.maxSpeed * 0.4 + 0.4);
      c.vx += -Math.sin(sh2.dir) * swk; c.vy += Math.cos(sh2.dir) * swk;
      var vv = Math.hypot(c.vx, c.vy); if (vv > 0.05) { c.vx = lerp(c.vx, Math.cos(sh2.dir) * vv, 0.04); c.vy = lerp(c.vy, Math.sin(sh2.dir) * vv, 0.04); } // it swims where it points
    }
    var cm = c.cl && P.eatMergeOn ? cmean[c.cl] : null;
    c.energy -= P.energyConsumptionRate * (cm ? 0.85 : 1);
    if (P.selectOn && P.genomeOn) { var mf = misfit(c); c.energy -= P.selStrength * mf * 0.05; if (Math.random() < P.selStrength * 0.005 * Math.pow(mf, 1.5)) c.alive = false; }
    if (c.energy <= 0) c.alive = false;
    if (cm) {
      var ch = P.clusterCohesion; c.vx = lerp(c.vx, cm.vx, ch); c.vy = lerp(c.vy, cm.vy, ch);
      c.vx += (cm.x - c.x) * 0.01 * ch; c.vy += (cm.y - c.y) * 0.01 * ch; c.energy += (cm.e - c.energy) * 0.05;
    }
    // symbiosis: a bonded pair shares its motion and keeps its distance; the bond feeds both a little and ends
    // when a partner dies, when they drift too far apart, or on a whim
    if (P.symbiosisOn) {
      var sp = c.sym;
      if (sp && (!sp.alive || sp.sym !== c || Math.random() < 0.0002)) { if (sp.alive && sp.sym === c) sp.sym = null; c.sym = null; }
      else if (sp) {
        var sdx = sp.x - c.x, sdy = sp.y - c.y, sdd = Math.hypot(sdx, sdy) || 1, sw = (c.radius + sp.radius) * 1.4;
        if (sdd > sw * 3) { sp.sym = null; c.sym = null; }
        else {
          var coh2 = P.clusterCohesion * 0.25;
          c.vx = lerp(c.vx, sp.vx, coh2); c.vy = lerp(c.vy, sp.vy, coh2);
          c.vx += sdx / sdd * (sdd - sw) * 0.004; c.vy += sdy / sdd * (sdd - sw) * 0.004;
          c.energy += 0.00075;
        }
      }
    } else if (c.sym) c.sym = null;
    var reach = P.genomeOn ? c.radius * (2 + 6 * c.g.app) : 0, bestD = 1e9, bx = 0, by = 0;
    for (var i = food.length - 1; i >= 0; i--) {
      var fd = Math.hypot(c.x - food[i].x, c.y - food[i].y);
      if (fd >= P.foodEatR && fd < reach && fd < bestD) { bestD = fd; bx = food[i].x; by = food[i].y; }
      if (fd < P.foodEatR) { c.energy += P.foodEnergyValue; food[i].gone = 1; food.splice(i, 1); ev.ate = (ev.ate || 0) + 1; if (P.foodGrow) c.radius = Math.min(c.radius + P.foodGrowAmt, P.CELL_RADIUS * P.foodGrowMax); }
    }
    if (reach && bestD < 1e9) { c.vx += (bx - c.x) / bestD * 0.5 * c.g.app * (c.maxSpeed * 0.1 + 0.2); c.vy += (by - c.y) / bestD * 0.5 * c.g.app * (c.maxSpeed * 0.1 + 0.2); }
    if (P.divideOn && P.foodGrow && c.radius >= P.CELL_RADIUS * P.divideAt && cells.length < Math.max(60, P.UNIVERSE_SIZE * 4) && c.energy > 1) divide(c);
    if (P.foodGrow && c.radius > P.CELL_RADIUS) c.radius = Math.max(P.CELL_RADIUS, c.radius - P.foodShrink);
    if (P.boundAware) keepIn(c);
    else if (c.x < cont.x || c.x > cont.x + cont.w || c.y < cont.y || c.y > cont.y + cont.h) { c.alive = false; ev.oob++; }
  }
  // boundary awareness: a soft push inside the zone turns cells before the wall; the wall itself reflects (flat world, no death at the edge)
  function keepIn(c) {
    // the wall acts on the cell's edge, not its centre: the radius inset is automatic. The zone is the boundary distance knob only, independent of cell radius (owner 20 Oct)
    var gap = Math.max(0, P.boundGap || 0), rFit = Math.max(8, Math.min(cont.w, cont.h) / 2 - gap), r = Math.min(c.radius, rFit);
    var z = Math.max(0, Math.min(P.boundZone * (P.genomeOn ? c.g.bnd : 1), cont.w / 2.5, cont.h / 2.5)), F = P.boundForce, ms = c.maxSpeed + 1;
    var x0 = cont.x + r + gap, x1 = cont.x + cont.w - r - gap, y0 = cont.y + r + gap, y1 = cont.y + cont.h - r - gap, d, t;
    d = c.x - x0; if (d < z) { t = clamp(1 - d / z, 0, 1); c.vx += F * t * t * ms * 0.25; if (c.vx < 0) c.vx *= 1 - 0.25 * t; }
    d = x1 - c.x; if (d < z) { t = clamp(1 - d / z, 0, 1); c.vx -= F * t * t * ms * 0.25; if (c.vx > 0) c.vx *= 1 - 0.25 * t; }
    d = c.y - y0; if (d < z) { t = clamp(1 - d / z, 0, 1); c.vy += F * t * t * ms * 0.25; if (c.vy < 0) c.vy *= 1 - 0.25 * t; }
    d = y1 - c.y; if (d < z) { t = clamp(1 - d / z, 0, 1); c.vy -= F * t * t * ms * 0.25; if (c.vy > 0) c.vy *= 1 - 0.25 * t; }
    // a wall that moved past a cell pulls it back gradually (no teleport); a plain wall hit reflects
    var ex;
    if (c.x < x0) { ex = x0 - c.x; if (ex > 40) { c.x = Math.min(x1, c.x + ex * 0.3); c.vx = Math.abs(c.vx); } else { c.x = Math.min(x1, x0 + ex); c.vx = Math.abs(c.vx) * 0.7; } }
    else if (c.x > x1) { ex = c.x - x1; if (ex > 40) { c.x = Math.max(x0, c.x - ex * 0.3); c.vx = -Math.abs(c.vx); } else { c.x = Math.max(x0, x1 - ex); c.vx = -Math.abs(c.vx) * 0.7; } }
    if (c.y < y0) { ex = y0 - c.y; if (ex > 40) { c.y = Math.min(y1, c.y + ex * 0.3); c.vy = Math.abs(c.vy); } else { c.y = Math.min(y1, y0 + ex); c.vy = Math.abs(c.vy) * 0.7; } }
    else if (c.y > y1) { ex = c.y - y1; if (ex > 40) { c.y = Math.max(y0, c.y - ex * 0.3); c.vy = -Math.abs(c.vy); } else { c.y = Math.max(y0, y1 - ex); c.vy = -Math.abs(c.vy) * 0.7; } }
  }
  function divide(c) {
    var ang = Math.random() * 6.2832, nr = Math.max(P.CELL_RADIUS, c.radius * 0.62);
    c.radius = nr; c.energy /= 2;
    var ch = new Cell(c.x + Math.cos(ang) * nr, c.y + Math.sin(ang) * nr, rnd(100) < c.mutationRate ? mutateGene(c.gene) : c.gene, c.mutationRate);
    ch.radius = nr; ch.energy = c.energy; ch.g = mutGenome(c.g, P.genomeMut); ch.shp = newShape(c.shp); ch.maxSpeed = speedOf(ch); ch.cl = c.cl; ev.birth++; ev.divide = (ev.divide || 0) + 1; cells.push(ch);
  }
  function clusterSize(id) { var n = 0; for (var i = 0; i < cells.length; i++) if (cells[i].cl === id) n++; return n; }
  function joinCluster(a, b) {
    if (a.cl && b.cl) { if (a.cl === b.cl) return; var from = b.cl, to = a.cl; if (clusterSize(to) + clusterSize(from) > P.clusterMax) return; cells.forEach(function (c) { if (c.cl === from) c.cl = to; }); }
    else if (a.cl) { if (clusterSize(a.cl) >= P.clusterMax) return; b.cl = a.cl; } else if (b.cl) { if (clusterSize(b.cl) >= P.clusterMax) return; a.cl = b.cl; }
    else { a.cl = b.cl = ++clusterSeq; }
    ev.merge = (ev.merge || 0) + 1;
  }
  // symbiogenesis: two compatible cells in deep contact fuse into one composite organism - heavier, slower, mixed genome
  function fuseCells(a, b) {
    var big = a.radius >= b.radius ? a : b, sm = big === a ? b : a;
    big.radius = Math.min(Math.sqrt(big.radius * big.radius + sm.radius * sm.radius) * 0.92, P.CELL_RADIUS * P.foodGrowMax * 1.2);
    big.energy = (big.energy + sm.energy) * 0.85;
    big.gene = clamp(Math.round((big.gene + sm.gene) / 2), P.GENE_MIN, P.GENE_MAX);
    big.g = mixGenome(big.g, sm.g); big.shp = mixShape(big.shp, sm.shp);
    big.comp = (big.comp || 1) + (sm.comp || 1);
    big.speedModifier = clamp(big.speedModifier / 1.25, 0.2, 3);
    if (big.sym && big.sym !== sm) big.sym.sym = null;
    if (sm.sym && sm.sym !== big) sm.sym.sym = null;
    big.sym = null; sm.sym = null; sm.alive = false;
    ev.fuse = (ev.fuse || 0) + 1;
  }
  function interact(a, b) {
    if (a === b || !a.alive || !b.alive) return;
    var dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
    if (dist >= P.interactionRadius) return;
    if (P.eatMergeOn && dist < (a.radius + b.radius) * 0.85) {
      var big = a.radius >= b.radius ? a : b, sm = big === a ? b : a, ratio = big.radius / Math.max(0.01, sm.radius);
      if (ratio >= P.eatRatio) {
        if (Math.random() < P.eatChance && (!big.cl || big.cl !== sm.cl)) {
          big.radius = Math.min(Math.sqrt(big.radius * big.radius + 0.5 * sm.radius * sm.radius), P.CELL_RADIUS * P.foodGrowMax * 1.2);
          big.energy += sm.energy * 0.6 + 1; sm.alive = false; ev.eaten = (ev.eaten || 0) + 1; return;
        }
      } else if (Math.abs(a.gene - b.gene) <= P.mergeGene && Math.random() < P.mergeChance) joinCluster(a, b);
    }
    if (P.symbiogenesisOn && dist < (a.radius + b.radius) * 0.6 && Math.abs(a.gene - b.gene) <= P.mergeGene && Math.random() < P.mergeChance * 0.3) { fuseCells(a, b); return; }
    if (P.symbiosisOn && !a.sym && !b.sym && dist < (a.radius + b.radius) * 1.1 && Math.random() < P.mergeChance * 0.5) { a.sym = b; b.sym = a; ev.pair = (ev.pair || 0) + 1; }
    var infl = map(dist, 0, P.interactionRadius, 1, 0);
    var gc = Math.trunc(infl * (b.gene - a.gene) * 0.1);
    var et = P.energyGainFromInteraction * infl * (1 - Math.abs(a.gene - b.gene) / (P.GENE_MAX - P.GENE_MIN));
    a.energy += et; b.energy -= et;
    a.gene = clamp(a.gene + gc, P.GENE_MIN, P.GENE_MAX); b.gene = clamp(b.gene - gc, P.GENE_MIN, P.GENE_MAX);
    if (a.hostility > 0.5) {
      var l = dist || 1; a.vx += (-dx / l) * 0.05 * a.hostility; a.vy += (-dy / l) * 0.05 * a.hostility;
    }
    if (dist < a.radius + b.radius) ev.hit++;
    if (dist < a.radius + b.radius && a.energy > P.minEnergyForReproduction && b.energy > P.minEnergyForReproduction) reproduce(a, b);
    var nl = dist || 1, nx = dx / nl, ny = dy / nl, sep = (a.radius + b.radius - dist) * 0.5;
    a.x -= nx * sep; a.y -= ny * sep; b.x += nx * sep; b.y += ny * sep;
    var ad = a.vx * nx + a.vy * ny, bd = b.vx * nx + b.vy * ny;
    a.vx = lerp(a.vx, a.vx - nx * 2 * ad, 0.8); a.vy = lerp(a.vy, a.vy - ny * 2 * ad, 0.8);
    b.vx = lerp(b.vx, b.vx - nx * 2 * bd, 0.8); b.vy = lerp(b.vy, b.vy - ny * 2 * bd, 0.8);
    var r1 = rand2D(), r2 = rand2D();
    a.vx += r1.x * 0.3; a.vy += r1.y * 0.3; b.vx += r2.x * 0.3; b.vy += r2.y * 0.3;
  }
  function reproduce(a, b) {
    if (cells.length < P.UNIVERSE_SIZE * 4 && a.hostility < 0.6 && b.hostility < 0.6) {
      var cost = P.minEnergyForReproduction / 2 + 1; a.energy -= cost; b.energy -= cost;
      var ng = Math.trunc((a.gene + b.gene) / 2);
      if (rnd(100) < a.mutationRate) ng = mutateGene(ng);
      var nm = clamp(a.mutationRate + rnd(-P.mutationRateRange, P.mutationRateRange), 0.5, 20);
      var r = rand2D();
      ev.birth++; var kid = new Cell((a.x + b.x) / 2 + r.x * a.radius, (a.y + b.y) / 2 + r.y * a.radius, ng, nm); kid.g = mutGenome(mixGenome(a.g, b.g), P.genomeMut); kid.shp = mixShape(a.shp, b.shp); kid.maxSpeed = speedOf(kid); cells.push(kid);
    }
  }
  function checkSurvival(c) {
    if (c.gene <= P.GENE_MIN || c.gene >= P.GENE_MAX) c.alive = false;
    var n = 0, R = P.interactionRadius;
    for (var i = 0; i < cells.length; i++) { var o = cells[i]; if (o !== c && o.alive && Math.hypot(c.x - o.x, c.y - o.y) < R) n++; }
    if (c.energy < n * 0.5) c.alive = false;
  }

  // ---- simulation control ----
  var VS = 1; // container scale: pde targets are for a 1280x800 window
  // title font metrics, cached per font size: the two words' ink widths and the font's letter spacing (tracking) -
  // the average inter-letter whitespace of the title words, measured from advance widths and ink boxes, never hardcoded
  // (owner 21 Oct: the three-line title's line gap equals the letter spacing)
  var tmCache = { fs: 0, trk: 0, inkTL: 0, inkTR: 0 };
  function titleMetrics(fs) {
    if (tmCache.fs === fs) return tmCache;
    var w1 = ctx.measureText(TL).width, i1 = inkLR(TL), w2 = ctx.measureText(TR).width, i2 = inkLR(TR);
    tmCache = { fs: fs, inkTL: i1[1] - i1[0], inkTR: i2[1] - i2[0],
      trk: ((w1 - (i1[1] - i1[0])) / (TL.length - 1) + (w2 - (i2[1] - i2[0])) / (TR.length - 1)) / 2 };
    return tmCache;
  }
  var rsbCache = { key: '', dx: 0, done: false };
  function rsbKey(fs, M, ex) { return fs.toFixed(2) + '|' + M + '|' + ex.toFixed(2) + '|' + (bg ? bg.map(Math.round).join(',') : ''); }
  // isolated pixel measure of the rendered title word on an offscreen canvas: same font, size, scale and letter
  // spacing, but no simulation ink - scanning the live canvas caught wandering cells and food dots as "title ink",
  // which shifted the word past the right margin and off the frame and made the margin look dead (owner 21 Oct)
  var rsbCv = null;
  function drawSpaced(c, txt, x0, y, ex) { for (var ci = 0; ci < txt.length; ci++) c.fillText(txt[ci], x0 + c.measureText(txt.slice(0, ci)).width + ci * ex, y); }
  // the last glyph's dot ink reaches past the metrics' bounding box: measured once per platform at 100px, scaled
  // linearly - the fit cap counts this overshoot so the visible dots (not just the metrics) stay inside the margins
  var ovsCache = -1;
  function titleOvershoot() {
    if (ovsCache >= 0) return ovsCache;
    if (!rsbCv) rsbCv = document.createElement('canvas');
    var fs = 100, c2 = rsbCv.getContext('2d', { willReadFrequently: true });
    var w = 8 * fs; rsbCv.width = w; rsbCv.height = 2 * fs;
    c2.setTransform(1, 0, 0, 1, 0, 0);
    c2.fillStyle = '#fff'; c2.fillRect(0, 0, w, 2 * fs);
    c2.font = fs + 'px "Ca2-Thin", monospace'; c2.textBaseline = 'alphabetic'; c2.textAlign = 'left'; c2.fillStyle = '#000';
    var pre = TR.length > 1 ? c2.measureText(TR.slice(0, -1)).width : 0, l = c2.measureText(TR[TR.length - 1]);
    var metric = pre + l.actualBoundingBoxRight;
    drawSpaced(c2, TR, 0, 1.5 * fs, 0);
    var img = c2.getImageData(0, 0, w, 2 * fs).data, lastX = 0;
    for (var x = w - 1; x >= 0; x--) { var hit = false; for (var y = 0; y < 2 * fs; y++) { var i = (y * w + x) * 4; if (img[i] < 160) { hit = true; break; } } if (hit) { lastX = x; break; } }
    ovsCache = Math.max(0, lastX + 1 - metric) / fs; // right overshoot per em, never negative
    return ovsCache;
  }
  function rsbScan(fs, dh, M, ex) {
    if (rsbCache.done) return;
    if (!rsbCv) rsbCv = document.createElement('canvas');
    var sx = DPR, wCss = M + 7 * fs, hCss = M + dh + 4, wPx = Math.max(1, Math.ceil(wCss * sx));
    rsbCv.width = wPx; rsbCv.height = Math.max(1, Math.ceil(hCss * sx));
    var c2 = rsbCv.getContext('2d', { willReadFrequently: true });
    c2.setTransform(sx, 0, 0, sx, 0, 0);
    var lite = (bg[0] * 299 + bg[1] * 587 + bg[2] * 114) / 1000 > 127;
    c2.fillStyle = css(bg, 1); c2.fillRect(0, 0, wCss, hCss);
    c2.font = fs + 'px "Ca2-Thin", monospace'; c2.textBaseline = 'alphabetic'; c2.textAlign = 'left';
    c2.fillStyle = lite ? '#000' : '#fff';
    var lr = [0, 0];
    if (TR.length) { var f = c2.measureText(TR[0]), pre = TR.length > 1 ? c2.measureText(TR.slice(0, -1)).width : 0, l = c2.measureText(TR[TR.length - 1]); lr = [f.actualBoundingBoxLeft, pre + l.actualBoundingBoxRight]; }
    var x0 = (wCss - M) - lr[1] - (TR.length - 1) * ex; // same right-anchor as the live draw
    drawSpaced(c2, TR, x0, M + dh, ex);
    var img; try { img = c2.getImageData(0, 0, wPx, rsbCv.height).data; } catch (e) { rsbCache.done = true; return; }
    var bgr = bg[0], bgg = bg[1], bgb = bg[2];
    for (var x = wPx - 1; x >= 0; x--) {
      for (var y = 0; y < rsbCv.height; y++) {
        var i = (y * wPx + x) * 4;
        if (Math.abs(img[i] - bgr) + Math.abs(img[i + 1] - bgg) + Math.abs(img[i + 2] - bgb) > 96) {
          rsbCache.dx = Math.max(-0.1 * fs, Math.min(0.25 * fs, (wPx - 1 - x) / sx - M)); // a padded bbox can hide the whole rsb
          rsbCache.done = true; return;
        }
      }
    }
    rsbCache.done = true;
  }
  function lay() {
    // all typography metrics derive from one font size; margin is equal on every edge
    // type size runs 0.5..2 in the config, but the effective ceiling is the fit: the widest word of the title
    // must always fit the page width inside the margins, so a manual entry can never push ink off the frame (owner 21 Oct)
    var fs = 210 * Math.min(W / 2560, H / 1600) * Math.min(P.textScale, TYPE_SIZE_MAX), dh = 0.666 * fs;
    ctx.font = fs + 'px "Ca2-Thin", monospace';
    var M = P.margin, G = P.gap;
    var tm = titleMetrics(fs), ex = tm.trk * (P.titleTrack - 1), inkTLe = tm.inkTL + (TL.length - 1) * ex, inkTRe = tm.inkTR + (TR.length - 1) * ex, trkE = tm.trk + ex;
    var inkMax = Math.max(inkTLe, inkTRe) + titleOvershoot() * fs, fit = inkMax > 0 ? (W - 2 * M) / inkMax : 1;
    if (fit < 1) {
      fs *= fit; dh = 0.666 * fs; ctx.font = fs + 'px "Ca2-Thin", monospace';
      tm = titleMetrics(fs); ex = tm.trk * (P.titleTrack - 1); inkTLe = tm.inkTL + (TL.length - 1) * ex; inkTRe = tm.inkTR + (TR.length - 1) * ex; trkE = tm.trk + ex; inkMax = Math.max(inkTLe, inkTRe) + ovsCache * fs; fit = inkMax > 0 ? (W - 2 * M) / inkMax : 1; if (fit < 1) { fs *= fit; dh = 0.666 * fs; ctx.font = fs + 'px "Ca2-Thin", monospace'; tm = titleMetrics(fs); ex = tm.trk * (P.titleTrack - 1); inkTLe = tm.inkTL + (TL.length - 1) * ex; inkTRe = tm.inkTR + (TR.length - 1) * ex; trkE = tm.trk + ex; }
    }
    // the title goes three centred lines (word / word / mouse-y) when the two words no longer fit side by side:
    // decided from the measured ink widths and the live margin, not a fixed ratio, so any margin/window works (owner 21 Oct:
    // they must never overlap; the switch is when the gap between them closes to one letter space, the 1.217 point on his screen)
    var wordGap = W - 2 * M - inkTLe - inkTRe;
    var three = wordGap < trkE, lead = three ? dh + trkE * P.titleLead : 0;
    var row = three ? 2 * lead : P.textScale > 1.03 ? dh + 15 * P.titleLead : 0; // above type size 1.03 the mouse-y value drops one row and the vertical axis starts below it
    var lr3 = inkLR('3333'), sideW = lr3[1] - lr3[0]; // widest 4-digit number, ink width
    var halfW = W / 2 - (M + sideW + G), halfH = H / 2 - (M + dh + row + G);
    return { row: row, three: three, lead: lead, fs: fs, dh: dh, M: M, G: G, ex: ex, sideW: sideW, safeW: Math.max(60, halfW * 2), safeH: Math.max(60, halfH * 2) };
  }
  function setTargets() {
    var cWHf = Math.floor(rnd(7, 8));
    var a = Math.floor(rnd(2)) === 0 ? 5120 : 2160, b = Math.floor(rnd(2)) === 0 ? 5120 : 2160;
    var tw = a / (cWHf + Math.trunc(rnd(-3.5, 1))) * VS, th = b / cWHf * VS;
    // ceiling and floor: the area never leaves the band between the typography rows / side numbers
    cont.user = false; cont.rawW = tw; cont.rawH = th; clampTargets();
  }
  function clampTargets() {
    var L = lay(), lo = Math.min(P.areaMin, P.areaMax), hi = Math.max(P.areaMin, P.areaMax);
    var ov = P.plateOverlap, ovW = 2 * (L.G + ov * L.sideW), ovH = 2 * (L.G + ov * L.dh); // the plate may reach over the texts by this share of their size
    if (cont.user) { cont.tw = clamp(cont.rawW, 60, W - P.dragMargin * 2); cont.th = clamp(cont.rawH, 60, H - P.dragMargin * 2); return; } // a size the user pulled by hand: nearly the whole viewport
    cont.tw = clamp(cont.rawW, L.safeW * lo, (L.safeW + ovW) * hi);
    cont.th = clamp(cont.rawH, L.safeH * lo, (L.safeH + ovH) * hi);
  }
  // ---- entrance: every element fades in from transparency at its own random time
  var fadeT0 = performance.now(), fadeK = {};
  // intro: no fades. Every graphic element appears at once, at its own random moment within the first INTRO_MS
  var INTRO_MS = 2000, UI_END = 800, CELL_END = 1300, FOOD_END = 1700;
  var pendingSpawn = null; // first load only: cells and food arrive in small batches after the UI intro, so the opening stays smooth
  var introStat = { frames: 0, jank: 0, worst: 0 };
  function fadeA(key) {
    var d = fadeK[key];
    if (d === undefined) d = fadeK[key] = key.charAt(0) === 'p' ? FOOD_END + Math.random() * (INTRO_MS - FOOD_END) : Math.random() * UI_END; // UI first, parasites last
    return (performance.now() - fadeT0 >= d) ? 1 : 0;
  }
  function introOn(d) { return performance.now() - fadeT0 >= d; }
  var firstSpawn = true; // the first plate after a load uses the configured values; later respawns randomize them
  function randomize(instant, staged) {
    if (!instant && P.cellMorph && ready && cells.length) { startTrans(); return; }
    trans = null; pendingSpawn = null; cells = []; food = []; parasites = []; if (P.selectOn) newEnv();
    if (!lockParams && !firstSpawn) {
      P.UNIVERSE_SIZE = Math.floor(rnd(1, rnd(20, 200)));
      P.baseMutationRate = rnd(2, 8); P.mutationRateRange = rnd(1, 4);
      P.interactionRadius = rnd(10, 30); P.CELL_RADIUS = rnd(P.minRadius, P.maxRadius);
    }
    setTargets();
    if (staged) { // the opening: typography first, the heavy population follows in batches (owner 20 Oct)
      pendingSpawn = { cells: Math.max(1, Math.round(P.UNIVERSE_SIZE)), food: Math.round(cont.tw * cont.th * P.foodDensity / 2), gx: cont.tw ? (W - cont.tw) / 2 : 0, gy: cont.th ? (H - cont.th) / 2 : 0 };
      newRefresh();
      return;
    }
    var gx = cont.tw ? (W - cont.tw) / 2 : 0, gy = cont.th ? (H - cont.th) / 2 : 0;
    for (var i = 0; i < P.UNIVERSE_SIZE; i++) {
      cells.push(new Cell(rnd(cont.tw) + gx, rnd(cont.th) + gy, Math.floor(rnd(P.GENE_MIN, P.GENE_MAX + 1)), P.baseMutationRate + rnd(-P.mutationRateRange, P.mutationRateRange)));
    }
    var nf = cont.tw * cont.th * P.foodDensity / 2;
    for (var j = 0; j < nf; j++) food.push({ x: rnd(cont.tw) + gx, y: rnd(cont.th) + gy, r: Math.random() });
    newRefresh();
  }
  // ---- symbiotic metamorphosis: no tween. A refresh sets a new plate and new target traits; the cells keep living by their own rules
  // (movement, boundary pressure from the moving walls, reproduction, death, mutation) and the population, radius and traits drift to the new composition.
  var trans = null;
  function startTrans() {
    var tg = { U: P.UNIVERSE_SIZE, mut: P.baseMutationRate, mr: P.mutationRateRange, ir: P.interactionRadius, cr: P.CELL_RADIUS };
    if (!lockParams) {
      tg.U = Math.floor(rnd(1, rnd(20, 200))); tg.mut = rnd(2, 8); tg.mr = rnd(1, 4); tg.ir = rnd(10, 30); tg.cr = rnd(P.minRadius, P.maxRadius);
    }
    setTargets();
    // food outside the new plate is lost, the rest stays
    var x0 = (W - cont.tw) / 2, y0 = (H - cont.th) / 2; if (!P.foodLife) food = food.filter(function (f) { return f.x > x0 && f.x < x0 + cont.tw && f.y > y0 && f.y < y0 + cont.th; });
    if (P.selectOn) newEnv();
    trans = { t0: performance.now(), dur: Math.max(100, P.cellMorphMs), tg: tg };
    if (P.respawnMorph) planComposition(tg);
    newRefresh();
  }
  // ---- respawn morph: a new life cycle (new environment, fresh energy, fresh food) with a new random composition.
  // Every cell gets a place in the new composition and flows there at its own pace; surplus cells die on arrival, missing ones are born from the nearest parent.
  function planComposition(tg) {
    var gx = (W - cont.tw) / 2, gy = (H - cont.th) / 2, nC = 2 + Math.floor(Math.random() * 4), ctr = [], i, j2;
    for (i = 0; i < nC; i++) ctr.push([gx + cont.tw * rnd(0.12, 0.88), gy + cont.th * rnd(0.12, 0.88)]);
    var sg = Math.min(cont.tw, cont.th) * rnd(0.08, 0.2), pts = [];
    for (i = 0; i < Math.max(1, tg.U); i++) { // resample instead of hard-clamping: a clamp piles points onto the plate edges, and on a wide plate that is the top/bottom edges -> visible horizontal rows when a crowd chases them
      var cc = ctr[i % nC], px = 0, py = 0, okp = false;
      for (j2 = 0; j2 < 12; j2++) {
        px = cc[0] + (Math.random() + Math.random() + Math.random() - 1.5) * 2 * sg;
        py = cc[1] + (Math.random() + Math.random() + Math.random() - 1.5) * 2 * sg;
        if (px > gx + 8 && px < gx + cont.tw - 8 && py > gy + 8 && py < gy + cont.th - 8) { okp = true; break; }
      }
      if (!okp) { px = clamp(px, gx + 8, gx + cont.tw - 8); py = clamp(py, gy + 8, gy + cont.th - 8); } // pathologically tiny plate: keep the old clamp as a floor
      pts.push([px, py]);
    }
    for (i = 0; i < cells.length; i++) { cells[i].energy = 12; cells[i].cl = 0; cells[i].dst = null; cells[i].dying = false; cells[i].pace = rnd(0.5, 1.5); cells[i].dl = rnd(0, 0.45) * trans.dur; cells[i].durK = rnd(0.55, 1); cells[i].bend = Math.random() < 0.25 ? 0 : rnd(-1, 1); cells[i].sym = null; }
    // greedy matching, cells in random order take the nearest free place
    var free = pts.slice(), order = cells.slice().sort(function () { return Math.random() - 0.5; }), spawnN = 0;
    for (i = 0; i < order.length; i++) {
      var c = order[i];
      if (free.length) { var bi = 0, bd = 1e18; for (j2 = 0; j2 < free.length; j2++) { var d = (free[j2][0] - c.x) * (free[j2][0] - c.x) + (free[j2][1] - c.y) * (free[j2][1] - c.y); if (d < bd) { bd = d; bi = j2; } } c.dst = free.splice(bi, 1)[0]; }
      else { c.dst = pts[Math.floor(Math.random() * pts.length)]; c.dying = true; }
    }
    trans.pending = free; trans.plan = { points: pts.length, dying: order.filter(function (c) { return c.dying; }).length, birthsDue: free.length, from: cells.length };
    // fresh food for the new cycle
    var nf = cont.tw * cont.th * P.foodDensity / 2; if (!P.foodLife) food = [];
    for (var f = 0; !P.foodLife && f < nf; f++) food.push({ x: gx + rnd(cont.tw), y: gy + rnd(cont.th), r: Math.random() });
  }
  function stepComposition(now, dt) {
    var i, open = 0, late = now - trans.t0 > trans.dur * 1.5;
    for (i = 0; i < cells.length; i++) {
      var c = cells[i]; if (!c.dst || !c.alive) continue;
      var dx = c.dst[0] - c.x, dy = c.dst[1] - c.y, d = Math.hypot(dx, dy);
      var el = now - trans.t0 - (c.dl || 0); // every cell waits for its own moment before it takes off
      if (el <= 0) { open++; continue; }
      var win = Math.max(80, trans.dur * (c.durK || 1)), pr = clamp(el / win, 0, 1);
      var kc = 1 - Math.exp(-dt * 3 / win);
      var ease = 0.35 + 0.65 * Math.sin(pr * Math.PI); // its own speed curve: slow takeoff, full flow mid-flight, soft landing
      var k = Math.min(1, kc * c.pace * ease * 1.31);
      c.x += dx * k + (Math.random() - 0.5) * 0.6; c.y += dy * k + (Math.random() - 0.5) * 0.6;
      if (c.bend) { var lat = k * Math.min(d, 200) * c.bend * 0.35 * Math.sin(pr * Math.PI), il = 1 / (d || 1); c.x += -dy * il * lat; c.y += dx * il * lat; } // a bowed path, not a straight chase
      if (c.dying && (d < 14 || (late && Math.random() < 0.08))) { c.alive = false; ev.death++; continue; }
      if (d > 14) open++;
    }
    compSpawns(now, dt);
    return open;
  }
  function compSpawns(now, dt) { // pending composition births: parent search + Cell ctor stay JS (newShape/mutGenome are body-plan)
    var pend = trans.pending, n = cells.length, i;
    if (pend.length && n > 0) {
      var kb = 1 - Math.exp(-dt * 3 / trans.dur), cnt = Math.min(pend.length, 1 + Math.floor(pend.length * kb * 2));
      for (i = 0; i < cnt; i++) {
        var pt = pend.pop(), par = null, bd = 1e18;
        for (var m = 0; m < 12; m++) { var q = cells[Math.floor(Math.random() * n)]; if (!q.alive) continue; var dd = (q.x - pt[0]) * (q.x - pt[0]) + (q.y - pt[1]) * (q.y - pt[1]); if (dd < bd) { bd = dd; par = q; } }
        if (!par) continue;
        var ch = new Cell(par.x + rnd(-2, 2), par.y + rnd(-2, 2), mutateGene(par.gene), clamp(par.mutationRate + rnd(-P.mutationRateRange, P.mutationRateRange), 0.5, 20));
        ch.g = mutGenome(par.g, P.genomeMut); ch.shp = newShape(par.shp); ch.maxSpeed = speedOf(ch); ch.radius = par.radius * 0.5; ch.dst = pt; ch.pace = rnd(0.5, 1.5); ch.dl = 0; ch.durK = rnd(0.5, 1); ch.bend = Math.random() < 0.25 ? 0 : rnd(-1, 1); cells.push(ch); ev.birth++;
      }
    }
  }
  function transPassW(now, dt, plan) { // Rust/wasm transition pass (tr.rs): radius drift + composition chase. Returns open count, or -1 so the JS loops below run (?nowasm=1, ?nosim=1)
    var E = WC.e; if (!E || !E.tr_run || !WC.ok || WC.off || WC.simOff || /[?&]nosim=1/.test(location.search)) return -1;
    try {
      var n = cells.length, i, c, b;
      var cp = E.tr_cells(n), cf = new Float64Array(WC.mem.buffer, cp, n * 13 + 13);
      for (i = 0; i < n; i++) { c = cells[i]; b = i * 13; cf[b] = c.x; cf[b + 1] = c.y; cf[b + 2] = c.radius; cf[b + 3] = c.mutationRate; cf[b + 4] = c.alive ? 1 : 0;
        if (plan && c.dst && c.alive) { cf[b + 5] = c.dst[0]; cf[b + 6] = c.dst[1]; cf[b + 7] = c.dl || 0; cf[b + 8] = c.durK || 1; cf[b + 9] = c.pace; cf[b + 10] = c.bend || 0; cf[b + 11] = c.dying ? 1 : 0; cf[b + 12] = 1; } else cf[b + 12] = 0; }
      var open = E.tr_run(n, now, dt, trans.t0, trans.dur, P.CELL_RADIUS, plan ? 1 : 0, Math.floor(Math.random() * 4294967296), Math.floor(Math.random() * 4294967296));
      if (open < 0) return -1;
      var st = new Float64Array(WC.mem.buffer, E.tr_stat(), 4); ev.death += st[0];
      for (i = 0; i < n; i++) { c = cells[i]; b = i * 13; c.x = cf[b]; c.y = cf[b + 1]; c.radius = cf[b + 2]; c.alive = cf[b + 4] !== 0; }
      WC.fwTr = (WC.fwTr || 0) + 1; return open;
    } catch (e) { WC.fwTrErr = String(e && e.stack || e); return -1; }
  }
  function stepTrans(now, dt) {
    if (P.respawnMorph && trans.plan) {
      var kk = 1 - Math.exp(-dt * 3 / trans.dur), tg2 = trans.tg;
      P.baseMutationRate = lerp(P.baseMutationRate, tg2.mut, kk); P.mutationRateRange = lerp(P.mutationRateRange, tg2.mr, kk);
      P.interactionRadius = lerp(P.interactionRadius, tg2.ir, kk); P.CELL_RADIUS = lerp(P.CELL_RADIUS, tg2.cr, kk); P.UNIVERSE_SIZE = lerp(P.UNIVERSE_SIZE, tg2.U, kk);
      var open = transPassW(now, dt, true);
      if (open < 0) {
        for (var ii = 0; ii < cells.length; ii++) { var cc = cells[ii]; cc.radius += (P.CELL_RADIUS - cc.radius) * Math.min(1, 0.004 * cc.mutationRate); }
        open = stepComposition(now, dt);
      } else compSpawns(now, dt);
      trans.open = open;
      if (now - trans.t0 > trans.dur * 5 || (now - trans.t0 > trans.dur && open === 0 && !trans.pending.length && Math.abs(cont.ew - cont.tw) < 1 && Math.abs(cont.eh - cont.th) < 1)) {
        for (ii = 0; ii < cells.length; ii++) { cells[ii].dst = null; cells[ii].dying = false; cells[ii].dl = 0; cells[ii].bend = 0; }
        P.UNIVERSE_SIZE = tg2.U; P.CELL_RADIUS = tg2.cr; P.baseMutationRate = tg2.mut; P.mutationRateRange = tg2.mr; P.interactionRadius = tg2.ir; trans = null; window.__ca2 && (window.__ca2.lastTransDone = performance.now());
      }
      return;
    }
    var k = 1 - Math.exp(-dt * 3 / trans.dur), tg = trans.tg;
    P.baseMutationRate = lerp(P.baseMutationRate, tg.mut, k); P.mutationRateRange = lerp(P.mutationRateRange, tg.mr, k);
    P.interactionRadius = lerp(P.interactionRadius, tg.ir, k); P.CELL_RADIUS = lerp(P.CELL_RADIUS, tg.cr, k);
    P.UNIVERSE_SIZE = lerp(P.UNIVERSE_SIZE, tg.U, k);
    var target = Math.max(1, Math.round(P.UNIVERSE_SIZE)), n = cells.length, i;
    // population pressure uses the cells' own mechanisms: a parent reproduces with a mutated gene; the weakest of a few is let go
    if (n < target * 0.97 && n > 0 && Math.random() < Math.min(1, (target - n) * 0.1)) {
      var p = cells[Math.floor(Math.random() * n)], ang = Math.random() * 6.2832;
      if (P.selectOn) for (i = 0; i < 2; i++) { var q2 = cells[Math.floor(Math.random() * n)]; if (misfit(q2) < misfit(p)) p = q2; }
      var ch = new Cell(p.x + Math.cos(ang) * p.radius, p.y + Math.sin(ang) * p.radius, mutateGene(p.gene), clamp(p.mutationRate + rnd(-P.mutationRateRange, P.mutationRateRange), 0.5, 20));
      ch.g = mutGenome(p.g, P.genomeMut); ch.shp = newShape(p.shp); ch.maxSpeed = speedOf(ch); ch.radius = p.radius * 0.5; p.energy = Math.max(1, p.energy * 0.85); ch.energy = p.energy; cells.push(ch); ev.birth++;
    } else if (n > target * 1.03 && Math.random() < Math.min(1, (n - target) * 0.1)) {
      var w = null; for (i = 0; i < 3; i++) { var q = cells[Math.floor(Math.random() * n)]; if (!w || (P.selectOn ? misfit(q) - 0.01 * q.energy > misfit(w) - 0.01 * w.energy : q.energy < w.energy)) w = q; }
      if (w) w.alive = false;
    }
    // each cell's radius drifts to the new trait at its own mutation pace
    if (transPassW(now, dt, false) < 0) for (i = 0; i < cells.length; i++) { var c = cells[i]; c.radius += (P.CELL_RADIUS - c.radius) * Math.min(1, 0.004 * c.mutationRate); }
    if (now - trans.t0 > trans.dur * 4 || (now - trans.t0 > trans.dur && Math.abs(n - target) <= Math.max(2, target * 0.05) && Math.abs(cont.ew - cont.tw) < 1 && Math.abs(cont.eh - cont.th) < 1 && Math.abs(P.CELL_RADIUS - tg.cr) < 0.5)) {
      P.UNIVERSE_SIZE = tg.U; P.CELL_RADIUS = tg.cr; P.baseMutationRate = tg.mut; P.mutationRateRange = tg.mr; P.interactionRadius = tg.ir; trans = null;
    }
  }
  function newRefresh() {
    var lo = Math.min(P.minRefreshInterval, P.maxRefreshInterval), hi = Math.max(P.minRefreshInterval, P.maxRefreshInterval);
    refreshInterval = rnd(lo, hi); lastRefresh = performance.now();
  }
  function cycleBg() { bgIndex = (bgIndex + 1) % BGS.length; bgTarget = BGS[bgIndex]; save(); }
  function createCell() { cells.push(new Cell(mouse.x, mouse.y, Math.floor(rnd(P.GENE_MIN, P.GENE_MAX + 1)), P.baseMutationRate + rnd(-P.mutationRateRange, P.mutationRateRange))); }
  function killNear() { for (var i = cells.length - 1; i >= 0; i--) if (Math.hypot(mouse.x - cells[i].x, mouse.y - cells[i].y) < 22) cells.splice(i, 1); }
  function randomizeOne() {
    var k = Math.floor(rnd(5));
    if (k === 0) P.baseMutationRate = rnd(2, 8); else if (k === 1) P.mutationRateRange = rnd(1, 4);
    else if (k === 2) P.CELL_RADIUS = rnd(P.minRadius, P.maxRadius); else if (k === 3) P.baseMaxSpeed = rnd(1, 2); else P.foodDensity = rnd(0.01, 0.05);
  }
  function randomAction() {
    switch (Math.floor(rnd(8))) {
      case 0: createCell(); break;
      case 1: newRefresh(); break;
      case 2: P.interactionRadius = rnd(10, 50); break;
      case 3: randomizeOne(); break;
      case 4: killNear(); break;
      case 5: cycleBg(); break;
      default: randomize();
    }
  }
  var aev = { b: 0, d: 0, h: 0 };
  var curInfo3 = {}, curOn0 = false, curInfo2 = {}, curMaxR = 0, lockCell = null, lockT0 = 0, curX = 0, curY = 0, cursorScale = 1, targetCursorScale = 1, curRRnow = 0, curInfo = {}, circlesNow = [], circleCol = {}, lastCircleHit = '';
  var curEl = document.getElementById('cur'), curDot = curEl.firstElementChild;
  // boundary hover cursor: an open 90-degree angle - two strokes in the plate line's width and colour, a gap where they
  // would meet, each stroke half the logo height, oriented to the hovered edge; corners get the mirrored pair (owner 20 Oct)
  var curEdge = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  curEdge.style.cssText = 'position:fixed;left:0;top:0;display:none;pointer-events:none;z-index:8;overflow:visible;will-change:transform';
  var curEdgePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  curEdgePath.setAttribute('fill', 'none'); curEdgePath.setAttribute('stroke-linecap', 'butt');
  curEdge.appendChild(curEdgePath); document.body.appendChild(curEdge);
  function anglePath(t, L, g, vx, vy) { // vertex at (vx,vy) pointing along angle t; strokes stop `g` short of the vertex
    function pt(deg) { var a = (t + deg) * Math.PI / 180; return [vx + Math.cos(a) * L, vy + Math.sin(a) * L]; }
    function sh(p0) { var dx = vx - p0[0], dy = vy - p0[1], dd = Math.hypot(dx, dy) || 1, k = (dd - g) / dd; return [p0[0] + dx * k, p0[1] + dy * k]; }
    var A = pt(-135), B = pt(135), A2 = sh(A), B2 = sh(B), f = function (n) { return n.toFixed(1); };
    return 'M' + f(A[0]) + ' ' + f(A[1]) + 'L' + f(A2[0]) + ' ' + f(A2[1]) + 'M' + f(B[0]) + ' ' + f(B[1]) + 'L' + f(B2[0]) + ' ' + f(B2[1]);
  }
  var TL = 'CELYLAR', TR = 'AUTOMW';
  // circle centers (font units, 1000/em) per glyph of Ca2-Thin, measured from the font outlines
  var GL = { C: [[166, 500], [166, 167]], E: [[168, 332]], L: [[166, 167]], Y: [[136, 167], [728, 167]], A: [[333, 499]], R: [[166, 500]], U: [[166, 167]], T: [[166, 500], [499, 500]], O: [[146, 500], [146, 167]], M: [[166, 500], [806, 500], [486, 167]], W: [[573, 500], [906, 500], [166, 499], [1313, 499]] };
  var coarseUI = window.matchMedia && matchMedia('(hover: none) and (pointer: coarse)').matches;
  function onClick(e) {
    if (e.target !== cv) return;
    if (coarseUI && (panel.classList.contains('open') || panel.classList.contains('hov'))) { panel.classList.remove('open'); panel.classList.remove('hov'); return; }
    var k = keyHeld;
    if (k === 'b') cycleBg(); else if (k === 'a') createCell(); else if (k === 's') randomize(); else if (k === 'd') killNear(); else if (!k) randomAction();
  }

  // ---- colour helpers ----
  function lerpC(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function lerpA(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)]; }
  function css(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a === undefined ? (c[3] === undefined ? 1 : c[3]) : a) + ')'; }

  // ---- metaballs: splatted per cell (cut off where a cell adds <3% of the threshold), device-resolution buffer ----
  var off = document.createElement('canvas'), octx = off.getContext('2d'), img = null, u32 = null;
  var bufW = 0, bufH = 0, fSum, fR, fG, fB, curS = 1;
  // Rust/wasm core (wasm/ -> ca2core.wasm). Loaded async; any failure leaves WC.ok false and the JS code runs as before. ?nowasm=1 disables.
  var WC = { ok: false, off: false }, MB = { ms: 0, path: '-' };
  if (window.WebAssembly && !/[?&]nowasm=1/.test(location.search)) {
    var simd = false; try { simd = WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11])); } catch (e) {} WC.simd = simd && !/[?&]nosimd=1/.test(location.search);
    fetch((WC.simd ? 'ca2core-simd.wasm' : 'ca2core.wasm') + '?v=1').then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.arrayBuffer(); }).then(function (b) { return WebAssembly.instantiate(b, {}); }).then(function (m) {
      var e = m.instance.exports; WC.mem = e.memory; WC.cells = e.cells_ptr; WC.out = e.out_ptr; WC.fieldX = e.mb_field; WC.field = e.mb_field_f32; WC.fieldF = e.mb_field_f32; if (e.sim_step) WC.e = e; WC.ok = true;
    }).catch(function (e) { WC.err = String(e); });
  }
  // ---- render sources: a round cell is one source; a string is a chain of discs along its heading; a lobed cell is a
  // main disc with small orbiting satellites. Every field path (wasm, WebGL, CPU) consumes this one list, so all draw the
  // same bodies and the wasm interface stays 6 f64 per source. One shared budget (the shader's uniform cap): when the
  // population is dense the strings shorten instead of pushing a path off its budget.
  var frameT = 0;
  var SRC_MAX = 384, SRC = { n: 0, cells: 0, built: -1, x: new Float32Array(512), y: new Float32Array(512), r: new Float32Array(512), wr: new Float32Array(512), wg: new Float32Array(512), wb: new Float32Array(512) };
  function srcGrow(n) { if (n <= SRC.x.length) return; var m = SRC.x.length * 2; while (m < n) m *= 2; ['x', 'y', 'r', 'wr', 'wg', 'wb'].forEach(function (k) { var a2 = new Float32Array(m); a2.set(SRC[k]); SRC[k] = a2; }); }
  function emitCell(c, t0, allowance, o) { // appends the cell's sources (plate-relative) to o = { x, y, r, n }
    var bx = c.x - cont.x, by = c.y - cont.y, sh = c.shp;
    // wall squeeze: the drawn body never crosses the gap line; a cell pressed at the wall compresses a little so the squeeze is felt (owner 21 Oct)
    var gap2 = Math.max(0, P.boundGap || 0), rFree = Math.max(1, Math.min(bx - gap2, cont.w - gap2 - bx, by - gap2, cont.h - gap2 - by));
    var cr = Math.min(c.radius, Math.max(1, rFree)) * (1 - 0.18 * clamp(1 - Math.max(0, rFree - c.radius) / 8, 0, 1));
    if (P.cellShapes && sh && sh.t === 1 && allowance > 1) { // string: silhouette aspect asp, thickness th (short fat stubs are 2-3 discs)
      var rs = cr * sh.th, span = 2 * cr * sh.th * (sh.asp - 1), want = Math.min(9, Math.max(2, Math.round(span / (1.15 * rs)) + 1)), nn = Math.min(want, allowance);
      if (nn >= 2) {
        var ux = Math.cos(sh.dir), uy = Math.sin(sh.dir), px = -uy, py = ux, ds = span / (nn - 1), tq = t0 / 850 * (1 + sh.wsp) + sh.ph;
        for (var k = 0; k < nn; k++) { var d0 = -span / 2 + ds * k, off2 = sh.wig * rs * Math.sin(tq + k * 0.85); o.x.push(bx + ux * d0 + px * off2); o.y.push(by + uy * d0 + py * off2); o.r.push(rs); o.n++; }
        return;
      }
    } else if (P.cellShapes && sh && sh.t === 2 && allowance > 2) { // lobed: amorf even standing alone
      var r0 = cr * 0.78, rot = t0 / 4200 * sh.wsp + sh.ph;
      o.x.push(bx); o.y.push(by); o.r.push(r0); o.n++;
      for (var q2 = 0; q2 < sh.sat; q2++) {
        var aa = rot + q2 * 2.4 + sh.ph2, dd = cr * (0.42 + 0.24 * ((q2 * 0.731 + sh.ph) % 1)), rr2 = cr * (0.3 + 0.22 * ((q2 * 0.377 + sh.ph2) % 1));
        o.x.push(bx + Math.cos(aa) * dd); o.y.push(by + Math.sin(aa) * dd); o.r.push(rr2); o.n++;
      }
      return;
    }
    o.x.push(bx); o.y.push(by); o.r.push(cr); o.n++;
  }
  function buildSourcesW(t0) { // Rust/wasm buildSources+emitCell (bs.rs); returns false so the JS body below runs (?nowasm=1, ?nosim=1)
    var E = WC.e; if (!E || !E.bs_run || !WC.ok || WC.off || WC.simOff || /[?&]nosim=1/.test(location.search)) return false;
    try {
      var n = cells.length, i, c, b;
      var rp = E.bs_alloc(n), rb = new Float64Array(WC.mem.buffer, rp, n * 17 + 17);
      var elapsed = performance.now() - fadeT0;
      for (i = 0; i < n; i++) {
        c = cells[i]; b = i * 17; var sh = c.shp || null;
        rb[b] = c.x; rb[b + 1] = c.y; rb[b + 2] = c.radius; rb[b + 3] = c.popD || 0; rb[b + 4] = c.alive ? 1 : 0;
        rb[b + 5] = sh ? sh.t : 0; rb[b + 6] = sh ? sh.th || 0 : 0; rb[b + 7] = sh ? sh.asp || 0 : 0; rb[b + 8] = sh ? sh.dir || 0 : 0;
        rb[b + 9] = sh ? sh.wsp || 0 : 0; rb[b + 10] = sh ? sh.ph || 0 : 0; rb[b + 11] = sh ? sh.wig || 0 : 0; rb[b + 12] = sh ? sh.sat || 0 : 0; rb[b + 13] = sh ? sh.ph2 || 0 : 0;
        var cwv = (P.genomeOn && c.g) ? c.g.col : c.cw;
        if (cwv) { rb[b + 14] = cwv[0]; rb[b + 15] = cwv[1]; rb[b + 16] = cwv[2]; }
        else if (c.gene > 2) { rb[b + 14] = 1; rb[b + 15] = 0; rb[b + 16] = 0; }
        else if (c.gene < -2) { rb[b + 14] = 0; rb[b + 15] = 1; rb[b + 16] = 0; }
        else { rb[b + 14] = 0; rb[b + 15] = 0; rb[b + 16] = 1; }
      }
      var m = E.bs_run(n, elapsed, t0, cont.x, cont.y, cont.w, cont.h, P.cellShapes ? 1 : 0, SRC_MAX, P.boundGap || 0);
      if (m < 0) return false;
      var st = new Float64Array(WC.mem.buffer, E.bs_stat(), 4), ob = E.bs_out(), c12 = st[2];
      srcGrow(m + 8);
      var obuf = WC.mem.buffer, rows = Math.floor(st[0]);
      SRC.x.set(new Float32Array(obuf, ob + 0 * c12 * 4, rows)); SRC.y.set(new Float32Array(obuf, ob + 1 * c12 * 4, rows)); SRC.r.set(new Float32Array(obuf, ob + 2 * c12 * 4, rows));
      SRC.wr.set(new Float32Array(obuf, ob + 3 * c12 * 4, rows)); SRC.wg.set(new Float32Array(obuf, ob + 4 * c12 * 4, rows)); SRC.wb.set(new Float32Array(obuf, ob + 5 * c12 * 4, rows));
      SRC.n = rows; SRC.cells = st[1]; WC.fwBs = (WC.fwBs || 0) + 1; return true;
    } catch (e) { WC.fwBsErr = String(e && e.stack || e); return false; }
  }
  function buildSources() {
    var t0 = frameT; if (t0 && SRC.built === t0) return SRC;
    SRC.built = t0;
    if (buildSourcesW(t0)) return SRC;
    var i, c, alive = 0;
    for (i = 0; i < cells.length; i++) { c = cells[i]; if (c.alive && introOn(c.popD) && c.x >= cont.x && c.x <= cont.x + cont.w && c.y >= cont.y && c.y <= cont.y + cont.h) alive++; }
    var allowance = alive > 1 ? Math.max(1, Math.floor(SRC_MAX / alive)) : SRC_MAX, n = 0, o = { x: [], y: [], r: [], n: 0 };
    for (i = 0; i < cells.length; i++) {
      c = cells[i];
      if (!c.alive || !introOn(c.popD) || c.x < cont.x || c.x > cont.x + cont.w || c.y < cont.y || c.y > cont.y + cont.h) continue;
      var wr = 0, wg = 0, wb = 0, cwv = (P.genomeOn && c.g) ? c.g.col : c.cw; if (cwv) { wr = cwv[0]; wg = cwv[1]; wb = cwv[2]; } else if (c.gene > 2) wr = 1; else if (c.gene < -2) wg = 1; else wb = 1;
      o.x.length = 0; o.y.length = 0; o.r.length = 0; o.n = 0; emitCell(c, t0, allowance, o);
      srcGrow(n + o.n + 8);
      for (var k = 0; k < o.n; k++) { SRC.x[n] = o.x[k]; SRC.y[n] = o.y[k]; SRC.r[n] = o.r[k]; SRC.wr[n] = wr; SRC.wg[n] = wg; SRC.wb[n] = wb; n++; }
    }
    SRC.n = n; SRC.cells = alive; return SRC;
  }

  // Rust/wasm sim step (ca2core sim.rs): the per-frame cell loop (update, organic, checkSurvival, hover colour, interact, keepIn) runs in wasm on
  // struct-of-arrays state packed from the cells each frame. Returns false (JS loop runs) when wasm/sim is unavailable or disabled (?nowasm=1, ?nosim=1).
  var simStamp = 0, SIMW = { ms: 0, on: false };
  function simSwim(c) { // JS body-plan swim (same as the block inside update(), applied after the wasm step: strings turn to their drift and swim with a wave)
    var sh2 = c.shp; sh2.svx = (sh2.svx || 0) * 0.94 + c.vx * 0.06; sh2.svy = (sh2.svy || 0) * 0.94 + c.vy * 0.06;
    var spv = Math.hypot(sh2.svx, sh2.svy);
    if (spv > 0.15) { var wa = Math.atan2(sh2.svy, sh2.svx), daa = wa - sh2.dir; while (daa > 3.1416) daa -= 6.2832; while (daa < -3.1416) daa += 6.2832; sh2.dir += daa * 0.12; }
    var swk = Math.sin(performance.now() / 700 * (1 + sh2.wsp) + sh2.ph) * sh2.wig * 0.05 * (c.maxSpeed * 0.4 + 0.4);
    c.vx += -Math.sin(sh2.dir) * swk; c.vy += Math.cos(sh2.dir) * swk;
    var vv = Math.hypot(c.vx, c.vy); if (vv > 0.05) { c.vx = lerp(c.vx, Math.cos(sh2.dir) * vv, 0.04); c.vy = lerp(c.vy, Math.sin(sh2.dir) * vv, 0.04); }
  }
  function simW(tmpRef) {
    var E = WC.e; if (E && /[?&]simab=1/.test(location.search) && (SIMW.t = !SIMW.t)) return false; if (!E || !WC.ok || WC.off || WC.simOff || /[?&]nosim=1/.test(location.search)) { SIMW.on = false; return false; }
    try {
      var t0 = performance.now(), n = cells.length, cap = n + 256, nf = food.length, cl = Object.keys(cmean), ncm = cl.length, i, c, b;
      E.sim_cells(cap); E.sim_food(nf + 1); E.sim_cm(ncm + 1);
      var cp = E.sim_cells(cap), fxp = E.sim_food(nf + 1), fyp = E.sim_food_y(), fgp = E.sim_food_gone(), cmp = E.sim_cm(ncm + 1), cip = E.sim_cm_ids(), pp = E.sim_params();
      var buf = WC.mem.buffer, cf = new Float64Array(buf, cp, cap * 24), fx = new Float64Array(buf, fxp, nf + 1), fy = new Float64Array(buf, fyp, nf + 1), cmf = new Float64Array(buf, cmp, (ncm + 1) * 5), cid = new Float64Array(buf, cip, ncm + 1), p = new Float64Array(buf, pp, 80);
      simStamp++;
      for (i = 0; i < n; i++) {
        c = cells[i]; c._i = i; c._f = simStamp;
      }
      for (i = 0; i < n; i++) {
        c = cells[i]; b = i * 24; var g = c.g;
        cf[b] = c.x; cf[b + 1] = c.y; cf[b + 2] = c.vx; cf[b + 3] = c.vy; cf[b + 4] = c.radius; cf[b + 5] = c.energy; cf[b + 6] = c.gene; cf[b + 7] = c.alive ? 1 : 0; cf[b + 8] = c.maxSpeed; cf[b + 9] = c.speedModifier; cf[b + 10] = c.hostility; cf[b + 11] = c.mutationRate; cf[b + 12] = c.sv; cf[b + 13] = c.cl || 0;
        cf[b + 14] = (c.sym && c.sym._f === simStamp) ? c.sym._i : -1; cf[b + 15] = g.spd; cf[b + 16] = g.app; cf[b + 17] = g.bnd; cf[b + 18] = g.col[0]; cf[b + 19] = g.col[1]; cf[b + 20] = g.col[2]; cf[b + 21] = c.comp || 0; cf[b + 22] = 0;
      }
      E.sim_set_n(n); E.sim_set_nf(nf);
      for (i = 0; i < nf; i++) { fx[i] = food[i].x; fy[i] = food[i].y; }
      for (i = 0; i < ncm; i++) { var m = cmean[cl[i]]; cid[i] = +cl[i]; cmf[i * 5] = m.vx; cmf[i * 5 + 1] = m.vy; cmf[i * 5 + 2] = m.x; cmf[i * 5 + 3] = m.y; cmf[i * 5 + 4] = m.e; }
      E.sim_cm_count(ncm);
      var pi = 0; p[0] = P.interactionRadius; p[1] = P.slowDownRadius; p[2] = P.speedReductionFactor; p[3] = P.baseMaxSpeed; p[4] = P.maxSpeedVariation; p[5] = P.energyConsumptionRate; p[6] = P.selectOn ? 1 : 0; p[7] = P.genomeOn ? 1 : 0; p[8] = P.selStrength; p[9] = P.eatMergeOn ? 1 : 0; p[10] = P.clusterCohesion; p[11] = P.symbiosisOn ? 1 : 0; p[12] = P.foodEatR; p[13] = P.foodEnergyValue; p[14] = P.foodGrow ? 1 : 0; p[15] = P.foodGrowAmt; p[16] = P.CELL_RADIUS; p[17] = P.foodGrowMax; p[18] = P.divideOn ? 1 : 0; p[19] = P.divideAt; p[20] = P.UNIVERSE_SIZE; p[21] = P.foodShrink; p[22] = P.boundAware ? 1 : 0; p[23] = P.boundZone; p[24] = P.boundForce; p[25] = P.restless; p[26] = P.eatRatio; p[27] = P.eatChance; p[28] = P.mergeGene; p[29] = P.mergeChance; p[30] = P.symbiogenesisOn ? 1 : 0; p[31] = P.energyGainFromInteraction; p[32] = P.GENE_MIN; p[33] = P.GENE_MAX; p[34] = P.minEnergyForReproduction; p[35] = P.clusterMax; p[36] = P.genomeMut; p[37] = P.mutationRateRange; p[38] = P.metaballStrength;
      p[39] = env.spd; p[40] = env.app; p[41] = env.bnd; p[42] = env.col ? 1 : 0; if (env.col) { p[43] = env.col[0]; p[44] = env.col[1]; p[45] = env.col[2]; }
      p[46] = mouse.x; p[47] = mouse.y; p[48] = mouse.over ? 1 : 0; p[49] = cont.x; p[50] = cont.y; p[51] = cont.w; p[52] = cont.h; p[53] = resizeDrag ? 1 : 0; p[54] = clusterSeq;
      p[57] = P.boundGap || 0; // boundGap slot for sim.rs keep_in (625f4e8 port); 44/45 are env.col
      var tp = performance.now(); E.sim_step(Math.floor(Math.random() * 4294967296), Math.floor(Math.random() * 4294967296));
      var ts = performance.now(); SIMW.pack = (SIMW.pack || 0) * 0.9 + (tp - t0) * 0.1; SIMW.step = (SIMW.step || 0) * 0.9 + (ts - tp) * 0.1;
      var o = new Float64Array(WC.mem.buffer, E.sim_out(), 32), nf2 = o[15];
      var kids = [];
      if (E.sim_cap && E.sim_cap() !== cap) { cap = E.sim_cap(); cp = E.sim_cells_ptr(); } // wasm grew its cell buffer on a birth burst: re-anchor before reading back
      cf = new Float64Array(WC.mem.buffer, cp, cap * 24);
      for (i = 0; i < nf2; i++) {
        b = i * 24; c = i < n ? cells[i] : new Cell(cf[b], cf[b + 1], cf[b + 6], cf[b + 11]);
        if (i >= n) { cells.push(c); c._i = i; c._f = simStamp; }
        c.x = cf[b]; c.y = cf[b + 1]; c.vx = cf[b + 2]; c.vy = cf[b + 3]; c.radius = cf[b + 4]; c.energy = cf[b + 5]; c.gene = cf[b + 6]; c.alive = cf[b + 7] !== 0; c.maxSpeed = cf[b + 8]; c.speedModifier = cf[b + 9]; c.hostility = cf[b + 10]; c.mutationRate = cf[b + 11]; c.sv = cf[b + 12]; c.cl = cf[b + 13];
        var gg = c.g; gg.spd = cf[b + 15]; gg.app = cf[b + 16]; gg.bnd = cf[b + 17]; gg.col = [cf[b + 18], cf[b + 19], cf[b + 20]]; if (cf[b + 21] > 0) c.comp = cf[b + 21];
      }
      for (i = 0; i < nf2; i++) { var sy = cf[i * 24 + 14]; cells[i].sym = sy >= 0 ? cells[sy] : null; }
      var fg = new Float64Array(WC.mem.buffer, fgp, nf + 1);
      var lg = new Float64Array(WC.mem.buffer, E.sim_log(), o[17]); // births / fusions: body plans stay in JS (newShape/mixShape), the wasm core only reports who came from whom
      for (i = 0; i < lg.length; i += 4) { var kd = lg[i + 3], k0 = cells[lg[i]], p0 = cells[lg[i + 1]], p1 = lg[i + 2] >= 0 ? cells[lg[i + 2]] : null; if (kd === 1) k0.shp = newShape(p0.shp); else if (kd === 2) k0.shp = mixShape(p0.shp, p1.shp); else k0.shp = mixShape(k0.shp, p0.shp); }
      for (i = 0; i < cells.length; i++) { c = cells[i]; if (c.alive && c.shp && c.shp.t === 1) simSwim(c); }
      tmpRef.hc = o[16] >= 0 ? cells[o[16]] : null;
      for (i = nf - 1; i >= 0; i--) if (fg[i] !== 0) { food[i].gone = 1; food.splice(i, 1); }
      ev.birth += o[0]; ev.divide = (ev.divide || 0) + o[1]; ev.eaten = (ev.eaten || 0) + o[2]; ev.merge = (ev.merge || 0) + o[3]; ev.fuse = (ev.fuse || 0) + o[4]; ev.pair = (ev.pair || 0) + o[5]; ev.hit += o[6]; ev.oob += o[7]; ev.ate = (ev.ate || 0) + o[8]; clusterSeq = o[10];
      for (i = cells.length - 1; i >= 0; i--) if (!cells[i].alive) { ev.death++; cells.splice(i, 1); }
      hovering = o[11] !== 0; tmpRef.v = [o[12], o[13], o[14]];
      SIMW.ms = SIMW.ms * 0.9 + (performance.now() - t0) * 0.1; SIMW.on = true; return true;
    } catch (e) { WC.simOff = true; WC.simErr = String(e); SIMW.on = false; return false; }
  }
  function drawMetaballsCPU(S) {
    var bw = Math.max(1, Math.ceil(cont.w * S)), bh = Math.max(1, Math.ceil(cont.h * S));
    if (bw !== bufW || bh !== bufH) {
      bufW = bw; bufH = bh; off.width = bw; off.height = bh; img = octx.createImageData(bw, bh); u32 = new Uint32Array(img.data.buffer);
      fSum = new Float32Array(bw * bh); fR = new Float32Array(bw * bh); fG = new Float32Array(bw * bh); fB = new Float32Array(bw * bh);
    } else { fSum.fill(0); fR.fill(0); fG.fill(0); fB.fill(0); }
    var ms = P.metaballStrength, TH = P.THRESHOLD, inv = 1 / S;
    var src = buildSources(), sn = src.n;
    if (WC.ok && !WC.off) { // Rust/wasm path (ca2core): same field + pixel pass, JS below stays as the fallback
      try {
        var nw = sn, cp = WC.cells(nw), cf = new Float64Array(WC.mem.buffer, cp, nw * 6);
        for (var i = 0; i < nw; i++) { var o6 = i * 6; cf[o6] = src.x[i]; cf[o6 + 1] = src.y[i]; cf[o6 + 2] = src.r[i]; cf[o6 + 3] = src.wr[i]; cf[o6 + 4] = src.wg[i]; cf[o6 + 5] = src.wb[i]; }
        WC.field(nw, bw, bh, S, ms, TH, bg[0] | 0, bg[1] | 0, bg[2] | 0); pfm('mb:field');
        img.data.set(new Uint8ClampedArray(WC.mem.buffer, WC.out(), bw * bh * 4)); pfm('mb:pixel loop');
        octx.putImageData(img, 0, 0); pfm('mb:putImageData');
        ctx.imageSmoothingEnabled = false; ctx.drawImage(off, 0, 0, bw, bh, cont.x, cont.y, cont.w, cont.h); ctx.globalAlpha = 1; pfm('mb:drawImage');
        return;
      } catch (e) { WC.off = true; WC.err = String(e); }
    }
    for (var i = 0; i < sn; i++) {
      var cx = src.x[i], cy = src.y[i], crd = src.r[i], r2 = ms * crd * crd;
      var Rc = crd * Math.max(3, Math.sqrt(ms / (TH * 0.03)));
      var x0 = Math.max(0, Math.floor((cx - Rc) * S)), x1 = Math.min(bw - 1, Math.ceil((cx + Rc) * S));
      var y0 = Math.max(0, Math.floor((cy - Rc) * S)), y1 = Math.min(bh - 1, Math.ceil((cy + Rc) * S));
      var wr = src.wr[i], wg = src.wg[i], wb = src.wb[i];
      for (var y = y0; y <= y1; y++) {
        var dy = (y + 0.5) * inv - cy, row = y * bw;
        for (var x = x0; x <= x1; x++) {
          var dx = (x + 0.5) * inv - cx, inf = r2 / (dx * dx + dy * dy + 0.0001);
          var i2 = inf * inf; fSum[row + x] += inf; if (wr) fR[row + x] += i2 * wr; if (wg) fG[row + x] += i2 * wg; if (wb) fB[row + x] += i2 * wb;
        }
      }
    }
    var br = bg[0] | 0, bgc = bg[1] | 0, bb = bg[2] | 0, ns = 0, band = TH * 0.08, p = 0, n = bw * bh;
    var data = img.data; pfm('mb:field');
    for (p = 0; p < n; p++) {
      var s = fSum[p], q = p << 2;
      if (s > TH * 0.96) {
        var r = fR[p], g = fG[p], b = fB[p], t = r + g + b; if (t > 0) { r /= t; g /= t; b /= t; }
        var nv = ns ? ((p * 2654435761 >>> 0) % 1000 / 500 - 1) * ns : 0, a = Math.min(1, (s - TH * 0.96) / band);
        data[q] = clamp(r * 255 + nv, 0, 255); data[q + 1] = clamp(g * 255 + nv, 0, 255); data[q + 2] = clamp(b * 255 + nv, 0, 255); data[q + 3] = a * 255;
      } else { data[q] = br; data[q + 1] = bgc; data[q + 2] = bb; data[q + 3] = 0; }
    }
    pfm('mb:pixel loop'); octx.putImageData(img, 0, 0); pfm('mb:putImageData');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, bw, bh, cont.x, cont.y, cont.w, cont.h); ctx.globalAlpha = 1; pfm('mb:drawImage'); // exact fit to the area rectangle
  }

  // ---- GPU metaball field (WebGL fragment shader): same formula as the CPU splat, evaluated per pixel on the GPU.
  // The CPU path above stays as the fallback (no WebGL, too many cells, or ?cpu=1). colorAt() evaluates the same field analytically at one point (no GPU readback).
  var GMAX = 384, gl = null, glc = null, gProg = null, gU = {}, gOK = false, gSnap = null, gOn = false;
  (function initGL() {
    if (/[?&]cpu=1/.test(location.search)) return;
    try {
      glc = document.createElement('canvas'); glc.width = glc.height = 1;
      gl = glc.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
      if (!gl) return;
      var dbg = gl.getExtension('WEBGL_debug_renderer_info'), rn = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
      if (/swiftshader|llvmpipe|software|softpipe/i.test(rn) && !/[?&]gpu=1/.test(location.search)) { gl = null; return; } // a software GL is slower than the CPU splat
      var vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
      var fsrc = 'precision highp float;\n#define GMAX ' + GMAX + '\nuniform vec4 uC[GMAX]; uniform vec4 uW[GMAX]; uniform int uN; uniform float uS; uniform float uH; uniform float uTH; uniform float uBand;\n' +
        'void main(){ float px = gl_FragCoord.x / uS, py = (uH - gl_FragCoord.y) / uS; float s = 0.; vec3 w = vec3(0.);\n' +
        ' for (int i = 0; i < GMAX; i++) { if (i >= uN) break; vec4 c = uC[i]; float dx = px - c.x, dy = py - c.y; if (abs(dx) > c.w || abs(dy) > c.w) continue;\n' +
        '  float inf = c.z / (dx*dx + dy*dy + 0.0001); s += inf; w += uW[i].xyz * (inf*inf); }\n' +
        ' float lim = uTH * 0.96; if (s > lim) { float t = w.x + w.y + w.z; vec3 col = t > 0. ? w / t : vec3(0.); float a = min(1., (s - lim) / uBand); gl_FragColor = vec4(col * a, a); } else gl_FragColor = vec4(0.); }';
      function sh(t, src) { var o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
      gProg = gl.createProgram(); gl.attachShader(gProg, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(gProg, sh(gl.FRAGMENT_SHADER, fsrc)); gl.linkProgram(gProg);
      if (!gl.getProgramParameter(gProg, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(gProg));
      gl.useProgram(gProg);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(gProg, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['uC', 'uW', 'uN', 'uS', 'uH', 'uTH', 'uBand'].forEach(function (n) { gU[n] = gl.getUniformLocation(gProg, n); });
      gOK = true;
    } catch (e) { gOK = false; gl = null; if (window.console) console.warn('ca2: WebGL field off, CPU path', e && e.message); }
  })();
  var gT0 = 0, gN = 0, gC = new Float32Array(GMAX * 4), gW = new Float32Array(GMAX * 4);
  function drawMetaballs(S) {
    gOn = false;
    if (gOK && !gl.isContextLost()) {
      var ms = P.metaballStrength, TH = P.THRESHOLD, n = 0, src = buildSources(), i;
      for (i = 0; i < src.n; i++) {
        if (n >= GMAX) { n = -1; break; }
        gC[n * 4] = src.x[i]; gC[n * 4 + 1] = src.y[i]; gC[n * 4 + 2] = ms * src.r[i] * src.r[i]; gC[n * 4 + 3] = src.r[i] * Math.max(3, Math.sqrt(ms / (TH * 0.03)));
        gW[n * 4] = src.wr[i]; gW[n * 4 + 1] = src.wg[i]; gW[n * 4 + 2] = src.wb[i]; n++;
      }
      if (n >= 0) {
        var bw = Math.max(1, Math.ceil(cont.w * S)), bh = Math.max(1, Math.ceil(cont.h * S));
        if (glc.width !== bw || glc.height !== bh) { glc.width = bw; glc.height = bh; }
        gl.viewport(0, 0, bw, bh); gl.useProgram(gProg);
        gl.uniform4fv(gU.uC, gC); gl.uniform4fv(gU.uW, gW); gl.uniform1i(gU.uN, n); gl.uniform1f(gU.uS, S); gl.uniform1f(gU.uH, bh); gl.uniform1f(gU.uTH, TH); gl.uniform1f(gU.uBand, TH * 0.08);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        pfm('gpu:draw+field'); gT0 = performance.now();
        ctx.imageSmoothingEnabled = false; ctx.drawImage(glc, 0, 0, bw, bh, cont.x, cont.y, cont.w, cont.h); ctx.globalAlpha = 1; pfm('gpu:drawImage'); if (++gN > 40 && PF['gpu:drawImage'] + PF['gpu:draw+field'] > 90 && !/[?&]gpu=1/.test(location.search)) gOK = false; // too slow on this machine: back to the CPU path
        gSnap = { n: n, S: S, bw: bw, bh: bh, TH: TH }; gOn = true; return;
      }
    }
    drawMetaballsCPU(S);
  }
  function colorAtGPU(x, y) {
    var S = gSnap.S, bx = Math.min(gSnap.bw - 1, Math.floor((x - cont.x) * S)), by = Math.min(gSnap.bh - 1, Math.floor((y - cont.y) * S));
    var px = (bx + 0.5) / S, py = (by + 0.5) / S, s = 0, r = 0, g = 0, b = 0, TH = gSnap.TH;
    for (var i = 0; i < gSnap.n; i++) {
      var dx = px - gC[i * 4], dy = py - gC[i * 4 + 1], R = gC[i * 4 + 3]; if (Math.abs(dx) > R || Math.abs(dy) > R) continue;
      var inf = gC[i * 4 + 2] / (dx * dx + dy * dy + 0.0001), i2 = inf * inf; s += inf; r += i2 * gW[i * 4]; g += i2 * gW[i * 4 + 1]; b += i2 * gW[i * 4 + 2];
    }
    if (s > TH * 0.96) { var t = r + g + b; if (t > 0) { r /= t; g /= t; b /= t; } var al = Math.min(1, (s - TH * 0.96) / (TH * 0.08)); return [bg[0] + (r * 255 - bg[0]) * al, bg[1] + (g * 255 - bg[1]) * al, bg[2] + (b * 255 - bg[2]) * al]; }
    return [bg[0], bg[1], bg[2]];
  }
  function colorAt(x, y) {
    if (gOn && gSnap && x >= cont.x && x < cont.x + cont.w && y >= cont.y && y < cont.y + cont.h) return colorAtGPU(x, y);
    if (img && x >= cont.x && x < cont.x + cont.w && y >= cont.y && y < cont.y + cont.h) {
      var bx = Math.min(bufW - 1, Math.floor((x - cont.x) * curS)), by = Math.min(bufH - 1, Math.floor((y - cont.y) * curS)), q = (by * bufW + bx) * 4;
      var al = img.data[q + 3] / 255;
      return [bg[0] + (img.data[q] - bg[0]) * al, bg[1] + (img.data[q + 1] - bg[1]) * al, bg[2] + (img.data[q + 2] - bg[2]) * al];
    }
    return [bg[0], bg[1], bg[2]];
  }
  function invAt(x, y) { var c = colorAt(x, y); return [255 - c[0], 255 - c[1], 255 - c[2]]; }
  function invArea(x, y) {
    var s = [0, 0, 0], n = 0;
    for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { var c = colorAt(x + i, y + j); s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; n++; }
    return [255 - s[0] / n, 255 - s[1] / n, 255 - s[2] / n];
  }

  // ink bounds of a string in the current font: [ink left from origin, ink right from origin].
  // Margins are measured from real ink, so the font's side bearings (lsb/rsb) cannot skew them.
  function inkLR(s) {
    if (!s || !s.length) return [0, 0];
    var f = ctx.measureText(s[0]), pre = s.length > 1 ? ctx.measureText(s.slice(0, -1)).width : 0, l = ctx.measureText(s[s.length - 1]);
    return [f.actualBoundingBoxLeft, pre + l.actualBoundingBoxRight];
  }

  // ---- axis lines: width, center gap and diagonal length are parameters ----
  function drawAxis(L, sT, sX) {
    var M = L.M, G = L.G, fs = L.fs, dh = L.dh, cxm = W / 2, cym = H / 2;
    ctx.font = fs + 'px "Ca2-Thin", monospace';
    ctx.textAlign = 'left'; var lrT = inkLR(sT), lrX = inkLR(sX);
    var hL = M + (lrT[1] - lrT[0]) + G, hR = (W - M) - (lrX[1] - lrX[0]) - G, vTop = M + dh + L.row + G, vBot = H - M - dh - G, g = P.centerGap;
    var X = P.axisLayer === 0 ? ctx : lctx, S = P.axisLayer === 0 ? DPR : DD; // axis behind the cells lives on the plate canvas (cells cover it); on top it uses the exact-resolution layer
    X.strokeStyle = P.axisColor || css(eased.axis, 1); X.lineWidth = LW(); X.lineCap = 'butt';
    var segs = [];
    if (g > 0) { segs.push([hL, cym, cxm - g, cym], [cxm + g, cym, hR, cym], [cxm, vTop, cxm, cym - g], [cxm, cym + g, cxm, vBot]); }
    else segs.push([hL, cym, hR, cym], [cxm, vTop, cxm, vBot]);
    [[0, H], [W, H]].forEach(function (cn) {
      var ex = lerp(cxm, cn[0], P.diagLen), ey = lerp(cym, cn[1], P.diagLen), dx = ex - cxm, dy = ey - cym, len = Math.hypot(dx, dy);
      if (len > g) segs.push([cxm + dx / len * g, cym + dy / len * g, ex, ey]);
    });
    for (var si = 0; si < segs.length; si++) if (P.axisWidth > 0 && fadeA('ax' + si)) { var sg = segs[si].slice(); if (sg[0] === sg[2] || sg[1] === sg[3]) for (var q = 0; q < 4; q++) sg[q] = snapC(sg[q], S); X.beginPath(); X.moveTo(sg[0], sg[1]); X.lineTo(sg[2], sg[3]); X.stroke(); }
    axisInfo = { hL: hL, hR: hR, vTop: vTop, vBot: vBot };
  }
  var axisInfo = {};

  // ---- parasites: attach to a cluster/cell, drain its energy, balance themselves (no host = starvation, drained host = death) ----
  // ---- food life: the dots follow the plate like cells do, and live a Conway life (B3/S23) on a lattice anchored to the plate
  var foodT = 0, foodStat = { born: 0, died: 0, steps: 0, inflow: 0 };
  function stepFoodW() { // Rust/wasm mode-1 food step (fd1.rs); returns false when unavailable so the JS body below runs (?nowasm=1, ?nosim=1)
    var E = WC.e; if (!E || !E.fd1_tick || !WC.ok || WC.off || WC.simOff || /[?&]nosim=1/.test(location.search)) return false;
    try {
      var n = food.length, i, f, b, x0 = cont.x, x1 = cont.x + cont.w, y0 = cont.y, y1 = cont.y + cont.h;
      var now = performance.now(), due = now - foodT >= P.foodLifeMs, needsFlow = false;
      if (!due) { for (i = 0; i < n; i++) { f = food[i]; if (f.x < x0 || f.x > x1 || f.y < y0 || f.y > y1) { needsFlow = true; break; } } if (!needsFlow) return true; } // nothing to do: no marshal at all
      var ip = E.fd1_in(n), buf = new Float64Array(WC.mem.buffer, ip, n * 3 + 3);
      for (i = 0; i < n; i++) { f = food[i]; b = i * 3; buf[b] = f.x; buf[b + 1] = f.y; buf[b + 2] = f.r; }
      foodStat.inflow += E.fd1_flow(n, x0, y0, x1, y1);
      if (!due) { for (i = 0; i < n; i++) { f = food[i]; b = i * 3; f.x = buf[b]; f.y = buf[b + 1]; } WC.fwFd = (WC.fwFd || 0) + 1; return true; }
      foodT = now;
      var m = E.fd1_tick(n, Math.max(1, P.foodLifeCell), x0, y0, x1, y1, cont.w, cont.h, P.foodDensity, Math.floor(Math.random() * 4294967296), Math.floor(Math.random() * 4294967296));
      if (m < 0) return false;
      var o = new Float64Array(WC.mem.buffer, E.fd1_out(), m * 3), st = new Float64Array(WC.mem.buffer, E.fd1_stat(), 4);
      foodStat.died += st[0]; foodStat.born += st[1]; foodStat.steps++;
      var out = new Array(m);
      for (i = 0; i < m; i++) { b = i * 3; out[i] = { x: o[b], y: o[b + 1], r: o[b + 2] }; }
      food = out; WC.fwFd = (WC.fwFd || 0) + 1; return true;
    } catch (e) { WC.fwFdErr = String(e && e.stack || e); return false; }
  }
  function stepFood() {
    if (stepFoodW()) return;
    var i, f, x0 = cont.x, x1 = cont.x + cont.w, y0 = cont.y, y1 = cont.y + cont.h;
    // dots outside the (moving) plate flow in, the way cells are pulled back; they are never left outside
    for (i = 0; i < food.length; i++) {
      f = food[i];
      if (f.x < x0 || f.x > x1 || f.y < y0 || f.y > y1) { var tx = clamp(f.x, x0 + 1, x1 - 1), ty = clamp(f.y, y0 + 1, y1 - 1); f.x += (tx - f.x) * 0.25; f.y += (ty - f.y) * 0.25; foodStat.inflow++; }
    }
    // keep the dot population near the density target: seeds appear when it runs low
    var now = performance.now(); if (now - foodT < P.foodLifeMs) return; foodT = now;
    var gs = Math.max(1, P.foodLifeCell), ox = 0, oy = 0, M = 100003, map = new Map(), counts = new Map(), keep = [], k, dx, dy;
    for (i = 0; i < food.length; i++) { f = food[i]; var ix = Math.floor((f.x - ox) / gs), iy = Math.floor((f.y - oy) / gs); k = (ix + 20000) * M + (iy + 20000); if (!map.has(k)) { map.set(k, f); f.k = k; f.ix = ix; f.iy = iy; } }
    map.forEach(function (ff) { for (dx = -1; dx <= 1; dx++) for (dy = -1; dy <= 1; dy++) if (dx || dy) { var kk = (ff.ix + dx + 20000) * M + (ff.iy + dy + 20000); counts.set(kk, (counts.get(kk) || 0) + 1); } });
    var out = [], died = 0, born = 0;
    map.forEach(function (ff, kk) { var n = counts.get(kk) || 0; if (n === 2 || n === 3) out.push(ff); else died++; });
    counts.forEach(function (n, kk) {
      if (n === 3 && !map.has(kk)) { var ix2 = Math.floor(kk / M) - 20000, iy2 = (kk % M) - 20000, nx = ox + (ix2 + 0.5) * gs, ny = oy + (iy2 + 0.5) * gs; if (nx > x0 && nx < x1 && ny > y0 && ny < y1) { out.push({ x: nx, y: ny, r: Math.random() }); born++; } }
    });
    // when the colony runs low, small random 3x3 blobs are seeded (isolated dots would die at once under Conway's rules)
    var nf = cont.w * cont.h * P.foodDensity / 2, want = Math.max(40, nf * 0.2), nb = out.length < want ? Math.min(60, Math.ceil((want - out.length) / 4)) : 0;
    for (var b = 0; b < nb; b++) {
      var bx = Math.floor((x0 + rnd(Math.max(1, cont.w - 4 * gs))) / gs), by = Math.floor((y0 + rnd(Math.max(1, cont.h - 4 * gs))) / gs);
      for (dx = 0; dx < 3; dx++) for (dy = 0; dy < 3; dy++) if (Math.random() < 0.55) { out.push({ x: ox + (bx + dx + 0.5) * gs, y: oy + (by + dy + 0.5) * gs, r: Math.random() }); born++; }
    }
    food = out; foodStat.born += born; foodStat.died += died; foodStat.steps++;
  }
  // ---- food life, amorphous alternatives (no lattice: positions are continuous, shapes keep changing) ----
  // mode 2 blobs: each blob is a soft shape made of a few dots that wobble. Life-like rules on blob neighbours: alone -> shrinks, 2-3 neighbours -> grows, crowded -> shrinks or splits.
  // every mode: dots never stay outside the plate; a shrinking plate sweeps them in and they pile up against the moving walls
  function foodKeepInW(x0, y0, x1, y1) { // Rust/wasm keepIn (fd3.rs); returns false so the JS loop below runs (?nowasm=1, ?nosim=1)
    var E = WC.e; if (!E || !E.fk_run || !WC.ok || WC.off || WC.simOff || /[?&]nosim=1/.test(location.search)) return false;
    try {
      var n = food.length, i, f, b, any = false;
      for (i = 0; i < n; i++) { f = food[i]; if (f.x < x0 || f.x > x1 || f.y < y0 || f.y > y1) { any = true; break; } }
      if (!any) return true; // no strays: no marshal at all
      var ip = E.fk_in(n), buf = new Float64Array(WC.mem.buffer, ip, n * 5 + 5);
      for (i = 0; i < n; i++) { f = food[i]; b = i * 5; buf[b] = f.x; buf[b + 1] = f.y; if (f.vx !== undefined) { buf[b + 2] = f.vx; buf[b + 3] = f.vy; buf[b + 4] = 1; } else buf[b + 4] = 0; }
      if (E.fk_run(n, x0, y0, x1, y1) < 0) return false;
      for (i = 0; i < n; i++) { f = food[i]; b = i * 5; f.x = buf[b]; f.y = buf[b + 1]; if (buf[b + 4]) { f.vx = buf[b + 2]; f.vy = buf[b + 3]; } }
      WC.fwKp = (WC.fwKp || 0) + 1; return true;
    } catch (e) { WC.fwKpErr = String(e && e.stack || e); return false; }
  }
  function foodKeepIn() {
    var x0 = cont.x, x1 = cont.x + cont.w, y0 = cont.y, y1 = cont.y + cont.h, i, f;
    if (foodKeepInW(x0, y0, x1, y1)) return;
    for (i = 0; i < food.length; i++) {
      f = food[i];
      if (f.x < x0 || f.x > x1 || f.y < y0 || f.y > y1) { f.x = clamp(f.x, x0, x1); f.y = clamp(f.y, y0, y1); if (f.vx !== undefined) { f.vx *= 0.5; f.vy *= 0.5; } }
    }
  }
  var blobs = [], blobT = 0, blobStat = { grow: 0, shrink: 0, split: 0, die: 0, born: 0 };
  function newBlob(x, y) { var b = { x: x, y: y, vx: 0, vy: 0, r: 8 + Math.random() * 10, ph: Math.random() * 6.28, w: 0.3 + Math.random() * 0.6, d: [] }; for (var k = 0; k < 4; k++) addBlobDot(b); blobs.push(b); blobStat.born++; return b; }
  function addBlobDot(b) { var f = { x: b.x, y: b.y, r: Math.random(), a: Math.random() * 6.28, f: 0.5 + Math.random() * 1.5, q: Math.random() * 6.28, blob: b }; b.d.push(f); food.push(f); }
  function stepBlobsPassW(tt, x0, y0, x1, y1) { // Rust/wasm blob per-frame pass (fd2.rs); returns false so the JS loop below runs (?nowasm=1, ?nosim=1)
    var E = WC.e; if (!E || !E.fb_run || !WC.ok || WC.off || WC.simOff || /[?&]nosim=1/.test(location.search)) return false;
    try {
      var nb = blobs.length, nd = 0, i, k, b, f;
      for (i = 0; i < nb; i++) nd += blobs[i].d.length;
      var bp = E.fb_blobs(nb), dp = E.fb_dots(nd); // alloc both before wrapping: a resize can grow memory and detach an earlier view
      var bb = new Float64Array(WC.mem.buffer, bp, nb * 7 + 7), db = new Float64Array(WC.mem.buffer, dp, nd * 6 + 6);
      var j = 0;
      for (i = 0; i < nb; i++) { b = blobs[i]; bb[i * 7] = b.x; bb[i * 7 + 1] = b.y; bb[i * 7 + 2] = b.vx; bb[i * 7 + 3] = b.vy; bb[i * 7 + 4] = b.r; bb[i * 7 + 5] = b.ph; bb[i * 7 + 6] = b.w;
        for (k = 0; k < b.d.length; k++) { f = b.d[k]; db[j * 6] = f.a; db[j * 6 + 1] = f.f; db[j * 6 + 2] = f.q; db[j * 6 + 3] = i; j++; } }
      if (E.fb_run(nb, nd, tt, x0, y0, x1, y1, Math.floor(Math.random() * 4294967296), Math.floor(Math.random() * 4294967296)) < 0) return false;
      j = 0;
      for (i = 0; i < nb; i++) { b = blobs[i]; b.x = bb[i * 7]; b.y = bb[i * 7 + 1]; b.vx = bb[i * 7 + 2]; b.vy = bb[i * 7 + 3];
        for (k = 0; k < b.d.length; k++) { f = b.d[k]; f.x = db[j * 6 + 4]; f.y = db[j * 6 + 5]; j++; } }
      WC.fwBl = (WC.fwBl || 0) + 1; return true;
    } catch (e) { WC.fwBlErr = String(e && e.stack || e); return false; }
  }
  function stepBlobs() {
    var i, k, b, now = performance.now(), tt = now / 1000, x0 = cont.x, x1 = cont.x + cont.w, y0 = cont.y, y1 = cont.y + cont.h;
    if (!blobs.length && food.length) { blobs = []; for (i = 0; i < food.length; i++) { delete food[i].blob; } food = []; }
    for (i = blobs.length - 1; i >= 0; i--) { b = blobs[i]; b.d = b.d.filter(function (f) { return !f.gone; }); if (!b.d.length) { blobs.splice(i, 1); blobStat.die++; } }
    var R = P.foodBlobR;
    if (!stepBlobsPassW(tt, x0, y0, x1, y1)) for (i = 0; i < blobs.length; i++) {
      b = blobs[i];
      // drift, soft push from neighbours, pulled into the plate when outside
      b.vx = b.vx * 0.95 + (Math.random() - 0.5) * 0.12; b.vy = b.vy * 0.95 + (Math.random() - 0.5) * 0.12;
      for (k = 0; k < blobs.length; k += 1) if (k !== i) { var o = blobs[k], dx = b.x - o.x, dy = b.y - o.y, d2 = dx * dx + dy * dy; if (d2 < 900 && d2 > 1) { var dd = Math.sqrt(d2); b.vx += dx / dd * 0.02; b.vy += dy / dd * 0.02; } }
      b.x += b.vx; b.y += b.vy;
      if (b.x < x0 || b.x > x1 || b.y < y0 || b.y > y1) { b.x += (clamp(b.x, x0 + 4, x1 - 4) - b.x) * 0.25; b.y += (clamp(b.y, y0 + 4, y1 - 4) - b.y) * 0.25; }
      var rr = b.r * (1 + 0.25 * Math.sin(tt * b.w + b.ph)) * (0.6 + 0.08 * b.d.length);
      for (k = 0; k < b.d.length; k++) { var f = b.d[k], ang = f.a + tt * 0.25 * b.w, rad = rr * (0.45 + 0.55 * Math.abs(Math.sin(tt * f.f + f.q))); f.x = b.x + Math.cos(ang) * rad; f.y = b.y + Math.sin(ang) * rad; }
    }
    if (now - blobT >= P.foodLifeMs * 2) {
      blobT = now; var n = blobs.length, cnt = new Array(n).fill(0), a, c;
      for (a = 0; a < n; a++) for (c = a + 1; c < n; c++) { var ddx = blobs[a].x - blobs[c].x, ddy = blobs[a].y - blobs[c].y; if (ddx * ddx + ddy * ddy < R * R) { cnt[a]++; cnt[c]++; } }
      for (a = n - 1; a >= 0; a--) {
        b = blobs[a]; var nb = cnt[a];
        if (nb === 2 || nb === 3) { if (b.d.length < P.foodBlobDots) { addBlobDot(b); blobStat.grow++; } else if (Math.random() < 0.25 && blobs.length < 220) { var nbl = newBlob(b.x + (Math.random() - 0.5) * R * 0.8, b.y + (Math.random() - 0.5) * R * 0.8); nbl.x = clamp(nbl.x, x0 + 4, x1 - 4); nbl.y = clamp(nbl.y, y0 + 4, y1 - 4); for (var s = 0; s < 2; s++) { var gone = b.d.pop(); if (gone) { gone.gone = 1; var fi = food.indexOf(gone); if (fi >= 0) food.splice(fi, 1); } } blobStat.split++; } }
        else if (nb < 2 || nb > 3) { if (Math.random() < 0.35 && b.d.length > 1) { var g2 = b.d.pop(); g2.gone = 1; var fj = food.indexOf(g2); if (fj >= 0) food.splice(fj, 1); blobStat.shrink++; } else if (b.d.length <= 1 && Math.random() < 0.3) { b.d.forEach(function (f) { f.gone = 1; var fz = food.indexOf(f); if (fz >= 0) food.splice(fz, 1); }); } }
      }
      var want = Math.round(cont.w * cont.h * P.foodDensity / 2 / 12), kk = Math.min(8, want - blobs.length);
      for (k = 0; k < kk; k++) newBlob(x0 + Math.random() * cont.w, y0 + Math.random() * cont.h);
    }
  }
  function drawBlobs() {
    var ol = P.blobOutline; if (ol && !(P.axisWidth > 0)) return; ctx.fillStyle = P.foodColor; ctx.strokeStyle = P.foodColor; ctx.lineWidth = LW(); ctx.lineCap = 'round'; ctx.globalAlpha = P.foodAlpha;
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i], d = b.d; if (!introOn(CELL_END + ((i * 0.6180339) % 1) * (FOOD_END - CELL_END))) continue; if (d.length < 3) { for (var q = 0; q < d.length; q++) { if (ol) ctx.strokeRect(d[q].x - P.foodSize / 2, d[q].y - P.foodSize / 2, P.foodSize, P.foodSize); else ctx.fillRect(d[q].x - P.foodSize / 2, d[q].y - P.foodSize / 2, P.foodSize, P.foodSize); } continue; }
      var pts = d.slice().sort(function (u, v) { return Math.atan2(u.y - b.y, u.x - b.x) - Math.atan2(v.y - b.y, v.x - b.x); }), n = pts.length;
      ctx.beginPath(); ctx.moveTo((pts[n - 1].x + pts[0].x) / 2, (pts[n - 1].y + pts[0].y) / 2);
      for (var k = 0; k < (ol ? n - 1 : n); k++) { var p1 = pts[k], p2 = pts[(k + 1) % n]; ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2); }
      if (ol) ctx.stroke(); else { ctx.closePath(); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
  // mode 3 swarm: continuous dots that flock; Life-like thinning: isolated dots fade away, dots with 2-3 near neighbours may bud a child, crowded ones die
  var swT = 0, swStat = { born: 0, died: 0 };
  function stepSwarmW() { // Rust/wasm swarm step (swarm.rs); returns false when unavailable so the JS body below runs (?nowasm=1, ?nosim=1)
    var E = WC.e; if (!E || !E.sw_run || !WC.ok || WC.off || WC.simOff || /[?&]nosim=1/.test(location.search)) return false;
    try {
      var n = food.length, i, f, b, x0 = cont.x, x1 = cont.x + cont.w, y0 = cont.y, y1 = cont.y + cont.h, ar = cont.w * cont.h * P.foodDensity;
      var ip = E.sw_in(n), buf = new Float64Array(WC.mem.buffer, ip, n * 6 + 6);
      for (i = 0; i < n; i++) { f = food[i]; if (f.vx === undefined) { f.vx = (Math.random() - 0.5) * 0.4; f.vy = (Math.random() - 0.5) * 0.4; } b = i * 6; buf[b] = f.x; buf[b + 1] = f.y; buf[b + 2] = f.vx; buf[b + 3] = f.vy; buf[b + 4] = f.r; }
      var life = performance.now() - swT >= P.foodLifeMs * 2;
      var m = E.sw_run(n, x0, x1, y0, y1, life ? 1 : 0, n < ar ? 1 : 0, ar * 0.1, Math.floor(Math.random() * 4294967296), Math.floor(Math.random() * 4294967296));
      if (m < 0) return false;
      if (life) swT = performance.now();
      var o = new Float64Array(WC.mem.buffer, E.sw_out(), m * 7), st = new Float64Array(WC.mem.buffer, E.sw_stat(), 4), out = new Array(m), kept = new Uint8Array(n), k, src;
      swStat.died += st[0]; swStat.born += st[1];
      for (k = 0; k < m; k++) {
        b = k * 7; src = o[b + 5];
        if (src >= 0) { f = food[src]; kept[src] = 1; f.x = o[b]; f.y = o[b + 1]; f.vx = o[b + 2]; f.vy = o[b + 3]; out[k] = f; }
        else out[k] = { x: o[b], y: o[b + 1], r: o[b + 4], vx: 0, vy: 0 };
      }
      for (i = 0; i < n; i++) if (!kept[i]) food[i].gone = 1;
      food = out; return true;
    } catch (e) { return false; }
  }
  function stepSwarm() {
    if (stepSwarmW()) return;
    var i, f, x0 = cont.x, x1 = cont.x + cont.w, y0 = cont.y, y1 = cont.y + cont.h, n = food.length, G = 18, grid = new Map(), K = 10007;
    for (i = 0; i < n; i++) { f = food[i]; if (f.vx === undefined) { f.vx = (Math.random() - 0.5) * 0.4; f.vy = (Math.random() - 0.5) * 0.4; } f.gx = Math.floor(f.x / G); f.gy = Math.floor(f.y / G); var key = f.gx * K + f.gy; var arr = grid.get(key); if (arr) arr.push(f); else grid.set(key, [f]); }
    var life = performance.now() - swT >= P.foodLifeMs * 2; if (life) swT = performance.now();
    var out = [];
    for (i = 0; i < n; i++) {
      f = food[i]; var mx = 0, my = 0, sx = 0, sy = 0, c = 0, dx, dy;
      for (dx = -1; dx <= 1; dx++) for (dy = -1; dy <= 1; dy++) { var cell = grid.get((f.gx + dx) * K + (f.gy + dy)); if (cell) for (var m = 0; m < cell.length; m++) { var o = cell[m]; if (o === f) continue; var ex = o.x - f.x, ey = o.y - f.y, d2 = ex * ex + ey * ey; if (d2 < G * G) { c++; mx += ex; my += ey; if (d2 < 36 && d2 > 0.1) { sx -= ex / d2; sy -= ey / d2; } } } }
      if (c) { f.vx += mx / c * 0.004 + sx * 0.6; f.vy += my / c * 0.004 + sy * 0.6; }
      f.vx = f.vx * 0.97 + (Math.random() - 0.5) * 0.08; f.vy = f.vy * 0.97 + (Math.random() - 0.5) * 0.08;
      f.x += f.vx; f.y += f.vy;
      if (f.x < x0 || f.x > x1 || f.y < y0 || f.y > y1) { f.x += (clamp(f.x, x0 + 1, x1 - 1) - f.x) * 0.25; f.y += (clamp(f.y, y0 + 1, y1 - 1) - f.y) * 0.25; f.vx *= 0.8; f.vy *= 0.8; }
      var keep = true;
      if (life) {
        if (c < 2 && Math.random() < 0.3) { keep = false; swStat.died++; }
        else if (c > 5 && Math.random() < 0.4) { keep = false; swStat.died++; }
        else if ((c === 2 || c === 3) && Math.random() < 0.3 && n < cont.w * cont.h * P.foodDensity) { out.push({ x: f.x + (Math.random() - 0.5) * 6, y: f.y + (Math.random() - 0.5) * 6, r: Math.random(), vx: 0, vy: 0 }); swStat.born++; }
      }
      if (keep) out.push(f); else f.gone = 1;
    }
    if (life && out.length < cont.w * cont.h * P.foodDensity * 0.1) for (i = 0; i < 12; i++) { var cx = x0 + Math.random() * cont.w, cy = y0 + Math.random() * cont.h; for (var q = 0; q < 4; q++) out.push({ x: cx + (Math.random() - 0.5) * 12, y: cy + (Math.random() - 0.5) * 12, r: Math.random(), vx: 0, vy: 0 }); }
    food = out;
  }
  // mode 4 worms: living food strands. The head wanders with a wave, the body follows link by link; a worm grows at the
  // tail, splits in two when long, and cells bite pieces off it (each body dot is an ordinary edible food entry).
  var worms = [], wormT = 0, wormStat = { born: 0, died: 0, split: 0, eaten: 0 };
  function newWorm(x, y, len) {
    var w = { x: x, y: y, a: rnd(6.2832), sp: rnd(0.25, 0.8), fr: rnd(0.6, 1.6), ph: rnd(6.2832), d: [] };
    for (var i = 0; i < len; i++) { var f = { x: x, y: y, r: Math.random(), worm: w }; w.d.push(f); food.push(f); }
    worms.push(w); wormStat.born++; return w;
  }
  function wipeWorms() { for (var i = food.length - 1; i >= 0; i--) if (food[i].worm) food.splice(i, 1); worms = []; }
  function stepWormsW() { // Rust/wasm worm step (worms.rs); returns false when unavailable so the JS body below runs (?nowasm=1, ?nosim=1, ?nofoodwasm=1)
    var E = WC.e; if (!E || !E.wm_run || !WC.ok || WC.off || WC.simOff || /[?&]nosim=1|nofoodwasm=1/.test(location.search)) return false;
    try {
      var i, k, w, f, now = performance.now();
      for (i = worms.length - 1; i >= 0; i--) { // eaten links drop out; a worm with too little body left dissolves
        w = worms[i];
        for (k = w.d.length - 1; k >= 0; k--) if (w.d[k].gone) { w.d.splice(k, 1); wormStat.eaten++; }
        if (w.d.length < 2) { w.d.forEach(function (f) { f.gone = 1; var fi = food.indexOf(f); if (fi >= 0) food.splice(fi, 1); }); worms.splice(i, 1); wormStat.died++; }
      }
      var nw = worms.length, nl = 0; for (i = 0; i < nw; i++) nl += worms[i].d.length;
      var hp = E.wm_hdr(nw), lp = E.wm_lnk(nl); // alloc before reading the buffer: a resize can grow memory and detach it
      var hb = new Float64Array(WC.mem.buffer, hp, nw * 6 + 6), lb = new Float64Array(WC.mem.buffer, lp, nl * 4 + 4);
      var all = [], li = 0, b, q;
      for (i = 0; i < nw; i++) { w = worms[i]; b = i * 6; hb[b] = w.x; hb[b + 1] = w.y; hb[b + 2] = w.a; hb[b + 3] = w.sp; hb[b + 4] = w.fr; hb[b + 5] = w.ph;
        for (k = 0; k < w.d.length; k++) { f = w.d[k]; all.push(f); q = li * 4; lb[q] = f.x; lb[q + 1] = f.y; lb[q + 2] = f.r; lb[q + 3] = i; li++; } }
      var life = now - wormT >= P.foodLifeMs * 2;
      var want = Math.round(cont.w * cont.h * P.foodDensity / 2 / 14);
      var m = E.wm_run(nw, nl, cont.x, cont.x + cont.w, cont.y, cont.y + cont.h, now / 1000, Math.max(3, P.foodSize * 1.6), life ? 1 : 0, want, Math.floor(Math.random() * 4294967296), Math.floor(Math.random() * 4294967296));
      if (m < 0) return false;
      if (life) wormT = now;
      var oh = new Float64Array(WC.mem.buffer, E.wm_ohdr(), m * 7), st = new Float64Array(WC.mem.buffer, E.wm_stat(), 4);
      var lq = st[2], ol = new Float64Array(WC.mem.buffer, E.wm_olnk(), lq * 5);
      wormStat.split += st[0]; wormStat.born += st[1];
      var outW = new Array(m);
      for (i = 0; i < m; i++) { b = i * 7; var src = oh[b + 6];
        if (src >= 0) { w = worms[src]; w.x = oh[b]; w.y = oh[b + 1]; w.a = oh[b + 2]; w.sp = oh[b + 3]; w.fr = oh[b + 4]; w.ph = oh[b + 5]; w.d = []; }
        else w = { x: oh[b], y: oh[b + 1], a: oh[b + 2], sp: oh[b + 3], fr: oh[b + 4], ph: oh[b + 5], d: [] };
        outW[i] = w; }
      for (k = 0; k < lq; k++) { b = k * 5; var widx = ol[b + 3], lsrc = ol[b + 4]; w = outW[widx];
        if (lsrc >= 0) { f = all[lsrc]; f.x = ol[b]; f.y = ol[b + 1]; f.r = ol[b + 2]; f.worm = w; }
        else { f = { x: ol[b], y: ol[b + 1], r: ol[b + 2], worm: w }; food.push(f); }
        w.d.push(f); }
      worms = outW; WC.fwWm = (WC.fwWm || 0) + 1; return true;
    } catch (e) { WC.fwWmErr = String(e && e.stack || e); return false; }
  }
  function stepWorms() {
    if (stepWormsW()) return;
    var i, k, w, now = performance.now(), tt = now / 1000, x0 = cont.x, x1 = cont.x + cont.w, y0 = cont.y, y1 = cont.y + cont.h;
    for (i = worms.length - 1; i >= 0; i--) { // eaten links drop out; a worm with too little body left dissolves
      w = worms[i];
      for (k = w.d.length - 1; k >= 0; k--) if (w.d[k].gone) { w.d.splice(k, 1); wormStat.eaten++; }
      if (w.d.length < 2) { w.d.forEach(function (f) { f.gone = 1; var fi = food.indexOf(f); if (fi >= 0) food.splice(fi, 1); }); worms.splice(i, 1); wormStat.died++; }
    }
    var SP = Math.max(3, P.foodSize * 1.6);
    for (i = 0; i < worms.length; i++) {
      w = worms[i];
      w.a += (Math.random() - 0.5) * 0.35 + Math.sin(tt * w.fr + w.ph) * 0.06;
      var m = 26;
      if (w.x < x0 + m || w.x > x1 - m || w.y < y0 + m || w.y > y1 - m) { var ca = Math.atan2((y0 + y1) / 2 - w.y, (x0 + x1) / 2 - w.x), da = ca - w.a; while (da > 3.1416) da -= 6.2832; while (da < -3.1416) da += 6.2832; w.a += da * 0.04; }
      var sp = w.sp * (1 + 0.35 * Math.sin(tt * w.fr * 2 + w.ph));
      w.x += Math.cos(w.a) * sp; w.y += Math.sin(w.a) * sp;
      var hx = w.x, hy = w.y;
      for (k = 0; k < w.d.length; k++) { var f = w.d[k], dx = hx - f.x, dy = hy - f.y, dd = Math.hypot(dx, dy) || 1, mv = dd - SP; if (mv > 0) { f.x += dx / dd * mv; f.y += dy / dd * mv; } hx = f.x; hy = f.y; }
    }
    if (now - wormT >= P.foodLifeMs * 2) {
      wormT = now;
      for (i = worms.length - 1; i >= 0; i--) {
        w = worms[i];
        if (w.d.length < 16 && Math.random() < 0.45) { var tl = w.d[w.d.length - 1], nf = { x: tl.x, y: tl.y, r: Math.random(), worm: w }; w.d.push(nf); food.push(nf); }
        if (w.d.length >= 9 && Math.random() < 0.3 && worms.length < 120) { // binary fission: the tail half walks away as its own worm
          var half = Math.ceil(w.d.length / 2), tail = w.d.splice(half), nw2 = { x: tail[0].x, y: tail[0].y, a: rnd(6.2832), sp: rnd(0.25, 0.8), fr: rnd(0.6, 1.6), ph: rnd(6.2832), d: tail };
          tail.forEach(function (f) { f.worm = nw2; }); worms.push(nw2); wormStat.split++; wormStat.born++;
        }
      }
      var want = Math.round(cont.w * cont.h * P.foodDensity / 2 / 14), kk = Math.min(5, want - worms.length);
      for (k = 0; k < kk; k++) newWorm(x0 + Math.random() * cont.w, y0 + Math.random() * cont.h, 3 + Math.floor(Math.random() * 4));
    }
  }
  function drawWorms() {
    var ol = P.blobOutline; if (ol && !(P.axisWidth > 0)) return;
    ctx.strokeStyle = P.foodColor; ctx.fillStyle = P.foodColor; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = P.foodAlpha;
    ctx.lineWidth = ol ? LW() : Math.max(1.5, P.foodSize * 1.1);
    for (var i = 0; i < worms.length; i++) {
      var w = worms[i], d = w.d; if (d.length < 2) continue;
      if (!introOn(CELL_END + ((i * 0.6180339) % 1) * (FOOD_END - CELL_END))) continue;
      ctx.beginPath(); ctx.moveTo(d[0].x, d[0].y);
      for (var k = 1; k < d.length; k++) ctx.lineTo(d[k].x, d[k].y);
      ctx.stroke();
      if (!ol) { ctx.beginPath(); ctx.arc(d[0].x, d[0].y, Math.max(1, P.foodSize * 0.7), 0, 6.2832); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
  // mode 5 spores: rooted spores mature, pulse, and burst into drifting motes; motes that survive settle as new spores.
  // Every stage is an ordinary food entry - cells can eat a spore before it bursts or catch the motes mid-flight.
  var spores = [], sporeLast = 0, sporeStat = { born: 0, burst: 0, died: 0, eaten: 0, settled: 0 };
  function newSpore(x, y, st) { var s = { x: x, y: y, r: Math.random(), st: st || 0, age: 0, ph: Math.random() * 6.2832, vx: 0, vy: 0, spore: 1 }; spores.push(s); food.push(s); sporeStat.born++; return s; }
  function wipeSpores() { for (var i = food.length - 1; i >= 0; i--) if (food[i].spore) food.splice(i, 1); spores = []; }
  function stepSporesW() { // Rust/wasm spore step (spores.rs); returns false when unavailable so the JS body below runs (?nowasm=1, ?nosim=1, ?nofoodwasm=1)
    var E = WC.e; if (!E || !E.sp_run || !WC.ok || WC.off || WC.simOff || /[?&]nosim=1|nofoodwasm=1/.test(location.search)) return false;
    try {
      var n = spores.length, i, s, b, k, src;
      var ip = E.sp_in(n), buf = new Float64Array(WC.mem.buffer, ip, n * 9 + 9);
      for (i = 0; i < n; i++) { s = spores[i]; b = i * 9; buf[b] = s.x; buf[b + 1] = s.y; buf[b + 2] = s.r; buf[b + 3] = s.st; buf[b + 4] = s.age; buf[b + 5] = s.ph; buf[b + 6] = s.vx; buf[b + 7] = s.vy; buf[b + 8] = s.gone ? 1 : 0; }
      var now = performance.now(), dtms = sporeLast ? Math.min(200, now - sporeLast) : 16; sporeLast = now;
      var cap = Math.max(60, Math.round(cont.w * cont.h * P.foodDensity / 2 / 8));
      var m = E.sp_run(n, cont.x, cont.x + cont.w, cont.y, cont.y + cont.h, dtms, cap, Math.floor(Math.random() * 4294967296), Math.floor(Math.random() * 4294967296));
      if (m < 0) return false;
      var o = new Float64Array(WC.mem.buffer, E.sp_out(), m * 10), st = new Float64Array(WC.mem.buffer, E.sp_stat(), 8), out = new Array(m), kept = new Uint8Array(n);
      sporeStat.eaten += st[0]; sporeStat.burst += st[1]; sporeStat.died += st[2]; sporeStat.settled += st[3]; sporeStat.born += st[4];
      for (k = 0; k < m; k++) {
        b = k * 10; src = o[b + 8];
        if (src >= 0) { s = spores[src]; kept[src] = 1; s.x = o[b]; s.y = o[b + 1]; s.r = o[b + 2]; s.st = o[b + 3]; s.age = o[b + 4]; s.ph = o[b + 5]; s.vx = o[b + 6]; s.vy = o[b + 7]; out[k] = s; }
        else { s = { x: o[b], y: o[b + 1], r: o[b + 2], st: o[b + 3], age: o[b + 4], ph: o[b + 5], vx: o[b + 6], vy: o[b + 7], spore: 1 }; food.push(s); out[k] = s; }
      }
      for (i = 0; i < n; i++) if (!kept[i]) spores[i].gone = 1;
      spores = out;
      for (i = food.length - 1; i >= 0; i--) if (food[i].gone) food.splice(i, 1);
      WC.fwSp = (WC.fwSp || 0) + 1; return true;
    } catch (e) { WC.fwSpErr = String(e && e.stack || e); return false; }
  }
  function stepSpores() {
    if (stepSporesW()) return;
    var i, now = performance.now(), dtms = sporeLast ? Math.min(200, now - sporeLast) : 16; sporeLast = now;
    var x0 = cont.x, x1 = cont.x + cont.w, y0 = cont.y, y1 = cont.y + cont.h, rooted = 0;
    var cap = Math.max(60, Math.round(cont.w * cont.h * P.foodDensity / 2 / 8));
    for (i = spores.length - 1; i >= 0; i--) {
      var s = spores[i];
      if (s.gone) { spores.splice(i, 1); sporeStat.eaten++; continue; }
      s.age += dtms;
      if (s.st === 0) {
        rooted++;
        if (s.age > 5000 + s.ph * 1200) { // mature
          if (spores.length < cap) { // burst: the spore scatters into motes
            s.gone = 1; var fi = food.indexOf(s); if (fi >= 0) food.splice(fi, 1); spores.splice(i, 1); sporeStat.burst++; sporeStat.died++;
            var nm = 4 + Math.floor(Math.random() * 4);
            for (var k2 = 0; k2 < nm; k2++) { var a2 = rnd(6.2832), v = rnd(0.6, 1.8), mo = newSpore(s.x, s.y, 1); mo.vx = Math.cos(a2) * v; mo.vy = Math.sin(a2) * v; }
          } else if (Math.random() < 0.4) { s.gone = 1; var fk = food.indexOf(s); if (fk >= 0) food.splice(fk, 1); spores.splice(i, 1); sporeStat.died++; } // crowded: some retire quietly
          else s.age = 0; // crowded: wait for another cycle
        }
      } else {
        s.vx = s.vx * 0.965 + (Math.random() - 0.5) * 0.05; s.vy = s.vy * 0.965 + (Math.random() - 0.5) * 0.05;
        s.x += s.vx; s.y += s.vy;
        if (s.x < x0 || s.x > x1) { s.vx = -s.vx * 0.6; s.x = clamp(s.x, x0, x1); }
        if (s.y < y0 || s.y > y1) { s.vy = -s.vy * 0.6; s.y = clamp(s.y, y0, y1); }
        if (s.age > 1400 + s.ph * 300) { // landing: most root as new spores, some are lost
          if (Math.random() < 0.75) { s.st = 0; s.age = 0; s.vx = 0; s.vy = 0; sporeStat.settled++; sporeStat.born++; }
          else { s.gone = 1; var fj = food.indexOf(s); if (fj >= 0) food.splice(fj, 1); spores.splice(i, 1); sporeStat.died++; }
        }
      }
    }
    var want = Math.round(cap * 0.6);
    if (rooted < want && Math.random() < 0.35) { var nb = Math.min(3, want - rooted); for (i = 0; i < nb; i++) newSpore(x0 + Math.random() * cont.w, y0 + Math.random() * cont.h, 0); }
  }
  function drawSpores() {
    var ol = P.blobOutline; if (ol && !(P.axisWidth > 0)) return;
    var now = performance.now(); ctx.strokeStyle = P.foodColor; ctx.fillStyle = P.foodColor; ctx.lineWidth = Math.max(1, LW());
    ctx.globalAlpha = P.foodAlpha;
    for (var i = 0; i < spores.length; i++) {
      var s = spores[i]; if (s.r >= P.foodShow) continue;
      if (!introOn(CELL_END + s.r * (FOOD_END - CELL_END))) continue;
      if (s.st === 1) { var ms2 = P.foodSize * 0.55; ctx.fillRect(s.x - ms2 / 2, s.y - ms2 / 2, ms2, ms2); continue; }
      var g = Math.min(1, s.age / 4500), rr = P.foodSize * (0.5 + g * 1.1);
      ctx.beginPath(); ctx.arc(s.x, s.y, rr, 0, 6.2832); if (ol) ctx.stroke(); else ctx.fill();
      if (g > 0.65) { // about to burst: a pulsing halo
        var pu = (g - 0.65) / 0.35;
        ctx.globalAlpha = P.foodAlpha * pu * (0.35 + 0.35 * Math.sin(now / 130 + s.ph));
        ctx.beginPath(); ctx.arc(s.x, s.y, rr + P.foodSize * (0.7 + 0.5 * Math.sin(now / 160 + s.ph)), 0, 6.2832); ctx.stroke();
        ctx.globalAlpha = P.foodAlpha;
      }
    }
    ctx.globalAlpha = 1;
  }
  var parStat = { rehost: 0 };
  function stepParasitesW() { // Rust/wasm parasite step (parasites.rs); returns false when unavailable so the JS body below runs (?nowasm=1, ?nosim=1, ?nofoodwasm=1)
    var E = WC.e; if (!E || !E.pa_run || !WC.ok || WC.off || WC.simOff || /[?&]nosim=1|nofoodwasm=1/.test(location.search)) return false;
    try {
      if (!P.parasiteOn || !cells.length) { parasites.length = 0; return true; }
      var n = cells.length, m = parasites.length, i, c, p, b;
      var cp = E.pa_cells(n), ep = E.pa_energy(n), pp = E.pa_in(m); // alloc before reading the buffer: a resize can grow memory and detach it
      var ci = new Float64Array(WC.mem.buffer, cp, n * 5 + 5), en = new Float64Array(WC.mem.buffer, ep, n + 1), pi = new Float64Array(WC.mem.buffer, pp, m * 7 + 7);
      var hidx = {};
      for (i = 0; i < n; i++) { c = cells[i]; c._pi = i; b = i * 5; ci[b] = c.x; ci[b + 1] = c.y; ci[b + 2] = c.radius; ci[b + 3] = c.cl || 0; ci[b + 4] = c.alive ? 1 : 0; en[i] = c.energy; }
      for (i = 0; i < m; i++) { p = parasites[i]; b = i * 7; pi[b] = p.x; pi[b + 1] = p.y; pi[b + 2] = p.e; // a spliced host keeps a stale _pi: validate identity before packing
      pi[b + 3] = (p.host && p.host.alive && cells[p.host._pi] === p.host) ? p.host._pi : -1; pi[b + 4] = p.a; pi[b + 5] = p.ph || 0; pi[b + 6] = p.lost || 0; }
      var now = performance.now();
      var q = E.pa_run(n, m, now, 1, P.parasiteFrac, P.parasiteSight, P.parasiteNerv, P.parasiteDrain, P.parasiteEff, P.parasiteHard, P.parasiteHardMs, Math.floor(Math.random() * 4294967296), Math.floor(Math.random() * 4294967296));
      if (q < 0) return false;
      for (i = 0; i < n; i++) cells[i].energy = en[i];
      var po = new Float64Array(WC.mem.buffer, E.pa_out(), q * 8), st = new Float64Array(WC.mem.buffer, E.pa_stat(), 4), out = new Array(q);
      ev.pdeath = (ev.pdeath || 0) + st[0]; ev.pbirth = (ev.pbirth || 0) + st[1]; parStat.rehost += st[2];
      for (i = 0; i < q; i++) { b = i * 8; var src = po[b + 7];
        if (src >= 0) { p = parasites[src]; p.x = po[b]; p.y = po[b + 1]; p.e = po[b + 2]; p.a = po[b + 4]; p.ph = po[b + 5]; p.lost = po[b + 6]; }
        else p = { x: po[b], y: po[b + 1], e: po[b + 2], a: po[b + 4], ph: po[b + 5], lost: po[b + 6] };
        var hh = po[b + 3]; p.host = hh >= 0 ? cells[hh] : null; out[i] = p; }
      parasites = out; WC.fwPa = (WC.fwPa || 0) + 1; return true;
    } catch (e) { WC.fwPaErr = String(e && e.stack || e); return false; }
  }
  function stepParasites() {
    if (stepParasitesW()) return;
    if (!P.parasiteOn || !cells.length) { parasites.length = 0; return; }
    var target = Math.round(cells.length * P.parasiteFrac), i, c;
    for (i = 0; i < cells.length; i++) cells[i].pc = 0;
    for (i = 0; i < parasites.length; i++) if (parasites[i].host) parasites[i].host.pc++;
    if (parasites.length < target && Math.random() < 0.08) { c = cells[Math.floor(Math.random() * cells.length)]; parasites.push({ x: c.x, y: c.y, e: 6, host: null, a: Math.random() * 6.2832 }); }
    for (i = parasites.length - 1; i >= 0; i--) {
      var p = parasites[i];
      if (p.host && !p.host.alive) { p.host = null; p.lost = performance.now(); }
      if (!p.host) {
        var best = null, bd = P.parasiteSight * P.parasiteSight; if (!p.lost) p.lost = performance.now(); if (!p.ph) p.ph = Math.random() * 6.28;
        for (var j = 0; j < cells.length; j++) { var q = cells[j], d = (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y); if (q.cl) d *= 0.5; if (d < bd) { bd = d; best = q; } }
        if (best) {
          var dd = Math.sqrt(bd) || 1, nv = P.parasiteNerv, tt = performance.now() / 1000, osc = Math.sin(tt * (2 + 2 * nv) + p.ph), want = best.radius * (1.1 + 0.5 * nv * (1 + osc)), dir = (dd > want ? 1 : -0.6 * nv), sp = Math.min(6, Math.max(1.2, dd * 0.08)) * (1 + 0.5 * nv * osc);
          p.x += (best.x - p.x) / dd * sp * dir + (Math.random() - 0.5) * 2 * nv; p.y += (best.y - p.y) / dd * sp * dir + (Math.random() - 0.5) * 2 * nv;
          if (Math.hypot(best.x - p.x, best.y - p.y) < best.radius) { p.host = best; p.lost = 0; parStat.rehost++; }
        }
        if (performance.now() - p.lost > P.parasiteHardMs) p.e -= 0.004;
      } else {
        var h = p.host, nvr = 0.85 + 0.2 * P.parasiteNerv * Math.sin(performance.now() / 400 + (p.ph || 0)), tx = h.x + Math.cos(p.a) * h.radius * nvr, ty = h.y + Math.sin(p.a) * h.radius * nvr; p.a += 0.01 + 0.03 * P.parasiteNerv * Math.sin(performance.now() / 700 + (p.ph || 0)); p.x = lerp(p.x, tx, 0.5); p.y = lerp(p.y, ty, 0.5);
        var crowd = Math.max(0, h.pc - 1), dr = P.parasiteDrain * (0.4 + Math.min(h.energy, 20) * 0.03) / (1 + 0.4 * crowd); h.energy -= dr; p.e += dr * P.parasiteEff - 0.012 * (1 + 0.7 * crowd);
      }
      if (p.e <= -P.parasiteHard) { parasites.splice(i, 1); ev.pdeath = (ev.pdeath || 0) + 1; continue; }
      if (p.e > 12 && parasites.length < cells.length * 0.8 + 3) { p.e /= 2; parasites.push({ x: p.x, y: p.y, e: p.e, host: p.host, a: Math.random() * 6.2832 }); ev.pbirth = (ev.pbirth || 0) + 1; }
    }
  }
  // ---- frame ----
  var res = 1, frameMs = 0;
  var lastFrameT = performance.now();
  // stage profiler (?perf=1 shows it; stage ms are exponential averages, __ca2.PF holds them)
  var PF = {}, pfT = 0, PERF = /[?&]perf=1/.test(location.search);
  function pfm(n) { var t = performance.now(); PF[n] = (PF[n] === undefined ? 0 : PF[n]) * 0.9 + (t - pfT) * 0.1; pfT = t; }
  function frame() {
    var t0 = performance.now(); pfT = t0; frameT = t0; var dtf = Math.min(100, t0 - lastFrameT); lastFrameT = t0;
    if (resizeDrag) lastRefresh = t0;
    var pk = trans ? 1 - Math.exp(-dtf * 3 / trans.dur) : P.morphEase;
    cont.ew += (cont.tw - cont.ew) * pk; cont.eh += (cont.th - cont.eh) * pk;
    if (Math.abs(cont.ew - cont.tw) < 0.1) cont.ew = cont.tw; if (Math.abs(cont.eh - cont.th) < 0.1) cont.eh = cont.th;
    cont.w = Math.floor(cont.ew); cont.h = Math.floor(cont.eh); cont.x = Math.floor((W - cont.w) / 2); cont.y = Math.floor((H - cont.h) / 2);

    if (pendingSpawn) { // batched first spawn: a few cells per frame after the UI intro, food after the cells
      var el0 = t0 - fadeT0;
      if (el0 >= UI_END) { // time-boxed batches: the spawn never blocks a frame longer than ~6 ms
        var sp = pendingSpawn, bt0 = performance.now();
        while (sp.cells > 0 && performance.now() - bt0 < 6) { cells.push(new Cell(rnd(cont.tw) + sp.gx, rnd(cont.th) + sp.gy, Math.floor(rnd(P.GENE_MIN, P.GENE_MAX + 1)), P.baseMutationRate + rnd(-P.mutationRateRange, P.mutationRateRange))); sp.cells--; }
        if (el0 >= CELL_END) { var bt1 = performance.now(); while (sp.food > 0 && performance.now() - bt1 < 6) { food.push({ x: rnd(cont.tw) + sp.gx, y: rnd(cont.th) + sp.gy, r: Math.random() }); sp.food--; } }
        if (sp.cells <= 0 && sp.food <= 0) pendingSpawn = null;
      }
    }

    bg = lerpC(bg, bgTarget, P.colorSpeed);
    lctx.setTransform(DD, 0, 0, DD, 0, 0); lctx.clearRect(0, 0, W, H);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = css(bg, 1); ctx.fillRect(0, 0, W, H);

    if (Math.random() < P.foodDensity && food.length < cont.w * cont.h * P.foodDensity * 2) food.push({ x: rnd(cont.w) + cont.x, y: rnd(cont.h) + cont.y, r: Math.random() });
    if (Math.random() < 0.001 && food.length) food.splice(Math.floor(rnd(food.length)), 1);
    pfm('setup');
    if (P.foodMode === 1 || (P.foodMode === undefined && P.foodLife)) stepFood(); else if (P.foodMode === 2) stepBlobs(); else if (P.foodMode === 3) stepSwarm(); else if (P.foodMode === 4) stepWorms(); else if (P.foodMode === 5) stepSpores();
    pfm('food step');
    if (P.foodMode !== 4 && worms.length) wipeWorms(); if (P.foodMode !== 5 && spores.length) wipeSpores();
    foodKeepIn(); pfm('foodKeepIn');

    if (trans) stepTrans(t0, dtf);
    pfm('stepTrans');
    // cluster state: shared motion and energy; a cluster of one dissolves, members sometimes leave on their own
    cmean = {};
    if (P.eatMergeOn) {
      for (i = 0; i < cells.length; i++) { var cc0 = cells[i]; if (!cc0.cl) continue; var m0 = cmean[cc0.cl] || (cmean[cc0.cl] = { n: 0, vx: 0, vy: 0, x: 0, y: 0, e: 0 }); m0.n++; m0.vx += cc0.vx; m0.vy += cc0.vy; m0.x += cc0.x; m0.y += cc0.y; m0.e += cc0.energy; }
      for (var kk in cmean) { var mm = cmean[kk]; mm.vx /= mm.n; mm.vy /= mm.n; mm.x /= mm.n; mm.y /= mm.n; mm.e /= mm.n; }
      for (i = 0; i < cells.length; i++) { var c1 = cells[i]; if (c1.cl && (cmean[c1.cl].n < 2 || Math.random() < 0.0005)) c1.cl = 0; }
    } else for (i = 0; i < cells.length; i++) cells[i].cl = 0;
    var clusterCount = Object.keys(cmean).length;
    pfm('cluster state'); hovering = false; var tmpHover = [255, 255, 255], hoverCell = null;
    var tmpR = { v: null }, tj0 = performance.now(), simDone = simW(tmpR); SIMW.frames = (SIMW.frames || 0) + 1; if (simDone) { tmpHover = tmpR.v; hoverCell = tmpR.hc; }
    if (!simDone) for (var i = cells.length - 1; i >= 0; i--) {
      var c = cells[i]; update(c); checkSurvival(c);
      if (mouse.over && Math.hypot(mouse.x - c.x, mouse.y - c.y) < c.radius && c.x > cont.x && c.x < cont.x + cont.w && c.y > cont.y && c.y < cont.y + cont.h) {
        hovering = true; hoverCell = c;
        var r = 0, g = 0, b = 0;
        for (var j = 0; j < cells.length; j++) {
          var o = cells[j]; if (!o.alive) continue;
          var d = Math.hypot(mouse.x - o.x, mouse.y - o.y), inf = P.metaballStrength * c.radius * c.radius / (d * d + 0.0001); inf *= inf;
          if (P.genomeOn && o.g) { r += inf * o.g.col[0]; g += inf * o.g.col[1]; b += inf * o.g.col[2]; } else if (o.gene > 2) r += inf; else if (o.gene < -2) g += inf; else b += inf;
        }
        var t = r + g + b; if (t > 0) { r /= t; g /= t; b /= t; }
        tmpHover = [r * 255, g * 255, b * 255];
      }
      for (var k = i - 1; k >= 0; k--) interact(c, cells[k]);
      if (resizeDrag && c.alive) { var ms2 = (c.maxSpeed + 1) * P.restless; c.vx += (Math.random() - 0.5) * ms2 * 2; c.vy += (Math.random() - 0.5) * ms2 * 2; }
      if (P.boundAware && c.alive) keepIn(c);
      if (!c.alive) { ev.death++; cells.splice(i, 1); }
    }
    if (!simDone) SIMW.js = (SIMW.js || 0) * 0.9 + (performance.now() - tj0) * 0.1;
    hoverCol = hovering ? tmpHover : [255, 255, 255];
    stepParasites(); pfm('sim loop+parasites');

    var Lx = lay(), sT0 = String(cells.length), sX0 = String(Math.round(mouse.x));
    var mv = mouse.over ? invAt(mouse.x, mouse.y) : [bg[0] > 128 ? 0 : 255, bg[0] > 128 ? 0 : 255, bg[0] > 128 ? 0 : 255], k2 = 0.3;
    var tt, tl, tc, ta, trr, tgg, tbb;
    if (hovering) { tt = hoverCol.concat(1); tc = hoverCol.concat(1); ta = hoverCol.concat(1); trr = tgg = tbb = hoverCol.concat(1); tl = mv.concat(1); }
    else { tt = mv.concat(1); tc = mv.concat(50 / 255); tl = mv.concat(222 / 255); ta = mv.concat(30 / 255); trr = [255, 0, 0, 1]; tgg = [0, 255, 0, 1]; tbb = [0, 0, 255, 1]; }
    eased.total = lerpA(eased.total, tt, k2); eased.title = lerpA(eased.title, tl, k2); eased.coor = lerpA(eased.coor, tc, k2);
    eased.axis = lerpA(eased.axis, ta, k2); eased.r = lerpA(eased.r, trr, k2); eased.g = lerpA(eased.g, tgg, k2); eased.b = lerpA(eased.b, tbb, k2);

    if (P.axisLayer === 0 && P.showAxis) drawAxis(Lx, sT0, sX0);
    var rc = 0, gc = 0, bc = 0;
    for (i = 0; i < cells.length; i++) { var gn = cells[i].gene; if (gn > 2) rc++; else if (gn < -2) gc++; else bc++; }
    var dom = [0, 0, 0];
    if (rc > gc && rc > bc) dom = [255, 0, 0]; else if (gc > rc && gc > bc) dom = [0, 255, 0]; else if (bc > rc && bc > gc) dom = [0, 0, 255];

    pfm('axis+tally'); var L = lay(), M = L.M, G = L.G, fs = L.fs, dh = L.dh;
    var sY = String(Math.round(mouse.y)), sX = String(Math.round(mouse.x)), sT = String(cells.length);
    var vTop = M + dh + L.row + G, vBot = H - M - dh - G, cxm = W / 2, cym = H / 2, topBase0 = M + dh;
    if (P.showHud) {
      ctx.font = fs + 'px "Ca2-Thin", monospace'; ctx.textBaseline = 'alphabetic';
      var hi = 0, put = function (txt, col, align, x, y, ex) {
        ex = ex || 0;
        var hk = hi++;
        ctx.fillStyle = css(col); ctx.textAlign = 'left';
        var lr = inkLR(txt), wEx = (txt.length - 1) * ex, x0 = align === 'right' ? x - lr[1] - wEx : align === 'center' ? x - (lr[0] + lr[1]) / 2 - wEx / 2 : x - lr[0];
        for (var ci = 0; ci < txt.length; ci++) if (fadeA('c' + hk + ':' + ci)) ctx.fillText(txt[ci], x0 + ctx.measureText(txt.slice(0, ci)).width + ci * ex, y);
      };
      // ink-aligned margins: every edge has the same margin M
      // right-edge compensation (owner 21 Oct, font file untouched): on some platforms the final glyph's rsb leaves the
      // word's true ink short of the right margin. Pixel-measure the rendered title line once per layout and shift the
      // word by the residual so the right distance equals the top one. One frame of lag, invisible; margins/font sizes
      // re-measure themselves because they are part of the key.
      if (rsbCache.key !== rsbKey(fs, M, L.ex)) rsbCache = { key: rsbKey(fs, M, L.ex), dx: 0, done: false };
      if (!L.three) rsbScan(fs, dh, M, L.ex); // offscreen and synchronous: the compensation applies in this same frame
      // conditional (owner 21 Oct): only when the three-line title's 3rd line (the mouse-y row) vertically OVERLAPS
      // the left/right numbers on the middle axis - measured ink bands, not a fixed threshold - the numbers leave the
      // axis line and sit on the title's 3rd line, riding down with it as it grows. No overlap: nothing moves. The
      // axis line and the axis centre never move. (Ink bands: digits/caps have no descenders, so a row's ink is
      // [baseline-dh, baseline].) Guard (mobile team edge case, 780x360 ts4): when the page is so short that the 3rd
      // line itself already reaches the bottom numbers row, the move would interleave the numbers with that row -
      // the same collision the rule exists to prevent - so the numbers keep their natural place instead.
      var topBase = M + dh, botBase = H - M, midBase = cym + dh / 2;
      if (L.three) {
        var yRow = topBase + 2 * L.lead;
        if (yRow > midBase - dh && yRow <= botBase - dh) midBase = yRow;
      }
      if (L.three) { // CELLULAR / AUTOMATA / mouse-y, ink-centred, baseline step = cap height + the letter space x the line-space knob
        put(TL, eased.title, 'center', cxm, topBase, L.ex);
        put(TR, eased.title, 'center', cxm, topBase + L.lead, L.ex);
        put(sY, eased.coor, 'center', cxm, topBase + 2 * L.lead);
      } else {
        put(TL, eased.title, 'left', M, topBase, L.ex);
        put(TR, eased.title, 'right', W - M + rsbCache.dx, topBase, L.ex);
        put(sY, eased.coor, 'center', cxm, topBase + L.row);
      }
      put(sX, eased.coor, 'right', W - M, midBase);
      put(sT, eased.total, 'left', M, midBase);
      put(String(bc), eased.b, 'right', W - M, botBase);
      put(String(rc), eased.r, 'left', M, botBase);
      put(String(gc), eased.g, 'center', cxm, botBase);
    }

    pfm('hud text');
    // title circles: hover turns a circle to random black or white (new random pick on every hover); the cursor reacts
    var titleHit = null;
    if (P.showHud && P.titleCircles) {
      ctx.font = fs + 'px "Ca2-Thin", monospace'; ctx.textAlign = 'left';
      ctx.textAlign = 'left'; var lrTL = inkLR(TL), lrTR = inkLR(TR);
      var x0L = L.three ? cxm - (lrTL[0] + lrTL[1]) / 2 - (TL.length - 1) * L.ex / 2 : M - lrTL[0], x0R = L.three ? cxm - (lrTR[0] + lrTR[1]) / 2 - (TR.length - 1) * L.ex / 2 : (W - M + rsbCache.dx) - lrTR[1] - (TR.length - 1) * L.ex;
      var baseTL = topBase0, baseTR = topBase0 + (L.three ? L.lead : 0);
      var u = fs / 1000, R0 = 166.5 * u, hitKey = null, hitC = null; circlesNow = [];
      [[TL, x0L, 'L', baseTL], [TR, x0R, 'R', baseTR]].forEach(function (t) {
        for (var gi = 0; gi < t[0].length; gi++) {
          var cs = GL[t[0][gi]]; if (!cs) continue; var ox = t[1] + ctx.measureText(t[0].slice(0, gi)).width + gi * L.ex;
          for (var ci = 0; ci < cs.length; ci++) {
            var cx2 = ox + cs[ci][0] * u, cy2 = t[3] - cs[ci][1] * u, key = t[2] + gi + '_' + ci;
            circlesNow.push({ key: key, x: cx2, y: cy2, r: R0 });
            if (mouse.over && Math.hypot(mouse.x - cx2, mouse.y - cy2) < R0) { hitKey = key; hitC = { x: cx2, y: cy2, r: R0 }; }
          }
        }
      });
      if (hitKey && hitKey !== lastCircleHit) { circleCol[hitKey] = CIRCLE_COLS[(Math.random() * CIRCLE_COLS.length) | 0]; targetCursorScale = 3.5; cursorScale = 3.5; }
      // hold off: the circle the cursor LEFT reverts too, not only the last one when nothing is hovered (direct circle-to-circle moves used to leave the old color stuck)
      if (lastCircleHit && lastCircleHit !== hitKey && !P.circleHold) delete circleCol[lastCircleHit];
      lastCircleHit = hitKey || '';
      circlesNow.forEach(function (c) { var v = circleCol[c.key]; if (v !== undefined) { ctx.fillStyle = css(v); ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 0.6, 0, 6.2832); ctx.fill(); } });
      if (hitKey) titleHit = { c: hitC, v: circleCol[hitKey] };
    }
    if (P.showFood && P.foodAlpha > 0 && P.foodMode === 2) drawBlobs(); else if (P.showFood && P.foodAlpha > 0 && P.foodMode === 4) drawWorms(); else if (P.showFood && P.foodAlpha > 0 && P.foodMode === 5) drawSpores(); else if (P.showFood && P.foodAlpha > 0) { ctx.globalAlpha = P.foodAlpha; ctx.fillStyle = P.foodColor; var fs = P.foodSize, fh = fs / 2; for (i = 0; i < food.length; i++) if (food[i].r < P.foodShow && introOn(CELL_END + food[i].r * (FOOD_END - CELL_END))) ctx.fillRect(food[i].x - fh, food[i].y - fh, fs, fs); ctx.globalAlpha = 1; } // food first: it sits under the cells
    pfm('sim+ui draw'); curS = DPR * res; if (cells.length || t0 - fadeT0 > INTRO_MS) { var tmb = performance.now(); drawMetaballs(curS); MB.ms = MB.ms * 0.9 + (performance.now() - tmb) * 0.1; MB.path = gOn ? 'GPU' : (WC.ok && !WC.off ? (WC.simd ? 'wasm-simd' : 'wasm') : 'JS'); } pfm('metaballs total'); // an empty intro plate skips the full-buffer pass
    if (P.parasiteOn && parasites.length) { var pc = css(eased.title, 1); ctx.fillStyle = pc; for (i = 0; i < parasites.length; i++) { if (!fadeA('pa' + i)) continue; ctx.beginPath(); ctx.arc(parasites[i].x, parasites[i].y, 2.2, 0, 6.2832); ctx.fill(); } ctx.globalAlpha = 1; }

    // area outline: no rounded corners. Each side stops `corner` px short of both ends, so the corner lines never meet.
    var cr = Math.min(P.containerCorner, cont.w / 2, cont.h / 2);
    lctx.strokeStyle = css(dom, 1); lctx.lineWidth = LW(); lctx.lineCap = 'butt';
    var bxs = [[cont.x + cr, cont.y, cont.x + cont.w - cr, cont.y], [cont.x + cont.w, cont.y + cr, cont.x + cont.w, cont.y + cont.h - cr], [cont.x + cont.w - cr, cont.y + cont.h, cont.x + cr, cont.y + cont.h], [cont.x, cont.y + cont.h - cr, cont.x, cont.y + cr]];
    for (var bi = 0; bi < 4; bi++) if (P.axisWidth > 0 && fadeA('bx' + bi)) { var bq = bxs[bi].map(snapC); lctx.beginPath(); lctx.moveTo(bq[0], bq[1]); lctx.lineTo(bq[2], bq[3]); lctx.stroke(); }

    if (P.axisLayer !== 0 && P.showAxis) drawAxis(L, sT, sX);
    // cursor: ring + dot drawn as a DOM overlay that follows the pointer (identical in every browser); the system cursor is hidden only while it shows
    var eHit = resizeDrag || (mouse.over && !panel.matches(':hover') ? edgeHit(mouse.x, mouse.y) : null);
    if (eHit) {
      var Le = Math.max(10, lay().dh / 2), gE = Math.max(4, Le * 0.22), dE, offE = Le + 2; // vertex one full arm-length out: no arm ever crosses the boundary line
      var rightE = eHit.rx !== undefined ? eHit.rx : mouse.x >= W / 2, downE = eHit.dy !== undefined ? eHit.dy : mouse.y >= H / 2; // a drag keeps the corner it grabbed
      var bxE = rightE ? cont.x + cont.w : cont.x, byE = downE ? cont.y + cont.h : cont.y;
      if (eHit.h && eHit.v) { // corner: the edge icon rotated onto the diagonal, vertex outside the corner, tip facing the plate
        var a0 = rightE ? (downE ? 45 : -45) : (downE ? 135 : -135), r0 = a0 * Math.PI / 180;
        var gC = gE * 1.8, offC = 4.5; // wider gap between the two arms; arms lengthened by the same amount so the visible strokes keep their length; vertex hugs the corner
        dE = anglePath(a0 + 180, Le + (gC - gE), gC, bxE + Math.cos(r0) * offC, byE + Math.sin(r0) * offC); // tip faces the plate
        if (resizeDrag) { // while a corner is dragged all four corner icons stay visible (the plate resizes symmetrically; owner 20 Oct)
          dE = '';
          [[false, false, -135], [true, false, -45], [false, true, 135], [true, true, 45]].forEach(function (q) {
            var rq = q[2] * Math.PI / 180, vx = (q[0] ? cont.x + cont.w : cont.x) + Math.cos(rq) * offC, vy = (q[1] ? cont.y + cont.h : cont.y) + Math.sin(rq) * offC;
            dE += anglePath(q[2] + 180, Le + (gC - gE), gC, vx, vy);
          });
        }
      } else if (eHit.h) { // vertical edge: vertex just outside it, at the pointer's height, tip facing the plate
        dE = anglePath(rightE ? 0 : 180, Le, gE, bxE + (rightE ? offE : -offE), clamp(mouse.y, cont.y, cont.y + cont.h));
      } else { // horizontal edge
        dE = anglePath(downE ? 90 : -90, Le, gE, clamp(mouse.x, cont.x, cont.x + cont.w), byE + (downE ? offE : -offE));
      }
      curEdgePath.setAttribute('d', dE); curEdgePath.setAttribute('stroke', css(dom, 1)); curEdgePath.setAttribute('stroke-width', LW());
      curEdge.style.display = P.axisWidth > 0 ? 'block' : 'none'; curEdge.style.transform = 'translate(0px,0px)';
      curEl.style.display = 'none'; cv.style.cursor = 'none'; curOn0 = false; lockCell = null;
      curInfo = { on: true, edge: true, corner: !!(eHit.h && eHit.v), ring: false };
    } else {
    curEdge.style.display = 'none';
    cursorScale += (targetCursorScale - cursorScale) * 0.75;
    var curOn = false, curRR = 0, curCol = '#000', dotOnly = false;
    if (hovering && mouse.over && hoverCell) { curOn = true; var mxr = 0; for (var q = 0; q < cells.length; q++) { var cq = cells[q]; if (cq.alive && cq.x > cont.x && cq.x < cont.x + cont.w && cq.y > cont.y && cq.y < cont.y + cont.h && cq.radius > mxr) mxr = cq.radius; }
      curMaxR += (mxr - curMaxR) * 0.3; curRR = Math.max(3, curMaxR * P.cursorSize);
      var tnow = performance.now(); if (hoverCell !== lockCell) { lockCell = hoverCell; lockT0 = tnow; } curCol = css(hoverCol, 1); }
    else if (titleHit) { curOn = true; curRR = Math.max(5, titleHit.c.r * 0.55 * (0.8 + 0.2 * cursorScale)); var iv = [255 - titleHit.v[0], 255 - titleHit.v[1], 255 - titleHit.v[2]]; curCol = css(iv); }
    var ringOn = curOn;
    if (!curOn && mouse.over && !panel.matches(':hover')) { curOn = true; dotOnly = true; }
    if (curOn) {
      curEl.style.display = 'block'; curRRnow = curRR;
      curEl.style.width = curEl.style.height = (curRR * 2) + 'px'; curEl.style.borderWidth = dotOnly ? '0px' : LW() + 'px'; curEl.style.borderColor = curCol;
      var dp = 4.4, dcol = titleHit && !(hovering && hoverCell) ? css([255 - titleHit.v[0], 255 - titleHit.v[1], 255 - titleHit.v[2]]) : css(invAt(mouse.x, mouse.y), 1); curDot.style.width = curDot.style.height = dp + 'px'; curDot.style.background = dcol; curDot.style.display = ''; curInfo3 = { dot: dcol, dp: dp };
      var tx = mouse.x, ty = mouse.y, locked = P.cursorLockMs > 0 && hovering && lockCell && lockCell.alive && performance.now() - lockT0 < P.cursorLockMs;
      if (locked) { tx = lockCell.x; ty = lockCell.y; }
      var sens = clamp(P.cursorSens, 0.05, 1), ke = locked ? Math.min(1, sens + 0.1) : sens; curX = curOn0 ? curX + (tx - curX) * ke : tx; curY = curOn0 ? curY + (ty - curY) * ke : ty; curOn0 = true; curInfo2 = { locked: locked, x: curX, y: curY, lx: lockCell ? lockCell.x : 0, ly: lockCell ? lockCell.y : 0 };
      curEl.style.transform = 'translate(' + (curX - curRR) + 'px,' + (curY - curRR) + 'px)';
      cv.style.cursor = 'none';
    } else { curEl.style.display = 'none'; cv.style.cursor = 'default'; curOn0 = false; lockCell = null; }
    curInfo = { on: curOn, ring: ringOn, dot: curInfo3.dot, dp: curInfo3.dp, lx: curInfo2.lx, ly: curInfo2.ly, locked: curInfo2.locked, maxR: curMaxR, cx: curX, cy: curY, rr: curRR, col: curCol, title: !!titleHit };
    }

     var pairN = 0, compN = 0; for (var pci = 0; pci < cells.length; pci++) { if (cells[pci].sym) pairN++; if (cells[pci].comp > 1) compN++; }
     window.__ca2 = { SIMW: SIMW, cmpWC: function () { if (!WC.ok) return 'nowasm:' + WC.err; var S = curS, sv = ctx.drawImage; ctx.drawImage = function () {}; var o = WC.off; var fdef = WC.field; WC.field = WC.fieldX; WC.off = false; var t0 = performance.now(); drawMetaballsCPU(S); var tw = performance.now() - t0; var a = new Uint8ClampedArray(img.data); WC.off = true; t0 = performance.now(); drawMetaballsCPU(S); var tj = performance.now() - t0; var b = new Uint8ClampedArray(img.data); WC.off = o; var fsv = fdef; WC.field = WC.fieldF; WC.off = false; t0 = performance.now(); drawMetaballsCPU(S); var tf = performance.now() - t0; var c32 = new Uint8ClampedArray(img.data); WC.field = fsv; WC.off = o; var d32 = 0, m32 = 0, ge2 = 0; for (var i = 0; i < b.length; i++) { var dd = Math.abs(c32[i] - b[i]); if (dd) { d32++; if (dd > m32) m32 = dd; if (dd > 2) ge2++; } } ctx.drawImage = sv; var bad = 0, mx = 0; for (var i = 0; i < a.length; i++) { var d = Math.abs(a[i] - b[i]); if (d) { bad++; if (d > mx) mx = d; } } return JSON.stringify({ bytes: a.length, diffBytes: bad, maxDiff: mx, tWasm: +tw.toFixed(1), tJS: +tj.toFixed(1), tF32: +tf.toFixed(1), f32diff: d32, f32max: m32, f32gt2: ge2, cells: cells.length }); }, WC: WC, PF: PF, pairs: pairN / 2, fusions: ev.fuse || 0, pairings: ev.pair || 0, composites: compN, cmp: function () { if (!gOK) return 'nogl'; var S = curS, sv = ctx.drawImage; var saved = ctx.drawImage; ctx.drawImage = function () {}; var t0 = performance.now(); drawMetaballs(S); var tg = performance.now() - t0; t0 = performance.now(); drawMetaballsCPU(S); var tc = performance.now() - t0; ctx.drawImage = saved; var tmp = document.createElement('canvas'); tmp.width = glc.width; tmp.height = glc.height; var tx = tmp.getContext('2d'); tx.drawImage(glc, 0, 0); var gd = tx.getImageData(0, 0, tmp.width, tmp.height).data, cd = img.data, n = tmp.width * tmp.height, bad = 0, mx = 0, sum = 0, lit = 0; for (var p = 0; p < n; p++) { var q = p * 4, ga = gd[q + 3], ca = cd[q + 3]; var d = Math.abs(ga - ca); if (ca > 0 || ga > 0) { lit++; if (ca > 250 && ga > 250) d = Math.max(d, Math.abs(gd[q] - cd[q]), Math.abs(gd[q + 1] - cd[q + 1]), Math.abs(gd[q + 2] - cd[q + 2])); } if (d > 8) bad++; if (d > mx) mx = d; sum += d; } return JSON.stringify({ px: n, lit: lit, bad: bad, maxd: mx, tGPUms: +tg.toFixed(1), tCPUms: +tc.toFixed(1), cells: gSnap && gSnap.n }); }, gpuState: function () { return { ok: gOK, on: gOn, n: gSnap && gSnap.n }; }, setGPU: function (v) { gOK = !!v && !!gl; }, colorAt: colorAt, setKey: function (k, v) { P[k] = v; applyKey(k, v); if (k === 'lineColor' || k === 'ruleColor' || k === 'circColor') applyLineColor(); touched[k] = 1; save(); }, cont: cont, liveTest: function (k, gens) { var q = keyToQ[k]; liveStart(k, q, P[k], { classList: { add: function () {}, remove: function () {} }, style: { setProperty: function () {}, removeProperty: function () {} } }); var lastF, lastF2, run = 0, maxRun = 0, sumAbs = 0, bins = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], t = performance.now(), mn = 1e9, mx = -1e9, saveP = P[k]; for (var g = 0; g < gens; g++) { t += LIVE_MS; stepLive(t); var f = (P[k] - q[2]) / (q[3] - q[2]); bins[Math.min(19, Math.floor(clamp(f, 0, 0.9999) * 20))]++; if (Math.abs(f - (lastF === undefined ? -9 : lastF)) < 0.01) { run++; maxRun = Math.max(maxRun, run); } else run = 0; lastF = f; sumAbs += lastF2 === undefined ? 0 : Math.abs(f - lastF2); lastF2 = f; mn = Math.min(mn, P[k]); mx = Math.max(mx, P[k]); } var cov = bins.filter(function (x) { return x > 0; }).length / 20; delete live[k]; P[k] = saveP; applyKey(k, saveP); return { key: k, min: q[2], max: q[3], seenMin: mn, seenMax: mx, coverage20: cov, bins: bins, maxRunGens: maxRun, meanStep: sumAbs / gens }; }, introStat: introStat, sim: function () { return { UI_END: UI_END, CELL_END: CELL_END, FOOD_END: FOOD_END }; }, fadeK: fadeK, INTRO: INTRO_MS, drag: function () { return resizeDrag; }, clampTargets: clampTargets, blobs: blobs, blobStat: blobStat, swStat: swStat, worms: worms, wormStat: wormStat, spores: spores, sporeStat: sporeStat, srcStat: function () { return { n: SRC.n, cells: SRC.cells }; }, shapeStat: function () { var t0 = frameT || performance.now(), asps = [], strings = 0, lobed = 0, rounds = 0, srcs = 0, i, a2, b2; for (i = 0; i < cells.length; i++) { var c = cells[i]; if (!c.alive) continue; var o = { x: [], y: [], r: [], n: 0 }; emitCell(c, t0, 99, o); srcs += o.n; var sh = c.shp || { t: 0 }; if (sh.t === 1) strings++; else if (sh.t === 2) lobed++; else rounds++; var mn = 1e9, mx = 0; for (a2 = 0; a2 < o.n; a2++) { mn = Math.min(mn, o.r[a2]); for (b2 = a2; b2 < o.n; b2++) mx = Math.max(mx, Math.hypot(o.x[a2] - o.x[b2], o.y[a2] - o.y[b2]) + o.r[a2] + o.r[b2]); } asps.push(mx / (2 * mn)); } asps.sort(function (x, y) { return x - y; }); var mean = 0; for (i = 0; i < asps.length; i++) mean += asps[i]; mean = asps.length ? mean / asps.length : 1; var sd = 0; for (i = 0; i < asps.length; i++) sd += (asps[i] - mean) * (asps[i] - mean); sd = asps.length ? Math.sqrt(sd / asps.length) : 0; var hist = [0, 0, 0, 0, 0, 0, 0], cuts = [1.05, 1.5, 2, 3, 4.5, 7, 12]; for (i = 0; i < asps.length; i++) { var bi = 0; while (bi < 6 && asps[i] >= cuts[bi]) bi++; hist[bi]++; } return { cells: asps.length, rounds: rounds, strings: strings, lobed: lobed, geneticSources: srcs, aspectMean: +mean.toFixed(3), aspectSd: +sd.toFixed(3), aspectMin: asps.length ? +asps[0].toFixed(2) : 1, aspectMed: asps.length ? +asps[Math.floor(asps.length / 2)].toFixed(2) : 1, aspectMax: asps.length ? +asps[asps.length - 1].toFixed(2) : 1, hist: hist }; }, live: live, P: P, getCells: function () { return cells; }, getFood: function () { return food; }, parStat: parStat, foodStat: foodStat, cont: cont, vTop: vTop, vBot: vBot, gap: G, margin: M, midBase: midBase, lead: L.lead, topInkBottom: M + dh, botInkTop: H - M - dh, hL: axisInfo.hL || 0, oob: ev.oob, maxOut: maxOut, births: ev.birth, deaths: ev.death, trans: !!trans, circles: circlesNow, parasites: parasites.length, clusters: clusterCount, merges: ev.merge || 0, eaten: ev.eaten || 0, divides: ev.divide || 0, pbirth: ev.pbirth || 0, pdeath: ev.pdeath || 0, env: env, getParasites: function () { return parasites; }, cur: curInfo, W: W, H: H, res: res, cells: cells.length, areaTop: cont.y, areaBottom: cont.y + cont.h, areaLeft: cont.x, areaRight: cont.x + cont.w, safeW: L.safeW, safeH: L.safeH };

    if (autoRefresh && performance.now() - lastRefresh > refreshInterval * 1000) {
      // never re-deal the universe mid-configuration: while the config area is in use (panel open, lane/panel hovered,
      // plate dragged) the timer just postpones, so the plate and its lines stay put under the user's hands (owner 20 Oct)
      if (panel.classList.contains('open') || panel.classList.contains('hov') || resizeDrag) lastRefresh = performance.now();
      else randomize();
    }
    stepLive(t0);
    syncUI(rc + gc + bc);
    var lum = (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]), fgc = lum > 128 ? '17,17,17' : '240,240,240', root = document.documentElement.style;
    root.setProperty('--fg', 'rgb(' + fgc + ')'); root.setProperty('--fg-soft', 'rgba(' + fgc + ',.35)'); root.setProperty('--bg', css(bg, 1)); root.setProperty('--panel-bg', css(bg, P.panelAlpha));
    // sound: the automaton's state drives the noise
    if (window.CA2Audio) {
      var spd = 0, mx = 0, nn = cells.length || 1; for (i = 0; i < cells.length; i++) { spd += Math.hypot(cells[i].vx, cells[i].vy); mx += cells[i].x; }
      CA2Audio.update({ density: clamp(cells.length / Math.max(20, P.UNIVERSE_SIZE * 1.5), 0, 1), activity: clamp(spd / nn / 15, 0, 1), pan: ((mx / nn) - W / 2) / (W / 2), birth: ev.birth - aev.b, death: ev.death - aev.d, hit: ev.hit - aev.h }, P);
      aev.b = ev.birth; aev.d = ev.death; aev.h = ev.hit;
    }
    applyDof(); // depth of field lives in the scene canvas now, so the grain pass lands on top of it (owner 21 Oct)
    if (window.CA2Grain && CA2Grain.ok && P.grain && t0 - fadeT0 >= INTRO_MS + 400) { // grain is the last layer to join, clear of the intro
      cvg.style.display = 'block';
      CA2Grain.render(cv, { amount: P.grainAmount, strength: P.grainStrength, size: P.grainSize, softness: P.grainSoft, chroma: P.grainChroma, development: P.grainDev, fine: P.grainFine, crystal: P.grainCrystal, cloud: P.grainCloud }, P.grainFps > 0 ? Math.floor(performance.now() / 1000 * P.grainFps) : 0, DPR);
    } else cvg.style.display = 'none';
    pfm('grain+rest');
    // quality governor: keeps the frame rate by lowering resolution, raises it back when there is room
    var execMs0 = performance.now() - t0;
    if (t0 - fadeT0 <= INTRO_MS + 1000) { introStat.frames++; if (execMs0 > 1000 / P.fps * 1.5) introStat.jank++; if (execMs0 > introStat.worst) introStat.worst = Math.round(execMs0); }
    frameMs = lerp(frameMs, execMs0, 0.1);
    if (P.autoQuality) {
      var budget = 1000 / P.fps;
      if (frameMs > budget * 0.9) res = Math.max(0.35, res * 0.94); else if (frameMs < budget * 0.45) res = Math.min(P.resolution, res * 1.03);
      res = Math.min(res, P.resolution);
    } else res = P.resolution;
  }

  // ---- living knobs: double-click a knob and its parameter enters a 1-D cellular-automaton life cycle between its floor and ceiling
  // (rule 110 on a ring; value = linear function of the alive fraction). Double-click again returns to the value from before. The stored config always holds the pre-CA value.
  var live = {}, hovCA = {};
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function lcg(st) { st.s = (Math.imul(st.s, 1664525) + 1013904223) >>> 0; return st.s / 4294967296; }
  var LIVE_N = 28, LIVE_RULE = 110, LIVE_MS = 110, LIVE_COLS = ['#ff0000', '#00ff00', '#0000ff'];
  var LIVE_CAP = { audioVol: 0.35 }; // keep live volume gentle
  // plate occupancy ring: the plate is cut into n vertical sectors; a sector is 'alive' when it holds at least the average number of cells
  function plateOcc(n) {
    var cnt = new Array(n).fill(0), i, tot = 0;
    for (i = 0; i < cells.length; i++) { var c = cells[i], s = clamp(Math.floor((c.x - cont.x) / Math.max(1, cont.w) * n), 0, n - 1); cnt[s]++; tot++; }
    var mean = tot / n, out = new Array(n); for (i = 0; i < n; i++) out[i] = cnt[i] > mean ? 1 : 0; return out;
  }
  // smart auto knobs: each parameter gets its own motion profile derived from its GROUPS meta
  // (range and quantum) instead of one hardcoded chase. A knob with hundreds of steps drifts
  // slowly through them, a knob with three steps snaps. The chase is a velocity model, so the
  // value accelerates when the target moves away and slows down as it arrives.
  function liveProfile(q, plate) {
    var range = q[3] - q[2], n = Math.max(1, Math.round(range / q[4]));
    var speed = clamp(1.8 / Math.sqrt(n + 2), 0.025, 0.45);              // top speed, fraction of range per tick
    var accel = clamp(0.05 + 0.5 / (1 + n / 12), 0.06, 0.5);            // velocity gain toward the target
    var damp = clamp(0.9 - 0.12 * Math.min(1, Math.log(n + 1) / Math.log(1000)), 0.74, 0.9);
    if (plate) { speed *= 0.2; accel *= 0.35; }                         // audio knobs keep their gentler motion
    return { vmax: range * speed, accel: accel, damp: damp };
  }
  function liveStart(k, q, orig, row) {
    var st = { s: hash(k) || 1 }, bits = [];
    for (var i = 0; i < LIVE_N; i++) bits.push(lcg(st) < 0.5 ? 1 : 0);
    var plate = /^audio/.test(k);
    live[k] = { orig: orig, bits: bits, st: st, t: performance.now(), cur: orig, vel: 0, q: q, row: row, col: LIVE_COLS[Math.floor(Math.random() * 3)], gen: 0, lastQ: orig, plate: plate, prof: liveProfile(q, plate), shift: hash(k) % LIVE_N, rule: plate ? [110, 30, 90, 54][hash(k) % 4] : LIVE_RULE };
    row.classList.add('live'); row.style.setProperty('--kc', live[k].col);
  }
  function liveStop(k) {
    var L = live[k]; if (!L) return; L.row.classList.remove('live'); L.row.style.removeProperty('--kc');
    delete live[k]; P[k] = L.orig; if (typeof touched === 'object') touched[k] = 1; applyKey(k, L.orig); save();
  }
  function stepLive(now) {
    for (var k in live) {
      var L = live[k], n = L.bits.length;
      if (now - L.t >= LIVE_MS) {
        L.t = now; L.gen++;
        var nb = new Array(n), sum = 0, same = true, i;
        for (i = 0; i < n; i++) { nb[i] = (L.rule >> (L.bits[(i + n - 1) % n] * 4 + L.bits[i] * 2 + L.bits[(i + 1) % n])) & 1; sum += nb[i]; if (nb[i] !== L.bits[i]) same = false; }
        if (L.plate) { var occ = plateOcc(n); sum = 0; for (i = 0; i < n; i++) { nb[i] ^= occ[(i + L.shift) % n]; sum += nb[i]; } same = false; }
        if (sum === 0 || sum === n || same) { for (i = 0; i < 3; i++) nb[Math.floor(lcg(L.st) * n)] ^= 1; if (sum === 0) nb[Math.floor(lcg(L.st) * n)] = 1; } // keep it alive, deterministically
        L.bits = nb;
        var a = clamp((nb.reduce(function (x, y) { return x + y; }, 0) / n - 0.2) / 0.6, 0, 1);
        if (L.plate) a = clamp(a * 0.45 + 0.55 * clamp(cells.length / 250, 0, 1), 0, 1);
        // the value follows the CA: a window of the row is read as a binary fraction (so the whole range is reachable and
        // every part is equally likely), one random cell is flipped every generation so the row never settles into a cycle,
        // and the value chases that reading with a soft step - never stuck, never a ceiling-floor sweep
        nb[Math.floor(lcg(L.st) * n)] ^= 1; L.bits = nb;
        var r0 = (L.gen * 7 + L.shift) % n, rd = 0, wt = 0.5;
        for (i = 0; i < 12; i++) { rd += nb[(r0 + i) % n] * wt; wt *= 0.5; }
        rd = clamp(rd * 4096 / 4095, 0, 1);
        // the reading is mapped through its own running distribution (rank), so the whole range is used evenly
        if (!L.hist) L.hist = [];
        var lo = 0; for (i = 0; i < L.hist.length; i++) if (L.hist[i] < rd) lo++;
        var rk = L.hist.length > 8 ? (lo + lcg(L.st)) / (L.hist.length + 1) : rd;
        L.hist.push(rd); if (L.hist.length > 300) L.hist.shift();
        if (L.walk === undefined) L.walk = rk;
        L.walk += (rk - L.walk) * 0.7;
        a = clamp(0.5 + (L.walk - 0.5) * 1.3, 0, 1); // a little stretch so both ends are actually touched
        L.target = L.q[2] + (L.q[3] - L.q[2]) * a * (LIVE_CAP[k] || 1);
      }
      if (L.target === undefined) continue;
      var pr = L.prof, dT = L.target - L.cur;
      L.vel = clamp((L.vel + dT * pr.accel) * pr.damp, -pr.vmax, pr.vmax);
      L.cur += L.vel;
      var v = clamp(Math.round((L.cur - L.q[2]) / L.q[4]) * L.q[4] + L.q[2], L.q[2], L.q[3]);
      if (v !== L.lastQ) { L.lastQ = v; P[k] = v; applyKey(k, v); }
    }
  }
  // ---- persistence: every config key, versioned; unknown/removed keys are ignored, new keys keep defaults ----
  var STORE = 'ca2.config', STORE_V = 6, savedLive = {};
  (function load() {
    try {
      var sv = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (!sv || typeof sv !== 'object') return;
      if (sv.live && typeof sv.live === 'object') savedLive = sv.live;
      var p = sv.P || {};
      Object.keys(p).forEach(function (k) { if (k in P && typeof p[k] === 'number' && isFinite(p[k])) P[k] = p[k]; });
      if (typeof p.foodColor === 'string' && /^#[0-9a-f]{6}$/i.test(p.foodColor)) P.foodColor = p.foodColor;
      if (typeof p.lineColor === 'string' && /^#[0-9a-f]{6}$/i.test(p.lineColor)) P.lineColor = p.lineColor;
      ['axisColor', 'circColor', 'ruleColor'].forEach(function (k) { if (typeof p[k] === 'string' && /^#[0-9a-f]{6}$/i.test(p[k])) P[k] = p[k]; });
      if (typeof sv.autoRefresh === 'boolean') autoRefresh = sv.autoRefresh;
      if (typeof sv.lockParams === 'boolean') lockParams = sv.lockParams;
      if (sv.bgTarget && sv.bgTarget.length === 3) { bgTarget = sv.bgTarget.slice(); bg = sv.bgTarget.slice(); }
      if (typeof sv.bgIndex === 'number') bgIndex = sv.bgIndex;
    } catch (e) {}
  })();
  // old configs stored foodEatR as a factor of the cell radius; the fixed px radius migrates them once
  if (P.foodEatR <= 1) P.foodEatR = Math.round(P.foodEatR * DEFAULTS.CELL_RADIUS * 100) / 100;
  function liveMap() { var m = {}; for (var lk in live) m[lk] = live[lk].orig; return m; }
  function save() { try { var Pc = Object.assign({}, P); for (var lk in live) Pc[lk] = live[lk].orig; localStorage.setItem(STORE, JSON.stringify({ v: STORE_V, P: Pc, live: liveMap(), autoRefresh: autoRefresh, lockParams: lockParams, bgTarget: bgTarget, bgIndex: bgIndex })); } catch (e) {} }
  // ---- config panel: every parameter ----
  var rows = {}, statsEl = document.getElementById('stats'), ctl = document.getElementById('controls'), btns = document.getElementById('btns');
  var GROUPS = [
    ['picture', [
      ['resolution', 'resolution', 0.25, 1, 0.01], ['pixelRatio', 'pixel ratio (0 = auto)', 0, 3, 0.25], ['fps', 'fps', 5, 120, 1],
      ['margin', 'margin (all edges)', 0, 120, 1], ['gap', 'line gap to numbers', 0, 60, 1],
      ['textScale', 'type size', 0.5, TYPE_SIZE_MAX, 0.005], ['titleLead', 'line space (title)', 0.5, 3, 0.05], ['titleTrack', 'letter space (title)', 0.5, 2, 0.01], ['containerCorner', 'corner gap', 0, 80, 1],
      ['centerGap', 'center gap (axis crossing)', 0, 120, 1], ['diagLen', 'diagonal length', 0.2, 1.3, 0.01], ['axisWidth', 'line width (all lines)', 0, 6, 0.1],
      ['areaMin', 'area floor', 0.1, 1, 0.01], ['areaMax', 'area ceiling', 0.1, 1, 0.01],
      ['morphEase', 'area morph speed', 0.02, 1, 0.01], ['colorSpeed', 'color speed', 0.02, 1, 0.01]]],
    ['panel', [
      ['panelAlpha', 'config opacity', 0, 1, 0.01], ['cfgFontSize', 'config font size px', 8, 28, 1], ['panelWidth', 'config width px', 200, 600, 5], ['blurWidth', 'backdrop blur width px', 0, 600, 5], ['blurStrength', 'backdrop blur strength px', 0, 64, 1],
      ['focusIdleMs', 'idle focus wait ms', 500, 20000, 100], ['focusInMs', 'idle blur-in ms', 500, 12000, 100], ['focusOutMs', 'refocus snap ms', 60, 3000, 10], ['focusDepth', 'idle blur depth px', 0, 64, 1]]],
    ['cursor', [
      ['cursorSens', 'cursor sensitivity', 0.05, 1, 0.01], ['cursorSize', 'cursor size (x largest cell)', 0.2, 2, 0.01], ['cursorLockMs', 'cursor lock ms', 0, 3000, 50]]],
    ['grain', [
      ['grainAmount', 'amount', 0, 2, 0.01], ['grainStrength', 'strength', 0, 10, 0.1], ['grainSize', 'size px', 0.3, 6, 0.1],
      ['grainSoft', 'softness', 0, 1, 0.01], ['grainChroma', 'chroma split', 0, 1, 0.01], ['grainDev', 'development', 0.1, 1.5, 0.01],
      ['grainFine', 'fine weight', 0, 1, 0.01], ['grainCrystal', 'crystal weight', 0, 1, 0.01], ['grainCloud', 'cloud weight', 0, 1, 0.01],
      ['grainFps', 'grain fps (0 = still)', 0, 60, 1]]],
    ['cells', [
      ['UNIVERSE_SIZE', 'universe', 1, 400, 1], ['CELL_RADIUS', 'cell r', 2, 100, 1], ['minRadius', 'cell r min', 1, 50, 1], ['maxRadius', 'cell r max', 5, 150, 1],
      ['baseMaxSpeed', 'speed', 0.5, 25, 0.5], ['maxSpeedVariation', 'speed variation', 0, 30, 0.5],
      ['interactionRadius', 'interaction r', 5, 100, 1], ['baseMutationRate', 'mutation', 0.5, 20, 0.5], ['mutationRateRange', 'mutation range', 0.5, 8, 0.5],
      ['energyConsumptionRate', 'energy use', 0, 0.5, 0.002], ['energyGainFromInteraction', 'energy gain', 0, 0.05, 0.001], ['minEnergyForReproduction', 'repro energy', 0.05, 10, 0.05],
      ['slowDownRadius', 'mouse slow r', 0, 100, 1], ['speedReductionFactor', 'mouse slow x', 1, 100, 0.5]]],
    ['evolution', [
      ['genomeMut', 'genome mutation', 0, 0.5, 0.01], ['divideAt', 'divide at size (x radius)', 1.2, 6, 0.1], ['eatRatio', 'eat when size ratio >', 1.05, 3, 0.05], ['eatChance', 'eat chance', 0, 1, 0.01],
      ['mergeChance', 'merge chance', 0, 0.3, 0.005], ['mergeGene', 'merge gene distance', 0, 36, 1], ['clusterCohesion', 'cluster cohesion', 0, 1, 0.01], ['clusterMax', 'cluster max size', 2, 30, 1],
      ['parasiteFrac', 'parasite share', 0, 0.5, 0.01], ['parasiteDrain', 'parasite drain', 0, 0.2, 0.005], ['parasiteEff', 'parasite efficiency', 0, 1, 0.01], ['selStrength', 'selection strength', 0, 4, 0.05]]],
    ['life', [
      ['boundGap', 'wall gap px (every cell)', 0, 200, 1], ['boundZone', 'boundary awareness zone', 0, 200, 1], ['dragMargin', 'drag resize viewport margin px', 0, 100, 1], ['edgeGrab', 'border grab width px', 3, 40, 1], ['restless', 'cell restlessness while resizing', 0, 3, 0.05], ['boundForce', 'boundary push', 0, 3, 0.05], ['cellMorphMs', 'metamorphosis time ms', 100, 6000, 50]]],
    ['sound', [
      ['audioVol', 'volume', 0, 1, 0.01], ['audioTone', 'tone (cutoff Hz)', 200, 8000, 10], ['audioMod', 'CA modulation', 0, 1, 0.01],
      ['audioCrackle', 'micro events', 0, 1, 0.01], ['audioMicroPitch', 'micro pitch Hz', 200, 4000, 10], ['audioMicroDecay', 'micro decay ms', 10, 400, 1], ['audioMicroRand', 'micro randomness', 0, 1, 0.01], ['audioWidth', 'stereo width', 0, 1, 0.01]]],
    ['field', [
      ['THRESHOLD', 'metaball threshold', 0.05, 0.6, 0.01], ['metaballStrength', 'metaball strength', 0.005, 0.1, 0.001],
      ['foodDensity', 'food density', 0, 0.1, 0.005], ['foodEnergyValue', 'food energy', 0, 20, 0.5], ['foodGrowAmt', 'growth per food (px)', 0, 5, 0.05], ['plateOverlap', 'plate over text (x text size)', 0, 0.5, 0.01], ['parasiteHard', 'parasite resilience', 0, 40, 0.5], ['parasiteNerv', 'parasite nervousness', 0, 1, 0.01], ['parasiteHardMs', 'parasite starve delay ms', 0, 60000, 500], ['foodEatR', 'eating radius px', 2, 100, 0.5], ['foodLifeMs', 'food life step ms', 50, 2000, 10], ['foodLifeCell', 'food life lattice px', 1, 20, 0.5], ['foodGrowMax', 'max growth (x radius)', 1, 8, 0.1], ['foodShrink', 'shrink back (px/frame)', 0, 0.5, 0.005],
      ['foodAlpha', 'food dot opacity', 0, 1, 0.01], ['foodSize', 'food dot size px', 0.5, 12, 0.5], ['foodShow', 'food dot frequency', 0, 1, 0.01],
      ['minRefreshInterval', 'refresh min s', 2, 60, 1], ['maxRefreshInterval', 'refresh max s', 3, 90, 1]]]
  ];
  var layoutKeys = { margin: 1, gap: 1, textScale: 1, areaMin: 1, areaMax: 1 };
  // every change takes effect at once, without a respawn
  function applyKey(k, v) {
    if (k === 'CELL_RADIUS') { P.CELL_RADIUS = v = clamp(v, P.minRadius, P.maxRadius); cells.forEach(function (c) { c.radius = v; }); }
    else if (k === 'minRadius' || k === 'maxRadius') { P.CELL_RADIUS = clamp(P.CELL_RADIUS, P.minRadius, Math.max(P.minRadius, P.maxRadius)); cells.forEach(function (c) { c.radius = P.CELL_RADIUS; }); }
    else if (k === 'pixelRatio') resizeCanvas();
    else if (k === 'panelWidth' && panel) panel.style.width = v + 'px';
    else if (k === 'blurWidth') { if (blurEl) blurEl.style.width = v + 'px'; if (blurLEl) blurLEl.style.width = v + 'px'; }
    else if (k === 'blurStrength') document.documentElement.style.setProperty('--bmax', v + 'px');
    else if (k === 'margin') document.documentElement.style.setProperty('--m', v + 'px');
    else if (k === 'resolution') res = v;
    else if (k === 'axisWidth') applyLW();
    else if (k === 'cfgFontSize') applyTypo();
    else if (layoutKeys[k]) clampTargets();
    else if (k === 'baseMaxSpeed' || k === 'maxSpeedVariation') cells.forEach(function (c) { c.maxSpeed = speedOf(c); });
    else if (k === 'UNIVERSE_SIZE') {
      var n = Math.round(v), gx = cont.x, gy = cont.y;
      while (cells.length < n) cells.push(new Cell(gx + rnd(cont.w), gy + rnd(cont.h), Math.floor(rnd(P.GENE_MIN, P.GENE_MAX + 1)), P.baseMutationRate + rnd(-P.mutationRateRange, P.mutationRateRange)));
      while (cells.length > n) cells.splice(Math.floor(rnd(cells.length)), 1);
    }
    else if (k === 'foodDensity') {
      var nf = Math.round(cont.w * cont.h * P.foodDensity / 2);
      while (food.length < nf) food.push({ x: cont.x + rnd(cont.w), y: cont.y + rnd(cont.h), r: Math.random() });
      if (food.length > nf) food.length = nf;
    }
    else if (k === 'minRefreshInterval' || k === 'maxRefreshInterval') newRefresh();
  }
  function fmt(v) { return Math.abs(v) >= 100 ? String(Math.round(v)) : String(Math.round(v * 1000) / 1000); }
  var lockBox, lockVal;
  var touched = {}; // keys the user actually edited; admin push writes only these
  var SECS = [];
  GROUPS.forEach(function (grp) {
    var h = document.createElement('div'); h.className = 'grp'; h.textContent = grp[0]; ctl.appendChild(h);
    var sec = { name: grp[0], hdr: h, els: [] }; SECS.push(sec);
    grp[1].forEach(function (q) {
      var d = document.createElement('div'); d.className = 'row';
      d.innerHTML = '<div class="lab"><span>' + q[1] + '</span><b style="font-weight:normal"></b></div><input type="range" min="' + q[2] + '" max="' + q[3] + '" step="' + q[4] + '">';
      var inp = d.querySelector('input'), val = d.querySelector('b');
      // double-click the value: type it by hand (may pass the knob's floor/ceiling; the knob itself stays inside them)
      val.addEventListener('click', function (e) {
        e.stopPropagation();
        if (d.querySelector('.man')) return;
        var k = q[0];
        var ed = document.createElement('input'); ed.type = 'text'; ed.className = 'man'; ed.value = fmt(P[k]);
        ed.setAttribute('inputmode', 'decimal'); ed.spellcheck = false; ed.autocomplete = 'off';
        var labH = val.parentNode.offsetHeight;
        ed.style.height = labH + 'px'; ed.style.lineHeight = labH + 'px';
        ed.style.caretColor = ['#ff0000', '#00ff00', '#0000ff'][Math.floor(Math.random() * 3)];
        val.style.display = 'none'; val.parentNode.appendChild(ed);
        ed.focus({ preventScroll: true }); ed.select();
        var done = false;
        var fin = function (commit) {
          if (done) return; done = true;
          var t = ed.value.trim().replace(',', '.');
          if (commit && /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) {
            var v = parseFloat(t);
            if (isFinite(v)) {
              if (live[k]) liveStop(k);
              P[k] = v; touched[k] = 1; applyKey(k, v); inp.value = v; val.textContent = fmt(v);
              if (/UNIVERSE|CELL_RADIUS|Mutation|interaction|Rate/.test(k)) { lockParams = true; if (lockBox) { lockBox.checked = true; lockVal.textContent = 'locked'; } }
              save();
            }
          }
          ed.remove(); val.style.display = '';
        };
        ed.addEventListener('keydown', function (ev) { ev.stopPropagation(); if (ev.key === 'Enter') fin(true); else if (ev.key === 'Escape') fin(false); });
        ed.addEventListener('blur', function () { fin(true); });
      });
      var downVal = null;
      inp.addEventListener('pointerdown', function () { if (!live[q[0]]) downVal = P[q[0]]; });
      inp.addEventListener('dblclick', function () {
        var k = q[0];
        if (live[k]) { liveStop(k); inp.value = P[k]; val.textContent = fmt(P[k]); return; }
        var o = downVal === null ? P[k] : downVal; P[k] = o; touched[k] = 1; applyKey(k, o); inp.value = o; val.textContent = fmt(o); liveStart(k, q, o, d); save();
      });
      // hover: the thumb stirs with a small rule-110 life of its own (visual only, value untouched)
      inp.addEventListener('pointerenter', function () {
        inp.style.setProperty('--hc', ['#ff0000', '#00ff00', '#0000ff'][Math.floor(Math.random() * 3)]);
        var k = q[0]; if (hovCA[k]) return;
        var st = { s: (hash(k) ^ 0x9e37) || 7 }, bits = [];
        for (var i = 0; i < 16; i++) bits.push(lcg(st) < 0.5 ? 1 : 0);
        hovCA[k] = { bits: bits, st: st, dx: 0, t: setInterval(function () {
          var hh = hovCA[k]; if (!hh || inp.matches(':active')) return;
          var nb = new Array(16), sum = 0;
          for (var i = 0; i < 16; i++) { nb[i] = (110 >> (hh.bits[(i + 15) % 16] * 4 + hh.bits[i] * 2 + hh.bits[(i + 1) % 16])) & 1; sum += nb[i]; }
          if (sum === 0 || sum === 16) nb[Math.floor(lcg(hh.st) * 16)] ^= 1;
          hh.bits = nb;
          hh.dx = clamp(hh.dx + (nb[0] + nb[5] + nb[10] - 1.5) * 2 + (lcg(hh.st) - 0.5) * 2, -6, 6);
          inp.style.setProperty('--kx', hh.dx.toFixed(1) + 'px');
          inp.style.setProperty('--ks', (1 + sum / 16 * 0.4).toFixed(2));
        }, LIVE_MS) };
      });
      inp.addEventListener('pointerleave', function () {
        var k = q[0], hh = hovCA[k]; if (!hh) return;
        clearInterval(hh.t); delete hovCA[k];
        inp.style.setProperty('--kx', '0px'); inp.style.setProperty('--ks', '1');
      });
      inp.addEventListener('input', function () {
        if (live[q[0]]) { inp.value = P[q[0]]; return; }
        var v = parseFloat(inp.value); P[q[0]] = v; touched[q[0]] = 1; val.textContent = fmt(v);
        applyKey(q[0], v);
        if (q[0] === 'fps') { /* nothing */ } else if (/UNIVERSE|CELL_RADIUS|Mutation|interaction|Rate/.test(q[0])) { lockParams = true; if (lockBox) { lockBox.checked = true; lockVal.textContent = 'locked'; } }
        save();
      });
      inp.value = P[q[0]]; val.textContent = fmt(P[q[0]]);
      ctl.appendChild(d); rows[q[0]] = { inp: inp, val: val, row: d }; sec.els.push(d);
    });
  });
  var keyToQ = {}; GROUPS.forEach(function (g) { g[1].forEach(function (q) { keyToQ[q[0]] = q; }); });
  Object.keys(savedLive).forEach(function (k) {
    if (keyToQ[k] && rows[k] && typeof savedLive[k] === 'number' && isFinite(savedLive[k])) liveStart(k, keyToQ[k], savedLive[k], rows[k].row);
  });
  function toggle(label, init, fn, words) {
    words = words || ['on', 'off'];
    var l = document.createElement('label'); l.className = 'chk';
    l.innerHTML = '<span>' + label + '</span><b>' + (init ? words[0] : words[1]) + '</b><input type="checkbox" style="display:none"' + (init ? ' checked' : '') + '>';
    var c = l.querySelector('input'), b = l.querySelector('b');
    c.addEventListener('change', function () { b.textContent = c.checked ? words[0] : words[1]; var bef = Object.assign({}, P); fn(c.checked); for (var k in P) if (P[k] !== bef[k]) touched[k] = 1; save(); });
    ctl.appendChild(l); return { box: c, val: b, el: l };
  }
  function choice(label, key, opts, fn) {
    var l = document.createElement('label'); l.className = 'chk';
    l.innerHTML = '<span>' + label + '</span><b>' + opts[P[key]] + '</b>';
    var b = l.querySelector('b');
    l.addEventListener('click', function () { P[key] = (P[key] + 1) % opts.length; touched[key] = 1; b.textContent = opts[P[key]]; if (fn) fn(P[key]); save(); });
    ctl.appendChild(l); return { el: l };
  }
  var CFG_FONTS = ['default', 'Fragment Mono', 'Times New Roman', 'Ca2-Thin', 'system sans', 'system mono'], CFG_STACK = [null, "'Fragment Mono', ui-monospace, monospace", "'Times New Roman', Times, serif", "'Ca2-Thin', monospace", "system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif", "ui-monospace, 'SF Mono', Menlo, monospace"], CFG_CASES = ['default', 'UPPER', 'lower', 'Sentence'];
  var gh = document.createElement('div'); gh.className = 'grp'; gh.textContent = 'switches'; ctl.appendChild(gh);
  var swSec = { name: 'switches', hdr: gh, els: [] }; SECS.push(swSec);
  var _toggle = toggle, _choice = choice;
  toggle = function () { var r = _toggle.apply(null, arguments); swSec.els.push(r.el); return r; };
  choice = function () { var r = _choice.apply(null, arguments); swSec.els.push(r.el); return r; };
  choice('axis layering', 'axisLayer', ['above', 'behind']);
  choice('micro event sound', 'audioMicro', ['click', 'tick', 'drop', 'bubble', 'wood', 'bloom']);
  choice('sound mode', 'audioMode', ['soft white', 'pink', 'brown', 'micro crackle', 'membrane']);
  toggle('sound', !!P.audioOn, function (v) { P.audioOn = v ? 1 : 0; if (window.CA2Audio) CA2Audio.enable(v); });
  toggle('genome', !!P.genomeOn, function (v) { P.genomeOn = v ? 1 : 0; cells.forEach(function (c) { c.maxSpeed = speedOf(c); }); });
  toggle('amorphous outline', !!P.blobOutline, function (v) { P.blobOutline = v ? 1 : 0; });
  toggle('divide at size', !!P.divideOn, function (v) { P.divideOn = v ? 1 : 0; });
  toggle('eat or merge', !!P.eatMergeOn, function (v) { P.eatMergeOn = v ? 1 : 0; });
  toggle('symbiosis', !!P.symbiosisOn, function (v) { P.symbiosisOn = v ? 1 : 0; });
  toggle('symbiogenesis', !!P.symbiogenesisOn, function (v) { P.symbiogenesisOn = v ? 1 : 0; });
  toggle('parasites', !!P.parasiteOn, function (v) { P.parasiteOn = v ? 1 : 0; });
  toggle('selection', !!P.selectOn, function (v) { P.selectOn = v ? 1 : 0; });
  toggle('growth by eating', !!P.foodGrow, function (v) { P.foodGrow = v ? 1 : 0; });
  toggle('boundary awareness', !!P.boundAware, function (v) { P.boundAware = v ? 1 : 0; });
  toggle('respawn morph', !!P.respawnMorph, function (v) { P.respawnMorph = v ? 1 : 0; });
  choice('food life', 'foodMode', ['original', 'game of life', 'amorphous blobs', 'swarm', 'worms', 'spores']);
  toggle('body shapes', !!P.cellShapes, function (v) { P.cellShapes = v ? 1 : 0; });
  toggle('cell metamorphosis', !!P.cellMorph, function (v) { P.cellMorph = v ? 1 : 0; });
  toggle('auto invert', !!P.autoInvert, function (v) { P.autoInvert = v ? 1 : 0; invertTick(); });
  toggle('title circles', !!P.titleCircles, function (v) { P.titleCircles = v ? 1 : 0; });
  toggle('circle color hold', !!P.circleHold, function (v) { P.circleHold = v ? 1 : 0; });
  var lockT = toggle('lock on refresh', lockParams, function (v) { lockParams = v; });
  lockBox = lockT.box; lockVal = lockT.val;
  toggle('auto refresh', autoRefresh, function (v) { autoRefresh = v; lastRefresh = performance.now(); });
  toggle('auto quality', !!P.autoQuality, function (v) { P.autoQuality = v ? 1 : 0; });
  toggle('grain', !!P.grain, function (v) { P.grain = v ? 1 : 0; });
  toggle('typography', !!P.showHud, function (v) { P.showHud = v ? 1 : 0; });
  toggle('food dots', !!P.showFood, function (v) { P.showFood = v ? 1 : 0; });
  toggle('axis lines', !!P.showAxis, function (v) { P.showAxis = v ? 1 : 0; });
  choice('config font', 'cfgFont', CFG_FONTS, applyTypo);
  choice('config case', 'cfgCase', CFG_CASES, applyTypo);
  function btn(label, fn) { var b = document.createElement('button'); b.textContent = label; b.addEventListener('click', fn); btns.appendChild(b); }
  btn('respawn', function () { randomize(); });
  btn('randomize', function () { lockParams = false; lockBox.checked = false; lockVal.textContent = 'off'; randomize(); });
  btn('background', cycleBg);
  btn('reset', function () { Object.keys(live).forEach(function (k) { delete live[k]; }); Object.keys(DEFAULTS).forEach(function (k) { P[k] = DEFAULTS[k]; }); autoRefresh = true; lockParams = false; bgIndex = 0; bgTarget = BGS[0]; try { localStorage.removeItem(STORE); } catch (e) {} res = P.resolution; resize(); randomize(); location.reload(); });
  btn('copy json', function (ev) {
    var Pc = Object.assign({}, P); for (var lk in live) Pc[lk] = live[lk].orig;
    var txt = JSON.stringify(Pc, null, 1), bt = ev.currentTarget, ok = false;
    // execCommand first and synchronously (works on http pages, where navigator.clipboard does not exist)
    try { var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:0;top:0;opacity:0;font-size:16px'; document.body.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0, txt.length); ok = document.execCommand('copy'); document.body.removeChild(ta); } catch (er) {}
    if (!ok && navigator.clipboard && navigator.clipboard.writeText) { try { navigator.clipboard.writeText(txt).then(function () { bt.textContent = 'copied'; }, function () { bt.textContent = 'copy failed'; }); } catch (er) { bt.textContent = 'copy failed'; } return; }
    bt.textContent = ok ? 'copied' : 'copy failed'; window.ca2copy = txt; setTimeout(function () { bt.textContent = 'copy json'; }, 1500);
  });
  // perf section: its whole pool is one live timing block, placed between the copy and save buttons.
  // Soloing the perf circle hides every knob section and leaves just this block; CONFIG brings all back.
  // perf section: no rows of its own - soloing it continues the CONFIG stats block with the
  // live timing values, in the same row style (owner 21 Oct). hdr is a zero marker for solo().
  var perfHdr = document.createElement('div'); perfHdr.style.display = 'none'; ctl.appendChild(perfHdr);
  var perfSec = { name: 'perf', hdr: perfHdr, els: [] }; SECS.push(perfSec);
  // save: write the settings now (independent of the autosave), read them back from storage and compare every key
  btn('save', function (ev) {
    var bt = ev.currentTarget, ok = false, n = 0, bad = [];
    try {
      save();
      var o = JSON.parse(localStorage.getItem(STORE) || 'null');
      ok = !!(o && o.v === STORE_V && o.P);
      if (ok) for (var k in P) { var want = live[k] ? live[k].orig : P[k]; n++; if (o.P[k] !== want) { bad.push(k); } }
      ok = ok && !bad.length;
    } catch (er) { ok = false; }
    window.ca2saveCheck = { ok: ok, keys: n, mismatched: bad, t: Date.now() };
    bt.textContent = ok ? 'saved' : 'save failed'; setTimeout(function () { bt.textContent = 'save'; }, 1500);
    if (window.__adminOn && window.__adminPush) { bt.textContent = 'saving'; window.__adminPush().then(function (r) { bt.textContent = r === 'fail' ? 'saved here, server full' : (ok ? 'saved' : 'save failed'); setTimeout(function () { bt.textContent = 'save'; }, r === 'fail' ? 4000 : 1500); }); }
  });
  function applyTypo() {
    var r = document.documentElement.style;
    if (CFG_STACK[P.cfgFont]) r.setProperty('--cff', CFG_STACK[P.cfgFont]); else r.removeProperty('--cff');
    if (P.cfgFontSize === 13) r.removeProperty('--cfs'); else r.setProperty('--cfs', P.cfgFontSize + 'px');
    var cl = ['', 'cs-u', 'cs-l', 'cs-s'], pn = document.getElementById('panel'), sc = document.getElementById('secc');
    ['cs-u', 'cs-l', 'cs-s'].forEach(function (c) { if (pn) pn.classList.remove(c); if (sc) sc.classList.remove(c); });
    if (cl[P.cfgCase]) { if (pn) pn.classList.add(cl[P.cfgCase]); if (sc) sc.classList.add(cl[P.cfgCase]); }
  }
  // auto invert: the config panel blends with what is behind it using mix-blend-mode: difference, so every pixel of text, line or
  // control that overlaps a cell, dot or colour is inverted against it (white ink on a light page reads dark, on a dark dot reads light).
  var invState = -1;
  function invertTick() {
    var pn = document.getElementById('panel'); if (!pn) return;
    pn.classList.toggle('blend', !!P.autoInvert);
    if (P.autoInvert) { pn.style.setProperty('--kl', P.lineColor === '#111111' ? '#ffffff' : P.lineColor); }
    else pn.style.removeProperty('--kl');
  }
  // knob colours (random R/G/B on hover, live CA colour) are drawn as plain elements outside the blended panel so they stay true R/G/B
  function paintKnobs() {
    var pr = document.getElementById('panel').getBoundingClientRect(), vis = pr.left < W - 4;
    for (var k in rows) {
      var R = rows[k], inp = R.inp, col = null, track = false;
      if (vis) { if (live[k]) { col = live[k].col; track = true; } else if (inp.matches(':hover')) col = inp.style.getPropertyValue('--hc') || null; }
      var on = !!col; inp.classList.toggle('ovl', on);
      if (!on) { if (R.ov) R.ov.t.style.display = R.ov.l.style.display = 'none'; continue; }
      var r = inp.getBoundingClientRect(); if (r.top < pr.top || r.bottom > pr.bottom) { if (R.ov) R.ov.t.style.display = R.ov.l.style.display = 'none'; continue; }
      if (!R.ov) { var t = document.createElement('div'), l = document.createElement('div'); t.style.cssText = l.style.cssText = 'position:fixed;z-index:12;pointer-events:none;box-sizing:border-box'; t.style.borderRadius = '50%'; document.body.appendChild(l); document.body.appendChild(t); R.ov = { t: t, l: l }; }
      var mn = parseFloat(inp.min), mx = parseFloat(inp.max), fr = mx > mn ? clamp((parseFloat(inp.value) - mn) / (mx - mn), 0, 1) : 0;
      var kx = parseFloat(inp.style.getPropertyValue('--kx')) || 0, ks = parseFloat(inp.style.getPropertyValue('--ks')) || 1, lw = LW(), d = 12 * ks, cx = r.left + 6 + fr * (r.width - 12) + kx, cy = r.top + r.height / 2;
      var t2 = R.ov.t, l2 = R.ov.l; t2.style.display = 'block'; t2.style.left = (cx - d / 2) + 'px'; t2.style.top = (cy - d / 2) + 'px'; t2.style.width = t2.style.height = d + 'px'; t2.style.background = col; t2.style.border = lw + 'px solid ' + col;
      l2.style.display = track ? 'block' : 'none'; if (track) { l2.style.left = r.left + 'px'; l2.style.top = (cy - lw / 2) + 'px'; l2.style.width = r.width + 'px'; l2.style.height = lw + 'px'; l2.style.background = col; }
    }
  }
  if (PERF) { var ph = document.createElement('pre'); ph.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99;margin:0;font:11px/1.3 monospace;color:#0f0;background:rgba(0,0,0,.7);padding:6px;pointer-events:none'; document.body.appendChild(ph);
    setInterval(function () { var o = 'fps ' + Math.round(fps) + '  frame ' + frameMs.toFixed(1) + ' ms  res ' + res.toFixed(2) + '  dpr ' + DPR + '  cells ' + cells.length + '\n' + 'metaball field: ' + MB.path + '  ' + MB.ms.toFixed(2) + ' ms' + (WC.off ? '  (wasm failed: ' + WC.err + ')' : (/[?&]nowasm=1/.test(location.search) ? '  (?nowasm=1)' : (WC.ok ? '' : '  (wasm: ' + (WC.err || 'loading') + ')'))) + '\n'; for (var k in PF) if (!/total/.test(k)) o += (k + '                    ').slice(0, 18) + PF[k].toFixed(2) + '\n'; ph.textContent = o; }, 500); }
  (function swLoop() { try { paintKnobs(); } catch (e) {} requestAnimationFrame(swLoop); })();
  setInterval(invertTick, 250);
  function applyLineColor() { invertTick(); var rt = document.documentElement.style; rt.setProperty('--kl', P.lineColor); if (P.ruleColor) rt.setProperty('--kr', P.ruleColor); else rt.removeProperty('--kr'); if (P.circColor) rt.setProperty('--kc', P.circColor); else rt.removeProperty('--kc'); }
  var panel = document.getElementById('panel'), blurEl = document.getElementById('blur'), blurLEl = document.getElementById('blurl');
  panel.style.width = P.panelWidth + 'px'; blurEl.style.width = P.blurWidth + 'px'; blurLEl.style.width = P.blurWidth + 'px';
  document.documentElement.style.setProperty('--bmax', P.blurStrength + 'px');

  // ---- section circles: one per config section in the panel's right lane ----
  // title-dot size (166.5 font units), axis-line stroke, hollow; hover fills a random R/G/B (stroke too) and shows the
  // section name vertically with a typewriter animation; the circles below slide away from the label; click folds the section.
  var secc = document.createElement('div'); secc.id = 'secc'; document.body.appendChild(secc);
  // config visibility: the tab strip, the panel, the section lane and the admin circles are one hover area. The lane and the admin
  // circles sit outside the panel element, so :hover on the panel dropped while the pointer was on a circle; the panel slid away,
  // the pointer fell back on the tab strip and it slid in again (stutter). A class with a short close delay bridges the hand-over.
  var hovT = null;
  function hookHov(el) {
    el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'touch') return; clearTimeout(hovT); panel.classList.add('hov'); });
    el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'touch') return; clearTimeout(hovT); hovT = setTimeout(function () { panel.classList.remove('hov'); }, 220); });
  }
  [document.getElementById('tab'), panel, secc].forEach(hookHov);
  var CIRC_COLS = ['#ff0000', '#00ff00', '#0000ff'];
  // local rules a crowd of pieces can follow (p = a piece, c = its surroundings this tick)
  var RULES = {
    jitter: function (p, c) { p.vx += c.jx * 1.2; p.vy += c.jy * 1.2; },
    cohere: function (p, c) { p.vx += (c.cx - p.x) * 0.04 + c.jx * 0.5; p.vy += (c.cy - p.y) * 0.04 + c.jy * 0.5; },
    repel: function (p, c) { var dx = p.x - c.nbr.x, dy = p.y - c.nbr.y, d = Math.hypot(dx, dy) || 1; if (d < 14) { p.vx += dx / d * 0.7; p.vy += dy / d * 0.7; } else { p.vx += c.jx * 0.4; p.vy += c.jy * 0.4; } },
    align: function (p, c) { p.vx += (c.nbr.vx - p.vx) * 0.4 + c.jx * 0.3; p.vy += (c.nbr.vy - p.vy) * 0.4 + c.jy * 0.3; },
    drift: function (p, c) { var a = c.tick * 0.012; p.vx += Math.cos(a) * 0.25 + c.jx * 0.4; p.vy += Math.sin(a) * 0.25 + c.jy * 0.4; },
    swirl: function (p, c) { p.vx += -p.y / c.pd * 0.35 + c.jx * 0.3; p.vy += p.x / c.pd * 0.35 + c.jy * 0.3; },
    grid: function (p, c) { p.vx += (Math.round(p.x / 10) * 10 - p.x) * 0.1 + c.jx * 0.2; p.vy += (Math.round(p.y / 10) * 10 - p.y) * 0.1 + c.jy * 0.2; },
    rows: function (p, c) { p.vy += (Math.round(p.y / 9) * 9 - p.y) * 0.12; p.vx += Math.sin(c.tick * 0.06 + Math.round(p.y / 9)) * 0.5 + c.jx * 0.3; },
    slide: function (p, c) { p.vx += Math.sin(c.tick * 0.07) * 0.6 + c.jx * 0.3; p.vy += c.jy * 0.3; },
    pulse: function (p, c) { var k = Math.sin(c.tick * 0.12) * 0.3; p.vx += p.x / c.pd * k + c.jx * 0.3; p.vy += p.y / c.pd * k + c.jy * 0.3; },
    chain: function (p, c) { p.vx += (c.prev.x - p.x) * 0.08 + c.jx * 0.3; p.vy += (c.prev.y - p.y) * 0.08 + c.jy * 0.3; },
    flicker: function (p, c) { p.x += c.jx * 5; p.y += c.jy * 5; },
    wave: function (p, c) { p.vy += Math.cos(c.tick * 0.1 + p.x * 0.15) * 0.5; p.vx += c.jx * 0.3; },
    tide: function (p, c) { p.vx += Math.sin(c.tick * 0.03) * 0.5 + c.jx * 0.3; p.vy += Math.cos(c.tick * 0.021 + p.x * 0.05) * 0.2 + c.jy * 0.3; },
    mutate: function (p, c) { p.vx = c.nbr.vx * 0.9 + c.jx * 1.2; p.vy = c.nbr.vy * 0.9 + c.jy * 1.2; },
    frame: function (p, c) { var hx = 34, hy = 22, ex = Math.abs(p.x) - hx, ey = Math.abs(p.y) - hy; if (ex > ey) p.vx += (Math.sign(p.x || 1) * hx - p.x) * 0.1; else p.vy += (Math.sign(p.y || 1) * hy - p.y) * 0.1; p.vx += c.jx * 0.4; p.vy += c.jy * 0.4; },
    flip: function (p, c) { p.vx += ((p.b ? 24 : -24) - p.x) * 0.08 + c.jx * 0.3; p.vy += -p.y * 0.05 + c.jy * 0.3; },
    blink: function (p, c) { p.el.style.opacity = p.b ? '1' : '0.3'; p.vx += c.jx * 0.8; p.vy += c.jy * 0.8; }
  };
  var SECT_POOL = {
    config: ['grid', 'cohere', 'jitter'], picture: ['frame', 'align', 'drift'], panel: ['rows', 'slide', 'repel', 'grid'], cursor: ['chain', 'swirl', 'jitter'],
    grain: ['flicker', 'repel', 'jitter'], cells: ['cohere', 'repel', 'pulse', 'blink'], evolution: ['mutate', 'drift', 'cohere', 'chain'], life: ['blink', 'pulse', 'cohere', 'swirl'],
    sound: ['wave', 'pulse', 'align'], field: ['tide', 'drift', 'align', 'wave'], switches: ['flip', 'blink', 'slide']
  };
  // pointer tracking for the section-button particles: where it is, and when it last started moving (reaction delays count from there)
  var PTR = { x: -999, y: -999, vx: 0, vy: 0, last: 0, start: 0 };
  document.addEventListener('pointermove', function (e) { var n = performance.now(); if (n - PTR.last > 300) PTR.start = n; PTR.vx = e.clientX - PTR.x; PTR.vy = e.clientY - PTR.y; PTR.x = e.clientX; PTR.y = e.clientY; PTR.last = n; }, { passive: true });
  // how a crowd may answer the pointer: drawn at random per button at every hover, re-drawn after a random time; each piece has its own reaction delay
  var MOUSE_POOL = {
    attract: function (p, d, k) { p.vx += d.dx / d.d * 0.9 * k; p.vy += d.dy / d.d * 0.9 * k; },
    flee: function (p, d, k) { if (d.d < 160) { p.vx -= d.dx / d.d * 1.4 * k; p.vy -= d.dy / d.d * 1.4 * k; } },
    orbit: function (p, d, k) { p.vx += -d.dy / d.d * 0.9 * k + d.dx / d.d * 0.15 * k; p.vy += d.dx / d.d * 0.9 * k + d.dy / d.d * 0.15 * k; },
    drag: function (p, d, k) { p.vx += PTR.vx * 0.12 * k; p.vy += PTR.vy * 0.12 * k; },
    shiver: function (p, d, k) { var a = Math.random() * 6.283, m = Math.min(1, 80 / d.d) * 2.2 * k; p.vx += Math.cos(a) * m; p.vy += Math.sin(a) * m; },
    mirror: function (p, d, k) { p.vx -= PTR.vx * 0.1 * k; p.vy -= PTR.vy * 0.1 * k; },
    shy: function (p, d, k) { if (d.d < 90) { p.vx += d.dy / d.d * 1.2 * k; p.vy -= d.dx / d.d * 1.2 * k; } else { p.vx += d.dx / d.d * 0.25 * k; p.vy += d.dy / d.d * 0.25 * k; } }
  };
  var MOUSE_KEYS = Object.keys(MOUSE_POOL);
  function addCirc(sec) {
    var it = document.createElement('div'); it.className = 'sci';
    var c = document.createElement('div'); c.className = 'sc';
    var lb = document.createElement('div'); lb.className = 'sl';
    var txt = sec.name.toUpperCase(), spans = [];
    for (var i = 0; i < txt.length; i++) { var sp = document.createElement('span'); sp.textContent = txt[i]; lb.appendChild(sp); spans.push(sp); }
    it.appendChild(c); it.appendChild(lb); secc.appendChild(it); sec.circ = c;
    var caT = null, caSt = null, t1 = null, t2 = null, dividing = false, parts = [], home = null, D0 = 0, ctr = { x: 0, y: 0 }, endTimers = [], endIv = null;
    function put(p) { p.el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) scale(' + p.k.toFixed(2) + ')'; }
    // pieces scatter freely; only the browser window bounds them (a piece bounces off the window edges, never leaves the screen)
    function inDisc(p) {
      var r = D0 * p.k / 2, ax = ctr.x + p.x, ay = ctr.y + p.y;
      if (ax < r) { p.x += r - ax; p.vx = Math.abs(p.vx); } else if (ax > W - r) { p.x -= ax - (W - r); p.vx = -Math.abs(p.vx); }
      if (ay < r) { p.y += r - ay; p.vy = Math.abs(p.vy); } else if (ay > H - r) { p.y -= ay - (H - r); p.vy = -Math.abs(p.vy); }
    }
    // stop everything that animates this circle and put it back to its resting hollow state (also used when the pointer returns mid-ending)
    function cleanup() {
      if (caT) { clearInterval(caT); if (caT._a) clearInterval(caT._a); if (caT._b) clearInterval(caT._b); caT = null; }
      if (t1) { clearTimeout(t1); t1 = null; }
      if (t2) { clearInterval(t2); t2 = null; }
      if (endIv) { clearInterval(endIv); endIv = null; }
      endTimers.forEach(clearTimeout); endTimers = [];
      parts.forEach(function (p) { if (p.el !== c) p.el.remove(); }); parts = [];
      dividing = false;
      c.style.transition = ''; c.style.transform = ''; c.style.opacity = ''; c.style.background = 'transparent'; c.style.borderColor = 'var(--kc, var(--fg))'; c.style.borderWidth = LW() + 'px';
    }
    // hover state comes from the pointer crossing the button's resting box only. The living pieces move under a
    // stationary pointer; hit-tested enter/leave on the element itself restarted the whole crowd on every mouse move.
    var hovOn = false, mvT = null;
    function stopTrack() { if (mvT) { document.removeEventListener('pointermove', mvT); mvT = null; } }
    function track() {
      stopTrack();
      mvT = function (e) {
        var ir = it.getBoundingClientRect(), pad = 4;
        var L = ir.left + c.offsetLeft, T = ir.top + c.offsetTop, R = L + c.offsetWidth, B = T + c.offsetHeight;
        if (e.clientX < L - pad || e.clientX > R + pad || e.clientY < T - pad || e.clientY > B + pad) endHover();
      };
      document.addEventListener('pointermove', mvT, { passive: true });
    }
    function startHover() { // hover area is the button only: the label under it is not part of it (hovering the title closes the button)
      if (hovOn) return; hovOn = true; c.style.pointerEvents = 'none'; track();
      cleanup();
      var col = CIRC_COLS[Math.floor(Math.random() * 3)];
      c.style.background = col; c.style.borderColor = col; c.style.borderWidth = '0px'; lb.style.color = col; c.dataset.col = col; // coloured and splitting: no stroke at all
      // measure only the resting line-height: on a re-entry while the closing squeeze is still applied (or its
      // transition still attached) the live computed value is the squeezed 0.9x one and the label comes out short,
      // clipping the last letters against the button below (owner 20 Oct)
      spans.forEach(function (sp) { sp.style.transition = 'none'; sp.style.lineHeight = ''; sp.style.transform = ''; });
      void lb.offsetWidth;
      lb.style.height = (txt.length * (parseFloat(getComputedStyle(spans[0]).lineHeight) || 17) + 14) + 'px';
      // opening: letters start slightly tight vertically, line spacing eases open into place (very subtle)
      spans.forEach(function (sp) { sp.style.transition = 'none'; sp.style.opacity = '0'; sp.style.lineHeight = 'calc(var(--cfs, 13px) * 0.98)'; sp.style.transform = 'scaleY(.88)'; });
      void lb.offsetWidth;
      spans.forEach(function (sp) { sp.style.transition = 'opacity .12s linear, line-height .3s cubic-bezier(.2,.8,.3,1), transform .3s cubic-bezier(.2,.8,.3,1)'; sp.style.transitionDelay = (Math.random() * 0.2).toFixed(2) + 's'; sp.style.opacity = '1'; sp.style.lineHeight = ''; sp.style.transform = 'scaleY(1)'; });
      // the circle stirs with a small rule-110 life of its own, like the knobs - shrinking, not growing (visual only)
      caSt = { s: (hash(sec.name) ^ 0x51f3) || 9 }; var bits = [];
      for (var i = 0; i < 16; i++) bits.push(lcg(caSt) < 0.5 ? 1 : 0);
      var dx = 0;
      caT = setInterval(function () {
        var nb = new Array(16), sum = 0;
        for (var i = 0; i < 16; i++) { nb[i] = (110 >> (bits[(i + 15) % 16] * 4 + bits[i] * 2 + bits[(i + 1) % 16])) & 1; sum += nb[i]; }
        if (sum === 0 || sum === 16) nb[Math.floor(lcg(caSt) * 16)] ^= 1;
        bits = nb;
        dx = clamp(dx + (nb[0] + nb[5] + nb[10] - 1.5) * 1.5 + (lcg(caSt) - 0.5) * 2, -6, 6);
        if (!dividing) c.style.transform = 'translate(' + dx.toFixed(1) + 'px,0) scale(' + (1 - sum / 16 * 0.4).toFixed(2) + ')';
      }, 110);
      // hover keeps going: in place the circle splits into four, and the pieces keep living as a tiny vector cellular
      // automaton - every 1.3 s each piece divides into four again, always in multiples of four (the crowd is capped at 24, extra pieces die)
      c.parentNode.style.position = 'relative'; // first: offsetLeft/Top must be measured against this item, not against the fixed lane
      var cr0 = c.getBoundingClientRect(); ctr = { x: cr0.left + cr0.width / 2, y: cr0.top + cr0.height / 2 }; D0 = c.offsetWidth; home = { x: c.offsetLeft, y: c.offsetTop }; parts = [{ el: c, x: 0, y: 0, vx: 0, vy: 0, k: 0.6 }]; dividing = true;
      c.style.transition = 'transform .25s ease';
      function mk() { var n = c.cloneNode(false); n.style.position = 'absolute'; n.style.left = home.x + 'px'; n.style.top = home.y + 'px'; n.style.pointerEvents = 'none'; n.style.margin = '0'; n.style.transition = 'transform .25s ease'; n.style.background = c.style.background; n.style.borderColor = c.style.borderColor; c.parentNode.appendChild(n); return n; }
      // no count limit: every piece keeps dividing into four until it is about 4 px
      function split() {
        var out = [], did = false;
        parts.forEach(function (p) {
          if (D0 * p.k < 4) { out.push(p); return; } // pieces stop dividing at about 4 px: smaller is meaningless
          did = true;
          var off = D0 * p.k * 0.25;
          [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (d, j) {
            var el = j === 0 ? p.el : mk();
            out.push({ el: el, x: p.x + d[0] * off, y: p.y + d[1] * off, vx: d[0] * 2.2, vy: d[1] * 2.2, k: p.k * 0.5 });
          });
        });
        parts = out; parts.forEach(function (p) { inDisc(p); put(p); });
        if (!did && t2) { clearInterval(t2); t2 = null; }
      }
      t1 = setTimeout(function () { t1 = null; split(); t2 = setInterval(split, 1300); }, 700);
      // behaviour pool: each section draws from a few local rules that fit its subject; at every hover two are picked at random and every
      // piece follows one of them, chosen by its own rule-110 bit (so neighbours of one crowd act differently). No fixed script.
      var mrule = MOUSE_KEYS[Math.floor(Math.random() * MOUSE_KEYS.length)], mUntil = performance.now() + 2500 + Math.random() * 6000, mGain = 0.4 + Math.random() * 1.2;
      c.dataset.mouse = mrule;
      var pool = SECT_POOL[sec.name] || SECT_POOL.config, pick = pool.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 2), tick = 0;
      c.dataset.beh = pick.join('+');
      var life = setInterval(function () {
        tick++;
        var n = parts.length, cx = 0, cy = 0, i;
        for (i = 0; i < n; i++) { cx += parts[i].x; cy += parts[i].y; } cx /= n; cy /= n;
        if (tick % 40 === 0 && Math.random() < 0.5) { var rest = pool.filter(function (r) { return pick.indexOf(r) < 0; }); if (rest.length) { pick[Math.floor(Math.random() * 2)] = rest[Math.floor(Math.random() * rest.length)]; c.dataset.beh = pick.join('+'); } }
        // rule-110 bit per piece, along the crowd's order
        var nb = new Array(n);
        for (i = 0; i < n; i++) { var l = parts[(i + n - 1) % n].b | 0, m = parts[i].b | 0, r2 = parts[(i + 1) % n].b | 0; nb[i] = (110 >> (l * 4 + m * 2 + r2)) & 1; }
        for (i = 0; i < n; i++) { parts[i].b = (tick < 2 && parts[i].b === undefined) ? (lcg(caSt) < 0.5 ? 1 : 0) : nb[i]; if (Math.random() < 0.02) parts[i].b ^= 1; }
        parts.forEach(function (p, i) {
          var cc = { jx: lcg(caSt) - 0.5, jy: lcg(caSt) - 0.5, cx: cx, cy: cy, tick: tick, i: i, n: n, nbr: parts[(i + 1 + Math.floor(lcg(caSt) * 5)) % n], prev: parts[(i + n - 1) % n], pd: Math.hypot(p.x, p.y) || 1 };
          RULES[pick[p.b ? 1 : 0]](p, cc);
          p.vx *= 0.88; p.vy *= 0.88;
          if (cc.pd > 70) { p.vx -= p.x / cc.pd * (cc.pd - 70) * 0.08; p.vy -= p.y / cc.pd * (cc.pd - 70) * 0.08; } // never far from the button
          var nowM = performance.now();
          if (nowM > mUntil) { mrule = MOUSE_KEYS[Math.floor(Math.random() * MOUSE_KEYS.length)]; mUntil = nowM + 2500 + Math.random() * 6000; mGain = 0.4 + Math.random() * 1.2; c.dataset.mouse = mrule; }
          if (p.md === undefined) p.md = Math.random() * 1400; // this piece's own reaction delay (ms) after the pointer starts moving
          if (nowM - PTR.last < 900 && nowM - PTR.start > p.md) { var mdx = PTR.x - (ctr.x + p.x), mdy = PTR.y - (ctr.y + p.y); MOUSE_POOL[mrule](p, { dx: mdx, dy: mdy, d: Math.hypot(mdx, mdy) || 1 }, mGain); }
          p.vx = clamp(p.vx, -4, 4); p.vy = clamp(p.vy, -4, 4);
          p.x += p.vx; p.y += p.vy; inDisc(p); put(p);
        });
      }, 110);
      var oc = caT; caT = { _a: oc, _b: life };
    }
    function endHover() {
      if (!hovOn) return; hovOn = false; stopTrack(); c.style.pointerEvents = '';
      var col = c.dataset.col || '#000';
      // closing: letters squeeze together vertically a little and fade
      spans.forEach(function (sp) { sp.style.transition = 'opacity .2s ease-in, line-height .2s ease-in, transform .2s ease-in'; sp.style.transitionDelay = '0s'; sp.style.opacity = '0'; sp.style.lineHeight = 'calc(var(--cfs, 13px) * 0.9)'; sp.style.transform = 'scaleY(.8)'; });
      lb.style.height = '0px';
      // stop the hover life; the pieces now die one by one at random moments, one random survivor wanders cellular-automaton style,
      // grows back to the full button size, is pierced from its centre and settles as the button's hollow ring
      if (caT) { clearInterval(caT); if (caT._a) clearInterval(caT._a); if (caT._b) clearInterval(caT._b); caT = null; }
      if (t1) { clearTimeout(t1); t1 = null; }
      if (t2) { clearInterval(t2); t2 = null; }
      if (!parts.length) { cleanup(); return; }
      var sv = parts[Math.floor(Math.random() * parts.length)];
      parts.forEach(function (p) {
        if (p === sv) return;
        endTimers.push(setTimeout(function () { p.el.style.transition = 'transform .3s ease, opacity .3s ease'; p.k = 0; put(p); p.el.style.opacity = '0'; }, Math.random() * 900));
      });
      sv.el.style.opacity = '1'; sv.el.style.transition = 'transform .06s linear';
      var bits = []; for (var i = 0; i < 16; i++) bits.push(lcg(caSt) < 0.5 ? 1 : 0);
      var phase = 0, tS = performance.now(), k0 = sv.k, x0 = sv.x, y0 = sv.y, tP = 0;
      endIv = setInterval(function () {
        var now = performance.now();
        if (phase === 0) {
          var nb = new Array(16), sum = 0;
          for (var i = 0; i < 16; i++) { nb[i] = (110 >> (bits[(i + 15) % 16] * 4 + bits[i] * 2 + bits[(i + 1) % 16])) & 1; sum += nb[i]; }
          if (sum === 0 || sum === 16) nb[Math.floor(lcg(caSt) * 16)] ^= 1; bits = nb;
          var f = Math.min(1, (now - tS) / 1600), e = f * f * (3 - 2 * f), wob = (1 - f) * 5;
          sv.k = k0 + (1 - k0) * e;
          sv.x = x0 * (1 - e) + (nb[0] + nb[5] + nb[10] - 1.5) * wob; sv.y = y0 * (1 - e) + (nb[2] + nb[7] + nb[12] - 1.5) * wob;
          if (f >= 1) { sv.k = 1; sv.x = 0; sv.y = 0; phase = 1; tP = now; }
          inDisc(sv); put(sv);
        } else if (phase === 1) {
          // the hole opens until only a ring of the stroke width is left, then the same ring turns smoothly black (no gap, no flash)
          var ringP = LW() > 0 ? Math.max(0, 100 * (1 - 2 * LW() / D0)) : 100;
          var h = Math.min(ringP, (now - tP) / 450 * 100);
          sv.el.style.background = 'radial-gradient(circle closest-side, transparent ' + h.toFixed(1) + '%, ' + col + ' ' + h.toFixed(1) + '%)';
          if (h >= ringP) {
            phase = 2; clearInterval(endIv); endIv = null;
            var el = sv.el;
            el.style.transition = 'none'; el.style.background = 'transparent'; el.style.borderWidth = LW() + 'px'; el.style.borderColor = col; el.style.transform = 'scale(1)';
            void el.offsetWidth;
            // colour fades to the resting stroke colour while the ring swells a hair and settles back
            el.style.transition = 'border-color .7s ease, transform .22s ease-out';
            el.style.borderColor = 'var(--kc, var(--fg))'; el.style.transform = 'scale(1.045)';
            endTimers.push(setTimeout(function () { el.style.transition = 'transform .5s cubic-bezier(.3,1.4,.5,1)'; el.style.transform = 'scale(1)'; }, 230));
            endTimers.push(setTimeout(function () { cleanup(); }, 800));
          }
        }
      }, 40);
    }
    c.addEventListener('pointerenter', startHover);
    it.addEventListener('click', function (e) {
      e.stopPropagation();
      if (sec.name === 'config') { solo(null); panel.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (sec.name === 'perf') { perfOn = !perfOn; solo(perfOn ? perfSec : null); lastSync = 0; return; } // perf view: the 5 config stats and the button rows stay visible, the knob sections fold away (owner 21 Oct)
      // one click: only this section stays visible, smooth-scrolled so its header middle sits on the circle's middle
      solo(sec);
      var pR = panel.getBoundingClientRect(), cR = it.getBoundingClientRect(), hR = sec.hdr.getBoundingClientRect();
      var targetY = cR.top + cR.height / 2 - pR.top - hR.height / 2;
      panel.scrollTo({ top: panel.scrollTop + (hR.top - pR.top) - targetY, behavior: 'smooth' });
    });
  }
  // solo view: a section circle shows only its own section; the CONFIG circle brings everything back
  var soloSec = null, perfOn = false, statGeom = null;
  function solo(sec) {
    soloSec = sec || null;
    SECS.forEach(function (s2) {
      var on = !sec || s2 === sec;
      s2.hdr.style.display = on ? '' : 'none';
      s2.els.forEach(function (el) { el.style.display = on ? '' : 'none'; });
      if (s2.circ) s2.circ.style.opacity = sec && s2 !== sec ? '.35' : '1';
    });
  }
  // the topmost button is the CONFIG title: one click shows every section again, scrolled to the start
  addCirc({ name: 'config', hdr: panel.querySelector('h1'), els: [] });
  SECS.forEach(addCirc);
  // ---- colour swatches: knob-size circle switches in their own lane, one per colour. OFF is hollow (default colour),
  // ON fills with a random R/G/B and applies it; hover paints the circle black; the name shows briefly on every toggle. (owner 21 Oct)
  function hex2rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  var SW_HOME = { background: [SECS[1].hdr, SECS[0]], 'knob lines': [SECS[2].hdr, SECS[1]], 'section lines': [SECS[2].hdr, SECS[1]], 'button rings': [SECS[2].hdr, SECS[1]], 'axis lines': [SECS[2].hdr, SECS[1]], 'food dots': [gh, SECS[8]] };
  var SW_DEFS = [
    { label: 'background', on: 'swBg', set: function (c) { if (c) { bgTarget = hex2rgb(c); } else { bgIndex = 0; bgTarget = BGS[0]; } }, get: function () { return '#' + bgTarget.map(function (v) { return ('0' + (v | 0).toString(16)).slice(-2); }).join(''); } },
    { label: 'knob lines', on: 'swLineColor', key: 'lineColor', dflt: '#111111' },
    { label: 'section lines', on: 'swRuleColor', key: 'ruleColor', dflt: '' },
    { label: 'button rings', on: 'swCircColor', key: 'circColor', dflt: '' },
    { label: 'axis lines', on: 'swAxisColor', key: 'axisColor', dflt: '' },
    { label: 'food dots', on: 'swFoodColor', key: 'foodColor', dflt: '#000000' }
  ];
  // the switches live in the panel, in the sections the colour pickers used to sit in (owner 21 Oct:
  // not a separate lane). Each is a knob-size circle: hollow while off (param at its default),
  // a click turns it on with a random red/green/blue, another click turns it off and restores the
  // default; hovering fills the circle black; the value beside the name flashes the new state.
  SW_DEFS.forEach(function (def) {
    var row = document.createElement('div'); row.className = 'row';
    row.innerHTML = '<div class="lab"><span>' + def.label + '</span><b style="font-weight:normal;transition:opacity .3s"></b></div>';
    var c = document.createElement('div'); c.className = 'swc';
    row.appendChild(c);
    var home = SW_HOME[def.label]; ctl.insertBefore(row, home[0]); home[1].els.push(row);
    var bv = row.querySelector('b'), hideT = null;
    function apply(col) { if (def.set) def.set(col); else { P[def.key] = col; touched[def.key] = 1; applyLineColor(); } }
    function cur() { return P[def.on] ? (def.get ? def.get() : P[def.key]) : null; }
    function paint() { c.style.background = cur() || 'transparent'; }
    function show(flash) {
      bv.textContent = cur() || 'default';
      if (flash) { bv.style.opacity = '1'; clearTimeout(hideT); hideT = setTimeout(function () { bv.style.opacity = ''; }, 1400); }
    }
    c.addEventListener('pointerenter', function () { c.style.background = '#000'; });
    c.addEventListener('pointerleave', paint);
    c.addEventListener('click', function () {
      P[def.on] = P[def.on] ? 0 : 1; touched[def.on] = 1;
      apply(P[def.on] ? CIRC_COLS[Math.floor(Math.random() * 3)] : (def.dflt === undefined ? null : def.dflt));
      paint(); show(true); save();
    });
    paint(); show(false);
  });

  // depth of field on both screen edges, one design: opening the config pulls it in like a lens (edge layer first, small
  // overshoot, soft settle); with no pointer movement for focusIdleMs the same edge field also drifts in over focusInMs;
  // any movement snaps focus back over focusOutMs. Driven by CSS vars --bk1..4, no sliding, left and right alike.
  var lastMove = performance.now();
  ['mousemove', 'pointermove', 'mousedown', 'wheel', 'touchstart', 'touchmove', 'keydown'].forEach(function (n) { window.addEventListener(n, function () { lastMove = performance.now(); }, { passive: true }); });
  // in-canvas depth of field: same four progressive levels and masks as the CSS field, painted into the scene right
  // before the grain pass - the grain stays visible over the blur (owner 21 Oct: grain above everything). The CSS
  // field is the fallback for browsers without canvas filters.
  var dofOK = typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype;
  var dofK = [0, 0, 0, 0]; window.__dofK = dofK;
  var dofCv = null, dofLay = null;
  function applyDof() {
    if (!dofOK || P.blurStrength <= 0 || P.blurWidth <= 0) return;
    var on = false, i;
    for (i = 0; i < 4; i++) if (dofK[i] > 0.004) on = true;
    if (!on) return;
    var bw = Math.min(P.blurWidth, W / 2), hs = 0.5; // half-res scratch: blur is a low-pass, the softness hides the scale
    var sw = Math.max(1, Math.ceil(bw * DPR * hs)), sh = Math.max(1, Math.ceil(H * DPR * hs));
    if (!dofCv) { dofCv = document.createElement('canvas'); dofLay = document.createElement('canvas'); }
    if (dofCv.width !== sw || dofCv.height !== sh) { dofCv.width = sw; dofCv.height = sh; dofLay.width = sw; dofLay.height = sh; }
    var MSK = [[0.55, 1], [0.35, 0.75], [0.15, 0.5], [0, 0.25]]; // the CSS mask stops: strongest at the screen edge
    for (var side = 0; side < 2; side++) {
      var sx = side === 0 ? W - bw : 0; // right strip first (the config side), then its left twin
      var c2 = dofCv.getContext('2d'), l2 = dofLay.getContext('2d');
      c2.setTransform(1, 0, 0, 1, 0, 0); c2.globalCompositeOperation = 'source-over'; c2.filter = 'none';
      c2.drawImage(cv, sx * DPR, 0, bw * DPR, H * DPR, 0, 0, sw, sh);
      for (i = 0; i < 4; i++) {
        var bl = P.blurStrength * (i + 1) / 4 * dofK[i] * DPR * hs;
        if (bl < 0.05) continue;
        l2.setTransform(1, 0, 0, 1, 0, 0); l2.globalCompositeOperation = 'source-over'; l2.clearRect(0, 0, sw, sh);
        l2.filter = 'blur(' + bl.toFixed(2) + 'px)';
        l2.drawImage(dofCv, 0, 0);
        l2.filter = 'none'; l2.globalCompositeOperation = 'destination-in';
        var gr = side === 0 ? l2.createLinearGradient(sw, 0, 0, 0) : l2.createLinearGradient(0, 0, sw, 0);
        gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(MSK[i][0], 'rgba(0,0,0,1)'); gr.addColorStop(MSK[i][1], 'rgba(0,0,0,0)');
        l2.fillStyle = gr; l2.fillRect(0, 0, sw, sh);
        c2.drawImage(dofLay, 0, 0);
      }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(dofCv, 0, 0, sw, sh, sx * DPR, 0, bw * DPR, H * DPR);
      ctx.restore();
    }
  }
  (function () {
    var tab = document.getElementById('tab'), want = false, t0 = 0, from = [0, 0, 0, 0], cur = [0, 0, 0, 0], dur = 1900;
    var idleOn = false, iT0 = 0, iFrom = [0, 0, 0, 0], iCur = [0, 0, 0, 0];
    function openNow() { return panel.classList.contains('open') || panel.classList.contains('hov') || panel.matches(':hover') || tab.matches(':hover'); }
    function ease(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
    function easeIO(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
    function focusCurve(x) { x = clamp(x, 0, 1); return ease(x) + Math.sin(x * Math.PI * 2.2) * 0.12 * (1 - x) * Math.min(1, x * 4); }
    window.__blurState = function () { return { cfg: cur.slice(), idle: iCur.slice(), idleOn: idleOn }; };
    function loop(now) {
      var o = openNow(); if (o !== want) { want = o; t0 = now; from = cur.slice(); }
      var ion = !o && now - lastMove >= P.focusIdleMs; if (ion !== idleOn) { idleOn = ion; iT0 = now; iFrom = iCur.slice(); }
      var el = now - t0, el2 = now - iT0, root = document.documentElement.style, depth = P.focusDepth / Math.max(1, P.blurStrength);
      for (var i = 0; i < 4; i++) {
        var delay = (3 - i) * 0.14 * dur / (want ? 1 : 2.5), x = (el - delay) / (want ? dur : dur * 0.55), tgt = want ? 1 : 0, v;
        if (want) v = from[i] + (tgt - from[i]) * focusCurve(x); else v = from[i] * (1 - ease(x));
        if (x <= 0) v = from[i];
        cur[i] = want ? clamp(v, 0, 1.2) : Math.max(0, v);
        var iD = idleOn ? P.focusInMs : P.focusOutMs, id = (3 - i) * 0.12 * iD * (idleOn ? 1 : 0.3), ix = (el2 - id) / iD, iv;
        if (idleOn) iv = iFrom[i] + (1 - iFrom[i]) * easeIO(ix); else iv = iFrom[i] * (1 - ease(ix));
        if (ix <= 0) iv = iFrom[i];
        iCur[i] = Math.max(0, iv);
        var kb = Math.max(cur[i], iCur[i] * depth);
        dofK[i] = dofOK ? kb : 0;
        root.setProperty('--bk' + (i + 1), dofOK ? '0' : kb.toFixed(3));
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();
  var admCircles = []; // filled by adminInit: 4 stacked digit circles, same lane and size as the section circles
  var circSig = '';
  function placeCircles() {
    var L = lay(), u = L.fs / 1000, R0 = 166.5 * u, D = 2 * R0;
    document.documentElement.style.setProperty('--sd', D.toFixed(2) + 'px');
    var sig = [D.toFixed(2), L.M, L.dh, LW(), P.panelWidth].join('|');
    if (sig === circSig) return; circSig = sig;
    var y0 = Math.max(4, L.M + L.dh - 500 * u - R0); // first circle centred on the title's topmost circle
    secc.style.top = y0 + 'px'; // body-level fixed lane: never rides the panel scroll
    panel.style.paddingRight = (L.M + D + L.M / 2) + 'px';
    for (var i = 0; i < secc.childNodes.length; i++) {
      var c = secc.childNodes[i].firstChild;
      c.style.width = D + 'px'; c.style.height = D + 'px';
      c.style.border = LW() + 'px solid var(--kc, var(--fg))';
      var lb2 = secc.childNodes[i].querySelector('.sl'); if (lb2) lb2.style.width = D + 'px';
    }
    for (var j = 0; j < admCircles.length; j++) {
      admCircles[j].style.width = D + 'px'; admCircles[j].style.height = D + 'px';
      admCircles[j].style.border = LW() + 'px solid var(--kc, var(--fg))';
      admCircles[j].style.fontSize = '13px';
    }
  }
  document.documentElement.style.setProperty('--m', P.margin + 'px');
  placeCircles(); applyLW(); applyLineColor(); applyTypo();
  panel.addEventListener('click', function (e) { e.stopPropagation(); });
  var lastSync = 0;

  // ---- display mode: 'd' desktop / 'm' mobile. An explicit admin choice (B/D buttons) wins;
  // otherwise the window width decides - a narrowed desktop window previews the mobile mode and its preset.
  // The mobile lane consumes this through window.__ca2Mode() / the 'ca2mode' event / body[data-camode].
  var MODE_BREAK = 820, modeSel = null, modeCur = '';
  function modeEff() { return modeSel || (window.innerWidth <= MODE_BREAK ? 'm' : 'd'); }
  function modePub() {
    var m = modeEff(); if (m === modeCur) return; modeCur = m;
    document.body.dataset.camode = m;
    try { window.dispatchEvent(new CustomEvent('ca2mode', { detail: { mode: m, sel: modeSel, width: window.innerWidth } })); } catch (e) {}
  }
  window.__ca2Mode = modeEff;
  window.__ca2ModeSel = function () { return modeSel; };
  window.addEventListener('resize', modePub);
  modePub();

  // ---- admin session + global presets (Cloudflare Worker + KV, free plan) ----
  (function adminInit() {
    var WK = 'https://ca2-presets.middots.workers.dev/', admin = null, sent = {}, lastV = 0, GK = 'ca2.global';
    function post(b) { return fetch(WK, { method: 'POST', keepalive: true, body: JSON.stringify(b) }).then(function (r) { return r.json(); }); }
    function applyG(g) {
      if (!g || typeof g !== 'object') return false; var n = 0;
      var pnd = {}; try { pnd = JSON.parse(localStorage.getItem('ca2.pending') || '{}'); } catch (e) {}
      Object.keys(g).forEach(function (k) { if (k === '_v' || k === '_live' || !(k in P) || k in pnd) return; var v = g[k]; if (typeof v === typeof P[k] && (typeof v !== 'number' || isFinite(v)) && P[k] !== v) { P[k] = v; n++; } });
      var gl = typeof g._live === 'string' ? (function () { try { return JSON.parse(g._live); } catch (e) { return null; } })() : (g._live && typeof g._live === 'object' ? g._live : null);
      if (gl) {
        Object.keys(gl).forEach(function (k) { if (!live[k] && keyToQ[k] && rows[k] && typeof gl[k] === 'number' && isFinite(gl[k])) { liveStart(k, keyToQ[k], gl[k], rows[k].row); n++; } });
        Object.keys(live).forEach(function (k) { if (!(k in gl)) { liveStop(k); n++; } });
      }
      if (n && P.foodEatR <= 1) P.foodEatR = Math.round(P.foodEatR * DEFAULTS.CELL_RADIUS * 100) / 100;
      return n;
    }
    function pullG(first) {
      fetch(WK + '?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (g) {
        if (!g || !g._v || g._v === lastV) return; lastV = g._v;
        try { localStorage.setItem(GK, JSON.stringify(g)); } catch (e) {}
        if (admin) return;
        if (applyG(g)) { lastSync = 0; syncUI(0); }
      }).catch(function () {});
    }
    try { var cg = JSON.parse(localStorage.getItem(GK) || 'null'); if (cg) { applyG(cg); lastV = cg._v || 0; } } catch (e) {}
    // edits not yet accepted by the server stay ahead of the (older) global on reload
    try { var pd0 = JSON.parse(localStorage.getItem('ca2.pending') || '{}'); Object.keys(pd0).forEach(function (k) { if (k !== '_live' && k in P && typeof pd0[k] === typeof P[k]) { P[k] = pd0[k]; touched[k] = 1; } }); } catch (e) {}
    pullG(true); setInterval(pullG, 15000);
    var PK = 'ca2.pending', pushFail = 0, pushNext = 0, pushBusy = false;
    window.__adminPush = function () {
      if (!admin) return Promise.resolve('noadmin'); var patch = {}, keys = [];
      var TRANS = { UNIVERSE_SIZE: 1, CELL_RADIUS: 1, baseMutationRate: 1, mutationRateRange: 1, interactionRadius: 1 };
      // every key that differs from what the global already holds goes out, not only knob-touched ones (transition-driven keys still need a real touch)
      for (var pk in P) if (!(pk in TRANS) && !(pk in touched) && pk in sent && P[pk] !== sent[pk] && !live[pk]) touched[pk] = 1;
      for (var k in touched) { var v = P[k]; if (live[k]) v = live[k].orig; if ((typeof v === 'number' && isFinite(v) || typeof v === 'string') && sent[k] !== v) { patch[k] = v; keys.push(k); } }
      var lm = JSON.stringify(liveMap()); if (sent._live !== lm) { patch._live = lm; } // the Worker stores primitives only
      if (!keys.length && patch._live === undefined) return Promise.resolve('nochange');
      if (pushBusy) return Promise.resolve('busy'); pushBusy = true;
      try { var pend = JSON.parse(localStorage.getItem(PK) || '{}'); for (var pj in patch) pend[pj] = patch[pj]; localStorage.setItem(PK, JSON.stringify(pend)); } catch (e) {}
      return post({ code: admin, patch: patch }).then(function (r) {
        pushBusy = false;
        if (r && r.ok !== false && !r.error && !r.err) { pushFail = 0; pushNext = 0; keys.forEach(function (k) { sent[k] = patch[k]; delete touched[k]; }); if (patch._live !== undefined) sent._live = patch._live; if (r.v) lastV = r.v; try { var pd = JSON.parse(localStorage.getItem(PK) || '{}'); for (var pj2 in patch) delete pd[pj2]; localStorage.setItem(PK, JSON.stringify(pd)); } catch (e) {} window.__adminSaveErr = ''; return 'ok'; }
        else { pushFail++; pushNext = Date.now() + Math.min(60000, 2000 * pushFail); window.__adminSaveErr = (r && (r.err || r.error)) || 'rejected'; return 'fail'; }
      }).catch(function (e) { pushBusy = false; pushFail++; pushNext = Date.now() + Math.min(60000, 2000 * pushFail); window.__adminSaveErr = 'server error (not saved globally)'; return 'fail'; });
    };
    // no automatic pushes: the free KV plan allows 1000 writes a day. One batched POST per Save click.
    // entry widget: 4 hollow circles stacked on the section-circle axis at the bottom right; the code fills them
    // top to bottom (2 2 2 2); a good code turns them into A D M N. The real input is invisible and only catches keys.
    var adm = document.createElement('div'); adm.id = 'adm';
    var aglyphs = [];
    for (var ai = 0; ai < 4; ai++) {
      var ac = document.createElement('div'); ac.className = 'ac';
      var ag = document.createElement('span'); ac.appendChild(ag); adm.appendChild(ac);
      admCircles.push(ac); aglyphs.push(ag);
    }
    document.body.appendChild(adm); hookHov(adm); circSig = ''; placeCircles();
    // B (mobile) and D (desktop) are buttons once the accepted code turns the glyphs into A B D U:
    // a click toggles the explicit mode choice (clicking the active one clears it - no selection = width decides).
    // No extra styling on the selected letter (owner 21 Oct): the mode itself is the feedback.
    // Hovering B or D also paints the letter fill and its stroke with two independent random rgb colours.
    function rndCol() { return 'rgb(' + ((Math.random() * 256) | 0) + ',' + ((Math.random() * 256) | 0) + ',' + ((Math.random() * 256) | 0) + ')'; }
    function bindModeBtn(idx, val) {
      var el = admCircles[idx]; el.classList.add('mb');
      el.addEventListener('click', function (e) {
        if (!window.__adminOn) return;
        e.stopPropagation();
        modeSel = (modeSel === val) ? null : val; modePub();
      });
      el.addEventListener('pointerenter', function () {
        if (!window.__adminOn || !window.matchMedia('(hover: hover)').matches) return; // touch taps must not stick colours on the selected letter
        aglyphs[idx].style.color = rndCol();
        aglyphs[idx].style.webkitTextStrokeColor = rndCol();
      });
      el.addEventListener('pointerleave', function () {
        aglyphs[idx].style.color = ''; aglyphs[idx].style.webkitTextStrokeColor = '';
      });
    }
    bindModeBtn(1, 'm'); bindModeBtn(2, 'd');
    var box = document.createElement('input'); box.type = 'text'; box.maxLength = 4; box.setAttribute('inputmode', 'numeric'); box.autocomplete = 'off'; box.spellcheck = false;
    box.style.cssText = 'position:fixed;left:-200px;top:0;width:20px;height:20px;opacity:0;border:0;padding:0;outline:none';
    document.body.appendChild(box);
    function admShow(v) { adm.classList.toggle('on', v); if (v) { box.value = ''; aglyphs.forEach(function (g) { g.textContent = ''; }); setTimeout(function () { box.focus(); }, 0); } }
    adm.addEventListener('click', function () { box.focus(); });
    box.addEventListener('input', function () {
      box.value = box.value.replace(/\D/g, '').slice(0, 4);
      for (var i = 0; i < 4; i++) aglyphs[i].textContent = box.value[i] || '';
      if (box.value.length === 4) {
        var code = box.value;
        post({ code: code, check: true }).then(function (r) {
          if (r && r.ok) {
            admin = code; sent = {}; Object.keys(P).forEach(function (k) { sent[k] = P[k]; });
            var ABDU = 'ABDU'; for (var i = 0; i < 4; i++) aglyphs[i].textContent = ABDU[i];
            window.__adminOn = true;
            adm.classList.add('ok');
          } else {
            adm.classList.add('err'); setTimeout(function () { adm.classList.remove('err'); aglyphs.forEach(function (g) { g.textContent = ''; }); }, 600);
          }
          box.value = ''; box.blur(); // hand the keys back: 'c' and the rest belong to the sketch again
        }).catch(function () { box.value = ''; box.blur(); });
      }
    });
    box.addEventListener('keydown', function (e) { e.stopPropagation(); });
    var admIv = null, admT0 = 0, admPX = 0, admPY = 0;
    var admStop = function () { if (admIv) { clearInterval(admIv); admIv = null; } };
    // direct hit test against the live circles: on touch there is no hover frame before the press, so lastCircleHit cannot be trusted at pointerdown
    var admDotHit = function (x, y) { for (var i = 0; i < circlesNow.length; i++) { var c = circlesNow[i]; if (/^R0_/.test(c.key) && Math.hypot(x - c.x, y - c.y) < c.r) return true; } return false; };
    window.addEventListener('pointermove', function (e) { admPX = e.clientX; admPY = e.clientY; }, { passive: true });
    var admToggle = function () {
      if (admin) { admin = null; window.__adminOn = false; adm.classList.remove('ok'); modeSel = null; modePub(); admShow(false); }
      else if (!adm.classList.contains('on')) admShow(true);
      else admShow(false);
    };
    window.addEventListener('pointerdown', function (e) {
      admStop();
      admPX = e.clientX; admPY = e.clientY;
      if (!admDotHit(admPX, admPY)) return;
      admT0 = performance.now();
      admIv = setInterval(function () {
        if (!admDotHit(admPX, admPY)) { admStop(); return; }
        if (performance.now() - admT0 < 5000) return;
        admStop();
        admToggle();
      }, 100);
    });
    // release fallback: on a janky main thread the 100ms interval can be delayed past the release - a completed 5s hold must still toggle
    window.addEventListener('pointerup', function (e) {
      if (!admIv) return;
      admStop();
      if (performance.now() - admT0 >= 5000 && admDotHit(e.clientX, e.clientY)) admToggle();
    });
    window.addEventListener('pointercancel', admStop);
  })();
  function syncUI(total) {
    placeCircles();
    var now = performance.now(); if (now - lastSync < 300) return; lastSync = now;
    statsEl.innerHTML = '<span>Cells</span><span class="n">' + total.toFixed(2) + '</span><span>Universe</span><span class="n">' + P.UNIVERSE_SIZE.toFixed(2) + '</span><span>Refresh S</span><span class="n">' + Math.max(0, refreshInterval - (now - lastRefresh) / 1000).toFixed(2) + '</span><span>FPS</span><span class="n">' + fps.toFixed(2) + '</span><span>Res</span><span class="n">' + (res * 100).toFixed(2) + '</span>';
    if (perfOn) { // the perf circle appends its rows under the config stats - no solo, nothing above moves (owner 21 Oct)
      var pf1 = function (k) { return PF[k] === undefined ? '...' : PF[k].toFixed(2); };
      statsEl.innerHTML += '<span>Frame</span><span class="n">' + frameMs.toFixed(2) + '</span><span>Setup</span><span class="n">' + pf1('setup') + '</span><span>Sim UI</span><span class="n">' + pf1('sim+ui draw') + '</span><span>Grain Rest</span><span class="n">' + pf1('grain+rest') + '</span><span>GPU: Draw+Field</span><span class="n">' + pf1('gpu:draw+field') + '</span><span>GPU: Draw Image</span><span class="n">' + pf1('gpu:drawImage') + '</span>';
    }
    // fixed geometry: the label column and every value field are pinned (probed once per font) and the fit only measures the base rows, so a changing value or the perf toggle never moves a row
    statsEl.style.fontSize = ''; statsEl.style.gridTemplateColumns = '';
    var ns2 = statsEl.querySelectorAll('.n'), ni2;
    for (ni2 = 0; ni2 < ns2.length; ni2++) { ns2[ni2].style.fontSize = ''; ns2[ni2].style.width = ''; }
    var labFs0 = parseFloat(getComputedStyle(statsEl).fontSize) || 13, valFs0 = ns2.length ? parseFloat(getComputedStyle(ns2[0]).fontSize) || 54 : 54;
    if (!statGeom || statGeom.key !== labFs0 + '|' + getComputedStyle(statsEl).fontFamily) {
      statGeom = { key: labFs0 + '|' + getComputedStyle(statsEl).fontFamily, labEm: 0, baseLabEm: 0, valEm: 0, rowW0: 0 };
      var prb = document.createElement('div'); prb.className = 'stats'; prb.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:0'; document.body.appendChild(prb);
      var lbls = ['Cells', 'Universe', 'Refresh S', 'FPS', 'Res'], plbls = ['Frame', 'Setup', 'Sim UI', 'Grain Rest', 'GPU: Draw+Field', 'GPU: Draw Image'], wMax = 0, wBase = 0;
      for (var pi2 = 0; pi2 < lbls.length; pi2++) { var ps = document.createElement('span'); ps.textContent = lbls[pi2]; prb.appendChild(ps); wMax = Math.max(wMax, ps.getBoundingClientRect().width); prb.removeChild(ps); }
      wBase = wMax;
      for (var pi3 = 0; pi3 < plbls.length; pi3++) { var ps2 = document.createElement('span'); ps2.textContent = plbls[pi3]; prb.appendChild(ps2); wMax = Math.max(wMax, ps2.getBoundingClientRect().width); prb.removeChild(ps2); }
      var pv = document.createElement('span'); pv.className = 'n'; pv.textContent = '999.99'; prb.appendChild(pv);
      statGeom.labEm = wBase / labFs0; statGeom.valEm = pv.getBoundingClientRect().width / valFs0;
      statGeom.rowW0 = wBase + 12 + pv.getBoundingClientRect().width; // base row width at default fonts - the fit ignores the perf rows on purpose
      document.body.removeChild(prb);
    }
    var cW = statsEl.clientWidth, fit = 1;
    if (cW > 0 && statGeom.rowW0 > cW) fit = (cW - 12) / Math.max(1, statGeom.rowW0 - 12);
    var labPx = Math.max(7, Math.floor(13 * fit * 10) / 10), valPx = Math.max(12, Math.floor(54 * fit));
    if (fit < 1) { statsEl.style.fontSize = labPx + 'px'; for (ni2 = 0; ni2 < ns2.length; ni2++) ns2[ni2].style.fontSize = valPx + 'px'; }
    statsEl.style.gridTemplateColumns = (statGeom.labEm * labPx) + 'px 1fr';
    for (ni2 = 0; ni2 < ns2.length; ni2++) ns2[ni2].style.width = (statGeom.valEm * valPx) + 'px';
    // perf labels longer than the pinned label column shrink individually; base rows keep their font
    var ls2 = statsEl.querySelectorAll('span:nth-child(odd)');
    for (ni2 = 0; ni2 < ls2.length; ni2++) { var lsp = ls2[ni2]; lsp.style.fontSize = ''; var nat = lsp.scrollWidth, box = lsp.clientWidth; if (box > 0 && nat > box + 1) lsp.style.fontSize = Math.max(7, Math.floor(labPx * box / nat * 10) / 10) + 'px'; }
    for (var lk in live) { var lr = rows[lk]; lr.inp.value = P[lk]; lr.val.textContent = fmt(P[lk]); }
    if (panel.matches(':hover')) return;
    GROUPS.forEach(function (g) { g[1].forEach(function (q) { var r = rows[q[0]], v = P[q[0]]; r.inp.value = v; r.val.textContent = fmt(v); }); });
  }

  // ---- loop / events ----
  function resizeCanvas() {
    DPR = P.pixelRatio > 0 ? P.pixelRatio : Math.min(window.devicePixelRatio || 1, 3); W = window.innerWidth; H = window.innerHeight;
    window.__ca2DPR = DPR; // mobile lane: the phone frame reads the real dpr so thin lines stay crisp
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    DD = Math.min(window.devicePixelRatio || 1, 3); lnc.width = Math.round(W * DD); lnc.height = Math.round(H * DD); applyLW();
    // CSS size in real px, not 100vw/100vh: on iOS 100vh is the no-URL-bar height, so the bitmap got stretched and taps landed off
    var rt = document.documentElement.style; rt.setProperty('--vw', W + 'px'); rt.setProperty('--vh', H + 'px');
  }
  function resize() {
    resizeCanvas();
    VS = Math.min(W / 1280, H / 800);
    if (!cont.tw) { setTargets(); cont.ew = cont.tw; cont.eh = cont.th; } // first layout: deal the opening plate
    else clampTargets(); // later resizes keep the current universe and plate; the plate only re-fits into the new safe band, eased by the frame loop
  }
  // a viewport change (rotation, window drag, browser chrome collapsing while scrolling) re-fits the world; it must not
  // wipe it or deal a new random plate - that read as the whole page slipping mid-scroll (owner 20 Oct)
  window.addEventListener('resize', function () { resize(); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', function () { if (Math.abs(window.innerWidth - W) > 1 || Math.abs(window.innerHeight - H) > 1) resize(); });
  window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.over = (e.target === cv); if (curEl.style.display === 'block') curEl.style.transform = 'translate(' + (mouse.x - curRRnow) + 'px,' + (mouse.y - curRRnow) + 'px)'; });
  document.addEventListener('mouseleave', function () { mouse.over = false; curEl.style.display = 'none'; curEdge.style.display = 'none'; });
  window.addEventListener('click', onClick);
  // grab the plate border with the mouse and pull to resize it (symmetric around the centre); cells get restless while dragging
  var resizeDrag = null;
  function edgeHit(x, y, tol) {
    var k = cont; tol = tol || P.edgeGrab; var inX = x > k.x - tol && x < k.x + k.w + tol, inY = y > k.y - tol && y < k.y + k.h + tol, h = 0, v = 0;
    if (inY && (Math.abs(x - k.x) < tol || Math.abs(x - (k.x + k.w)) < tol)) h = 1;
    if (inX && (Math.abs(y - k.y) < tol || Math.abs(y - (k.y + k.h)) < tol)) v = 1;
    return (h || v) ? { h: h, v: v } : null;
  }
  window.addEventListener('mousedown', function (e) {
    if (e.target !== cv) return;
    var hit = edgeHit(e.clientX, e.clientY);
    if (hit) { hit.rx = e.clientX >= W / 2; hit.dy = e.clientY >= H / 2; resizeDrag = hit; e.preventDefault(); return; }
    targetCursorScale = 3.5, cursorScale = 3.5;
  });
  window.addEventListener('mousemove', function (e) {
    if (!resizeDrag) return;
    cont.user = true;
    if (resizeDrag.h) cont.rawW = Math.max(60, 2 * Math.abs(e.clientX - W / 2));
    if (resizeDrag.v) cont.rawH = Math.max(60, 2 * Math.abs(e.clientY - H / 2));
    clampTargets(); cont.ew = cont.tw; cont.eh = cont.th;
  });
  window.addEventListener('mouseup', function () { targetCursorScale = 1; resizeDrag = null; });
  window.addEventListener('keydown', function (e) { keyHeld = e.key.toLowerCase(); if (keyHeld === 'c') panel.classList.toggle('open'); });
  window.addEventListener('keyup', function () { keyHeld = ''; });
  ['pointerdown', 'pointerup', 'pointermove', 'mousemove', 'mousedown', 'wheel', 'scroll', 'touchstart', 'keydown', 'touchend', 'click'].forEach(function (n) { window.addEventListener(n, function () { if (window.CA2Audio && P.audioOn) CA2Audio.start(); }, { passive: true }); });
  window.addEventListener('touchstart', function (e) {
    var t = e.touches[0]; mouse.x = t.clientX; mouse.y = t.clientY; mouse.over = (e.target === cv);
    if (e.target !== cv) return;
    var hit = edgeHit(t.clientX, t.clientY, P.edgeGrab * 1.5);
    if (hit) { hit.rx = t.clientX >= W / 2; hit.dy = t.clientY >= H / 2; resizeDrag = hit; e.preventDefault(); return; }
    targetCursorScale = 3.5; cursorScale = 3.5;
  }, { passive: false });
  window.addEventListener('touchmove', function (e) {
    var t = e.touches[0]; mouse.x = t.clientX; mouse.y = t.clientY;
    if (!resizeDrag) return;
    cont.user = true;
    if (resizeDrag.h) cont.rawW = Math.max(60, 2 * Math.abs(t.clientX - W / 2));
    if (resizeDrag.v) cont.rawH = Math.max(60, 2 * Math.abs(t.clientY - H / 2));
    clampTargets(); cont.ew = cont.tw; cont.eh = cont.th;
  }, { passive: true });
  window.addEventListener('touchend', function () { targetCursorScale = 1; resizeDrag = null; mouse.over = false; }, { passive: true });
  window.addEventListener('touchcancel', function () { targetCursorScale = 1; resizeDrag = null; mouse.over = false; }, { passive: true });

  var last = performance.now(), fcount = 0, ftime = last;
  var rdySet = false;
  function loop(now) {
    requestAnimationFrame(loop);
    if (!ready) return;
    if (now - last < 1000 / P.fps - 1) return;
    last = now; frame(); fcount++;
    if (!rdySet) { rdySet = true; document.body.classList.add('rdy'); } // first real frame is on the canvas: reveal (boot FOUC gate)
    if (now - ftime >= 1000) { fps = fcount * 1000 / (now - ftime); fcount = 0; ftime = now; }
  }
  res = P.resolution;
  (document.fonts && document.fonts.load ? document.fonts.load('40px "Ca2-Thin"') : Promise.resolve()).catch(function () {}).then(function () {
    resize(); randomize(true, true); firstSpawn = false; fadeT0 = performance.now(); ready = true; setTimeout(function () { if (window.CA2Audio && P.audioOn) CA2Audio.start(); }, INTRO_MS + 2000); requestAnimationFrame(loop);
  });
  document.getElementById('tab').addEventListener('click', function () { panel.classList.toggle('open'); });
  var keysEl0 = document.querySelector('#panel .keys'); if (coarseUI && keysEl0) keysEl0.innerHTML = '<div><span>tap</span><span>random action</span></div><div><span>edge drag</span><span>resize plate</span></div><div><span>tab strip</span><span>this panel</span></div>';
  if (/open/.test(location.hash)) panel.classList.add('open');
  // reveal: panel blocks fade in fast; every part of a parameter row (label, value, slider/knob, swatch, button) has its own short fade and its own random delay
  function partIn(el, base) { el.style.animation = 'ca2in ' + (0.16 + Math.random() * 0.2).toFixed(2) + 's ease-out both'; el.style.animationDelay = (base + Math.random() * 0.14).toFixed(3) + 's'; }
  [].forEach.call(panel.children, function (el) { if (el.id !== 'controls') partIn(el, Math.random() * 0.25); });
  [].forEach.call(document.querySelectorAll('#controls .row'), function (el, ri) {
    var base = Math.min(ri, 14) * 0.02, ps = el.querySelectorAll('.lab > span, .lab > b, input, button, select');
    if (!ps.length) { partIn(el, base); return; }
    [].forEach.call(ps, function (p) { partIn(p, base); });
  });
})();

// ==== mobile lane: mobile preset layer + phone-frame support (lane agreement: new code only in this trailing IIFE) ====
// Owner 21 Oct: mobile needs its own presets - the desktop profile does not fit. Effective mobile config =
// desktop profile (built-in + Worker global) overridden by MOBILE_SEED, itself overridden by the Worker global's _mobile.
// In mobile mode an admin Save is rerouted (fetch wrap below) into the global's _mobile object, sent whole every time
// because the Worker merges patches shallowly. Desktop keys are never touched by this IIFE.
(function () {
  'use strict';
  var MOBILE_SEED = { CELL_RADIUS: 24, minRadius: 15, maxRadius: 60, edgeGrab: 30, panelWidth: 320, blurWidth: 260, foodEatR: 7 };
  var AUTO_W = 820; // an unselected window this narrow or smaller runs mobile mode (matches the UI lane's breakpoint)
  var MODE_Q = /[?&]mobile=1/.test(location.search); // the device.html phone frame forces mobile mode with this
  var coarse = window.matchMedia && matchMedia('(hover: none) and (pointer: coarse)').matches;
  // the device.html frame passes the phone's dpr as &dpr=; overriding devicePixelRatio makes the line canvas (DD) and every dpr consumer render hairlines like the real phone
  if (MODE_Q) {
    var dprQ = parseFloat((location.search.match(/[?&]dpr=([0-9.]+)/) || [])[1]);
    if (dprQ >= 1 && dprQ <= 4) try { Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: function () { return dprQ; } }); } catch (e) {}
  }
  function boot() {
    if (!window.__ca2 || !window.__ca2.P) { setTimeout(boot, 100); return; } // __ca2 appears with the first frame
    var P = window.__ca2.P, panel = document.getElementById('panel'), blurEl = document.getElementById('blur'), blurLEl = document.getElementById('blurl');
    var mode = null, lastMob = null, seenV = 0, applying = false, lane = false;
    var lsSel = (function () { var ls = ''; try { ls = localStorage.getItem('ca2.mode') || ''; } catch (e) {} return (ls === 'mobile' || ls === 'm') ? 'm' : (ls === 'desktop' || ls === 'd') ? 'd' : null; })();
    // an in-flight plate transition can keep lerping CELL_RADIUS toward a target dealt under the desktop bounds
    // (~230 measured) for seconds after the switch to mobile; clamp every write while the mobile layer is active
    var crHold = P.CELL_RADIUS;
    try {
      Object.defineProperty(P, 'CELL_RADIUS', {
        configurable: true, enumerable: true,
        get: function () { return crHold; },
        set: function (v) {
          if (mode === 'm' && typeof v === 'number' && isFinite(v)) {
            var lo = P.minRadius, hi = P.maxRadius;
            if (typeof lo === 'number' && typeof hi === 'number' && hi >= lo) v = Math.min(hi, Math.max(lo, v));
          }
          crHold = v;
        }
      });
    } catch (e) {}
    function storedG() { try { return JSON.parse(localStorage.getItem('ca2.global') || 'null'); } catch (e) { return null; } }
    function mobOf(g) { // _mobile may be an object (seeded) or a JSON string (Worker-posted); both parse to the same overrides
      var m = g && g._mobile; if (typeof m === 'string') { try { m = JSON.parse(m); } catch (e) { m = null; } }
      return (m && typeof m === 'object') ? JSON.parse(JSON.stringify(m)) : {};
    }
    function detect() {
      if (window.__ca2Mode) return window.__ca2Mode(); // the UI lane owns mode state whenever its module is present
      if (lsSel) return lsSel;
      return (coarse || MODE_Q || window.innerWidth <= AUTO_W) ? 'm' : 'd';
    }
    function layerKeys() {
      var g = storedG() || {}, o = {}, mb = mobOf(g);
      Object.keys(MOBILE_SEED).forEach(function (k) { o[k] = 1; });
      Object.keys(mb).forEach(function (k) { o[k] = 1; });
      // radius bounds must land before CELL_RADIUS so the clamp uses the new range
      return Object.keys(o).sort(function (a, b) { return (a === 'minRadius' || a === 'maxRadius' ? -1 : 0) - (b === 'minRadius' || b === 'maxRadius' ? -1 : 0); });
    }
    function applyMode() {
      var g = storedG() || {}, mob = (mode === 'm');
      var mb2 = mobOf(g);
      layerKeys().forEach(function (k) {
        var v;
        if (mob) v = (mb2[k] !== undefined) ? mb2[k] : MOBILE_SEED[k];
        else v = (g[k] !== undefined) ? g[k] : MOBILE_SEED[k]; // no desktop source offline: keep the seed value
        if (v === undefined) return;
        if (k === 'minRadius' || k === 'maxRadius') { window.__ca2.setKey(k, v); return; } // clamps CELL_RADIUS into range
        if (k === 'CELL_RADIUS' && (v < P.minRadius || v > Math.max(P.minRadius, P.maxRadius))) v = Math.min(Math.max(v, P.minRadius), Math.max(P.minRadius, P.maxRadius));
        window.__ca2.setKey(k, v);
      });
      applying = true; try { window.dispatchEvent(new Event('resize')); } finally { applying = false; } // re-fit the world + re-derive line widths
    }
    // owner 21 Oct: on mobile the plate is dealt from a 1280x800 landscape reference scaled by window WIDTH, so it
    // squats and wastes the vertical band. Mirror the desktop deal rotated 90 degrees: portrait reference 800x1280,
    // axes swapped (the tall reference side deals the height, the short one the width), clamped by the same safe band.
    var dealW = 0, dealH = 0;
    function dealPortrait() {
      var c = window.__ca2.cont; if (!c || c.user) return; // a hand-pulled size is the owner's, never override it
      // deal against the band itself: probe the clamp ceilings, then deal the desktop's own ratios of them.
      // Desktop height deals run 2160/8 .. 5120/7.5 = 270..731 against a ~580 ceiling (0.47..1.26x), so top deals fill
      // the band; a window-ratio scale (VSh) shrinks the deal on phones while the band grows with H - the squatting.
      c.rawW = 1e9; c.rawH = 1e9; window.__ca2.clampTargets(); // targets clamp to the band ceilings; eased plate barely moves in one frame
      var ceilW = c.tw, ceilH = c.th;
      var cWHf = 7 + Math.floor(Math.random() * 2);
      var a = Math.floor(Math.random() * 2) === 0 ? 5120 : 2160, b = Math.floor(Math.random() * 2) === 0 ? 5120 : 2160;
      c.rawH = b / cWHf * (ceilH / 580); // desktop's height-deal-to-ceiling ratio, mirrored tall
      c.rawW = a / (cWHf + Math.trunc(Math.random() * 4.5 - 3.5)) * (ceilW / 1138); // desktop's width ratio (5120/4.5 = 1138 top deal)
      var minBW = window.innerWidth / 3; // owner 21 Oct: the boundary may narrow at most to a third of the screen width
      if (c.rawW < minBW) c.rawW = minBW;
      window.__ca2.clampTargets();
      if (c.tw < minBW) c.tw = minBW; // the shared area ceiling sits below the floor on phones - the floor wins for width
      dealW = c.rawW; dealH = c.rawH;
    }
    function portraitGuard() {
      if (mode !== 'm') return;
      var c = window.__ca2.cont; if (!c || c.user) return;
      if (c.rawW !== dealW || c.rawH !== dealH) dealPortrait(); // the sim re-dealt a landscape plate (transition): rotate it
      var minBW = window.innerWidth / 3; // owner 21 Oct: boundary floor - a third of the screen width
      if (c.rawW < minBW || c.tw < minBW) { if (c.rawW < minBW) c.rawW = minBW; window.__ca2.clampTargets(); if (c.tw < minBW) c.tw = minBW; dealW = c.rawW; dealH = c.rawH; }
    }
    function refresh(m) { var nm = m || detect(); if (nm === mode) return; mode = nm; applyMode(); if (mode === 'm') dealPortrait(); }
    window.addEventListener('ca2mode', function (e) {
      lane = true; if (!e.detail || !e.detail.mode) return;
      // B picked on a wide desktop window opens the phone-frame preview (owner 21 Oct); the frame is device.html
      if (e.detail.sel === 'm' && !MODE_Q && !coarse && window.innerWidth > AUTO_W && !/device\.html/.test(location.pathname)) { location.href = 'device.html'; return; }
      refresh(e.detail.mode);
    });
    window.addEventListener('resize', function () { if (applying || lane || window.__ca2Mode || lsSel) return; refresh(); }); // fallback auto-switch only while no lane module and no explicit pick
    // the other lane's pullG applies fresh desktop keys over the mobile layer; re-apply it after every global update
    var g0 = storedG(); seenV = (g0 && g0._v) || 0;
    setInterval(function () { var g = storedG(), v = g && g._v; if (v && v !== seenV) { seenV = v; if (mode === 'm') applyMode(); } }, 1000);
    setInterval(portraitGuard, 200); // fast cadence: a re-dealt thin plate must not visibly ease below the width floor (owner 21 Oct)
    (function wFloor() { // render-synced: intervals stall on the saturated main thread, so the eased width itself is floored every painted frame
      requestAnimationFrame(wFloor);
      if (mode !== 'm') return;
      var c = window.__ca2 && window.__ca2.cont; if (!c || c.user) return;
      var f = window.innerWidth / 3;
      if (c.w < f) c.w = f;
    })();
    // admin Save in mobile mode -> touched keys go into _mobile, not the desktop top level
    var of = window.fetch;
    window.fetch = function (url, opt) {
      var rewrote = false, mob = null;
      try {
        if (mode === 'm' && opt && opt.method === 'POST' && typeof url === 'string' && url.indexOf('ca2-presets') >= 0 && typeof opt.body === 'string') {
          var b = JSON.parse(opt.body);
          if (b && b.patch && !b.check) {
            var g = storedG() || {};
            mob = lastMob || mobOf(g);
            Object.keys(b.patch).forEach(function (k) { if (k === '_live' || k === '_mobile') return; mob[k] = b.patch[k]; delete b.patch[k]; rewrote = true; });
            // the Worker stores primitives only - an object patch value is dropped silently, so _mobile travels as a JSON string like _live
            if (rewrote) b.patch._mobile = JSON.stringify(mob);
            opt = Object.assign({}, opt, { body: JSON.stringify(b) });
          }
        }
      } catch (e) {}
      return of.call(this, url, opt).then(function (r) { if (rewrote && r && r.ok) { lastMob = mob; } return r; });
    };
    refresh();
  }
  boot();
  // ---- honest save button + gesture-context code-box focus (owner 21 Oct: locked save must not fake "saved"; lane agreement: trailing IIFE only) ----
  (function adminEntryFix() {
    var saveBtn = [].slice.call(document.querySelectorAll('#btns button')).filter(function (x) { return x.textContent === 'save'; })[0];
    if (saveBtn) saveBtn.dataset.ca2save = '1';
    // (a) locked save: the core handler writes localStorage only but still shows "saved" - block it and say "kilitli"
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('button') : null;
      if (!b || window.__adminOn) return;
      if (b.dataset.ca2save !== '1') return;
      e.stopPropagation(); e.preventDefault();
      b.textContent = 'kilitli';
      // mobile: the locked button is also the entry point - tapping it opens the code panel with the tap pad
      if ((window.__ca2Mode ? window.__ca2Mode() : 'd') === 'm') {
        var adm = document.getElementById('adm');
        if (adm && !adm.classList.contains('on')) {
          adm.classList.add('on');
          var bx = document.querySelector('input[inputmode="numeric"]');
          if (bx) bx.value = '';
          [].slice.call(document.querySelectorAll('#adm span')).forEach(function (g) { g.textContent = ''; });
          setTimeout(focusBox, 0);
        }
      }
    }, true);
    // persistent lock state on the pinned button (mobile only) + a tappable digit pad while the code panel is open:
    // the keyboard-free path - real phones often refuse to open a keyboard for the hidden code box (owner 21 Oct)
    var pad = null;
    function buildPad() {
      pad = document.createElement('div'); pad.id = 'ca2pad';
      pad.style.cssText = 'position:fixed;right:10px;bottom:130px;z-index:41;display:grid;grid-template-columns:repeat(3,44px);gap:6px;background:var(--bg);border:var(--lw) solid var(--fg);padding:8px';
      '1234567890'.split('').forEach(function (dg) {
        var pb = document.createElement('button'); pb.type = 'button'; pb.textContent = dg;
        pb.style.cssText = 'font:inherit;font-size:16px;width:44px;height:44px;background:none;border:var(--lw) solid var(--fg);color:var(--fg);cursor:pointer;padding:0';
        pb.addEventListener('click', function (e) {
          e.stopPropagation(); e.preventDefault();
          var box = document.querySelector('input[inputmode="numeric"]');
          if (!box || box.value.length >= 4) return;
          box.value += dg;
          box.dispatchEvent(new Event('input', { bubbles: true }));
        });
        pad.appendChild(pb);
      });
      document.body.appendChild(pad);
    }
    setInterval(function () {
      if (!saveBtn) return;
      var m = (window.__ca2Mode ? window.__ca2Mode() : 'd') === 'm';
      if (m && !window.__adminOn && saveBtn.textContent === 'save') saveBtn.textContent = 'kilitli';
      if (window.__adminOn && saveBtn.textContent === 'kilitli') saveBtn.textContent = 'save';
      var adm2 = document.getElementById('adm');
      var wantPad = m && !!(adm2 && adm2.classList.contains('on') && !window.__adminOn);
      if (wantPad && !pad) buildPad();
      if (pad) pad.style.display = wantPad ? 'grid' : 'none';
    }, 400);
    // (b)+(c) the 5s hold fires from a timer, outside any gesture, so mobile keyboards never open for the code box.
    // Focus it from real gestures instead: the pointerup that ends the hold, and any tap while the panel is open.
    function focusBox() {
      var adm = document.getElementById('adm');
      if (!adm || !adm.classList.contains('on') || window.__adminOn) return;
      var box = document.querySelector('input[inputmode="numeric"]');
      if (box && document.activeElement !== box) box.focus();
    }
    window.addEventListener('pointerup', function () { setTimeout(focusBox, 0); }); // bubble: registered after adminInit, so the panel is already open when this runs
    document.addEventListener('click', function () { setTimeout(focusBox, 0); }, true);
    // (d) pinned save on mobile: the real save button sits far below the fold - move the same element (listeners intact) to the viewport corner in mobile mode, park it back in #btns on desktop
    if (saveBtn) {
      var home = saveBtn.parentNode, pinned = false, inFrame = window.self !== window.top, pst = document.createElement('style');
      pst.textContent = 'button.ca2savepin{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(12px + env(safe-area-inset-bottom));z-index:40;font:inherit;color:var(--fg);background:var(--bg);border:var(--lw) solid var(--fg);padding:6px 10px;cursor:pointer}';
      document.head.appendChild(pst);
      var pinSave = function () {
        var m = (window.__ca2Mode ? window.__ca2Mode() : 'd') === 'm' && !inFrame;
        if (m && !pinned) { pinned = true; saveBtn.classList.add('ca2savepin'); document.body.appendChild(saveBtn); }
        else if (!m && pinned) { pinned = false; saveBtn.classList.remove('ca2savepin'); home.appendChild(saveBtn); }
      };
      window.addEventListener('ca2mode', pinSave);
      window.addEventListener('resize', pinSave);
      pinSave();
    }
  })();
})();
