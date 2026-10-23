// t-ood-domain: trig arguments outside the verified fdlibm domain (|x| > 8.2e5) must make the Rust call fail (negative return) so JS computes it; no partial write visible to JS.
const fs=require('fs'),path=require('path');
(async()=>{const E=(await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..',process.argv[2]||'ca2core.wasm')),{})).instance.exports;
const res={};if(process.env.OODMODE==='fallback')E.fdm_set_large(0);
// sepbody: t0 huge -> tq = t0/850*(1+wsp)+ph beyond 8.2e5 for a string cell
let ip=E.post_sepbody_in();let ib=new Float64Array(E.memory.buffer,ip,24);
const base=[100,100,10,1,1,3,0.6,0.7,1,0.5,0.5,2,0.3,0,384,0,0,800,500,1,0,1,1];
ib.set(base);ib[13]=1e3;res.sepbody_inDomain=E.post_sepbody();
ip=E.post_sepbody_in();ib=new Float64Array(E.memory.buffer,ip,24);ib.set(base);ib[13]=1e10;res.sepbody_ood=E.post_sepbody();
ip=E.post_sepbody_in();ib=new Float64Array(E.memory.buffer,ip,24);ib.set(base);ib[7]=5e6;ib[13]=1e3;res.sepbody_oodDir=E.post_sepbody();
// habitat: habT huge with drift
const hp=E.post_hab_par(),bp=E.post_hab_buf(1);let pv=new Float64Array(E.memory.buffer,hp,32);
const par=(habT)=>[1,3,0.5,0.5,0.3,0.05,0.2,habT,0,800,0,500,800,500,0,0,0.6,0.2,0.016];
pv.set(par(100));let b=new Float64Array(E.memory.buffer,bp,4);b.set([100,100,1,0]);res.hab_inDomain=E.post_hab(1);
pv=new Float64Array(E.memory.buffer,E.post_hab_par(),32);pv.set(par(1e9));b=new Float64Array(E.memory.buffer,E.post_hab_buf(1),4);b.set([100,100,1,0]);res.hab_ood=E.post_hab(1);
// wing: fp huge
let wp=E.pw_buf(1);let wb=new Float64Array(E.memory.buffer,wp,15);wb.set([100,100,0,0,0,0.5,NaN,NaN,NaN,NaN,0.5,1000,0,0,0]);res.wing_inDomain=E.pw_run(1,16,1);
wp=E.pw_buf(1);wb=new Float64Array(E.memory.buffer,wp,15);wb.set([100,100,0,0,0,0.5,NaN,NaN,NaN,NaN,0.5,1e9,0,0,0]);res.wing_ood=E.pw_run(1,16,1);
console.log(JSON.stringify(res));
const LARGE=process.env.OODMODE!=='fallback'; // default (24 Oct): full-range reduction ON => huge args compute in Rust (>=0); OODMODE=fallback with fdm_set_large(0) keeps the old negative-return contract
const ok=res.sepbody_inDomain>=0&&res.hab_inDomain>=0&&res.wing_inDomain>=0&&(LARGE?(res.sepbody_ood>=0&&res.sepbody_oodDir>=0&&res.hab_ood>=0&&res.wing_ood>=0):(res.sepbody_ood<0&&res.sepbody_oodDir<0&&res.hab_ood<0&&res.wing_ood<0));
console.log(ok?'PASS':'FAIL');process.exit(ok?0:1);})();
