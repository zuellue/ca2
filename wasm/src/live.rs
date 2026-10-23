// Port of the stepLive CA generation (ca2.js): per live knob CA row, running rank distribution, soft walk -> target value.
// State (bits, rank history, lcg state, generation, walk) is resident here; JS passes occupancy (plate rows) and reads one target back.
// Exact port: same lcg draw order, f64 arithmetic in the same order as the JS source, so targets are bit-identical (devtools/t136).
const N: usize = 28;
pub struct Live { bits: [u8; N], hist: Vec<f64>, st: u32, gen: u32, walk: f64, has_walk: bool }
pub static mut LIVES: Vec<Live> = Vec::new();
pub static mut BUF: [f64; 64] = [0.0; 64]; // 0..28 bits in/out, 28..56 plate occupancy in
fn lcg(s: &mut u32) -> f64 { *s = s.wrapping_mul(1664525).wrapping_add(1013904223); *s as f64 / 4294967296.0 }
fn clamp(v: f64, a: f64, b: f64) -> f64 { if v < a { a } else if v > b { b } else { v } }
#[allow(static_mut_refs)]
pub fn init(slot: usize, st: f64) {
    unsafe {
        while LIVES.len() <= slot { LIVES.push(Live { bits: [0; N], hist: Vec::new(), st: 0, gen: 0, walk: 0.0, has_walk: false }); }
        let l = &mut LIVES[slot]; l.st = st as u32; l.gen = 0; l.hist.clear(); l.has_walk = false;
        for i in 0..N { l.bits[i] = BUF[i] as u8; }
    }
}
#[allow(static_mut_refs)]
pub fn gen(slot: usize, rule: f64, plate: bool, shift: f64, q2: f64, q3: f64, cap: f64) -> f64 {
    unsafe {
        let l = &mut LIVES[slot]; let n = N; let rule = rule as i64;
        l.gen = l.gen.wrapping_add(1);
        let mut nb = [0u8; N]; let mut sum = 0i64; let mut same = true;
        for i in 0..n { nb[i] = ((rule >> (l.bits[(i + n - 1) % n] as i64 * 4 + l.bits[i] as i64 * 2 + l.bits[(i + 1) % n] as i64)) & 1) as u8; sum += nb[i] as i64; if nb[i] != l.bits[i] { same = false; } }
        let sh = shift as usize;
        if plate { sum = 0; for i in 0..n { nb[i] ^= BUF[28 + (i + sh) % n] as u8; sum += nb[i] as i64; } same = false; }
        if sum == 0 || sum == n as i64 || same {
            for _ in 0..3 { let k = (lcg(&mut l.st) * n as f64).floor() as usize; nb[k] ^= 1; }
            if sum == 0 { let k = (lcg(&mut l.st) * n as f64).floor() as usize; nb[k] = 1; }
        }
        let k = (lcg(&mut l.st) * n as f64).floor() as usize; nb[k] ^= 1;
        l.bits = nb;
        let r0 = ((l.gen as usize) * 7 + sh) % n; let mut rd = 0.0f64; let mut wt = 0.5f64;
        for i in 0..12 { rd += nb[(r0 + i) % n] as f64 * wt; wt *= 0.5; }
        rd = clamp(rd * 4096.0 / 4095.0, 0.0, 1.0);
        let mut lo = 0.0f64; for h in &l.hist { if *h < rd { lo += 1.0; } }
        let hl = l.hist.len() as f64;
        let rk = if l.hist.len() > 8 { (lo + lcg(&mut l.st)) / (hl + 1.0) } else { rd };
        l.hist.push(rd); if l.hist.len() > 300 { l.hist.remove(0); }
        if !l.has_walk { l.walk = rk; l.has_walk = true; }
        l.walk += (rk - l.walk) * 0.7;
        let a = clamp(0.5 + (l.walk - 0.5) * 1.3, 0.0, 1.0);
        for i in 0..n { BUF[i] = nb[i] as f64; }
        BUF[56] = l.st as f64; BUF[57] = l.walk;
        q2 + (q3 - q2) * a * cap
    }
}

pub static mut HB: [f64; 304] = [0.0; 304]; // rank history out (for a wasm->JS transition)
#[allow(static_mut_refs)]
pub fn hist_out(slot: usize) -> usize { unsafe { let l = &LIVES[slot]; for (i, h) in l.hist.iter().enumerate() { HB[i] = *h; } l.hist.len() } }
#[allow(static_mut_refs)]
pub fn state_out(slot: usize) { unsafe { let l = &LIVES[slot]; for i in 0..N { BUF[i] = l.bits[i] as f64; } BUF[56] = l.st as f64; BUF[57] = if l.has_walk { l.walk } else { f64::NAN }; BUF[58] = l.gen as f64; } }
