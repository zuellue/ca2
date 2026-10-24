// post.rs: stage-1 post-pass compute ported from ca2.js (resident, order preserved by the caller).
//  post_wall = wallPull(p, r, false) over a packed batch (ca2.js frame tail: blobs, worms, free food).
//  post_age  = stepAging (age += dt, aged-out cells die).
// Packed in/out buffers live in wasm memory; JS re-creates its views after every call (growth detaches them).
static mut WB: Vec<f64> = Vec::new();
static mut AB: Vec<f64> = Vec::new();

#[no_mangle]
pub extern "C" fn post_wall_buf(n: usize) -> *mut f64 {
    unsafe { let b = &mut *std::ptr::addr_of_mut!(WB); b.resize(n * 3 + 1, 0.0); b.as_mut_ptr() }
}
// buffer: per body x, y, r. wall rect: cont x,y,w,h and boundGap. Same arithmetic as JS wallPull (vel=false).
#[no_mangle]
pub extern "C" fn post_wall(n: usize, cx: f64, cy: f64, cw: f64, ch: f64, bound_gap: f64) -> i32 {
    unsafe {
        let b = &mut *std::ptr::addr_of_mut!(WB);
        if b.len() < n * 3 { return -1; }
        let gap = if bound_gap > 0.0 { bound_gap } else { 0.0 };
        let r_fit = f64::max(8.0, f64::min(cw, ch) / 2.0 - gap);
        for i in 0..n {
            let (x, y, r) = (b[i * 3], b[i * 3 + 1], b[i * 3 + 2]);
            let rr = if r < r_fit { r } else { r_fit }; // Math.min(r, rFit)
            let (mut x0, mut x1, mut y0, mut y1) = (cx + rr + gap, cx + cw - rr - gap, cy + rr + gap, cy + ch - rr - gap);
            if x1 < x0 { let m = (x0 + x1) / 2.0; x0 = m; x1 = m; }
            if y1 < y0 { let m = (y0 + y1) / 2.0; y0 = m; y1 = m; }
            let mut nx = x; let mut ny = y;
            if x < x0 { nx = x0; } else if x > x1 { nx = x1; }
            if y < y0 { ny = y0; } else if y > y1 { ny = y1; }
            b[i * 3] = nx; b[i * 3 + 1] = ny;
        }
        0
    }
}

#[no_mangle]
pub extern "C" fn post_age_buf(n: usize) -> *mut f64 {
    unsafe { let b = &mut *std::ptr::addr_of_mut!(AB); b.resize(n * 3 + 1, 0.0); b.as_mut_ptr() }
}
// per cell: age, life (0 = none), alive (1/0). JS: if (!c.alive) continue; c.age = (c.age||0)+dt; if (c.life && c.age >= c.life) c.alive = false.
#[no_mangle]
pub extern "C" fn post_age(n: usize, dt: f64) -> i32 {
    unsafe {
        let b = &mut *std::ptr::addr_of_mut!(AB);
        if b.len() < n * 3 { return -1; }
        for i in 0..n {
            if b[i * 3 + 2] == 0.0 { continue; }
            let age = b[i * 3] + dt;
            b[i * 3] = age;
            let life = b[i * 3 + 1];
            if life != 0.0 && age >= life { b[i * 3 + 2] = 0.0; }
        }
        0
    }
}

// ---- stepHabitat per-food nutrient update (habField + fed decay + sun gain). Seeding (random draws, habSeed, splice) stays in the JS caller in the
// original reverse order: the fed update of one dot never depends on another dot or on a draw, so computing all fed values first is order-equivalent.
static mut HB: Vec<f64> = Vec::new(); // per food: x, y, fed(0 if undefined), skip(1 = mode-owned) -> out: fed, touched
static mut HP: Vec<f64> = Vec::new();
#[no_mangle]
pub extern "C" fn post_hab_buf(n: usize) -> *mut f64 { unsafe { let b = &mut *std::ptr::addr_of_mut!(HB); b.resize(n * 4 + 1, 0.0); b.as_mut_ptr() } }
#[no_mangle]
pub extern "C" fn post_hab_par() -> *mut f64 { unsafe { let b = &mut *std::ptr::addr_of_mut!(HP); b.resize(32, 0.0); b.as_mut_ptr() } }

