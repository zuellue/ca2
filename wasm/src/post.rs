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
