// t135: founder-fixed shape comparison. At ~3 s the whole population is replaced by 24 deterministic cells (positions, velocities, radii, energies,
// genes, genome, shapes 50/50 alternating) from a seeded PRNG, food is cleared, Math.random is replaced by a seeded PRNG. A readback hash of the
// start state is printed; it must be identical across boots and modes. Frame timing (dt) is NOT controlled, so trajectories still diverge; this only
// equalises the START. Usage: node t135-founder-fixed-shape.js '<query>' <port> [runSec]
const {serve,launch}=require('./harness.js');
const q=process.argv[2]||'',port=+process.argv[3],run=+process.argv[4]||40;
(async()=>{const s=await serve(port);const h=await launch(port+1000,'http://127.0.0.1:'+port+'/index.html?'+q,[]);
for(let i=0;i<45&&!(await h.ev('!!window.__ca2'));i++)await h.sleep(1000);
await h.sleep(3000);await h.ev("__ca2.setKey('autoQuality',0);1");
const st=await h.ev(`(function(){var seed=12345;function rnd(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
var c=__ca2.getCells(),f=__ca2.getFood();if(!c.length)return 'nocells';var T=c[0],proto=Object.getPrototypeOf(T),keep=JSON.parse(JSON.stringify(T.g));
var arr=[];for(var i=0;i<24;i++){var k=Object.assign(Object.create(proto),T);k.g=JSON.parse(JSON.stringify(keep));k.sym=null;k.cl=0;k.alive=true;k.x=200+rnd()*400;k.y=150+rnd()*300;k.vx=(rnd()-.5)*2;k.vy=(rnd()-.5)*2;k.radius=12+rnd()*10;k.energy=6+rnd()*6;k.gene=16;k.popD=1000+i;k.sv=((i*0.37)%1);k.maxSpeed=6+(i%5);k.mutationRate=9.5;k.hostility=0.5;k.speedModifier=1+(i%4)*0.1;k.g={spd:1+(i%3)*0.1,app:0.5,bnd:1,col:[0.2+(i%5)*0.1,0.4,0.6]};k.age=0.2;k.life=60+i;k.absorbed=0;delete k._sepX;delete k._sepY;delete k._i;delete k._f;delete k._pi;k.shp={t:i%2?0:2,asp:1,th:1,wig:0,wsp:1,sat:i%2?0:2,ph:1,ph2:2,dir:i*0.7};k.bornAt=0;arr.push(k)}
c.length=0;arr.forEach(function(k){c.push(k)});f.length=0;Math.random=rnd;
var hs=0,s=JSON.stringify(c.map(function(k){return [k.x,k.y,k.vx,k.vy,k.radius,k.energy,k.gene,k.shp.t,k.g.spd]}));for(var j=0;j<s.length;j++)hs=(hs*31+s.charCodeAt(j))|0;return 'n='+c.length+' food='+f.length+' hash='+hs})()`);
await h.sleep(run*1000);
console.log(q||'wasm',st,await h.ev(`(function(){var c=__ca2.getCells(),t=[0,0,0];c.forEach(function(k){if(k.shp)t[k.shp.t]++});return JSON.stringify({n:c.length,round:t[0],lobed:t[2],sim:__ca2.SIMW.on})})()`),JSON.stringify(h.errs));
h.close();s.close();process.exit(0)})();
