// ca2core sim: port of the per-frame cell loop (update/organic/checkSurvival/interact/keepIn/divide/reproduce/joinCluster/fuse,
// hover colour). State is struct-of-arrays in wasm memory; JS packs/unpacks around one call per frame. No DOM.
use std::f64::consts::PI;
#[cfg(feature = "jsrnd")] #[link(wasm_import_module = "env")] extern "C" { fn js_rnd(line: u32) -> f64; }
pub const JSRND: bool = cfg!(feature = "jsrnd");
pub const BST: usize = 2; // side row per cell (jsrnd): popD, life
pub const ST: usize = 24; // f64 per cell
const X: usize = 0; const Y: usize = 1; const VX: usize = 2; const VY: usize = 3; const RAD: usize = 4; const EN: usize = 5; const GENE: usize = 6;
const ALIVE: usize = 7; const MAXS: usize = 8; const SPM: usize = 9; const HOST: usize = 10; const MUT: usize = 11; const SV: usize = 12; const CL: usize = 13;
const SYM: usize = 14; const GSPD: usize = 15; const GAPP: usize = 16; const GBND: usize = 17; const C0: usize = 18; const C1: usize = 19; const C2: usize = 20;
const COMP: usize = 21; const REM: usize = 22; const AGE: usize = 23; // 23: age in ms, packed by JS every frame (juvenile reproduction gate); wasm writes -1 here on eat/fuse = absorbed flag (biomass stayed in a cell, no nutrient pulse)

pub struct Sim {
    pub cells: Vec<f64>, pub n: usize, pub cap: usize,
    pub fx: Vec<f64>, pub fy: Vec<f64>, pub fgone: Vec<f64>, pub nf: usize,
    pub cm_id: Vec<f64>, pub cm: Vec<f64>, // per cluster: vx,vy,x,y,e (stride 5)
    pub p: Vec<f64>, pub out: Vec<f64>,
    s0: u64, s1: u64, live: usize, pub log: Vec<f64>, pub shp: Vec<f64>, pub birth: Vec<f64>, pub dbg: Vec<f64>, t_ms: f64,
}
pub static mut SIM: Option<Sim> = None;
pub fn sim() -> &'static mut Sim {
    unsafe {
        let s = &mut *std::ptr::addr_of_mut!(SIM);
        if s.is_none() { *s = Some(Sim { cells: vec![], n: 0, cap: 0, fx: vec![], fy: vec![], fgone: vec![], nf: 0, cm_id: vec![], cm: vec![], p: vec![0.0; 100], out: vec![0.0; 32], s0: 0x9E3779B97F4A7C15, s1: 0xD1B54A32D192ED03, live: 0, log: Vec::new(), shp: Vec::new(), birth: Vec::new(), dbg: Vec::new(), t_ms: 0.0 }); }
        s.as_mut().unwrap()
    }
}
// param indices
const P_IR: usize = 0; const P_SLOWR: usize = 1; const P_SLOWF: usize = 2; const P_BASEMS: usize = 3; const P_MSVAR: usize = 4; const P_ECR: usize = 5;
const P_SELON: usize = 6; const P_GENOME: usize = 7; const P_SELS: usize = 8; const P_EATMERGE: usize = 9; const P_COH: usize = 10; const P_SYMB: usize = 11;
const P_FEATR: usize = 12; const P_FEV: usize = 13; const P_FGROW: usize = 14; const P_FGAMT: usize = 15; const P_CELLR: usize = 16; const P_FGMAX: usize = 17;
const P_DIVON: usize = 18; const P_DIVAT: usize = 19; const P_UNI: usize = 20; const P_FSHR: usize = 21; const P_BOUND: usize = 22; const P_BZONE: usize = 23;
const P_BFORCE: usize = 24; const P_RESTL: usize = 25; const P_EATRATIO: usize = 26; const P_EATCH: usize = 27; const P_MGENE: usize = 28; const P_MCH: usize = 29;
const P_SYMG: usize = 30; const P_EGAIN: usize = 31; const P_GMIN: usize = 32; const P_GMAX: usize = 33; const P_MINREP: usize = 34; const P_CLMAX: usize = 35;
const P_GMUT: usize = 36; const P_MRR: usize = 37; const P_MBS: usize = 38; const P_ESPD: usize = 39; const P_EAPP: usize = 40; const P_EBND: usize = 41;
const P_ECOL: usize = 42; const P_EC0: usize = 43; const P_MX: usize = 46; const P_MY: usize = 47; const P_MOVER: usize = 48; const P_CX: usize = 49; const P_CY: usize = 50;
const P_CW: usize = 51; const P_CH: usize = 52; const P_RDRAG: usize = 53; const P_CLSEQ: usize = 54; const P_NCM: usize = 55; const P_ONLYINT: usize = 56; // debug: 1 = interact only, 2 = keepIn only (isolation tests; 0 = normal)
const P_BGAP: usize = 57; const P_RMINAGE: usize = 58; const P_REPROCH: usize = 59; // 58: juvenile gate ms, 59: contact birth chance (owner 21 Oct) // boundGap: wall distance for every cell independent of cell r (desktop fix 625f4e8). 44/45 are env.col g/b (P_EC0+1/+2)
// biological constants, formerly hardcoded (owner 21 Oct: every biological parameter is a knob, nothing hardcoded)
const P_CROWD: usize = 60; // checkSurvival crowding tolerance (energy < n * crowdTol)
const P_ORGDIE: usize = 61; const P_ORGGROW: usize = 62; const P_ORGBIRTH: usize = 63; const P_ORGDECAY: usize = 64;
const P_ORGBRAIN: usize = 65; const P_ORGR90: usize = 66; // organic() life/birth/energy deltas (B3/S23 topology stays)
const P_SYMEN: usize = 67; const P_SYMBRK: usize = 68; const P_SYMBRKD: usize = 69; // symbiosis bond feed, whim break, distance break (x span)
const P_DTF: usize = 78; const P_FERATE: usize = 79; // frame dt ms + grazing rate (dots/s per touched dot) - moved off 55/56: those belong to P_NCM/P_ONLYINT, and foodEatRate!=0 read as ONLYINT disabled update()/check_survival() for every cell (divide/graze/shrink/keepIn all dead)
const P_FLEEON: usize = 82; const P_FLEER: usize = 83; const P_FLEEPH: usize = 84; const P_FLEEWB: usize = 85; const P_FLEEJT: usize = 86; const P_FLEEDP: usize = 87; // cursor unease (owner 23 Oct, phonemsg-01M5MP8J6KY6SXEHEN0QSXQ5VP): 82..87 reserved for the cursor behavior, 88..95 belong to the separator
const P_EATDF: usize = 70; const P_FUSEDF: usize = 71; const P_SYMDF: usize = 72; // eat/fuse/pair contact distance (x radii sum)
const P_HABON: usize = 73; const P_HABCAP: usize = 74;
const P_DIVMODE: usize = 75; const P_DIVAGE: usize = 76; const P_DIVEN: usize = 77; // 75: 0 = legacy radius gate, 1 = age+mass; 76: min age ms; 77: min energy // habitat soft birth cap (habitat-gated): over habitatBirthCap x UNIVERSE_SIZE the birth chance scales cap/n, never a hard wall
// out indices
// 0 birth 1 divide 2 eaten 3 merge 4 fuse 5 pair 6 hit 7 oob 8 ate 9 death 10 clusterSeq 11 hovering 12-14 hoverCol 15 n_final

