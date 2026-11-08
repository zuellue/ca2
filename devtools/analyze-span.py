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

S = make_rng(1002, 5002, 40000)

def find_pos(val, lo=0, hi=None):
    hi = hi or len(S)
    for p in range(lo, hi):
        if S[p] == val:
            return p
    return None

def parse(path):
    evs = []  # (kind, dict)
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line.startswith('UPD '):
                evs.append(('UPD', {'rc': int(re.search(r'rc=(\d+)', line).group(1))}))
            elif line.startswith('INTR '):
                d = dict(re.findall(r'(\w+)=([-+\d.e]+)', line))
                evs.append(('INTR', d))
            elif line.startswith('INTE '):
                evs.append(('INTE', {'rc': int(re.search(r'rc=(\d+)', line).group(1))}))
            elif line.startswith('DIVP '):
                d = dict(re.findall(r'(\w+)=([-+\d.e]+)', line))
                evs.append(('DIVP', d))
            elif line.startswith('DIVEND '):
                evs.append(('DIVEND', {'rc': int(re.search(r'rc=(\d+)', line).group(1))}))
            elif line.startswith('BORNC st=1 '):
                d = dict(re.findall(r'(\w+)=([-\d.e,]+)', line))
                evs.append(('BORNC', d))
    # step 0 = first 30 UPDs (initial population 30)
    upd_seen = 0
    step1 = []
    for kind, d in evs:
        if kind == 'UPD':
            upd_seen += 1
        if upd_seen <= 30:
            continue
        step1.append((kind, d))
    return step1

for path in sys.argv[1:]:
    print('====', path)
    step1 = parse(path)
    # JS events: assign cell indices; first step-1 UPD = cell 57 (population 58 at step start)
    upd_ord = 0
    js_divides = []
    js_events = []  # all step-1 JS events with stream positions where known
    cur_cell = None
    for kind, d in step1:
        if kind == 'UPD':
            upd_ord += 1
            cur_cell = 58 - upd_ord
            js_events.append(('UPD', d['rc'], cur_cell, None))
        elif kind == 'INTR':
            js_events.append(('INTR', int(d['rc']), cur_cell, d))
        elif kind == 'INTE':
            js_events.append(('INTE', d['rc'], cur_cell, None))
        elif kind == 'DIVP':
            ang = float(d['ang'])
            p = find_pos(ang / 6.2832)  # approximate; verify below
            # verify exact: S[p]*6.2832 == ang
            ok = p is not None and abs(S[p] * 6.2832 - ang) == 0.0
            if not ok:
                # search by exact product
                p = None
                for q in range(len(S)):
                    if S[q] * 6.2832 == ang:
                        p = q
                        break
            js_divides.append({'cell': cur_cell, 'ang_pos': p, 'rc': int(d['rc']), 'px': float(d['px']), 'py': float(d['py'])})
            js_events.append(('DIVP', int(d['rc']), cur_cell, {'ang_pos': p}))
        elif kind == 'DIVEND':
            js_events.append(('DIVEND', d['rc'], cur_cell, None))
    # wasm divides from BORNC
    wasm_divides = []
    for kind, d in step1:
        if kind != 'BORNC':
            continue
        host = float(d['host'])
        p = find_pos(host)
        if p is None:
            print('  BORNC slot', d['slot'], 'host NOT FOUND in stream')
            continue
        smod_ok = abs(0.7 + S[p + 1] * 1.6 - float(d['smod'])) < 1e-15
        wasm_divides.append({'slot': int(d['slot']), 'start': p - 4, 'host_pos': p, 'smod_ok': smod_ok, 'x': float(d['x']), 'y': float(d['y'])})
    js_divides.sort(key=lambda z: z['ang_pos'])
    wasm_divides.sort(key=lambda z: z['start'])
    print('  JS divides:', len(js_divides), ' wasm divides:', len(wasm_divides), ' smod crosscheck fails:', sum(1 for w in wasm_divides if not w['smod_ok']))
    n = min(len(js_divides), len(wasm_divides))
    first_bad = None
    for k in range(n):
        if js_divides[k]['ang_pos'] != wasm_divides[k]['start']:
            first_bad = k
            break
    if first_bad is None and len(js_divides) != len(wasm_divides):
        first_bad = n
    print('  aligned divides:', first_bad if first_bad is not None else n)
    if first_bad is None:
        continue
    lo = max(0, first_bad - 2)
    print('  JS  around:', [(d['cell'], d['ang_pos']) for d in js_divides[lo:first_bad + 3]])
    print('  WAsm around:', [(w['slot'], w['start']) for w in wasm_divides[lo:first_bad + 3]])
    # span analysis between last aligned divide and first misaligned
    if first_bad > 0:
        js_prev_end = js_divides[first_bad - 1]['ang_pos'] + 12
        w_prev_end = wasm_divides[first_bad - 1]['start'] + 12
        js_next = js_divides[first_bad]['ang_pos']
        w_next = wasm_divides[first_bad]['start']
        print('  SPAN js draws=%d wasm draws=%d delta=%+d' % (js_next - js_prev_end, w_next - w_prev_end, (w_next - w_prev_end) - (js_next - js_prev_end)))
        print('  JS events in span (rc from %d to %d):' % (js_prev_end, js_next))
        for kind, rc, cell, d in js_events:
            lo_rc = rc
            # rc counts draws consumed; stream position of next draw = rc
            if js_prev_end <= lo_rc - 1 < js_next or js_prev_end <= lo_rc <= js_next:
                if kind == 'INTR':
                    print('    INTR rc=%s cell=%s ai=%s bi=%s dist=%.4g eb=%s er=%s mg=%s fb=%s pb=%s rb=%s' % (rc, cell, d['ai'], d['bi'], float(d['dist']), d['eb'], d['er'], d['mg'], d['fb'], d['pb'], d['rb']))
                else:
                    print('    %s rc=%s cell=%s' % (kind, rc, cell))
