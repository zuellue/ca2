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
console.log(JSON.stringify({wallChecks:tot,wallMismatch:bad,ageChecks:totA,ageMismatch:badA,binary:process.argv[2]||'ca2core.wasm'}));
process.exit(bad+badA?1:0);})();
