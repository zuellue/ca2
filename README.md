# ca2

Cellular automaton. Latest sketch (`ca2.pde`, from rr2ll2ia3target11) plus a browser version (`index.html`, `ca2.js`) with a config panel in the sketch's own design (Ca2-Thin, hairlines, no boxes).

- `ca2.pde` - Processing sketch. Changes vs the original: equal margin on every edge (`EDGE_MARGIN`), fixed vertical center line that stays `LINE_GAP` away from the top/bottom numbers, horizontal line with the same gap to the side numbers, area outline without rounded corners (each side stops `containerCornerRadius` short of the corners), area clamped between the typography rows. Not compiled in Processing here.
- `rr2ll2ia3target11.original.pde` - the sketch exactly as received, for diffing.
- `Ca2-Thin.ttf` - font used by the sketch (`createFont("Ca2-Thin", ...)`).
- Live: https://ca.abdupala.com
