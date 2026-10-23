// Port of separatorPass / sepDiskHit / sepBodyHit / sepBodyLineHit numeric compute (ca2.js). No DOM, no RNG.
// ABI: sep2_alloc(kind,n)->ptr: 0 params f64[64], 1 segs f64[4*n], 2 cell io f64[16], 3 body f64[2+3*n] (n,bound,x..,y..,r..),
//      4 mask bytes (RGBA copy, u8). Pointers may move after any alloc or memory growth: re-fetch.
static mut PRM: Vec<f64> = Vec::new();
static mut SEGS: Vec<f64> = Vec::new();
static mut CELL: Vec<f64> = Vec::new();
static mut BODY: Vec<f64> = Vec::new();
static mut MASK: Vec<u8> = Vec::new();
// params 16..63: Math.cos/Math.sin(dir*PI/12) table filled by JS (V8 trig, bit-equal to the JS fallback). 0 ms,1 TH,2 CELL_RADIUS,3 boundForce(||0.8 applied by JS),4 boundGap,5 lwHalf=min(LW,1/DD)/2,6 cont.x,7 cont.y,8 cont.w,9 cont.h,10 lay.fs,11 mw,12 mh,13 hasMask,14 nsegs,15 hasSegs
// cell io: 0 x,1 y,2 vx,3 vy,4 radius,5 sepX,6 sepY,7 (unused),8 r (out of phase A)
#[no_mangle] pub extern "C" fn sep2_alloc(kind:usize,n:usize)->*mut u8 {unsafe{match kind{
 0=>{let v=&mut *std::ptr::addr_of_mut!(PRM);v.resize(n,0.);v.as_mut_ptr() as *mut u8}
 1=>{let v=&mut *std::ptr::addr_of_mut!(SEGS);v.resize(n,0.);v.as_mut_ptr() as *mut u8}
 2=>{let v=&mut *std::ptr::addr_of_mut!(CELL);v.resize(n,0.);v.as_mut_ptr() as *mut u8}
 3=>{let v=&mut *std::ptr::addr_of_mut!(BODY);v.resize(n,0.);v.as_mut_ptr() as *mut u8}
 _=>{let v=&mut *std::ptr::addr_of_mut!(MASK);v.resize(n,0);v.as_mut_ptr()}}}}
// V8 Math.hypot (two args): scale by max, Kahan-compensated sum of squares, sqrt, rescale. Plain sqrt(a*a+b*b) was not bit-equal to Math.hypot.
pub(crate) fn hyp(a:f64,b:f64)->f64{
 if a.is_infinite()||b.is_infinite(){return f64::INFINITY}
 if a.is_nan()||b.is_nan(){return f64::NAN}
 let m=a.abs().max(b.abs());if m==0.{return 0.}
 let mut sum=0.;let mut comp=0.;
 for v in [a,b]{let n=v.abs()/m;let summand=n*n-comp;let pre=sum+summand;comp=(pre-sum)-summand;sum=pre;}
 sum.sqrt()*m}
