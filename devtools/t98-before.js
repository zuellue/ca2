const H=require('/tmp/ca2/devtools/harness.js');
(async()=>{const b=await H.launch(9569,'https://ca.abdupala.com/?nosim=1',[]);
for(let i=0;i<50;i++){await b.sleep(600);if(await b.ev('typeof window.__ca2')==='object')break;}
await b.sleep(5000);
await b.ev(`(()=>{document.getElementById('tab').click();return 1})()`);await b.sleep(900);
await b.ev(`(()=>{const items=[...document.querySelectorAll('#secc .sci')];items[items.length-1].click();return 1})()`);await b.sleep(1000);
console.log(await b.ev(`(()=>{window.__s=[];window.__z=setInterval(()=>{if(__s.length>=20)return;
  const st=document.getElementById('stats');const rows=[];
  const sp=st.querySelectorAll('span');
  for(let i=0;i<sp.length;i+=2){const r=sp[i+1].getBoundingClientRect();rows.push([sp[i].textContent,+r.left.toFixed(1),+r.right.toFixed(1),+r.width.toFixed(1)]);}
  __s.push({rows:rows,sw:st.scrollWidth,lf:getComputedStyle(st).fontSize,vf:getComputedStyle(sp[1]).fontSize});
  },200);
  const st=document.getElementById('stats');const sp=st.querySelectorAll('span');
  window.__base=[...st.querySelectorAll('span:not(.n)')].map(l=>{const a=l.getBoundingClientRect();return [l.textContent,+(a.top+a.height/2).toFixed(1)];});
  return 'sampling';})()`));
await b.sleep(4800);
console.log(await b.ev(`(()=>{clearInterval(window.__z);
  const names={};let swMin=1e9,swMax=-1e9;const lf=new Set(),vf=new Set();
  __s.forEach(s=>{swMin=Math.min(swMin,s.sw);swMax=Math.max(swMax,s.sw);lf.add(s.lf);vf.add(s.vf);s.rows.forEach(r=>{const n=names[r[0]]=names[r[0]]||{lMin:1e9,lMax:-1e9,rMin:1e9,rMax:-1e9,wMin:1e9,wMax:-1e9};n.lMin=Math.min(n.lMin,r[1]);n.lMax=Math.max(n.lMax,r[1]);n.rMin=Math.min(n.rMin,r[2]);n.rMax=Math.max(n.rMax,r[2]);n.wMin=Math.min(n.wMin,r[3]);n.wMax=Math.max(n.wMax,r[3]);});});
  const out={};for(const k in names){const n=names[k];out[k]={leftJitter:+(n.lMax-n.lMin).toFixed(1),rightJitter:+(n.rMax-n.rMin).toFixed(1),widthJitter:+(n.wMax-n.wMin).toFixed(1)};}
  return JSON.stringify({samples:__s.length,perRow:out,statsScrollW:[swMin,swMax],labelFonts:[...lf],valueFonts:[...vf]});})()`));
console.log('errs',b.errs);b.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
