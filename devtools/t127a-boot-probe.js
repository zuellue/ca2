// t127a: minimal boot probe - why does t127 stall in the trans wait on a cold base page?
const H = require(process.argv[2] ? require('path').resolve(process.argv[2]) : require('path').join(__dirname, 'harness.js'));
(async () => {
  const t0 = Date.now(), el = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
  const s = await H.serve(8913), c = await H.launch(8912, 'http://127.0.0.1:8913/index.html');
  console.log(el(), 'launched');
  for (let i = 0; i < 60; i++) {
    try {
      const v = await Promise.race([c.ev('window.__ca2 ? (__ca2.trans + "|" + __ca2.cells) : "no-ca2"'), new Promise(r => setTimeout(() => r('EV-TIMEOUT'), 5000))]);
      console.log(el(), i, JSON.stringify(v));
      if (typeof v === 'string' && v.indexOf('false|') === 0 && +v.split('|')[1] > 10) break;
    } catch (e) { console.log(el(), i, 'THROW', e.message.slice(0, 120)); }
    await c.sleep(500);
  }
  console.log(el(), 'errs:', c.errs.length, c.errs[0] || '');
  c.close(); s.close(); process.exit(0);
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });
