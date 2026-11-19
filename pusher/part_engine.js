// Star Dozer: the coin pusher's rules and physics. Pure logic: no drawing, no sound. The screen (shell.html) calls these; tools/sim.js checks the payback in Node.
// The tray, seen from above: x runs 0…W across, y runs 0 (the back wall) … L (the front edge). A pusher block slides back and forth at the back.
// Coins you drop land on top of the pusher. When it pulls back they're scraped off its front onto the tray, and when it comes forward it shoves the pile.
// Whatever goes over the front edge between the gutters is yours; over the front corners (the gutters) it's lost.
// Coins stack one level deep: a coin that falls onto a crowded spot sits on top of the coins below (layer 2), rides along as they're pushed,
// and drops down (or tips over the edge) once nothing is holding it up. Layers: 0 = on the tray, 1 = on top of the pusher, 2 = stacked on tray coins.
// May use: nothing (Wallet if the page has it). Must not: touch the page.
const W = 1, L = 1.3, R = .043;               // tray width, length, coin radius
const FACE = [.12, .38], PERIOD = 3.4;          // the pusher's front face slides between these y positions, once every PERIOD seconds
const GUTTER = .082;                             // the front corners: this much of the width at each side drops into the gutters (lost)
const DENOMS = [1, 5, 10, 25];
const START = 500;
// bonus prizes that turn up on the pusher now and then: value (× the coin value you're playing), size, weight, and how often one replaces a dropped coin
const ITEMS = {
  bar:     { val: 4,  r: .058, m: 2.2, odds: .014 },   // a gold bar
  crystal: { val: 9,  r: .05,  m: 1.6, odds: .005 },   // a big crystal
  ufo:     { val: 0,  r: .062, m: 2.0, odds: .004 },   // a toy saucer: off the front, it sets off a COIN SHOWER (free coins onto the pusher)
  star:    { val: 30, r: .066, m: 3.0, odds: .0012 } };   // the jackpot star coin
const SHOWER = 8, MAXSTACK = 40, CLIMB = 16;                              // coins in a coin shower
let credits = typeof Wallet !== "undefined" ? Wallet.load() : START;
let coins = [], clock = 0, nextId = 1, face = FACE[0], events = [];
const FORCE = { item: null };                   // debug / tests: the next drop is this prize

const faceAt = t => FACE[0] + (FACE[1] - FACE[0]) * (.5 - .5 * Math.cos(2 * Math.PI * t / PERIOD));   // eases at both ends, like a cam
function mk(x, y, val, kind = "coin", layer = 0) { const it = ITEMS[kind]; return { id: nextId++, x, y, px: x, py: y, val, kind, layer, r: it ? it.r : R, m: it ? it.m : 1, spin: Math.random() * 6.28 }; }

// drop a coin at x (0…W) with value `denom`. It lands on top of the pusher. Returns false if you can't afford it.
function drop(x, denom) { if (!DENOMS.includes(denom) || credits < denom) return false; credits -= denom;
  let kind = "coin"; if (FORCE.item) { kind = FORCE.item; FORCE.item = null; } else { const r = Math.random(); let acc = 0; for (const [k, it] of Object.entries(ITEMS)) { acc += it.odds; if (r < acc) { kind = k; break; } } }
  const it = ITEMS[kind], val = it ? it.val * denom : denom;
  coins.push(mk(Math.max(R, Math.min(W - R, x)), Math.max(R, face * (.25 + Math.random() * .5)), val, kind, 1));
  if (kind !== "coin") events.push({ type: "prize", kind });
  return true; }
// free coins (a coin shower), spread across the pusher
function shower(denom, n = SHOWER) { for (let i = 0; i < n; i++) coins.push(mk(R + Math.random() * (W - 2 * R), Math.max(R, face * Math.random()), denom, "coin", 1)); }

