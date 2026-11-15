// Slot-machine robot. The cabinet front copies the phone game's layout top to bottom, at the same proportions:
// HUD strip (credits · neon title · icons) on the topper → face box on the head screen → 3×3 reels with payline tabs in the middle window
// → line buttons, AUTO/FAST, SPIN and BET/WIN on the sloped button deck. Short corrugated legs with box feet, corrugated arms with claws.
// Units are metres, it faces +Z, origin on the floor between the feet.
// Node names Godot will see: SlotBot, Rig, Body, Hip_L/R, Ankle_L/R, Shoulder_L/R, Claw_L/R, Finger_L0..R2, HudPanel, FaceScreen, ReelWindow, ControlDeck.
function buildSlotBot(THREE, opts = {}) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const std = (name, color, metalness, roughness, extra = {}) => new THREE.MeshStandardMaterial({ name, color, metalness, roughness, flatShading: true, ...extra });
  const mat = {
    shell: std("Shell", 0x2c2b34, .55, .38),
    shellDark: std("ShellDark", 0x1c1b22, .45, .45),
    trim: std("GoldTrim", 0xffc845, .85, .28),
    chrome: std("Chrome", 0xc9d2e0, .9, .22),
    tube: std("CorrugatedTube", 0x5d6479, .7, .36),
    dark: std("Dark", 0x0e0d13, .3, .55),
    sole: std("Sole", 0x1d1b24, .1, .8),
    beacon: std("Beacon", 0xffd27a, 0, .3, { emissive: 0xff9a1f, emissiveIntensity: 1.5, transparent: true, opacity: .92 }),
  };
  // screen panels: pictures of the real game screen, lit from within
  const T = opts.tex || {};
  const imgTex = img => { const t = new THREE.Texture(img); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; t.needsUpdate = !!img; return t; };
  const screen = (name, tex) => new THREE.MeshStandardMaterial({ name, color: 0x000000, emissive: 0xffffff, emissiveMap: tex, roughness: .6, metalness: 0 });
  const faceCanvas = document.createElement("canvas"); faceCanvas.width = 716; faceCanvas.height = 410;
  const faceTex = new THREE.CanvasTexture(faceCanvas); faceTex.encoding = THREE.sRGBEncoding; faceTex.anisotropy = 8;
  mat.hud = screen("HudPanel", imgTex(T.hud)); mat.face = screen("FaceScreen", faceTex);
  mat.reels = screen("ReelWindow", imgTex(T.glass)); mat.deck = screen("ControlDeck", imgTex(T.controls));
  const faces = T.faces || {};
  function setMood(m) { const im = faces[m]; if (!im) return; const c = faceCanvas.getContext("2d"); c.clearRect(0, 0, 716, 410); c.drawImage(im, 0, 0, 716, 410); faceTex.needsUpdate = true; }
  setMood(opts.mood || "happy");

  // ---- geometry helpers ----
  function chamferBox(w, h, d, c, taperTop = 1) {
    const s = new THREE.Shape(), x = w / 2 - c, y = h / 2 - c;
    s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * c, bevelEnabled: true, bevelThickness: c, bevelSize: c, bevelSegments: 1, curveSegments: 1 });
    g.translate(0, 0, -(d - 2 * c) / 2);
    if (taperTop !== 1) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + h / 2) / h; p.setX(i, p.getX(i) * (1 + (taperTop - 1) * t)); } }
    return g;
  }
  // corrugated tube: alternating fat and thin rings along a curve, like a flexible conduit
  function corrTube(points, r, { pitch = r * .85, depth = .2, radial = 10 } = {}) {
    const curve = points.length === 2 ? new THREE.LineCurve3(points[0], points[1]) : new THREE.CatmullRomCurve3(points, false, "centripetal");
    const rings = Math.max(4, Math.round(curve.getLength() / pitch) * 2), fr = curve.computeFrenetFrames(rings, false);
    const pos = [], idx = [];
    for (let i = 0; i <= rings; i++) {
      const P = curve.getPointAt(i / rings), N = fr.normals[i], B = fr.binormals[i], rr = (i % 2) ? r : r * (1 - depth);
      for (let j = 0; j <= radial; j++) { const a = j / radial * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a);
        pos.push(P.x + rr * (cs * N.x + sn * B.x), P.y + rr * (cs * N.y + sn * B.y), P.z + rr * (cs * N.z + sn * B.z)); }
    }
    for (let i = 0; i < rings; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    // end caps
    const P0 = curve.getPointAt(0), P1 = curve.getPointAt(1), c0 = pos.length / 3; pos.push(P0.x, P0.y, P0.z, P1.x, P1.y, P1.z);
    const last = rings * (radial + 1);
    for (let j = 0; j < radial; j++) { idx.push(c0, j + 1, j); idx.push(c0 + 1, last + j, last + j + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    g.userData.curve = curve; return g;
  }
  function add(parent, geom, material, name, p = [0, 0, 0], r = [0, 0, 0]) {
    const m = new THREE.Mesh(geom, material); m.name = name; m.position.set(...p); m.rotation.set(...r); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  const grp = (parent, name, p = [0, 0, 0]) => { const g = new THREE.Group(); g.name = name; g.position.set(...p); parent.add(g); return g; };
  const cyl = (rt, rb, h, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);

  // ---- assemble ----
  const root = new THREE.Group(); root.name = "SlotBot";
  const rig = grp(root, "Rig");
  const BP = .4;                                               // Body pivot height: leaning and bobbing rotate around the hips
  const body = grp(rig, "Body", [0, BP, 0]);
  const cab = grp(body, "Cabinet", [0, -BP, 0]);               // everything on the body hangs off this, positioned from the floor

  // the game screen is 358 px wide; the screens are W metres wide, so 1 px = PX metres and every panel keeps the game's proportions
  const W = .56, PX = W / 358, D = .46, FZ = D / 2, WT = W + .06;   // FZ = front face, WT = full cabinet width
  const HUD_H = 54 * PX, FACE_H = 205 * PX, GLASS_H = 310 * PX, CTRL_H = 173 * PX;

  // legs: short and squat — hip ball → wide corrugated tube → ankle (counter-rotates in the walk so the feet stay flat)
  const HIP_Y = .34, LEG = .2, FOOT_H = .1;
  const hips = {}, fingers = {}, shoulders = {}, claws = {};
  for (const [s, x] of [["L", -.15], ["R", .15]]) {
    const hip = hips[s] = grp(rig, "Hip_" + s, [x, HIP_Y, 0]);
    add(hip, new THREE.IcosahedronGeometry(.085, 1), mat.chrome, "HipBall_" + s);
    add(hip, corrTube([V(0, -.03, 0), V(0, -LEG + .015, 0)], .088, { radial: 12, pitch: .042, depth: .16 }), mat.tube, "Leg_" + s);
    const ank = grp(hip, "Ankle_" + s, [0, -LEG, 0]);
    add(ank, cyl(.1, .108, .045, 12), mat.chrome, "AnkleCollar_" + s, [0, -.005, 0]);
    const footY = -(HIP_Y - LEG);
    const foot = chamferBox(.27, FOOT_H, .36, .02); const fp = foot.attributes.position;
    for (let i = 0; i < fp.count; i++) if (fp.getY(i) > 0 && fp.getZ(i) > .06) fp.setZ(i, fp.getZ(i) - .07);
    add(ank, foot, mat.shell, "Foot_" + s, [0, footY + FOOT_H / 2 + .014, .035]);
    add(ank, chamferBox(.28, .026, .37, .006), mat.sole, "Sole_" + s, [0, footY + .013, .035]);
    add(ank, chamferBox(.2, .02, .06, .006), mat.trim, "ToeCap_" + s, [0, footY + .07, .18], [-.55, 0, 0]);
  }

  // ---- the cabinet: ONE shell, made by sweeping a single side profile across the width ----
  // profile runs: base → overhanging button deck → reel window → face screen → HUD topper leaning back → top → back
  const BASE_B = .42, BASE_T = .66, TILT = .95;                // TILT: deck slope, radians back from vertical
  const deckH = CTRL_H * Math.cos(TILT), deckD = CTRL_H * Math.sin(TILT);
  const ZF = FZ + .02, ZD = FZ + deckD, LIP = .035;             // base front, deck front edge
  const GB = BASE_T + LIP + deckH;                              // top of the deck = bottom of the reel window area
  const GLASS_C = GB + .03 + GLASS_H / 2;
  const FACE_C = GLASS_C + GLASS_H / 2 + .045 + FACE_H / 2;
  const FACE_T = FACE_C + FACE_H / 2 + .025;
  const HUD_RISE = HUD_H + .045, HUD_BACK = .035, TOP = FACE_T + .015 + HUD_RISE, ZB = -D / 2;
  const prof = [[ZB, BASE_B], [ZF, BASE_B], [ZF, BASE_T - .075], [ZD, BASE_T], [ZD, BASE_T + LIP], [FZ, GB], [FZ, FACE_T],
                [FZ - .012, FACE_T + .015], [FZ - .012 - HUD_BACK, TOP], [ZB + .05, TOP], [ZB, TOP - .07]];
  const BV = .022;                                              // chamfer on every edge of the shell
  // shrink the outline by the chamfer so the finished surfaces land exactly on the profile
  const inset = prof.map((p, i) => { const a = prof[(i + prof.length - 1) % prof.length], c = prof[(i + 1) % prof.length];
    const n = (u, v) => { const dx = v[0] - u[0], dy = v[1] - u[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; };
    const n1 = n(a, p), n2 = n(p, c), k = BV / (1 + n1[0] * n2[0] + n1[1] * n2[1]); return [p[0] + (n1[0] + n2[0]) * k, p[1] + (n1[1] + n2[1]) * k]; });
  const shp = new THREE.Shape(); inset.forEach(([x, y], i) => i ? shp.lineTo(x, y) : shp.moveTo(x, y)); shp.closePath();
  const shellG = new THREE.ExtrudeGeometry(shp, { depth: WT - 2 * BV, bevelEnabled: true, bevelThickness: BV, bevelSize: BV, bevelSegments: 1, curveSegments: 1 });
  shellG.rotateY(-Math.PI / 2); shellG.translate((WT - 2 * BV) / 2, 0, 0);
  add(cab, shellG, mat.shell, "Shell");

  // recessed side panels so the big flat sides have some structure
  for (const sx of [-1, 1]) add(cab, chamferBox(.008, FACE_T - GB - .04, D - .12, .004), mat.shellDark, `SidePanel_${sx < 0 ? "L" : "R"}`, [sx * (WT / 2 + .001), (GB + FACE_T) / 2, -.02]);
  // pelvis the legs plug into
  add(cab, chamferBox(.5, .1, .38, .025), mat.dark, "Pelvis", [0, .385, 0]);
  // coin tray + side vents on the base
  add(cab, chamferBox(.36, .07, .05, .012), mat.dark, "CoinTray", [0, .5, ZF + .012]);
  add(cab, chamferBox(.38, .014, .06, .004), mat.trim, "CoinTrayLip", [0, .535, ZF + .02]);
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) add(cab, chamferBox(.012, .02, .26, .004), mat.dark, `Vent_${sx < 0 ? "L" : "R"}${i}`, [sx * (WT / 2 + .002), .47 + i * .042, -.02]);

  // screen panels sit flush in thin dark bezels, like the chamfered panels in the game UI
  const bezel = (name, h, p, rx = 0) => add(cab, chamferBox(W + .024, h + .024, .012, .005), mat.dark, name, p, [rx, 0, 0]);
  const deck = grp(cab, "Deck", [0, BASE_T + LIP + deckH / 2, FZ + deckD / 2]); deck.rotation.x = -TILT;
  add(deck, chamferBox(W + .024, CTRL_H + .024, .012, .005), mat.dark, "DeckBezel", [0, 0, .002]);
  add(deck, new THREE.PlaneGeometry(W, CTRL_H), mat.deck, "ControlDeck", [0, 0, .0085]);
  add(cab, chamferBox(WT - .03, .016, .008, .003), mat.trim, "DeckLipTrim", [0, BASE_T + LIP / 2, ZD + .004]);
  bezel("ReelBezel", GLASS_H, [0, GLASS_C, FZ + .004]);
  add(cab, new THREE.PlaneGeometry(W, GLASS_H), mat.reels, "ReelWindow", [0, GLASS_C, FZ + .0105]);
  bezel("FaceBezel", FACE_H, [0, FACE_C, FZ + .004]);
  add(cab, new THREE.PlaneGeometry(W, FACE_H), mat.face, "FaceScreen", [0, FACE_C, FZ + .0105]);
  const hudTilt = Math.atan2(HUD_BACK, HUD_RISE), HUD_C = FACE_T + .015 + HUD_RISE / 2, HUD_Z = FZ - .012 - HUD_BACK / 2;
  const hud = grp(cab, "Hud", [0, HUD_C, HUD_Z]); hud.rotation.x = -hudTilt;
  add(hud, chamferBox(W + .024, HUD_H + .024, .012, .005), mat.dark, "HudBezel", [0, 0, .004]);
  add(hud, new THREE.PlaneGeometry(W, HUD_H), mat.hud, "HudPanel", [0, 0, .0105]);
  add(cab, cyl(.05, .06, .025, 12), mat.chrome, "BeaconBase", [0, TOP + .012, -.02]);
  add(cab, new THREE.SphereGeometry(.048, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), mat.beacon, "Beacon", [0, TOP + .024, -.02]);

  // arms: shoulder pivot → corrugated tube → claw (3 fingers that open and close)
  for (const [s, sx] of [["L", -1], ["R", 1]]) {
    const sh = shoulders[s] = grp(cab, "Shoulder_" + s, [sx * (WT / 2 - .01), GLASS_C - .02, 0]);
    add(sh, cyl(.08, .08, .07, 14), mat.chrome, "ShoulderCap_" + s, [sx * .03, 0, 0], [0, 0, Math.PI / 2]);
    const pts = [V(sx * .05, 0, 0), V(sx * .13, -.05, 0), V(sx * .18, -.18, .05), V(sx * .17, -.32, .14)];
    const tg = corrTube(pts, .058, { radial: 12, pitch: .036, depth: .17 }); add(sh, tg, mat.tube, "Arm_" + s);
    const end = pts[3], dir = tg.userData.curve.getTangentAt(1).normalize();
    const claw = claws[s] = grp(sh, "Claw_" + s, [end.x, end.y, end.z]); claw.quaternion.setFromUnitVectors(V(0, -1, 0), dir); claw.scale.setScalar(1.55);
    add(claw, cyl(.042, .036, .045, 10), mat.chrome, "Wrist_" + s, [0, -.012, 0]);
    add(claw, cyl(.03, .03, .02, 10), mat.dark, "Palm_" + s, [0, -.044, 0]);
    for (let f = 0; f < 3; f++) {
      const rot = grp(claw, `FingerBase_${s}${f}`, [0, -.048, 0]); rot.rotation.y = f * Math.PI * 2 / 3;
      const piv = grp(rot, `Finger_${s}${f}`, [.02, 0, 0]); piv.rotation.z = .38; fingers[s + f] = piv;
      add(piv, chamferBox(.016, .06, .022, .004), mat.chrome, `FingerA_${s}${f}`, [0, -.03, 0]);
      add(piv, chamferBox(.014, .045, .02, .004), mat.trim, `FingerB_${s}${f}`, [-.012, -.072, 0], [0, 0, -.62]);
    }
  }

  // bake flat (faceted) normals into every mesh so it stays low-poly-looking in Godot too
  root.traverse(o => { if (o.isMesh && !(o.geometry.type === "PlaneGeometry")) { let g = o.geometry; if (g.index) g = g.toNonIndexed(); g.computeVertexNormals(); o.geometry = g; } });

  // ---- animations: every mood has its own idle stance and its own walk ----
  // lean = forward tilt (rad), bob = breathing height, armX = arms forward (negative = raised forward), armZ = arms out (+) / in (−),
  // fin = claw openness, walk = seconds per stride (bigger = slower), stride = leg swing, bounce = hop per step
  const MOOD_ANIM = {
    happy:       { lean: 0,    bob: .01,  bobN: 1, armX: 0,    armZ: .06,  wave: .05, waveN: 1, fin: .38, finA: .12, finN: 2, yaw: 0,   roll: 0,    rollN: 1, walk: .85, stride: .4,  bounce: .012, swingArms: .9 },
    giddy:       { lean: -.05, bob: .022, bobN: 4, armX: -.55, armZ: .4,   wave: .3,  waveN: 4, fin: .45, finA: .35, finN: 8, yaw: .05, roll: .03,  rollN: 4, walk: .55, stride: .46, bounce: .032, swingArms: 1.2 },
    grumpy:      { lean: .07,  bob: .004, bobN: 1, armX: .08,  armZ: -.02, wave: 0,   waveN: 1, fin: .06, finA: .03, finN: 6, yaw: 0,   roll: .012, rollN: 9, walk: 1.2, stride: .3,  bounce: .004, swingArms: .4 },
    sleepy:      { lean: .14,  bob: .014, bobN: 1, armX: -.62, armZ: .04,  wave: .06, waveN: 1, fin: .55, finA: .05, finN: 1, yaw: 0,   roll: .035, rollN: 1, walk: 1.55, stride: .24, bounce: .005, swingArms: .3 },
    mischievous: { lean: .06,  bob: .006, bobN: 2, armX: -.42, armZ: -.2,  wave: .06, waveN: 3, fin: .3,  finA: .2,  finN: 6, yaw: .12, roll: .02,  rollN: 1, walk: .95, stride: .32, bounce: .007, swingArms: .5, crouch: .03 },
  };
  const Q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray();
  const qTrack = (name, times, eulers) => new THREE.QuaternionKeyframeTrack(name + ".quaternion", times, eulers.flatMap(e => Q(...e)));
  const pTrack = (name, times, vals) => new THREE.VectorKeyframeTrack(name + ".position", times, vals.flat());
  const N = 24, TT = Array.from({ length: N + 1 }, (_, i) => i / N), S = (t, n = 1) => Math.sin(t * Math.PI * 2 * n);
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const clips = [];
  for (const [mood, m] of Object.entries(MOOD_ANIM)) {
    const IT = TT.map(t => t * 2.4), idle = [
      pTrack("Body", IT, TT.map(t => [0, BP + m.bob * S(t, m.bobN) - (m.crouch || 0), 0])),
      qTrack("Body", IT, TT.map(t => [m.lean + m.bob * .6 * S(t, m.bobN), m.yaw * S(t), m.roll * S(t, m.rollN)])),
      qTrack("Shoulder_L", IT, TT.map(t => [m.armX + m.wave * .5 * S(t, m.waveN), 0, -(m.armZ + m.wave * S(t, m.waveN))])),
      qTrack("Shoulder_R", IT, TT.map(t => [m.armX - m.wave * .5 * S(t, m.waveN), 0, m.armZ + m.wave * S(t, m.waveN)])),
      pTrack("Rig", IT, TT.map(() => [0, 0, 0])),
    ];
    for (const s of ["L", "R"]) for (let f = 0; f < 3; f++) idle.push(qTrack(`Finger_${s}${f}`, IT, TT.map(t => [0, 0, Math.max(0, m.fin + m.finA * S(t + f * .07, m.finN))])));
    for (const s of ["L", "R"]) { idle.push(qTrack("Hip_" + s, IT, TT.map(() => [0, 0, 0]))); idle.push(qTrack("Ankle_" + s, IT, TT.map(() => [0, 0, 0]))); }
    clips.push(new THREE.AnimationClip("Idle_" + cap(mood), 2.4, idle));

    const WT2 = TT.map(t => t * m.walk), sw = t => m.stride * Math.cos(t * Math.PI * 2), walk = [
      pTrack("Rig", WT2, TT.map(t => [0, -LEG * (1 - Math.cos(Math.abs(sw(t)))) - .002, 0])),          // dips as the legs spread
      pTrack("Body", WT2, TT.map(t => [0, BP + m.bounce * Math.abs(S(t)) - (m.crouch || 0), 0])),
      qTrack("Body", WT2, TT.map(t => [m.lean, (.05 + m.yaw * .5) * Math.cos(t * Math.PI * 2), (.045 + m.roll) * S(t)])),
      qTrack("Hip_L", WT2, TT.map(t => [sw(t), 0, 0])), qTrack("Hip_R", WT2, TT.map(t => [-sw(t), 0, 0])),
      qTrack("Ankle_L", WT2, TT.map(t => [-sw(t), 0, 0])), qTrack("Ankle_R", WT2, TT.map(t => [sw(t), 0, 0])),
      qTrack("Shoulder_L", WT2, TT.map(t => [m.armX - sw(t) * m.swingArms, 0, -m.armZ])), qTrack("Shoulder_R", WT2, TT.map(t => [m.armX + sw(t) * m.swingArms, 0, m.armZ])),
    ];
    for (const s of ["L", "R"]) for (let f = 0; f < 3; f++) walk.push(qTrack(`Finger_${s}${f}`, WT2, TT.map(t => [0, 0, m.fin])));
    clips.push(new THREE.AnimationClip("Walk_" + cap(mood), m.walk, walk));
  }
  // "Grab": the right claw reaches out and snaps shut (pulling its own lever, grabbing coins, waving at the player)
  const gT = [0, .15, .3, .45, .7, 1.0], grab = [
    qTrack("Shoulder_R", gT, [[0, 0, 0], [-.9, 0, .25], [-1.25, 0, .3], [-1.25, 0, .3], [-.6, 0, .15], [0, 0, 0]]),
    pTrack("Body", gT, gT.map(() => [0, BP, 0])), qTrack("Body", gT, gT.map(() => [0, 0, 0])),
  ];
  for (let f = 0; f < 3; f++) grab.push(qTrack(`Finger_R${f}`, gT, [[0, 0, .38], [0, 0, .75], [0, 0, .9], [0, 0, .05], [0, 0, .05], [0, 0, .38]]));
  for (let f = 0; f < 3; f++) grab.push(qTrack(`Finger_L${f}`, gT, gT.map(() => [0, 0, .38])));
  clips.push(new THREE.AnimationClip("Grab", 1.0, grab));

  return { root, clips, setMood, moods: Object.keys(MOOD_ANIM), moodAnim: MOOD_ANIM, faceCanvas };
}
