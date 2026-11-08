import re, sys

Mm = (1 << 64) - 1
def make_rng(seed0, seed1, n):
    X = ((seed0 << 32) | 0x9E3779B9) & Mm
    Y = ((seed1 << 32) | 0x85EBCA6B) & Mm
    out = []
    for _ in range(n):
        x, y = X, Y
        X = y
        x ^= (x << 23) & Mm
        Y = (x ^ y ^ (x >> 17) ^ (y >> 26)) & Mm
        out.append((((Y + y) & Mm) >> 11) / 9007199254740992)
    return out

S = make_rng(1002, 5002, 80000)

def parse_states(path):
    # Per-state order: [warmup][JS step0][BORN st=0 dump][JS step1][BORN st=1 dump]; next state's warmup follows.
    # Step-1 data for state k: JS events strictly between BORN-st=0-header and BORN-st=1-header; BORNC st=1 after the st=1 header.
    raw = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            m = re.match(r'BORN st=(\d+) pack\.n=(\d+)', line)
            if m:
                raw.append(('BORN', {'st': int(m.group(1)), 'n': int(m.group(2))}))
                continue
            if line.startswith('UPD '):
                raw.append(('UPD', {'rc': int(re.search(r'rc=(\d+)', line).group(1))}))
            elif line.startswith('INTR '):
                raw.append(('INTR', dict(re.findall(r'(\w+)=([-+\d.e]+)', line))))
            elif line.startswith('INTE '):
                raw.append(('INTE', {'rc': int(re.search(r'rc=(\d+)', line).group(1))}))
            elif line.startswith('DIVP '):
                raw.append(('DIVP', dict(re.findall(r'(\w+)=([-+\d.e]+)', line))))
            elif line.startswith('DIVEND '):
                raw.append(('DIVEND', {'rc': int(re.search(r'rc=(\d+)', line).group(1))}))
            elif line.startswith('BORNC st=1 '):
                raw.append(('BORNC', dict(re.findall(r'(\w+)=([-+\d.e,]+)', line))))
    hdr0 = [i for i, (k, d) in enumerate(raw) if k == 'BORN' and d['st'] == 0]
    segs = []
    prev_end = 0
    for hi, i0 in enumerate(hdr0):
        # JS block for this state: prev_end .. i0 (both steps' JS events; step 1 = after the first 30 UPDs)
        js_block = [e for e in raw[prev_end:i0] if e[0] != 'BORN']
        i1 = next((j for j in range(i0 + 1, len(raw)) if raw[j][0] == 'BORN' and raw[j][1]['st'] == 1), None)
        if i1 is None:
            break
        end = hdr0[hi + 1] if hi + 1 < len(hdr0) else len(raw)
        bornc = [d for k, d in raw[i1 + 1:end] if k == 'BORNC']
        # step-1 JS events: after the first 30 UPDs of the block
        upd_seen = 0
        js_part = []
        for kind, d in js_block:
            if kind == 'UPD':
                upd_seen += 1
            if upd_seen > 30:
                js_part.append((kind, d))
        segs.append((js_part, bornc))
        prev_end = end
    return segs

def ang_pos(ang):
    for q in range(len(S)):
        if S[q] * 6.2832 == ang:
            return q
    return None

def analyze(js_part, bornc, label):
    upd_total = sum(1 for k, d in js_part if k == 'UPD')
    upd_ord = 0
    cur_cell = None
    js_divides = []
    js_events = []
    wasm_divides = []
    for idx, (kind, d) in enumerate(js_part):
        if kind == 'UPD':
            upd_ord += 1
            cur_cell = upd_total - upd_ord
            js_events.append(('UPD', d['rc'], cur_cell, None, idx))
        elif kind == 'INTR':
            js_events.append(('INTR', int(d['rc']), cur_cell, d, idx))
        elif kind == 'INTE':
            js_events.append(('INTE', d['rc'], cur_cell, None, idx))
        elif kind == 'DIVP':
            p = ang_pos(float(d['ang']))
            js_divides.append({'cell': cur_cell, 'ang_pos': p})
            js_events.append(('DIVP', int(d['rc']), cur_cell, {'ang_pos': p}, idx))
        elif kind == 'DIVEND':
            js_events.append(('DIVEND', d['rc'], cur_cell, None, idx))
    for d in bornc:
        host = float(d['host'])
        p = None
        for q in range(len(S)):
            if S[q] == host:
                p = q
                break
        if p is None:
            continue
        smod_ok = abs(0.7 + S[p + 1] * 1.6 - float(d['smod'])) < 1e-15
        wasm_divides.append({'start': p - 4, 'smod_ok': smod_ok})
    if any(j['ang_pos'] is None for j in js_divides):
        print('%s: UNMATCHED JS ang (%d/%d)' % (label, sum(1 for j in js_divides if j['ang_pos'] is None), len(js_divides)))
        return
    js_divides.sort(key=lambda z: z['ang_pos'])
    wasm_divides.sort(key=lambda z: z['start'])
    if len(js_divides) != len(wasm_divides):
        print('%s: divide count js=%d wasm=%d' % (label, len(js_divides), len(wasm_divides)))
        return
    first_bad = None
    for k in range(len(js_divides)):
        if js_divides[k]['ang_pos'] != wasm_divides[k]['start']:
            first_bad = k
            break
    if first_bad is None:
        print('%s: FULLY ALIGNED (%d divides, smod fails %d)' % (label, len(js_divides), sum(1 for w in wasm_divides if not w['smod_ok'])))
        return
    if first_bad == 0:
        print('%s: diverges at FIRST divide js=%s wasm=%s' % (label, js_divides[0]['ang_pos'], wasm_divides[0]['start']))
        return
    js_prev_end = js_divides[first_bad - 1]['ang_pos'] + 12
    w_prev_end = wasm_divides[first_bad - 1]['start'] + 12
    js_next = js_divides[first_bad]['ang_pos']
    w_next = wasm_divides[first_bad]['start']
    delta = (w_next - w_prev_end) - (js_next - js_prev_end)
    print('%s: aligned=%d span js=%d wasm=%d delta=%+d (next dividing cell %s)' % (label, first_bad, js_next - js_prev_end, w_next - w_prev_end, delta, js_divides[first_bad]['cell']))
    ev = js_events
    for t, (kind, rc, cell, d, idx) in enumerate(ev):
        if not (js_prev_end <= rc < js_next):
            continue
        if kind == 'INTR':
            inte = next((e for u in range(t + 1, len(ev)) if ev[u][0] == 'INTE' for e in [ev[u][1]]), None)
            print('   pair ai=%s bi=%s dist=%.3g jsdraws=%s | eb=%s er=%s mg=%s fb=%s pb=%s rb=%s' % (d['ai'], d['bi'], float(d['dist']), (inte - rc) if inte is not None else '?', d['eb'], d['er'], d['mg'], d['fb'], d['pb'], d['rb']))
        elif kind == 'UPD':
            print('   UPD rc=%d cell=%s' % (rc, cell))

for path in sys.argv[1:]:
    segs = parse_states(path)
    print('==== %s: %d states' % (path, len(segs)))
    for i, (js_part, bornc) in enumerate(segs):
        analyze(js_part, bornc, '  state%d' % i)