// push overlapping coins apart (several passes); a heavier piece moves less. Coins only touch others on the same level.
function separate(list) {
  const cell = 2 * .066, grid = new Map(), key = (i, j) => i * 1000 + j;
  for (const c of list) { const k = key(Math.floor(c.x / cell), Math.floor(c.y / cell)); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(c); }
  for (const c of list) { const ci = Math.floor(c.x / cell), cj = Math.floor(c.y / cell);
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const a = grid.get(key(ci + di, cj + dj)); if (!a) continue;
      for (const d of a) { if (d.id <= c.id) continue; const dx = d.x - c.x, dy = d.y - c.y, min = c.r + d.r, q = dx * dx + dy * dy; if (q >= min * min || q === 0) continue;
        const dist = Math.sqrt(q), push = (min - dist), wc = 1 / c.m, wd = 1 / d.m, s = push / (wc + wd) / dist;
        c.x -= dx * s * wc; c.y -= dy * s * wc; d.x += dx * s * wd; d.y += dy * s * wd; } } } }

// advance the machine by dt seconds (call with small steps, e.g. 1/60). Returns what happened: [{type:"win"|"gutter", x, val, kind}, {type:"shower"}…]
function step(dt, denomForShower = 1) {
  clock += dt; const f0 = face; face = faceAt(clock); const df = face - f0;
  for (const c of coins) { c.px = c.x; c.py = c.y; }
  const top = [], tray = [], stack = [];
  for (const c of coins) (c.layer === 1 ? top : c.layer === 2 ? stack : tray).push(c);
  // on top of the pusher: carried with it, scraped by the back wall, falling off its front onto the tray (or onto the coins already there)
  for (const c of top) { c.y += df; if (c.y < c.r) c.y = c.r; }
  for (let k = 0; k < 3; k++) { separate(top); for (const c of top) { c.x = Math.max(c.r, Math.min(W - c.r, c.x)); if (c.y < c.r) c.y = c.r; } }
  for (const c of top) if (c.y > face + c.r * .2) { const crowd = tray.filter(d => (d.x - c.x) ** 2 + (d.y - c.y) ** 2 < (d.r + c.r) ** 2 * .98).length;
    c.layer = crowd ? 2 : 0; (crowd ? stack : tray).push(c); }   // no room on the tray right there: it lands on top
  // on the tray: the pusher's face shoves, coins shove each other, the side walls hold them in
  for (let k = 0; k < 6; k++) { for (const c of tray) { if (c.y - c.r < face) c.y = face + c.r; c.x = Math.max(c.r, Math.min(W - c.r, c.x)); } separate(tray); }
  for (const c of tray) if (c.y - c.r < face) c.y = face + c.r;
  // squeezed: while the pusher drives forward, a coin pressed against its face (with coins packed in front) sometimes rides up on top of the pile
  if (df > 0 && stack.length < MAXSTACK) for (const c of tray) { if (c.kind !== "coin" || c.y - c.r > face + .004 || Math.random() > df * CLIMB) continue;
    let ahead = 0; for (const d of tray) if (d !== c && d.y > c.y && Math.hypot(d.x - c.x, d.y - c.y) < (d.r + c.r) * 1.08) ahead++;
    if (ahead >= 2) { c.layer = 2; c.y += c.r * .6; stack.push(c); if (stack.length >= MAXSTACK) break; } }
  tray.splice(0, tray.length, ...tray.filter(c => c.layer === 0));
  // stacked coins ride on the coins under them; with nothing under them (or only an edge to hang on) they drop down
  for (const c of stack) { let n = 0, mx = 0, my = 0, sx = 0, sy = 0;
    for (const d of tray) { const q = (d.x - c.x) ** 2 + (d.y - c.y) ** 2, reach = (d.r + c.r) * .92; if (q < reach * reach) { n++; mx += d.x - d.px; my += d.y - d.py; sx += d.x; sy += d.y; } }
    if (!n) { c.layer = 0; continue; }
    c.x += mx / n; c.y += my / n;
    const off = Math.hypot(sx / n - c.x, sy / n - c.y); if (n === 1 && off > c.r * 1.05) c.layer = 0; }   // balanced on one coin's rim: it slides off
  const still = stack.filter(c => c.layer === 2);
  for (let k = 0; k < 3; k++) { separate(still); for (const c of still) { c.x = Math.max(c.r, Math.min(W - c.r, c.x)); if (c.y - c.r < face) c.y = face + c.r; } }
  if (still.length < stack.length) for (let k = 0; k < 3; k++) separate(coins.filter(c => c.layer === 0));   // ones that dropped down make room for themselves
  // over the front edge
  const out = events; events = [];
  coins = coins.filter(c => { if (c.layer === 1 || c.y <= L) return true;
    const win = c.x > GUTTER && c.x < W - GUTTER;
    if (win) { credits += c.val; out.push({ type: "win", x: c.x, val: c.val, kind: c.kind }); if (c.kind === "ufo") { shower(denomForShower); out.push({ type: "shower", n: SHOWER }); } }
    else out.push({ type: "gutter", x: c.x, val: c.val, kind: c.kind });
    return false; });
  return out; }