fn imul(a: i32, b: i32) -> i32 { a.wrapping_mul(b) }
fn hab_hash(x: f64, y: f64) -> f64 {
    let xi = x as i64 as i32; let yi = y as i64 as i32; // JS Math.imul ToInt32 on small integers
    let mut h: u32 = (imul(xi, 73856093) ^ imul(yi, 19349663)) as u32;
    h ^= h >> 13;
    h = imul(h as i32, 0x5bd1e995u32 as i32) as u32;
    h ^= h >> 15;
    (h as f64) / 4294967296.0
}
fn js_max(a: f64, b: f64) -> f64 { if a != a || b != b { f64::NAN } else if a > b { a } else { b } }
fn js_min(a: f64, b: f64) -> f64 { if a != a || b != b { f64::NAN } else if a < b { a } else { b } }

// par: 0 fullOn, 1 niches, 2 nicheSun, 3 nicheMix, 4 driftAmp, 5 drift, 6 driftFloor, 7 habT, 8 x0, 9 x1, 10 y0, 11 y1, 12 cont.w, 13 cont.h, 14 cont.x, 15 cont.y, 16 sun, 17 fedDecay, 18 dt
fn hab_field(x: f64, y: f64, p: &[f64]) -> (f64, f64) {
    let k = p[1].floor(); let mut niche = 1.0;
    let (cw, ch, cx, cy) = (p[12], p[13], p[14], p[15]);
    if k > 1.0 && cw > 0.0 && ch > 0.0 {
        let gx = (x - cx) / cw * k; let gy = (y - cy) / ch * k; let x0 = gx.floor(); let y0 = gy.floor();
        let rv = |ix: f64, iy: f64| 1.0 + p[2] * (2.0 * hab_hash(ix, iy) - 1.0);
        let fx2 = gx - x0; let fy2 = gy - y0;
        let smooth = rv(x0, y0) * (1.0 - fx2) * (1.0 - fy2) + rv(x0 + 1.0, y0) * fx2 * (1.0 - fy2) + rv(x0, y0 + 1.0) * (1.0 - fx2) * fy2 + rv(x0 + 1.0, y0 + 1.0) * fx2 * fy2;
        let m = js_max(0.0, js_min(1.0, p[3]));
        niche = rv(x0, y0) * (1.0 - m) + smooth * m;
    }
    let mut d_mul = 1.0;
    if p[4] > 0.0 && p[5] > 0.0 {
        let dk = if k > 1.0 { k } else { 4.0 };
        let dx0 = ((x - cx) / js_max(1.0, cw) * dk).floor(); let dy0 = ((y - cy) / js_max(1.0, ch) * dk).floor();
        let ph = 2.0 * std::f64::consts::PI * p[5] * p[7]; let off = 2.0 * std::f64::consts::PI * hab_hash(dx0, dy0);
        d_mul = 1.0 + p[4] * (0.6 * crate::fdm::sin(ph + off) + 0.4 * crate::fdm::sin(1.618 * ph + 2.0 * off));
    }
    let sun_mul = js_max(p[6], niche * d_mul);
    (sun_mul, 1.0 + (1.0 - js_min(1.0, sun_mul)))
}

#[no_mangle]
pub extern "C" fn post_hab(n: usize) -> i32 {
    unsafe {
        let b = &mut *std::ptr::addr_of_mut!(HB); let p = &*std::ptr::addr_of!(HP);
        if b.len() < n * 4 || p.len() < 32 { return -1; }
        crate::fdm::take_ood();
        let full = p[0] != 0.0; let dt = p[18];
        for i in 0..n {
            let (x, y, fed0, skip) = (b[i * 4], b[i * 4 + 1], b[i * 4 + 2], b[i * 4 + 3]);
            let mut fed = fed0; let mut touched = 0.0;
            if skip == 0.0 {
                let (sun_m, dec) = if full { hab_field(x, y, p) } else { (1.0, 1.0) };
                if fed > 0.0 && p[17] > 0.0 { fed = js_max(0.0, fed - p[17] * dec * dt); touched = 1.0; }
                if full && p[16] > 0.0 && x > p[8] && x < p[9] && y > p[10] && y < p[11] { fed = fed + p[16] * sun_m * dt; touched = 1.0; }
            }
            b[i * 4] = fed; b[i * 4 + 1] = touched;
        }
        if crate::fdm::take_ood() { return -2; } // out of the verified trig domain: JS computes this update
        0
    }
}

