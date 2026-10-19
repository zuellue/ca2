// CA2 sound: soft noise whose level, brightness, stereo position and micro-events follow the cellular automaton.
// Starts only after a user gesture (browser autoplay rule).
(function () {
  var AC = window.AudioContext || window.webkitAudioContext;
  var A = { ok: !!AC, started: false, ctx: null, analyser: null, mode: -1, rms: 0, modeNames: ['soft white', 'pink', 'brown', 'micro crackle', 'membrane'] };
  var N = {}, bufs = {}, enabled = true;
  function mkBuf(ctx, type) {
    var len = Math.floor(ctx.sampleRate * 4), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = b.getChannelData(ch), b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0, i, w, sum = 0;
      for (i = 0; i < len; i++) {
        w = Math.random() * 2 - 1;
        if (type === 'white') d[i] = w;
        else if (type === 'pink') { b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; d[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926; }
        else { last = (last + 0.02 * w) / 1.02; d[i] = last; }
        sum += d[i] * d[i];
      }
      var g = 0.25 / Math.sqrt(sum / len); // equal RMS for every colour of noise
      for (i = 0; i < len; i++) d[i] *= g;
      // seamless loop: short crossfade at the seam
      var f = 2048; for (i = 0; i < f; i++) { var t = i / f; d[i] = d[i] * t + d[len - f + i] * (1 - t) * (1 - t) * 0; }
    }
    return b;
  }
  function build() {
    var ctx = A.ctx = new AC();
    N.master = ctx.createGain(); N.master.gain.value = 0;
    N.body = ctx.createGain(); N.body.gain.value = 0;
    N.filt = ctx.createBiquadFilter(); N.filt.type = 'lowpass'; N.filt.frequency.value = 1600; N.filt.Q.value = 0.5;
    N.pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    N.filt.connect(N.body); if (N.pan) { N.body.connect(N.pan); N.pan.connect(N.master); } else N.body.connect(N.master);
    A.analyser = ctx.createAnalyser(); A.analyser.fftSize = 2048; N.master.connect(A.analyser); N.master.connect(ctx.destination);
    bufs.white = mkBuf(ctx, 'white'); bufs.pink = mkBuf(ctx, 'pink'); bufs.brown = mkBuf(ctx, 'brown');
  }
  function setMode(m) {
    if (m === A.mode || !A.ctx) return; A.mode = m;
    if (N.src) { try { N.src.stop(); } catch (e) {} N.src.disconnect(); }
    var type = m === 1 ? 'pink' : m === 2 ? 'brown' : 'white';
    N.src = A.ctx.createBufferSource(); N.src.buffer = bufs[type]; N.src.loop = true; N.src.connect(N.filt); N.src.start(0, Math.random() * 3);
    N.filt.type = m === 4 ? 'bandpass' : 'lowpass'; N.filt.Q.value = m === 4 ? 3 : 0.5;
  }
  function grain(level, pan) {
    var ctx = A.ctx, t = ctx.currentTime, dur = 0.006 + Math.random() * 0.016, s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain(), p = N.pan ? ctx.createStereoPanner() : null;
    s.buffer = bufs.white; hp.type = 'highpass'; hp.frequency.value = 1500 + Math.random() * 4500;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(level, t + 0.001); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(hp); hp.connect(g); if (p) { p.pan.value = pan; g.connect(p); p.connect(N.master); } else g.connect(N.master);
    s.start(t, Math.random() * 3, dur + 0.01);
  }
  A.start = function () {
    if (!A.ok || !enabled) return;
    if (!A.ctx) build();
    if (A.ctx.state !== 'running') A.ctx.resume();
    A.started = true;
  };
  A.enable = function (v) { enabled = !!v; if (!A.ctx) { if (v) A.start(); return; } if (v) A.ctx.resume(); else { N.master.gain.setTargetAtTime(0, A.ctx.currentTime, 0.05); setTimeout(function () { if (!enabled) A.ctx.suspend(); }, 400); } };
  var buf8 = null;
  // s: {density, activity, pan, birth, death, hit}; P: audio parameters
  A.update = function (s, P) {
    enabled = !!P.audioOn;
    if (!A.started || !A.ctx || !enabled || A.ctx.state !== 'running') return;
    setMode(P.audioMode | 0);
    var t = A.ctx.currentTime, m = P.audioMod, mode = P.audioMode | 0;
    var bodyG = ((1 - m) * 0.6 + m * (0.15 + 0.85 * s.density)) * [1, 0.35, 0.33, 0.4, 1.7][mode];
    var cut = P.audioTone * (1 - m * 0.5 + m * 1.2 * s.activity);
    if (mode === 4) cut = 250 + cut * 0.6;
    cut = Math.max(120, Math.min(12000, cut));
    N.master.gain.setTargetAtTime(P.audioVol, t, 0.08);
    N.body.gain.setTargetAtTime(bodyG, t, 0.12);
    N.filt.frequency.setTargetAtTime(cut, t, 0.1);
    if (N.pan) N.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, s.pan * P.audioWidth * m * 2)), t, 0.15);
    var rate = (s.birth * 3 + s.death * 2 + s.hit * 0.15) * P.audioCrackle * (mode === 3 ? 3 : 0.6), n = Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0);
    n = Math.min(n, 8);
    for (var i = 0; i < n; i++) grain((0.25 + Math.random() * 0.35) * (mode === 3 ? 1 : 0.5), (Math.random() * 2 - 1) * P.audioWidth);
  };
  A.level = function () {
    if (!A.analyser) return 0; var d = new Float32Array(A.analyser.fftSize); A.analyser.getFloatTimeDomainData(d);
    var s = 0; for (var i = 0; i < d.length; i++) s += d[i] * d[i]; return Math.sqrt(s / d.length);
  };
  window.CA2Audio = A;
})();
