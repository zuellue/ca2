#!/usr/bin/env python3
"""Run a bounded local-only comparison. Requires Chrome, no extra packages."""
import subprocess,threading,http.server,socketserver,os,re,json,tempfile
os.chdir(os.path.join(os.path.dirname(__file__),'../..'))
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
with socketserver.TCPServer(('127.0.0.1',0),Quiet) as server,tempfile.TemporaryDirectory() as profile:
 thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
 url='http://127.0.0.1:%d/devtools/card246/compare.html'%server.server_address[1]
 args=['google-chrome','--headless','--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-angle=swiftshader','--user-data-dir='+profile,'--virtual-time-budget=30000','--window-size=1200,1100']
 run=subprocess.run(args+['--dump-dom',url],capture_output=True,text=True,timeout=110)
 match=re.search(r'<script type="application/json" id="evidence">(.*?)</script>',run.stdout,re.S)
 if not match: raise RuntimeError(run.stdout[-2000:]+run.stderr[-2000:])
 result=json.loads(match.group(1));os.makedirs('evidence/card246',exist_ok=True)
 open('evidence/card246/comparison.json','w').write(json.dumps(result,separators=(',',':'))+'\n')
 subprocess.run(args+['--screenshot='+os.path.abspath('evidence/card246/comparison.png'),url],capture_output=True,text=True,timeout=110,check=True)
 server.shutdown()
 print(json.dumps({**result,'cases':[{k:v for k,v in c.items() if k not in ('gpu','cpu')} for c in result['cases']]},indent=2))
