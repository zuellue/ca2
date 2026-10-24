// t-jsrnd-batch-corpus: rndbatch parity gate from the captured boot-sequence corpus
// (card 20261024-373-ca). Runs the SAME checks as t-jsrnd-batch-live.js WITHOUT
// re-capturing from a live page: projected-state BYTE equality + consumed-draw equality,
// here at EVERY stepped frame of the aligned 120-frame boot (the live gate checks the
// final frame). fetchBlocked (fb) is reported as a DIAGNOSTIC only: it counts blocked
// attempts of the preset-sync fetch (ca2.js setInterval(pullG,15000), real-time), which
// lands a frame apart between legs on a ~1s/frame software-rendered boot; it is not sim
// state and is not reproducible run-to-run even for one leg.
// Integrity: the sha256 manifest is verified before any corpus byte is trusted, and each
// frame's stored FNV-1a hash is recomputed from its stored canonical state string.
// Usage: node devtools/t-jsrnd-batch-corpus.js   (exit 0 = CORPUS-BYTE-EQUAL, 1 = fail)
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib');
const OUT=path.join(__dirname,'fixtures','boot-sequence');
function sha256(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}
function fnv(s){var h=0x811c9dc5;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)}return h>>>0}
function load(name){return zlib.gunzipSync(fs.readFileSync(path.join(OUT,name))).toString('utf8').trim().split('\n').map(l=>JSON.parse(l))}
(function(){
  const man=JSON.parse(fs.readFileSync(path.join(OUT,'manifest.json'),'utf8'));
  for(const f of Object.keys(man.files)){
    const h=sha256(path.join(OUT,f));
    if(h!==man.files[f]){console.log(JSON.stringify({gate:'CORPUS-INTEGRITY-FAIL',file:f,expected:man.files[f],actual:h}));process.exit(1);}
  }
  const A=load('legA-jsrnd1.jsonl.gz'),B=load('legB-jsrnd2.jsonl.gz');
  const FR=man.frames;
  if(A.length!==FR||B.length!==FR){console.log(JSON.stringify({gate:'CORPUS-LENGTH-FAIL',framesA:A.length,framesB:B.length,expected:FR}));process.exit(1);}
  for(const leg of [A,B])for(const fr of leg){if(fr.up&&fr.st&&fnv(fr.st)!==fr.h){console.log(JSON.stringify({gate:'CORPUS-HASH-FAIL',frame:fr.frame,stored:fr.h,recomputed:fnv(fr.st)}));process.exit(1);}}
  let firstDiv=-1,divDetail=null;
  for(let i=0;i<FR;i++){
    const a=A[i],b=B[i];
    if(a.frame!==i+1||b.frame!==i+1){firstDiv=i+1;divDetail={why:'frame-index',a:a.frame,b:b.frame};break;}
    if(a.up!==b.up){firstDiv=i+1;divDetail={why:'up-flag',a:a.up,b:b.up};break;}
    if(!a.up)continue;
    if(a.h!==b.h||a.len!==b.len||a.consumed!==b.consumed){
      firstDiv=i+1;divDetail={why:'state',hA:a.h,hB:b.h,lenA:a.len,lenB:b.len,consumedA:a.consumed,consumedB:b.consumed};
      if(a.st&&b.st){let k=0;while(k<Math.min(a.st.length,b.st.length)&&a.st[k]===b.st[k])k++;divDetail.firstByteDiff=k;divDetail.aSlice=a.st.slice(Math.max(0,k-40),k+40);divDetail.bSlice=b.st.slice(Math.max(0,k-40),k+40);}
      break;
    }
  }
  const lastA=A[FR-1],lastB=B[FR-1];
  const eq=firstDiv===-1;
  console.log(JSON.stringify({
    gate:eq?'CORPUS-BYTE-EQUAL':'CORPUS-MISMATCH',
    source:'fixtures/boot-sequence (captured '+man.captured_utc+', '+man.repo+'@'+man.commit+')',
    frameCount:FR,bootFramesA:man.bootFramesA,bootFramesB:man.bootFramesB,
    firstDivergentFrame:firstDiv!==-1?firstDiv:undefined,divergence:divDetail||undefined,
    hA:lastA.h,hB:lastB.h,consumedA:lastA.consumed,consumedB:lastB.consumed,
    cellsA:lastA.cells,cellsB:lastB.cells,foodA:lastA.food,foodB:lastB.food,
    diagFbA:lastA.fb,diagFbB:lastB.fb,rndNA:lastA.rndN,rndNB:lastB.rndN,fillsB:lastB.fills
  }));
  process.exit(eq?0:1);
})();
