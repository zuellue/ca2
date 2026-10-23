// t145: live wiring proof for the cursor unease (owner 23 Oct) - real page, real mousemove over the canvas,
// cells under the cursor must drift away (gentle, bounded). Screenshots before/after for the visual record.
// Usage: node t145-cursor-live.js <port>
const H=require('./harness.js');
(async()=>{const port=+process.argv[2]||8851;
const s=await H.serve(port);
const b=await H.launch(port+1000,'http://127.0.0.1:'+port+'/index.html?perf=1',['--window-size=1300,800']);
for(let i=0;i<60;i++){if(await b.ev('!!(window.__ca2&&__ca2.getCells&&__ca2.getCells().length)')===true)break;await b.sleep(500);}
await b.sleep(4000);
const info=await b.ev(`(function(){var c=__ca2.getCells(),cv=document.querySelector('canvas'),r=cv.getBoundingClientRect();
 // pick the cell nearest the canvas center as the hover target
 var cx=r.left+r.width/2,cyy=r.top+r.height/2,bi=0,bd=1e18;
 for(var i=0;i<c.length;i++){var d=(c[i].x-cx)*(c[i].x-cx)+(c[i].y-cyy)*(c[i].y-cyy);if(d<bd){bd=d;bi=i;}}
 return JSON.stringify({n:c.length,tx:c[bi].x,ty:c[bi].y,rect:{l:r.left,t:r.top,w:r.width,h:r.height}})})()`);
const st=JSON.parse(info);
console.log('target cell at',Math.round(st.tx),Math.round(st.ty),'of',st.n,'cells');
const snap=()=>b.ev(`JSON.stringify(__ca2.getCells().map(c=>[c.x,c.y]))`);
const before=JSON.parse(await snap());
await b.shot('/tmp/t145-before.png');
for(let k=0;k<30;k++){await b.mouse(Math.round(st.tx),Math.round(st.ty));await b.sleep(100);} // hold the cursor on the cell ~3s
await b.sleep(1500);
const after=JSON.parse(await snap());
await b.shot('/tmp/t145-after.png');
let fled=0,near=0,far=0,farDrift=0,maxStep=0;
for(let i=0;i<Math.min(before.length,after.length);i++){
 const d0=Math.hypot(before[i][0]-st.tx,before[i][1]-st.ty);
 const mv=Math.hypot(after[i][0]-before[i][0],after[i][1]-before[i][1]);
 if(d0<90){near++;if(Math.hypot(after[i][0]-st.tx,after[i][1]-st.ty)>d0+3)fled++;}
 else if(d0>250){far++;farDrift+=mv;}
}
console.log('near cells:',near,'fled:',fled,'far cells:',far,'far avg drift:',far?(farDrift/far).toFixed(2):'-');
console.log('page errors:',JSON.stringify(b.errs.slice(0,3)));
const ok=near>0&&fled>=Math.ceil(near*0.5)&&b.errs.length===0;
console.log(ok?'T145 PASS':'T145 FAIL');
b.close();s.close();process.exit(ok?0:1)})().catch(e=>{console.error(e);process.exit(2)});
