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

// ---- large-argument reduction: fdlibm __kernel_rem_pio2 (Payne-Hanek) + e_rem_pio2 large branch, prec=2 ----
static IPIO2: [i32; 66] = [0xa2f983, 0x6e4e44, 0x1529fc, 0x2757d1, 0xf534dd, 0xc0db62, 0x95993c, 0x439041, 0xfe5163, 0xabdebb, 0xc561b7, 0x246e3a, 0x424dd2, 0xe00649, 0x2eea09, 0xd1921c, 0xfe1deb, 0x1cb129, 0xa73ee8, 0x8235f5, 0x2ebb44, 0x84e99c, 0x7026b4, 0x5f7e41, 0x3991d6, 0x398353, 0x39f49c, 0x845f8b, 0xbdf928, 0x3b1ff8, 0x97ffde, 0x05980f, 0xef2f11, 0x8b5a0a, 0x6d1f6d, 0x367ecf, 0x27cb09, 0xb74f46, 0x3f669e, 0x5fea2d, 0x7527ba, 0xc7ebe5, 0xf17b3d, 0x0739f7, 0x8a5292, 0xea6bfb, 0x5fb11f, 0x8d5d08, 0x560330, 0x46fc7b, 0x6babf0, 0xcfbc20, 0x9af436, 0x1da9e3, 0x91615e, 0xe61b08, 0x659985, 0x5f14a0, 0x68408d, 0xffd880, 0x4d7327, 0x310606, 0x1556ca, 0x73a8c9, 0x60e27b, 0xc08c6b];
const PIO2T: [f64; 8] = [1.57079625129699707031e+00, 7.54978941586159635335e-08, 5.39030252995776476554e-15, 3.28200341580791294123e-22, 1.27065575308067607349e-29, 1.22933308981111328932e-36, 2.73370053816464559624e-44, 2.16741683877804819444e-51];
fn p2(n: i32) -> f64 { f64::from_bits(((1023 + n) as u64) << 52) }
fn scalbn(x: f64, n: i32) -> f64 { if n > 1000 { x * p2(1000) * p2(n - 1000) } else if n < -1000 { x * p2(-1000) * p2(n + 1000) } else { x * p2(n) } }
fn kernel_rem_pio2(x: &[f64], y: &mut [f64; 2], e0: i32, nx: usize) -> i32 {
    const TWO24: f64 = 16777216.0; const TWON24: f64 = 5.9604644775390625e-8;
    let jk: usize = 4; let jp = jk;
    let jx = nx as i32 - 1; let mut jv = (e0 - 3) / 24; if jv < 0 { jv = 0; }
    let mut q0 = e0 - 24 * (jv + 1);
    let mut f = [0.0f64; 20]; let mut q = [0.0f64; 20]; let mut fq = [0.0f64; 20]; let mut iq = [0i32; 20];
    let mut j = jv - jx; let m = jx + jk as i32;
    for i in 0..=(m as usize) { f[i] = if j < 0 { 0.0 } else { IPIO2[j as usize] as f64 }; j += 1; }
    for i in 0..=jk { let mut fw = 0.0; for jj in 0..=(jx as usize) { fw += x[jj] * f[jx as usize + i - jj]; } q[i] = fw; }
    let mut jz = jk as i32;
    let mut z; let mut n; let mut ih;
    loop {
        // recompute
        let mut i = 0usize; let mut jj = jz as usize; z = q[jz as usize];
        while jj > 0 { let fw = (TWON24 * z) as i32 as f64; iq[i] = (z - TWO24 * fw) as i32; z = q[jj - 1] + fw; i += 1; jj -= 1; }
        z = scalbn(z, q0); z -= 8.0 * (z * 0.125).floor(); n = z as i32; z -= n as f64; ih = 0;
        if q0 > 0 { let i2 = iq[jz as usize - 1] >> (24 - q0); n += i2; iq[jz as usize - 1] -= i2 << (24 - q0); ih = iq[jz as usize - 1] >> (23 - q0); }
        else if q0 == 0 { ih = iq[jz as usize - 1] >> 23; }
        else if z >= 0.5 { ih = 2; }
        if ih > 0 {
            n += 1; let mut carry = 0;
            for i in 0..(jz as usize) { let j3 = iq[i]; if carry == 0 { if j3 != 0 { carry = 1; iq[i] = 0x1000000 - j3; } } else { iq[i] = 0xffffff - j3; } }
            if q0 > 0 { match q0 { 1 => iq[jz as usize - 1] &= 0x7fffff, 2 => iq[jz as usize - 1] &= 0x3fffff, _ => {} } }
            if ih == 2 { z = 1.0 - z; if carry != 0 { z -= scalbn(1.0, q0); } }
        }
        if z == 0.0 {
            let mut j4 = 0; let mut i = jz - 1; while i >= jk as i32 { j4 |= iq[i as usize]; i -= 1; }
            if j4 == 0 {
                let mut k = 1usize; while iq[jk - k] == 0 { k += 1; }
                for i in (jz as usize + 1)..=(jz as usize + k) {
                    f[(jx as usize) + i] = IPIO2[jv as usize + i] as f64;
                    let mut fw = 0.0; for jj2 in 0..=(jx as usize) { fw += x[jj2] * f[jx as usize + i - jj2]; } q[i] = fw;
                }
                jz += k as i32; continue;
            }
        }
        break;
    }
    if z == 0.0 { jz -= 1; q0 -= 24; while iq[jz as usize] == 0 { jz -= 1; q0 -= 24; } }
    else {
        z = scalbn(z, -q0);
        if z >= TWO24 { let fw = (TWON24 * z) as i32 as f64; iq[jz as usize] = (z - TWO24 * fw) as i32; jz += 1; q0 += 24; iq[jz as usize] = fw as i32; }
        else { iq[jz as usize] = z as i32; }
    }
    let mut fw = scalbn(1.0, q0);
    let mut i = jz; while i >= 0 { q[i as usize] = fw * iq[i as usize] as f64; fw *= TWON24; i -= 1; }
    let mut i = jz; while i >= 0 {
        let mut fw2 = 0.0; let mut k = 0usize; while k <= jp && (k as i32) <= jz - i { fw2 += PIO2T[k] * q[i as usize + k]; k += 1; }
        fq[(jz - i) as usize] = fw2; i -= 1;
    }
    let mut fw3 = 0.0; let mut i = jz; while i >= 0 { fw3 += fq[i as usize]; i -= 1; }
    y[0] = if ih == 0 { fw3 } else { -fw3 };
    fw3 = fq[0] - fw3; for i in 1..=(jz as usize) { fw3 += fq[i]; }
    y[1] = if ih == 0 { fw3 } else { -fw3 };
    n & 7
}
fn rem_pio2_large(x: f64) -> (i32, f64, f64) {
    const TWO24: f64 = 16777216.0;
    let hx = hi(x); let ix = hx & 0x7fffffff; let lo = x.to_bits() as u32;
    let e0 = ((ix >> 20) as i32) - 1046;
    let mut z = from_hi_lo(ix.wrapping_sub((e0 as u32) << 20), lo);
    let mut tx = [0.0f64; 3];
    for i in 0..2 { tx[i] = z as i32 as f64; z = (z - tx[i]) * TWO24; }
    tx[2] = z; let mut nx = 3; while tx[nx - 1] == 0.0 { nx -= 1; }
    let mut y = [0.0f64; 2];
    let n = kernel_rem_pio2(&tx, &mut y, e0, nx);
    if (hx as i32) < 0 { (-n, -y[0], -y[1]) } else { (n, y[0], y[1]) }
}
const MAXA: f64 = 8.2e5;
// Out-of-domain flag: set when an argument is beyond the verified medium-range reduction (|x| > 8.2e5). The result is then libm's (NOT V8-equal); callers must check take_ood() and return an error so JS computes that call.
static mut OOD: bool = false;
static mut LARGE: bool = false; // full-range Payne-Hanek reduction for |x| > 8.2e5 (off by default until verified; test flips via fdm_set_large)
#[no_mangle] pub extern "C" fn fdm_set_large(v: i32) { unsafe { LARGE = v != 0; } }
pub fn in_domain(x: f64) -> bool { (hi(x) & 0x7fffffff) <= 0x413921fb || x.abs() <= MAXA || !x.is_finite() || unsafe { LARGE } }
pub fn take_ood() -> bool { unsafe { let v = OOD; OOD = false; v } }
#[no_mangle] pub extern "C" fn fdm_clear_ood() { unsafe { OOD = false; } }
pub fn sin(x: f64) -> f64 {
    let ix = hi(x) & 0x7fffffff;
    if ix <= 0x3fe921fb { return ksin(x, 0.0, 0); }
    if ix >= 0x7ff00000 { return f64::NAN; }
    let (n, y0, y1) = if (hi(x) & 0x7fffffff) > 0x413921fb && (x.abs() > MAXA) { if unsafe { LARGE } { rem_pio2_large(x) } else { unsafe { OOD = true; } return x.sin(); } } else { rem_pio2(x) };
    match n & 3 { 0 => ksin(y0, y1, 1), 1 => kcos(y0, y1), 2 => -ksin(y0, y1, 1), _ => -kcos(y0, y1) }
}
pub fn cos(x: f64) -> f64 {
    let ix = hi(x) & 0x7fffffff;
    if ix <= 0x3fe921fb { return kcos(x, 0.0); }
    if ix >= 0x7ff00000 { return f64::NAN; }
    let (n, y0, y1) = if (hi(x) & 0x7fffffff) > 0x413921fb && (x.abs() > MAXA) { if unsafe { LARGE } { rem_pio2_large(x) } else { unsafe { OOD = true; } return x.cos(); } } else { rem_pio2(x) };
    match n & 3 { 0 => kcos(y0, y1), 1 => -ksin(y0, y1, 1), 2 => -kcos(y0, y1), _ => ksin(y0, y1, 1) }
}
#[no_mangle] pub extern "C" fn fdm_sin(x: f64) -> f64 { sin(x) }
#[no_mangle] pub extern "C" fn fdm_cos(x: f64) -> f64 { cos(x) }
