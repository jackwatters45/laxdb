# Lacrosse whiteboard research and v1 decisions

## Evidence

- Men’s and women’s fields are not cosmetic variants. NCAA men’s markings include 110-by-60-yard geometry, 15-yard goal-line setbacks, creases, restraining lines, and wing areas. NCAA women’s fields add the 8-meter arc, 12-meter fan, goal circle, restraining lines, center circle, hashes, and restart dots. Sources: [NCAA men’s 2025–26 rules](https://ncaaorg.s3.amazonaws.com/championships/sports/lacrosse/rules/men/PRMLA_RulesBook.pdf), [NCAA women’s 2026–27 rules](https://ncaaorg.s3.amazonaws.com/championships/sports/lacrosse/rules/women/PRWLA_RulesBook.pdf), and [USA Lacrosse field diagrams](https://www.usalacrosse.com/field-diagrams).
- Coaches explain a play as setup, action, response, and finish. Lacrosse tools therefore use frame sequencing and playback rather than only a static sketch. Sources: [USA Lacrosse Mobile Coach guide](https://www.usalacrosse.com/sites/default/files/documents/Coaches/Mobile_Coach_User_Guide_4.0.pdf), [DiagramTheGame](https://diagramthegame.com/lacrosse-play-maker), and [Lacrosse Lab](https://labradorsports.com/lacrosse-features/).
- Diagram line styles have no universal rules-backed meaning. Product conventions consistently distinguish cuts/runs, carries/dodges, passes, picks, shots, and defensive movement. Meaning should therefore be stored independently from rendering. Sources: [Lacrosse Drive drawing guide](https://lacrossedrive.com/draw-drills/) and [DiagramTheGame](https://diagramthegame.com/lacrosse-play-maker).
- Direct manipulation with visible modes and forgiving controls is the reliable cross-device baseline. Pointer input gives mouse, touch, and stylus one model; controls should meet a 44-point target. Sources: [Apple UI design tips](https://developer.apple.com/design/tips/) and [Apple drag-and-drop guidance](https://developer.apple.com/design/human-interface-guidelines/drag-and-drop).

## Chosen v1 scope

V1 stores a versioned semantic diagram on each play while preserving the legacy external diagram URL. The model includes normalized coordinates, explicit men’s/women’s full/half templates, attack orientation, offense/defense/ball actors, typed lacrosse actions, stable actor identity, and ordered frames.

The editor deliberately uses a constrained SVG interaction: choose a visible mode, tap to place, drag to move, drag across the field to add a typed action, select/delete, undo/redo, duplicate/delete phases, step, and play. Existing plays remain valid with a null diagram and expose a clear **Build board** action. Saved boards render as interactive, read-only frame previews.

Normalized coordinates keep persisted tactics independent of responsive SVG pixels. Actors are defined once and positioned per frame so identity survives phase duplication. Action meaning is stored separately from color, dashes, and arrowheads, leaving notation theming evolvable without a data migration. Frames default to simple simultaneous phases rather than a film-editor timeline.

## Deliberately deferred

V1 does not include freehand ink, curved path handles, text/zone annotations, formation presets, roster binding, pan/zoom, multi-select, conditional reads, per-actor timing, export, share links, comments, live collaboration, version recovery, video telestration, 3D, or automated tactical validation. These capabilities broaden interaction and persistence substantially; the first release prioritizes reliable play construction, semantic round trips, tablet operation, and useful playback.

## Live walkthrough follow-up

The live walkthrough remains semantic rather than becoming a screen or video recording. **Capture stage** clones the current editable board, while recording turns each completed player movement or drawn action into a timed stage using the existing normalized frame model. This keeps demonstrations editable, compact, accessible to playback controls, and compatible with the version-1 persisted diagram.

Recording intentionally locks structural setup such as field templates and actor creation while leaving selection, player movement, lacrosse actions, stage capture, and action deletion available. Visible keyboard shortcuts support a coach working at presentation speed: `V` selects, `O`/`D`/`B` add actors before recording, `C` cuts, `G` carries, `P` passes, `K` signals a pick, `X` shoots, `S` slides, `R` recovers, `N` captures a stage, and `Shift+R` starts or stops recording. Audio narration remains out of scope.

## Residual rationale

Formation labels vary by program and counting direction, so v1 never derives coordinates or player counts from a formation name. NCAA geometry is identified as a template rather than treated as universal, leaving room for NFHS, youth, box, Sixes, and custom templates in later schema versions. The board’s action legend combines line pattern, weight, end cap, and color so meaning is not color-only.
