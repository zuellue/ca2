# todo-01M5H5QWKJ5N69SKE4MEVG59H1 - 3 UI fixes (BEFORE grain round). Owner phonemsg-01M5H5QK7KAZ8E9JEN6MEX6S1H.
# Status: root causes found, NOT yet implemented. Repo clean at 9e2f777.

## Issue 1 - re-click focus FAIL (reproduced shape)
- Headless repro (t-reclick.js): panel CLOSED case works fine (hit=ac, focus returns, glyph fills).
- Real failure = panel OPEN: #secc (z-59) lane slides over #eadm (z-11), clicks on the circles hit #secc, never reach eg's click handler. First entry works only because arm() focuses programmatically.
- FIX (root): in gate IIFE window pointerdown handler, before dotHit check: if (armT && click inside eg.getBoundingClientRect()) box.focus(). Bypasses z-order. Optionally also raise #eadm z-index above 59 when .on - NOT enough alone (overlap is issue 3).
- Caret: CSS blink on active circle. Add: #eadm .ac.cur::after { content:''; width:2px; height:12px; background:var(--fg); animation:eadmblink 1s steps(1) infinite; } @keyframes eadmblink { 50% { opacity: 0; } }
  JS: updateCur() sets .cur on circle[box.value.length] when armed && document.activeElement===box; call on arm/disarm/input/focus/blur.

## Issue 2 - section circles tangent (desktop only)
- Gap = .sl margin-top:16px (persists at height:0). placeCircles sizes; addCirc builds .sci>.sc+.sl.
- FIX: index.html CSS: `#secc .sl { margin-top: 0; transition: height .25s ease, margin-top .25s ease; }` + `#secc .sl.on { margin-top: 16px; }` + mobile unchanged: `body[data-camode="m"] #secc .sl { margin-top: 16px; }` (mobile keeps current always-16 behaviour - owner said desktop only).
- ca2.js addCirc: startHover -> lb.classList.add('on'); endHover -> lb.classList.remove('on').
- Owner constraint: hover title paddings stay; open title must not touch button below -> the +14 in lb height stays (bottom padding), 16px margin-top when open (top padding). Closed circles touch like #eadm's.

## Issue 3 - hover label overlaps code circles -> widget slides down, returns
- Label (.sl) expands downward into #eadm's rect (same right lane, bottom-anchored widget).
- FIX: shared var eadmEl (set in gate IIFE, declared near admCircles). In addCirc startHover AFTER lb height set: if (eadmEl && eadmEl.classList.contains('on')) { overlap = (lb final bottom) - (eadmEl rect top) + 8; if (overlap > 0) eadmEl.style.transform = 'translateY(' + overlap + 'px)'; } In endHover: eadmEl && (eadmEl.style.transform = '').
- CSS: #eadm { transition: opacity .2s ease-out, transform .25s ease; }
- Label final bottom: r = lb.getBoundingClientRect(); final bottom = r.top + parseFloat(lb.style.height). eadm top from getBoundingClientRect (before transform).

## Test plan (headless, harness H, ports 8470/8471)
- t-reclick.js extended: with panel HOVER-OPEN, click circle -> activeElement is the input; typing fills glyph; caret class present.
- tangent: measure gap between consecutive .sc rects = 0 closed; hover a section -> label open keeps 16px above title and +14 below; body[data-camode=m] unchanged (16px).
- overlap: arm widget, hover SWITCHES (last section) -> eadm transform translateY > 0, rects no longer intersect; leave -> transform cleared. Screenshots before/after.
- Commit small, push, live curl verify, report Turkish measured.
