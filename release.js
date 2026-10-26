// Shared release routing. Only a verified admin Save can change the global selector.
(function () {
  'use strict';
  var script = document.currentScript;
  var preview = script && script.getAttribute('data-preview') === '1';
  var WK = 'https://ca2-presets.middots.workers.dev/';
  var rawFetch = window.fetch.bind(window), selected = false, ready = false;
  var draft = true, mounted = false;
  try { var old = sessionStorage.getItem('ca.release.draft'); if (old !== null) draft = old === '1'; } catch (e) {}
  var flagState = null, toggleBusy = false, toggleQueued = false;
  function rootURL() { return location.origin + '/'; }
  function pushSelector() {
    if (!window.__caAdminSession || !window.__caAdminSession.authorize) return; // no credential: keep arm-on-save fallback
    var body = { patch: { testOnline: draft ? 1 : 0 } };
    window.__caAdminSession.authorize(body);
    if (!body.session && !body.code) return;
    toggleBusy = true;
    rawFetch(WK + '?' + Date.now(), { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        toggleBusy = false;
        if (!(r && r.ok)) return; // failed write: page stays; toggle keeps its state, next Save still carries the flag
        flagState = draft;
        if (toggleQueued) { toggleQueued = false; if (draft !== flagState) { pushSelector(); } return; }
        try { if (window.__ca2x && window.__ca2x.save) window.__ca2x.save(); } catch (e) {} // keep unsaved panel edits across the handoff (local write only, no extra push)
        // user 26 Oct: the toggle must visibly switch versions at once. On a preview page reload cannot
        // change the pinned /test/ assets, so hand off to the root URL; elsewhere a reload is enough.
        // The retained device session restores admin after the navigation - no code re-entry.
        if (preview) location.assign(rootURL()); else location.reload();
      })
      .catch(function () { toggleBusy = false; });
  }
  function remember(v) {
    draft = !!v; try { sessionStorage.setItem('ca.release.draft', draft ? '1' : '0'); } catch (e) {}
    if (!mounted || !window.__adminOn) return; // public pages never write; boot mount passes the current value
    if (flagState !== null && draft === flagState) return; // no-op toggle
    if (toggleBusy) { toggleQueued = true; return; }
    pushSelector();
  }
  function online(g) { return !!g && (g.testOnline === 1 || g.testOnline === true); }
  // This is below the existing authenticated admin module's mobile rewrite. The
  // selector belongs to the site, never to a desktop/portrait/landscape preset.
  window.fetch = function (url, opt) {
    var isPreset = typeof url === 'string' && url.split('?')[0] === WK;
    if (isPreset && opt && opt.method === 'POST' && mounted && window.__adminOn) {
      try {
        var body = JSON.parse(opt.body);
        if (body && body.patch && body.code && !body.admin && !body.check && !body.reset) {
          body.patch.testOnline = draft ? 1 : 0;
          if(window.__caAdminSession)window.__caAdminSession.authorize(body);
          opt = Object.assign({}, opt, { body: JSON.stringify(body) });
        }
      } catch (e) {}
    }
    return rawFetch(url, opt);
  };
  window.__caRelease = {
    preview: preview,
    assetURL: function (name) { return (selected ? '/test/' : '/') + name; },
    observeGlobal: function (g) {
      if (g) flagState = online(g);
      if (!ready || preview || window.__adminOn) return;
      if (online(g) !== selected) location.reload();
    },
    mountAdmin: function () {
      if (!window.__adminOn || mounted || !window.__ca2x || !window.__ca2x.mountRelease) return;
      mounted = true;
      window.__ca2x.mountRelease(draft, remember);
    },
    unmountAdmin: function () { mounted = false; }
  };
  window.addEventListener('ca2logout', function () {
    window.__caRelease.unmountAdmin();
    if (!preview) location.reload();
  });
  function load(name) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = window.__caRelease.assetURL(name);
      s.onload = resolve; s.onerror = reject; document.body.appendChild(s);
    });
  }
  function loadSession(){return new Promise(function(ok,no){var s=document.createElement('script');s.src='/admin-session.js?v=202610261420';s.onload=ok;s.onerror=no;document.body.appendChild(s);});}
  var timeout;
  var first = new Promise(function (resolve) { timeout = setTimeout(function () { resolve(null); }, 3000); });
  var pull = rawFetch(WK + '?release=' + Date.now(), { cache: 'no-store' }).then(function (r) {
    if (!r.ok) throw new Error('release ' + r.status); return r.json();
  }).catch(function () { return null; });
  Promise.race([pull, first]).then(function (g) {
    clearTimeout(timeout); flagState = online(g); selected = preview || flagState; ready = true;
    return loadSession().then(function(){return load('grain.js?v=202610222334');}).then(function () {
      return load('audio.js?v=202610222334');
    }).then(function () {
      return load('ca2.js?v=' + (selected ? '202610261702' : '202610261409'));
    }).then(function () { return load('favicon.js?v=202610222334'); });
  }).catch(function (e) { console.error('CA release load failed', e); });
})();
