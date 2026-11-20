// Wheel of Worlds: the game maths. A giant wheel of 54 segments, each a world (or a wormhole, or a black hole). Bet bars on worlds, spin;
// if it stops on your world you get bet × that world's multiplier. Pure logic: no drawing, no sound. The screen (shell.html) reads and calls these;
// tools/sim.js checks the payback in Node. May use: Wallet if the page has it. Must not: touch the page.
// Each world has (segments × multiplier) = 40, so every bet returns the same: 40/54 straight, × the alignment boost (≈1.25 on average)
// × the wormhole (≈1.04) ≈ 96% over a long run. The black holes are what's left over: they swallow every bet.
const WORLDS = [                                   // id, multiplier (total paid back per bar), segments on the wheel
  { id: "moon",  name: "Moon",          mult: 2,  n: 20 },
  { id: "red",   name: "Red Planet",    mult: 4,  n: 10 },
  { id: "ice",   name: "Ice World",     mult: 8,  n: 5 },
  { id: "gas",   name: "Gas Giant",     mult: 10, n: 4 },
  { id: "ring",  name: "Ringed Planet", mult: 20, n: 2 },
  { id: "earth", name: "Earth",         mult: 40, n: 1 } ];
const SPECIAL = [{ id: "worm", name: "Wormhole", n: 1 }, { id: "hole", name: "Black Hole", n: 11 }];
const S = 54;
// planetary alignment: before every spin one world gets a boost; it multiplies that world's payout if it comes up
const BOOSTS = [[2, .72], [3, .2], [5, .07], [10, .01]];
const CHIPS = [1, 5, 25, 100], START = 500, MAXBET = 500;   // max total on the table per spin
const byId = Object.fromEntries([...WORLDS, ...SPECIAL].map(w => [w.id, w]));
// the wheel's layout: spread every kind evenly round the rim (a fixed order, so the wheel's picture never changes)
const LAYOUT = (() => { const kinds = [...WORLDS, ...SPECIAL], credit = kinds.map(() => 0), out = [];
  for (let i = 0; i < S; i++) { kinds.forEach((k, j) => credit[j] += k.n / S); let b = 0; kinds.forEach((k, j) => { if (credit[j] > credit[b] + 1e-9 || (Math.abs(credit[j] - credit[b]) < 1e-9 && k.n < kinds[b].n)) b = j; }); credit[b] -= 1; out.push(kinds[b].id); }
  return out; })();
let credits = typeof Wallet !== "undefined" ? Wallet.load() : START;
let bets = {}, lastBets = {}, boost = null, ride = 1, phase = "bet", history = [];
const FORCE = { seg: null };                       // debug / tests: the next spin lands on this kind ("earth", "worm", …)
const total = () => Object.values(bets).reduce((a, b) => a + b, 0);
const rollBoost = () => { let r = Math.random(), m = 2; for (const [v, p] of BOOSTS) { if (r < p) { m = v; break; } r -= p; } return { world: WORLDS[Math.floor(Math.random() * WORLDS.length)].id, mult: m }; };
// a new round: clear the table, new alignment boost
function newRound() { lastBets = Object.keys(bets).length ? { ...bets } : lastBets; bets = {}; ride = 1; phase = "bet"; boost = rollBoost(); return boost; }
function placeBet(world, amt) { if (phase !== "bet" || !byId[world] || !WORLDS.includes(byId[world]) || amt <= 0 || amt > credits || total() + amt > MAXBET) return false; credits -= amt; bets[world] = (bets[world] || 0) + amt; return true; }
function clearBets() { if (phase !== "bet") return 0; const t = total(); credits += t; bets = {}; return t; }
function rebet() { if (phase !== "bet" || total()) return false; const t = Object.values(lastBets).reduce((a, b) => a + b, 0); if (!t || t > credits || t > MAXBET) return false; for (const [w, a] of Object.entries(lastBets)) placeBet(w, a); return true; }
// spin: decides where the wheel stops. Returns { index (segment 0…53), seg (kind), wins: [{world, bet, win}], paid, wormhole, ride }.
// A wormhole keeps the bets on the table, doubles what they'll pay (ride), and the screen spins again straight away.
function spin() { if (phase === "bet" && !total()) return null; phase = "spin";
  let index; if (FORCE.seg) { const opts = LAYOUT.map((k, i) => k === FORCE.seg ? i : -1).filter(i => i >= 0); index = opts[Math.floor(Math.random() * opts.length)]; FORCE.seg = null; } else index = Math.floor(Math.random() * S);
  const seg = LAYOUT[index], res = { index, seg, wins: [], paid: 0, wormhole: false, ride };
  if (seg === "worm") { ride *= 2; res.wormhole = true; res.ride = ride; return res; }
  const b = bets[seg]; if (b) { const w = byId[seg], k = boost && boost.world === seg ? boost.mult : 1, win = b * w.mult * k * ride; credits += win; res.wins.push({ world: seg, bet: b, win, boost: k }); res.paid = win; }
  history.unshift(seg); history = history.slice(0, 16); phase = "done"; return res; }
// keep the shared wallet in step with this game's balance (not in Node tests)
if (typeof Wallet !== "undefined") Wallet.watch(() => credits);
if (typeof module !== "undefined") module.exports = { WORLDS, SPECIAL, S, BOOSTS, CHIPS, MAXBET, LAYOUT, byId, newRound, placeBet, clearBets, rebet, spin, total, FORCE,
  get credits() { return credits; }, set credits(v) { credits = v; }, get bets() { return bets; }, get boost() { return boost; }, get ride() { return ride; }, get phase() { return phase; }, get history() { return history; } };
