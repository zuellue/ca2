// t-corner-icon-outside: corner-resize icons must stay OUTSIDE the plate during shrink AND grow drags
// (user 24 Oct, phonemsg-01M5PFWBYFF2JK826HKA78DQHW). Real page + real CDP mouse drag on the bottom-right
// corner; samples the live cursor-edge SVG path mid-drag and asserts every drawn point lies outside the
// current plate rect. usage: node t-corner-icon-outside.js <tag> <port-offset>  (serves repo root; pass a
// pre-fix checkout via CA2_ROOT env to prove the old failure)
const {serve,launch}=require('./harness.js');
const tag=process.argv[2]||'post',PO=+(process.argv[3]||0);
const DPTH="(function(){var sv=null,ps=document.querySelectorAll('svg path');for(var i=0;i<ps.length;i++){if(ps[i].getAttribute('stroke-linecap')==='butt'){sv=ps[i];break}}if(!sv||!sv.getAttribute('d'))return null;var d=sv.getAttribute('d'),c=window.__ca2.getCont(),nums=d.match(/-?[0-9]+\\.?[0-9]*/g).map(Number),pts=[];for(var k=0;k<nums.length;k+=2)pts.push([nums[k],nums[k+1]]);return JSON.stringify({cont:[c.x,c.y,c.w,c.h],d:d,pts:pts})})()";
(async()=>{const s=await serve(8391+PO);
 const h=await launch(9491+PO,'http://127.0.0.1:'+(8391+PO)+'/index.html',[]);
 for(let i=0;i<45&&!(await h.ev('!!window.__ca2'));i++)await h.sleep(1000);
 await h.sleep(9000); // intro + spawn settle
 const c0=JSON.parse(await h.ev('JSON.stringify((function(){var c=window.__ca2.getCont();return[c.x,c.y,c.w,c.h]})())'));
 const cx=c0[0]+c0[2],cy=c0[1]+c0[3]; // bottom-right corner
 await h.mouse(cx,cy,'mouseMoved');await h.sleep(300);
 await h.mouse(cx,cy,'mousePressed',{button:'left',buttons:1,clickCount:1});await h.sleep(400);
 const samples=[];
 async function dragTo(x,y,label){await h.mouse(x,y,'mouseMoved',{button:'left',buttons:1});await h.sleep(450);const r=await h.ev(DPTH);if(r)samples.push({label:label,data:JSON.parse(r)});}
 // shrink: pull the corner inward in steps
 for(let k=1;k<=6;k++)await dragTo(cx-k*18,cy-k*14,'shrink'+k);
 await h.shot('/tmp/cornericon-'+tag+'-midshrink.png'); // icons visible only mid-drag
 // grow: push back out past the start
 for(let k=1;k<=8;k++)await dragTo(cx-6*18+k*20,cy-6*14+k*16,'grow'+k);
 await h.shot('/tmp/cornericon-'+tag+'-midgrow.png');
 await h.mouse(cx+60,cy+50,'mouseReleased',{button:'left',buttons:0});await h.sleep(300);
 // analysis: every sampled path point must be outside its current plate rect (2px tolerance)
 let bad=[],tot=0;
 for(const sm of samples){const[px,py,pw,ph]=sm.data.cont;
  for(const q of sm.data.pts){tot++;const outX=q[0]<px-2||q[0]>px+pw+2,outY=q[1]<py-2||q[1]>py+ph+2;
   if(!outX&&!outY){bad.push({label:sm.label,pt:q,cont:sm.data.cont});if(bad.length<4)console.log('INSIDE',sm.label,q,'cont',sm.data.cont);}}}
 h.close();s.close();
 console.log('CORNERICON '+tag+' '+JSON.stringify({samples:samples.length,points:tot,inside:bad.length,pass:bad.length===0&&tot>0}));
 process.exit(0)})().catch(e=>{console.error('FATAL',e&&e.message||e);process.exit(1)});
