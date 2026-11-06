// Regression test for foodInk() in test/ca2.js: default food ink must keep >= MIN (default 3) contrast against every grey ground. Fails on main f8ff9d96 (eased flip, 1.06:1 at grey 118); passes with the hard-pick fix on this branch.
// Node test of the REAL foodInk() in test/ca2.js (text-extracted): WCAG contrast of the default food ink against every grey/colour ground.
// Reports the minimum contrast ratio and the grounds where food is effectively invisible (ratio < MIN, default 3). Run: node devtools/t-foodink-contrast.js [file] [MIN]
const fs=require('fs'),file=process.argv[2]||'test/ca2.js',MIN=+process.argv[3]||3,src=fs.readFileSync(file,'utf8');
const a=src.indexOf('function foodInk()');if(a<0){console.log('FAIL foodInk not found in '+file);process.exit(1)}
let d=0,k=src.indexOf('{',a);for(let i=k;i<src.length;i++){if(src[i]=='{')d++;else if(src[i]=='}'&&!--d){k=i;break}}
const body=src.slice(src.indexOf('{',a)+1,k);
const foodInk=new Function('P','bg',body);
const lum=(r,g,b)=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
const cr=(l1,l2)=>(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
let worst={r:99},bad=[];
for(let g=0;g<=255;g++){const ink=foodInk({swFoodColor:0},[g,g,g]),m=/rgb\((\d+),(\d+),(\d+)\)/.exec(ink),r=cr(lum(+m[1],+m[2],+m[3]),lum(g,g,g));
 if(r<worst.r)worst={g,ink,r};if(r<MIN)bad.push(g)}
const ranges=[];for(const g of bad){const l=ranges[ranges.length-1];if(l&&l[1]===g-1)l[1]=g;else ranges.push([g,g])}
console.log('min contrast',worst.r.toFixed(2),'at grey',worst.g,'ink',worst.ink);
console.log(bad.length?'FAIL '+bad.length+' of 256 greys below '+MIN+':1, ranges '+ranges.map(r=>r[0]+'-'+r[1]).join(','):'PASS all greys >= '+MIN+':1');
process.exit(bad.length?1:0);
