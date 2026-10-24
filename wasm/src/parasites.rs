// ca2core parasites step (port of stepParasites): free parasites seek the nearest cell (clustered
// cells preferred), attach as a host, orbit it and drain its energy; starve off past parasiteHard,
// split when fed. JS keeps object identity: hosts come back as cell indices, energy drains write
// back to the packed cell rows. in cells: n x 5 (x, y, radius, cl, alive); energy in/out: n x 1.
// in parasites: m x 9 (x, y, e, host index or -1, a, ph, lost ms, cursor-latch x, cursor-latch y) + a 16-slot
// tail: the cursor-mistake pack (mouse x, mouse y, over, on, believeMs, retK, phantomR, cont x, cont y,
// cont w, cont h, beliefR, cooldownMs, rearmPx, 2 spare). The latch (<=-1e17: none) parks the cursor position
// where the belief ended; a new belief needs the cursor rearmPx away from it - a parked cursor never re-fools.
// out parasites: q x 10 (x, y, e, host idx, a, ph, lost, latch x, latch y, src or -1).
// out cell energy: n x 1 (full write-back). stat: pdeath, pbirth, rehost, spawned.
pub struct Pa { pub ci: Vec<f64>, pub en: Vec<f64>, pub pi: Vec<f64>, pub po: Vec<f64>, pub stat: [f64; 4], s0: u64, s1: u64 }
pub static mut PA: Option<Pa> = None;
pub fn pa() -> &'static mut Pa {
    unsafe {
        let s = &mut *std::ptr::addr_of_mut!(PA);
        if s.is_none() { *s = Some(Pa { ci: vec![], en: vec![], pi: vec![], po: vec![], stat: [0.0; 4], s0: 1, s1: 2 }); }
        s.as_mut().unwrap()
    }
}
#[cfg(not(feature = "jsrnd"))] fn hyp(x: f64, y: f64) -> f64 { (x * x + y * y).sqrt() }
#[cfg(feature = "jsrnd")] fn hyp(x: f64, y: f64) -> f64 { crate::circles::hypot2(x, y) } // JS Math.hypot
#[cfg(not(feature = "jsrnd"))] fn fsin(x: f64) -> f64 { x.sin() }
#[cfg(feature = "jsrnd")] fn fsin(x: f64) -> f64 { crate::fdm::sin(x) } // V8 fdlibm sin
#[cfg(not(feature = "jsrnd"))] fn fcos(x: f64) -> f64 { x.cos() }
#[cfg(feature = "jsrnd")] fn fcos(x: f64) -> f64 { crate::fdm::cos(x) }
#[cfg(feature = "jsrnd")] #[link(wasm_import_module = "env")] extern "C" { fn js_rnd(line: u32) -> f64; }
fn lerp(a: f64, b: f64, t: f64) -> f64 { a + (b - a) * t }
impl Pa {
    fn r01(&mut self) -> f64 {
        #[cfg(feature = "jsrnd")] { return unsafe { js_rnd(7) }; } // jsrnd spike: the real Math.random stream
        #[allow(unreachable_code)]
        let (mut x, y) = (self.s0, self.s1);
        self.s0 = y; x ^= x << 23; self.s1 = x ^ y ^ (x >> 17) ^ (y >> 26);
        ((self.s1.wrapping_add(y)) >> 11) as f64 * (1.0 / 9007199254740992.0)
    }
    #[allow(clippy::too_many_arguments)]
    pub fn step(&mut self, n: usize, m: usize, now: f64, on: bool, frac: f64, sight: f64, nerv: f64, drain: f64, eff: f64, hard: f64, hard_ms: f64, s0: f64, s1: f64) -> i64 {
        #[cfg(not(feature = "jsrnd"))] { self.s0 = ((s0 as u64) << 32) | 0x9E3779B9; self.s1 = ((s1 as u64) << 32) | 0x85EBCA6B; for _ in 0..8 { self.r01(); } }
        #[cfg(feature = "jsrnd")] { let _ = (s0, s1); }
        self.stat = [0.0; 4]; self.po.clear();
        if self.ci.len() < n * 5 || self.en.len() < n || self.pi.len() < m * 9 + 14 { return -1; }
        if !on || n == 0 { return 0; } // JS: parasites.length = 0
        for i in 0..n { if !(self.ci[i * 5].is_finite() && self.ci[i * 5 + 1].is_finite()) { return -1; } }
        let target = (n as f64 * frac).round() as i64;
        // host parasite counts (pc)
        let mut pc = vec![0f64; n];
        for i in 0..m { let h = self.pi[i * 9 + 3]; if h >= 0.0 && (h as usize) < n { pc[h as usize] += 1.0; } }
        let mut ps: Vec<[f64; 10]> = (0..m).map(|i| { let b = i * 9; [self.pi[b], self.pi[b + 1], self.pi[b + 2], self.pi[b + 3], self.pi[b + 4], self.pi[b + 5], self.pi[b + 6], self.pi[b + 7], self.pi[b + 8], i as f64] }).collect();
        // exact JS array algorithm (stepParasitesCore, coordinator ruling 19:07): the spawned newborn is
        // pushed BEFORE the backward loop and IS processed this frame (first); deaths splice in place;
        // births append at the end and are not visited this frame; the birth gate reads the live length.
        if (ps.len() as i64) < target && self.r01() < 0.08 {
            let c = (self.r01() * n as f64).floor() as usize % n;
            ps.push([self.ci[c * 5], self.ci[c * 5 + 1], 6.0, -1.0, self.r01() * 6.2832, 0.0, 0.0, -1e18, -1e18, -1.0]);
            self.stat[3] += 1.0;
        }
        let tt = now / 1000.0;
        let mut i: i64 = ps.len() as i64 - 1;
        while i >= 0 {
            let rec = ps[i as usize];
            let (mut x, mut y, mut e, mut host, mut a, ph0, mut lost, mut clx, mut cly, src) = (rec[0], rec[1], rec[2], rec[3], rec[4], rec[5], rec[6], rec[7], rec[8], rec[9]);
            if host >= 0.0 && (host as usize >= n || self.ci[host as usize * 5 + 4] == 0.0) { host = -1.0; lost = now; }
            if host < 0.0 {
                let mut best: i64 = -1; let mut bd = sight * sight;
                if lost == 0.0 { lost = now; }
                let ph = if ph0 == 0.0 { self.r01() * 6.28 } else { ph0 };
                for j in 0..n {
                    let b = j * 5;
                    let mut d = (self.ci[b] - x) * (self.ci[b] - x) + (self.ci[b + 1] - y) * (self.ci[b + 1] - y);
                    if self.ci[b + 3] != 0.0 { d *= 0.5; }
                    if d < bd { bd = d; best = j as i64; }
                }
                let mut phn = ph;
                // cursor mistake (owner 23 Oct): a hostless parasite can take the cursor for a cell - it chases
                // the phantom for believeMs, gives up, and tries to re-enter the plate. a <= -1e9 marks the
                // belief (start time = -a - 1e9; the orbit angle only matters once hosted, and it can drift
                // negative, so the marker lives far below any orbit angle). Mouse + params: the pa_in tail.
                // JS mirror: the hostless branch of stepParasitesCore (same draws, same order).
                let tb = m * 9;
                let (cmx, cmy) = (self.pi[tb], self.pi[tb + 1]);
                let cu_on = self.pi[tb + 3] != 0.0 && self.pi[tb + 2] != 0.0;
                let (believe_ms, ret_k, phantom_r) = (self.pi[tb + 4], self.pi[tb + 5], self.pi[tb + 6]);
                let cd_ms = self.pi[tb + 12];
                let rearm_px = self.pi[tb + 13];
                let (bx0, by0) = (self.pi[tb + 7], self.pi[tb + 8]);
                let (bx1, by1) = (bx0 + self.pi[tb + 9], by0 + self.pi[tb + 10]);
                if a <= -2e9 && now >= -a - 2e9 { a = 0.0; } // re-belief wait elapsed - a parked cursor does not re-fool at once
                if a <= -1e9 && a > -2e9 {
                    let cu_t = -a - 1e9;
                    let el = now - cu_t; // el < 0: timestamp from another clock epoch - treat as expired
                    if cu_on && el >= 0.0 && el < believe_ms {
                        let dm2 = (cmx - x) * (cmx - x) + (cmy - y) * (cmy - y);
                        if best >= 0 && bd < dm2 { a = -2e9 - (now + cd_ms); clx = cmx; cly = cmy; } // a real cell nearer breaks the illusion; no instant re-belief
                        else {
                            let dd0 = dm2.sqrt(); let dd = if dd0 == 0.0 { 1.0 } else { dd0 };
                            let osc = crate::fdm::sin((tt * (2.0 + 2.0 * nerv) + ph) % 6.283185307179586);
                            let want = phantom_r * (1.1 + 0.5 * nerv * (1.0 + osc));
                            let dir = if dd > want { 1.0 } else { -0.6 * nerv };
                            let sp = (6.0f64).min((1.2f64).max(dd * 0.08)) * (1.0 + 0.5 * nerv * osc);
                            x += (cmx - x) / dd * sp * dir + (self.r01() - 0.5) * 2.0 * nerv;
                            y += (cmy - y) / dd * sp * dir + (self.r01() - 0.5) * 2.0 * nerv;
                        }
                    } else if x > bx0 && x < bx1 && y > by0 && y < by1 { a = -2e9 - (now + cd_ms); clx = cmx; cly = cmy; } // back inside: the mistake is over, no instant re-belief
                    else {
                        let rtx = x.max(bx0).min(bx1); let rty = y.max(by0).min(by1);
                        let (rdx, rdy) = (rtx - x, rty - y);
                        let rdd = hyp(rdx, rdy);
                        if rdd < 2.0 { a = -2e9 - (now + cd_ms); clx = cmx; cly = cmy; }
                        else {
                            let rsp = (6.0f64).min((1.2f64).max(rdd * 0.08)) * ret_k;
                            x += rdx / rdd * rsp + (self.r01() - 0.5) * 2.0 * nerv;
                            y += rdy / rdd * rsp + (self.r01() - 0.5) * 2.0 * nerv;
                        }
                    }
                } else if cu_on && a > -1e9 {
                    let dm2 = (cmx - x) * (cmx - x) + (cmy - y) * (cmy - y);
                    let br = self.pi[tb + 11];
                    let armed = !(clx > -1e17) || hyp(cmx - clx, cmy - cly) > rearm_px; // no latch, or the cursor actually moved since
                    if dm2 < br * br && (best < 0 || dm2 < bd) && armed { a = -now - 1e9; } // believes: the cursor is a cell (nearer than any real one)
                }
                if !(a <= -1e9 && a > -2e9) && best >= 0 { // cooling parasites behave normally, only the cursor is off-limits
                    let b = best as usize * 5;
                    let dd = bd.sqrt().max(1e-9); let dd = if bd.sqrt() == 0.0 { 1.0 } else { dd };
                    let osc = fsin(tt * (2.0 + 2.0 * nerv) + ph);
                    let want = self.ci[b + 2] * (1.1 + 0.5 * nerv * (1.0 + osc));
                    let dir = if dd > want { 1.0 } else { -0.6 * nerv };
                    let sp = (6.0f64).min((1.2f64).max(dd * 0.08)) * (1.0 + 0.5 * nerv * osc);
                    x += (self.ci[b] - x) / dd * sp * dir + (self.r01() - 0.5) * 2.0 * nerv;
                    y += (self.ci[b + 1] - y) / dd * sp * dir + (self.r01() - 0.5) * 2.0 * nerv;
                    if hyp(self.ci[b] - x, self.ci[b + 1] - y) < self.ci[b + 2] { if a <= -1e9 { a = 0.0; } clx = -1e18; cly = -1e18; host = best as f64; lost = 0.0; self.stat[2] += 1.0; } // a cooldown band never becomes an orbit angle; hosting clears the latch
                }
                if now - lost > hard_ms { e -= 0.004; }
                ps[i as usize] = [x, y, e, host, a, phn, lost, clx, cly, src];
                if e <= -hard { ps.remove(i as usize); self.stat[0] += 1.0; i -= 1; continue; }
                if e > 12.0 && (ps.len() as f64) < n as f64 * 0.8 + 3.0 { ps[i as usize][2] /= 2.0; ps.push([x, y, e / 2.0, host, self.r01() * 6.2832, 0.0, 0.0, -1e18, -1e18, -1.0]); self.stat[1] += 1.0; }
            } else {
                let h = host as usize; let b = h * 5;
                let nvr = 0.85 + 0.2 * nerv * fsin(now / 400.0 + ph0);
                let tx = self.ci[b] + fcos(a) * self.ci[b + 2] * nvr;
                let ty = self.ci[b + 1] + fsin(a) * self.ci[b + 2] * nvr;
                a += 0.01 + 0.03 * nerv * fsin(now / 700.0 + ph0);
                x = lerp(x, tx, 0.5); y = lerp(y, ty, 0.5);
                let crowd = (pc[h] - 1.0).max(0.0);
                let dr = drain * (0.4 + self.en[h].min(20.0) * 0.03) / (1.0 + 0.4 * crowd);
                self.en[h] -= dr; e += dr * eff - 0.012 * (1.0 + 0.7 * crowd);
                ps[i as usize] = [x, y, e, host, a, ph0, lost, clx, cly, src];
                if e <= -hard { ps.remove(i as usize); self.stat[0] += 1.0; i -= 1; continue; }
                if e > 12.0 && (ps.len() as f64) < n as f64 * 0.8 + 3.0 { ps[i as usize][2] /= 2.0; ps.push([x, y, e / 2.0, host, self.r01() * 6.2832, 0.0, 0.0, -1e18, -1e18, -1.0]); self.stat[1] += 1.0; }
            }
            i -= 1;
        }
        for p in ps.iter() { self.po.extend_from_slice(p); }
        self.po.len() as i64 / 10
    }
}
