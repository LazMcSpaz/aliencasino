// Star Dozer: the coin pusher's rules, with real 3D physics (the Rapier engine). No drawing, no sound: the screen (shell.html) reads the pieces' positions
// and calls these; tools/sim.js runs the same engine in Node to check the payback.
// The machine (metres, y up): the tray floor is y = 0, x runs −W/2…W/2 across, z runs 0 (the back wall) … L (the front edge, toward the player).
// A pusher block slides back and forth at the back. Gold bars you drop land on top of it; when it pulls back, the scraper wall above it pushes them off
// its front onto the tray; when it comes forward it shoves the pile. Bars stack, slide and tip like the real thing.
// Whatever falls over the front edge between the gutters is yours; over the front corners (the gutters) it's lost.
// May use: RAPIER (handed to init), Wallet if the page has it. Must not: touch the page.
const W = 1.0, L = 1.2, PH = .075, PD = .6;           // tray width, length, pusher height and depth
const FACE = [.13, .37], PERIOD = 3.4;                 // the pusher's front face slides between these z positions, once every PERIOD seconds
const GUTTER = .085;                                    // the front corners: this much of the width at each side drops into the gutters (lost)
const BAR = [.11, .014, .066];                           // a gold bar: width, height, depth
const DENOMS = [1], START = 500;                       // one kind of bar, worth 1; the crystals are the big prizes
// crystal prizes that turn up now and then instead of a bar: pays val × the bar value you were playing; the rainbow one sets off a bar shower.
// Tuned with tools/sim.js: bars alone return about 76%, crystals about 18%, so the machine pays back about 95% over a long run (slapping every clear window included).
const ITEMS = {
  blue:    { val: 5,  size: .085, odds: .012 },
  violet:  { val: 10, size: .095, odds: .005 },
  pink:    { val: 25, size: .105, odds: .0016 },
  gold:    { val: 50, size: .12,  odds: .0006 },        // the jackpot crystal
  rainbow: { val: 0,  size: .1,   odds: .004 } };      // off the front: a BAR SHOWER (free bars onto the pusher)
const SHOWER = 8;
const TRAYF = .22, BARF = .2;                            // friction: the tray floor, and bar on bar (lower = the pile slides forward instead of heaping up)
let credits = typeof Wallet !== "undefined" ? Wallet.load() : START;
let RP = null, world = null, pusher = null, pieces = [], clock = 0, face = FACE[0], nextId = 1, events = [];
const FORCE = { item: null };                           // debug / tests: the next drop is this prize
// slapping the machine: the lookout (Zib, on the little screen up top) watches the casino floor. Now and then the guard wanders off and the coast is
// clear for a few seconds: you get LOOK.slaps free slaps that shake the pile. Slap while the guard is watching and security fines you LOOK.fine × your bar
// value and hangs around a while longer. Tuned with tools/sim.js (slapping every clear window adds a little to the payback, not a lot).
const LOOK = { gap: [32, 58], soon: 3, clear: 5, slaps: 2, fine: 15, linger: 25 };
const rnd = (a, b) => a + Math.random() * (b - a);
let look = { state: "watch", t: rnd(...LOOK.gap), left: 0 };

const faceAt = t => FACE[0] + (FACE[1] - FACE[0]) * (.5 - .5 * Math.cos(2 * Math.PI * t / PERIOD));   // eases at both ends, like a cam
// a crystal's shape: a six-sided gem, pointed top and bottom (the screen draws the same points)
const gemPoints = s => { const p = []; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; p.push(Math.cos(a) * s * .5, 0, Math.sin(a) * s * .5); } p.push(0, s * .62, 0, 0, -s * .38, 0); return new Float32Array(p); };

// build the machine. RAPIER must already be initialised (await RAPIER.init()).
function init(RAPIER) { RP = RAPIER; world = new RP.World({ x: 0, y: -9.81, z: 0 }); world.timestep = 1 / 60;
  if (world.integrationParameters && "lengthUnit" in world.integrationParameters) world.integrationParameters.lengthUnit = .1;   // small pieces: settle and sleep at small-object scales
  const fixed = (hx, hy, hz, x, y, z, fr = TRAYF) => world.createCollider(RP.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x, y, z).setFriction(fr));
  fixed(W / 2 + .1, .05, (L + .7) / 2, 0, -.05, (L - .7) / 2);              // the tray floor (running back under the pusher)
  for (const s of [-1, 1]) fixed(.05, .3, (L + .7) / 2, s * (W / 2 + .05), .3, (L - .7) / 2, .2);   // side walls
  fixed(W / 2, .25, .03, 0, PH + .004 + .25, -.03, .1);                      // the scraper wall above the pusher's top
  pusher = world.createRigidBody(RP.RigidBodyDesc.kinematicPositionBased().setTranslation(0, PH / 2, face - PD / 2));
  world.createCollider(RP.ColliderDesc.cuboid(W / 2 - .003, PH / 2, PD / 2).setFriction(.35), pusher); }

