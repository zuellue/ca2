// ca2core transition pass (port of the stepTrans per-cell loops): the radius drift toward the new
// CELL_RADIUS trait (both paths) fused with the stepComposition morph chase (plan path). Spawn/kill
// decisions, P lerps, completion checks and newShape body plans stay in JS. One shared buffer,
// mutated in place. Row: 13 f64 (x, y, radius, mutRate, alive, dstx, dsty, dl, durK, pace, bend,
// dying, hasDst). stat: deaths, (open is the return value).
pub struct Tr { pub cells: Vec<f64>, pub stat: [f64; 4], s0: u64, s1: u64 }
pub static mut TR: Option<Tr> = None;
pub fn tr() -> &'static mut Tr {
    unsafe {
        let s = &mut *std::ptr::addr_of_mut!(TR);
        if s.is_none() { *s = Some(Tr { cells: vec![], stat: [0.0; 4], s0: 1, s1: 2 }); }
        s.as_mut().unwrap()
    }
}
#[cfg(not(feature = "jsrnd"))] fn clamp(v: f64, a: f64, b: f64) -> f64 { v.max(a).min(b) }
#[cfg(feature = "jsrnd")] fn clamp(v: f64, a: f64, b: f64) -> f64 { if v < a { a } else if v > b { b } else { v } } // JS clamp: NaN stays NaN
#[cfg(not(feature = "jsrnd"))] fn fmin(a: f64, b: f64) -> f64 { a.min(b) }
#[cfg(feature = "jsrnd")] fn fmin(a: f64, b: f64) -> f64 { if a.is_nan() || b.is_nan() { f64::NAN } else { a.min(b) } } // Math.min: any NaN -> NaN
#[cfg(not(feature = "jsrnd"))] fn fmax(a: f64, b: f64) -> f64 { a.max(b) }
#[cfg(feature = "jsrnd")] fn fmax(a: f64, b: f64) -> f64 { if a.is_nan() || b.is_nan() { f64::NAN } else { a.max(b) } }
fn hyp(x: f64, y: f64) -> f64 { (x * x + y * y).sqrt() }
#[cfg(feature = "jsrnd")] #[link(wasm_import_module = "env")] extern "C" { fn js_rnd(line: u32) -> f64; }
impl Tr {
    fn r01(&mut self) -> f64 {
        #[cfg(feature = "jsrnd")] { return unsafe { js_rnd(6) }; } // jsrnd spike: the real Math.random stream
        #[allow(unreachable_code)]
        let (mut x, y) = (self.s0, self.s1);
        self.s0 = y; x ^= x << 23; self.s1 = x ^ y ^ (x >> 17) ^ (y >> 26);
        ((self.s1.wrapping_add(y)) >> 11) as f64 * (1.0 / 9007199254740992.0)
    }
    #[allow(clippy::too_many_arguments)]
    pub fn step(&mut self, n: usize, now: f64, dt: f64, t0: f64, dur: f64, cr: f64, plan: bool, s0: f64, s1: f64) -> i64 {
        #[cfg(not(feature = "jsrnd"))] { self.s0 = ((s0 as u64) << 32) | 0x9E3779B9; self.s1 = ((s1 as u64) << 32) | 0x85EBCA6B; for _ in 0..8 { self.r01(); } }
        #[cfg(feature = "jsrnd")] { let _ = (s0, s1); }
        self.stat = [0.0; 4];
        if self.cells.len() < n * 13 { return -1; }
        #[cfg(feature = "jsrnd")] { for i in 0..n { let b = i * 13; if !(self.cells[b].is_finite() && self.cells[b + 1].is_finite()) { return -1; } } } // jsrnd: refuse before any draw/mutation so the JS fallback sees an unshifted stream
        let late = now - t0 > dur * 1.5;
        let mut open = 0i64;
        for i in 0..n {
            let b = i * 13;
            let (mut x, mut y, mut rad, mr, mut alive) = (self.cells[b], self.cells[b + 1], self.cells[b + 2], self.cells[b + 3], self.cells[b + 4]);
            if !(x.is_finite() && y.is_finite()) { return -1; }
            rad += (cr - rad) * fmin(1.0, 0.004 * mr); // radius drift, all cells, both paths
            self.cells[b + 2] = rad;
            if plan && self.cells[b + 12] != 0.0 && alive != 0.0 {
                let (dx, dy) = (self.cells[b + 5] - x, self.cells[b + 6] - y);
                #[cfg(not(feature = "jsrnd"))] let d = hyp(dx, dy);
                #[cfg(feature = "jsrnd")] let d = crate::circles::hypot2(dx, dy); // JS Math.hypot
                let el = now - t0 - self.cells[b + 7];
                if el <= 0.0 { open += 1; } else {
                    let win = fmax(80.0, dur * self.cells[b + 8]);
                    let pr = clamp(el / win, 0.0, 1.0);
                    let kc = 1.0 - (-dt * 3.0 / win).exp();
                    let ease = 0.35 + 0.65 * (pr * std::f64::consts::PI).sin();
                    let k = fmin(1.0, kc * self.cells[b + 9] * ease * 1.31);
                    x += dx * k + (self.r01() - 0.5) * 0.6; y += dy * k + (self.r01() - 0.5) * 0.6;
                    let bend = self.cells[b + 10];
                    if bend != 0.0 { let lat = k * fmin(d, 200.0) * bend * 0.35 * (pr * std::f64::consts::PI).sin();
                        #[cfg(not(feature = "jsrnd"))] let il = 1.0 / if d == 0.0 { 1.0 } else { d };
                        #[cfg(feature = "jsrnd")] let il = 1.0 / if d == 0.0 || d.is_nan() { 1.0 } else { d }; // JS: 1 / (d || 1)
                        x += -dy * il * lat; y += dx * il * lat; }
                    if self.cells[b + 11] != 0.0 && (d < 14.0 || (late && self.r01() < 0.08)) { alive = 0.0; self.stat[0] += 1.0; }
                    else if d > 14.0 { open += 1; }
                }
            }
            self.cells[b] = x; self.cells[b + 1] = y; self.cells[b + 4] = alive;
        }
        open
    }
}
