// Repo text guard (repo rule, owner 9 Nov 2026 relayed S12): every repo file is English
// and ASCII only (allowlist: math symbols, arrows, degree sign, em dash, ellipsis).
// Scans the shipped files for non-ASCII characters outside the allowlist; exits 1
// with file:line on any hit.
// Run: node devtools/lang-scan.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const FILES = ['index.html', 'ca2.js', 'device.html', 'audio.js', 'grain.js', 'favicon.js'].concat(process.argv.includes('--all')?require('fs').readdirSync(path.join(ROOT,'devtools')).filter(f=>/\.js$/.test(f)&&f!=='lang-scan.js').map(f=>'devtools/'+f).concat(['plan/QUEUE.md']):[]).concat(process.argv.includes('--test') ? ['test/index.html', 'test/ca2.js', 'test/audio.js', 'test/grain.js', 'test/favicon.js'] : []);
const ALLOWED_EXTRA = new Set(['\u00B0', '\u2014', '\u2026']);
const ALLOWED_RE = /[\p{Sm}\u2190-\u21FF]/u;
let hits = 0;
for (const f of FILES) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
    for (const ch of line) {
      if (ch.codePointAt(0) > 127 && !ALLOWED_EXTRA.has(ch) && !ALLOWED_RE.test(ch)) {
        hits++;
        console.log(f + ':' + (i + 1) + ': non-allowlisted character U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') + ': ' + line.trim().slice(0, 120));
        break;
      }
    }
  });
}
console.log(hits ? 'lang-scan: ' + hits + ' hit(s) - repo text is English and ASCII only (repo rule, owner 9 Nov 2026)' : 'lang-scan: clean');
process.exit(hits ? 1 : 0);