pub const SHS: usize = 12; // shape slots per cell: t, asp, th, wig, wsp, sat, ph, ph2, dir, svx, svy, has
type Shp = [f64; 9];
impl Sim {
    fn get_shape(&self, i: usize) -> Option<Shp> {
        let b = i * SHS; if self.shp[b + 11] == 0.0 { return None; }
        let mut s = [0.0; 9]; s.copy_from_slice(&self.shp[b..b + 9]); Some(s)
    }
    fn put_shape(&mut self, i: usize, s: Shp) { let b = i * SHS; self.shp[b..b + 9].copy_from_slice(&s); self.shp[b + 11] = 1.0; }
    // port of ca2.js newShape(par): body plans round (0) / lobed (2); legacy string (1) converts to lobed
    fn new_shape(&mut self, par: Option<Shp>) -> Shp {
        let mut par = par;
        if let Some(p) = par { if p[0] == 1.0 { par = Some([2.0, 1.0, 1.0, 0.0, p[4], p[5].max(2.0), p[6], p[7], p[8]]); } }
        match par {
            None => {
                let u = self.rnd01();
                if u < 0.35 { let (a, b, c) = (self.rnd(0.0, 6.2832), self.rnd(0.0, 6.2832), self.rnd(0.0, 6.2832)); [0.0, 1.0, 1.0, 0.0, 1.0, 0.0, a, b, c] }
                else { let wsp = self.rnd(0.3, 1.4); let sat = 2.0 + if self.rnd01() < 0.4 { 1.0 } else { 0.0 }; let (a, b, c) = (self.rnd(0.0, 6.2832), self.rnd(0.0, 6.2832), self.rnd(0.0, 6.2832)); [2.0, 1.0, 1.0, 0.0, wsp, sat, a, b, c] }
            }
            Some(p) => {
                let a = self.p[P_GMUT];
                let (ph, ph2) = (self.rnd(0.0, 6.2832), self.rnd(0.0, 6.2832));
                let mut s = [p[0], p[1], p[2], p[3], p[4], p[5], ph, ph2, p[8]];
                if self.rnd01() < a * 0.4 { s[0] = if self.rnd01() < 0.5 { 0.0 } else { 2.0 }; }
                s[1] = clamp(s[1] * (1.0 + self.rnd(-a, a)), 1.15, 7.0); s[2] = clamp(s[2] * (1.0 + self.rnd(-a, a) * 0.6), 0.25, 1.1);
                s[3] = clamp(s[3] + self.rnd(-a, a) * 0.8, 0.0, 1.4); s[4] = clamp(s[4] * (1.0 + self.rnd(-a, a) * 0.5), 0.2, 2.5);
                if s[0] == 0.0 { s[1] = 1.0; s[2] = 1.0; s[3] = 0.0; }
                if s[0] == 1.0 && s[1] < 1.25 { s[1] = 1.3; }
                if s[0] == 2.0 && s[5] == 0.0 { s[5] = 2.0 + if self.rnd01() < 0.4 { 1.0 } else { 0.0 }; }
                s
            }
        }
    }
    fn mix_shape(&mut self, a2: Option<Shp>, b2: Option<Shp>) -> Shp {
        match (a2, b2) {
            (None, Some(b)) => self.new_shape(Some(b)),
            (None, None) => self.new_shape(None),
            (Some(a), None) => self.new_shape(Some(a)),
            (Some(a), Some(b)) => {
                let mut s = self.new_shape(Some(a));
                s[0] = if self.rnd01() < 0.5 { a[0] } else { b[0] }; if s[0] == 1.0 { s[0] = 2.0; }
                s[1] = (a[1] + b[1]) / 2.0; s[2] = (a[2] + b[2]) / 2.0; s[3] = (a[3] + b[3]) / 2.0; s[4] = (a[4] + b[4]) / 2.0; s[5] = a[5].max(b[5]);
                if s[0] == 1.0 && s[1] < 1.25 { s[1] = 1.3; }
                if s[0] == 2.0 && s[5] == 0.0 { s[5] = 2.0; }
                s
            }
        }
    }
}

impl Sim {
    #[cfg_attr(feature = "jsrnd", track_caller)]
    fn rnd01(&mut self) -> f64 {
        #[cfg(feature = "jsrnd")] { return unsafe { js_rnd(core::panic::Location::caller().line()) }; }
        #[allow(unreachable_code)]
        let (mut x, y) = (self.s0, self.s1);
        self.s0 = y; x ^= x << 23; self.s1 = x ^ y ^ (x >> 17) ^ (y >> 26);
        ((self.s1.wrapping_add(y)) >> 11) as f64 * (1.0 / 9007199254740992.0)
    }
    #[cfg_attr(feature = "jsrnd", track_caller)]
    fn rnd(&mut self, a: f64, b: f64) -> f64 { a + self.rnd01() * (b - a) }
    #[cfg_attr(feature = "jsrnd", track_caller)]
    fn rand2d(&mut self) -> (f64, f64) { let a = self.rnd01() * 6.283185307; (a.cos(), a.sin()) }
    fn g(&self, i: usize, f: usize) -> f64 { self.cells[i * ST + f] }
    fn set(&mut self, i: usize, f: usize, v: f64) { self.cells[i * ST + f] = v; }
    fn alive(&self, i: usize) -> bool { self.cells[i * ST + ALIVE] != 0.0 }
}
fn hyp(a: f64, b: f64) -> f64 { (a * a + b * b).sqrt() }
fn clamp(v: f64, a: f64, b: f64) -> f64 { if v < a { a } else if v > b { b } else { v } }
fn lerp(a: f64, b: f64, t: f64) -> f64 { a + (b - a) * t }
fn norm_col(v: [f64; 3]) -> [f64; 3] { let mut s = v[0] + v[1] + v[2]; if s == 0.0 { s = 1.0; } [v[0] / s, v[1] / s, v[2] / s] }

