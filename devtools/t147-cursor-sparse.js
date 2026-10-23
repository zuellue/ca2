// t147 (TEST-ONLY manipulation: all cells but the one farthest from the cursor are removed in-page so a hostless parasite can find the cursor nearest). t146 base: bounded live cursor test, 760x460. Stages each have their own timeout and timing. Real Input.dispatchMouseEvent.
// A cells flee. B parasites: pursuit (p.a<-1e9 believing) -> give up -> boundary. C stationary cursor: reacquisition count.
const H=require('./harness.js');const port=+process.argv[2]||9601;
const T0=Date.now();const log=(...a)=>console.log(((Date.now()-T0)/1000).toFixed(1)+'s',...a);
const to=(p,ms,n)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('stage timeout '+n)),ms))]);
(async()=>{const s=await H.serve(port);const b=await H.launch(port+1000,'http://127.0.0.1:'+port+'/index.html?grain=0&audio=0&axis=0&mb=0',['--window-size=760,460']);
try{
await to((async()=>{for(let i=0;i<60&&!(await b.ev('!!(window.__ca2&&__ca2.getCells&&__ca2.getCells().length)'));i++)await b.sleep(500);})(),40000,'boot');await b.ev('__ca2.P.grain=0;0');log('booted');
await b.sleep(3000);
const rect=JSON.parse(await b.ev(`(function(){var r=document.querySelector('canvas').getBoundingClientRect();return JSON.stringify({l:r.left,t:r.top,w:r.width,h:r.height})})()`));
const snap=()=>b.ev(`JSON.stringify({c:__ca2.getCells().map(c=>[c.x,c.y]),p:__ca2.getParasites().map(p=>({x:p.x,y:p.y,a:p.a,e:p.e,circ:!!p.circ,h:!!p.host}))})`).then(JSON.parse);
const st0=await snap();log('cells',st0.c.length,'parasites',st0.p.length,JSON.stringify(rect));
// A
let tgt=st0.c.reduce((m,c)=>Math.hypot(c[0]-380,c[1]-230)<Math.hypot(m[0]-380,m[1]-230)?c:m);
await to((async()=>{await b.mouse(Math.round(tgt[0]),Math.round(tgt[1]));await b.sleep(100);})(),30000,'A-hold');
const A=await snap();let near=0,fled=0;for(let i=0;i<st0.c.length&&i<A.c.length;i++){const d0=Math.hypot(st0.c[i][0]-tgt[0],st0.c[i][1]-tgt[1]);if(d0<90){near++;if(Math.hypot(A.c[i][0]-tgt[0],A.c[i][1]-tgt[1])>d0+3)fled++;}}
log('A near',near,'fled',fled);
await b.shot('/tmp/t146-A.png');
// B/C v2: in-page 100ms recorder (no CDP latency in the series). Drop cursor on a hostless parasite, hold still, record 14 s.
await b.ev(`window.__tr=[];window.__acq=0;window.__acqT=0;window.__cut=0;window.__trT=setInterval(function(){var t=performance.now(),ps=__ca2.getParasites(),cv=document.querySelector('canvas');
 if(!window.__cut&&ps.length){var hp=ps[0],cs=__ca2.getCells();var far=cs.reduce(function(m,c){return Math.hypot(c.x-hp.x,c.y-hp.y)>Math.hypot(m.x-hp.x,m.y-hp.y)?c:m});cs.splice(0,cs.length,far);window.__cut=1;}
 if(!window.__acq){var bel=ps.some(function(p){return p.a<=-1e9});if(bel){window.__acq=1;window.__acqT=t;}else{var hl=ps.filter(function(p){return !p.host&&p.x>40&&p.x<720&&p.y>20&&p.y<300})[0];if(hl)cv.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:Math.round(hl.x),clientY:Math.round(hl.y)}));}}
 window.__tr.push({t:t,p:ps.map(function(p){return [Math.round(p.x),Math.round(p.y),p.a<=-2e9?2:((p.a<=-1e9?1:0)),p.host?1:0,p.circ?1:0]})})},100);0`);
let acquired=false,mx=0,my=0;
await to((async()=>{for(let k=0;k<30&&!(await b.ev('window.__acq'));k++)await b.sleep(1000);})(),40000,'acquire');log('acquired',await b.ev('window.__acq'));await b.sleep(40000);
const tr=JSON.parse(await b.ev('JSON.stringify(window.__tr)'));
// belief episodes per parasite index (indices can shift on death; report by index as recorded)
const cont=JSON.parse(await b.ev('JSON.stringify(window.__ca2.getCont?__ca2.getCont():null)'));
log('samples',tr.length,'span s',((tr[tr.length-1].t-tr[0].t)/1000).toFixed(1),'cont',JSON.stringify(cont));
log('raw',tr.map(x=>((x.t-tr[0].t)/1000).toFixed(0)+':'+x.p.map(p=>p[0]+','+p[1]+'s'+p[2]+(p[3]?'H':'')).join('|')).join('  '));
let ep=[],cur={};
tr.forEach((s,fi)=>{s.p.forEach((p,i)=>{if(p[2]===1){if(!cur[i])cur[i]={i,start:fi,sx:p[0],sy:p[1]};cur[i].end=fi;cur[i].ex=p[0];cur[i].ey=p[1];}else if(cur[i]){ep.push(cur[i]);delete cur[i];}})});Object.values(cur).forEach(e=>ep.push(e));
ep.forEach(e=>{const last=tr[Math.min(e.end+1,tr.length-1)].p[e.i];log('belief episode idx',e.i,'samples',e.start,'-',e.end,'t(s)',((tr[e.start].t-tr[0].t)/1000).toFixed(1),'-',((tr[e.end].t-tr[0].t)/1000).toFixed(1),'start',e.sx,e.sy,'end',e.ex,e.ey,'next',JSON.stringify(last))});
// after give-up: trajectory of that parasite every 1 s
ep.slice(0,1).forEach(e=>{const traj=[];for(let f=e.end;f<tr.length;f+=1){const q=tr[f].p[e.i];if(q)traj.push(((tr[f].t-tr[0].t)/1000).toFixed(1)+'s:'+q[0]+','+q[1]+'s'+q[2]+(q[3]?'H':'')+(q[4]?'C':''));}log('post-belief traj idx',e.i,traj.join(' '));});
await b.shot('/tmp/t146-B.png');log('errs',JSON.stringify(b.errs.slice(0,3)));
}catch(e){log('FAIL',String(e));}
b.close();s.close();process.exit(0)})();