fn hyp_plain(a:f64,b:f64)->f64{(a*a+b*b).sqrt()}
// test-only probes: op 0 hypot(V8 form), 1 hypot plain sqrt form, 2 cos, 3 sin
#[no_mangle] pub extern "C" fn sep2_dbg(op:usize,x:f64,y:f64)->f64{match op{0=>hyp(x,y),1=>hyp_plain(x,y),2=>x.cos(),_=>x.sin()}}
fn clamp(v:f64,a:f64,b:f64)->f64{if v<a{a}else if v>b{b}else{v}}
unsafe fn p(i:usize)->f64{(&*std::ptr::addr_of!(PRM))[i]}
pub(crate) unsafe fn set_body(x:&[f64],y:&[f64],r:&[f64],bound:f64){let b=&mut *std::ptr::addr_of_mut!(BODY);let n=x.len();b.resize(2+3*n,0.);b[0]=n as f64;b[1]=bound;for k in 0..n{b[2+k]=x[k];b[2+n+k]=y[k];b[2+2*n+k]=r[k];}}
unsafe fn disk_hit(x:f64,y:f64,r:f64)->bool{
 if p(13)==0.{return false}
 let m=&*std::ptr::addr_of!(MASK);let mw=p(11);let mh=p(12);
 let x0=0f64.max(((x-r)*0.5).floor());let x1=(mw-1.).min(((x+r)*0.5).ceil());
 let y0=0f64.max(((y-r)*0.5).floor());let y1=(mh-1.).min(((y+r)*0.5).ceil());let rr=(r+1.42)*(r+1.42);
 let mut yy=y0;while yy<=y1{let mut xx=x0;while xx<=x1{
  let dx=xx*2.+1.-x;let dy=yy*2.+1.-y;
  if dx*dx+dy*dy<=rr&&m[((yy*mw+xx) as usize)*4+3]>40{return true}
  xx+=1.;}yy+=1.;}
 false}
unsafe fn body_hit(x:f64,y:f64)->bool{
 let b=&*std::ptr::addr_of!(BODY);let n=b[0] as usize;let bound=b[1];
 if p(13)==0.||!disk_hit(x,y,bound){return false}
 let m=&*std::ptr::addr_of!(MASK);let mw=p(11);let mh=p(12);let ms=p(0);let th=p(1);
 let r=bound+1.42;
 let x0=0f64.max(((x-r)*0.5).floor());let x1=(mw-1.).min(((x+r)*0.5).ceil());
 let y0=0f64.max(((y-r)*0.5).floor());let y1=(mh-1.).min(((y+r)*0.5).ceil());
 let mut yy=y0;while yy<=y1{let mut xx=x0;while xx<=x1{
  if m[((yy*mw+xx) as usize)*4+3]<=40{xx+=1.;continue}
  let mut field=0.;
  for k in 0..n{let bx=b[2+k];let by=b[2+n+k];let br=b[2+2*n+k];
   let dx=0f64.max((xx*2.+1.-x-bx).abs()-1.);let dy=0f64.max((yy*2.+1.-y-by).abs()-1.);
   field+=ms*br*br/(dx*dx+dy*dy+0.0001);}
  if field>th*0.96{return true}
  xx+=1.;}yy+=1.;}
 false}
unsafe fn line_hit(x:f64,y:f64,s:[f64;4])->bool{
 let b=&*std::ptr::addr_of!(BODY);let n=b[0] as usize;let bound=b[1];let ms=p(0);let th=p(1);
 let dx=s[2]-s[0];let dy=s[3]-s[1];let len=hyp(dx,dy);if len==0.{return false}
 let ux=dx/len;let uy=dy/len;let along=(x-s[0])*ux+(y-s[1])*uy;let normal=(x-s[0])*(-uy)+(y-s[1])*ux;
 if normal.abs()>bound+1.||along< -bound||along>len+bound{return false}
 let lo=0f64.max(along-bound-1.);let hi=len.min(along+bound+1.);let cnt=1f64.max((hi-lo).ceil());
 let mut i=0.;while i<=cnt{let t=lo+(hi-lo)*i/cnt;
  let px=s[0]+ux*t-x;let py=s[1]+uy*t-y;let mut field=0.;
  for k in 0..n{let ddx=px-b[2+k];let ddy=py-b[2+n+k];let br=b[2+2*n+k];field+=ms*br*br/(ddx*ddx+ddy*ddy+0.0001);}
  if field>th*0.96{return true}
  i+=1.;}
 false}
