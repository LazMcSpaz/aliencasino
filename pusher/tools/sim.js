// Checks Star Dozer's payback with the real 3D physics: settles the tray into a steady state, then drops bars for a long time and compares bars won with bars spent.
// Needs the Rapier physics engine for Node: `npm i @dimforge/rapier3d-compat@0.14.0` somewhere on NODE_PATH. Usage (from pusher/): node tools/sim.js [drops] [warm-up drops] [slap: 0 none | 1 slap in every clear window]
const RAPIER = require("@dimforge/rapier3d-compat"); const E = require("../part_engine.js");
const N = +process.argv[2] || 3000, WARM = +process.argv[3] || 600, DT = 1 / 60, GAP = .5, SLAP = +process.argv[4] || 0;
(async () => { await RAPIER.init(); E.init(RAPIER); E.seed(1); E.credits = 1e9;
  let barWon = 0, slapQ = [], slapWon = 0, slaps = 0, spent = 0, won = 0, gut = 0, items = {}, showers = 0, ms = 0, steps = 0;
  for (let i = 0; i < WARM + N; i++) { const counting = i >= WARM; E.drop((Math.random() - .5) * .9, 1); if (counting) spent++;
    for (let t = 0; t < GAP; t += DT) { const a = Date.now(); const ev = E.step(DT, 1); ms += Date.now() - a; steps++;
      if (SLAP) { if (ev.some(e => e.type === "clear")) slapQ = [.6, 1.6]; slapQ = slapQ.map(x => x - DT); if (slapQ.length && slapQ[0] <= 0) { slapQ.shift(); E.slap(Math.random() < .5 ? -1 : 1, 1); if (counting) slaps++; } } if (!counting) continue;
      for (const e of ev) { if (e.type === "win") { won += e.val; if (e.kind === "bar") barWon += e.val; if (e.kind !== "bar") items[e.kind] = (items[e.kind] || 0) + 1; } if (e.type === "gutter") gut += e.val; if (e.type === "shower") showers++; } } }
  console.log(`slaps ${slaps}  payback ${(won / spent * 100).toFixed(1)}%  (bars alone ${(barWon / spent * 100).toFixed(1)}%: add ~11% for crystals on average, they're too rare to measure in one run)  lost in gutters ${(gut / spent * 100).toFixed(1)}%  pieces on the tray ${E.pieces.length}  crystals won ${JSON.stringify(items)}  showers ${showers}  avg physics step ${(ms / steps).toFixed(2)} ms`); })();
