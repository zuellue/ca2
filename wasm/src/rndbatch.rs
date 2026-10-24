// rndbatch: batched real-Math.random transport (feature jsrndbatch, builds on the jsrnd ABI).
// One shared f64 buffer + one shared [cur,end] cursor, both in wasm linear memory, manipulated
// by Rust (next()) and by JS (the Math.random override and the env.js_rnd_fill import).
// Fill-on-exhaust only: a refill happens exactly when cur==end, so stream value k always goes to
// the consumer that advances the cursor past k - the same global value assignment as per-draw
// env.js_rnd (jsrnd=1), with one boundary crossing per N draws instead of one per draw.
pub const N: usize = 8192;
static mut BUF: [f64; N] = [0.0; N];
static mut META: [u32; 2] = [0, 0]; // [cur, end]
#[link(wasm_import_module = "env")]
extern "C" { fn js_rnd_fill(); }
#[no_mangle] pub extern "C" fn sim_rndbuf_ptr() -> *mut f64 { unsafe { std::ptr::addr_of_mut!(BUF) as *mut f64 } }
#[no_mangle] pub extern "C" fn sim_rndmeta_ptr() -> *mut u32 { unsafe { std::ptr::addr_of_mut!(META) as *mut u32 } }
#[no_mangle] pub extern "C" fn sim_rndcap() -> u32 { N as u32 }
#[cold]
#[inline(never)]
fn refill() {
    unsafe {
        js_rnd_fill(); // JS contract: BUF[0..N] = next N values of the real stream, META = [0, N]
        let mp = std::ptr::addr_of_mut!(META);
        if (*mp)[1] == 0 || (*mp)[1] as usize > N || (*mp)[0] >= (*mp)[1] { panic!("js_rnd_fill contract broken"); }
    }
}
#[inline(always)]
pub fn next() -> f64 {
    unsafe {
        let mp = std::ptr::addr_of_mut!(META);
        let mut i = (*mp)[0] as usize;
        if i >= (*mp)[1] as usize { refill(); i = (*mp)[0] as usize; }
        // i < end <= N by the refill contract, so the index is in bounds
        let v = *std::ptr::addr_of!(BUF).cast::<f64>().add(i);
        (*mp)[0] = (i + 1) as u32;
        v
    }
}
// microbench: k draws summed; isolates the per-draw buffer path cost from sim_step
#[no_mangle]
pub extern "C" fn sim_rndbatch_bench(k: u32) -> f64 { let mut s = 0.0; for _ in 0..k { s += next(); } s }
