// favicon rule (owner 21 Oct): 1-2, at most 3 LIVE cells picked at random from the simulation, drawn as solid
// blobs in each cell's own sim colour (genome col, else the gene channel) with sizes taken from their sim radii,
// on a TRANSPARENT background. Never a crop of the canvas: the whole composition does not get pressed into the icon.
// New random pick every 2 s; pauses while the tab is hidden. Safari ignores most runtime favicon changes: it keeps
// the static favicon.svg / favicon.png (same rule, baked).
(function () {
  var cv = document.createElement('canvas'); cv.width = cv.height = 32; var g = cv.getContext('2d');
  var last = '', timer = null, link = null;
  function colOf(c) { // same mapping as the sim: genome colour when on, else the gene channel (ca2.js field accumulation)
    var P = window.__ca2 && __ca2.P;
    if (P && P.genomeOn && c.g && c.g.col) return 'rgb(' + Math.round(c.g.col[0] * 255) + ',' + Math.round(c.g.col[1] * 255) + ',' + Math.round(c.g.col[2] * 255) + ')';
    return c.gene > 2 ? 'rgb(255,0,0)' : (c.gene < -2 ? 'rgb(0,255,0)' : 'rgb(0,0,255)');
  }
  function colKey(c) { return colOf(c); }
  function pickCells() {
    var A = window.__ca2 && window.__ca2.getCells && window.__ca2.getCells(); if (!A) return [];
    var live = A.filter(function (c) { return c.alive; }); if (!live.length) return [];
    var n = 1 + Math.floor(Math.random() * Math.min(3, live.length)); // one or two, at most three (owner 21 Oct)
    var out = [];
    while (out.length < n) {
      var c = live[Math.floor(Math.random() * live.length)];
      if (out.indexOf(c) !== -1) continue;
      // prefer distinct colours: retry a few times if this colour is already taken
      var tries = 0;
      while (tries++ < 8 && out.some(function (o) { return colKey(o) === colKey(c); })) c = live[Math.floor(Math.random() * live.length)];
      if (!out.some(function (o) { return colKey(o) === colKey(c); }) || tries >= 8) out.push(c);
    }
    return out;
  }
  // slots keep blobs inside the icon with a little jitter; each blob's radius follows its sim radius relative to the biggest pick
  var SPOTS = { 1: [[16, 16, 13]], 2: [[10.5, 17, 9], [22, 15, 8]], 3: [[10, 11, 7.5], [22.5, 12, 7], [15.5, 23.5, 7.5]] };
  function drawInto(g2, size, cells) {
    var k = size / 32, maxR = 0, i;
    for (i = 0; i < cells.length; i++) maxR = Math.max(maxR, cells[i].radius || 1);
    g2.clearRect(0, 0, size, size); // transparent background (owner 21 Oct)
    var spots = SPOTS[cells.length] || SPOTS[1];
    for (i = 0; i < cells.length; i++) {
      var c = cells[i], s = spots[i], rr = s[2] * (0.6 + 0.4 * ((c.radius || 1) / maxR)) * k;
      var jx = (size === 32 ? (Math.random() * 3 - 1.5) : 0), jy = (size === 32 ? (Math.random() * 3 - 1.5) : 0);
      g2.fillStyle = colOf(c);
      g2.beginPath(); g2.arc(s[0] * k + jx, s[1] * k + jy, rr, 0, 6.2832); g2.fill();
    }
  }
  function draw() {
    var cells = pickCells(); if (!cells.length) return;
    drawInto(g, 32, cells);
    var url = cv.toDataURL('image/png'); if (url === last) return; last = url;
    var n = document.createElement('link'); n.rel = 'icon'; n.type = 'image/png'; n.sizes = '32x32'; n.href = url; n.setAttribute('data-dyn', '1'); // new element: Chrome re-reads the icon
    [].forEach.call(document.querySelectorAll('link[rel="icon"]:not([data-dyn]), link[data-dyn]'), function (e) { e.parentNode.removeChild(e); });
    document.head.appendChild(n); link = n;
  }
  function run() { if (timer) return; setTimeout(draw, 800); timer = setInterval(draw, 2000); }
  function stop() { clearInterval(timer); timer = null; }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else run(); });
  if (!document.hidden) run();
  window.__favicon = { draw: draw, drawInto: drawInto, pickCells: pickCells, get link() { return link; }, running: function () { return !!timer; } };
})();
