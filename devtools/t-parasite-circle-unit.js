// deterministic unit test of the parasite/glyph-circle belief rules (pure node). Extracts circleInPlate + parasiteCircles from ca2.js.
const fs=require('fs'),src=fs.readFileSync(__dirname+'/../ca2.js','utf8');
const a=src.indexOf('  function circleInPlate'),b=src.indexOf('  function stepParasites() {');
const code=src.slice(a,b);
function mk(o){const env=Object.assign({P:{parasiteOn:1,showHud:1,titleCircles:1,parasiteSight:4000,parasiteNerv:0},clamp:(v,l,h)=>Math.max(l,Math.min(h,v)),cont:{x:100,y:100,w:400,h:300},circlesNow:[],cells:[],parasites:[],performance:{now:()=>0},Math},o);
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
process.exit(fail?1:0);
