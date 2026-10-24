// t-compparent-jsrnd: Rust post_comp_parent (jsrnd binary) vs the JS parent probe loop of compSpawns (reference copy), same seeded Math.random. Compares chosen index (or none) and draw count. Fault: throw at draw k.
const fs=require('fs');const bin=process.argv[2]||'wasm/target-jsrnd/wasm32-unknown-unknown/release/ca2core.wasm';
(async()=>{const mk=async(thr)=>{let n=0;const E=(await WebAssembly.instantiate(fs.readFileSync(bin),{env:{js_rnd:()=>{n++;if(thr&&n>thr)throw new Error('f');return Math.random()}}})).instance.exports;return{E,cnt:()=>n}};
const {E}=await mk(0);
function w(seed,f){let st=seed,n=0;const o=Math.random;Math.random=function(){n++;st=(st*1664525+1013904223)>>>0;return st/4294967296;};try{return{v:f(),n};}finally{Math.random=o;}}
let s=5;const r0=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};let tot=0,bad=0,drawBad=0,none=0;
for(let t=0;t<30000;t++){const n=1+Math.floor(r0()*150),dens=[0,0.1,0.5,0.9,1][t%5];const cells=[];for(let i=0;i<n;i++)cells.push({x:r0()*800,y:r0()*500,alive:r0()<dens?false:true});
 if(t%7==0){const d=cells[0];for(let i=1;i<n;i++){cells[i].x=d.x;cells[i].y=d.y}} // equal distances: strict '<' tie rule
 const pt=[r0()*800,r0()*500],seed=t*17+3;
 const a=w(seed,()=>{let par=null,bd=1e18;for(let m=0;m<12;m++){const q=cells[Math.floor(Math.random()*n)];if(!q.alive)continue;const dd=(q.x-pt[0])*(q.x-pt[0])+(q.y-pt[1])*(q.y-pt[1]);if(dd<bd){bd=dd;par=q}}return par?cells.indexOf(par):-1});
 const b=w(seed,()=>{const pp=E.post_cpar_buf(n);const buf=new Float64Array(E.memory.buffer,pp,n*3);for(let i=0;i<n;i++){buf[i*3]=cells[i].x;buf[i*3+1]=cells[i].y;buf[i*3+2]=cells[i].alive?1:0}return E.post_comp_parent(n,pt[0],pt[1])});
 tot++;if(a.v<0)none++;let ok=a.n===b.n;if(!ok)drawBad++;if(a.v!==b.v)ok=false;if(!ok){bad++;if(bad<4)console.log('MISMATCH',t,a,b)}}
let fT=0,fB=0;for(let k=1;k<=11;k++){const f=await mk(k);let th=false;try{w(9,()=>{const pp=f.E.post_cpar_buf(20);const buf=new Float64Array(f.E.memory.buffer,pp,60);buf.fill(1);return f.E.post_comp_parent(20,1,1)})}catch(e){th=true}fT++;if(!(th&&f.cnt()===k+1))fB++}
console.log(JSON.stringify({scenarios:tot,noParent:none,mismatch:bad,drawCountMismatch:drawBad,faultCases:fT,faultBad:fB,binary:bin}));process.exit(bad||fB?1:0)})();