// a fresh tray: packed edge to edge right up to the front lip (so play pays from the first drops), a few coins already stacked, and the starting prizes
function seed(denom = 1) { coins = []; clock = 0; face = FACE[0];
  const dx = 2 * R * 1.02, dy = dx * .87;
  for (let row = 0, y = FACE[1] + R; y < L - R * .2; row++, y += dy) for (let x = R + (row % 2) * dx / 2; x < W - R; x += dx)
    if (Math.random() < .93) coins.push(mk(x + (Math.random() - .5) * R * .3, y + (Math.random() - .5) * R * .3, denom, "coin", 0));
  for (const [k, n] of [["bar", 2], ["crystal", 1], ["ufo", 1]]) for (let i = 0; i < n; i++) { const c = coins[Math.floor(coins.length * (.25 + Math.random() * .5))]; const it = ITEMS[k]; Object.assign(c, { kind: k, val: it.val * denom, r: it.r, m: it.m }); }
  for (let i = 0; i < 30; i++) { const base = coins[Math.floor(Math.random() * coins.length)]; if (base.kind === "coin" && base.y < L - 3 * R) coins.push(mk(base.x + R * .5, base.y + R * .3, denom, "coin", 2)); }
  for (let i = 0; i < 20; i++) coins.push(mk(R + Math.random() * (W - 2 * R), R + Math.random() * (FACE[0] - R), denom, "coin", 1));   // and a layer already riding on the pusher
  for (let i = 0; i < 40; i++) { step(1 / 60); coins = coins.filter(c => c.y < L - c.r * .1); }   // let it settle without paying out
  clock = 0; face = faceAt(0); events = []; }

// the tray as plain data, to save between visits (so the pile you built up is still there) and to restore
const snapshot = () => ({ clock, coins: coins.map(c => [Math.round(c.x * 1e4) / 1e4, Math.round(c.y * 1e4) / 1e4, c.val, c.kind, c.layer]) });
function restore(s) { try { if (!s || !Array.isArray(s.coins) || s.coins.length < 20) return false; coins = s.coins.map(([x, y, val, kind, layer]) => mk(x, y, val, kind, layer)); clock = s.clock || 0; face = faceAt(clock); return true; } catch (e) { return false; } }

// keep the shared wallet in step with this game's balance (not in Node tests)
if (typeof Wallet !== "undefined") Wallet.watch(() => credits);

if (typeof module !== "undefined") module.exports = { W, L, R, FACE, PERIOD, GUTTER, DENOMS, ITEMS, SHOWER, drop, shower, step, seed, snapshot, restore, faceAt, FORCE,
  get credits() { return credits; }, set credits(v) { credits = v; }, get coins() { return coins; }, get face() { return face; } };
