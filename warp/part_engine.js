// Warp Drive: the game maths. A ship launches and its multiplier climbs; cash out before the warp core blows.
// Pure logic: no drawing, no sound. The screen (shell.html) reads and calls these; tools/sim.js checks the payback in Node.
// May use: nothing. Must not: touch the page.
const EDGE = 0.96;            // payback: the chance the ship is still flying at ×m is EDGE / m, so every cash-out target returns ≈96%
const GROWTH = 0.12;          // the multiplier climbs as e^(GROWTH · seconds): ×2 at ~5.8 s, ×10 at ~19 s, ×100 at ~38 s
const MAX_MULT = 1000;        // the warp core always blows by ×1000
const START = 500;
let credits = START, history = [];
let round = { bet: 0, auto: 0, cashed: null, crash: null };
const FORCE = { crash: null };   // debug / tests: the next round's crash point

const multAt = t => Math.exp(GROWTH * t);                 // multiplier after t seconds of flight
const timeFor = m => Math.log(m) / GROWTH;                // seconds until the multiplier reaches m
const floor2 = m => Math.floor(m * 100 + 1e-9) / 100;

// where the warp core blows. P(crash ≥ m) = EDGE / m; about 4% of launches blow at ×1.00 on the pad
function crashPoint() {
  if (FORCE.crash) { const c = FORCE.crash; FORCE.crash = null; return c; }
  const r = Math.random();
  return Math.min(MAX_MULT, Math.max(1, floor2(EDGE / (1 - r))));
}

// betting happens in the window before a launch
function placeBet(amt) { if (round.crash !== null || amt <= 0 || amt > credits) return false; credits -= amt; round.bet += amt; return true; }
function cancelBet() { if (round.crash !== null) return 0; const b = round.bet; credits += b; round.bet = 0; return b; }
function setAuto(m) { round.auto = m > 1 ? floor2(m) : 0; }

// launch: the crash point is decided now and kept secret from the screen until it happens
function launch() { round.crash = crashPoint(); round.cashed = null; return round.crash; }
// cash out at multiplier m (the screen passes the live value, or the auto target). Fails once the ship has blown.
function cashOut(m) {
  if (!round.bet || round.cashed || round.crash === null) return 0;
  m = floor2(m); if (m >= round.crash || m < 1) return 0;
  const win = Math.floor(round.bet * m); credits += win; round.cashed = { m, win }; return win; }
// has the ship blown by multiplier m?
const blown = m => round.crash !== null && m >= round.crash;
// after the explosion: record it and get ready for the next round (the auto target carries over)
function endRound() {
  const r = { crash: round.crash, bet: round.bet, cashed: round.cashed };
  history.unshift(round.crash); history = history.slice(0, 14);
  round = { bet: 0, auto: round.auto, cashed: null, crash: null }; return r; }

if (typeof module !== "undefined") module.exports = { EDGE, GROWTH, MAX_MULT, multAt, timeFor, crashPoint, placeBet, cancelBet, setAuto, launch, cashOut, blown, endRound, FORCE,
  get credits() { return credits; }, set credits(v) { credits = v; }, get round() { return round; } };