function addPiece(kind, val, x, y, z, q, denom) { const it = ITEMS[kind];
  const bd = RP.RigidBodyDesc.dynamic().setTranslation(x, y, z).setLinearDamping(.15).setAngularDamping(.4); if (q) bd.setRotation(q);
  const body = world.createRigidBody(bd);
  const cd = it ? RP.ColliderDesc.convexHull(gemPoints(it.size)) : RP.ColliderDesc.cuboid(BAR[0] / 2, BAR[1] / 2, BAR[2] / 2);
  cd.setFriction(it ? .3 : BARF).setRestitution(.05).setDensity(it ? 1400 : 2000);
  world.createCollider(cd, body); const p = { id: nextId++, body, kind, val, denom: denom || val, born: clock }; pieces.push(p); return p; }
const randYaw = (spread = Math.PI) => { const a = (Math.random() - .5) * spread; return { x: 0, y: Math.sin(a / 2), z: 0, w: Math.cos(a / 2) }; };

// drop a bar at x (−W/2…W/2) worth `denom`. It falls onto the pusher. Returns the new piece, or null if you can't afford it.
function drop(x, denom) { if (!DENOMS.includes(denom) || credits < denom) return null; credits -= denom;
  let kind = "bar"; if (FORCE.item) { kind = FORCE.item; FORCE.item = null; } else { const r = Math.random(); let acc = 0; for (const [k, it] of Object.entries(ITEMS)) { acc += it.odds; if (r < acc) { kind = k; break; } } }
  const it = ITEMS[kind], xx = Math.max(-W / 2 + .06, Math.min(W / 2 - .06, x));
  const p = addPiece(kind, it ? it.val * denom : denom, xx, PH + .22, .03 + Math.random() * Math.max(.02, face - .08), randYaw(.6), denom);
  if (kind !== "bar") events.push({ type: "prize", kind }); return p; }
// free bars (a bar shower), raining onto the pusher
function shower(denom, n = SHOWER) { for (let i = 0; i < n; i++) addPiece("bar", denom, (Math.random() - .5) * (W - .14), PH + .25 + i * .05, .03 + Math.random() * Math.max(.02, face - .08), randYaw(), denom); }

// advance the machine by dt seconds. Returns what happened: [{type:"win"|"gutter", x, y, z, val, kind}, {type:"shower"}, {type:"prize"}…]
function step(dt, denomForShower = 1) {
  clock += dt; face = faceAt(clock); pusher.setNextKinematicTranslation({ x: 0, y: PH / 2, z: face - PD / 2 });
  look.t -= dt;
  if (look.state === "watch" && look.t <= LOOK.soon) { look.state = "soon"; events.push({ type: "soon" }); }
  else if (look.state === "soon" && look.t <= 0) { look.state = "clear"; look.t = LOOK.clear; look.left = LOOK.slaps; events.push({ type: "clear" }); }
  else if (look.state === "clear" && (look.t <= 0 || look.left <= 0)) { look.state = "watch"; look.t = rnd(...LOOK.gap); const used = look.left <= 0; look.left = 0; events.push({ type: "watch", used }); }
  world.timestep = dt; world.step();
  const out = events; events = [];
  pieces = pieces.filter(p => { const t = p.body.translation(); if (t.y > -.12 && Math.abs(t.x) < W && t.z < L + .5) return true;
    const win = t.z > L - .1 && Math.abs(t.x) < W / 2 - GUTTER;
    if (win) { credits += p.val; out.push({ type: "win", x: t.x, y: t.y, z: t.z, val: p.val, kind: p.kind, denom: p.denom }); if (p.kind === "rainbow") { shower(denomForShower); out.push({ type: "shower", n: SHOWER }); } }
    else out.push({ type: "gutter", x: t.x, y: t.y, z: t.z, val: p.val, kind: p.kind, denom: p.denom });
    world.removeRigidBody(p.body); return false; });
  return out; }

// shake the pile: every piece gets a kick away from the slapped side (side −1 = left, 1 = right), a hop, and a nudge toward the front
function shake(side, k = 1) { for (const p of pieces) { const b = p.body, m = b.mass(); b.wakeUp();
    b.applyImpulse({ x: -side * m * rnd(.25, .45) * k, y: m * rnd(.4, .7) * k, z: m * rnd(.15, .4) * k }, true);
    b.applyTorqueImpulse({ x: m * rnd(-1, 1) * 1e-3 * k, y: m * rnd(-1, 1) * 1e-3 * k, z: m * rnd(-1, 1) * 1e-3 * k }, true); } }
