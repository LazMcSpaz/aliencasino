// Warp Drive: the game maths. A ship launches and its multiplier climbs; cash out before the warp core blows.
// Pure logic: no drawing, no sound. The screen (shell.html) reads and calls these; tools/sim.js checks the payback in Node.
// May use: nothing. Must not: touch the page.
const EDGE = 0.96;            // payback: the chance the ship is still flying at ×m is EDGE / m, so every cash-out target returns ≈96%
const GROWTH = 0.12;          // the multiplier climbs as e^(GROWTH · seconds): ×2 at ~5.8 s, ×10 at ~19 s, ×100 at ~38 s
const MAX_MULT = 1000;        // the warp core always blows by ×1000
const START = 500;
let credits = typeof Wallet !== "undefined" ? Wallet.load() : START, history = [];
// two bet slots per launch: bail one early and let the other ride
const mkSlot = () => ({ bet: 0, auto: 0, cashed: null });
let round = { slots: [mkSlot(), mkSlot()], crash: null };
const FORCE = { crash: null };   // debug / tests: the next round's crash point

const multAt = t => Math.exp(GROWTH * t);                 // multiplier after t seconds of flight
const timeFor = m => Math.log(m) / GROWTH;                // seconds until the multiplier reaches m
const floor2 = m => Math.floor(m * 100 + 1e-9) / 100;

// where the drone explodes. P(crash ≥ m) = EDGE / m; about 4% of launches explode at ×1.00 on the pad
function crashPoint() {
  if (FORCE.crash) { const c = FORCE.crash; FORCE.crash = null; return c; }
  const r = Math.random();
  return Math.min(MAX_MULT, Math.max(1, floor2(EDGE / (1 - r))));
}

// betting happens in the window before a launch; i = which slot (0 or 1)
function placeBet(i, amt) { const s = round.slots[i]; if (round.crash !== null || s.bet || amt <= 0 || amt > credits) return false; credits -= amt; s.bet = amt; return true; }
function cancelBet(i) { const s = round.slots[i]; if (round.crash !== null) return 0; const b = s.bet; credits += b; s.bet = 0; return b; }
function setAuto(i, m) { round.slots[i].auto = m > 1 ? floor2(m) : 0; }

// launch: the crash point is decided now and kept secret from the screen until it happens
function launch() { round.crash = crashPoint(); round.slots.forEach(s => s.cashed = null); return round.crash; }
// bail slot i out at multiplier m (the live value, or its auto target). Fails once the drone has exploded.
function cashOut(i, m) { const s = round.slots[i];
  if (!s.bet || s.cashed || round.crash === null) return 0;
  m = floor2(m); if (m >= round.crash || m < 1) return 0;
  const win = Math.floor(s.bet * m); credits += win; s.cashed = { m, win }; return win; }
// has the drone exploded by multiplier m?
const blown = m => round.crash !== null && m >= round.crash;
// after the explosion: record it and get ready for the next round (auto targets carry over)
function endRound() {
  const r = { crash: round.crash, slots: round.slots.map(s => ({ bet: s.bet, cashed: s.cashed })) };
  history.unshift(round.crash); history = history.slice(0, 14);
  round = { slots: round.slots.map(s => ({ bet: 0, auto: s.auto, cashed: null })), crash: null }; return r; }

// keep the shared wallet in step with this game's balance (not in Node tests)
// closing the game: bets not launched yet come back; launched ones pay only if their auto cash-out target would have hit before the explosion
if (typeof Wallet !== "undefined") Wallet.onLeave(() => { round.slots.forEach((s, i) => { if (!s.bet || s.cashed) return; if (round.crash === null) cancelBet(i); else if (s.auto && s.auto < round.crash) cashOut(i, s.auto); }); });
if (typeof Wallet !== "undefined") Wallet.watch(() => credits);

if (typeof module !== "undefined") module.exports = { EDGE, GROWTH, MAX_MULT, multAt, timeFor, crashPoint, placeBet, cancelBet, setAuto, launch, cashOut, blown, endRound, FORCE,
  get credits() { return credits; }, set credits(v) { credits = v; }, get round() { return round; } };
