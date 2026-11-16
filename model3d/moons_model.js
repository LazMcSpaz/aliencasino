// Twin Moons table (concept pass): a long craps-style table. Deep felt tub with raised padded rails, the inner walls lined with
// crater-studded bumpers the moons bounce off, the betting layout from the game printed at both ends (mirrored, like a real
// craps table) with the COLLIDE circle in the middle, and the robot dealer standing at the centre of the far long side
// (the same face as the slot machines) holding a long hooked stick. Two 8-sided moon crystals sit on the felt.
// Units are metres. The table runs along X; players stand on the +Z side and round the ends; the dealer is at −Z.
// Node names: TwinMoonsTable, Table, Felt, Rail, Bumpers, Console, DealerScreen, StickArm, Stick, Moon_A, Moon_B.
function buildMoonsTable(THREE, opts = {}) {
  const std = (name, color, metalness, roughness, extra = {}) => new THREE.MeshStandardMaterial({ name, color, metalness, roughness, flatShading: true, ...extra });
  const mat = {
    shell: std("Shell", 0x2c2b34, .55, .38), shellDark: std("ShellDark", 0x1c1b22, .45, .45), metal: std("Metal", 0x8d8aa0, .85, .3),
    trim: std("GoldTrim", 0xffc845, .85, .28), purple: std("Purple", 0x7a2fd0, .4, .4), dark: std("Dark", 0x0e0d13, .3, .55),
    pad: new THREE.MeshStandardMaterial({ name: "Padding", color: 0x24183f, metalness: .1, roughness: .55, side: THREE.DoubleSide }),
    apron: std("Apron", 0x2c2b34, .55, .38, { side: THREE.DoubleSide }),
    led: new THREE.MeshStandardMaterial({ name: "Led", color: 0x000000, emissive: 0xb45cff, emissiveIntensity: 1.6, side: THREE.DoubleSide }),
    moonA: std("MoonA", 0x96d6ec, .2, .35, { emissive: 0x2a6b85, emissiveIntensity: .35 }),
    moonB: std("MoonB", 0xc4aaf0, .2, .35, { emissive: 0x4f2f85, emissiveIntensity: .35 }),
  };
  const T = opts.tex || {};
  const ctex = c => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; };

  // ---- sizes ----
  const OL = 3.5, OW = 1.7, OR = .5;                 // outer outline: length, width, corner radius
  const RAIL = .16;                                  // rail width
  const IL = OL - 2 * RAIL, IW = OW - 2 * RAIL, IR = OR - RAIL;
  const FELT = .78, TOPY = 1.0, APRON = .56;         // felt height, rail top, bottom of the apron

  // a rounded rectangle as a loop of points (x, z), counter-clockwise seen from above
  function rrect(L, W, R, seg = 14) { const pts = [], hx = L / 2 - R, hz = W / 2 - R;
    const c = [[hx, hz, 0], [-hx, hz, Math.PI / 2], [-hx, -hz, Math.PI], [hx, -hz, Math.PI * 1.5]];
    for (const [cx, cz, a0] of c) for (let i = 0; i <= seg; i++) { const a = a0 + Math.PI / 2 * i / seg; pts.push([cx + Math.cos(a) * R, cz + Math.sin(a) * R]); }
    return pts; }
  const outer = rrect(OL, OW, OR), inner = rrect(IL, IW, IR);
  const shape = (pts, hole) => { const s = new THREE.Shape(); pts.forEach(([x, z], i) => i ? s.lineTo(x, -z) : s.moveTo(x, -z)); s.closePath();
    if (hole) { const h = new THREE.Path(); hole.slice().reverse().forEach(([x, z], i) => i ? h.lineTo(x, -z) : h.moveTo(x, -z)); h.closePath(); s.holes.push(h); } return s; };
  // a vertical band following a loop (walls); u runs along the loop in metres / uScale
  function band(pts, y0, y1, uScale = 1, inward = false) { const P = [], UV = [], idx = []; let s = 0;
    const loop = pts.concat([pts[0]]);
    loop.forEach(([x, z], i) => { if (i) s += Math.hypot(x - loop[i - 1][0], z - loop[i - 1][1]); P.push(x, y0, z, x, y1, z); UV.push(s / uScale, 0, s / uScale, 1); });
    for (let i = 0; i < loop.length - 1; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; inward ? idx.push(a, c, b, b, c, d) : idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
  function chamferBox(w, h, d, c) {
    const s = new THREE.Shape(), x = w / 2 - c, y = h / 2 - c; s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * c, bevelEnabled: true, bevelThickness: c, bevelSize: c, bevelSegments: 1, curveSegments: 1 });
    g.translate(0, 0, -(d - 2 * c) / 2); return g; }
  function add(parent, geom, material, name, p = [0, 0, 0], r = [0, 0, 0]) {
    const m = new THREE.Mesh(geom, material); m.name = name; m.position.set(...p); m.rotation.set(...r); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
  const grp = (parent, name, p = [0, 0, 0]) => { const g = new THREE.Group(); g.name = name; g.position.set(...p); parent.add(g); return g; };
  const loopTube = (pts, y, r, inset = 0) => { const v = pts.filter((_, i) => i % 2 === 0).map(([x, z]) => { const l = Math.hypot(x, z) || 1; return new THREE.Vector3(x - x / l * inset, y, z - z / l * inset); });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(v, true, "centripetal"), 220, r, 8, true); };

  // ---- the felt: the game's betting layout, printed at both ends; COLLIDE and the gap ruler in the middle ----
  const PX = 600;                                    // texture pixels per metre
  const fc = document.createElement("canvas"); fc.width = Math.round(IL * PX); fc.height = Math.round(IW * PX);
  { const g = fc.getContext("2d"), W = fc.width, H = fc.height, F = '"Bungee",Impact,sans-serif', F2 = '"Chakra Petch",system-ui,sans-serif';
    const bg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * .6); bg.addColorStop(0, "#2a2263"); bg.addColorStop(.6, "#16123a"); bg.addColorStop(1, "#0d0b26"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .025})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }   // felt grain
    const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    const box = (x, y, w, h, stroke = "#ffffff55", fill = "#ffffff0c", lw = 4) => { rr(x, y, w, h, 18); g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); };
    const txt = (s, x, y, size, col, font = F, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.font = `400 ${size}px ${font}`; g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(s, 0, 0); g.restore(); };
    const PAY = { 1: 1.5, 2: 1.6, 3: 1.7, 4: 1.9, 5: 2.2, 6: 2.8, 7: 4.7 };
    // one end's layout. Both ends read from the players' side (+Z), so the right end is the left one mirrored, not turned round.
    const half = (mir) => { const X = (x, w = 0) => mir ? W - x - w : x, R = r => mir ? -r : r;
      const m = H * .07, x0 = m * .9, laneW = W * .075, y0 = m, h = H - 2 * m;
      // WITH lane hugging the end wall (like a pass line), AGAINST just inside it
      box(X(x0, laneW), y0, laneW, h, "#7dff7a", "#7dff7a14", 5); txt("WITH THE MOONS · ×2", X(x0 + laneW / 2), H / 2, laneW * .32, "#7dff7a", F, R(-Math.PI / 2));
      const ax = x0 + laneW + 14, aw = laneW * .78; box(X(ax, aw), y0 + h * .12, aw, h * .76, "#ff4d6d", "#ff4d6d12", 5); txt("AGAINST · ×2", X(ax + aw / 2), H / 2, aw * .32, "#ff6b85", F, R(-Math.PI / 2));
      // gap boxes 1–7 in a block (like the place numbers); 1 nearest the end
      const gx = ax + aw + 34, gw = W * .2, cols = 7, cw = gw / cols, gy = y0 + h * .2, gh = h * .42;
      for (let k = 0; k < cols; k++) { const bx = gx + k * cw + 5; box(X(bx, cw - 10), gy, cw - 10, gh); txt(String(k + 1), X(gx + (k + .5) * cw), gy + gh * .42, cw * .5, "#bfefff"); txt(`×${PAY[k + 1]}`, X(gx + (k + .5) * cw), gy + gh * .78, cw * .22, "#9a92c7", F2); }
      txt("GAP", X(gx + gw / 2), gy - 30, 34, "#bfefff99");
      // the orbit streak ladder under them
      const sy = gy + gh + 24, sh = h * .17; box(X(gx + 5, gw - 10), sy, gw - 10, sh, "#ffc845", "#ffc84512", 4); txt("ORBIT", X(gx + gw * .25), sy + sh * .34, sh * .22, "#ffc845"); txt("STREAK", X(gx + gw * .25), sy + sh * .68, sh * .22, "#ffc845");
      [[3, 3], [4, 8], [5, 16], ["6+", 30]].forEach(([n, p], i) => { const bx = gx + gw * .49 + i * gw * .125; box(X(bx, gw * .11), sy + sh * .16, gw * .11, sh * .68, "#ffffff33", "#ffffff0a", 3); txt(String(n), X(bx + gw * .055), sy + sh * .42, sh * .28, "#fff3c4"); txt(`×${p}`, X(bx + gw * .055), sy + sh * .74, sh * .17, "#9a92c7", F2); });
      txt("TWIN MOONS", X(gx + gw / 2), y0 + h * .09, 46, "#eaf9ff55", '"Monoton",' + F); };
    half(false); half(true);
    // the middle: the COLLIDE circle (two moons kissing) and the gap ruler 1–8
    const cx = W / 2, cy = H / 2, cr = H * .17;
    const glow = g.createRadialGradient(cx, cy, 0, cx, cy, cr * 1.6); glow.addColorStop(0, "#ff4d6d40"); glow.addColorStop(1, "#ff4d6d00"); g.fillStyle = glow; g.beginPath(); g.arc(cx, cy, cr * 1.6, 0, 7); g.fill();
    g.strokeStyle = "#ff4d6dcc"; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, cr, 0, 7); g.stroke(); g.setLineDash([14, 12]); g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, cr * .86, 0, 7); g.stroke(); g.setLineDash([]);
    for (const [dx, col] of [[-1, "#96d6ec"], [1, "#c4aaf0"]]) { g.fillStyle = col; g.beginPath(); g.arc(cx + dx * cr * .27, cy - cr * .12, cr * .3, 0, 7); g.fill(); g.fillStyle = "#0004"; g.beginPath(); g.arc(cx + dx * cr * .27 + cr * .07, cy - cr * .05, cr * .08, 0, 7); g.fill(); }
    txt("COLLIDE", cx, cy + cr * .4, cr * .26, "#ffb3c1"); txt("×7.5", cx, cy + cr * .66, cr * .2, "#ff8aa0", F2);
    for (const side of [-1, 1]) { const ry = cy + side * H * .36, x0 = cx - W * .085, x1 = cx + W * .085; g.strokeStyle = "#ffffff30"; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, ry); g.lineTo(x1, ry); g.stroke();
      for (let k = 1; k <= 8; k++) { const x = x0 + (x1 - x0) * (k - 1) / 7; g.fillStyle = "#ffffff70"; g.beginPath(); g.arc(x, ry, 7, 0, 7); g.fill(); txt(String(k), x, ry + side * -30, 26, "#ffffff80", F2, side > 0 ? 0 : Math.PI); } }
  }
  const feltTex = ctex(fc);
  mat.felt = new THREE.MeshStandardMaterial({ name: "Felt", color: 0xffffff, map: feltTex, emissive: 0xffffff, emissiveMap: feltTex, emissiveIntensity: .25, roughness: .95, metalness: 0 });
  // the bumper lining: dark metal studded with little glowing craters, in rows (the alien take on a craps table's rubber diamonds)
  const bc = document.createElement("canvas"); bc.width = 512; bc.height = 128;
  { const g = bc.getContext("2d"); const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "#3a2c66"); gr.addColorStop(1, "#140f2a"); g.fillStyle = gr; g.fillRect(0, 0, 512, 128);
    for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) { const x = (i + (row % 2) * .5) * 57 + 10, y = 24 + row * 40, r = 13;
      g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.fillStyle = "#5a3fa0"; g.fill();
      g.fillStyle = "#b45cff"; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); g.strokeStyle = "#ffffff30"; g.lineWidth = 2; g.stroke(); } }
  const bumpTex = ctex(bc); bumpTex.wrapS = THREE.RepeatWrapping;
  mat.bumper = new THREE.MeshStandardMaterial({ name: "Bumpers", color: 0xffffff, map: bumpTex, emissive: 0xffffff, emissiveMap: bumpTex, emissiveIntensity: .35, roughness: .5, metalness: .4, side: THREE.DoubleSide });

  const root = new THREE.Group(); root.name = "TwinMoonsTable";
  const table = grp(root, "Table");
  // felt floor of the tub, UV'd straight onto the layout texture
  { const g = new THREE.ShapeGeometry(shape(inner), 12); g.rotateX(-Math.PI / 2); const p = g.attributes.position, uv = [];
    for (let i = 0; i < p.count; i++) uv.push(p.getX(i) / IL + .5, .5 - p.getZ(i) / IW); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    const m = add(table, g, mat.felt, "Felt", [0, FELT, 0]); m.castShadow = false; }
  add(table, new THREE.ShapeGeometry(shape(inner), 12), mat.shellDark, "TubFloor", [0, FELT - .005, 0], [Math.PI / 2, 0, 0]);
  // the tub walls: bumper lining from the felt up, then the rail
  add(table, band(inner, FELT, FELT + .14, .6, true), mat.bumper, "Bumpers").castShadow = false;
  add(table, band(inner, FELT + .14, TOPY, 1, true), mat.pad, "RailInner");
  { const g = new THREE.ShapeGeometry(shape(outer, inner), 12); g.rotateX(-Math.PI / 2); add(table, g, mat.shellDark, "RailTop", [0, TOPY, 0]); }
  add(table, loopTube(outer, TOPY + .035, .05, .05), mat.pad, "Armrest");                                        // padded armrest on the outer edge
  add(table, loopTube(inner, TOPY + .004, .018, -.035), mat.dark, "ChipTrough");                               // the chip groove along the inner edge
  add(table, loopTube(outer, TOPY - .01, .014, -.004), mat.trim, "RailTrim");
  add(table, band(outer, APRON, TOPY), mat.apron, "Apron");
  add(table, loopTube(outer, APRON + .01, .016, .004), mat.trim, "ApronTrim");
  add(table, band(rrect(OL - .12, OW - .12, OR - .06), APRON - .03, APRON - .005, 1), mat.led, "UnderGlow").castShadow = false;   // purple light strip under the apron
  add(table, new THREE.ShapeGeometry(shape(rrect(OL - .12, OW - .12, OR - .06)), 12), mat.shellDark, "Underside", [0, APRON - .005, 0], [Math.PI / 2, 0, 0]);
  // the base: two plinths under the ends and a spine between them
  for (const sx of [-1, 1]) { const b = grp(table, "Plinth" + (sx < 0 ? "L" : "R"), [sx * OL * .3, 0, 0]);
    add(b, chamferBox(.5, APRON - .05, OW * .55, .05), mat.shell, "Leg", [0, (APRON - .05) / 2, 0]);
    add(b, chamferBox(.62, .05, OW * .65, .02), mat.shellDark, "Foot", [0, .025, 0]);
    add(b, chamferBox(.52, .03, OW * .57, .01), mat.trim, "LegBand", [0, APRON - .09, 0]); }
  add(table, chamferBox(OL * .5, .22, .3, .04), mat.shellDark, "Spine", [0, .3, 0]);

  // ---- chips resting in the trough at the players' places ----
  const CH = { purple: [0xb45cff, 0x7f2fd0], orange: [0xff8a3a, 0xd9561a], lime: [0x8dff6a, 0x4cc72f], teal: [0x3fe6c8, 0x16a890], you: [0xd4cfe6, 0x9b96b2] };
  const chipMat = {}; const chipGeo = new THREE.CylinderGeometry(.02, .02, .0065, 18);
  const spots = [[-1.05, IW / 2 + .04, "orange"], [-.35, IW / 2 + .04, "you"], [.4, IW / 2 + .04, "lime"], [1.1, IW / 2 + .04, "teal"], [IL / 2 + .04, -.15, "purple"]];
  for (const [x, z, who] of spots) for (let s = 0; s < 3; s++) { const n = 3 + Math.floor(Math.random() * 6), col = CH[who][s % 2];
    const m = chipMat[col] || (chipMat[col] = std("Chip", col, .2, .45)); const st = grp(table, "Chips_" + who, [x + (Math.abs(z) > .3 ? s * .045 : 0), TOPY + .006, z + (Math.abs(z) > .3 ? 0 : s * .045)]);
    for (let k = 0; k < n; k++) add(st, chipGeo, m, "Chip", [(Math.random() - .5) * .003, k * .0068, (Math.random() - .5) * .003]); }

  // ---- the dealer: a robot console at the middle of the far long side, face on a tilted screen ----
  const CZ = -(OW / 2 + .2), cons = grp(root, "Console", [0, 0, CZ]);
  add(cons, chamferBox(.74, 1.3, .44, .05), mat.shell, "ConsoleBody", [0, .65, 0]);
  add(cons, chamferBox(.8, .05, .5, .02), mat.trim, "ConsoleBand", [0, TOPY + .02, 0]);
  add(cons, chamferBox(.82, .04, .52, .015), mat.shellDark, "ConsoleFoot", [0, .02, 0]);
  for (const sx of [-1, 1]) add(cons, chamferBox(.025, .9, .02, .006), mat.led, "ConsoleLed", [sx * .38, .55, .2]);
  // the slot machines' face, fitted onto a tall screen (its dark backdrop turned to pure black so it melts into the glass)
  function fitTall(img) { const c = document.createElement("canvas"); c.width = 400; c.height = 560; const g = c.getContext("2d");
    const t = document.createElement("canvas"); t.width = img.width; t.height = img.height; const tg = t.getContext("2d"); tg.drawImage(img, 0, 0);
    const d = tg.getImageData(0, 0, t.width, t.height), px = d.data;
    for (let i = 0; i < px.length; i += 4) { const L = Math.max(px[i], px[i + 1], px[i + 2]); if (L < 70) { const k = Math.max(0, (L - 45) / 25); px[i] *= k; px[i + 1] *= k; px[i + 2] *= k; } }
    tg.putImageData(d, 0, 0); g.fillStyle = "#000"; g.fillRect(0, 0, 400, 560); const h = 400 * img.height / img.width; g.drawImage(t, 0, (560 - h) / 2, 400, h); return c; }
  mat.face = new THREE.MeshStandardMaterial({ name: "DealerFace", color: 0x000000, emissive: 0xffffff, emissiveMap: T.face ? ctex(fitTall(T.face)) : null, emissiveIntensity: T.face ? 1 : 0 });
  const scr = grp(cons, "ScreenMount", [0, 1.62, .06]); scr.rotation.x = -.12;
  add(scr, chamferBox(.5, .66, .07, .02), mat.dark, "ScreenBezel");
  add(scr, new THREE.PlaneGeometry(.44, .6), mat.face, "DealerScreen", [0, 0, .037]);
  add(cons, chamferBox(.5, .5, .2, .03), mat.shellDark, "Neck", [0, 1.32, -.04]);
  add(cons, chamferBox(.54, .06, .3, .02), mat.trim, "ScreenCap", [0, 1.98, .02]);
  // the stick arm: a shoulder on the console's side, a long hooked stick that rakes the moons back
  const SHY = TOPY + .32, arm = grp(cons, "StickArm", [.42, SHY, .1]);
  add(arm, new THREE.SphereGeometry(.075, 14, 10), mat.metal, "StickShoulder");
  add(arm, new THREE.CylinderGeometry(.09, .09, .06, 16), mat.trim, "StickCollar", [-.04, 0, 0], [0, 0, Math.PI / 2]);
  const stick = grp(arm, "Stick");
  add(stick, new THREE.CylinderGeometry(.012, .016, 1.05, 10), mat.metal, "StickShaft", [0, 0, .525], [Math.PI / 2, 0, 0]);
  add(stick, new THREE.CylinderGeometry(.02, .02, .1, 10), mat.purple, "StickGrip", [0, 0, .06], [Math.PI / 2, 0, 0]);
  const hook = grp(stick, "StickHook", [0, 0, 1.05]);
  add(hook, chamferBox(.2, .035, .02, .006), mat.trim, "Hook", [0, -.02, 0]);
  add(hook, new THREE.CylinderGeometry(.03, .03, .02, 12), mat.led, "HookGlow", [0, -.02, .012], [Math.PI / 2, 0, 0]);

  // ---- the moons: two 8-sided crystals ----
  const MS = .045, moonGeo = new THREE.OctahedronGeometry(MS, 0);
  const moonA = add(root, moonGeo, mat.moonA, "Moon_A", [-.15, FELT + MS, .1]), moonB = add(root, moonGeo, mat.moonB, "Moon_B", [.05, FELT + MS, .16]);
  root.traverse(o => { if (o.isMesh && !["Felt", "DealerScreen", "Bumpers", "RailInner", "Apron", "UnderGlow"].includes(o.name) && !o.name.startsWith("Chip")) { let g = o.geometry; if (g.index) g = g.toNonIndexed(); g.computeVertexNormals(); o.geometry = g; } });

  // ---- animations ----
  const Q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray();
  const qT = (name, times, e) => new THREE.QuaternionKeyframeTrack(name + ".quaternion", times, e.flatMap(v => Q(...v)));
  const pT = (name, times, v) => new THREE.VectorKeyframeTrack(name + ".position", times, v.flat());
  const STICK_REST = [-.3, -.55, 0], STICK_OUT = [.49, -.42, 0];       // pitch (+ = down), yaw: resting raised; reaching out to the felt
  const clips = [];
  { const ts = [0, 2, 4]; clips.push(new THREE.AnimationClip("Idle", 4, [qT("Stick", ts, [STICK_REST, [STICK_REST[0] + .04, STICK_REST[1] + .05, 0], STICK_REST]),
      qT("Moon_A", ts, [[.3, 0, .2], [.3, 1, .2], [.3, 2, .2]]), qT("Moon_B", ts, [[-.2, .5, .1], [-.2, -.5, .1], [-.2, -1.5, .1]]),
      pT("Moon_A", ts, [[-.15, FELT + MS, .1], [-.15, FELT + MS + .015, .1], [-.15, FELT + MS, .1]]), pT("Moon_B", ts, [[.05, FELT + MS, .16], [.05, FELT + MS + .015, .16], [.05, FELT + MS, .16]])])); }
  { // a throw from a player at the +X end: the moons fly down the table, hop on the felt, bang off the far bumpers, roll back and stop;
    // then the stick reaches out and rakes them to the middle
    const path = (x0, z0, xs, zs) => { const t = [], p = []; const hops = [[0, .35, .5], [.5, .1, .85], [.85, .05, 1.05]];   // start, height, land (seconds)
      t.push(0); p.push([x0, FELT + .35, z0]);
      const wallX = -IL / 2 + MS * 1.4, back = xs;                                                  // hits the far wall, then rolls back to xs
      const land1 = [-.9, z0 * .6 + zs * .4];
      for (const [k, x, z] of [[.45, land1[0], land1[1]], [.8, wallX, (land1[1] + zs) / 2], [1.15, back - .15, zs], [1.6, back, zs]]) { t.push(k); p.push([x, FELT + MS, z]); }
      // little hops between the touches
      const T2 = [], P2 = []; for (let i = 0; i < t.length; i++) { T2.push(t[i]); P2.push(p[i]); if (i < t.length - 1) { const h = i === 0 ? .1 : i === 1 ? .06 : .02; T2.push((t[i] + t[i + 1]) / 2); P2.push([(p[i][0] + p[i + 1][0]) / 2, Math.max(p[i][1], p[i + 1][1]) + h, (p[i][2] + p[i + 1][2]) / 2]); } }
      T2.push(3.2, 4.2, 6); P2.push([back, FELT + MS, zs], [0, FELT + MS, .05 + zs * .2], [0, FELT + MS, .05 + zs * .2]); return [T2.map(x => x + .4), P2]; };
    const [tA, pA] = path(IL / 2 - .3, .2, -.55, .15), [tB, pB] = path(IL / 2 - .25, .32, -.38, .32);
    pA.unshift(pA[0]); tA.unshift(0); pB.unshift(pB[0]); tB.unshift(0);
    const spinT = Array.from({ length: 25 }, (_, i) => i / 4), turns = t => t < .4 ? 0 : t > 2.2 ? 1 : (t - .4) / 1.8;
    const rot = (seed) => spinT.map(t => { const k = 1 - Math.pow(1 - turns(t), 2); return [k * 9 + seed, k * 5, k * 7 - seed]; });
    const sT = [0, 3.0, 3.6, 4.4, 5.2, 6], S = [STICK_REST, STICK_REST, STICK_OUT, [.46, -.12, 0], STICK_REST, STICK_REST];
    clips.push(new THREE.AnimationClip("Roll", 6, [pT("Moon_A", tA, pA), pT("Moon_B", tB, pB), qT("Moon_A", spinT, rot(.3)), qT("Moon_B", spinT, rot(-.2)), qT("Stick", sT, S)])); }
  return { root, clips, height: 2.1 };
}
