// t146: bounded live cursor test, 760x460. Stages each have their own timeout and timing. Real Input.dispatchMouseEvent.
// A cells flee. B parasites: pursuit (p.a<-1e9 believing) -> give up -> boundary. C stationary cursor: reacquisition count.
const H=require('./harness.js');const port=+process.argv[2]||9601;
const T0=Date.now();const log=(...a)=>console.log(((Date.now()-T0)/1000).toFixed(1)+'s',...a);
const to=(p,ms,n)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('stage timeout '+n)),ms))]);
(async()=>{const s=await H.serve(port);const b=await H.launch(port+1000,'http://127.0.0.1:'+port+'/index.html?',['--window-size=760,460']);
try{
await to((async()=>{for(let i=0;i<60&&!(await b.ev('!!(window.__ca2&&__ca2.getCells&&__ca2.getCells().length)'));i++)await b.sleep(500);})(),40000,'boot');log('booted');
await b.sleep(3000);
const rect=JSON.parse(await b.ev(`(function(){var r=document.querySelector('canvas').getBoundingClientRect();return JSON.stringify({l:r.left,t:r.top,w:r.width,h:r.height})})()`));
const snap=()=>b.ev(`JSON.stringify({c:__ca2.getCells().map(c=>[c.x,c.y]),p:__ca2.getParasites().map(p=>({x:p.x,y:p.y,a:p.a,e:p.e,circ:!!p.circ,h:!!p.host}))})`).then(JSON.parse);
const st0=await snap();log('cells',st0.c.length,'parasites',st0.p.length,JSON.stringify(rect));
// A
let tgt=st0.c.reduce((m,c)=>Math.hypot(c[0]-380,c[1]-230)<Math.hypot(m[0]-380,m[1]-230)?c:m);
await to((async()=>{await b.mouse(Math.round(tgt[0]),Math.round(tgt[1]));await b.sleep(5000);})(),30000,'A-hold');
const A=await snap();let near=0,fled=0;for(let i=0;i<st0.c.length&&i<A.c.length;i++){const d0=Math.hypot(st0.c[i][0]-tgt[0],st0.c[i][1]-tgt[1]);if(d0<90){near++;if(Math.hypot(A.c[i][0]-tgt[0],A.c[i][1]-tgt[1])>d0+3)fled++;}}
log('A near',near,'fled',fled);
await b.shot('/tmp/t146-A.png');
// B/C: hostless parasite prefers the cursor only when the cursor is NEARER than any cell: drop the cursor on a hostless parasite, retry; then hold still and sample.
const out={tries:[],belief:[]};let acquired=false,mx=0,my=0;
await to((async()=>{for(let k=0;k<20&&!acquired;k++){const q=await snap();const hl=q.p.find(p=>!p.h&&p.x>40&&p.x<720&&p.y>20&&p.y<300);if(!hl){await b.sleep(400);continue;}
 mx=Math.round(hl.x);my=Math.round(hl.y);await b.mouse(mx,my);const q2=await snap();const n=q2.p.filter(p=>p.a<-5e8).length;out.tries.push(n);if(n>0)acquired=true;}})(),50000,'acquire');
log('acquire tries (believing count after cursor drop):',out.tries.join(','),'acquired',acquired);
if(acquired){const tS=Date.now();
await to((async()=>{for(let k=0;k<30;k++){await b.sleep(250);const q=await snap();out.belief.push([Math.round((Date.now()-tS)/100)/10,q.p.filter(p=>p.a<-5e8).length,q.p.filter(p=>!p.h).length,Math.round(Math.min(...q.p.filter(p=>!p.h).map(p=>Math.hypot(p.x-mx,p.y-my))))]);}})(),40000,'hold');
log('t:believing/hostless/minDistHostless (cursor fixed at',mx,my,') ',out.belief.map(x=>x.join('/')).join(' '));
let trans=0;for(let i=1;i<out.belief.length;i++)if(out.belief[i][1]>0&&out.belief[i-1][1]===0)trans++;log('re-acquisitions 0->>0 while stationary:',trans);}
await b.shot('/tmp/t146-B.png');log('errs',JSON.stringify(b.errs.slice(0,3)));
}catch(e){log('FAIL',String(e));}
b.close();s.close();process.exit(0)})();
