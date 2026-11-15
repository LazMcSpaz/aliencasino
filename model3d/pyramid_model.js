// Pyramid Scheme robot: a big, beefy cabinet on two squat corrugated legs, no arms.
// One continuous curved screen runs from a near-flat control deck, up through a tall upright section, and curls forward over the
// player at the top (like modern curved casino cabinets). Below the deck is a solid base with a stepped-pyramid emblem.
// Units are metres, it faces +Z, origin on the floor between the feet.
// Node names Godot will see: PyramidBot, Rig, Body, Hip_L/R, Ankle_L/R, Shell, CurvedScreen, Beacon.
function buildPyramidBot(THREE, opts = {}) {
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
    sand: std("Sandstone", 0xd9a35e, .15, .7),
    led: new THREE.MeshStandardMaterial({ name: "LedStrip", color: 0x000000, emissive: 0xffc845, emissiveIntensity: 1.6 }),
    ledPink: new THREE.MeshStandardMaterial({ name: "LedPink", color: 0x000000, emissive: 0xff5fae, emissiveIntensity: 1.3 }),
    beacon: std("Beacon", 0xffd27a, 0, .3, { emissive: 0xffa21f, emissiveIntensity: 1.5, transparent: true, opacity: .93 }),
  };
  const T = opts.tex || {};
  const scrTex = new THREE.Texture(T.screen); scrTex.encoding = THREE.sRGBEncoding; scrTex.anisotropy = 8; scrTex.needsUpdate = !!T.screen;
  mat.screen = new THREE.MeshBasicMaterial({ name: "CurvedScreen", map: scrTex, side: THREE.DoubleSide });   // a lit display: no glare from the room lights

  // ---- geometry helpers (same as the slot robot) ----
  function chamferBox(w, h, d, c) {
    const s = new THREE.Shape(), x = w / 2 - c, y = h / 2 - c;
    s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * c, bevelEnabled: true, bevelThickness: c, bevelSize: c, bevelSegments: 1, curveSegments: 1 });
    g.translate(0, 0, -(d - 2 * c) / 2); return g;
  }
  function corrTube(points, r, { pitch = r * .85, depth = .2, radial = 10 } = {}) {
    const curve = new THREE.LineCurve3(points[0], points[1]);
    const rings = Math.max(4, Math.round(curve.getLength() / pitch) * 2), pos = [], idx = [];
    const N = V(1, 0, 0), B = V(0, 0, 1);
    for (let i = 0; i <= rings; i++) { const P = curve.getPointAt(i / rings), rr = (i % 2) ? r : r * (1 - depth);
      for (let j = 0; j <= radial; j++) { const a = j / radial * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a);
        pos.push(P.x + rr * (cs * N.x + sn * B.x), P.y, P.z + rr * (cs * N.z + sn * B.z)); } }
    for (let i = 0; i < rings; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  }
  // a side profile (list of [z, y]) swept across the width, with every edge chamfered by bv
  function sweep(prof, width, bv) {
    const inset = prof.map((p, i) => { const a = prof[(i + prof.length - 1) % prof.length], c = prof[(i + 1) % prof.length];
      const n = (u, v) => { const dx = v[0] - u[0], dy = v[1] - u[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
      const n1 = n(a, p), n2 = n(p, c), k = bv / Math.max(.25, 1 + n1[0] * n2[0] + n1[1] * n2[1]); return [p[0] + (n1[0] + n2[0]) * k, p[1] + (n1[1] + n2[1]) * k]; });
    const shp = new THREE.Shape(); inset.forEach(([x, y], i) => i ? shp.lineTo(x, y) : shp.moveTo(x, y)); shp.closePath();
    const g = new THREE.ExtrudeGeometry(shp, { depth: width - 2 * bv, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 1, curveSegments: 1 });
    g.rotateY(-Math.PI / 2); g.translate((width - 2 * bv) / 2, 0, 0); return g;
  }
  function add(parent, geom, material, name, p = [0, 0, 0], r = [0, 0, 0]) {
    const m = new THREE.Mesh(geom, material); m.name = name; m.position.set(...p); m.rotation.set(...r); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  const grp = (parent, name, p = [0, 0, 0]) => { const g = new THREE.Group(); g.name = name; g.position.set(...p); parent.add(g); return g; };
  const cyl = (rt, rb, h, seg = 12) => new THREE.CylinderGeometry(rt, rb, h, seg);

  // ---- the screen's side profile: deck → bend up → tall upright → curl forward over the player ----
  // The screen image keeps the game's proportions: W wide, so its full length along the curve is W × (image height / width).
  const W = .7, IMG = T.rects || { w: 780, h: 1519, ctrlTop: 1241 }, L = W * IMG.h / IMG.w;
  const DECK = L * (1 - IMG.ctrlTop / IMG.h);                     // the controls part of the image lies on the flat deck
  const deg = Math.PI / 180, R1 = .2, R2 = .4;
  const segs = [ { len: DECK, a0: 12 * deg, a1: 12 * deg },          // control deck, 12° up from flat
                 { len: R1 * 72 * deg, a0: 12 * deg, a1: 84 * deg },  // bend up
                 { len: 0, a0: 84 * deg, a1: 84 * deg },              // upright, leaning back slightly (length fills the rest)
                 { len: R2 * 46 * deg, a0: 84 * deg, a1: 130 * deg } ]; // curl forward toward the player
  segs[2].len = L - segs[0].len - segs[1].len - segs[3].len;
  const P0 = [.5, .86];                                               // front edge of the deck (z, y)
  const curve = []; { let z = P0[0], y = P0[1], s = 0; const ds = .01;
    curve.push({ z, y, s, a: segs[0].a0 });
    for (const sg of segs) { const n = Math.max(1, Math.round(sg.len / ds));
      for (let i = 1; i <= n; i++) { const t0 = (i - .5) / n, a = sg.a0 + (sg.a1 - sg.a0) * t0, d = sg.len / n;
        z += -Math.cos(a) * d; y += Math.sin(a) * d; s += d; curve.push({ z, y, s, a: sg.a0 + (sg.a1 - sg.a0) * i / n }); } } }
  // offset a curve point toward the viewer (+) or into the cabinet (−)
  const off = (c, o) => [c.z + Math.sin(c.a) * o, c.y + Math.cos(c.a) * o];
  const END = curve[curve.length - 1], zMin = Math.min(...curve.map(c => c.z));

  // ---- assemble ----
  const root = new THREE.Group(); root.name = "PyramidBot";
  const rig = grp(root, "Rig");
  const BP = .3, body = grp(rig, "Body", [0, BP, 0]), cab = grp(body, "Cabinet", [0, -BP, 0]);
  const WT = W + .28, BASE_B = .3, ZF = .42, ZB = zMin - .44, TOPY = END.y + .07;

  // legs: very short, very fat corrugated stubs on big box feet
  const HIP_Y = .26, LEG = .12, FOOT_H = .1;
  for (const [s, x] of [["L", -.28], ["R", .28]]) {
    const hip = grp(rig, "Hip_" + s, [x, HIP_Y, -.02]);
    add(hip, new THREE.IcosahedronGeometry(.11, 1), mat.chrome, "HipBall_" + s);
    add(hip, corrTube([V(0, -.02, 0), V(0, -LEG + .01, 0)], .13, { radial: 14, pitch: .04, depth: .14 }), mat.tube, "Leg_" + s);
    const ank = grp(hip, "Ankle_" + s, [0, -LEG, 0]);
    add(ank, cyl(.15, .16, .04, 14), mat.chrome, "AnkleCollar_" + s, [0, -.004, 0]);
    const footY = -(HIP_Y - LEG);
    const foot = chamferBox(.36, FOOT_H, .5, .025); const fp = foot.attributes.position;
    for (let i = 0; i < fp.count; i++) if (fp.getY(i) > 0 && fp.getZ(i) > .1) fp.setZ(i, fp.getZ(i) - .09);   // sloped toe
    add(ank, foot, mat.shell, "Foot_" + s, [0, footY + FOOT_H / 2 + .016, .05]);
    add(ank, chamferBox(.37, .03, .51, .008), mat.sole, "Sole_" + s, [0, footY + .015, .05]);
    add(ank, chamferBox(.26, .022, .07, .006), mat.trim, "ToeCap_" + s, [0, footY + .075, .25], [-.5, 0, 0]);
  }
  add(cab, chamferBox(.86, .1, .6, .03), mat.dark, "Pelvis", [0, .285, -.02]);

  // the shell: one side profile swept across the full width — base block, deck nose, the curve (just behind the screen), hood, back
  const prof = [[ZB, BASE_B], [ZF, BASE_B], [ZF, P0[1] - .09], [P0[0] + .01, P0[1] - .035]];
  for (let i = 0; i < curve.length; i += 2) prof.push(off(curve[i], -.014));
  prof.push(off(END, -.014));
  prof.push([END.z - .02, TOPY], [ZB + .08, TOPY + .02], [ZB, TOPY - .1]);
  add(cab, sweep(prof, WT, .016), mat.shell, "Shell");

  // the curved screen: a ribbon following the curve, the game image mapped along its length (controls on the deck)
  { const pos = [], uv = [], idx = [];
    curve.forEach((c, i) => { const [z, y] = off(c, .004); pos.push(-W / 2, y, z, W / 2, y, z); const v = c.s / L; uv.push(0, v, 1, v);
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = add(cab, g, mat.screen, "CurvedScreen"); m.castShadow = false; }

  // raised side frames that hug the screen edges, with a gold LED strip running the full length of each
  const frameProf = []; for (let i = 0; i < curve.length; i += 2) frameProf.push(off(curve[i], .045)); frameProf.push(off(END, .045));
  for (let i = curve.length - 1; i >= 0; i -= 2) frameProf.push(off(curve[i], -.02));
  const FW = (WT - W) / 2;
  for (const sx of [-1, 1]) {
    const f = add(cab, sweep(frameProf, FW, .008), mat.shellDark, `ScreenFrame_${sx < 0 ? "L" : "R"}`); f.position.x = sx * (W / 2 + FW / 2);
    const pts = curve.filter((_, i) => i % 3 === 0).map(c => { const [z, y] = off(c, .045); return V(sx * (W / 2 + .014), y, z); });
    add(cab, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, .007, 6), mat.led, `LedStrip_${sx < 0 ? "L" : "R"}`);
    const pts2 = pts.map(p => V(sx * (WT / 2 - .014), p.y, p.z));
    add(cab, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2), 80, .006, 6), mat.ledPink, `LedOuter_${sx < 0 ? "L" : "R"}`);
  }
  // gold lip along the deck's front edge, and a dark hood lip over the top of the screen
  add(cab, chamferBox(WT - .02, .02, .025, .005), mat.trim, "DeckNoseTrim", [0, P0[1] - .03, P0[0] + .012]);
  { const [z, y] = off(END, .01); const hood = add(cab, chamferBox(WT, .03, .07, .008), mat.shellDark, "HoodLip", [0, y + .012, z - .01]); hood.rotation.x = -(END.a - Math.PI / 2); }

  // base front: a stepped-pyramid emblem in sandstone and gold, flanked by speaker grilles; gold kick band at the bottom
  const EMB_Y = (BASE_B + P0[1] - .09) / 2 - .01, emb = grp(cab, "Emblem", [0, EMB_Y, ZF + .003]);
  for (let i = 0; i < 4; i++) add(emb, chamferBox(.36 - i * .08, .055, .016 + i * .006, .004), i === 3 ? mat.trim : mat.sand, "Step" + i, [0, -.085 + i * .055, .008 + i * .003]);
  add(emb, chamferBox(.42, .014, .01, .003), mat.trim, "EmblemBase", [0, -.12, .006]);
  for (const sx of [-1, 1]) { const g = grp(cab, `Grille_${sx < 0 ? "L" : "R"}`, [sx * .36, EMB_Y, ZF + .004]);
    add(g, chamferBox(.14, .2, .012, .005), mat.dark, "GrillePlate");
    for (let i = 0; i < 6; i++) add(g, chamferBox(.11, .008, .006, .002), mat.shellDark, "Slot" + i, [0, -.075 + i * .03, .008]); }
  add(cab, chamferBox(WT - .02, .03, .02, .006), mat.trim, "KickBand", [0, BASE_B + .04, ZF + .006]);
  for (const sx of [-1, 1]) add(cab, chamferBox(.008, P0[1] - BASE_B - .14, ZF - ZB - .14, .004), mat.shellDark, `SidePanel_${sx < 0 ? "L" : "R"}`, [sx * (WT / 2 + .001), (BASE_B + P0[1] - .09) / 2, (ZF + ZB) / 2]);

  { const bz = ZB - .003, bh = TOPY - BASE_B;
    add(cab, chamferBox(WT - .16, bh * .45, .012, .006), mat.shellDark, "BackHatch", [0, BASE_B + bh * .62, bz]);
    for (let i = 0; i < 7; i++) add(cab, chamferBox(WT - .3, .014, .01, .003), mat.dark, "BackVent" + i, [0, BASE_B + .12 + i * .035, bz]);
    add(cab, chamferBox(WT - .1, .02, .01, .004), mat.trim, "BackTrim", [0, BASE_B + bh * .38, bz]); }
  // topper: a glowing four-sided pyramid on a chrome plinth
  const topZ = (END.z + ZB) / 2 - .02;
  add(cab, chamferBox(.24, .03, .24, .006), mat.chrome, "BeaconPlinth", [0, TOPY + .03, topZ]);
  add(cab, new THREE.ConeGeometry(.14, .17, 4, 1), mat.beacon, "Beacon", [0, TOPY + .045 + .085, topZ], [0, Math.PI / 4, 0]);

  root.traverse(o => { if (o.isMesh && o.name !== "CurvedScreen") { let g = o.geometry; if (g.index) g = g.toNonIndexed(); g.computeVertexNormals(); o.geometry = g; } });

  // ---- animations: a heavy idle sway and a big, slow waddle ----
  const Q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray();
  const qTrack = (name, times, eulers) => new THREE.QuaternionKeyframeTrack(name + ".quaternion", times, eulers.flatMap(e => Q(...e)));
  const pTrack = (name, times, vals) => new THREE.VectorKeyframeTrack(name + ".position", times, vals.flat());
  const N = 24, TT = Array.from({ length: N + 1 }, (_, i) => i / N), S = (t, n = 1) => Math.sin(t * Math.PI * 2 * n);
  const clips = [];
  { const D = 3.2, IT = TT.map(t => t * D);
    clips.push(new THREE.AnimationClip("Idle", D, [
      pTrack("Body", IT, TT.map(t => [0, BP + .008 * S(t), 0])), qTrack("Body", IT, TT.map(t => [.01 * S(t), .02 * S(t, 1), .012 * S(t, 2)])),
      pTrack("Rig", IT, TT.map(() => [0, 0, 0])), ...["L", "R"].flatMap(s => [qTrack("Hip_" + s, IT, TT.map(() => [0, 0, 0])), qTrack("Ankle_" + s, IT, TT.map(() => [0, 0, 0]))]) ])); }
  { const D = 1.3, WT2 = TT.map(t => t * D), sw = t => .3 * Math.cos(t * Math.PI * 2);
    clips.push(new THREE.AnimationClip("Walk", D, [
      pTrack("Rig", WT2, TT.map(t => [0, -LEG * (1 - Math.cos(Math.abs(sw(t)))) - .002, 0])),
      pTrack("Body", WT2, TT.map(t => [0, BP + .01 * Math.abs(S(t)), 0])),
      qTrack("Body", WT2, TT.map(t => [.02, .05 * Math.cos(t * Math.PI * 2), .06 * S(t)])),          // side-to-side waddle
      qTrack("Hip_L", WT2, TT.map(t => [sw(t), 0, 0])), qTrack("Hip_R", WT2, TT.map(t => [-sw(t), 0, 0])),
      qTrack("Ankle_L", WT2, TT.map(t => [-sw(t), 0, 0])), qTrack("Ankle_R", WT2, TT.map(t => [sw(t), 0, 0])) ])); }
  return { root, clips, height: TOPY + .2 };
}
