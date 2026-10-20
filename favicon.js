// favicon: a tiny crop of the live canvas centred on a random cell (or two cells side by side), redrawn every 2 s with a new pick.
// Stops while the tab is hidden. Safari ignores most runtime favicon changes: it keeps the static favicon.svg / favicon.png.
(function () {
  var src = document.getElementById('c'), cv = document.createElement('canvas'); cv.width = cv.height = 32; var g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  var last = '', timer = null, link = null;
  function pickCell() {
    var A = window.__ca2 && window.__ca2.getCells && window.__ca2.getCells(); if (!A || !A.length) return null;
    var r = src.getBoundingClientRect(), live = A.filter(function (c) { return c.alive && c.x > r.left && c.x < r.right && c.y > r.top && c.y < r.bottom; });
    return live.length ? live[Math.floor(Math.random() * live.length)] : null;
  }
  function crop(c, dx, dy, dw, dh) {
    var r = src.getBoundingClientRect(), k = src.width / r.width, s = Math.max(10, c.radius * 1.4) * k; // small area: about 1.4 cell radii wide
    var sx = (c.x - r.left) * k - s / 2, sy = (c.y - r.top) * k - s / 2;
    g.drawImage(src, Math.max(0, sx), Math.max(0, sy), Math.min(s, src.width - Math.max(0, sx)), Math.min(s, src.height - Math.max(0, sy)), dx, dy, dw, dh);
  }
  function draw() {
    var a = pickCell(); if (!a) return;
    g.clearRect(0, 0, 32, 32);
    if (Math.random() < 0.5) crop(a, 0, 0, 32, 32);
    else { var b = pickCell() || a; crop(a, 0, 0, 16, 32); crop(b, 16, 0, 16, 32); }
    var url = cv.toDataURL('image/png'); if (url === last) return; last = url;
    var n = document.createElement('link'); n.rel = 'icon'; n.type = 'image/png'; n.sizes = '32x32'; n.href = url; n.setAttribute('data-dyn', '1'); // new element: Chrome re-reads the icon
    [].forEach.call(document.querySelectorAll('link[rel="icon"]:not([data-dyn]), link[data-dyn]'), function (e) { e.parentNode.removeChild(e); });
    document.head.appendChild(n); link = n;
  }
  function run() { if (timer) return; setTimeout(draw, 800); timer = setInterval(draw, 2000); }
  function stop() { clearInterval(timer); timer = null; }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else run(); });
  if (!document.hidden) run();
  window.__favicon = { draw: draw, get link() { return link; }, running: function () { return !!timer; } };
})();
