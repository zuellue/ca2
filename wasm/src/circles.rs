// circles.rs: parasiteCircles overlay (glyph-circle belief) + parasite wing geometry, ported from ca2.js.
// Own buffers/exports, no shared slots. JS keeps DOM/canvas drawing, RNG (Math.random values are passed in) and the JS fallback.
// Math.hypot is reproduced with V8's algorithm (max-scaled Kahan sum) so results are bit-exact vs node/Chrome.
static mut CB: Vec<f64> = Vec::new(); // cells: x y alive cl
static mut KB: Vec<f64> = Vec::new(); // circles: x y r kid
static mut PB: Vec<f64> = Vec::new(); // parasites, PC_PF fields
static mut WB: Vec<f64> = Vec::new(); // wings, WG_IN in / WG_OUT out

const PC_PF: usize = 10; // in: x y host curKid ox oy ph r0 r1 r2 ; out: x y circIdx ox oy ph
const WG_IN: usize = 14; // x y hostAlive hx hy h px py fx fy sp fp ph (+pad)
const WG_OUT: usize = 14;

fn hypot2(a: f64, b: f64) -> f64 {
    let (x, y) = (a.abs(), b.abs());
    if x.is_nan() || y.is_nan() { if x.is_infinite() || y.is_infinite() { return f64::INFINITY; } return f64::NAN; }
    let max = if x > y { x } else { y };
    if max == 0.0 { return 0.0; }
    if max.is_infinite() { return f64::INFINITY; }
    let mut sum = 0.0f64; let mut comp = 0.0f64;
    for v in [x, y] { let n = v / max; let s = n * n - comp; let pre = sum + s; comp = (pre - sum) - s; sum = pre; }
    sum.sqrt() * max
}

#[no_mangle]
pub extern "C" fn pc_cells(n: usize) -> *mut f64 { unsafe { let b = &mut *std::ptr::addr_of_mut!(CB); b.resize(n * 4 + 1, 0.0); b.as_mut_ptr() } }
#[no_mangle]
pub extern "C" fn pc_circ(n: usize) -> *mut f64 { unsafe { let b = &mut *std::ptr::addr_of_mut!(KB); b.resize(n * 4 + 1, 0.0); b.as_mut_ptr() } }
#[no_mangle]
pub extern "C" fn pc_par(n: usize) -> *mut f64 { unsafe { let b = &mut *std::ptr::addr_of_mut!(PB); b.resize(n * PC_PF + 1, 0.0); b.as_mut_ptr() } }

// One overlay pass (the enabled branch of parasiteCircles). Returns 0, or -1 on a buffer-size error (caller falls back to JS).
#[no_mangle]
pub extern "C" fn pc_run(nc: usize, nk: usize, m: usize, cx: f64, cy: f64, cw: f64, ch: f64, tt: f64, nv: f64, sight: f64) -> i32 {
    unsafe {
        let (cb, kb, pb) = (&*std::ptr::addr_of!(CB), &*std::ptr::addr_of!(KB), &mut *std::ptr::addr_of_mut!(PB));
        if cb.len() < nc * 4 || kb.len() < nk * 4 || pb.len() < m * PC_PF { return -1; }
        let clamp = |v: f64, a: f64, b: f64| if v < a { a } else if v > b { b } else { v };
        let mut cand: Vec<usize> = Vec::new();
        for i in 0..nk {
            let (x, y, r) = (kb[i * 4], kb[i * 4 + 1], kb[i * 4 + 2]);
            let nx = clamp(x, cx, cx + cw); let ny = clamp(y, cy, cy + ch);
            if hypot2(x - nx, y - ny) < r { cand.push(i); }
        }
        let sight2 = sight * sight;
        for i in 0..m {
            let o = i * PC_PF;
            let (mut px, mut py) = (pb[o], pb[o + 1]);
            let (host, cur_kid, ox, oy, mut ph) = (pb[o + 2], pb[o + 3], pb[o + 4], pb[o + 5], pb[o + 6]);
            let (r0, r1, r2) = (pb[o + 7], pb[o + 8], pb[o + 9]);
            let mut circ: i64 = -1; // index into circles, -1 none
            let nan = f64::NAN;
            if host != 0.0 { continue_out(pb, o, px, py, -1, nan, nan, ph); continue; }
            if cur_kid >= 0.0 { for &j in &cand { if kb[j * 4 + 3] == cur_kid { circ = j as i64; break; } } }
            let mut bd = sight2; let mut best = false;
            for j in 0..nc {
                if cb[j * 4 + 2] == 0.0 { continue; }
                let dx = cb[j * 4] - px; let dy = cb[j * 4 + 1] - py;
                let mut d = dx * dx + dy * dy;
                if cb[j * 4 + 3] != 0.0 { d *= 0.5; }
                if d < bd { bd = d; best = true; }
            }
            let mut bcd = sight2; let mut bc: i64 = -1;
            for &j in &cand { let dx = kb[j * 4] - px; let dy = kb[j * 4 + 1] - py; let dd = dx * dx + dy * dy; if dd < bcd { bcd = dd; bc = j as i64; } }
            if circ < 0 && bc >= 0 && bcd < bd { circ = bc; }
            else if circ >= 0 && best {
                let j = circ as usize; let dx = kb[j * 4] - px; let dy = kb[j * 4 + 1] - py;
                if bd < dx * dx + dy * dy { circ = -1; }
            }
            if circ < 0 { continue_out(pb, o, px, py, -1, nan, nan, ph); continue; }
            if !ox.is_nan() { px = ox; py = oy; }
            if ph == 0.0 { ph = r0 * 6.28; }
            let j = circ as usize; let (kx, ky, kr) = (kb[j * 4], kb[j * 4 + 1], kb[j * 4 + 2]);
            let osc = (tt * (2.0 + 2.0 * nv) + ph).sin();
            let h = hypot2(kx - px, ky - py);
            let dd2 = if h != 0.0 { h } else { 1.0 }; // (x || 1)
            let want = kr * (1.1 + 0.5 * nv * (1.0 + osc));
            let dir = if dd2 > want { 1.0 } else { -0.6 * nv };
            let sp = f64::min(6.0, f64::max(1.2, dd2 * 0.08)) * (1.0 + 0.5 * nv * osc);
            px += (kx - px) / dd2 * sp * dir + (r1 - 0.5) * 2.0 * nv;
            py += (ky - py) / dd2 * sp * dir + (r2 - 0.5) * 2.0 * nv;
            continue_out(pb, o, px, py, circ, px, py, ph);
        }
        0
    }
}
// out layout (overwrites the in fields): x y circIdx ox oy ph
fn continue_out(pb: &mut Vec<f64>, o: usize, x: f64, y: f64, circ: i64, ox: f64, oy: f64, ph: f64) {
    pb[o] = x; pb[o + 1] = y; pb[o + 2] = circ as f64; pb[o + 3] = ox; pb[o + 4] = oy; pb[o + 5] = ph;
}