impl Sim {
    fn limit(&mut self, i: usize, m: f64) {
        let (vx, vy) = (self.g(i, VX), self.g(i, VY));
        let s = hyp(vx, vy);
        if s > m && s > 0.0 { self.set(i, VX, vx * (m / s)); self.set(i, VY, vy * (m / s)); }
    }
    fn misfit(&self, i: usize) -> f64 {
        let p = &self.p; let (spd, app, bnd) = (self.g(i, GSPD), self.g(i, GAPP), self.g(i, GBND));
        let mut m = ((spd - p[P_ESPD]).abs() / 1.1 + (app - p[P_EAPP]).abs() + (bnd - p[P_EBND]).abs() / 1.5) / 3.0;
        if p[P_ECOL] != 0.0 {
            let cd = ((self.g(i, C0) - p[P_EC0]).abs() + (self.g(i, C1) - p[P_EC0 + 1]).abs() + (self.g(i, C2) - p[P_EC0 + 2]).abs()) / 2.0;
            m = (m * 3.0 + cd * 1.5) / 4.5;
        }
        m.min(1.0)
    }
    fn organic(&mut self, c: usize, n0: usize) {
        let r = self.p[P_IR];
        let (cx, cy) = (self.g(c, X), self.g(c, Y));
        let mut n = 0; let mut left: Option<f64> = None; let mut right: Option<f64> = None;
        for o in 0..self.n {
            if o == c || !self.alive(o) || self.g(o, REM) != 0.0 { continue; }
            let (ox, oy) = (self.g(o, X), self.g(o, Y));
            let (dx, dy) = (ox - cx, oy - cy);
            if dx * dx + dy * dy < r * r {
                n += 1;
                if ox < cx && left.map_or(true, |l| ox > l) { left = Some(ox); }
                if ox > cx && right.map_or(true, |rr| ox < rr) { right = Some(ox); }
            }
        }
        let _ = n0;
        let alive = self.alive(c);
        let life = if alive { if n < 2 || n > 3 { self.p[P_ORGDIE] } else { self.p[P_ORGGROW] } } else if n == 3 { self.p[P_ORGBIRTH] } else { self.p[P_ORGDECAY] };
        let brain = if n == 2 { self.p[P_ORGBRAIN] } else { 0.0 };
        let r90 = if left.is_some() != right.is_some() { self.p[P_ORGR90] } else { 0.0 };
        let (dx, dy) = self.rand2d();
        let t = life + brain + r90 + self.rnd(-0.1, 0.1);
        let (mut vx, mut vy) = (self.g(c, VX) + dx * t, self.g(c, VY) + dy * t);
        let ms = self.g(c, MAXS);
        let (qx, qy) = self.rand2d();
        vx = lerp(vx, qx * ms, 0.04); vy = lerp(vy, qy * ms, 0.04);
        self.set(c, VX, vx); self.set(c, VY, vy);
        let rd = self.p[P_RDRAG] != 0.0;
        let lim = ms * if rd { 1.0 + self.p[P_RESTL] * 1.5 } else { 1.0 };
        self.limit(c, lim);
    }
    fn count_slots(&self, cl: f64) -> usize { (0..self.n).filter(|&i| self.g(i, REM) == 0.0 && self.g(i, CL) == cl).count() }
    fn live_len(&self) -> usize { self.live }
    fn cm_find(&self, id: f64) -> Option<usize> { self.cm_id.iter().position(|&x| x == id) }
    fn new_kid(&mut self, x: f64, y: f64, gene: f64, mr: f64) -> usize {
        // port of the Cell constructor numeric fields
        if self.n * ST >= self.cells.len() {
            // one-step birth burst overflowed the JS-sized buffer: grow instead of dropping the kid
            // (JS re-reads sim_cap/sim_cells_ptr after every step)
            let ncap = (self.cap * 2).max(self.n + 256);
            self.cap = ncap; self.cells.resize(ncap * ST, 0.0); self.shp.resize(ncap * SHS, 0.0); self.birth.resize(ncap * BST, 0.0);
            if self.n * ST >= self.cells.len() { return usize::MAX; }
        }
        let i = self.n; self.n += 1; self.live += 1;
        let (vdx, vdy, sv, hostility, spm);
        if JSRND {
            // draw order of ca2.js Cell(): rand2D, popD, sv, hostility, speedModifier, g.spd/app/bnd, g.col x3 (discarded: divide/repro override g), newShape(null), life
            let v = self.rand2d(); vdx = v.0; vdy = v.1;
            let popd = 800.0 + self.rnd01() * (1300.0 - 800.0);
            sv = self.rnd(-1.0, 1.0);
            hostility = self.rnd01(); spm = self.rnd(0.7, 2.3);
            for _ in 0..3 { self.rnd01(); } for _ in 0..3 { self.rnd01(); }
            { let s = self.new_shape(None); self.put_shape(i, s); }
            let (cl, clv) = (self.p[96], self.p[97]);
            let life = if cl > 0.0 { (cl * (1.0 + self.rnd(-clv, clv))).max(1.0) } else { 0.0 };
            if self.birth.len() < (i + 1) * BST { self.birth.resize((i + 1) * BST, 0.0); }
            self.birth[i * BST] = popd; self.birth[i * BST + 1] = life;
        } else {
            { let s = self.new_shape(None); self.put_shape(i, s); }
            let v = self.rand2d(); vdx = v.0; vdy = v.1;
            sv = self.rnd(-1.0, 1.0);
            hostility = self.rnd01(); spm = self.rnd(0.7, 2.3);
        }
        let ms = (self.p[P_BASEMS] + sv * self.p[P_MSVAR]).max(0.0);
        let b = i * ST;
        for k in 0..ST { self.cells[b + k] = 0.0; }
        self.cells[b + X] = x; self.cells[b + Y] = y; self.cells[b + VX] = vdx * ms; self.cells[b + VY] = vdy * ms;
        self.cells[b + RAD] = self.p[P_CELLR]; self.cells[b + EN] = 12.0; self.cells[b + GENE] = gene; self.cells[b + ALIVE] = 1.0;
        self.cells[b + MAXS] = ms; self.cells[b + SPM] = spm; self.cells[b + HOST] = hostility; self.cells[b + MUT] = mr; self.cells[b + SV] = sv;
        self.cells[b + SYM] = -1.0; self.cells[b + GSPD] = 1.0; self.cells[b + GAPP] = 0.5; self.cells[b + GBND] = 1.0;
        self.cells[b + C0] = 1.0 / 3.0; self.cells[b + C1] = 1.0 / 3.0; self.cells[b + C2] = 1.0 / 3.0;
        i
    }
    fn mut_genome(&mut self, src: [f64; 6]) -> [f64; 6] {
        let a = self.p[P_GMUT];
        let spd = clamp(src[0] * (1.0 + self.rnd(-a, a)), 0.5, 1.6);
        let app = clamp(src[1] + self.rnd(-a, a), 0.0, 1.0);
        let bnd = clamp(src[2] * (1.0 + self.rnd(-a, a)), 0.5, 2.0);
        let c0 = (src[3] + self.rnd(-a, a) * 0.5).max(0.001); let c1 = (src[4] + self.rnd(-a, a) * 0.5).max(0.001); let c2 = (src[5] + self.rnd(-a, a) * 0.5).max(0.001);
        let c = norm_col([c0, c1, c2]);
        [spd, app, bnd, c[0], c[1], c[2]]
    }
    fn genome(&self, i: usize) -> [f64; 6] { [self.g(i, GSPD), self.g(i, GAPP), self.g(i, GBND), self.g(i, C0), self.g(i, C1), self.g(i, C2)] }
    fn set_genome(&mut self, i: usize, g: [f64; 6]) { self.set(i, GSPD, g[0]); self.set(i, GAPP, g[1]); self.set(i, GBND, g[2]); self.set(i, C0, g[3]); self.set(i, C1, g[4]); self.set(i, C2, g[5]); }
    fn mutate_gene(&mut self, g: f64) -> f64 {
        let r = self.rnd01();
        let a = if r < 0.26 { if self.rnd01() < 0.5 { -1.0 } else { 1.0 } } else if r < 0.9 { if self.rnd01() < 0.5 { -2.0 } else { 2.0 } } else if self.rnd01() < 0.5 { -3.0 } else { 3.0 };
        clamp(g + a, self.p[P_GMIN], self.p[P_GMAX])
    }
    fn speed_of(&self, i: usize) -> f64 {
        (self.p[P_BASEMS] + self.g(i, SV) * self.p[P_MSVAR]).max(0.0) * if self.p[P_GENOME] != 0.0 { self.g(i, GSPD) } else { 1.0 }
    }
    fn divide(&mut self, c: usize) {
        let ang = self.rnd01() * 6.2832;
        let nr = self.p[P_CELLR].max(self.g(c, RAD) * 0.62);
        self.set(c, RAD, nr); let en = self.g(c, EN) / 2.0; self.set(c, EN, en);
        let mr = self.g(c, MUT);
        let gene = if self.rnd(0.0, 100.0) < mr { let g = self.g(c, GENE); self.mutate_gene(g) } else { self.g(c, GENE) };
        // the kid is born inside the plate (owner 22 Oct): the wall owns placement
        let (px, py, pw, ph) = (self.p[P_CX], self.p[P_CY], self.p[P_CW], self.p[P_CH]);
        let (bx0, bx1) = (px + nr, px + pw - nr); let (by0, by1) = (py + nr, py + ph - nr);
        let cx = if bx1 >= bx0 { (self.g(c, X) + ang.cos() * nr).max(bx0).min(bx1) } else { (bx0 + bx1) / 2.0 };
        let cy = if by1 >= by0 { (self.g(c, Y) + ang.sin() * nr).max(by0).min(by1) } else { (by0 + by1) / 2.0 };
        let k = self.new_kid(cx, cy, gene, mr);
        if k == usize::MAX { return; }
        self.set(k, RAD, nr); self.set(k, EN, en);
        let g = self.genome(c); let ng = self.mut_genome(g); self.set_genome(k, ng);
        let ms = self.speed_of(k); self.set(k, MAXS, ms);
        let cl = self.g(c, CL); self.set(k, CL, cl);
        { let ps = self.get_shape(c); let ns = self.new_shape(ps); self.put_shape(k, ns); }
        self.out[0] += 1.0; self.out[1] += 1.0; self.log.extend_from_slice(&[k as f64, c as f64, -1.0, 1.0]);
    }
    fn keep_in(&mut self, c: usize) {
        let (cx, cy, cw, ch) = (self.p[P_CX], self.p[P_CY], self.p[P_CW], self.p[P_CH]);
        let gap = 0f64.max(self.p[P_BGAP]); let r = 0.0; // centre-wall (owner 22 Oct), 1:1 with ca2.js keepIn
        let rfit = 8f64.max(cw.min(ch) / 2.0 - gap); let _ = rfit;
        let bnd = if self.p[P_GENOME] != 0.0 { self.g(c, GBND) } else { 1.0 };
        let z = 0f64.max((self.p[P_BZONE] * bnd).min(cw / 2.5).min(ch / 2.5));
        let f = self.p[P_BFORCE]; let ms = self.g(c, MAXS) + 1.0;
        let (x0, x1, y0, y1) = (cx + r + gap, cx + cw - r - gap, cy + r + gap, cy + ch - r - gap);
        let (mut x, mut y, mut vx, mut vy) = (self.g(c, X), self.g(c, Y), self.g(c, VX), self.g(c, VY));
        let mut d; let mut t; let mut press = 0.0f64;
        d = x - x0; if d < z { t = clamp(1.0 - d / z, 0.0, 1.0); vx += f * t * t * ms * 0.25; if vx < 0.0 { vx *= 1.0 - 0.25 * t; } if t > press { press = t; } }
        d = x1 - x; if d < z { t = clamp(1.0 - d / z, 0.0, 1.0); vx -= f * t * t * ms * 0.25; if vx > 0.0 { vx *= 1.0 - 0.25 * t; } if t > press { press = t; } }
        d = y - y0; if d < z { t = clamp(1.0 - d / z, 0.0, 1.0); vy += f * t * t * ms * 0.25; if vy < 0.0 { vy *= 1.0 - 0.25 * t; } if t > press { press = t; } }
        d = y1 - y; if d < z { t = clamp(1.0 - d / z, 0.0, 1.0); vy -= f * t * t * ms * 0.25; if vy > 0.0 { vy *= 1.0 - 0.25 * t; } if t > press { press = t; } }
        // the wall narrows what presses it (owner 22 Oct): pressed growth wears off toward the base radius
        let rad0 = self.g(c, RAD); let base = self.p[P_CELLR];
        if press > 0.0 && rad0 > base { self.set(c, RAD, base.max(rad0 - f * press * 0.5)); }
        // absolute wall (owner 22 Oct): nothing is ever outside; a moved wall carries the body, a hit reflects.
        let (x0, x1) = if x1 < x0 { let m = (x0 + x1) / 2.0; (m, m) } else { (x0, x1) };
        let (y0, y1) = if y1 < y0 { let m = (y0 + y1) / 2.0; (m, m) } else { (y0, y1) };
        if x < x0 { x = x0; vx = vx.abs() * 0.7; }
        else if x > x1 { x = x1; vx = -vx.abs() * 0.7; }
        if y < y0 { y = y0; vy = vy.abs() * 0.7; }
        else if y > y1 { y = y1; vy = -vy.abs() * 0.7; }
        self.set(c, X, x); self.set(c, Y, y); self.set(c, VX, vx); self.set(c, VY, vy);
    }
    fn update(&mut self, c: usize) {
        self.out[28] += 1.0;
        if !self.alive(c) { return; }
        let (mx, my) = (self.p[P_MX], self.p[P_MY]);
        let dm = hyp(self.g(c, X) - mx, self.g(c, Y) - my);
        let sm = if dm < self.p[P_SLOWR] { self.p[P_SLOWF] } else { 1.0 };
        let (rx, ry) = self.rand2d();
        let (vx, vy) = (self.g(c, VX) + rx * 0.2 * sm, self.g(c, VY) + ry * 0.2 * sm);
        self.set(c, VX, vx); self.set(c, VY, vy);
        let rd = self.p[P_RDRAG] != 0.0;
        let lim = self.g(c, MAXS) * sm * self.g(c, SPM) * if rd { 1.0 + self.p[P_RESTL] * 1.5 } else { 1.0 };
        self.limit(c, lim);
        // cursor unease (owner 23 Oct): a cell under the cursor grows restless, cannot decide, and drifts
        // away slowly. A gentle quadratic push on a slow-wavering escape direction, random hesitation and a
        // light drag - no teleport, no sprint. JS mirror: the flee block in update() (same draws, same order).
        if self.p[P_FLEEON] != 0.0 && self.p[P_MOVER] != 0.0 {
            let fr = self.p[P_FLEER];
            if dm < fr && dm > 1e-9 {
                let t = 1.0 - dm / fr;
                let ph = self.g(c, GENE) * 1.7 + self.g(c, SV) * 13.0;
                let wob = crate::fdm::sin((self.t_ms / 900.0 + ph) % 6.283185307179586) * self.p[P_FLEEWB];
                let ux = (self.g(c, X) - mx) / dm; let uy = (self.g(c, Y) - my) / dm;
                let (ca, sa) = (crate::fdm::cos(wob), crate::fdm::sin(wob));
                let push = self.p[P_FLEEPH] * t * t;
                let jit = self.p[P_FLEEJT] * t;
                let jx = self.rnd01() - 0.5; let jy = self.rnd01() - 0.5;
                let damp = 1.0 - self.p[P_FLEEDP] * t;
                let vx = (self.g(c, VX) + (ux * ca - uy * sa) * push + jx * jit) * damp;
                let vy = (self.g(c, VY) + (ux * sa + uy * ca) * push + jy * jit) * damp;
                self.set(c, VX, vx); self.set(c, VY, vy);
            }
        }
        self.organic(c, 0);
        let (nx, ny) = (self.g(c, X) + self.g(c, VX), self.g(c, Y) + self.g(c, VY));
        self.set(c, X, nx); self.set(c, Y, ny);
        let cl = self.g(c, CL);
        let cmi = if cl != 0.0 && self.p[P_EATMERGE] != 0.0 { self.cm_find(cl) } else { None };
        let mut en = self.g(c, EN) - self.p[P_ECR] * if cmi.is_some() { 0.85 } else { 1.0 };
        if self.p[P_SELON] != 0.0 && self.p[P_GENOME] != 0.0 {
            self.set(c, EN, en);
            let mf = self.misfit(c); en -= self.p[P_SELS] * mf * 0.05;
            if self.rnd01() < self.p[P_SELS] * 0.005 * mf.powf(1.5) { self.set(c, ALIVE, 0.0); self.out[20] += 1.0; }
        }
        if en <= 0.0 { self.set(c, ALIVE, 0.0); self.out[21] += 1.0; }
        self.set(c, EN, en);
        if let Some(k) = cmi {
            let (cvx, cvy, cxx, cyy, ce) = (self.cm[k * 5], self.cm[k * 5 + 1], self.cm[k * 5 + 2], self.cm[k * 5 + 3], self.cm[k * 5 + 4]);
            let ch = self.p[P_COH];
            let mut vx = lerp(self.g(c, VX), cvx, ch); let mut vy = lerp(self.g(c, VY), cvy, ch);
            vx += (cxx - self.g(c, X)) * 0.01 * ch; vy += (cyy - self.g(c, Y)) * 0.01 * ch;
            self.set(c, VX, vx); self.set(c, VY, vy);
            let e = self.g(c, EN); self.set(c, EN, e + (ce - e) * 0.05);
        }
        // symbiosis
        let sp_raw = self.g(c, SYM);
        if self.p[P_SYMB] != 0.0 {
            if sp_raw >= 0.0 {
                let sp = sp_raw as usize;
                let drop = !self.alive(sp) || self.g(sp, SYM) != c as f64 || self.rnd01() < self.p[P_SYMBRK];
                if drop {
                    if self.alive(sp) && self.g(sp, SYM) == c as f64 { self.set(sp, SYM, -1.0); }
                    self.set(c, SYM, -1.0);
                } else {
                    let (sdx, sdy) = (self.g(sp, X) - self.g(c, X), self.g(sp, Y) - self.g(c, Y));
                    let mut sdd = hyp(sdx, sdy); if sdd == 0.0 { sdd = 1.0; }
                    let sw = (self.g(c, RAD) + self.g(sp, RAD)) * 1.4;
                    if sdd > sw * self.p[P_SYMBRKD] { self.set(sp, SYM, -1.0); self.set(c, SYM, -1.0); }
                    else {
                        let coh2 = self.p[P_COH] * 0.25;
                        let mut vx = lerp(self.g(c, VX), self.g(sp, VX), coh2); let mut vy = lerp(self.g(c, VY), self.g(sp, VY), coh2);
                        vx += sdx / sdd * (sdd - sw) * 0.004; vy += sdy / sdd * (sdd - sw) * 0.004;
                        self.set(c, VX, vx); self.set(c, VY, vy);
                        let e = self.g(c, EN); self.set(c, EN, e + self.p[P_SYMEN]);
                    }
                }
            }
        } else if sp_raw >= 0.0 { self.set(c, SYM, -1.0); }
        // food
        let genome = self.p[P_GENOME] != 0.0;
        let reach = if genome { self.g(c, RAD) * (2.0 + 6.0 * self.g(c, GAPP)) } else { 0.0 };
        let (mut best_d, mut bx, mut by) = (1e9f64, 0.0, 0.0);
        let eat_r = self.p[P_FEATR];
        let _crad0 = self.g(c, RAD); // JS reads c.radius live inside the loop (an eat grows it); eating range reaches from the body EDGE inward (owner 21 Oct: cells do not eat)
        let (px, py) = (self.g(c, X), self.g(c, Y));
        for f in (0..self.nf).rev() {
            if self.fgone[f] != 0.0 { continue; }
            let fd = hyp(px - self.fx[f], py - self.fy[f]);
            if fd >= eat_r && fd < reach && fd < best_d { best_d = fd; bx = self.fx[f]; by = self.fy[f]; }
            if fd < self.g(c, RAD) + eat_r && self.rnd01() < 1.0 - (-self.p[P_DTF] * self.p[P_FERATE] / 1000.0).exp() { // grazing rate, matches the JS fallback
                let e = self.g(c, EN); self.set(c, EN, e + self.p[P_FEV]);
                self.fgone[f] = 1.0; self.out[8] += 1.0;
                if self.p[P_FGROW] != 0.0 { let r = (self.g(c, RAD) + self.p[P_FGAMT]).min(self.p[P_CELLR] * self.p[P_FGMAX]); self.set(c, RAD, r); }
            }
        }
        if reach != 0.0 && best_d < 1e9 {
            let k = 0.5 * self.g(c, GAPP) * (self.g(c, MAXS) * 0.1 + 0.2);
            let vx = self.g(c, VX) + (bx - self.g(c, X)) / best_d * k; let vy = self.g(c, VY) + (by - self.g(c, Y)) / best_d * k;
            self.set(c, VX, vx); self.set(c, VY, vy);
        }
        let len = self.live_len();
        if self.p[P_DIVON] != 0.0 && self.p[P_FGROW] != 0.0 && (len as f64) < 60f64.max(self.p[P_UNI] * 4.0) && self.g(c, EN) > 1.0 {
            let gate = if self.p[P_DIVMODE] != 0.0 { self.g(c, AGE) >= self.p[P_DIVAGE] && self.g(c, EN) >= self.p[P_DIVEN] } else { self.g(c, RAD) >= self.p[P_CELLR] * self.p[P_DIVAT] };
            if gate { self.divide(c); }
        }
        if self.p[P_FGROW] != 0.0 && self.g(c, RAD) > self.p[P_CELLR] { let r = self.p[P_CELLR].max(self.g(c, RAD) - self.p[P_FSHR]); self.set(c, RAD, r); }
        if self.p[P_BOUND] != 0.0 { self.keep_in(c); }
        else {
            let (x, y) = (self.g(c, X), self.g(c, Y));
            if x < self.p[P_CX] || x > self.p[P_CX] + self.p[P_CW] || y < self.p[P_CY] || y > self.p[P_CY] + self.p[P_CH] { self.set(c, ALIVE, 0.0); self.out[7] += 1.0; }
        }
    }
    fn check_survival(&mut self, c: usize) {
        let gene = self.g(c, GENE);
        if gene <= self.p[P_GMIN] || gene >= self.p[P_GMAX] { self.set(c, ALIVE, 0.0); self.out[23] += 1.0; }
        let r = self.p[P_IR]; let (cx, cy) = (self.g(c, X), self.g(c, Y)); let mut n = 0;
        for o in 0..self.n { if o != c && self.alive(o) && self.g(o, REM) == 0.0 && hyp(cx - self.g(o, X), cy - self.g(o, Y)) < r { n += 1; } }
        if self.g(c, EN) < n as f64 * self.p[P_CROWD] { self.set(c, ALIVE, 0.0); self.out[22] += 1.0; }
    }
    fn join_cluster(&mut self, a: usize, b: usize) {
        let (acl, bcl) = (self.g(a, CL), self.g(b, CL)); let cmax = self.p[P_CLMAX] as usize;
        if acl != 0.0 && bcl != 0.0 {
            if acl == bcl { return; }
            if self.count_slots(acl) + self.count_slots(bcl) > cmax { return; }
            for i in 0..self.n { if self.g(i, REM) == 0.0 && self.g(i, CL) == bcl { self.set(i, CL, acl); } }
        } else if acl != 0.0 { if self.count_slots(acl) >= cmax { return; } self.set(b, CL, acl); }
        else if bcl != 0.0 { if self.count_slots(bcl) >= cmax { return; } self.set(a, CL, bcl); }
        else { self.p[P_CLSEQ] += 1.0; let id = self.p[P_CLSEQ]; self.set(a, CL, id); self.set(b, CL, id); }
        self.out[3] += 1.0;
    }
    fn fuse(&mut self, a: usize, b: usize) {
        let (big, sm) = if self.g(a, RAD) >= self.g(b, RAD) { (a, b) } else { (b, a) };
        let (rb, rs) = (self.g(big, RAD), self.g(sm, RAD));
        let r = ((rb * rb + rs * rs).sqrt() * 0.92).min(self.p[P_CELLR] * self.p[P_FGMAX] * 1.2); self.set(big, RAD, r);
        let e = (self.g(big, EN) + self.g(sm, EN)) * 0.85; self.set(big, EN, e);
        let ge = clamp(((self.g(big, GENE) + self.g(sm, GENE)) / 2.0 + 0.5).floor(), self.p[P_GMIN], self.p[P_GMAX]); self.set(big, GENE, ge);
        let (g1, g2) = (self.genome(big), self.genome(sm));
        let mix = norm_col([(g1[3] + g2[3]) / 2.0, (g1[4] + g2[4]) / 2.0, (g1[5] + g2[5]) / 2.0]);
        self.set_genome(big, [(g1[0] + g2[0]) / 2.0, (g1[1] + g2[1]) / 2.0, (g1[2] + g2[2]) / 2.0, mix[0], mix[1], mix[2]]);
        let comp = self.g(big, COMP).max(1.0) + self.g(sm, COMP).max(1.0); self.set(big, COMP, comp);
        let spm = clamp(self.g(big, SPM) / 1.25, 0.2, 3.0); self.set(big, SPM, spm);
        let bs = self.g(big, SYM); if bs >= 0.0 && bs as usize != sm { self.set(bs as usize, SYM, -1.0); }
        let ss = self.g(sm, SYM); if ss >= 0.0 && ss as usize != big { self.set(ss as usize, SYM, -1.0); }
        self.set(big, SYM, -1.0); self.set(sm, SYM, -1.0); self.set(sm, ALIVE, 0.0); self.set(sm, AGE, -1.0); // AGE=-1: absorbed
        { let (sa, sb) = (self.get_shape(big), self.get_shape(sm)); let ns = self.mix_shape(sa, sb); self.put_shape(big, ns); }
        self.out[4] += 1.0; self.log.extend_from_slice(&[big as f64, sm as f64, -1.0, 3.0]);
    }
    fn reproduce(&mut self, a: usize, b: usize) {
        let len = self.live_len() as f64;
        if len < self.p[P_UNI] * 4.0 && self.g(a, HOST) < 0.6 && self.g(b, HOST) < 0.6 {
            let cost = self.p[P_MINREP] / 2.0 + 1.0;
            let (ea, eb) = (self.g(a, EN) - cost, self.g(b, EN) - cost); self.set(a, EN, ea); self.set(b, EN, eb);
            let mut ng = ((self.g(a, GENE) + self.g(b, GENE)) / 2.0).trunc();
            let mrate = self.g(a, MUT);
            if self.rnd(0.0, 100.0) < mrate { ng = self.mutate_gene(ng); }
            let range = self.p[P_MRR];
            let nm = clamp(mrate + self.rnd(-range, range), 0.5, 20.0);
            let (rx, ry) = self.rand2d();
            self.out[0] += 1.0;
            let ra = self.g(a, RAD);
            let k = self.new_kid((self.g(a, X) + self.g(b, X)) / 2.0 + rx * ra, (self.g(a, Y) + self.g(b, Y)) / 2.0 + ry * ra, ng, nm);
            if k == usize::MAX { return; }
            let (ga, gb) = (self.genome(a), self.genome(b));
            let mixc = norm_col([(ga[3] + gb[3]) / 2.0, (ga[4] + gb[4]) / 2.0, (ga[5] + gb[5]) / 2.0]);
            let mixg = [(ga[0] + gb[0]) / 2.0, (ga[1] + gb[1]) / 2.0, (ga[2] + gb[2]) / 2.0, mixc[0], mixc[1], mixc[2]];
            let ng2 = self.mut_genome(mixg); self.set_genome(k, ng2);
            let ms = self.speed_of(k); self.set(k, MAXS, ms);
            { let (sa, sb) = (self.get_shape(a), self.get_shape(b)); let ns = self.mix_shape(sa, sb); self.put_shape(k, ns); }
            self.log.extend_from_slice(&[k as f64, a as f64, b as f64, 2.0]);
        }
    }
    fn interact(&mut self, a: usize, b: usize) {
        if a == b || !self.alive(a) || !self.alive(b) { return; }
        let (dx, dy) = (self.g(b, X) - self.g(a, X), self.g(b, Y) - self.g(a, Y));
        let dist = hyp(dx, dy);
        let ir = self.p[P_IR];
        if dist >= ir { return; }
        let (ra, rb) = (self.g(a, RAD), self.g(b, RAD));
        if self.p[P_EATMERGE] != 0.0 && dist < (ra + rb) * self.p[P_EATDF] {
            let (big, sm) = if ra >= rb { (a, b) } else { (b, a) };
            let ratio = self.g(big, RAD) / self.g(sm, RAD).max(0.01);
            if ratio >= self.p[P_EATRATIO] {
                if self.rnd01() < self.p[P_EATCH] && (self.g(big, CL) == 0.0 || self.g(big, CL) != self.g(sm, CL)) {
                    let (rbg, rsm) = (self.g(big, RAD), self.g(sm, RAD));
                    let r = (rbg * rbg + 0.5 * rsm * rsm).sqrt().min(self.p[P_CELLR] * self.p[P_FGMAX] * 1.2); self.set(big, RAD, r);
                    let e = self.g(big, EN) + self.g(sm, EN) * 0.6 + 1.0; self.set(big, EN, e);
                    self.set(sm, ALIVE, 0.0); self.set(sm, AGE, -1.0); self.out[2] += 1.0; return; // AGE=-1: absorbed
                }
            } else if (self.g(a, GENE) - self.g(b, GENE)).abs() <= self.p[P_MGENE] && self.rnd01() < self.p[P_MCH] { self.join_cluster(a, b); }
        }
        let (ra, rb) = (self.g(a, RAD), self.g(b, RAD));
        if self.p[P_SYMG] != 0.0 && dist < (ra + rb) * self.p[P_FUSEDF] && (self.g(a, GENE) - self.g(b, GENE)).abs() <= self.p[P_MGENE] && self.rnd01() < self.p[P_MCH] * 0.3 { self.fuse(a, b); return; }
        if self.p[P_SYMB] != 0.0 && self.g(a, SYM) < 0.0 && self.g(b, SYM) < 0.0 && dist < (ra + rb) * self.p[P_SYMDF] && self.rnd01() < self.p[P_MCH] * 0.5 {
            self.set(a, SYM, b as f64); self.set(b, SYM, a as f64); self.out[5] += 1.0;
        }
        let infl = 1.0 + (0.0 - 1.0) * (dist - 0.0) / (ir - 0.0);
        let (ga, gb) = (self.g(a, GENE), self.g(b, GENE));
        let gc = (infl * (gb - ga) * 0.1).trunc();
        let et = self.p[P_EGAIN] * infl * (1.0 - (ga - gb).abs() / (self.p[P_GMAX] - self.p[P_GMIN]));
        let (ea, eb) = (self.g(a, EN) + et, self.g(b, EN) - et); self.set(a, EN, ea); self.set(b, EN, eb);
        let (gmin, gmax) = (self.p[P_GMIN], self.p[P_GMAX]);
        self.set(a, GENE, clamp(ga + gc, gmin, gmax)); self.set(b, GENE, clamp(gb - gc, gmin, gmax));
        let host = self.g(a, HOST);
        if host > 0.5 { let l = if dist != 0.0 { dist } else { 1.0 }; let vx = self.g(a, VX) + (-dx / l) * 0.05 * host; let vy = self.g(a, VY) + (-dy / l) * 0.05 * host; self.set(a, VX, vx); self.set(a, VY, vy); }
        if dist < ra + rb { self.out[6] += 1.0; }
        let capf = if self.p[P_HABON] > 0.5 && self.p[P_HABCAP] > 0.0 { let cap = self.p[P_HABCAP] * self.p[P_UNI]; let n = self.n as f64; if n > cap { cap / n } else { 1.0 } } else { 1.0 };
        if dist < ra + rb && self.rnd01() < self.p[P_REPROCH] * capf && self.g(a, EN) > self.p[P_MINREP] && self.g(b, EN) > self.p[P_MINREP] && self.g(a, AGE) >= self.p[P_RMINAGE] && self.g(b, AGE) >= self.p[P_RMINAGE] { self.reproduce(a, b); } // juveniles do not reproduce: newborns overlap their parents and ungated contact births chained into rows (owner 21 Oct)
        let nl = if dist != 0.0 { dist } else { 1.0 };
        let (nx, ny) = (dx / nl, dy / nl); let sep = (ra + rb - dist) * 0.5;
        self.set(a, X, self.g(a, X) - nx * sep); self.set(a, Y, self.g(a, Y) - ny * sep);
        self.set(b, X, self.g(b, X) + nx * sep); self.set(b, Y, self.g(b, Y) + ny * sep);
        let (avx, avy, bvx, bvy) = (self.g(a, VX), self.g(a, VY), self.g(b, VX), self.g(b, VY));
        let ad = avx * nx + avy * ny; let bd = bvx * nx + bvy * ny;
        let (r1x, r1y) = self.rand2d(); let (r2x, r2y) = self.rand2d();
        self.set(a, VX, lerp(avx, avx - nx * 2.0 * ad, 0.8) + r1x * 0.3); self.set(a, VY, lerp(avy, avy - ny * 2.0 * ad, 0.8) + r1y * 0.3);
        self.set(b, VX, lerp(bvx, bvx - nx * 2.0 * bd, 0.8) + r2x * 0.3); self.set(b, VY, lerp(bvy, bvy - ny * 2.0 * bd, 0.8) + r2y * 0.3);
    }
    pub fn step(&mut self, s0: f64, s1: f64) {
        self.s0 = (s0 as u64) << 32 | 0x9E3779B9; self.s1 = (s1 as u64) << 32 | 0x85EBCA6B;
        self.t_ms += self.p[P_DTF]; // cursor-unease clock, mirrors fleeT += frameDtf in the JS frame loop
        for k in 0..20 { self.out[k] = 0.0; } // 20-23 are cumulative kill-reason diagnostics, not per-step
        let n0 = self.n; self.live = n0; self.log.clear();
        let ccount = if self.p[80] != 0.0 { self.cluster_state(n0) } else { -1.0 };
        let (mx, my, over) = (self.p[P_MX], self.p[P_MY], self.p[P_MOVER] != 0.0);
        let (cx, cy, cw, ch) = (self.p[P_CX], self.p[P_CY], self.p[P_CW], self.p[P_CH]);
        let mut hov_i: f64 = -1.0; let mut hovering = false; let mut hc = [255.0f64, 255.0, 255.0];
        self.out[30] = -1.0; self.out[28] = 0.0;
        for i in (0..n0).rev() {
            self.out[30] = i as f64;
            let oi = self.p[P_ONLYINT] != 0.0;
            if self.dbg.len() < n0 * 4 { self.dbg.resize(n0 * 4, 0.0); }
            self.dbg[i * 4] = self.g(i, EN);
            if !oi { self.update(i); self.check_survival(i); }
            self.dbg[i * 4 + 1] = self.g(i, EN);
            let (x, y, rad) = (self.g(i, X), self.g(i, Y), self.g(i, RAD));
            if over && hyp(mx - x, my - y) < rad && x > cx && x < cx + cw && y > cy && y < cy + ch {
                hovering = true; hov_i = i as f64;
                let (mut r, mut g, mut b) = (0.0, 0.0, 0.0);
                let genome = self.p[P_GENOME] != 0.0;
                for j in 0..self.n {
                    if !self.alive(j) || self.g(j, REM) != 0.0 { continue; }
                    let d = hyp(mx - self.g(j, X), my - self.g(j, Y));
                    let mut inf = self.p[P_MBS] * rad * rad / (d * d + 0.0001); inf *= inf;
                    if genome { r += inf * self.g(j, C0); g += inf * self.g(j, C1); b += inf * self.g(j, C2); }
                    else { let ge = self.g(j, GENE); if ge > 2.0 { r += inf; } else if ge < -2.0 { g += inf; } else { b += inf; } }
                }
                let t = r + g + b; if t > 0.0 { r /= t; g /= t; b /= t; }
                hc = [r * 255.0, g * 255.0, b * 255.0];
            }
            if self.p[P_ONLYINT] != 2.0 { for k in (0..i).rev() { self.interact(i, k); } }
            if self.p[P_RDRAG] != 0.0 && self.alive(i) {
                let ms2 = (self.g(i, MAXS) + 1.0) * self.p[P_RESTL];
                let (a1, a2) = (self.rnd01(), self.rnd01());
                self.set(i, VX, self.g(i, VX) + (a1 - 0.5) * ms2 * 2.0); self.set(i, VY, self.g(i, VY) + (a2 - 0.5) * ms2 * 2.0);
            }
            self.dbg[i * 4 + 2] = self.g(i, EN);
            if self.p[P_BOUND] != 0.0 && self.p[P_ONLYINT] != 1.0 && self.alive(i) { self.keep_in(i); }
            self.dbg[i * 4 + 3] = self.g(i, EN);
            if !self.alive(i) { self.out[9] += 1.0; self.set(i, REM, 1.0); self.live -= 1; }
        }
        self.out[10] = self.p[P_CLSEQ]; self.out[11] = if hovering { 1.0 } else { 0.0 };
        self.out[12] = hc[0]; self.out[13] = hc[1]; self.out[14] = hc[2]; self.out[15] = self.n as f64; self.out[16] = hov_i; self.out[17] = self.log.len() as f64; self.out[18] = ccount;
        let _ = PI;
    }
}