#[no_mangle] pub extern "C" fn sep2_disk_hit(x:f64,y:f64,r:f64)->f64{unsafe{if disk_hit(x,y,r){1.}else{0.}}}
#[no_mangle] pub extern "C" fn sep2_body_hit(x:f64,y:f64)->f64{unsafe{if body_hit(x,y){1.}else{0.}}}
#[no_mangle] pub extern "C" fn sep2_line_hit(x:f64,y:f64,s0:f64,s1:f64,s2:f64,s3:f64)->f64{unsafe{if line_hit(x,y,[s0,s1,s2,s3]){1.}else{0.}}}
unsafe fn seg(j:usize)->[f64;4]{let s=&*std::ptr::addr_of!(SEGS);[s[j*4],s[j*4+1],s[j*4+2],s[j*4+3]]}
// Phase A: segment crossing, combined wedge resolution, radius wear. Returns 1 if the cell needs phase B (mask||segs) else 0.
#[no_mangle] pub extern "C" fn sep2_phase_a()->f64{unsafe{
 let c=&mut *std::ptr::addr_of_mut!(CELL);let has=p(15)!=0.;let ns=p(14) as usize;
 let ms=p(0);let th=p(1);let r=c[4]*(ms.max(0.)/th.max(0.001)).sqrt()+p(5);c[8]=r;
 if has&&c[5].is_finite()&&c[6].is_finite(){for j in 0..ns{let es=seg(j);let ex=es[2]-es[0];let ey=es[3]-es[1];let el=hyp(ex,ey);if el==0.{continue}
  let en_x=-ey/el;let en_y=ex/el;let old_d=(c[5]-es[0])*en_x+(c[6]-es[1])*en_y;let new_d=(c[0]-es[0])*en_x+(c[1]-es[1])*en_y;
  if old_d*new_d<0.{let hit_t=old_d/(old_d-new_d);let hx=c[5]+(c[0]-c[5])*hit_t;let hy=c[6]+(c[1]-c[6])*hit_t;
   let along=((hx-es[0])*ex+(hy-es[1])*ey)/(el*el);
   if along>=0.&&along<=1.{let side=if old_d>0.{1.}else{-1.};c[0]=hx+en_x*side*r;c[1]=hy+en_y*side*r;
    let nv=c[2]*en_x+c[3]*en_y;if nv*side<0.{c[2]-=1.7*nv*en_x;c[3]-=1.7*nv*en_y;}}}}}
 let mut pr=0.;
 if has{for _ in 0..3{let mut acx=0.;let mut acy=0.;let mut worst=0.;let mut any=false;
  for j in 0..ns{let sg=seg(j);let ax=sg[2]-sg[0];let ay=sg[3]-sg[1];let l2=ax*ax+ay*ay;
   let t=if l2!=0.{clamp(((c[0]-sg[0])*ax+(c[1]-sg[1])*ay)/l2,0.,1.)}else{0.};
   let px=sg[0]+ax*t;let py=sg[1]+ay*t;let dx=c[0]-px;let dy=c[1]-py;let d=hyp(dx,dy);
   if d<r{let(nx,ny);
    if d<0.001{let mut a=-ay;let mut b=ax;let mut nl=hyp(a,b);if nl==0.{nl=1.}a/=nl;b/=nl;if c[2]*a+c[3]*b<0.{a=-a;b=-b}nx=a;ny=b;}else{nx=dx/d;ny=dy/d;}
    let need=r-d;acx+=nx*need;acy+=ny*need;if need>worst{worst=need}any=true;
    let pr2=need/r;if pr2>pr{pr=pr2}
    let vn=c[2]*nx+c[3]*ny;if vn<0.{c[2]-=vn*1.7*nx;c[3]-=vn*1.7*ny;}}}
  if !any{break}
  let al=hyp(acx,acy);if al<0.001{break}
  let st=al.min(worst+1.);c[0]+=acx/al*st;c[1]+=acy/al*st;}}
 if pr>0.&&c[4]>p(2){c[4]=p(2).max(c[4]-p(3)*pr*2.);}
 if has||p(13)!=0.{1.}else{0.}}}
