// LABELED EXPERIMENT (branch ca/187-js-rust-alignment): behavioral fit of the JS crowd-drift formula to the
// SERVED binary in the FULLST path. The served binary's v6/v8b source is not in the repo, so per the gap2
// ledger (per-event injection 2.0-2.2x JS at equal event counts) we test candidate formulas. NOT a behavior
// change: builds mutated ca2.js copies in /tmp and reports the fit curve; default JS untouched.
// Usage: node devtools/fit-crowdpush.js
const fs=require('fs'),path=require('path'),cp=require('child_process');
const src=fs.readFileSync(path.join(__dirname,'..','test/ca2.js'),'utf8');
const base="var cpush = (P.crowdPush === undefined ? 0.3 : P.crowdPush) * Math.min(1, c.crowd) * ms * 0.5,";
if(!src.includes(base)){console.error('base formula not found');process.exit(1);}
const variants={
 'm1.5':"var cpush = 1.5 * (P.crowdPush === undefined ? 0.3 : P.crowdPush) * Math.min(1, c.crowd) * ms * 0.5,",
 'm2':"var cpush = 2 * (P.crowdPush === undefined ? 0.3 : P.crowdPush) * Math.min(1, c.crowd) * ms * 0.5,",
 'm2.5':"var cpush = 2.5 * (P.crowdPush === undefined ? 0.3 : P.crowdPush) * Math.min(1, c.crowd) * ms * 0.5,",
 'm3':"var cpush = 3 * (P.crowdPush === undefined ? 0.3 : P.crowdPush) * Math.min(1, c.crowd) * ms * 0.5,",
 'nocrowdf':"var cpush = (P.crowdPush === undefined ? 0.3 : P.crowdPush) * ms * 0.5,",
 'sqrtcrowd':"var cpush = (P.crowdPush === undefined ? 0.3 : P.crowdPush) * Math.sqrt(Math.min(1, c.crowd)) * ms * 0.5,",
};
for(const [name,v] of Object.entries(variants)){
 const f='/tmp/ca2-fit-'+name+'.js';fs.writeFileSync(f,src.replace(base,v));
 let passes=0,detail=[];
 for(let rep=0;rep<3;rep++){
  const r=cp.spawnSync('node',['devtools/t70-interact-iso-served.js','100','40','160','2'],{env:{...process.env,FULLST:'1',STEPS:'30',CA_JS:'../ca2-fit-'+name+'.js'},encoding:'utf8'});
  const line=(r.stdout||'').trim().split('\n').pop();
  if(line.startsWith('PASS'))passes++;else detail.push(line.match(/envVx mean\|v\| js ([\d.]+) wasm ([\d.]+)/)?.slice(1).join('/')||'?');
 }
 console.log(name.padEnd(10)+'FULLST30 PASS '+passes+'/3'+(detail.length?' fail-ratios(js/wasm envVx): '+detail.join(' '):''));
}
console.log('reference: unmodified JS envVx js ~0.30 wasm ~0.84 (ratio ~2.8) at STEPS=30; PASS band is mean ratio within 0.35');
