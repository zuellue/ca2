// t-post-parity: Rust post.rs (post_wall, post_age) vs the JS source functions extracted from ca2.js. Bit-exact compare (Object.is) on random inputs, incl. collapsed ranges, gaps, huge radii.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ca2.js'),'utf8');
function fn(name){const i=src.indexOf('function '+name+'(');let j=src.indexOf('{',i),d=0,k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const P={boundGap:0},cont={x:0,y:0,w:0,h:0};
const wallPull=new Function('P','cont',fn('wallPull')+';return wallPull;')(P,cont);
(async()=>{
const wasm=fs.readFileSync(path.join(__dirname,'..',process.argv[2]||'ca2core.wasm'));
const E=(await WebAssembly.instantiate(wasm,{})).instance.exports;
let bad=0,tot=0,s=12345;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
for(let t=0;t<4000;t++){
 cont.x=rnd()*300-50;cont.y=rnd()*300-50;cont.w=rnd()<0.1?rnd()*30:50+rnd()*1500;cont.h=rnd()<0.1?rnd()*30:50+rnd()*900;P.boundGap=rnd()<0.5?0:rnd()*100;
 const n=1+Math.floor(rnd()*40),ps=[];for(let i=0;i<n;i++)ps.push({x:rnd()*2000-300,y:rnd()*1400-300,r:rnd()<0.1?rnd()*900:rnd()*20,vx:1,vy:1});
 const bp=E.post_wall_buf(n);let b=new Float64Array(E.memory.buffer,bp,n*3);ps.forEach((p,i)=>{b[i*3]=p.x;b[i*3+1]=p.y;b[i*3+2]=p.r;});
 E.post_wall(n,cont.x,cont.y,cont.w,cont.h,P.boundGap);b=new Float64Array(E.memory.buffer,bp,n*3);
 ps.forEach((p,i)=>{const q={x:p.x,y:p.y,vx:1,vy:1};wallPull(q,p.r,false);tot++;if(!Object.is(q.x,b[i*3])||!Object.is(q.y,b[i*3+1])||q.vx!==1){bad++;if(bad<4)console.log('WALL MISMATCH',p,q,b[i*3],b[i*3+1]);}});
}
let badA=0,totA=0;
for(let t=0;t<2000;t++){const n=1+Math.floor(rnd()*60),dt=rnd()*0.1,cs=[];for(let i=0;i<n;i++)cs.push({age:rnd()<0.3?undefined:rnd()*50,life:rnd()<0.3?undefined:rnd()*60,alive:rnd()<0.9});
 const ap=E.post_age_buf(n);let a=new Float64Array(E.memory.buffer,ap,n*3);cs.forEach((c,i)=>{a[i*3]=c.age||0;a[i*3+1]=c.life||0;a[i*3+2]=c.alive?1:0;});
 E.post_age(n,dt);a=new Float64Array(E.memory.buffer,ap,n*3);
 cs.forEach((c,i)=>{const j={age:c.age,life:c.life,alive:c.alive};if(j.alive){j.age=(j.age||0)+dt;if(j.life&&j.age>=j.life)j.alive=false;}
  const wa=c.alive?a[i*3]:(c.age||0),wl=c.alive?a[i*3+2]!==0:false;totA++;if(!Object.is(j.age===undefined?0:j.age,wa)&&c.alive||j.alive!==(c.alive?wl:false)){badA++;if(badA<4)console.log('AGE MISMATCH',c,j,a[i*3],a[i*3+2]);}});}

// stepHabitat fed update: JS habField/habHash + the two fed statements vs post_hab. Math.sin differs between V8 and Rust libm, so fed is compared in ulps (reported), not asserted bit-exact.
const Q={habitatNiches:3,habitatNicheSun:0.5,habitatNicheMix:0.5,habitatDriftAmp:0.3,habitatDrift:0.05,habitatDriftFloor:0.2,habitatSun:0.6,habitatFedDecay:0.2};
let habT=0;
const habHash=new Function(fn('habHash')+';return habHash;')();
const habField=new Function('P','cont','habHash','habT',fn('habField')+';return habField;');
function ulp(a,b){if(Object.is(a,b))return 0;const f=new Float64Array(1),u=new BigInt64Array(f.buffer);f[0]=a;const x=u[0];f[0]=b;const y=u[0];const d=x>y?x-y:y-x;return Number(d);}
let hTot=0,hBad=0,hMaxUlp=0,hMaxAbs=0,hTouchedMis=0;
for(let t=0;t<3000;t++){
 Object.assign(P,Q);P.habitatNiches=[1,2,3,5][t%4];P.habitatDriftAmp=t%3?0.3:0;P.habitatFedDecay=t%5?0.2:0;P.habitatSun=t%7?0.6:0;
 cont.x=rnd()*200;cont.y=rnd()*100;cont.w=100+rnd()*1500;cont.h=100+rnd()*800;habT=rnd()*500;
 const full=rnd()<0.8,dt=0.005+rnd()*0.05,x0=cont.x,x1=cont.x+cont.w,y0=cont.y,y1=cont.y+cont.h;
 const n=1+Math.floor(rnd()*50),fs=[];for(let i=0;i<n;i++)fs.push({x:rnd()*2000-100,y:rnd()*1200-100,fed:rnd()<0.4?undefined:(rnd()<0.2?0:rnd()*3),worm:rnd()<0.05});
 const hp=E.post_hab_par(),bp=E.post_hab_buf(n);const pv=new Float64Array(E.memory.buffer,hp,32);
 pv.set([full?1:0,P.habitatNiches,P.habitatNicheSun,P.habitatNicheMix,P.habitatDriftAmp,P.habitatDrift,P.habitatDriftFloor,habT,x0,x1,y0,y1,cont.w,cont.h,cont.x,cont.y,P.habitatSun,P.habitatFedDecay,dt]);
 let b=new Float64Array(E.memory.buffer,bp,n*4);fs.forEach((f,i)=>{b[i*4]=f.x;b[i*4+1]=f.y;b[i*4+2]=f.fed>0?f.fed:(f.fed||0);b[i*4+3]=f.worm?1:0;});
 E.post_hab(n);b=new Float64Array(E.memory.buffer,bp,n*4);
 const hf=habField(P,cont,habHash,habT);
 fs.forEach((f,i)=>{if(f.worm)return;let fed=f.fed,tch=0;const fld=full?hf(f.x,f.y):{sun:1,dec:1};
  if(fed>0&&P.habitatFedDecay>0){fed=Math.max(0,fed-P.habitatFedDecay*fld.dec*dt);tch=1;}
  if(full&&P.habitatSun>0&&f.x>x0&&f.x<x1&&f.y>y0&&f.y<y1){fed=(fed||0)+P.habitatSun*fld.sun*dt;tch=1;}
  hTot++;if(tch!==b[i*4+1]){hTouchedMis++;hBad++;return;}
  if(tch){const u=ulp(fed,b[i*4]);if(u>hMaxUlp)hMaxUlp=u;const ad=Math.abs(fed-b[i*4]);if(ad>hMaxAbs)hMaxAbs=ad;if(u>8)hBad++;}});
}
console.log(JSON.stringify({habChecks:hTot,habTouchedMismatch:hTouchedMis,habMaxUlp:hMaxUlp,habMaxAbs:hMaxAbs,habOver8ulp:hBad}));
bad+=hTouchedMis;
console.log(JSON.stringify({wallChecks:tot,wallMismatch:bad,ageChecks:totA,ageMismatch:badA,binary:process.argv[2]||'ca2core.wasm'}));
process.exit(bad+badA?1:0);})();
