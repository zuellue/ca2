// t137: wasm -> JS transition parity for stepLive. Run K generations in wasm, sync the state back exactly as ca2.js liveSyncBack does, continue in JS;
// must equal a pure-JS run bit-for-bit (targets and bits) for every K, incl. K=0 (JS from the start), K<9 (rank history not yet used) and K>300 (history truncated).
const fs=require('fs'),path=require('path');const src=fs.readFileSync(path.join(__dirname,'t136-steplive-parity.js'),'utf8');
const jsGen=new Function(src.slice(src.indexOf('const clamp'),src.indexOf('(async()')).replace('const clamp','var clamp')+';return {jsGen:jsGen,lcg:lcg}')();
const wasm=fs.readFileSync(path.join(__dirname,'..','wasm','target','wasm32-unknown-unknown','release','ca2core.wasm'));
(async()=>{const E=(await WebAssembly.instantiate(wasm,{})).instance.exports;const B=()=>new Float64Array(E.memory.buffer,E.live_buf(),64);
const lcg=st=>{st.s=(Math.imul(st.s,1664525)+1013904223)>>>0;return st.s/4294967296;};
let seed=7;const r=()=>{seed=(Math.imul(seed,1103515245)+12345)>>>0;return seed/4294967296;};
let bad=0,tot=0,slot=0;
for(const plate of [false,true])for(const K of [0,1,5,8,9,10,40,299,300,301,700]){
 const rule=plate?54:110,shift=11,q=[0.5,3.5],cap=plate?0.35:1,s0=4242+K;
 const mk=()=>{const st={s:s0},bits=[];for(let i=0;i<28;i++)bits.push(lcg(st)<0.5?1:0);return {rule,plate,shift,st,bits,gen:0};};
 const ref=mk(),L=mk();const occs=[];for(let g=0;g<K+400;g++){const o=[];for(let i=0;i<28;i++)o.push(r()<0.5?1:0);occs.push(o);}
 // wasm for K gens
 const sl=slot++;E.live_init(sl,L.st.s);let b=B();for(let i=0;i<28;i++)b[i]=L.bits[i];E.live_init(sl,L.st.s);
 const tgt=[];for(let g=0;g<K;g++){b=B();if(plate)for(let i=0;i<28;i++)b[28+i]=occs[g][i];tgt.push(E.live_gen(sl,rule,plate?1:0,shift,q[0],q[1],cap));}
 // sync back (same steps as ca2.js liveSyncBack)
 if(K>0){E.live_state(sl);b=B();L.bits=Array.from(b.slice(0,28));L.st.s=b[56];L.gen=b[58];L.walk=isNaN(b[57])?undefined:b[57];const hn=E.live_hist(sl),hb=new Float64Array(E.memory.buffer,E.live_hist_buf(),304);L.hist=Array.from(hb.slice(0,hn));}
 for(let g=0;g<K+400;g++){const tr=jsGen.jsGen(ref,q,cap,occs[g]);if(g<K){tot++;if(!Object.is(tr,tgt[g])){bad++;if(bad<4)console.log('WASM-vs-JS mismatch in wasm phase',plate,K,g);}continue;}const tl=jsGen.jsGen(L,q,cap,occs[g]);tot++;
  let bb=0;for(let i=0;i<28;i++)if(L.bits[i]!==ref.bits[i])bb=1;if(!Object.is(tr,tl)||bb){bad++;if(bad<4)console.log('MISMATCH plate',plate,'K',K,'gen',g,tr,tl);}}
}
console.log('steplive wasm->JS transition parity: gens',tot,'mismatch',bad);})();
