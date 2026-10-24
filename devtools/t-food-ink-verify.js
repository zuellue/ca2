// t-food-ink-verify: food ink vs plate colour. Boot the real page twice (default light bg; seeded black bg via localStorage STORE), count food-ink pixels on the scene canvas, screenshot both. usage: node t-food-ink-verify.js <tag>
const {serve,launch}=require('./harness.js');
const tag=process.argv[2]||'post';
(async()=>{const s=await serve(8381);
 async function run(seed){
  const h=await launch(9381,'http://127.0.0.1:8381/index.html',[]);
  if(seed)await h.send('Page.addScriptToEvaluateOnNewDocument',{source:"try{localStorage.setItem('ca2.config',JSON.stringify({v:6,P:{foodColor:'#000000'},bgTarget:[0,0,0],bgIndex:0}))}catch(e){}"}),await h.send('Page.reload'),await h.sleep(1000);
  for(let i=0;i<45&&!(await h.ev('!!window.__ca2'));i++)await h.sleep(1000);
  await h.sleep(12000); // intro + spawn + bg lerp settle
  const r=await h.ev(`(function(){var cs=document.querySelectorAll('canvas'),cv=null,big=0;for(var i=0;i<cs.length;i++){var c2=cs[i];try{var x=c2.getContext('2d');if(x&&c2.width*c2.height>big){big=c2.width*c2.height;cv=c2}}catch(e){}}if(!cv)return 'NOCANVAS';var x=cv.getContext('2d'),d=x.getImageData(0,0,cv.width,cv.height).data,dark=0,light=0,n=d.length/4;for(var i=0;i<d.length;i+=16){var r2=d[i],g=d[i+1],b=d[i+2];if(r2<40&&g<40&&b<40)dark++;if(r2>228&&g>228&&b>228)light++}return JSON.stringify({w:cv.width,h:cv.height,sampled:n/4,dark:dark,light:light})})()`);
  const shot='/tmp/foodink-'+tag+(seed?'-blackbg':'-default')+'.png';await h.shot(shot);
  h.close();return (seed?'blackbg':'default')+' '+r+' shot '+shot;}
 const a=await run(false),b=await run(true);s.close();console.log(tag,a);console.log(tag,b);process.exit(0)})();