// ---- food-ink guard (foodInkGuard / foodPushOut / foodOnInk) : deterministic, no RNG, same arithmetic as ca2.js. Own copy of the ink mask (RGBA u8), uploaded by JS
// when SEP.img changes (identity), independent of the separator module's mask.
static mut MK: Vec<u8> = Vec::new();
static mut MKW: f64 = 0.0;
static mut MKH: f64 = 0.0;
static mut GB: Vec<f64> = Vec::new();
const COS8: [f64; 8] = [1.0, 0.7071, 0.0, -0.7071, -1.0, -0.7071, 0.0, 0.7071];
const SIN8: [f64; 8] = [0.0, 0.7071, 1.0, 0.7071, 0.0, -0.7071, -1.0, -0.7071];
#[no_mangle]
pub extern "C" fn post_mask_buf(n: usize) -> *mut u8 { unsafe { let m = &mut *std::ptr::addr_of_mut!(MK); m.resize(n, 0); m.as_mut_ptr() } }
#[no_mangle]
pub extern "C" fn post_mask_dims(mw: f64, mh: f64) {
    unsafe {
        MKW = mw; MKH = mh;
        let m = &*std::ptr::addr_of!(MK); let n = (mw * mh) as usize;
        let fr = &mut *std::ptr::addr_of_mut!(FREE); fr.clear();
        let mut ink = 0usize;
        for i in 0..n.min(m.len() / 4) { if m[i * 4 + 3] > 40 { ink += 1; } else { fr.push(i as u32); } } // free = alpha <= 40, ascending (foodFreeIdx order)
        INKP = if n > 0 { ink as f64 / n as f64 } else { 0.0 };
    }
}
static mut FREE: Vec<u32> = Vec::new();
static mut INKP: f64 = 0.0;
// foodInkFrac
#[no_mangle] pub extern "C" fn post_ink_frac() -> f64 { unsafe { INKP } }
// foodOnInk core (sepDiskHit on the food mask)
#[no_mangle] pub extern "C" fn post_on_ink(x: f64, y: f64, r: f64) -> i32 { unsafe { if disk_hit(x, y, r) { 1 } else { 0 } } }
// lowerBound over the free list, and element access (foodSpot's mostly-ink branch; the Math.random draws stay in JS)
#[no_mangle] pub extern "C" fn post_free_lb(v: f64) -> f64 { unsafe { let a = &*std::ptr::addr_of!(FREE); let (mut lo, mut hi) = (0usize, a.len()); while lo < hi { let m = (lo + hi) >> 1; if (a[m] as f64) < v { lo = m + 1; } else { hi = m; } } lo as f64 } }
#[no_mangle] pub extern "C" fn post_free_at(i: f64) -> f64 { unsafe { let a = &*std::ptr::addr_of!(FREE); let k = i as usize; if k < a.len() { a[k] as f64 } else { -1.0 } } }
// reseedFood cell-proximity test: packed cells (x, y, radius) uploaded once per call
static mut RC: Vec<f64> = Vec::new();
static mut RCN: usize = 0;
#[no_mangle] pub extern "C" fn post_rc_buf(n: usize) -> *mut f64 { unsafe { let b = &mut *std::ptr::addr_of_mut!(RC); b.resize(n * 3 + 1, 0.0); RCN = n; b.as_mut_ptr() } }
// true when a cell's eat reach covers (cx, cy): the JS `ok = false; break` condition, same arithmetic, same order
#[no_mangle] pub extern "C" fn post_rc_near(cx: f64, cy: f64, eat_r: f64, gs: f64) -> i32 {
    unsafe {
        let b = &*std::ptr::addr_of!(RC);
        for i in 0..RCN {
            let (x, y, r) = (b[i * 3], b[i * 3 + 1], b[i * 3 + 2]);
            let rr = r + eat_r + 2.0 * gs;
            if (x - cx).abs() < rr && (y - cy).abs() < rr && (x - cx) * (x - cx) + (y - cy) * (y - cy) < rr * rr { return 1; }
        }
        0
    }
}
#[no_mangle]
pub extern "C" fn post_guard_buf(n: usize) -> *mut f64 { unsafe { let b = &mut *std::ptr::addr_of_mut!(GB); b.resize(n * 12 + 1, 0.0); b.as_mut_ptr() } }

