# Harness setup progress
Branch: harness-setup (snapshot = d56cb90 on main)

| Phase | Status |
|---|---|
| 0 Safety net | done: git repo, branch created, no dependents, only this session working |
| 1 Investigate | done |
| 2 Confirm with owner (checkpoint A) | product.md approved ("good for now", 2026-11-15); still-works.md written but NOT yet run by owner; paused while owner brainstorms a new casino game |
| 3 Sort notes | todo |
| 4 Target map + cleanup plan (checkpoint B) | todo |
| 5 Install harness | todo |
| 6 Dry run | todo |
| 7 Handoff (checkpoint C) | todo |

## Current state (plain English)
- A mobile slot-machine prototype built as ONE web page. `slot/build.py` glues `shell.html` (layout + styles + screen logic, ~1,800 lines),
  `part_engine.js` (odds/paytable/moods/bonus maths), `part_sound.js` (synth sound + music) and base64 art/audio into `slot/slot.html`.
- `model3d/` builds the 3D walking slot robot in code (three.js) → interactive viewer + `out/slot_bot.glb` for Godot.
- `slot/tools/` = payout simulations (run the real engine in Node) + Playwright browser tests.
- Problem areas: shell.html is one huge file mixing CSS, HTML and all screen logic; slot.html is a generated build output kept in the repo;
  test tools hard-code paths to a temporary scratch folder (fonts, three.js) so they won't run elsewhere; no package manifest records Playwright/three.js.
- Instruction-like files: none except README.md. No tests framework; tools are ad-hoc scripts.
- Outside knowledge: owner's memory notes (product + preferences) — durable items copied into docs/product.md.
