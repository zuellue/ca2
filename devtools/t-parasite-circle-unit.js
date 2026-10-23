// deterministic unit test of the parasite/glyph-circle belief rules (pure node). Extracts circleInPlate + parasiteCircles from ca2.js.
const fs=require('fs'),WASM=process.argv[2],src=fs.readFileSync(__dirname+'/../ca2.js','utf8');
const a=src.indexOf('  function circleInPlate'),b=src.indexOf('  function stepParasites() {');
const code=src.slice(a,b);
const E=WASM?new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(__dirname+'/../'+WASM)),{}).exports:null;
function mk(o){const env=Object.assign({WC:E?{e:E,mem:E.memory,ok:true}:{},location:{search:''},P:{parasiteOn:1,showHud:1,titleCircles:1,parasiteSight:4000,parasiteNerv:0},clamp:(v,l,h)=>Math.max(l,Math.min(h,v)),cont:{x:100,y:100,w:400,h:300},circlesNow:[],cells:[],parasites:[],performance:{now:()=>0},Math},o);
 return {env,f:new Function(...Object.keys(env),code+';return {parasiteCircles,circleInPlate};')(...Object.values(env))};}
let fail=0;const ok=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);if(!c)fail++;};
// 1 circle outside plate is never a target
let t=mk({circlesNow:[{key:'a',x:20,y:20,r:30}],parasites:[{x:150,y:150,e:5,host:null}]});t.f.parasiteCircles();ok('circle outside plate ignored',!t.env.parasites[0].circ);
// 2 circle overlapping plate edge (boundary grown over letter) is believed by hostless parasite
t=mk({circlesNow:[{key:'a',x:90,y:150,r:30}],parasites:[{x:150,y:150,e:5,host:null}]});t.f.parasiteCircles();ok('circle overlapping plate believed',t.env.parasites[0].circ&&t.env.parasites[0].circ.key==='a');
// 3 parasite moves toward it
const p0=t.env.parasites[0],x0=p0.x;for(let i=0;i<20;i++)t.f.parasiteCircles();ok('moves toward circle',Math.hypot(p0.x-90,p0.y-150)<Math.hypot(x0-90,0));
// 4 hosted parasite is never diverted
t=mk({circlesNow:[{key:'a',x:150,y:150,r:30}],parasites:[{x:150,y:150,e:5,host:{alive:1}}]});t.f.parasiteCircles();ok('hosted parasite untouched',!t.env.parasites[0].circ);
// 5 nearer real cell breaks the illusion
t=mk({circlesNow:[{key:'a',x:90,y:150,r:30}],cells:[{x:400,y:300,alive:1,radius:20}],parasites:[{x:150,y:150,e:5,host:null}]});t.f.parasiteCircles();ok('circle nearer than cell is believed',!!t.env.parasites[0].circ);
t.env.cells.push({x:152,y:150,alive:1,radius:20});t.f.parasiteCircles();ok('cell nearer than circle breaks illusion',!t.env.parasites[0].circ);
// 6 plate shrinks away: circle lost
t=mk({circlesNow:[{key:'a',x:90,y:150,r:30}],parasites:[{x:150,y:150,e:5,host:null}]});t.f.parasiteCircles();t.env.cont.x=300;t.f.parasiteCircles();ok('circle leaves plate: belief ends',!t.env.parasites[0].circ);
// 7 no HUD: no circles
t=mk({circlesNow:[{key:'a',x:90,y:150,r:30}],parasites:[{x:150,y:150,e:5,host:null}]});t.env.P.showHud=0;t.f.parasiteCircles();ok('HUD off: no belief',!t.env.parasites[0].circ);
// 8 episode origin: after any belief exit, a fresh second belief starts from the parasite's CURRENT position (no snap back to the old episode)
function snap(name,exit){
  const t=mk({circlesNow:[{key:'a',x:90,y:150,r:30}],parasites:[{x:150,y:150,e:5,host:null}]});const p=t.env.parasites[0];
  t.f.parasiteCircles();t.f.parasiteCircles();const old=[p._ox,p._oy];
  exit(t,p); t.f.parasiteCircles(); // exit frame
  p.x=480;p.y=380; // the core step moves it far away meanwhile (rehost/other wander)
  t.env.cont.x=100;t.env.cont.w=400;t.env.circlesNow[0]={key:'b',x:90,y:150,r:30};t.env.cells.length=0;p.host=null;
  const bx=p.x,by=p.y;t.f.parasiteCircles();
  ok('no snap after exit: '+name,Math.hypot(p.x-bx,p.y-by)<10);
}
snap('host acquired',(t,p)=>{p.host={alive:1};});
snap('plate left circle',(t)=>{t.env.cont.x=300;});
snap('nearer real cell',(t)=>{t.env.cells.push({x:152,y:150,alive:1,radius:20});});
snap('hud off',(t)=>{t.env.P.showHud=0;});
process.exit(fail?1:0);
