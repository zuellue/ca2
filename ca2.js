// CA2 - browser port of rr2ll2ia3target11.pde (sim, HUD, axis lines) with a redesigned config panel.
(function () {
  'use strict';
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, DPR = 1;
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
    noiseStrength: 0, fps: 60, containerCorner: 18,
    resolution: 1, margin: 28, gap: 14, textScale: 1, areaMin: 0.3, areaMax: 1,
    colorSpeed: 0.5, morphEase: 0.5, pixelRatio: 0, autoQuality: 1, showHud: 1, showAxis: 1
  };
  var DEFAULTS = JSON.parse(JSON.stringify(P));
  var autoRefresh = true, lockParams = false;
  var BGS = [[233,233,233],[22,22,22],[255,0,0],[0,255,0],[0,0,255]];
  var bgIndex = 0, bg = [255,255,255], bgTarget = [233,233,233];
  
  var cells = [], food = [];
  var cont = { x: 0, y: 0, w: 0, h: 0, tw: 0, th: 0, ew: 0, eh: 0 };
  var mouse = { x: 0, y: 0, over: false };
  var hovering = false, hoverCol = [255,255,255];
  var refreshInterval = 10, lastRefresh = performance.now();
  var keyHeld = '';
  var eased = { total: [0,0,0,1], title: [0,0,0,1], coor: [0,0,0,1], axis: [0,0,0,1], r: [255,0,0,1], g: [0,255,0,1], b: [0,0,255,1] };
  var fps = 0;

  // ---- cells ----
  function Cell(x, y, gene, mr) {
    this.x = x; this.y = y; var v = rand2D();
    this.maxSpeed = Math.max(0, P.baseMaxSpeed + rnd(-P.maxSpeedVariation, P.maxSpeedVariation));
    this.vx = v.x * this.maxSpeed; this.vy = v.y * this.maxSpeed;
    this.gene = gene; this.alive = true; this.radius = P.CELL_RADIUS; this.energy = 12; this.mutationRate = mr;
    this.hostility = Math.random(); this.speedModifier = rnd(0.7, 2.3);
  }
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
    limit(c, c.maxSpeed);
  }
  function update(c) {
    if (!c.alive) return;
    var dm = Math.hypot(c.x - mouse.x, c.y - mouse.y), sm = dm < P.slowDownRadius ? P.speedReductionFactor : 1;
    var r = rand2D(); c.vx += r.x * 0.2 * sm; c.vy += r.y * 0.2 * sm;
    limit(c, c.maxSpeed * sm * c.speedModifier);
    organic(c);
    c.x += c.vx; c.y += c.vy;
    c.energy -= P.energyConsumptionRate;
    if (c.energy <= 0) c.alive = false;
    for (var i = food.length - 1; i >= 0; i--) {
      if (Math.hypot(c.x - food[i].x, c.y - food[i].y) < c.radius) { c.energy += P.foodEnergyValue; food.splice(i, 1); }
    }
    if (c.x < cont.x || c.x > cont.x + cont.w || c.y < cont.y || c.y > cont.y + cont.h) c.alive = false;
  }
  function interact(a, b) {
    if (a === b || !a.alive || !b.alive) return;
    var dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
    if (dist >= P.interactionRadius) return;
    var infl = map(dist, 0, P.interactionRadius, 1, 0);
    var gc = Math.trunc(infl * (b.gene - a.gene) * 0.1);
    var et = P.energyGainFromInteraction * infl * (1 - Math.abs(a.gene - b.gene) / (P.GENE_MAX - P.GENE_MIN));
    a.energy += et; b.energy -= et;
    a.gene = clamp(a.gene + gc, P.GENE_MIN, P.GENE_MAX); b.gene = clamp(b.gene - gc, P.GENE_MIN, P.GENE_MAX);
    if (a.hostility > 0.5) {
      var l = dist || 1; a.vx += (-dx / l) * 0.05 * a.hostility; a.vy += (-dy / l) * 0.05 * a.hostility;
    }
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
      cells.push(new Cell((a.x + b.x) / 2 + r.x * a.radius, (a.y + b.y) / 2 + r.y * a.radius, ng, nm));
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
  function lay() {
    // all typography metrics derive from one font size; margin is equal on every edge
    var fs = 210 * Math.min(W / 2560, H / 1600) * P.textScale, dh = 0.666 * fs;
    ctx.font = fs + 'px "Ca2-Thin", monospace';
    var sideW = ctx.measureText('3333').actualBoundingBoxRight; // widest 4-digit number
    var M = P.margin, G = P.gap;
    var halfW = W / 2 - (M + sideW + G), halfH = H / 2 - (M + dh + G);
    return { fs: fs, dh: dh, M: M, G: G, sideW: sideW, safeW: Math.max(60, halfW * 2), safeH: Math.max(60, halfH * 2) };
  }
  function setTargets() {
    var L = lay(), cWHf = Math.floor(rnd(7, 8));
    var a = Math.floor(rnd(2)) === 0 ? 5120 : 2160, b = Math.floor(rnd(2)) === 0 ? 5120 : 2160;
    var tw = a / (cWHf + Math.trunc(rnd(-3.5, 1))) * VS, th = b / cWHf * VS;
    // ceiling and floor: the area never leaves the band between the typography rows / side numbers
    var lo = Math.min(P.areaMin, P.areaMax), hi = Math.max(P.areaMin, P.areaMax);
    cont.tw = clamp(tw, L.safeW * lo, L.safeW * hi);
    cont.th = clamp(th, L.safeH * lo, L.safeH * hi);
  }
  function randomize() {
    cells = []; food = [];
    if (!lockParams) {
      P.UNIVERSE_SIZE = Math.floor(rnd(1, rnd(20, 200)));
      P.baseMutationRate = rnd(2, 8); P.mutationRateRange = rnd(1, 4);
      P.interactionRadius = rnd(10, 30); P.CELL_RADIUS = rnd(P.minRadius, P.maxRadius);
    }
    setTargets();
    var gx = cont.tw ? (W - cont.tw) / 2 : 0, gy = cont.th ? (H - cont.th) / 2 : 0;
    for (var i = 0; i < P.UNIVERSE_SIZE; i++) {
      cells.push(new Cell(rnd(cont.tw) + gx, rnd(cont.th) + gy, Math.floor(rnd(P.GENE_MIN, P.GENE_MAX + 1)), P.baseMutationRate + rnd(-P.mutationRateRange, P.mutationRateRange)));
    }
    var nf = cont.tw * cont.th * P.foodDensity / 2;
    for (var j = 0; j < nf; j++) food.push({ x: rnd(cont.tw) + gx, y: rnd(cont.th) + gy });
    newRefresh();
  }
  function newRefresh() {
    var lo = Math.min(P.minRefreshInterval, P.maxRefreshInterval), hi = Math.max(P.minRefreshInterval, P.maxRefreshInterval);
    refreshInterval = rnd(lo, hi); lastRefresh = performance.now();
  }
  function cycleBg() { bgIndex = (bgIndex + 1) % BGS.length; bgTarget = BGS[bgIndex]; }
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
  var cursorScale = 1, targetCursorScale = 1;
  function onClick(e) {
    if (e.target !== cv) return;
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
  function drawMetaballs(S) {
    var bw = Math.max(1, Math.ceil(cont.w * S)), bh = Math.max(1, Math.ceil(cont.h * S));
    if (bw !== bufW || bh !== bufH) {
      bufW = bw; bufH = bh; off.width = bw; off.height = bh; img = octx.createImageData(bw, bh); u32 = new Uint32Array(img.data.buffer);
      fSum = new Float32Array(bw * bh); fR = new Float32Array(bw * bh); fG = new Float32Array(bw * bh); fB = new Float32Array(bw * bh);
    } else { fSum.fill(0); fR.fill(0); fG.fill(0); fB.fill(0); }
    var ms = P.metaballStrength, TH = P.THRESHOLD, inv = 1 / S;
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      if (!c.alive || c.x < cont.x || c.x > cont.x + cont.w || c.y < cont.y || c.y > cont.y + cont.h) continue;
      var cx = (c.x - cont.x), cy = (c.y - cont.y), r2 = ms * c.radius * c.radius;
      var Rc = c.radius * Math.max(3, Math.sqrt(ms / (TH * 0.03)));
      var x0 = Math.max(0, Math.floor((cx - Rc) * S)), x1 = Math.min(bw - 1, Math.ceil((cx + Rc) * S));
      var y0 = Math.max(0, Math.floor((cy - Rc) * S)), y1 = Math.min(bh - 1, Math.ceil((cy + Rc) * S));
      var arr = c.gene > 2 ? fR : c.gene < -2 ? fG : fB;
      for (var y = y0; y <= y1; y++) {
        var dy = (y + 0.5) * inv - cy, row = y * bw;
        for (var x = x0; x <= x1; x++) {
          var dx = (x + 0.5) * inv - cx, inf = r2 / (dx * dx + dy * dy + 0.0001);
          fSum[row + x] += inf; arr[row + x] += inf * inf;
        }
      }
    }
    var br = bg[0] | 0, bgc = bg[1] | 0, bb = bg[2] | 0, ns = P.noiseStrength, band = TH * 0.08, p = 0, n = bw * bh;
    var data = img.data;
    for (p = 0; p < n; p++) {
      var s = fSum[p], q = p << 2;
      if (s > TH * 0.96) {
        var r = fR[p], g = fG[p], b = fB[p], t = r + g + b; if (t > 0) { r /= t; g /= t; b /= t; }
        var nv = ns ? ((p * 2654435761 >>> 0) % 1000 / 500 - 1) * ns : 0, a = Math.min(1, (s - TH * 0.96) / band);
        data[q] = br + (clamp(r * 255 + nv, 0, 255) - br) * a; data[q + 1] = bgc + (clamp(g * 255 + nv, 0, 255) - bgc) * a; data[q + 2] = bb + (clamp(b * 255 + nv, 0, 255) - bb) * a;
      } else { data[q] = br; data[q + 1] = bgc; data[q + 2] = bb; }
      data[q + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = S < DPR * 0.999; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, bw, bh, cont.x, cont.y, cont.w, cont.h); // exact fit to the area rectangle
  }
  function colorAt(x, y) {
    if (img && x >= cont.x && x < cont.x + cont.w && y >= cont.y && y < cont.y + cont.h) {
      var bx = Math.min(bufW - 1, Math.floor((x - cont.x) * curS)), by = Math.min(bufH - 1, Math.floor((y - cont.y) * curS)), q = (by * bufW + bx) * 4;
      return [img.data[q], img.data[q + 1], img.data[q + 2]];
    }
    return [bg[0], bg[1], bg[2]];
  }
  function invAt(x, y) { var c = colorAt(x, y); return [255 - c[0], 255 - c[1], 255 - c[2]]; }
  function invArea(x, y) {
    var s = [0, 0, 0], n = 0;
    for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { var c = colorAt(x + i, y + j); s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; n++; }
    return [255 - s[0] / n, 255 - s[1] / n, 255 - s[2] / n];
  }

  // ---- frame ----
  var res = 1, frameMs = 0;
  function frame() {
    var t0 = performance.now();
    cont.ew += (cont.tw - cont.ew) * P.morphEase; cont.eh += (cont.th - cont.eh) * P.morphEase;
    if (Math.abs(cont.ew - cont.tw) < 0.1) cont.ew = cont.tw; if (Math.abs(cont.eh - cont.th) < 0.1) cont.eh = cont.th;
    cont.w = Math.floor(cont.ew); cont.h = Math.floor(cont.eh); cont.x = Math.floor((W - cont.w) / 2); cont.y = Math.floor((H - cont.h) / 2);

    bg = lerpC(bg, bgTarget, P.colorSpeed);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = css(bg, 1); ctx.fillRect(0, 0, W, H);

    if (Math.random() < P.foodDensity && food.length < cont.w * cont.h * P.foodDensity * 2) food.push({ x: rnd(cont.w) + cont.x, y: rnd(cont.h) + cont.y });
    if (Math.random() < 0.001 && food.length) food.splice(Math.floor(rnd(food.length)), 1);

    hovering = false; var tmpHover = [255, 255, 255], hoverCell = null;
    for (var i = cells.length - 1; i >= 0; i--) {
      var c = cells[i]; update(c); checkSurvival(c);
      if (mouse.over && Math.hypot(mouse.x - c.x, mouse.y - c.y) < c.radius && c.x > cont.x && c.x < cont.x + cont.w && c.y > cont.y && c.y < cont.y + cont.h) {
        hovering = true; hoverCell = c;
        var r = 0, g = 0, b = 0;
        for (var j = 0; j < cells.length; j++) {
          var o = cells[j]; if (!o.alive) continue;
          var d = Math.hypot(mouse.x - o.x, mouse.y - o.y), inf = P.metaballStrength * c.radius * c.radius / (d * d + 0.0001); inf *= inf;
          if (o.gene > 2) r += inf; else if (o.gene < -2) g += inf; else b += inf;
        }
        var t = r + g + b; if (t > 0) { r /= t; g /= t; b /= t; }
        tmpHover = [r * 255, g * 255, b * 255];
      }
      for (var k = i - 1; k >= 0; k--) interact(c, cells[k]);
      if (!c.alive) cells.splice(i, 1);
    }
    hoverCol = hovering ? tmpHover : [255, 255, 255];

    curS = DPR * res; drawMetaballs(curS);

    ctx.fillStyle = 'rgb(200,100,0)';
    for (i = 0; i < food.length; i++) ctx.fillRect(food[i].x, food[i].y, 1, 1);
    if (hovering && hoverCell) { ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hoverCell.x, hoverCell.y, hoverCell.radius, 0, 6.2832); ctx.stroke(); }

    var rc = 0, gc = 0, bc = 0;
    for (i = 0; i < cells.length; i++) { var gn = cells[i].gene; if (gn > 2) rc++; else if (gn < -2) gc++; else bc++; }
    var dom = [0, 0, 0];
    if (rc > gc && rc > bc) dom = [255, 0, 0]; else if (gc > rc && gc > bc) dom = [0, 255, 0]; else if (bc > rc && bc > gc) dom = [0, 0, 255];

    var mv = mouse.over ? invAt(mouse.x, mouse.y) : [bg[0] > 128 ? 0 : 255, bg[0] > 128 ? 0 : 255, bg[0] > 128 ? 0 : 255], k2 = 0.3;
    var tt, tl, tc, ta, trr, tgg, tbb;
    if (hovering) { tt = hoverCol.concat(1); tc = hoverCol.concat(1); ta = hoverCol.concat(1); trr = tgg = tbb = hoverCol.concat(1); tl = mv.concat(1); }
    else { tt = mv.concat(1); tc = mv.concat(50 / 255); tl = mv.concat(222 / 255); ta = mv.concat(30 / 255); trr = [255, 0, 0, 1]; tgg = [0, 255, 0, 1]; tbb = [0, 0, 255, 1]; }
    eased.total = lerpA(eased.total, tt, k2); eased.title = lerpA(eased.title, tl, k2); eased.coor = lerpA(eased.coor, tc, k2);
    eased.axis = lerpA(eased.axis, ta, k2); eased.r = lerpA(eased.r, trr, k2); eased.g = lerpA(eased.g, tgg, k2); eased.b = lerpA(eased.b, tbb, k2);

    // area outline: no rounded corners. Each side stops `corner` px short of both ends, so the corner lines never meet.
    var cr = Math.min(P.containerCorner, cont.w / 2, cont.h / 2);
    ctx.strokeStyle = css(dom, 1); ctx.lineWidth = 2; ctx.lineCap = 'butt'; ctx.beginPath();
    ctx.moveTo(cont.x + cr, cont.y); ctx.lineTo(cont.x + cont.w - cr, cont.y);
    ctx.moveTo(cont.x + cont.w, cont.y + cr); ctx.lineTo(cont.x + cont.w, cont.y + cont.h - cr);
    ctx.moveTo(cont.x + cont.w - cr, cont.y + cont.h); ctx.lineTo(cont.x + cr, cont.y + cont.h);
    ctx.moveTo(cont.x, cont.y + cont.h - cr); ctx.lineTo(cont.x, cont.y + cr);
    ctx.stroke();

    var L = lay(), M = L.M, G = L.G, fs = L.fs, dh = L.dh;
    var sY = String(Math.round(mouse.y)), sX = String(Math.round(mouse.x)), sT = String(cells.length);
    var vTop = M + dh + G, vBot = H - M - dh - G, cxm = W / 2, cym = H / 2;
    var mT, mX;
    if (P.showHud) {
      ctx.font = fs + 'px "Ca2-Thin", monospace'; ctx.textBaseline = 'alphabetic';
      var put = function (txt, col, align, x, y) { ctx.fillStyle = css(col); ctx.textAlign = align; ctx.fillText(txt, x, y); };
      // ink-aligned margins: every edge has the same margin M
      var topBase = M + dh, botBase = H - M, midBase = cym + dh / 2;
      ctx.textAlign = 'left'; var lz = ctx.measureText('CELYLAR'); 
      put('CELYLAR', eased.title, 'left', M + lz.actualBoundingBoxLeft, topBase);
      ctx.textAlign = 'right'; var rz = ctx.measureText('AUTOMW');
      put('AUTOMW', eased.title, 'right', W - M - rz.actualBoundingBoxRight, topBase);
      put(sY, eased.coor, 'center', cxm, topBase);
      ctx.textAlign = 'right'; mX = ctx.measureText(sX);
      var rx = W - M - mX.actualBoundingBoxRight;
      put(sX, eased.coor, 'right', rx, midBase);
      ctx.textAlign = 'left'; mT = ctx.measureText(sT);
      var lx = M + mT.actualBoundingBoxLeft;
      put(sT, eased.total, 'left', lx, midBase);
      ctx.textAlign = 'right'; var bz = ctx.measureText(String(bc));
      put(String(bc), eased.b, 'right', W - M - bz.actualBoundingBoxRight, botBase);
      ctx.textAlign = 'left'; var rzz = ctx.measureText(String(rc));
      put(String(rc), eased.r, 'left', M + rzz.actualBoundingBoxLeft, botBase);
      put(String(gc), eased.g, 'center', cxm, botBase);
    }
    if (P.showAxis) {
      ctx.font = fs + 'px "Ca2-Thin", monospace';
      ctx.textAlign = 'left'; mT = ctx.measureText(sT); ctx.textAlign = 'right'; mX = ctx.measureText(sX);
      var hL = M + (mT.actualBoundingBoxRight) + G, hR = W - M - mX.actualBoundingBoxLeft - G; // gap G to the side numbers' ink
      ctx.strokeStyle = css(eased.axis); ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(hL, cym); ctx.lineTo(hR, cym);
      ctx.moveTo(cxm, vTop); ctx.lineTo(cxm, vBot);   // fixed: depends only on margin, glyph height and gap
      ctx.moveTo(cxm, cym); ctx.lineTo(lerp(cxm, 0, 0.75), lerp(cym, H, 0.75));
      ctx.moveTo(cxm, cym); ctx.lineTo(lerp(cxm, W, 0.75), lerp(cym, H, 0.75));
      ctx.stroke();
    }

    // cursor: system arrow normally; over a cell the pde's ring + dot (ring at diameter/5, dot scaled 3.5x while pressed)
    cursorScale += (targetCursorScale - cursorScale) * 0.75;
    if (hovering && mouse.over) {
      cv.style.cursor = 'none';
      var ic = invArea(mouse.x, mouse.y), rr = P.CELL_RADIUS * 2 / 5;
      ctx.strokeStyle = css(ic, 1); ctx.fillStyle = css(ic, 1); ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, rr, 0, 6.2832); ctx.stroke();
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 0.25 * cursorScale, 0, 6.2832); ctx.fill();
    } else cv.style.cursor = 'default';

    window.__ca2 = { vTop: vTop, vBot: vBot, gap: G, margin: M, topInkBottom: M + dh, botInkTop: H - M - dh, hL: typeof hL === 'undefined' ? 0 : hL, W: W, H: H, res: res, cells: cells.length, areaTop: cont.y, areaBottom: cont.y + cont.h, areaLeft: cont.x, areaRight: cont.x + cont.w, safeW: L.safeW, safeH: L.safeH };

    if (autoRefresh && performance.now() - lastRefresh > refreshInterval * 1000) randomize();
    syncUI(rc + gc + bc);
    var lum = (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]), fgc = lum > 128 ? '17,17,17' : '240,240,240', root = document.documentElement.style;
    root.setProperty('--fg', 'rgb(' + fgc + ')'); root.setProperty('--fg-soft', 'rgba(' + fgc + ',.35)'); root.setProperty('--bg', css(bg, 1));
    // quality governor: keeps the frame rate by lowering resolution, raises it back when there is room
    frameMs = lerp(frameMs, performance.now() - t0, 0.1);
    if (P.autoQuality) {
      var budget = 1000 / P.fps;
      if (frameMs > budget * 0.9) res = Math.max(0.35, res * 0.94); else if (frameMs < budget * 0.45) res = Math.min(P.resolution, res * 1.03);
      res = Math.min(res, P.resolution);
    } else res = P.resolution;
  }

  // ---- config panel: every parameter ----
  var rows = {}, statsEl = document.getElementById('stats'), ctl = document.getElementById('controls'), btns = document.getElementById('btns');
  var GROUPS = [
    ['picture', [
      ['resolution', 'resolution', 0.25, 1, 0.01], ['pixelRatio', 'pixel ratio (0 = auto)', 0, 3, 0.25],
      ['margin', 'margin (all edges)', 0, 120, 1], ['gap', 'line gap to numbers', 0, 60, 1],
      ['textScale', 'type size', 0.4, 1.6, 0.01], ['containerCorner', 'corner gap', 0, 80, 1],
      ['areaMin', 'area floor', 0.1, 1, 0.01], ['areaMax', 'area ceiling', 0.1, 1, 0.01],
      ['morphEase', 'area morph speed', 0.02, 1, 0.01], ['colorSpeed', 'color speed', 0.02, 1, 0.01],
      ['noiseStrength', 'grain', 0, 40, 1], ['fps', 'fps', 5, 120, 1]]],
    ['cells', [
      ['UNIVERSE_SIZE', 'universe', 1, 400, 1], ['CELL_RADIUS', 'cell r', 2, 100, 1], ['minRadius', 'cell r min', 1, 50, 1], ['maxRadius', 'cell r max', 5, 150, 1],
      ['baseMaxSpeed', 'speed', 0.5, 25, 0.5], ['maxSpeedVariation', 'speed variation', 0, 30, 0.5],
      ['interactionRadius', 'interaction r', 5, 100, 1], ['baseMutationRate', 'mutation', 0.5, 20, 0.5], ['mutationRateRange', 'mutation range', 0.5, 8, 0.5],
      ['energyConsumptionRate', 'energy use', 0, 0.5, 0.002], ['energyGainFromInteraction', 'energy gain', 0, 0.05, 0.001], ['minEnergyForReproduction', 'repro energy', 0.05, 10, 0.05],
      ['slowDownRadius', 'mouse slow r', 0, 100, 1], ['speedReductionFactor', 'mouse slow x', 1, 100, 0.5]]],
    ['field', [
      ['THRESHOLD', 'metaball threshold', 0.05, 0.6, 0.01], ['metaballStrength', 'metaball strength', 0.005, 0.1, 0.001],
      ['foodDensity', 'food density', 0, 0.1, 0.005], ['foodEnergyValue', 'food energy', 0, 20, 0.5],
      ['minRefreshInterval', 'refresh min s', 2, 60, 1], ['maxRefreshInterval', 'refresh max s', 3, 90, 1]]]
  ];
  var layoutKeys = { margin: 1, gap: 1, textScale: 1, areaMin: 1, areaMax: 1 };
  function fmt(v) { return Math.abs(v) >= 100 ? String(Math.round(v)) : String(Math.round(v * 1000) / 1000); }
  var lockBox, lockVal;
  GROUPS.forEach(function (grp) {
    var h = document.createElement('div'); h.className = 'grp'; h.textContent = grp[0]; ctl.appendChild(h);
    grp[1].forEach(function (q) {
      var d = document.createElement('div'); d.className = 'row';
      d.innerHTML = '<div class="lab"><span>' + q[1] + '</span><b style="font-weight:normal"></b></div><input type="range" min="' + q[2] + '" max="' + q[3] + '" step="' + q[4] + '">';
      var inp = d.querySelector('input'), val = d.querySelector('b');
      inp.addEventListener('input', function () {
        var v = parseFloat(inp.value); P[q[0]] = v; val.textContent = fmt(v);
        if (q[0] === 'CELL_RADIUS') cells.forEach(function (c) { c.radius = v; });
        if (q[0] === 'pixelRatio') resize();
        if (q[0] === 'resolution') res = v;
        if (layoutKeys[q[0]]) { setTargets(); }
        if (q[0] === 'fps') { /* nothing */ } else if (/UNIVERSE|CELL_RADIUS|Mutation|interaction|Rate/.test(q[0])) { lockParams = true; if (lockBox) { lockBox.checked = true; lockVal.textContent = 'on'; } }
        save();
      });
      ctl.appendChild(d); rows[q[0]] = { inp: inp, val: val };
    });
  });
  function toggle(label, init, fn) {
    var l = document.createElement('label'); l.className = 'chk';
    l.innerHTML = '<span>' + label + '</span><b>' + (init ? 'on' : 'off') + '</b><input type="checkbox" style="display:none"' + (init ? ' checked' : '') + '>';
    var c = l.querySelector('input'), b = l.querySelector('b');
    c.addEventListener('change', function () { b.textContent = c.checked ? 'on' : 'off'; fn(c.checked); save(); });
    ctl.appendChild(l); return { box: c, val: b };
  }
  var gh = document.createElement('div'); gh.className = 'grp'; gh.textContent = 'switches'; ctl.appendChild(gh);
  var lockT = toggle('lock values on refresh', false, function (v) { lockParams = v; });
  lockBox = lockT.box; lockVal = lockT.val;
  toggle('auto refresh', true, function (v) { autoRefresh = v; lastRefresh = performance.now(); });
  toggle('auto quality', !!P.autoQuality, function (v) { P.autoQuality = v ? 1 : 0; });
  toggle('typography', !!P.showHud, function (v) { P.showHud = v ? 1 : 0; });
  toggle('axis lines', !!P.showAxis, function (v) { P.showAxis = v ? 1 : 0; });
  var bgRow = document.createElement('div'); bgRow.className = 'row';
  bgRow.innerHTML = '<div class="lab"><span>background</span><b style="font-weight:normal">#e9e9e9</b></div>';
  var colorInp = document.createElement('input'); colorInp.type = 'color'; colorInp.value = '#e9e9e9'; colorInp.style.cssText = 'width:100%;height:22px;border:0;background:none;padding:0;cursor:pointer';
  colorInp.addEventListener('input', function () { var v = colorInp.value; bgTarget = [parseInt(v.substr(1, 2), 16), parseInt(v.substr(3, 2), 16), parseInt(v.substr(5, 2), 16)]; bgRow.querySelector('b').textContent = v; });
  bgRow.appendChild(colorInp); ctl.appendChild(bgRow);
  function btn(label, fn) { var b = document.createElement('button'); b.textContent = label; b.addEventListener('click', fn); btns.appendChild(b); }
  btn('respawn', function () { randomize(); });
  btn('randomize all', function () { lockParams = false; lockBox.checked = false; lockVal.textContent = 'off'; randomize(); });
  btn('background', cycleBg);
  btn('reset all', function () { Object.keys(DEFAULTS).forEach(function (k) { P[k] = DEFAULTS[k]; }); res = P.resolution; resize(); randomize(); save(); });
  btn('copy json', function () { try { navigator.clipboard.writeText(JSON.stringify(P, null, 1)); } catch (e) {} });
  var panel = document.getElementById('panel');
  panel.addEventListener('click', function (e) { e.stopPropagation(); });
  function save() { try { localStorage.setItem('ca2.settings.v2', JSON.stringify(P)); } catch (e) {} }
  var lastSync = 0;
  function syncUI(total) {
    var now = performance.now(); if (now - lastSync < 300) return; lastSync = now;
    statsEl.innerHTML = '<span>cells</span><span class="n">' + total + '</span><span>universe</span><span class="n">' + P.UNIVERSE_SIZE + '</span><span>refresh s</span><span class="n">' + Math.round(Math.max(0, refreshInterval - (now - lastRefresh) / 1000)) + '</span><span>fps</span><span class="n">' + Math.round(fps) + '</span><span>res</span><span class="n">' + Math.round(res * 100) + '</span>';
    if (panel.matches(':hover')) return;
    GROUPS.forEach(function (g) { g[1].forEach(function (q) { var r = rows[q[0]], v = P[q[0]]; r.inp.value = v; r.val.textContent = fmt(v); }); });
  }

  // ---- loop / events ----
  function resize() {
    DPR = P.pixelRatio > 0 ? P.pixelRatio : Math.min(window.devicePixelRatio || 1, 3); W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    VS = Math.min(W / 1280, H / 800);
    setTargets(); cont.ew = cont.tw; cont.eh = cont.th;
  }
  window.addEventListener('resize', function () { resize(); randomize(); });
  window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.over = (e.target === cv); });
  document.addEventListener('mouseleave', function () { mouse.over = false; });
  window.addEventListener('click', onClick);
  window.addEventListener('mousedown', function (e) { if (e.target === cv) targetCursorScale = 3.5, cursorScale = 3.5; });
  window.addEventListener('mouseup', function () { targetCursorScale = 1; });
  window.addEventListener('keydown', function (e) { keyHeld = e.key.toLowerCase(); if (keyHeld === 'c') panel.classList.toggle('open'); });
  window.addEventListener('keyup', function () { keyHeld = ''; });
  window.addEventListener('touchstart', function (e) { var t = e.touches[0]; mouse.x = t.clientX; mouse.y = t.clientY; mouse.over = true; }, { passive: true });

  var last = performance.now(), fcount = 0, ftime = last, ready = false;
  function loop(now) {
    requestAnimationFrame(loop);
    if (!ready) return;
    if (now - last < 1000 / P.fps - 1) return;
    last = now; frame(); fcount++;
    if (now - ftime >= 1000) { fps = fcount * 1000 / (now - ftime); fcount = 0; ftime = now; }
  }
  try { var sv = JSON.parse(localStorage.getItem('ca2.settings.v2') || 'null'); if (sv) Object.keys(sv).forEach(function (k) { if (k in P) P[k] = sv[k]; }); } catch (e) {}
  res = P.resolution;
  (document.fonts && document.fonts.load ? document.fonts.load('40px "Ca2-Thin"') : Promise.resolve()).catch(function () {}).then(function () {
    resize(); randomize(); ready = true; requestAnimationFrame(loop);
  });
  document.getElementById('tab').addEventListener('click', function () { panel.classList.toggle('open'); });
  if (/open/.test(location.hash)) panel.classList.add('open');
})();
