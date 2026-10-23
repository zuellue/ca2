const fs=require('fs');(async()=>{const E=(await WebAssembly.instantiate(fs.readFileSync(require('path').join(__dirname,'..',process.argv[2]||'ca2core.wasm')),{})).instance.exports;
let s=99,mis=[0,0],tot=0,ex=[];const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
const ranges=[1e-3,0.8,3,10,100,1e4,1e5,7e5];
for(const R of ranges)for(let i=0;i<200000;i++){const x=(rnd()*2-1)*R;tot++;if(!Object.is(E.fdm_sin(x),Math.sin(x))){mis[0]++;if(ex.length<3)ex.push(['sin',x,E.fdm_sin(x),Math.sin(x)]);}if(!Object.is(E.fdm_cos(x),Math.cos(x))){mis[1]++;if(ex.length<3)ex.push(['cos',x]);}}
console.log(JSON.stringify({tot,sinMis:mis[0],cosMis:mis[1],ex}));})();
