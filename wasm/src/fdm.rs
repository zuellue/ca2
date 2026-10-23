// fdm.rs: fdlibm sin/cos (the algorithm V8's Math.sin/Math.cos use: ieee754::sin/cos) so Rust results can be bit-equal to the JS source.
// Covers |x| <= 2^19*pi/2 (~8.2e5) with the medium-range reduction; larger arguments fall back to std (not bit-equal, flagged by the caller's tests).
fn hi(x: f64) -> u32 { (x.to_bits() >> 32) as u32 }
fn from_hi_lo(h: u32, l: u32) -> f64 { f64::from_bits(((h as u64) << 32) | l as u64) }
fn ksin(x: f64, y: f64, iy: i32) -> f64 {
    const S1: f64 = -1.66666666666666324348e-01; const S2: f64 = 8.33333333332248946124e-03; const S3: f64 = -1.98412698298579493134e-04;
    const S4: f64 = 2.75573137070700676789e-06; const S5: f64 = -2.50507602534068634195e-08; const S6: f64 = 1.58969099521155010221e-10;
    let ix = hi(x) & 0x7fffffff;
    if ix < 0x3e400000 && (x as i32) == 0 { return x; }
    let z = x * x; let v = z * x; let r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)));
    if iy == 0 { x + v * (S1 + z * r) } else { x - ((z * (0.5 * y - v * r) - y) - v * S1) }
}
fn kcos(x: f64, y: f64) -> f64 {
    const C1: f64 = 4.16666666666666019037e-02; const C2: f64 = -1.38888888888741095749e-03; const C3: f64 = 2.48015872894767294178e-05;
    const C4: f64 = -2.75573143513906633035e-07; const C5: f64 = 2.08757232129817482790e-09; const C6: f64 = -1.13596475577881948265e-11;
    let ix = hi(x) & 0x7fffffff;
    if ix < 0x3e400000 && (x as i32) == 0 { return 1.0; }
    let z = x * x; let r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
    if ix < 0x3FD33333 { return 1.0 - (0.5 * z - (z * r - x * y)); }
    let qx = if ix > 0x3fe90000 { 0.28125 } else { from_hi_lo(ix - 0x00200000, 0) };
    let hz = 0.5 * z - qx; let a = 1.0 - qx;
    a - (hz - (z * r - x * y))
}
// returns (n, y0, y1)
fn rem_pio2(x: f64) -> (i32, f64, f64) {
    const INVPIO2: f64 = 6.36619772367581382433e-01; const PIO2_1: f64 = 1.57079632673412561417e+00; const PIO2_1T: f64 = 6.07710050650619224932e-11;
    const PIO2_2: f64 = 6.07710050630396597660e-11; const PIO2_2T: f64 = 2.02226624879595063154e-21; const PIO2_3: f64 = 2.02226624871116645580e-21; const PIO2_3T: f64 = 8.47842766036889956997e-32;
    let hx = hi(x); let ix = hx & 0x7fffffff;
    if ix < 0x4002d97c {
        if (hx as i32) > 0 {
            let mut z = x - PIO2_1;
            if ix != 0x3ff921fb { let y0 = z - PIO2_1T; return (1, y0, (z - y0) - PIO2_1T); }
            z -= PIO2_2; let y0 = z - PIO2_2T; return (1, y0, (z - y0) - PIO2_2T);
        } else {
            let mut z = x + PIO2_1;
            if ix != 0x3ff921fb { let y0 = z + PIO2_1T; return (-1, y0, (z - y0) + PIO2_1T); }
            z += PIO2_2; let y0 = z + PIO2_2T; return (-1, y0, (z - y0) + PIO2_2T);
        }
    }
    // medium range |x| <= 2^19*pi/2
    let t = x.abs(); let n = (t * INVPIO2 + 0.5) as i32; let fnn = n as f64;
    let mut r = t - fnn * PIO2_1; let mut w = fnn * PIO2_1T; let mut y0;
    // fdlibm npio2_hw[n-1] = high word of n*pi/2 (rounded double), generated the same way
    let tbl_ok = n < 32 && n >= 1 && ix != hi(fnn * (PIO2_1 + PIO2_1T));
    if tbl_ok { y0 = r - w; }
    else {
        let j = (ix >> 20) as i32; y0 = r - w; let mut i = j - (((hi(y0) >> 20) & 0x7ff) as i32);
        if i > 16 {
            let mut t2 = r; w = fnn * PIO2_2; r = t2 - w; w = fnn * PIO2_2T - ((t2 - r) - w); y0 = r - w;
            i = j - (((hi(y0) >> 20) & 0x7ff) as i32);
            if i > 49 { t2 = r; w = fnn * PIO2_3; r = t2 - w; w = fnn * PIO2_3T - ((t2 - r) - w); y0 = r - w; }
        }
    }
    let y1 = (r - y0) - w;
    if (hx as i32) < 0 { (-n, -y0, -y1) } else { (n, y0, y1) }
}
const MAXA: f64 = 8.2e5;
// Out-of-domain flag: set when an argument is beyond the verified medium-range reduction (|x| > 8.2e5). The result is then libm's (NOT V8-equal); callers must check take_ood() and return an error so JS computes that call.
static mut OOD: bool = false;
pub fn in_domain(x: f64) -> bool { x.abs() <= MAXA || !x.is_finite() }
pub fn take_ood() -> bool { unsafe { let v = OOD; OOD = false; v } }
#[no_mangle] pub extern "C" fn fdm_clear_ood() { unsafe { OOD = false; } }
pub fn sin(x: f64) -> f64 {
    let ix = hi(x) & 0x7fffffff;
    if ix <= 0x3fe921fb { return ksin(x, 0.0, 0); }
    if ix >= 0x7ff00000 { return f64::NAN; }
    if x.abs() > MAXA { unsafe { OOD = true; } return x.sin(); }
    let (n, y0, y1) = rem_pio2(x);
    match n & 3 { 0 => ksin(y0, y1, 1), 1 => kcos(y0, y1), 2 => -ksin(y0, y1, 1), _ => -kcos(y0, y1) }
}
pub fn cos(x: f64) -> f64 {
    let ix = hi(x) & 0x7fffffff;
    if ix <= 0x3fe921fb { return kcos(x, 0.0); }
    if ix >= 0x7ff00000 { return f64::NAN; }
    if x.abs() > MAXA { unsafe { OOD = true; } return x.cos(); }
    let (n, y0, y1) = rem_pio2(x);
    match n & 3 { 0 => kcos(y0, y1), 1 => -ksin(y0, y1, 1), 2 => -kcos(y0, y1), _ => ksin(y0, y1, 1) }
}
#[no_mangle] pub extern "C" fn fdm_sin(x: f64) -> f64 { sin(x) }
#[no_mangle] pub extern "C" fn fdm_cos(x: f64) -> f64 { cos(x) }
