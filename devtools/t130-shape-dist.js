// JS newShape/mixShape vs wasm sh_run: per-field mean/std over N samples for kinds new(None), new(par), mix(a,b). usage: node devtools/t130-shape-dist.js [N]
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
const i=src.indexOf('function newShape(par)'),j=src.indexOf('// fitness against the current environment');
const P={genomeMut:0.5};const rnd=(a,b)=>{if(b===undefined){b=a;a=0}return a+Math.random()*(b-a)};const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const js=new Function('P','rnd','clamp',src.slice(i,j)+';return {newShape:newShape,mixShape:mixShape}')(P,rnd,clamp);
const F=['t','asp','th','wig','wsp','sat','ph','ph2','dir'];const arr=o=>F.map(k=>o[k]);
const obj=a=>{const o={};F.forEach((k,x)=>o[k]=a[x]);return o};
const stat=rows=>F.map((_,x)=>{const v=rows.map(r=>r[x]);const m=v.reduce((a,b)=>a+b,0)/v.length;const sd=Math.sqrt(v.reduce((a,b)=>a+(b-m)**2,0)/v.length);return [+m.toFixed(4),+sd.toFixed(4)]});
(async()=>{const N=+process.argv[2]||100000;const m=await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..','ca2core.wasm')),{});const E=m.instance.exports;
const pp=E.sim_params();const p=new Float64Array(E.memory.buffer,pp,80);p[36]=P.genomeMut;
const A=[2,1,1,0,0.9,2,1,2,3],B=[0,1,1,0,1.4,0,0,0,0];
let worst=0;
for(const [kind,name] of [[0,'new(None)'],[1,'new(par)'],[2,'mix(a,b)']]){
 const jr=[],wr=[];
 for(let k=0;k<N;k++){const o=kind===0?js.newShape(null):kind===1?js.newShape(obj(A)):js.mixShape(obj(A),obj(B));jr.push(arr(o));
  const tp=E.sh_buf();const t=new Float64Array(E.memory.buffer,tp,28);t.set(A,0);t.set(B,9);E.sh_run(kind,k+1);wr.push(Array.from(new Float64Array(E.memory.buffer,tp,28).slice(18,27)));}
 const a=stat(jr),b=stat(wr);let md=0;a.forEach((x,i)=>{const d=Math.max(Math.abs(x[0]-b[i][0]),Math.abs(x[1]-b[i][1]));if(d>md)md=d});worst=Math.max(worst,md);
 console.log(name,'max |dmean|,|dstd|',md.toFixed(4));F.forEach((f,i)=>console.log('  ',f,'js',a[i].join('/'),'wasm',b[i].join('/')));}
console.log('WORST',worst.toFixed(4));})();
