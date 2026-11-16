// Checks Asteroid Field's payback: for each black-hole count, crack k random asteroids then collect. Usage (from asteroid/): node tools/sim.js
const E = require("../part_engine.js");
const R = 150000;
for (const h of E.HOLE_CHOICES) {
  const ks = [1, 2, 3, 5, 8, 12].filter(k => k <= E.N - h); const out = [];
  for (const k of ks) { let paid = 0; E.credits = 1e12;
    for (let r = 0; r < R; r++) { const before = E.credits; E.start(10, h); const order = Array.from({ length: E.N }, (_, i) => i).sort(() => Math.random() - .5);
      let res; for (let j = 0; j < k; j++) { res = E.pick(order[j]); if (res !== "safe") break; } if (res === "safe") E.collect(); paid += E.credits - before + 10; }
    out.push(`${k} pick${k > 1 ? "s" : ""} ×${E.multFor(h, k)} → ${(paid / (R * 10) * 100).toFixed(1)}%`); }
  console.log(`${h} black hole${h > 1 ? "s" : ""}:`.padEnd(16), out.join(" · "));
}