// Phase B: needs BODY filled by JS sepBody(c) with the post-phase-A radius.
#[no_mangle] pub extern "C" fn sep2_phase_b()->f64{unsafe{
 let c=&mut *std::ptr::addr_of_mut!(CELL);let has=p(15)!=0.;let ns=p(14) as usize;let mask=p(13)!=0.;let r=c[8];
 let bound=(&*std::ptr::addr_of!(BODY))[1];
 if has{for j in 0..ns{let ls=seg(j);if !line_hit(c[0],c[1],ls){continue}
  let lx=ls[2]-ls[0];let ly=ls[3]-ls[1];let ll=hyp(lx,ly);if ll==0.{continue}
  let lnx=-ly/ll;let lny=lx/ll;let signed=(c[0]-ls[0])*lnx+(c[1]-ls[1])*lny;let lside=if signed>=0.{1.}else{-1.};
  let mut travel=0.;let cap=bound*2.+2.;
  while travel<cap&&line_hit(c[0]+lnx*lside*travel,c[1]+lny*lside*travel,ls){travel+=1.}
  if travel<cap{c[0]+=lnx*lside*travel;c[1]+=lny*lside*travel;let lv=c[2]*lnx+c[3]*lny;if lv*lside<0.{c[2]-=1.7*lv*lnx;c[3]-=1.7*lv*lny;}}}}
 if mask&&body_hit(c[0],c[1]){
  let mut found=false;let mut bx=c[0];let mut by=c[1];
  let step=2.;let max_ink=(p(10)*2.).max(r*3.);let gap=0f64.max(p(4));
  let (cx,cy,cw,ch)=(p(6),p(7),p(8),p(9));
  let mut reach=step;
  while reach<=max_ink&&!found{
   for dir in 0..24{let tx=c[0]+p(16+dir*2)*reach;let ty=c[1]+p(17+dir*2)*reach;
    if tx<cx+gap||tx>cx+cw-gap||ty<cy+gap||ty>cy+ch-gap{continue}
    let mut crosses=false;
    if has{for k in 0..ns{let s=seg(k);if line_hit(tx,ty,s){crosses=true;break}
     let iex=s[2]-s[0];let iey=s[3]-s[1];let id0=(c[0]-s[0])*iey-(c[1]-s[1])*iex;let id1=(tx-s[0])*iey-(ty-s[1])*iex;
     if id0*id1<0.{let it=id0/(id0-id1);let ix=c[0]+(tx-c[0])*it;let iy=c[1]+(ty-c[1])*it;let il2=iex*iex+iey*iey;
      let ia=if il2!=0.{((ix-s[0])*iex+(iy-s[1])*iey)/il2}else{-1.};if ia>=0.&&ia<=1.{crosses=true;break}}}}
    if !crosses&&!body_hit(tx,ty){bx=tx;by=ty;found=true;break}}
   reach+=step;}
  if found{let dx=bx-c[0];let dy=by-c[1];let mut len=hyp(dx,dy);if len==0.{len=1.}
   c[0]=bx;c[1]=by;let vn=(c[2]*dx+c[3]*dy)/len;if vn<0.{c[2]-=1.7*vn*dx/len;c[3]-=1.7*vn*dy/len;}}}
 let bg=0f64.max(p(4));let bx0=p(6)+bg;let bx1=p(6)+p(8)-bg;let by0=p(7)+bg;let by1=p(7)+p(9)-bg;
 if c[0]<bx0{c[0]=bx0;if c[2]<0.{c[2]=-c[2]*0.7}}else if c[0]>bx1{c[0]=bx1;if c[2]>0.{c[2]=-c[2]*0.7}}
 if c[1]<by0{c[1]=by0;if c[3]<0.{c[3]=-c[3]*0.7}}else if c[1]>by1{c[1]=by1;if c[3]>0.{c[3]=-c[3]*0.7}}
 0.}}
