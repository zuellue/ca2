// clean food-wasm A/B: history.replaceState toggles ?nofoodwasm=1 without reload, so the sim wasm
// stays on for BOTH sides and only stepSporesW/stepWormsW/stepParasitesW fall back to JS.
// usage: node devtools/t82b-clean-ab.js
const H=require('./harness.js');
(async()=>{const s=await H.serve(8797);const b=await H.launch(9537,'http://localhost:8797/index.html?perf=1',[]);
for(let i=0;i<40;i++){await b.sleep(500);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(8000);
const rd=async()=>await b.ev('JSON.stringify({mode:__ca2.P.foodMode,food:__ca2.getFood().length,cells:__ca2.cells,fw:!/[?&]nofoodwasm=1/.test(location.search),f:+__ca2.PF["food step"].toFixed(3),sp:+__ca2.PF["sim loop+parasites"].toFixed(3),draw:+__ca2.PF["sim+ui draw"].toFixed(3)})');
const flag=async on=>await b.ev('history.replaceState(null,"","?perf=1'+(on?'&nofoodwasm=1':'')+'");"f"+'+on);
console.log('M3 wasm:',await rd());
await flag(true);await b.sleep(12000);
console.log('M3 js  :',await rd());
await flag(false);
for(const m of [5,4]){await b.ev('__ca2.P.foodMode='+m+';"m"+'+m);
 await flag(true);await b.sleep(13000);
 console.log('M'+m+' js  :',await rd());
 await flag(false);await b.sleep(13000);
 console.log('M'+m+' wasm:',await rd());}
console.log('errs',b.errs);b.close();s.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
