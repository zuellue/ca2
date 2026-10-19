const L=require('/tmp/cdplib.js');
(async()=>{const b=await L.launch(9412,'http://localhost:8765/index.html#open',[]);await b.sleep(2500);
await b.ev("(function(){var a=window.__ca2;a.P.minRefreshInterval=300;a.P.maxRefreshInterval=300;a.P.grain=0;})()");
const rect=l=>b.ev(`(function(){var rows=document.querySelectorAll('#controls .row');for(var i=0;i<rows.length;i++){var s=rows[i].querySelector('.lab span');if(s&&s.textContent==='${l}'){rows[i].scrollIntoView({block:'center'});var r=rows[i].querySelector('input').getBoundingClientRect();return JSON.stringify([r.left,r.top+r.height/2,r.width])}}})()`).then(JSON.parse);
const dbl=async(l,fx)=>{const r=await rect(l);const x=r[0]+r[2]*fx,y=r[1];await b.mouse(x,y);for(const cc of [1,2]){await b.mouse(x,y,'mousePressed',{button:'left',clickCount:cc});await b.mouse(x,y,'mouseReleased',{button:'left',clickCount:cc});}};
const val=k=>b.ev(`window.__ca2.P.${k}`);
const stored=k=>b.ev(`JSON.parse(localStorage.getItem('ca2.config')).P.${k}`);
const R={};
R.marginBefore=await val('margin'); R.gapBefore=await val('gap');
// put knob thumb position exactly at current value so click doesn't move it: margin max 120 -> fx=value/120
await dbl('margin (all edges)', R.marginBefore/120);
await dbl('line gap to numbers', R.gapBefore/60);
R.live=await b.ev("JSON.stringify(Object.keys(window.__ca2.live).map(function(k){return [k,window.__ca2.live[k].col,window.__ca2.live[k].orig]}))");
const m=[],g=[];
for(let i=0;i<40;i++){m.push(+(await val('margin')));g.push(+(await val('gap')));await b.sleep(250);}
R.margin={min:Math.min(...m),max:Math.max(...m),distinct:new Set(m).size}; R.gap={min:Math.min(...g),max:Math.max(...g),distinct:new Set(g).size};
R.storedMarginWhileLive=await stored('margin'); R.storedGapWhileLive=await stored('gap');
R.cssLive=await b.ev("(function(){var r=document.querySelector('#controls .row.live');return r?getComputedStyle(r).getPropertyValue('--kc')+' '+getComputedStyle(r.querySelector('.lab b')).color:null})()");
// second dblclick returns
await dbl('margin (all edges)', 0.5);
R.afterStopMargin=await val('margin'); R.gapStillLive=!!(await b.ev("!!window.__ca2.live.gap"));
await b.sleep(600); R.afterStopMarginLater=await val('margin');
await dbl('line gap to numbers', 0.5); R.afterStopGap=await val('gap');
R.liveLeft=await b.ev("Object.keys(window.__ca2.live).length");
console.log(JSON.stringify(R));console.log('errs',b.errs);b.close();process.exit(0)})();
