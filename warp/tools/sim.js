// Checks Warp Drive's payback for a range of cash-out targets. Usage (from warp/): node tools/sim.js
const E = require("../part_engine.js");
const N = 400000;
for (const target of [1.1, 1.5, 2, 3, 5, 10, 50, 200]) {
  let paid = 0, staked = 0; E.credits = 1e12;
  for (let i = 0; i < N; i++) { E.placeBet(0, 10); staked += 10; const before = E.credits; E.launch(); E.cashOut(0, target); paid += E.credits - before; E.endRound(); }
  console.log(`cash out at ×${target}`.padEnd(22), (paid / staked * 100).toFixed(2) + "%");
}
let pad = 0; for (let i = 0; i < N; i++) if (E.crashPoint() <= 1) pad++;
console.log("blows on the pad (×1.00):", (pad / N * 100).toFixed(2) + "%");