// sepDiskHit(x, y, r) on the food mask
unsafe fn disk_hit(x: f64, y: f64, r: f64) -> bool {
    let m = &*std::ptr::addr_of!(MK); let (mw, mh) = (MKW, MKH);
    if m.is_empty() { return false; }
    let x0 = f64::max(0.0, ((x - r) * 0.5).floor()); let x1 = f64::min(mw - 1.0, ((x + r) * 0.5).ceil());
    let y0 = f64::max(0.0, ((y - r) * 0.5).floor()); let y1 = f64::min(mh - 1.0, ((y + r) * 0.5).ceil());
    let rr = (r + 1.42) * (r + 1.42);
    let mut yy = y0;
    while yy <= y1 {
        let mut xx = x0;
        while xx <= x1 {
            let dx = xx * 2.0 + 1.0 - x; let dy = yy * 2.0 + 1.0 - y;
            if dx * dx + dy * dy <= rr && m[((yy * mw + xx) as usize) * 4 + 3] > 40 { return true; }
            xx += 1.0;
        }
        yy += 1.0;
    }
    false
}
// foodPushOut on (x, y): returns the new (x, y)
unsafe fn push_out(x: f64, y: f64, w: f64, h: f64, r: f64) -> (f64, f64) {
    let st = if MKW != 0.0 { w / MKW } else { 2.0 };
    let (mut bk, mut bl) = (-1i32, 1e9f64);
    for k in 0..8usize {
        let mut ln = 1.0f64; let mut rx = x + COS8[k] * st; let mut ry = y + SIN8[k] * st;
        while ln < bl && rx > 0.0 && ry > 0.0 && rx < w && ry < h && disk_hit(rx, ry, r) { ln += 1.0; rx += COS8[k] * st; ry += SIN8[k] * st; }
        if ln < bl && rx > 0.0 && ry > 0.0 && rx < w && ry < h { bl = ln; bk = k as i32; }
    }
    if bk >= 0 { return (x + COS8[bk as usize] * st * bl, y + SIN8[bk as usize] * st * bl); }
    let m = &*std::ptr::addr_of!(MK); let mw = MKW as usize; let n = (MKW * MKH) as usize;
    let (mut bd, mut bx, mut by) = (1e18f64, x, y);
    for q in 0..n {
        if m[q * 4 + 3] > 40 { continue; } // free pixels only, ascending index = the cached free list order
        let cx = (q % mw) as f64; let cy = ((q - q % mw) / mw) as f64;
        let qx = (cx + 0.5) * st; let qy = (cy + 0.5) * st;
        let d2 = (qx - x) * (qx - x) + (qy - y) * (qy - y);
        if d2 < bd && !disk_hit(qx, qy, r) { bd = d2; bx = qx; by = qy; }
    }
    (bx, by)
}
// per food in (stride 12): 0 x,1 y,2 vx,3 vy,4 hasVx,5 hasVy,6 pk(-1 undefined),7 px,8 py,9 owned.  out: 0 x,1 y,2 vx,3 vy,6 pk,7 px,8 py,10 gone(1)
#[no_mangle]
pub extern "C" fn post_guard(n: usize, w: f64, h: f64, r: f64) -> i32 {
    unsafe {
        let b = &mut *std::ptr::addr_of_mut!(GB);
        if b.len() < n * 12 { return -1; }
        for i in 0..n {
            let o = i * 12;
            let (mut x, mut y, mut vx, mut vy) = (b[o], b[o + 1], b[o + 2], b[o + 3]);
            let (hvx, hvy, pk, px, py, owned) = (b[o + 4] != 0.0, b[o + 5] != 0.0, b[o + 6], b[o + 7], b[o + 8], b[o + 9] != 0.0);
            let mut gone = false;
            if disk_hit(x, y, r) {
                if pk == 1.0 {
                    if !disk_hit(x, py, r) { y = py; if hvy { vy = -vy * 0.5; } }
                    else if !disk_hit(px, y, r) { x = px; if hvx { vx = -vx * 0.5; } }
                    else {
                        x = px; y = py;
                        if hvx { vx = -vx * 0.5; vy = -vy * 0.5; }
                        if disk_hit(x, y, r) { let p = push_out(x, y, w, h, r); x = p.0; y = p.1; }
                    }
                } else if pk == 2.0 || pk == 0.0 {
                    let p = push_out(x, y, w, h, r); x = p.0; y = p.1;
                } else if pk == -1.0 {
                    if owned { let p = push_out(x, y, w, h, r); x = p.0; y = p.1; } else { gone = true; }
                }
                if !gone && disk_hit(x, y, r) { gone = true; }
            }
            let mut npk = pk; let (mut npx, mut npy) = (px, py);
            if !gone { npk = if disk_hit(x, y, r) { 2.0 } else { 1.0 }; npx = x; npy = y; }
            b[o] = x; b[o + 1] = y; b[o + 2] = vx; b[o + 3] = vy; b[o + 6] = npk; b[o + 7] = npx; b[o + 8] = npy; b[o + 10] = if gone { 1.0 } else { 0.0 };
        }
        0
    }
}

