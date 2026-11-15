// Gravity Well: all game maths. No drawing, no timers, so Node simulations (tools/sim.js) can run it directly.
// A comet spirals down a three-tier bowl into a black hole. Where it crosses the bottom edge of each tier decides that tier's result.
// Angles are in turns (0..1), clockwise from the top. The bowl is split into 4 quadrants; each quadrant starts with a thin VOID
// sliver (the house edge, like roulette's green zero) and the rest is shared equally by that tier's sections.
// Every tier pays back 1 − VOID (95%); the path and void bets are tuned near that by tools/sim.js.

const TIERS = [
  { n: 4,  pay: 4,  name: "RIM",  label: i => ["RED","BLUE","GOLD","GREEN"][i] },
  { n: 12, pay: 12, name: "BELT", label: i => String(i + 1) },
  { n: 24, pay: 24, name: "CORE", label: i => String(i + 1) },
];
const VOID = .05;                                  // share of every tier taken by the four void slivers
const PATH_PAY = 1250;                             // one pick on every tier, all three hit
const VOID_PAY = { 1: 5, 2: 30, 3: 300 };          // void side bet: how many tiers the comet crossed in a void
const CHIPS = [1, 5, 25, 100];
const START = 500;
const FORCE = { angles: null };                    // debug: force the next spin's crossing angles

let credits = START;
// bets: tiers[t] = { sectionIndex: amount }, path = { picks:[i,j,k] (null until picked), amount }, voidBet = amount
let bets = { tiers: [{}, {}, {}], path: { picks: [null, null, null], amount: 0 }, voidBet: 0 };
let lastBets = null;

// which section an angle falls in on tier t (−1 = void sliver)
function sectionAt(t, a) {
  a = ((a % 1) + 1) % 1; const q = Math.floor(a * 4), f = a * 4 - q;
  if (f < VOID) return -1;
  const per = TIERS[t].n / 4; return q * per + Math.min(per - 1, Math.floor((f - VOID) / (1 - VOID) * per));
}
// the angular span [from, to] of a section (or of quadrant q's void sliver if i = −1)
function sectionSpan(t, i, q = 0) {
  if (i < 0) return [q / 4, (q + VOID) / 4];
  const per = TIERS[t].n / 4, qq = Math.floor(i / per), k = i % per, w = (1 - VOID) / per;
  return [(qq + VOID + k * w) / 4, (qq + VOID + (k + 1) * w) / 4];
}
const quadrantOf = (t, i) => Math.floor(i / (TIERS[t].n / 4));     // sections share their quadrant's colour

function totalBet(b = bets) {
  let s = b.voidBet + (pathReady(b) ? b.path.amount : 0);
  for (const tb of b.tiers) for (const v of Object.values(tb)) s += v;
  return s;
}
const pathReady = (b = bets) => b.path.amount > 0 && b.path.picks.every(p => p !== null);

function addBet(t, i, amt) { if (totalBet() + amt > credits) return false; bets.tiers[t][i] = (bets.tiers[t][i] || 0) + amt; return true; }
function addVoidBet(amt) { if (totalBet() + amt > credits) return false; bets.voidBet += amt; return true; }
function setPathPick(t, i) { bets.path.picks[t] = i; }
function setPathAmount(amt) { const was = pathReady() ? bets.path.amount : 0; if (totalBet() - was + amt > credits) return false; bets.path.amount = amt; return true; }
function clearBets() { bets = { tiers: [{}, {}, {}], path: { picks: [null, null, null], amount: 0 }, voidBet: 0 }; }
function rebet() { if (!lastBets || totalBet(lastBets) > credits) return false; bets = JSON.parse(JSON.stringify(lastBets)); return true; }

// one spin: the engine picks the three crossing angles, takes the stake, and works out every payout.
// Returns { angles, results, tierWins[3] (amount paid per tier), pathWin, voidCount, voidWin, staked, totalWin }
function spin() {
  const staked = totalBet(); if (staked <= 0 || staked > credits) return null;
  credits -= staked; lastBets = JSON.parse(JSON.stringify(bets));
  const angles = FORCE.angles || [Math.random(), Math.random(), Math.random()]; FORCE.angles = null;
  const results = angles.map((a, t) => sectionAt(t, a));
  const tierWins = results.map((r, t) => r < 0 ? 0 : (bets.tiers[t][r] || 0) * TIERS[t].pay);
  const pathWin = pathReady() && results.every((r, t) => r === bets.path.picks[t]) ? bets.path.amount * PATH_PAY : 0;
  const voidCount = results.filter(r => r < 0).length, voidWin = voidCount ? bets.voidBet * VOID_PAY[voidCount] : 0;
  const totalWin = tierWins.reduce((a, b) => a + b, 0) + pathWin + voidWin;
  return { angles, results, tierWins, pathWin, voidCount, voidWin, staked, totalWin };
}
// the screen calls this as each part of the result is revealed, so credits rise in step with the comet
function collect(amount) { credits += amount; }