// slap the side of the machine. Returns {ok:true, left} in a clear window, or {caught:true, fine} if the guard saw you.
function slap(side, denom = 1) {
  if (look.state === "clear" && look.left > 0) { look.left--; shake(side); return { ok: true, left: look.left }; }
  const fine = Math.min(credits, LOOK.fine * denom); credits -= fine; shake(side, .3);
  look.state = "watch"; look.left = 0; look.t = Math.max(look.t, LOOK.linger); events.push({ type: "caught", fine }); return { caught: true, fine }; }
function forceClear() { look.state = "clear"; look.t = LOOK.clear; look.left = LOOK.slaps; }   // debug / tests
const lookout = () => ({ state: look.state, t: Math.max(0, look.t), left: look.left });

function clear() { for (const p of pieces) world.removeRigidBody(p.body); pieces = []; }
// a fresh tray: rows of bars right up to the front lip (so play pays from the first drops), some stacked, some on the pusher, a few crystals; then let it settle
function seed(denom = 1) { const keep = credits; clear(); clock = 0; face = FACE[0]; pusher.setTranslation({ x: 0, y: PH / 2, z: face - PD / 2 }, true);
  const dx = BAR[0] + .012, dz = BAR[2] + .014;
  for (let z = FACE[1] + .06, row = 0; z < L - .02; z += dz, row++) for (let x = -W / 2 + .06 + (row % 2) * dx / 2; x < W / 2 - .05; x += dx)
    if (Math.random() < .9) addPiece("bar", denom, x + (Math.random() - .5) * .01, BAR[1] / 2 + .002, z, randYaw(.5), denom);
  for (let i = 0; i < 60; i++) addPiece("bar", denom, (Math.random() - .5) * (W - .14), BAR[1] * 1.6, FACE[1] + .1 + Math.random() * (L - FACE[1] - .2), randYaw(), denom);   // a second layer here and there
  for (let i = 0; i < 24; i++) addPiece("bar", denom, (Math.random() - .5) * (W - .14), PH + .03 + (i % 3) * .03, .03 + Math.random() * (FACE[0] - .06), randYaw(), denom);   // riding on the pusher
  for (const k of ["blue", "blue", "violet", "rainbow"]) addPiece(k, ITEMS[k].val * denom, (Math.random() - .5) * .6, .12, .55 + Math.random() * .4, randYaw(), denom);
  for (let i = 0; i < 150; i++) step(1 / 60);       // settle (anything that falls off now doesn't count)
  credits = keep; clock = 0; events = []; }

// the tray as plain data, to save between visits (so the pile you built up is still there) and to restore
const snapshot = () => ({ v: 2, clock: Math.round(clock * 100) / 100, p: pieces.map(p => { const t = p.body.translation(), q = p.body.rotation(); return [t.x, t.y, t.z, q.x, q.y, q.z, q.w].map(v => Math.round(v * 1e4) / 1e4).concat([p.kind, p.val, p.denom]); }) });
function restore(s) { try { if (!s || s.v !== 2 || !Array.isArray(s.p) || s.p.length < 40) return false; clear(); clock = s.clock || 0; face = faceAt(clock); pusher.setTranslation({ x: 0, y: PH / 2, z: face - PD / 2 }, true);
    for (const [x, y, z, qx, qy, qz, qw, kind, val, denom] of s.p) { const one = DENOMS.includes(denom);   // older saves had bars of other values: they come back as plain bars
      const p = addPiece(kind, one ? val : (ITEMS[kind] ? ITEMS[kind].val : 1), x, y, z, { x: qx, y: qy, z: qz, w: qw }, one ? denom : 1); p.body.sleep(); } return true; } catch (e) { return false; } }

// keep the shared wallet in step with this game's balance (not in Node tests)
if (typeof Wallet !== "undefined") Wallet.watch(() => credits);

if (typeof module !== "undefined") module.exports = { W, L, PH, PD, FACE, PERIOD, GUTTER, BAR, DENOMS, ITEMS, SHOWER, init, drop, shower, step, seed, snapshot, restore, faceAt, gemPoints, FORCE, LOOK, slap, shake, lookout,
  forceClear,
  get credits() { return credits; }, set credits(v) { credits = v; }, get pieces() { return pieces; }, get face() { return face; }, get world() { return world; } };
