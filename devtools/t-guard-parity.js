// t-guard-parity: Rust post_guard vs the JS foodInkGuard/foodPushOut/foodOnInk/sepDiskHit extracted from ca2.js, random masks (blobs of ink, nearly-full, empty) and random food states
// (pk undefined/0/1/2, owned, with/without velocity). Compared with Object.is on x,y,vx,vy,_pk,_px,_py, gone flags and survivor list.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const code=`var P={foodSize:6,separatorOn:1,showHud:1},SEP={img:null,mw:0,mh:0},W=800,H=500,food=[];
var COS8=[1,0.7071,0,-0.7071,-1,-0.7071,0,0.7071],SIN8=[0,0.7071,1,0.7071,0,-0.7071,-1,-0.7071];
${['sepDiskHit','foodInkOn','foodOnInk','foodFreeIdx','foodMaskPx','foodPushOut','foodInkGuard'].map(fn).join('\n')}
var inkFree={img:null,idx:null};function foodInkGuardW(){return false;}
return {P:P,SEP:SEP,set food(v){food=v;},get food(){return food;},setW:function(w,h){W=w;H=h;},run:foodInkGuard};`;
const J=new Function(code)();
(async()=>{
const E=(await WebAssembly.instantiate(fs.readFileSync(path.join(__dirname,'..',process.argv[2]||'ca2core.wasm')),{})).instance.exports;
let s=777;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
let tot=0,bad=0,diffs=0,pushes=0;
for(let t=0;t<600;t++){
 const mw=20+Math.floor(rnd()*60),mh=10+Math.floor(rnd()*40),W=mw*2,H=mh*2,img=new Uint8ClampedArray(mw*mh*4);
 const mode=t%4,dens=mode==0?0.05:mode==1?0.5:mode==2?0.97:1.0;
 for(let i=0;i<mw*mh;i++)img[i*4+3]=rnd()<dens?255:(rnd()<0.2?30:0);
 if(mode==3&&t%8==3)img[(mw*mh>>1)*4+3]=0;
 J.SEP.img=img;J.SEP.mw=mw;J.SEP.mh=mh;J.setW(W,H);J.P.foodSize=2+rnd()*10;
 const n=1+Math.floor(rnd()*60),fs0=[];
 for(let i=0;i<n;i++){const f={x:rnd()*W,y:rnd()*H};if(rnd()<0.6){f.vx=rnd()-0.5;f.vy=rnd()-0.5;}else if(rnd()<0.3){f.vx=rnd()-0.5;f.vy=rnd()-0.5;}
  const q=rnd();if(q<0.2){}else{f._pk=[0,1,2][Math.floor(rnd()*3)];f._px=rnd()*W;f._py=rnd()*H;}
  if(rnd()<0.2)f.blob=1;fs0.push(f);}
 const A=fs0.map(f=>Object.assign({},f)),Bf=fs0.map(f=>Object.assign({},f));
 J.food=A;J.run();
 const mb=E.post_mask_buf(img.length);new Uint8Array(E.memory.buffer,mb,img.length).set(img);E.post_mask_dims(mw,mh);
 const r=Math.max(0.5,J.P.foodSize/2),gp=E.post_guard_buf(n);let g=new Float64Array(E.memory.buffer,gp,n*12);
 Bf.forEach((f,i)=>{const o=i*12;g[o]=f.x;g[o+1]=f.y;g[o+2]=f.vx!==undefined?f.vx:0;g[o+3]=f.vy!==undefined?f.vy:0;g[o+4]=f.vx!==undefined?1:0;g[o+5]=f.vy!==undefined?1:0;g[o+6]=f._pk===undefined?-1:f._pk;g[o+7]=f._px===undefined?0:f._px;g[o+8]=f._py===undefined?0:f._py;g[o+9]=(f.blob||f.worm||f.spore)?1:0;});
 E.post_guard(n,W,H,r);g=new Float64Array(E.memory.buffer,gp,n*12);
 const surv=[];Bf.forEach((f,i)=>{const o=i*12;f.x=g[o];f.y=g[o+1];if(f.vx!==undefined)f.vx=g[o+2];if(f.vy!==undefined)f.vy=g[o+3];if(g[o+10]){f.gone=1;return;}f._pk=g[o+6];f._px=g[o+7];f._py=g[o+8];surv.push(f);});
 // JS result: A is food (compacted). Compare survivors in order, and gone flags of the originals.
 tot++;let ok=A.length===surv.length;
 if(ok)for(let i=0;i<A.length;i++)for(const k of ['x','y','vx','vy','_pk','_px','_py'])if(!Object.is(A[i][k],surv[i][k])){ok=false;if(diffs++<3)console.log('DIFF',t,i,k,A[i][k],surv[i][k]);}
 if(!ok)bad++;
 if(Bf.some((f,i)=>f.x!==fs0[i].x||f.y!==fs0[i].y))pushes++;
}
console.log(JSON.stringify({scenarios:tot,mismatch:bad,scenariosWithMovedFood:pushes,binary:process.argv[2]||'ca2core.wasm'}));process.exit(bad?1:0);})();
