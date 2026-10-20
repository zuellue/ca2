# ca2 todo (owner orders pending, 20 Oct 2026; each is a verbatim owner order relayed by main)
Done + live (sim side): intro jank deferral (staged first spawn after UI intro, metaball/grain/audio deferred, introStat in __ca2), eating radius fixed px (foodEatR migrated: factor x preset CELL_RADIUS), boundary zone independent of cell radius (boundZoneR/edgeFit knobs removed, keys kept), boundary edge/corner hover cursors.
Done + live: preset 2 default (STORE_V 6), admin/global preset (Worker https://ca2-presets.middots.workers.dev/, KV ca2-presets, binding PRESETS; code 2222 checked server-side), config left thin line removed.
Pending, in order:
1. section circles on config right edge (title-dot size, stroke-only, hover fills random R/G/B + vertical typewriter label, Fragment Mono uppercase; stacked from title top circle, no margin, hover pushes the ones below, click folds/unfolds section)
2. config knobs animate cellular-automata style on hover
3. double-click on value text -> blinking cursor manual entry; manual may override min/max; knob stays within min/max
5. cursor sensitivity default higher + new param directly above cursor size
6. hierarchical sorting of config params (sections/subgroups), keep all keys (before/after count), keep preset keys
7. knob double-click CA-mode params must be saved in preset JSON, survive reload, be stored in admin global preset
8. config backdrop blur: right-to-left gradient to sharp, width parameter (in preset)
9. config panel width parameter (in preset)
11. remove line under config section titles