#[no_mangle]
pub extern "C" fn pw_buf(n: usize) -> *mut f64 { unsafe { let b = &mut *std::ptr::addr_of_mut!(WB); b.resize(n * WG_IN + 1, 0.0); b.as_mut_ptr() } }

// Wing geometry + heading/flap state for the visible parasites (packed, one record each; NaN = JS undefined).
// out record: h px py fx fy sp fp ax ay lx ly mx my rad
#[no_mangle]
pub extern "C" fn pw_run(n: usize, dtf: f64, psz: f64) -> i32 {
    unsafe {
        let b = &mut *std::ptr::addr_of_mut!(WB);
        if b.len() < n * WG_IN { return -1; }
        for i in 0..n {
            let o = i * WG_IN;
            let (x, y, host_alive, hx, hy) = (b[o], b[o + 1], b[o + 2], b[o + 3], b[o + 4]);
            let (mut h, ppx, ppy, fx, fy, mut sp, fp, ph) = (b[o + 5], b[o + 6], b[o + 7], b[o + 8], b[o + 9], b[o + 10], b[o + 11], b[o + 12]);
            let mut ta = if h.is_nan() { 0.0 } else { h }; // pp2.h || 0 (0 stays 0)
            if host_alive != 0.0 { ta = (hy - y).atan2(hx - x); }
            else if !ppx.is_nan() && (x != ppx || y != ppy) { ta = (y - ppy).atan2(x - ppx); }
            if h.is_nan() { h = ta; }
            let mut dh = ta - h;
            while dh > 3.1416 { dh -= 6.2832; }
            while dh < -3.1416 { dh += 6.2832; }
            h += dh * (1.0 - (-dtf * 0.012).exp());
            let spd = if fx.is_nan() { 0.0 } else { hypot2(x - fx, y - fy) };
            sp = sp + (f64::min(spd, 6.0) - sp) * 0.15;
            let mut fph = if fp.is_nan() { ph } else { fp };
            fph = fph + dtf * 0.0565 * (1.0 + 0.12 * sp);
            let fl = fph.sin(); let amp = 0.22 + 0.025 * sp;
            let (ux, uy) = (h.cos(), h.sin()); let (vx, vy) = (-uy, ux);
            let bw = 2.965 * psz * (1.0 + amp * fl); let rr = (1.71 - 0.35 * fl) * psz; let rad = 0.5 * psz;
            let (ax, ay) = (x + ux * 3.43 * psz, y + uy * 3.43 * psz);
            let (lx, ly) = (x - ux * rr + vx * bw, y - uy * rr + vy * bw);
            let (mx, my) = (x - ux * rr - vx * bw, y - uy * rr - vy * bw);
            let out = [h, x, y, x, y, sp, fph, ax, ay, lx, ly, mx, my, rad];
            for k in 0..WG_OUT { b[o + k] = out[k]; }
        }
        0
    }
}
