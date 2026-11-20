// Checks Wheel of Worlds' payback: bets 1 bar on each world in turn for many rounds (wormholes included) and compares what comes back with what went in.
// Usage (from wheel/): node tools/sim.js [rounds per world]
const E = require("../part_engine.js"); const N = +process.argv[2] || 400000;
console.log("layout:", E.LAYOUT.map(k => k[0]).join(""));
let allIn = 0, allOut = 0;
for (const w of E.WORLDS) { let spent = 0, back = 0; E.credits = 1e12;
  for (let i = 0; i < N; i++) { E.newRound(); E.placeBet(w.id, 1); spent++; let r; do { const c0 = E.credits; r = E.spin(); back += E.credits - c0; } while (r.wormhole); }
  allIn += spent; allOut += back; console.log(`${w.name.padEnd(14)} ×${String(w.mult).padEnd(3)} payback ${(back / spent * 100).toFixed(1)}%`); }
console.log(`overall ${(allOut / allIn * 100).toFixed(1)}%`);
