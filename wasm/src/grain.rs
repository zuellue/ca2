// card 20261024-017-ca: Rust/wasm second implementation of the grain pipeline.
// Port of devtools/card246/grain-cpu.js (the JS CPU reference of the grain.js GLSL path).
// Float semantics mirrored exactly: every Math.fround in the JS is an `fr()` here, all
// other arithmetic is f64, and the byte store replicates Uint8ClampedArray
// (clamp + round half to even). Both sides deterministic CPU code: identical inputs
// must give byte-identical outputs (gate: devtools/card017/t-grain-parity.js).

static mut SRC: Vec<u8> = Vec::new(); // RGBA, top-left row order
static mut OUT: Vec<u8> = Vec::new();
static mut BN: Vec<u8> = Vec::new();  // 64x64 blue-noise tile
static mut PRM: Vec<f64> = Vec::new(); // 24 slots, see grain_params_ptr
static mut W: usize = 0;
static mut H: usize = 0;

#[no_mangle]
pub extern "C" fn grain_alloc(w: usize, h: usize) -> *mut u8 {
    unsafe {
        W = w; H = h;
        let s = &mut *std::ptr::addr_of_mut!(SRC);
        s.resize(w * h * 4, 0);
        let o = &mut *std::ptr::addr_of_mut!(OUT);
        o.resize(w * h * 4, 0);
        s.as_mut_ptr()
    }
}
#[no_mangle]
pub extern "C" fn grain_out_ptr() -> *const u8 { unsafe { (*std::ptr::addr_of!(OUT)).as_ptr() } }
#[no_mangle]
pub extern "C" fn grain_bn_ptr() -> *mut u8 {
    unsafe { let b = &mut *std::ptr::addr_of_mut!(BN); b.resize(4096, 0); b.as_mut_ptr() }
}
// 0 amount, 1 strength, 2 size, 3 softness, 4 chroma, 5 development, 6 fine, 7 crystal,
// 8 cloud, 9 dpr, 10 overlay, 11 bucket, 12 mono, 13 skew, 14 res_adapt, 15 debug,
// 16 shadow, 17 mid, 18 high, 19 fine_ratio, 20 cloud_ratio, 21 stock_r, 22 stock_g, 23 stock_b
#[no_mangle]
pub extern "C" fn grain_params_ptr() -> *mut f64 {
    unsafe { let p = &mut *std::ptr::addr_of_mut!(PRM); p.resize(24, 0.0); p.as_mut_ptr() }
}

fn fr(x: f64) -> f64 { x as f32 as f64 } // Math.fround
// JS Math.min/max: NaN if either is NaN
fn jmin(a: f64, b: f64) -> f64 { if a.is_nan() || b.is_nan() { f64::NAN } else { a.min(b) } }
fn jmax(a: f64, b: f64) -> f64 { if a.is_nan() || b.is_nan() { f64::NAN } else { a.max(b) } }
fn jmod(x: f64, n: f64) -> f64 { x - n * (x / n).floor() }
fn fract(x: f64) -> f64 { x - x.floor() }
fn mix(a: f64, b: f64, t: f64) -> f64 { a * (1.0 - t) + b * t }
fn clamp01(x: f64) -> f64 { jmin(1.0, jmax(0.0, x)) }
fn clampn(x: f64, a: f64, b: f64) -> f64 { jmin(b, jmax(a, x)) }
fn smooth(a: f64, b: f64, x: f64) -> f64 { let t = clampn((x - a) / (b - a), 0.0, 1.0); t * t * (3.0 - 2.0 * t) }

fn hash(p: f64) -> f64 {
    let p = fr(fract(fr(fr(p) * fr(0.1031))));
    let p = fr(p * fr(p + fr(33.33)));
    let p = fr(p * fr(p + p));
    fract(p)
}

struct Ctx {
    w: usize, h: usize, bucket: f64,
    softness: f64, chroma: f64, development: f64,
    amount: f64, strength: f64,
    fine_w: f64, crystal_w: f64, cloud_w: f64, wsum: f64, fine_r: f64, cloud_r: f64,
    size: f64, density: f64,
    mono: bool, skew: f64, debug: bool, overlay: bool,
    shadow: f64, mid: f64, high: f64, stock: [f64; 3],
}

