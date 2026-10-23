// t143: fault injection for the wasm separator pass (sepPassW). Deterministic, no RNG: freeze cells, call separatorPass (__ca2.sepStep) 3 ways on the same snapshot:
//  A) wasm path with sep2_phase_b throwing on its 2nd call -> fallback must give EXACTLY the pure-JS result (no cell processed twice), WC.sepOff must be true, WC.sepErr set
//  B) pure JS (WC.sepOff=true from the start) on the restored snapshot = reference
//  C) a further call after the fault: sep2_phase_a/b call counts must not increase (no wasm retry)
// Usage: node t143-sep-fault.js <port> [query]
const {serve,launch}=require('./harness.js');const port=+process.argv[2],q=process.argv[3]||'';
(async()=>{const s=await serve(port);const h=await launch(port+1000,'http://127.0.0.1:'+port+'/index.html?'+q,['--window-size=760,460']);
for(let i=0;i<45&&!(await h.ev('!!window.__ca2'));i++)await h.sleep(1000);await h.sleep(5000);
const r=await h.ev(`(function(){
var C=__ca2, E=C.WC.e; if(!E||!E.sep2_phase_a) return {err:'no sep2 exports'};
['grain','audioOn','metaballStrength'].forEach(function(k){C.setKey(k,0)}); C.setKey('showAxis',1); C.setKey('separatorOn',1);
var cells=C.getCells();
// make the separator do real work: push some live cells onto the axis lines / plate edges
var cx=C.cont.x,cy=C.cont.y,cw=C.cont.w,ch=C.cont.h;
cells.forEach(function(c,i){ if(i%3==0){c.x=cx+cw/2+(i%7-3);c.y=cy+ch/2+(i%5-2)*9} else if(i%3==1){c.x=cx+2+i%5;} });
function snap(){return cells.map(function(c){return [c.x,c.y,c.vx,c.vy,c.radius]})}
function restore(S){cells.forEach(function(c,i){c.x=S[i][0];c.y=S[i][1];c.vx=S[i][2];c.vy=S[i][3];c.radius=S[i][4]})}
var S0=snap(), nA=0,nB=0, oa=E.sep2_phase_a, ob=E.sep2_phase_b;
var realE=C.WC.e; var ov={sep2_phase_a:function(){nA++;return oa.apply(realE,arguments)},sep2_phase_b:function(){nB++; if(nB===2) throw new Error('injected fault'); return ob.apply(realE,arguments)}}; var cp2={};for(var kk in realE)cp2[kk]=ov[kk]||realE[kk]; C.WC.e=cp2; /* wasm exports are read-only: wrap through a Proxy */
C.WC.sepOff=false; C.WC.sepErr=null;
C.sepStep(); var A=snap(), offA=!!C.WC.sepOff, errA=C.WC.sepErr, callsA=[nA,nB];
restore(S0); C.WC.sepOff=true; C.sepStep(); var B=snap();
var maxd=0,nd=0; for(var i=0;i<A.length;i++)for(var k=0;k<5;k++){var d=Math.abs(A[i][k]-B[i][k]); if(!(d===0)){nd++; if(d>maxd||d!==d)maxd=d}}
C.WC.sepOff=false; /* keep the fault state: sepOff was set by the first fault, a later frame must not retry */
restore(S0); C.WC.sepOff=offA; var a0=nA,b0=nB; C.sepStep(); var callsC=[nA-a0,nB-b0];
var moved=0; for(i=0;i<A.length;i++) if(A[i][0]!==S0[i][0]||A[i][1]!==S0[i][1]) moved++;
C.WC.e=realE;
return {cells:A.length,moved:moved,faultCallCounts:callsA,sepOffAfterFault:offA,sepErr:errA,diffEntriesVsPureJS:nd,maxAbsDiff:maxd,wasmCallsOnNextFrame:callsC};
})()`);
console.log(JSON.stringify(r),JSON.stringify(h.errs));h.close();s.close();process.exit(0)})();
