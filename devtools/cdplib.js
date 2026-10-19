const {spawn}=require('child_process');
exports.launch=async(port,url,extra=[])=>{
 const ch=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--autoplay-policy=no-user-gesture-required','--remote-debugging-port='+port,'--window-size=1300,800',...extra,url],{stdio:'ignore'});
 await new Promise(r=>setTimeout(r,2500));
 const tabs=await (await fetch('http://127.0.0.1:'+port+'/json')).json();
 const t=tabs.find(x=>x.type==='page'); const ws=new WebSocket(t.webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
 let id=0,p={},errs=[]; ws.onmessage=m=>{const d=JSON.parse(m.data); if(d.id&&p[d.id]){p[d.id](d.result);delete p[d.id];} if(d.method==='Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception&&d.params.exceptionDetails.exception.description||d.params.exceptionDetails.text);};
 const send=(method,params={})=>new Promise(r=>{p[++id]=r;ws.send(JSON.stringify({id,method,params}));});
 await send('Runtime.enable'); await send('Page.enable');
 const ev=async e=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}); if(r.exceptionDetails) return 'EXC:'+JSON.stringify(r.exceptionDetails).slice(0,300); return r.result.value;};
 return {send,ev,errs,sleep:ms=>new Promise(r=>setTimeout(r,ms)),close:()=>{ch.kill();ws.close();},mouse:(x,y,type='mouseMoved',extra={})=>send('Input.dispatchMouseEvent',Object.assign({type,x,y},extra))};
};
