// builds worker/dist.js = index.next.js with the code hash and the (gitignored) admin module injected.
// Run: node worker/build.js <admin-code>   (code comes from the owner, never committed)
const fs = require('fs'), crypto = require('crypto'), path = require('path');
const code = process.argv[2];
if (!code) { console.error('usage: node worker/build.js <admin-code>'); process.exit(1); }
const W = p => path.join(__dirname, p);
let t = fs.readFileSync(W('index.next.js'), 'utf8');
const mod = fs.readFileSync(W('admin-module.js'), 'utf8');
const sha = crypto.createHash('sha256').update(String(code)).digest('hex');
if (!t.includes('__CODE_SHA__') || !t.includes('__ADMIN_MODULE__')) { console.error('placeholders missing'); process.exit(1); }
t = t.replace('__CODE_SHA__', sha).replace('__ADMIN_MODULE__', JSON.stringify(mod));
fs.writeFileSync(W('dist.js'), t);

console.log('dist.js written:', t.length, 'chars; code sha256', sha.slice(0, 12) + '...');
