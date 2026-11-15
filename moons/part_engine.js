// Twin Moons: all game maths (no drawing, no timers), so tools/sim.js can run it in Node.
// Two 8-sided moons are rolled. What counts is the GAP between them (0–7). Matching moons (gap 0) COLLIDE: the crash, like craps' 7.
// Come-out roll (no point yet): gap 7 (a 1 and an 8, "full orbit") wins the line straight away; a collision loses it;
// any other gap becomes THE POINT. Then keep rolling: hit the point's gap again → win; collide first → crash.
// Bets: WITH the moons (pass, ×2), AGAINST (don't pass, ×2; a double-1 or double-8 collision on the come-out is a push),
// GAP bets 1–7 (that gap before a collision; stays up until it resolves), COLLISION (next roll is doubles, one roll only).
// Payouts are "returns": ×2 means a 5 chip comes back as 10; odd amounts round down, like a real table. Payback per bet is checked by tools/sim.js.
const FACES = 8;
const GAP_PAY = { 1: 1.5, 2: 1.6, 3: 1.7, 4: 1.9, 5: 2.2, 6: 2.8, 7: 4.7 };
const LINE_PAY = 2, COLLIDE_PAY = 7.5, NATURAL = 7;
const CHIPS = [1, 5, 25, 100], START = 500;
const FORCE = { dice: null };                       // debug: force the next roll, e.g. [3, 3]

let credits = START, point = null, streak = 0;
let bets = { with: 0, against: 0, gaps: {}, collide: 0 };
let history = [];                                   // chips placed since the last roll, newest last (UNDO)

const tableTotal = () => bets.with + bets.against + bets.collide + Object.values(bets.gaps).reduce((a, b) => a + b, 0);
// where a chip may go right now: line bets only before a point is set (and are locked in while it's on)
function canBet(spot) { if (spot === "with" || spot === "against") return point === null; return true; }
function placeBet(spot, amt) {
  if (amt > credits || !canBet(spot)) return false; credits -= amt;
  if (typeof spot === "number") bets.gaps[spot] = (bets.gaps[spot] || 0) + amt; else bets[spot] += amt;
  history.push({ spot, amt }); return true; }
function undoBet() { const h = history.pop(); if (!h) return null; credits += h.amt;
  if (typeof h.spot === "number") { bets.gaps[h.spot] -= h.amt; if (bets.gaps[h.spot] <= 0) delete bets.gaps[h.spot]; } else bets[h.spot] -= h.amt; return h; }
function clearBets() { while (history.length) undoBet(); }
const hasAction = () => point !== null || tableTotal() > 0;

// one roll: returns the dice and everything that was paid, lost or pushed
function roll() {
  if (!hasAction()) return null;
  const d = FORCE.dice || [1 + Math.floor(Math.random() * FACES), 1 + Math.floor(Math.random() * FACES)]; FORCE.dice = null;
  const gap = Math.abs(d[0] - d[1]), crash = gap === 0, comeOut = point === null, pointBefore = point;
  const res = { dice: d, gap, crash, comeOut, pointBefore, outcomes: [], natural: false, made: false, sevenOut: false };
  const pay = (spot, amt, mult, label) => { const w = Math.floor(amt * mult); credits += w; res.outcomes.push({ spot, amt, win: w, label }); };
  const lose = (spot, amt, label) => res.outcomes.push({ spot, amt, win: 0, label });
  // collision: a one-roll bet
  if (bets.collide) { crash ? pay("collide", bets.collide, COLLIDE_PAY, "Collision!") : lose("collide", bets.collide); bets.collide = 0; }
  // gap bets
  for (const [g, amt] of Object.entries(bets.gaps)) { const gg = +g;
    if (crash) { lose(gg, amt); delete bets.gaps[g]; } else if (gap === gg) { pay(gg, amt, GAP_PAY[gg], `Gap ${gg}`); delete bets.gaps[g]; } }
  // the line
  if (comeOut) {
    if (crash) { if (bets.with) lose("with", bets.with);
      if (bets.against) { if (d[0] === FACES || d[0] === 1) pay("against", bets.against, 1, "Push"); else pay("against", bets.against, LINE_PAY, "Against wins"); }
      bets.with = bets.against = 0; streak = 0; }
    else if (gap === NATURAL) { res.natural = true; if (bets.with) pay("with", bets.with, LINE_PAY, "Full orbit!"); if (bets.against) lose("against", bets.against); bets.with = bets.against = 0; }
    else point = gap;
  } else {
    if (gap === point) { res.made = true; streak++; if (bets.with) pay("with", bets.with, LINE_PAY, "Point hit!"); if (bets.against) lose("against", bets.against); bets.with = bets.against = 0; point = null; }
    else if (crash) { res.sevenOut = true; streak = 0; if (bets.with) lose("with", bets.with); if (bets.against) pay("against", bets.against, LINE_PAY, "Against wins"); bets.with = bets.against = 0; point = null; }
  }
  res.pointAfter = point; res.streak = streak; history = [];
  res.totalWin = res.outcomes.reduce((a, o) => a + o.win, 0); return res;
}