// ---- sepBody(c) = emitCell(c, frameT, SRC_MAX, o) in f64 + plate-relative shift + bound, written straight into the separator module's body buffer (sep2 BODY).
// in (f64[24]): 0 x,1 y,2 radius,3 hasShape,4 t,5 asp,6 th,7 dir,8 wsp,9 ph,10 wig,11 sat,12 ph2,13 t0,14 allowance,15 cont.x,16 cont.y,17 cont.w,18 cont.h,19 cellShapes,20 boundGap,21 metaballStrength,22 THRESHOLD
static mut SBI: Vec<f64> = Vec::new();
#[no_mangle]
pub extern "C" fn post_sepbody_in() -> *mut f64 { unsafe { let b = &mut *std::ptr::addr_of_mut!(SBI); b.resize(24, 0.0); b.as_mut_ptr() } }
fn js_round(x: f64) -> f64 { let r = x.floor(); if x - r >= 0.5 { r + 1.0 } else { r } }
fn clampf(v: f64, a: f64, b: f64) -> f64 { if v < a { a } else if v > b { b } else { v } }
#[no_mangle]
pub extern "C" fn post_sepbody() -> i32 {
    unsafe {
        let i = &*std::ptr::addr_of!(SBI);
        if i.len() < 24 { return -1; }
        crate::fdm::take_ood();
        let (cxx, cyy, rad, has_sh, st, asp, th, dir, wsp, ph, wig, sat, ph2, t0, allow) = (i[0], i[1], i[2], i[3] != 0.0, i[4], i[5], i[6], i[7], i[8], i[9], i[10], i[11], i[12], i[13], i[14]);
        let (cox, coy, cow, coh, shapes, bgap, ms, thr) = (i[15], i[16], i[17], i[18], i[19] != 0.0, i[20], i[21], i[22]);
        let (mut xs, mut ys, mut rs_): (Vec<f64>, Vec<f64>, Vec<f64>) = (Vec::new(), Vec::new(), Vec::new());
        let bx = cxx - cox; let by = cyy - coy;
        let g = if bgap > 0.0 { bgap } else { 0.0 };
        let mut push = |sx: f64, sy: f64, sr: f64| {
            let d = f64::min(f64::min(sx - g, cow - g - sx), f64::min(sy - g, coh - g - sy));
            xs.push(sx); ys.push(sy); rs_.push(f64::min(sr, f64::max(0.4, d)));
        };
        let gap2 = if bgap > 0.0 { bgap } else { 0.0 };
        let r_free = f64::max(1.0, f64::min(f64::min(bx - gap2, cow - gap2 - bx), f64::min(by - gap2, coh - gap2 - by)));
        let cr = f64::min(rad, f64::max(1.0, r_free)) * (1.0 - 0.18 * clampf(1.0 - f64::max(0.0, r_free - rad) / 8.0, 0.0, 1.0));
        let mut done = false;
        if shapes && has_sh && st == 1.0 && allow > 1.0 {
            let rs = cr * th; let span = 2.0 * cr * th * (asp - 1.0);
            let want = f64::min(9.0, f64::max(2.0, js_round(span / (1.15 * rs)) + 1.0)); let nn = f64::min(want, allow);
            if nn >= 2.0 {
                let ux = crate::fdm::cos(dir); let uy = crate::fdm::sin(dir); let px = -uy; let py = ux; let ds = span / (nn - 1.0); let tq = t0 / 850.0 * (1.0 + wsp) + ph;
                let mut k = 0.0f64;
                while k < nn { let d0 = -span / 2.0 + ds * k; let off2 = wig * rs * crate::fdm::sin(tq + k * 0.85); push(bx + ux * d0 + px * off2, by + uy * d0 + py * off2, rs); k += 1.0; }
                done = true;
            }
        } else if shapes && has_sh && st == 2.0 && allow > 2.0 {
            let r0 = cr * 0.78; let rot = t0 / 4200.0 * wsp + ph;
            push(bx, by, r0);
            let mut q2 = 0.0f64;
            while q2 < sat {
                let aa = rot + q2 * 2.4 + ph2; let dd = cr * (0.42 + 0.24 * ((q2 * 0.731 + ph) % 1.0)); let rr2 = cr * (0.3 + 0.22 * ((q2 * 0.377 + ph2) % 1.0));
                push(bx + crate::fdm::cos(aa) * dd, by + crate::fdm::sin(aa) * dd, rr2); q2 += 1.0;
            }
            done = true;
        }
        if !done { push(bx, by, cr); }
        let n = xs.len();
        let scale = (f64::max(0.0, ms) * f64::max(1.0, n as f64) / f64::max(0.001, thr * 0.96)).sqrt();
        let mut bound = 0.0f64;
        for k in 0..n { xs[k] += cox - cxx; ys[k] += coy - cyy; bound = f64::max(bound, crate::sep2::hyp(xs[k], ys[k]) + rs_[k] * scale); }
        if crate::fdm::take_ood() { return -2; } // a trig argument left the verified domain: JS builds this body
        crate::sep2::set_body(&xs, &ys, &rs_, bound);
        n as i32
    }
}
// foodSpot with its Math.random draws (jsrnd spike only): decide -> draw (env.js_rnd = the real Math.random) -> apply, in the exact JS order.
// Returns 1 and writes (x, y) to post_spot_out(), or 0 for null. Inputs: rect, ink radius r = max(0.5, foodSize/2), st = foodMaskPx(), ink = foodInkOn && mask uploaded.
#[cfg(feature = "jsrnd")] #[link(wasm_import_module = "env")] extern "C" { fn js_rnd(line: u32) -> f64; }
#[cfg(feature = "jsrnd")] static mut SPOT: [f64; 2] = [0.0; 2];
#[cfg(feature = "jsrnd")] #[no_mangle] pub extern "C" fn post_spot_out() -> *const f64 { unsafe { std::ptr::addr_of!(SPOT) as *const f64 } }
#[cfg(feature = "jsrnd")] #[no_mangle]
pub extern "C" fn post_food_spot(x: f64, y: f64, w: f64, h: f64, r: f64, st: f64, ink: i32) -> i32 {
    unsafe {
        let rn = || js_rnd(0);
        let out = &mut *std::ptr::addr_of_mut!(SPOT);
        if ink == 0 { let a = x + rn() * w; let b = y + rn() * h; out[0] = a; out[1] = b; return 1; }
        let p = INKP;
        if p >= 1.0 { return 0; }
        if p <= 0.5 {
            for _ in 0..10 { let px = x + rn() * w; let py = y + rn() * h; if !disk_hit(px, py, r) { out[0] = px; out[1] = py; return 1; } }
            return 0;
        }
        let mw = MKW; let mh = MKH;
        let r0 = f64::max(0.0, (y / st).floor()); let r1 = f64::min(mh - 1.0, ((y + h) / st).floor());
        let fr = &*std::ptr::addr_of!(FREE);
        let lb = |v: f64| -> usize { let (mut lo, mut hi) = (0usize, fr.len()); while lo < hi { let m = (lo + hi) >> 1; if (fr[m] as f64) < v { lo = m + 1; } else { hi = m; } } lo };
        let lo = lb(r0 * mw); let hi = lb((r1 + 1.0) * mw); let n = hi as f64 - lo as f64;
        let mut t = 0.0;
        while t < n {
            let k = (lo as f64 + (rn() * n).floor()) as usize;
            let q = if k < fr.len() { fr[k] as f64 } else { -1.0 };
            let cx = q % mw; let cy = (q - cx) / mw;
            let px = (cx + rn()) * st; let py = (cy + rn()) * st;
            if px >= x && px <= x + w && py >= y && py <= y + h && !disk_hit(px, py, r) { out[0] = px; out[1] = py; return 1; }
            t += 1.0;
        }
        0
    }
}