unsafe fn tex(x: f64, y: f64) -> f64 {
    let x = jmod(x, 64.0); let y = jmod(y, 64.0);
    let bn = &*std::ptr::addr_of!(BN);
    bn[(y.floor() as usize) * 64 + x.floor() as usize] as f64 / 255.0
}
unsafe fn linear(x: f64, y: f64) -> f64 {
    let ix = x.floor(); let iy = y.floor(); let a = x - ix; let b = y - iy;
    mix(mix(tex(ix, iy), tex(ix + 1.0, iy), a), mix(tex(ix, iy + 1.0), tex(ix + 1.0, iy + 1.0), a), b)
}

unsafe fn sample(c: &Ctx, x: f64, y: f64, size: f64, salt: f64, ts: f64) -> f64 {
    let x = fr(x / jmax(size, 0.01));
    let y = fr(y / jmax(size, 0.01));
    let tx = (x / 64.0).floor(); let ty = (y / 64.0).floor();
    let hh = hash(fr(fr(fr(fr(tx * 41.0) + fr(ty * 113.0)) + fr(salt * 7.0)) + fr(jmod(c.bucket, 256.0) * ts)));
    let mut sel = (hh * 8.0).floor() as i32;
    let oh = hash(fr(fr(hh * 289.0) + 5.0));
    let mut px = jmod(jmod(x, 64.0) + (oh * 64.0).floor(), 64.0);
    let py = jmod(jmod(y, 64.0) + (hash(fr(fr(oh * 289.0) + 1.0)) * 64.0).floor(), 64.0);
    if sel >= 4 { px = jmod(64.0 - px, 64.0); sel -= 4; }
    let (xx, yy) = match sel {
        1 => (py, jmod(64.0 - px, 64.0)),
        2 => (jmod(64.0 - px, 64.0), jmod(64.0 - py, 64.0)),
        3 => (jmod(64.0 - py, 64.0), px),
        _ => (px, py),
    };
    let raw = (linear(xx + 0.5, yy + 0.5) + linear(xx, yy) + linear(xx - 0.5, yy - 0.5) + linear(xx, yy)) * 0.25;
    let amp = hash(fr(fr(fr(fr(jmod(x.floor(), 512.0) * fr(0.770)) + fr(jmod(y.floor(), 512.0) * fr(0.313))) + fr(salt * fr(1.37))) + fr(jmod(c.bucket, 256.0) * ts)));
    (raw * 2.0 - 1.0) * amp
}

unsafe fn soft(c: &Ctx, x: f64, y: f64, size: f64, salt: f64, ts: f64) -> f64 {
    let r = size * 0.5;
    let avg = (sample(c, x + r, y, size, salt, ts) + sample(c, x - r, y, size, salt, ts)
             + sample(c, x, y + r, size, salt, ts) + sample(c, x, y - r, size, salt, ts)) * 0.25;
    mix(sample(c, x, y, size, salt, ts), avg, clamp01(c.softness))
}

unsafe fn layers(c: &Ctx, x: f64, y: f64, ch: f64) -> f64 {
    (soft(c, x, y, c.size * c.fine_r, 3.0 + ch, fr(3.30277563773 + ch)) * c.fine_w
   + soft(c, x, y, c.size, 11.0 + ch, fr(19.61803398875 + ch)) * c.crystal_w
   + soft(c, x, y, c.size * c.cloud_r, 29.0 + ch, fr(7.41421356237 + ch)) * c.cloud_w) / c.wsum * c.development
}

unsafe fn rgb(x: f64, y: f64) -> [f64; 3] {
    let w = W as f64; let h = H as f64;
    let xc = clampn(x, 0.0, w - 1.0) as usize; let yc = clampn(y, 0.0, h - 1.0) as usize;
    let src = &*std::ptr::addr_of!(SRC);
    let i = (yc * W + xc) * 4;
    [src[i] as f64 / 255.0, src[i + 1] as f64 / 255.0, src[i + 2] as f64 / 255.0]
}
fn lum(c: [f64; 3]) -> f64 { c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114 }

// Uint8ClampedArray store: clamp, round half to even
fn u8c(v: f64) -> u8 {
    if !(v > 0.0) { return 0; }
    if v >= 255.0 { return 255; }
    let f = v.floor(); let d = v - f;
    let r = if d < 0.5 { f } else if d > 0.5 { f + 1.0 } else if (f as i64) % 2 == 0 { f } else { f + 1.0 };
    r as u8
}

