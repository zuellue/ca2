// CA2 - browser port of rr2ll2ia3target11.pde (sim, HUD, axis lines) with a redesigned config panel.
(function () {
  'use strict';
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d', { willReadFrequently: true });
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
    noiseStrength: 6, fps: 60, containerCorner: 18
  };
  var autoRefresh = true, lockParams = false;
  var BGS = [[233,233,233],[22,22,22],[255,0,0],[0,255,0],[0,0,255]];
  var bgIndex = 0, bg = [255,255,255], bgTarget = [233,233,233];
  var colorTransitionSpeed = 0.5;
  var cells = [], food = [];
  var cont = { x: 0, y: 0, w: 0, h: 0, tw: 0, th: 0, ew: 0, eh: 0 };
  var mouse = { x: 0, y: 0, in: false };
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
  function setTargets() {
    var cWHf = Math.floor(rnd(7, 8));
    var a = Math.floor(rnd(2)) === 0 ? 5120 : 2160, b = Math.floor(rnd(2)) === 0 ? 5120 : 2160;
    cont.tw = Math.min(W * 0.96, a / (cWHf + Math.trunc(rnd(-3.5, 1))) * VS);
    cont.th = Math.min(H * 0.96, b / cWHf * VS);
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
  function onClick(e) {
    if (e.target !== cv) return;
    var k = keyHeld;
    if (k === 'b') cycleBg(); else if (k === 'a') createCell(); else if (k === 's') randomize(); else if (k === 'd') killNear(); else if (!k) randomAction();
  }

  // ---- colour helpers ----
  function lerpC(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function lerpA(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)]; }
  function css(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a === undefined ? (c[3] === undefined ? 1 : c[3]) : a) + ')'; }
  function inverted(x, y) {
    x = clamp(Math.round(x * DPR), 0, cv.width - 1); y = clamp(Math.round(y * DPR), 0, cv.height - 1);
    var d = ctx.getImageData(x, y, 1, 1).data; return [255 - d[0], 255 - d[1], 255 - d[2]];
  }

  // ---- layout / HUD metrics (font units: Ca2-Thin digits are 0.666 em tall, no descent) ----
  var ASC = 0.666, DESC = 0.111;
  function hud() {
    var ws = W / 2560, hs = H / 1600, ts = Math.min(ws, hs), fs = 210 * ts;
    return { ws: ws, hs: hs, fs: fs, left: 12 * ws, right: 2566 * ws, top: 2 * hs, midY: 1600 / 2.012 * hs, bottom: 1627 * hs };
  }

  // ---- render ----
  var off = document.createElement('canvas'), octx = off.getContext('2d'), img = null;
  function drawMetaballs(step) {
    var cw = Math.max(1, Math.floor(cont.w / step)), ch = Math.max(1, Math.floor(cont.h / step));
    if (off.width !== cw || off.height !== ch) { off.width = cw; off.height = ch; img = octx.createImageData(cw, ch); }
    var d = img.data, live = [];
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      if (c.alive && c.x >= cont.x && c.x <= cont.x + cont.w && c.y >= cont.y && c.y <= cont.y + cont.h) live.push(c);
    }
    var n = live.length, ms = P.metaballStrength, TH = P.THRESHOLD, ns = P.noiseStrength;
    var cx = new Float32Array(n), cy = new Float32Array(n), cr = new Float32Array(n), cg = new Uint8Array(n);
    for (i = 0; i < n; i++) { cx[i] = live[i].x - cont.x; cy[i] = live[i].y - cont.y; cr[i] = ms * live[i].radius * live[i].radius; cg[i] = live[i].gene > 2 ? 0 : live[i].gene < -2 ? 1 : 2; }
    var br = bg[0], bgc = bg[1], bb = bg[2], p = 0;
    for (var y = 0; y < ch; y++) {
      var py = y * step;
      for (var x = 0; x < cw; x++, p += 4) {
        var px = x * step, sum = 0, r = 0, g = 0, b = 0;
        for (var k = 0; k < n; k++) {
          var dx = px - cx[k], dy = py - cy[k], inf = cr[k] / (dx * dx + dy * dy + 0.0001);
          sum += inf; var i2 = inf * inf;
          if (cg[k] === 0) r += i2; else if (cg[k] === 1) g += i2; else b += i2;
        }
        if (sum > TH) {
          var t = r + g + b; if (t > 0) { r /= t; g /= t; b /= t; }
          var nv = (Math.random() * 2 - 1) * ns;
          d[p] = clamp(r * 255 + nv, 0, 255); d[p + 1] = clamp(g * 255 + nv, 0, 255); d[p + 2] = clamp(b * 255 + nv, 0, 255);
        } else { d[p] = br; d[p + 1] = bgc; d[p + 2] = bb; }
        d[p + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = step > 1;
    ctx.drawImage(off, cont.x, cont.y, cw * step, ch * step);
    return live.length;
  }

  var renderStep = 1;
  function frame() {
    // container morph
    cont.ew += (cont.tw - cont.ew) * 0.5; cont.eh += (cont.th - cont.eh) * 0.5;
    if (Math.abs(cont.ew - cont.tw) < 0.1) cont.ew = cont.tw; if (Math.abs(cont.eh - cont.th) < 0.1) cont.eh = cont.th;
    cont.w = Math.floor(cont.ew); cont.h = Math.floor(cont.eh); cont.x = Math.floor((W - cont.w) / 2); cont.y = Math.floor((H - cont.h) / 2);

    bg = lerpC(bg, bgTarget, colorTransitionSpeed);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = css(bg, 1); ctx.fillRect(0, 0, W, H);

    // food
    if (Math.random() < P.foodDensity && food.length < cont.w * cont.h * P.foodDensity * 2) food.push({ x: rnd(cont.w) + cont.x, y: rnd(cont.h) + cont.y });
    if (Math.random() < 0.001 && food.length) food.splice(Math.floor(rnd(food.length)), 1);

    // simulate + hover
    hovering = false; var tmpHover = [255, 255, 255], hoverCell = null;
    for (var i = cells.length - 1; i >= 0; i--) {
      var c = cells[i]; update(c); checkSurvival(c);
      if (mouse.in && Math.hypot(mouse.x - c.x, mouse.y - c.y) < c.radius && c.x > cont.x && c.x < cont.x + cont.w && c.y > cont.y && c.y < cont.y + cont.h) {
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
    if (hovering) hoverCol = tmpHover; else hoverCol = [255, 255, 255];

    // metaball container, adaptive resolution
    var budget = 2.2e6, cost = cont.w * cont.h * Math.max(1, cells.length);
    renderStep = clamp(Math.ceil(Math.sqrt(cost / budget)), 1, 8);
    drawMetaballs(renderStep);

    // food dots
    ctx.fillStyle = 'rgb(200,100,0)';
    for (i = 0; i < food.length; i++) ctx.fillRect(food[i].x, food[i].y, 1, 1);
    if (hovering && hoverCell) {
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hoverCell.x, hoverCell.y, hoverCell.radius, 0, 6.2832); ctx.stroke();
    }

    // counts
    var rc = 0, gc = 0, bc = 0;
    for (i = 0; i < cells.length; i++) { var gn = cells[i].gene; if (gn > 2) rc++; else if (gn < -2) gc++; else bc++; }
    var dom = [0, 0, 0];
    if (rc > gc && rc > bc) dom = [255, 0, 0]; else if (gc > rc && gc > bc) dom = [0, 255, 0]; else if (bc > rc && bc > gc) dom = [0, 0, 255];

    // HUD + axis (colours eased like the pde)
    var inv = mouse.in ? inverted(mouse.x, mouse.y) : [0, 0, 0], k2 = 0.3;
    var tt, tl, tc, ta, trr, tgg, tbb;
    if (hovering) {
      tt = hoverCol.concat(1); tc = hoverCol.concat(1); ta = hoverCol.concat(1); trr = tgg = tbb = hoverCol.concat(1);
      var iv = inverted(mouse.x, mouse.y); tl = iv.concat(1);
    } else {
      tt = inv.concat(1); tc = inv.concat(50 / 255); tl = inv.concat(222 / 255); ta = inv.concat(30 / 255);
      trr = [255, 0, 0, 1]; tgg = [0, 255, 0, 1]; tbb = [0, 0, 255, 1];
    }
    eased.total = lerpA(eased.total, tt, k2); eased.title = lerpA(eased.title, tl, k2); eased.coor = lerpA(eased.coor, tc, k2);
    eased.axis = lerpA(eased.axis, ta, k2); eased.r = lerpA(eased.r, trr, k2); eased.g = lerpA(eased.g, tgg, k2); eased.b = lerpA(eased.b, tbb, k2);

    // container outline
    ctx.strokeStyle = css(dom, 1); ctx.lineWidth = 2; ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cont.x, cont.y, cont.w, cont.h, P.containerCorner); else ctx.rect(cont.x, cont.y, cont.w, cont.h);
    ctx.stroke();

    var h = hud(), fam = h.fs + 'px "Ca2-Thin", monospace';
    ctx.font = fam; ctx.textBaseline = 'alphabetic';
    var asc = ASC * h.fs, desc = DESC * h.fs;
    function put(txt, col, align, x, y) { ctx.fillStyle = css(col); ctx.textAlign = align; ctx.fillText(txt, x, y); }
    var sY = String(Math.round(mouse.y)), sX = String(Math.round(mouse.x)), sT = String(cells.length);
    put('CELYLAR', eased.title, 'left', h.left, h.top + asc);
    put('AUTOMW', eased.title, 'right', h.right, h.top + asc);
    put(sY, eased.coor, 'center', W / 2, h.top + asc);
    put(sX, eased.coor, 'right', h.right, h.midY + asc / 2);
    put(sT, eased.total, 'left', h.left, h.midY + asc / 2);
    put(String(bc), eased.b, 'right', h.right, h.bottom - desc);
    put(String(rc), eased.r, 'left', h.left, h.bottom - desc);
    put(String(gc), eased.g, 'center', W / 2, h.bottom - desc);

    // axis lines. Vertical line ends sit sideGap away from the top/bottom numbers,
    // sideGap = smaller gap of the horizontal line to the left/right numbers.
    ctx.textAlign = 'left';
    var twX = ctx.measureText(sX).width, twT = ctx.measureText(sT).width;
    var gapR = Math.max(108 * h.ws * 2, twX + 15), gapL = Math.max(108 * h.ws * 2, twT + 15);
    var mT = ctx.measureText(sT), mX = ctx.measureText(sX);   // ink edges, not advance widths
    var lGap = gapL - (h.left + mT.actualBoundingBoxRight), rGap = (h.right - mX.actualBoundingBoxLeft) - (W - gapR);
    var side = Math.max(0, Math.min(lGap, rGap));
    var vTop = h.top + asc + side, vBot = h.bottom - desc - asc - side;
    var cxm = W / 2, cym = H / 2;
    ctx.strokeStyle = css(eased.axis); ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gapL, cym); ctx.lineTo(W - gapR, cym);
    if (vBot > vTop) { ctx.moveTo(cxm, vTop); ctx.lineTo(cxm, vBot); }
    ctx.moveTo(cxm, cym); ctx.lineTo(lerp(cxm, 0, 0.75), lerp(cym, H, 0.75));
    ctx.moveTo(cxm, cym); ctx.lineTo(lerp(cxm, W, 0.75), lerp(cym, H, 0.75));
    ctx.stroke();
    window.__ca2 = { vTop: vTop, vBot: vBot, side: side, lGap: lGap, rGap: rGap, topDigitsBottom: h.top + asc, bottomDigitsTop: h.bottom - desc - asc, W: W, H: H, step: renderStep, cells: cells.length };

    if (autoRefresh && performance.now() - lastRefresh > refreshInterval * 1000) randomize();
    syncUI(rc + gc + bc);
    // panel colours follow the background
    var lum = (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]);
    var fg = lum > 128 ? '17,17,17' : '240,240,240';
    var root = document.documentElement.style;
    root.setProperty('--fg', 'rgb(' + fg + ')'); root.setProperty('--fg-soft', 'rgba(' + fg + ',.35)'); root.setProperty('--bg', css(bg, 1));
  }

  // ---- config panel ----
  var rows = {}, statsEl = document.getElementById('stats'), ctl = document.getElementById('controls'), btns = document.getElementById('btns');
  var DEF = [
    ['UNIVERSE_SIZE', 'universe', 1, 400, 1],
    ['baseMutationRate', 'mutation', 0.5, 20, 0.5],
    ['mutationRateRange', 'mutation range', 0.5, 8, 0.5],
    ['interactionRadius', 'interaction r', 5, 80, 1],
    ['CELL_RADIUS', 'cell r', 2, 75, 1],
    ['baseMaxSpeed', 'speed', 0.5, 25, 0.5],
    ['foodDensity', 'food', 0, 0.1, 0.005],
    ['THRESHOLD', 'metaball', 0.05, 0.6, 0.01],
    ['noiseStrength', 'noise', 0, 40, 1],
    ['minRefreshInterval', 'refresh min s', 2, 60, 1],
    ['maxRefreshInterval', 'refresh max s', 3, 90, 1],
    ['fps', 'fps', 5, 60, 1]
  ];
  DEF.forEach(function (q) {
    var d = document.createElement('div'); d.className = 'row';
    d.innerHTML = '<div class="lab"><span>' + q[1] + '</span><b style="font-weight:normal"></b></div><input type="range" min="' + q[2] + '" max="' + q[3] + '" step="' + q[4] + '">';
    var inp = d.querySelector('input'), val = d.querySelector('b');
    inp.addEventListener('input', function () {
      var v = parseFloat(inp.value); P[q[0]] = v; val.textContent = fmt(v);
      if (q[0] === 'CELL_RADIUS') cells.forEach(function (c) { c.radius = v; });
      if (q[0] !== 'fps') { lockParams = true; lockBox.checked = true; lockVal.textContent = 'on'; }
    });
    ctl.appendChild(d); rows[q[0]] = { inp: inp, val: val };
  });
  function fmt(v) { return Math.abs(v) >= 100 ? String(Math.round(v)) : String(Math.round(v * 1000) / 1000); }
  function toggle(label, init, fn) {
    var l = document.createElement('label'); l.className = 'chk';
    l.innerHTML = '<span>' + label + '</span><b>' + (init ? 'on' : 'off') + '</b><input type="checkbox" style="display:none"' + (init ? ' checked' : '') + '>';
    var c = l.querySelector('input'), b = l.querySelector('b');
    c.addEventListener('change', function () { b.textContent = c.checked ? 'on' : 'off'; fn(c.checked); });
    ctl.appendChild(l); return { box: c, val: b };
  }
  var lockT = toggle('lock values', false, function (v) { lockParams = v; });
  var lockBox = lockT.box, lockVal = lockT.val;
  toggle('auto refresh', true, function (v) { autoRefresh = v; lastRefresh = performance.now(); });
  function btn(label, fn) { var b = document.createElement('button'); b.textContent = label; b.addEventListener('click', fn); btns.appendChild(b); }
  btn('respawn', function () { randomize(); });
  btn('randomize all', function () { lockParams = false; lockBox.checked = false; lockVal.textContent = 'off'; randomize(); });
  btn('background', cycleBg);
  var panel = document.getElementById('panel');
  panel.addEventListener('click', function (e) { e.stopPropagation(); });
  var lastSync = 0;
  function syncUI(total) {
    var now = performance.now(); if (now - lastSync < 300) return; lastSync = now;
    statsEl.innerHTML = '<span>cells</span><span class="n">' + total + '</span><span>universe</span><span class="n">' + P.UNIVERSE_SIZE + '</span><span>refresh s</span><span class="n">' + Math.round(Math.max(0, refreshInterval - (now - lastRefresh) / 1000)) + '</span><span>fps</span><span class="n">' + Math.round(fps) + '</span>';
    if (panel.matches(':hover')) return;
    DEF.forEach(function (q) { var r = rows[q[0]], v = P[q[0]]; r.inp.value = v; r.val.textContent = fmt(v); });
  }

  // ---- loop / events ----
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    VS = Math.min(W / 1280, H / 800);
    setTargets(); cont.ew = cont.tw; cont.eh = cont.th;
  }
  window.addEventListener('resize', function () { resize(); randomize(); });
  window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.in = true; });
  document.addEventListener('mouseleave', function () { mouse.in = false; });
  window.addEventListener('click', onClick);
  window.addEventListener('keydown', function (e) { keyHeld = e.key.toLowerCase(); });
  window.addEventListener('keyup', function () { keyHeld = ''; });
  window.addEventListener('touchstart', function (e) { var t = e.touches[0]; mouse.x = t.clientX; mouse.y = t.clientY; mouse.in = true; }, { passive: true });

  var last = performance.now(), fcount = 0, ftime = last, ready = false;
  function loop(now) {
    requestAnimationFrame(loop);
    if (!ready) return;
    if (now - last < 1000 / P.fps - 1) return;
    last = now; frame(); fcount++;
    if (now - ftime >= 1000) { fps = fcount * 1000 / (now - ftime); fcount = 0; ftime = now; }
  }
  (document.fonts && document.fonts.load ? document.fonts.load('40px "Ca2-Thin"') : Promise.resolve()).catch(function () {}).then(function () {
    resize(); randomize(); ready = true; requestAnimationFrame(loop);
  });
  document.getElementById('tab').addEventListener('click', function () { panel.classList.toggle('open'); });
})();
