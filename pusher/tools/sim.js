// Checks Star Dozer's payback: drops coins for a long time (after the tray has settled into a steady state) and compares bars won with bars spent.
// Usage (from pusher/): node tools/sim.js [drops] [seconds between drops]
const E = require("../part_engine.js");
const N = +process.argv[2] || 6000, GAP = +process.argv[3] || .55, DT = 1 / 60;
const run = (aim) => { E.credits = 1e9; E.seed(1); let stackedMax = 0;
  const warm = 1500; let spent = 0, won = 0, gut = 0, n = 0, items = {}, showers = 0;
  for (let i = 0; i < warm + N; i++) { const counting = i >= warm; const before = E.credits;
    E.drop(aim(), 1); if (counting) spent += 1;
    for (let t = 0; t < GAP; t += DT) for (const e of E.step(DT, 1)) { if (!counting) continue;
      if (e.type === "win") { won += e.val; if (e.kind !== "coin") items[e.kind] = (items[e.kind] || 0) + 1; } if (e.type === "gutter") gut += e.val; if (e.type === "shower") showers++; } }
  return { stacked: E.coins.filter(c => c.layer === 2).length, rtp: won / spent, gut: gut / spent, onTray: E.coins.length, items, showers }; };
for (const [name, aim] of (process.argv[4] === "all" ? [["random spot", () => Math.random()], ["always the middle", () => .5 + (Math.random() - .5) * .05], ["always the left edge", () => .02]] : [["random spot", () => Math.random()]])) {
  const r = run(aim); console.log(name.padEnd(22), "payback", (r.rtp * 100).toFixed(1) + "%", " lost in gutters", (r.gut * 100).toFixed(1) + "%", " coins on tray", r.onTray, " stacked", r.stacked, " prizes won", JSON.stringify(r.items), " showers", r.showers); }
