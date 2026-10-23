// t140: live same-start event A/B (pair/merge/fuse/eaten/birth/death). Same seeded 24-cell start state as t135 (readback hash must match across
// boots/modes), seeded Math.random, food cleared. Event counters (ev.*) and a rAF frame counter are zeroed after the state swap and read after runSec.
// dt is NOT controlled and stochastic leave rolls are unmirrored, so trajectories diverge: distribution-only evidence, no parity claim.
// Usage: node t140-live-events-ab.js '<query>' <port> [runSec]
const {serve,launch}=require('./harness.js');
const q=process.argv[2]||'',port=+process.argv[3],run=+process.argv[4]||40;
(async()=>{const s=await serve(port);const h=await launch(port+1000,'http://127.0.0.1:'+port+'/index.html?'+q,['--window-size=760,460']);
for(let i=0;i<45&&!(await h.ev('!!window.__ca2'));i++)await h.sleep(1000);
await h.sleep(3000);await h.ev("__ca2.setKey('autoQuality',0);__ca2.setKey('grain',0);__ca2.setKey('audioOn',0);__ca2.setKey('showAxis',0);__ca2.setKey('metaballStrength',0);1");await h.sleep(3000);
await h.ev('window.__NC='+(process.env.NC||24)+';window.__AX='+(process.env.AX||200)+';window.__AY='+(process.env.AY||150)+';window.__AW='+(process.env.AW||400)+';window.__AH='+(process.env.AH||300)+';1');
const st=await h.ev(`(function(){var NC=+(window.__NC||24),AX=+(window.__AX||200),AY=+(window.__AY||150),AW=+(window.__AW||400),AH=+(window.__AH||300);var seed=12345;function rnd(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
var c=__ca2.getCells(),f=__ca2.getFood();if(!c.length)return 'nocells';var T=c[0],proto=Object.getPrototypeOf(T),keep=JSON.parse(JSON.stringify(T.g));
var arr=[];for(var i=0;i<NC;i++){var k=Object.assign(Object.create(proto),T);k.g=JSON.parse(JSON.stringify(keep));k.sym=null;k.cl=0;k.alive=true;k.x=AX+rnd()*AW;k.y=AY+rnd()*AH;k.vx=(rnd()-.5)*2;k.vy=(rnd()-.5)*2;k.radius=12+rnd()*10;k.energy=6+rnd()*6;k.gene=16;k.popD=1000+i;k.sv=((i*0.37)%1);k.maxSpeed=6+(i%5);k.mutationRate=9.5;k.hostility=0.5;k.speedModifier=1+(i%4)*0.1;k.g={spd:1+(i%3)*0.1,app:0.5,bnd:1,col:[0.2+(i%5)*0.1,0.4,0.6]};k.age=0.2;k.life=60+i;k.absorbed=0;delete k._sepX;delete k._sepY;delete k._i;delete k._f;delete k._pi;k.shp={t:i%2?0:2,asp:1,th:1,wig:0,wsp:1,sat:i%2?0:2,ph:1,ph2:2,dir:i*0.7};k.bornAt=0;arr.push(k)}
c.length=0;arr.forEach(function(k){c.push(k)});f.length=0;Math.random=rnd;
var hs=0,s=JSON.stringify(c.map(function(k){return [k.x,k.y,k.vx,k.vy,k.radius,k.energy,k.gene,k.shp.t,k.g.spd]}));for(var j=0;j<s.length;j++)hs=(hs*31+s.charCodeAt(j))|0;
window.__fc=0;(function l(){window.__fc++;requestAnimationFrame(l)})();window.__sf=0;
window.__b0={m:__ca2.merges,fu:__ca2.fusions,pa:__ca2.pairings,e:__ca2.eaten,b:__ca2.births,d:__ca2.deaths,dv:__ca2.divides};
return 'n='+c.length+' hash='+hs})()`);
await h.sleep(run*1000);
console.log(q||'wasm',st,await h.ev(`JSON.stringify({frames:window.__fc,simFrames:window.__sf,n:__ca2.getCells().length,merge:__ca2.merges-__b0.m,fuse:__ca2.fusions-__b0.fu,pair:__ca2.pairings-__b0.pa,eaten:__ca2.eaten-__b0.e,birth:__ca2.births-__b0.b,death:__ca2.deaths-__b0.d,divide:__ca2.divides-__b0.dv,sim:__ca2.SIMW.on,simOff:!!__ca2.WC.simOff,simErr:__ca2.WC.simErr||null,liveOff:!!__ca2.WC.liveOff})`),JSON.stringify(h.errs));
h.close();s.close();process.exit(0)})();