#[no_mangle]
pub extern "C" fn grain_render() {
    unsafe {
        let p = &*std::ptr::addr_of!(PRM);
        let h_f = H as f64;
        let (scale, density) = if p[14] != 0.0 {
            if h_f < 700.0 { (2.0, 0.7) } else if h_f < 1100.0 { (1.0, 1.0) } else { (0.5, 0.85) }
        } else { (1.0, 1.0) };
        let ws = [jmax(p[6], 0.0), jmax(p[7], 0.0), jmax(p[8], 0.0)];
        let c = Ctx {
            w: W, h: H, bucket: p[11],
            softness: p[3], chroma: p[4], development: p[5],
            amount: p[0], strength: p[1],
            fine_w: ws[0], crystal_w: ws[1], cloud_w: ws[2],
            wsum: jmax(ws[0] + ws[1] + ws[2], 0.001),
            fine_r: p[19], cloud_r: p[20],
            size: jmax(0.3, p[2] * p[9]) * scale * clampn((1600.0 / jmax(h_f, 1.0)).sqrt(), 0.5, 1.0),
            density,
            mono: p[12] != 0.0, skew: p[13], debug: p[15] != 0.0, overlay: p[10] != 0.0,
            shadow: p[16], mid: p[17], high: p[18], stock: [p[21], p[22], p[23]],
        };
        let out = &mut *std::ptr::addr_of_mut!(OUT);
        for y in 0..H {
            for x in 0..W {
                let col = rgb(x as f64, y as f64);
                let l = lum(col);
                let px = x as f64 + 0.5; let py = h_f - y as f64 - 0.5;
                let result: [f64; 4];
                if c.debug {
                    let d = soft(&c, px, py, c.size, 11.0, fr(19.61803398875)) * 50.0;
                    result = [clamp01(col[0] + d), clamp01(col[1] + d), clamp01(col[2] + d), 1.0];
                } else {
                    let dev = (l - 0.4) / 0.45;
                    let adapt_l = clampn((-dev * dev).exp() + 0.12 * (1.0 - smooth(0.0, 0.30, l)) + 0.20 * smooth(0.5, 0.85, l), 0.0, 1.05);
                    let sw = 1.0 - smooth(0.0, 0.15, l); let hw = smooth(0.95, 1.0, l);
                    let mw = clamp01(1.0 - sw - hw);
                    let zone = sw * c.shadow + mw * c.mid + hw * c.high;
                    let mut a = 0.0; let mut b = 0.0;
                    for dy in -1..=1 { for dx in -1..=1 {
                        let v = lum(rgb(x as f64 + dx as f64, y as f64 + dy as f64));
                        a += v; b += v * v;
                    } }
                    let variance = jmax(0.0, b / 9.0 - (a / 9.0) * (a / 9.0));
                    let motion = smooth(0.02, 0.10, (l - lum(rgb(x as f64 + 2.0, y as f64))).abs()) * 0.2;
                    let amp = adapt_l * zone * (c.strength / 10.0) * c.amount * 1.4
                        * (1.0 - smooth(0.05, 0.35, 0.10) * 0.5) * mix(0.8, 1.2, 0.2)
                        * c.density * (1.0 - smooth(0.0, 0.008, variance) * 0.35) * (1.0 + 0.12 * motion);
                    let mut v = [layers(&c, px, py, 0.0), layers(&c, px, py, 17.0), layers(&c, px, py, 37.0)];
                    let gl = lum(v);
                    let skew = -c.skew * (l - 0.5);
                    if c.mono {
                        let z = gl + skew;
                        let m = z.signum() * z.abs().powf(0.85);
                        v = [m, m, m];
                    } else {
                        let cb = clamp01(c.chroma * 4.0);
                        for i in 0..3 { v[i] = (mix(v[i], gl, c.chroma) + skew) * mix(1.0, c.stock[i], cb); }
                    }
                    let gn = [v[0] * amp, v[1] * amp, v[2] * amp];
                    if c.overlay {
                        let alpha = clamp01(jmax(gn[0].abs(), jmax(gn[1].abs(), gn[2].abs())) * 8.0);
                        result = [
                            clamp01(col[0] + gn[0] / jmax(alpha, 0.001)) * alpha,
                            clamp01(col[1] + gn[1] / jmax(alpha, 0.001)) * alpha,
                            clamp01(col[2] + gn[2] / jmax(alpha, 0.001)) * alpha,
                            alpha,
                        ];
                    } else {
                        result = [clamp01(col[0] + gn[0]), clamp01(col[1] + gn[1]), clamp01(col[2] + gn[2]), 1.0];
                    }
                }
                let i = (y * W + x) * 4;
                for k in 0..4 { out[i + k] = u8c(result[k] * 255.0); }
            }
        }
    }
}