impl Sim {
    pub fn seed_for_test(&mut self, seed: f64) { self.s0 = (seed as u64).wrapping_mul(0x9E3779B97F4A7C15) | 1; self.s1 = (seed as u64) ^ 0xD1B54A32D192ED03; for _ in 0..4 { self.rnd01(); } }
    pub fn new_shape_pub(&mut self, p: Option<Shp>) -> Shp { self.new_shape(p) }
    pub fn mix_shape_pub(&mut self, a: Option<Shp>, b: Option<Shp>) -> Shp { self.mix_shape(a, b) }
}

impl Sim {
    // port of the JS "cluster state" block: per-cluster mean motion/energy, a cluster of one dissolves, members leave on a whim (p[80]=1 enables it)
    fn cluster_state(&mut self, n0: usize) -> f64 {
        self.cm_id.clear(); self.cm.clear();
        if self.p[P_EATMERGE] == 0.0 { for i in 0..n0 { self.set(i, CL, 0.0); } return 0.0; }
        let mut acc: Vec<[f64; 7]> = Vec::new(); // id, n, vx, vy, x, y, e
        for i in 0..n0 {
            let cl = self.g(i, CL); if cl == 0.0 { continue; }
            let k = match acc.iter().position(|a| a[0] == cl) { Some(k) => k, None => { acc.push([cl, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]); acc.len() - 1 } };
            let (vx, vy, x, y, e) = (self.g(i, VX), self.g(i, VY), self.g(i, X), self.g(i, Y), self.g(i, EN));
            let a = &mut acc[k]; a[1] += 1.0; a[2] += vx; a[3] += vy; a[4] += x; a[5] += y; a[6] += e;
        }
        acc.sort_by(|a, b| a[0].partial_cmp(&b[0]).unwrap());
        for a in &acc { self.cm_id.push(a[0]); self.cm.extend_from_slice(&[a[2] / a[1], a[3] / a[1], a[4] / a[1], a[5] / a[1], a[6] / a[1]]); }
        // dissolve rolls use a side stream (as the JS flow did with Math.random) so the main interact/update stream order is unchanged
        let (sv0, sv1) = (self.s0, self.s1); self.s0 = sv0 ^ 0xD1B54A32D192ED03; self.s1 = sv1 ^ 0x8CB92BA72F3D8DD7;
        for i in 0..n0 {
            let cl = self.g(i, CL); if cl == 0.0 { continue; }
            let cnt = acc.iter().find(|a| a[0] == cl).map_or(0.0, |a| a[1]);
            if (cnt < 2.0 && self.p[81] != 2.0) || self.rnd01() < (if self.p[81] != 0.0 { 0.0 } else { 0.0005 }) { self.set(i, CL, 0.0); }
        }
        self.s0 = sv0; self.s1 = sv1;
        acc.len() as f64
    }
}
