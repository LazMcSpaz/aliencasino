// Gravity Well: all game maths. No drawing, no timers, so Node simulations (tools/sim.js) can run it directly.
// A comet spirals down a three-tier bowl into a black hole. Where it crosses the bottom edge of each tier decides that tier's result.
// Angles are in turns (0..1), clockwise from the top. The bowl is split into 4 quadrants; a thin VOID sliver (the house edge, like
// roulette's green zero) sits centred on each quadrant boundary, and the rest is shared equally by that tier's sections.
// Every tier pays back 1 − VOID (94%). PATH BONUS (automatic, no extra stake): if the comet passes through one of your bets on all
// three tiers, your smallest winning chip is multiplied by the path bonus. The bonus is PATH_K ÷ (chance of hitting a covered path),
// so covering fewer sections means a bigger bonus, and covering everything can't farm it: it adds at most PATH_K/3 to payback.

const TIERS = [
  { n: 4,  pay: 4,  name: "RIM",  label: i => ["RED","BLUE","GOLD","GREEN"][i] },
  { n: 12, pay: 12, name: "BELT", label: i => String(i + 1) },
  { n: 24, pay: 24, name: "CORE", label: i => String(i + 1) },
];
const VOID = .06;                                  // share of every tier taken by the four void slivers
const PATH_K = .09;                                // path bonus strength (see above)
const VOID_PAY = { 1: 4, 2: 25, 3: 250 };
const COLOR_PAY = 73;                             // colour bet: the comet stays in that colour's quadrant on all three tiers          // void side bet: how many tiers the comet crossed in a void
const CHIPS = [1, 5, 25, 100];
const START = 500;
const VOID_SHIFT = VOID / 8;                       // half a sliver: centres each void on its quadrant boundary (the screen relies on this)
const FORCE = { angles: null };                    // debug: force the next spin's crossing angles

let credits = START;
// bets: tiers[t] = { sectionIndex: amount }, colors = { quadrant: amount }, voidBet = amount
let bets = { tiers: [{}, {}, {}], colors: {}, voidBet: 0 };
let lastBets = null;

// which section an angle falls in on tier t (−1 = void sliver)
function sectionAt(t, a) {
  a = (((a + VOID_SHIFT) % 1) + 1) % 1; const q = Math.floor(a * 4), f = a * 4 - q;
  if (f < VOID) return -1;
  const per = TIERS[t].n / 4; return q * per + Math.min(per - 1, Math.floor((f - VOID) / (1 - VOID) * per));
}
// the angular span [from, to] of a section (or of quadrant q's void sliver if i = −1)
function sectionSpan(t, i, q = 0) {
  if (i < 0) return [q / 4 - VOID_SHIFT, (q + VOID) / 4 - VOID_SHIFT];
  const per = TIERS[t].n / 4, qq = Math.floor(i / per), k = i % per, w = (1 - VOID) / per;
  return [(qq + VOID + k * w) / 4 - VOID_SHIFT, (qq + VOID + (k + 1) * w) / 4 - VOID_SHIFT];
}
const quadrantOf = (t, i) => Math.floor(i / (TIERS[t].n / 4));     // sections share their quadrant's colour

function totalBet(b = bets) {
  let s = b.voidBet; for (const v of Object.values(b.colors || {})) s += v;
  for (const tb of b.tiers) for (const v of Object.values(tb)) s += v;
  return s;
}
// the path bonus multiplier for the bets on the table right now (0 if a tier has no bets)
function pathBonus(b = bets) {
  let p = 1; for (let t = 0; t < 3; t++) { const k = Object.keys(b.tiers[t]).length; if (!k) return 0; p *= k * (1 - VOID) / TIERS[t].n; }
  return Math.max(1, Math.round(PATH_K / p));
}

function addBet(t, i, amt) { if (totalBet() + amt > credits) return false; bets.tiers[t][i] = (bets.tiers[t][i] || 0) + amt; return true; }
function addColorBet(q, amt) { if (totalBet() + amt > credits) return false; bets.colors[q] = (bets.colors[q] || 0) + amt; return true; }
function addVoidBet(amt) { if (totalBet() + amt > credits) return false; bets.voidBet += amt; return true; }
function clearBets() { bets = { tiers: [{}, {}, {}], colors: {}, voidBet: 0 }; }
function rebet() { if (!lastBets || totalBet(lastBets) > credits) return false; bets = JSON.parse(JSON.stringify(lastBets)); return true; }

// one spin: the engine picks the three crossing angles, takes the stake, and works out every payout.
// Returns { angles, results, tierWins[3] (amount paid per tier), pathWin, voidCount, voidWin, staked, totalWin }
function spin() {
  const staked = totalBet(); if (staked <= 0 || staked > credits) return null;
  credits -= staked; lastBets = JSON.parse(JSON.stringify(bets));
  const angles = FORCE.angles || [Math.random(), Math.random(), Math.random()]; FORCE.angles = null;
  const results = angles.map((a, t) => sectionAt(t, a));
  const tierWins = results.map((r, t) => r < 0 ? 0 : (bets.tiers[t][r] || 0) * TIERS[t].pay);
  const hits = results.map((r, t) => r < 0 ? 0 : (bets.tiers[t][r] || 0)), mult = pathBonus();
  const pathWin = hits.every(h => h > 0) ? Math.min(...hits) * mult : 0;
  const voidCount = results.filter(r => r < 0).length, voidWin = voidCount ? bets.voidBet * VOID_PAY[voidCount] : 0;
  const q0 = results[0] < 0 ? -1 : quadrantOf(0, results[0]);
  const colorQ = q0 >= 0 && results.every((r, t) => r >= 0 && quadrantOf(t, r) === q0) ? q0 : -1;
  const colorWin = colorQ >= 0 ? (bets.colors[colorQ] || 0) * COLOR_PAY : 0;
  const totalWin = tierWins.reduce((a, b) => a + b, 0) + pathWin + voidWin + colorWin;
  return { angles, results, tierWins, pathWin, pathMult: mult, voidCount, voidWin, colorQ, colorWin, staked, totalWin };
}
// the screen calls this as each part of the result is revealed, so credits rise in step with the comet
function collect(amount) { credits += amount; }
