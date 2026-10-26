// Device session, encrypted at rest with a non-exportable origin-bound key.
(function () {
  'use strict';
  var token = null, retaining = Promise.resolve(), WK = 'https://ca2-presets.middots.workers.dev/';
  function db() { return new Promise(function (ok, no) {
    var r = indexedDB.open('ca-admin-session', 1);
    r.onupgradeneeded = function () { r.result.createObjectStore('device'); };
    r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); };
  }); }
  function transact(mode, fn) { return db().then(function (d) { return new Promise(function (ok, no) {
    var t = d.transaction('device', mode), result;
    t.oncomplete = function () { d.close(); ok(result); }; t.onerror = function () { d.close(); no(t.error); };
    fn(t.objectStore('device'), function (v) { result = v; });
  }); }); }
  function read() { return transact('readonly', function (s, done) { var r=s.get('session');r.onsuccess=function(){done(r.result);}; }); }
  function drop() { token=null;return transact('readwrite',function(s){s.delete('session');}); }
  async function remember(value) {
    var key = await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
    var iv=crypto.getRandomValues(new Uint8Array(12));
    var cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},key,new TextEncoder().encode(value));
    await transact('readwrite',function(s){s.put({key:key,iv:iv,cipher:cipher},'session');}); token=value;
  }
  var api = window.__caAdminSession = {
    authorize: function (body) { if (token) { body.session=token;delete body.code; } return body; },
    accept: async function (r) { if (r.session) { token=r.session;retaining=remember(r.session);await retaining; } },
    revoke: async function () {
      try { await retaining; } catch(e) {}
      if (!token) throw new Error('no active device session');
      var r=await fetch(WK,{method:'POST',body:JSON.stringify({session:token,revoke:true})}).then(function(r){return r.json();});
      if (!r.ok) throw new Error('session close failed');await drop();
    },
    restore: async function () {
      try {
        var s=await read();if(!s)return;
        await new Promise(function(ok){function ready(){if(window.__ca2 && window.__ca2.P && window.__ca2x)ok();else setTimeout(ready,100);}ready();});
        token=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:s.iv},s.key,s.cipher));
        var r=await fetch(WK,{method:'POST',body:JSON.stringify({session:token,admin:true})}).then(function(r){return r.json();});
        if (!r.ok || typeof r.js!=='string') { if(r.err==='session')await drop();return; }
        (new Function('code','X',r.js))('device-session',window.__ca2x);
        if(window.__caRelease)window.__caRelease.mountAdmin();
      } catch(e) { console.warn('CA session restore unavailable'); }
    }
  };
})();
