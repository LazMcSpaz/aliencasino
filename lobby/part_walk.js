// First-person walking: the camera at a person's eye height, moved with one finger.
// Put a finger down and slide it up to walk forward (further up = faster, back down toward where you started = slower, below it = a slow backup),
// slide it left or right to turn, lift it to stop. Walk up to a machine and tap it to play. The game names along the bottom walk you over to that game.
// Desktop: drag with the mouse the same way, or use the arrow keys / WASD.
// May use: the lobby's cam, ctl, scene, placed, pickables, openGame, EXTRAS, walkers. Must not: change the games or the wallet.
const WALK = (() => {
  const EYE = 1.62, R = .32, MAXV = 1.8, BACKV = .55, MAXTURN = 1.8, REACH = 2.0, PITCH = -.12, DEAD = 12;
  const me = { x: .9, z: 10.6, yaw: 0, v: 0, turn: 0 };          // yaw 0 = facing the back wall (−z)
  let on = false, touch = null, rects = [], auto = null, lastAim = 0, bob = 0, walked = false, toastT = 0;
  const keys = {};
  const el = id => document.getElementById(id);
  const fwd = yaw => [-Math.sin(yaw), -Math.cos(yaw)];
  const restPad = () => { const p = el("wpad"); p.style.left = innerWidth / 2 + "px"; p.style.top = (innerHeight - 150) + "px"; el("wdot").style.transform = ""; p.classList.remove("active"); };

  // what you can't walk through: every machine that stays put, plus the bar, stage, booths, statue and pots
  function obstacles() { rects = [];
    placed.forEach(p => { if (p.holder.userData.walker) return; const b = new THREE.Box3().setFromObject(p.holder); rects.push([b.min.x, b.min.z, b.max.x, b.max.z]); });
    rects.push([5.85, -1.5, 7.2, 4.5]);                              // the bar counter
    (EXTRAS.obstacles || []).forEach(r => rects.push(r)); }
  const blocked = (x, z) => x < -6.7 || x > 6.7 || z < -5.7 || z > 11.6 || rects.some(r => x > r[0] - R && x < r[2] + R && z > r[1] - R && z < r[3] + R);
  function step(dx, dz) { if (!blocked(me.x + dx, me.z)) me.x += dx; if (!blocked(me.x, me.z + dz)) me.z += dz; }   // slide along walls instead of sticking

  function toast(msg) { const t = el("wtoast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1600); }
  // what's under a point on the screen: a game (and how far away it is) or an alien
  function pick(cx, cy) { const ndc = new THREE.Vector2(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1), ray = new THREE.Raycaster(); ray.setFromCamera(ndc, cam); ray.far = 14;
    const h = ray.intersectObjects(pickables, false).find(h => h.object.userData.game || h.object.userData.alien); if (!h) return null;
    const spot = h.object.userData.spot, pl = spot && placed.find(q => q.p === spot);
    // how far you are from the machine: from its footprint's nearest edge (a long table counts as close when you're beside it)
    let dist = Math.hypot(h.point.x - me.x, h.point.z - me.z);
    if (pl) { const b = new THREE.Box3().setFromObject(pl.holder), cx = Math.max(b.min.x, Math.min(me.x, b.max.x)), cz = Math.max(b.min.z, Math.min(me.z, b.max.z)); dist = Math.hypot(cx - me.x, cz - me.z); }
    return { game: h.object.userData.game, spot, alien: h.object.userData.alien, dist }; }
  function tap(cx, cy) { const h = pick(cx, cy); if (!h) return;
    if (h.alien) { h.alien.react(); return; }
    if (h.dist <= REACH) openGame(h.game, h.spot); else toast(`Walk closer to play ${h.game.name}`); }

  // the game names along the bottom: walk over and face that game (a second tap once you're there plays it)
  function goTo(id) { const p = placed.find(q => q.g.id === id && (q.lab || q.p.kind !== "bot")) || placed.find(q => q.g.id === id); if (!p) return;
    const b = new THREE.Box3().setFromObject(p.holder), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3()), va = p.holder.userData.walker ? p.holder.rotation.y : p.p.va;
    let d = Math.max(s.x, s.z) / 2 + 1.1, tx, tz;  for (let i = 0; i < 12; i++, d += .3) { tx = c.x + Math.sin(va) * d; tz = c.z + Math.cos(va) * d; if (!blocked(tx, tz)) break; }
    if (Math.hypot(tx - me.x, tz - me.z) < .6) { openGame(p.g, p.p); return; }
    const yaw = Math.atan2(-(c.x - tx), -(c.z - tz));
    auto = { x1: tx, z1: tz, y1: yaw, t0: performance.now(), moved: false }; }   // a quick fade to black, arrive, fade back in (so it never passes through machines)

  // ---- the finger ----
  const cv = document.getElementById("c");
  cv.addEventListener("pointerdown", e => { if (!on) return; if (auto && !auto.moved) { el("wfade").style.opacity = 0; auto = null; } touch = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
    const p = el("wpad"); p.style.left = e.clientX + "px"; p.style.top = e.clientY + "px"; p.classList.add("active"); try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
  cv.addEventListener("pointermove", e => { if (!on || !touch || e.pointerId !== touch.id) return; touch.x = e.clientX; touch.y = e.clientY;
    const dx = touch.x - touch.x0, dy = touch.y - touch.y0, d = Math.hypot(dx, dy); if (d > DEAD) touch.moved = true;
    const k = Math.min(1, 62 / (d || 1)); el("wdot").style.transform = `translate(${dx * k}px,${dy * k}px)`; });
  const end = e => { if (!on || !touch || e.pointerId !== touch.id) return; const quick = performance.now() - touch.t < 450;
    if (!touch.moved && quick) tap(touch.x, touch.y); touch = null; restPad(); };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  addEventListener("keydown", e => { keys[e.key.toLowerCase()] = true; }); addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });

  function update(dt) {
    let vt = 0, tt = 0;
    if (touch) { const up = touch.y0 - touch.y, side = touch.x - touch.x0;
      vt = up > 0 ? Math.max(0, Math.min(1, (up - DEAD) / 120)) * MAXV                          // how far up the finger is = how fast you walk
                  : -Math.max(0, Math.min(1, (-up - DEAD) / 120)) * BACKV;                       // below where it started: a slow step backward
      tt = -Math.sign(side) * Math.max(0, Math.min(1, (Math.abs(side) - DEAD) / 130)) * MAXTURN; }   // how far to the side = how fast you turn
    if (keys.arrowup || keys.w) vt = MAXV * .8; if (keys.arrowdown || keys.s) vt = -MAXV * .5;
    if (keys.arrowleft || keys.a) tt = MAXTURN * .8; if (keys.arrowright || keys.d) tt = -MAXTURN * .8;
    me.v += (vt - me.v) * Math.min(1, dt * (vt ? 5 : 9)); me.turn += (tt - me.turn) * Math.min(1, dt * 8);
    if (auto) { const k = (performance.now() - auto.t0) / 260, f = el("wfade");   // timed by the clock, so it takes the same time however fast the phone draws
      if (!auto.moved) { f.style.opacity = Math.min(1, k); if (k >= 1) { me.x = auto.x1; me.z = auto.z1; me.yaw = auto.y1; me.v = 0; auto.moved = true; auto.t0 = performance.now(); } }
      else { f.style.opacity = Math.max(0, 1 - k); if (k >= 1) { f.style.opacity = 0; auto = null; } } }
    else { me.yaw += me.turn * dt; const [fx, fz] = fwd(me.yaw); step(fx * me.v * dt, fz * me.v * dt); bob += Math.abs(me.v) * dt * 5.5; }
    if (Math.abs(me.v) > .3 && !walked) { walked = true; el("whint").style.opacity = 0; }
    const sway = Math.min(1, Math.abs(me.v) / MAXV);
    cam.position.set(me.x, EYE + Math.sin(bob * 2) * .022 * sway, me.z); cam.rotation.set(PITCH, me.yaw, Math.sin(bob) * .004 * sway, "YXZ");
    // a prompt when a game is right in front of you and close enough to play
    const now = performance.now(); if (now - lastAim > 180) { lastAim = now; const h = pick(innerWidth / 2, innerHeight * .55), pr = el("wprompt");
      if (h && h.game && h.dist <= REACH) { pr.textContent = `TAP TO PLAY  \u00b7  ${h.game.name.toUpperCase()}`; pr.style.setProperty("--gc", h.game.col); pr.hidden = false; } else pr.hidden = true; }
  }

  function enter() { on = true; ctl.enabled = false; tween = null; document.body.classList.add("walk"); el("wpad").hidden = false; el("whint").hidden = false; el("hint").style.opacity = 0;
    if (typeof unfocusQuiet === "function") unfocusQuiet(); restPad(); size(); }
  function exit() { on = false; touch = null; auto = null; document.body.classList.remove("walk"); el("wpad").hidden = true; el("whint").hidden = true; el("wprompt").hidden = true; el("hint").style.opacity = 1;
    ctl.enabled = true; size(); const H = home(); cam.rotation.set(0, 0, 0); ctl.target.set(...H.t); glide(new THREE.Vector3(...H.cam), new THREE.Vector3(...H.t)); }
  addEventListener("resize", () => { if (on) restPad(); });
  return { get on() { return on; }, enter, exit, update, goTo, ready: obstacles, me };
})();
