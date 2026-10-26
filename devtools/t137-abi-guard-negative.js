// Behavioral negative test of the simW ABI guard: extracts the guard statement from the page source and runs it against fake wasm export sets.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(process.argv[2]||path.join(__dirname,'../test/ca2.js'),'utf8');
const m=src.match(/if \(E && \((?:!E\.sim_stride \|\| )?E\.sim_stride[^\n]*?return false; \}/)||src.match(/if \(E && E\.sim_stride && [^\n]*?return false; \}/);
if(!m){console.log('FAIL: guard not found');process.exit(1);}
const ST=+(src.match(/SIM_STRIDE\s*=\s*(\d+)/)||[])[1];
function run(E){const WC={},SIMW={on:true};const f=new Function('E','WC','SIMW','SIM_STRIDE','ST','function g(){'+m[0]+' return true;} return {r:g(),WC,SIMW};');return f(E,WC,SIMW,ST,ST);}
let fail=false;
const cases=[['match',{sim_stride:()=>ST},true],['mismatch',{sim_stride:()=>ST-6},false],['missing export',{},false]];
for(const [n,E,pass] of cases){const o=run(E);const ok=(o.r===true)===pass&&(pass||(o.WC.simOff===1&&o.SIMW.on===false&&o.SIMW.abiBad!=null));console.log(n,'-> passes:',o.r,'simOff',o.WC.simOff||0,'abiBad',o.SIMW.abiBad??null,ok?'OK':'FAIL');if(!ok)fail=true;}
console.log(fail?'FAIL':'PASS');process.exit(fail?1:0);
