// Bonus-round satisfaction: how much each Bowl-nus round pays, in multiples of the bet that triggered it, plus overall payback.
// Usage (from slot/): node tools/simround.js [engine file] [JSON of BONUS overrides]
const fs = require("fs"); const eng = fs.readFileSync(process.argv[2] || "part_engine.js", "utf8"); const over = JSON.parse(process.argv[3] || "{}");
const E = new Function(eng.replace(/^[^\n]*\n/, "") + `
Object.assign(BONUS, ${JSON.stringify(over)}); if (BONUS.weights) for (const s of SYMBOLS) if (s[0] in BONUS.weights) W_BONUS[SYMBOLS.indexOf(s)] = BONUS.weights[s[0]];
return { run(N, L) { credits = 1e9; lines = L; let bet = 0, won = 0, rounds = [], cur = null, trigBet = 0;
  for (let i = 0; i < N || bonusLeft > 0; i++) { const wasBonus = bonusLeft > 0; if (!wasBonus) credits = START; const r = resolveSpin(); bet += r.spent; won += r.total;
    if (!wasBonus && r.triggered) { cur = 0; trigBet = cost(); }
    if (r.inBonus) cur += r.total + (r.topUp || 0); won += r.topUp || 0; if (cur !== null && bonusLeft === 0 && r.inBonus) { rounds.push(cur / trigBet); cur = null; } }
  return { rtp: won / bet, rounds }; } };`)();
for (const L of [1, 5]) { const { rtp, rounds } = E.run(400000, L); rounds.sort((a, b) => a - b); const q = p => rounds[Math.floor(rounds.length * p)].toFixed(1), avg = rounds.reduce((a, b) => a + b, 0) / rounds.length;
  console.log(`${L} lines | RTP ${rtp.toFixed(3)} | bonus every ${Math.round(400000 / rounds.length)} spins | per round x bet: avg ${avg.toFixed(1)}  10%:${q(.1)} 25%:${q(.25)} median:${q(.5)} 75%:${q(.75)} 90%:${q(.9)} | under 5x: ${(rounds.filter(x => x < 5).length / rounds.length * 100).toFixed(0)}%`); }
