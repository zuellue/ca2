const L=require('/tmp/cdplib2.js');
const ink=`(function(){var c=document.getElementById('c'),x=c.getContext('2d'),d=x.getImageData(0,0,c.width,c.height).data,bg=[d[0],d[1],d[2]],n=0;for(var i=0;i<d.length;i+=64){if(Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2])>40)n++}return n})()`;
(async()=>{const mode=process.env.AP?'blocked':'allowed';
const b=await L.launch(9430+(process.env.AP?1:0),'http://localhost:8765/index.html',[]);
const t0=Date.now();const out=[];
await b.mouse(5,5);
for(let s=0;s<9;s++){await b.sleep(900);
 const st=JSON.parse(await b.ev("JSON.stringify({st:window.CA2Audio&&CA2Audio.ctx?CA2Audio.ctx.state:'none',fade:window.CA2Audio?+(CA2Audio.fade||0).toFixed(2):-1,rms:(function(){if(!(window.CA2Audio&&CA2Audio.analyser))return -1;var d=new Float32Array(2048),s=0;CA2Audio.analyser.getFloatTimeDomainData(d);for(var i=0;i<d.length;i++)s+=d[i]*d[i];return +Math.sqrt(s/d.length).toFixed(4)})(),ink:"+ink+"})"));
 out.push(((Date.now()-t0)/1000).toFixed(1)+'s '+JSON.stringify(st));
 if(mode==='blocked'&&s===3){await b.mouse(600,400,'mousePressed',{button:'left',clickCount:1});await b.mouse(600,400,'mouseReleased',{button:'left',clickCount:1});out.push('-- click --')}
}
console.log(mode);out.forEach(l=>console.log(l));console.log(b.errs);b.close();process.exit(0)})();
