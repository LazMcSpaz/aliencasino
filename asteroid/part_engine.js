// Asteroid Field: the game maths. A 5×5 field of asteroids hides some black holes. Bet, crack asteroids one by one;
// each safe one raises the multiplier. Collect any time. Hit a black hole and the bet is gone.
// Pure logic: no drawing, no sound. The screen (shell.html) calls these; tools/sim.js checks the payback in Node.
// May use: nothing. Must not: touch the page.
const N = 25;                 // tiles in the field
const EDGE = 0.97;            // payback: every strategy returns ≈97% over time
const HOLE_CHOICES = [1, 3, 5, 10, 20, 24];
const MAX_MULT = 10000;       // the multiplier never goes past ×10,000
const START = 500;
let credits = typeof Wallet !== "undefined" ? Wallet.load() : START;
let game = null;              // { bet, holes, mines:Set, picks:[], over:null|"lost"|"won", win }
const FORCE = { mines: null }; // debug / tests: exact black-hole positions for the next field

const floor2 = m => Math.floor(m * 100 + 1e-9) / 100;
// the multiplier after k safe asteroids with h black holes: the fair odds of surviving k picks, less the house edge
function multFor(h, k) { if (k <= 0) return 1; let m = 1; for (let i = 0; i < k; i++) m *= (N - i) / (N - h - i); return floor2(Math.min(MAX_MULT, m * EDGE)); }

function start(bet, holes) {
  if (game && !game.over) return false; if (bet <= 0 || bet > credits || !HOLE_CHOICES.includes(holes)) return false;
  credits -= bet; let mines;
  if (FORCE.mines) { mines = new Set(FORCE.mines); FORCE.mines = null; }
  else { const idx = Array.from({ length: N }, (_, i) => i); for (let i = N - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } mines = new Set(idx.slice(0, holes)); }
  game = { bet, holes: mines.size, mines, picks: [], over: null, win: 0 }; return true; }
// crack tile i: "hole" (bet lost), "safe", or "cleared" (every safe tile found: collected automatically); null if not allowed
function pick(i) {
  if (!game || game.over || game.picks.includes(i) || i < 0 || i >= N) return null;
  if (game.mines.has(i)) { game.over = "lost"; game.hit = i; return "hole"; }
  game.picks.push(i);
  if (game.picks.length === N - game.holes) { collect(); return "cleared"; }
  return "safe"; }
const current = () => game ? multFor(game.holes, game.picks.length) : 1;
const next = () => game ? multFor(game.holes, game.picks.length + 1) : 1;
function collect() { if (!game || game.over || !game.picks.length) return 0; const win = Math.floor(game.bet * current()); credits += win; game.over = "won"; game.win = win; return win; }

// keep the shared wallet in step with this game's balance (not in Node tests)
// closing the game mid-field collects what the picks have earned so far
if (typeof Wallet !== "undefined") Wallet.onLeave(() => collect());
if (typeof Wallet !== "undefined") Wallet.watch(() => credits);

if (typeof module !== "undefined") module.exports = { N, EDGE, HOLE_CHOICES, multFor, start, pick, collect, current, next, FORCE,
  get credits() { return credits; }, set credits(v) { credits = v; }, get game() { return game; } };
