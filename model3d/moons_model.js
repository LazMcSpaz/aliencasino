// Twin Moons table (concept pass): a long craps-style table. Deep felt tub with raised padded rails, the inner walls lined with
// crater-studded bumpers the moons bounce off, the betting layout from the game printed at both ends (mirrored, like a real
// craps table) with the COLLIDE circle in the middle, and the robot dealer standing at the centre of the far long side
// (the same face as the slot machines). A laser wall sweeps the moons back down the table into a launcher at the +X end,
// which fires them back out. Two 8-sided moon crystals sit on the felt.
// Units are metres. The table runs along X; players stand on the +Z side and round the ends; the dealer is at −Z.
// Node names: TwinMoonsTable, Table, Felt, Bumpers, Console, DealerScreen, Launcher, LauncherHead, Wheel_L, Wheel_R, LaserWall, Beam, Moon_A, Moon_B.
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
  // ---- the launcher: a contraption on the +X end. The laser wall sweeps the moons into a hopper slot at the foot of the end wall;
  // they ride up a glass tube to the launcher on the rail, where two spinning wheels fire them down the table. ----
  const EX = IL / 2, lau = grp(root, "Launcher", [OL / 2 - .17, TOPY, 0]);
  add(table, chamferBox(.02, .1, .2, .006), mat.dark, "HopperSlot", [EX - .004, FELT + .05, 0]);                          // the mouth in the end wall
  add(table, chamferBox(.03, .12, .24, .008), mat.led, "HopperGlow", [EX + .004, FELT + .05, 0]).castShadow = false;
  const glass = new THREE.MeshStandardMaterial({ name: "TubeGlass", color: 0x9fe3ff, metalness: .1, roughness: .05, transparent: true, opacity: .28, depthWrite: false });
  add(root, new THREE.CylinderGeometry(.06, .06, TOPY - APRON + .17, 16, 1, true), glass, "Tube", [OL / 2 + .07, APRON + (TOPY - APRON + .17) / 2, 0]).castShadow = false;
  add(root, chamferBox(.14, .05, .16, .015), mat.shellDark, "TubeFoot", [OL / 2 + .04, APRON + .01, 0]);
  for (const y of [APRON + .04, FELT + .04, TOPY + .17]) add(root, new THREE.TorusGeometry(.062, .012, 6, 18), mat.trim, "TubeRing", [OL / 2 + .07, y, 0], [Math.PI / 2, 0, 0]);
  add(lau, chamferBox(.34, .1, .46, .03), mat.shell, "LauncherBase", [0, .05, 0]);
  add(lau, chamferBox(.36, .02, .48, .008), mat.trim, "LauncherBand", [0, .005, 0]);
  const head = grp(lau, "LauncherHead", [0, .14, 0]); head.rotation.z = -.12;                                            // tipped slightly up, firing toward −X
  add(head, chamferBox(.3, .06, .3, .02), mat.metal, "Chassis");
  add(head, chamferBox(.32, .012, .045, .004), new THREE.MeshStandardMaterial({ name: "Channel", color: 0x3a3c4c, metalness: .6, roughness: .15 }), "Channel", [-.02, .036, 0]);
  const wheels = [];
  for (const sz of [-1, 1]) { const w = grp(head, sz < 0 ? "Wheel_L" : "Wheel_R", [.02, .05, sz * .085]); wheels.push(w);
    add(w, new THREE.CylinderGeometry(.06, .06, .03, 24), std("Wheel", 0x2a2833, .3, .5), "WheelDisc");
    add(w, new THREE.TorusGeometry(.03, .007, 6, 18), mat.led, "WheelRing", [0, .016, 0], [Math.PI / 2, 0, 0]);
    add(w, new THREE.CylinderGeometry(.018, .02, .036, 10), mat.metal, "WheelHub");
    add(w, chamferBox(.03, .006, .008, .002), mat.trim, "WheelMark", [.04, .016, 0]); }
  add(head, chamferBox(.1, .08, .16, .02), mat.purple, "Hood", [.14, .05, 0]);
  for (const sz of [-1, 1]) add(head, new THREE.CylinderGeometry(.012, .012, .1, 8), mat.trim, "Muzzle", [-.16, .045, sz * .03], [0, 0, Math.PI / 2]);
  const MUZ = [OL / 2 - .17 - .17, TOPY + .17, 0];                                                                      // where the moons leave the launcher (world)

  // ---- the laser wall: two carriages ride tracks along the long rails, with a sheet of light between them down to the felt ----
  const SW0 = -1.28, SW1 = 1.28;                                                                                       // the straight run of the rails
  for (const sz of [-1, 1]) add(table, chamferBox(SW1 - SW0 + .14, .014, .03, .005), mat.metal, "LaserTrack", [0, TOPY + .008, sz * (IW / 2 + .055)]);
  const laser = grp(root, "LaserWall", [SW0, 0, 0]);
  for (const sz of [-1, 1]) { const c = grp(laser, "Carriage" + (sz < 0 ? "L" : "R"), [0, TOPY + .015, sz * (IW / 2 + .055)]);
    add(c, chamferBox(.09, .05, .07, .015), mat.shellDark, "CarriageBody", [0, .025, 0]);
    add(c, chamferBox(.05, .025, .09, .008), mat.metal, "Emitter", [0, .02, -sz * .07]);
    add(c, chamferBox(.04, .01, .02, .003), mat.led, "Lens", [0, .005, -sz * .11]).castShadow = false; }
  const beamMat = new THREE.MeshBasicMaterial({ name: "LaserSheet", color: 0xff3b8a, transparent: true, opacity: .32, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const lineMat = new THREE.MeshBasicMaterial({ name: "LaserLine", color: 0xff9ad0, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending });
  const beam = grp(laser, "Beam", [0, FELT, 0]), BH = TOPY - FELT + .01;
  { const s = add(beam, new THREE.PlaneGeometry(IW, BH), beamMat, "Sheet", [0, BH / 2, 0], [0, Math.PI / 2, 0]); s.castShadow = s.receiveShadow = false;
    for (const y of [.004, .05, .1, .15, BH - .004]) { const l = add(beam, new THREE.BoxGeometry(.004, .004, IW), lineMat, "Line", [0, y, 0]); l.castShadow = l.receiveShadow = false; } }

  // ---- the moons: two 8-sided crystals ----
  const MS = .045, moonGeo = new THREE.OctahedronGeometry(MS, 0);
  const moonA = add(root, moonGeo, mat.moonA, "Moon_A", [-.15, FELT + MS, .1]), moonB = add(root, moonGeo, mat.moonB, "Moon_B", [.05, FELT + MS, .16]);
  root.traverse(o => { if (o.isMesh && !["Felt", "DealerScreen", "Bumpers", "RailInner", "Apron", "UnderGlow", "Tube"].includes(o.name) && !o.name.startsWith("Chip")) { let g = o.geometry; if (g.index) g = g.toNonIndexed(); g.computeVertexNormals(); o.geometry = g; } });

  // ---- animations: everything is worked out as functions of time, then sampled into keyframes ----
  const Q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray();
  const sample = (dur, fn, step = 1 / 30) => { const ts = []; for (let t = 0; t <= dur + 1e-6; t += step) ts.push(+t.toFixed(4)); return [ts, ts.map(fn)]; };
  const qTf = (name, dur, fn) => { const [ts, v] = sample(dur, fn); return new THREE.QuaternionKeyframeTrack(name + ".quaternion", ts, v.flatMap(e => Q(...e))); };
  const pTf = (name, dur, fn) => { const [ts, v] = sample(dur, fn); return new THREE.VectorKeyframeTrack(name + ".position", ts, v.flat()); };
  const sTf = (name, dur, fn) => { const [ts, v] = sample(dur, fn); return new THREE.VectorKeyframeTrack(name + ".scale", ts, v.flat()); };
  const lerp = (a, b, k) => a + (b - a) * k, cl = k => Math.max(0, Math.min(1, k)), eio = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const wheelSpin = (name, dir, fn) => qTf(name, DUR, t => [0, dir * fn(t), 0]);
  const clips = [];
  const DUR = 9;
  { // Idle: the moons wait on the felt; wheels tick over; the laser sits parked, off
    const D = 4; clips.push(new THREE.AnimationClip("Idle", D, [
      pTf("Moon_A", D, t => [-.15, FELT + MS + .012 * Math.sin(t / D * Math.PI * 2), .1]), qTf("Moon_A", D, t => [.3, t / D * Math.PI * 2, .2]),
      pTf("Moon_B", D, t => [.05, FELT + MS + .012 * Math.sin(t / D * Math.PI * 2 + 1), .16]), qTf("Moon_B", D, t => [-.2, -t / D * Math.PI * 2, .1]),
      qTf("Wheel_L", D, t => [0, t / D * Math.PI * 2, 0]), qTf("Wheel_R", D, t => [0, -t / D * Math.PI * 2, 0]),
      pTf("LaserWall", D, () => [SW0, 0, 0]), sTf("Beam", D, () => [1, .001, 1])])); }
  { // Roll: the launcher spins up and fires (0.8 s); the moons hop down the table, bang off the far bumpers and settle (≈3 s).
    // The laser wall lights at the far end and sweeps them back (3.6–6.4 s) into the hopper; it switches off and glides home
    // while the moons ride up the glass tube (6.6–8.4 s) into the launcher, ready to fire again.
    const FIRE = .8, LAND = [-.85, -.95], WALLX = -EX + MS * 1.3, STOP = [-1.12, -.98], ZS = [.06, .24], ZL = [-.08, .3];
    const SW_ON = 3.4, SW_A = 3.7, SW_B = 6.3, SW_OFF = 6.5, HOME = 8.2;
    const wallAt = t => t < SW_A ? SW0 : t < SW_B ? lerp(SW0, SW1, eio((t - SW_A) / (SW_B - SW_A))) : t < SW_OFF ? SW1 : t < HOME ? lerp(SW1, SW0, eio((t - SW_OFF) / (HOME - SW_OFF))) : SW0;
    const flight = (i, t) => { // piecewise: launch arc → land → hop to the far wall → bounce back → stop
      const z0 = ZS[i], k = [[FIRE, MUZ[0] - .02, MUZ[1], z0 * .2], [FIRE + .55, LAND[i], FELT + MS, ZL[i]], [FIRE + 1.0, WALLX, FELT + MS, (ZL[i] + ZS[i]) / 2 + .05], [FIRE + 1.5, STOP[i] + .15, FELT + MS, ZS[i]], [FIRE + 2.2, STOP[i], FELT + MS, ZS[i]]];
      for (let j = 0; j < k.length - 1; j++) { const [ta, xa, ya, za] = k[j], [tb, xb, yb, zb] = k[j + 1]; if (t <= tb) { const u = cl((t - ta) / (tb - ta)), hop = [.22, .07, .03, .006][j];
        const ease = j >= 2 ? 1 - Math.pow(1 - u, 2) : u; return [lerp(xa, xb, ease), lerp(ya, yb, u) + Math.sin(u * Math.PI) * hop, lerp(za, zb, ease)]; } }
      return [STOP[i], FELT + MS, ZS[i]]; };
    const pos = i => t => {
      const off = i ? .07 : -.07;                                                                         // side by side inside the launcher
      if (t < FIRE) return [MUZ[0] + .05, MUZ[1] - .03, off * .6];                                         // loaded, hidden in the hood
      const rest = flight(i, Math.min(t, FIRE + 2.2));
      if (t < SW_A) return rest;
      // the wall reaches them and shoves them along, funnelling toward the middle; past the end of its run they roll on into the hopper
      const w = wallAt(Math.min(t, SW_B)) + MS * 1.25 + (i ? .1 : 0);
      let x = Math.max(rest[0], w), z = rest[2]; const pushed = cl((x - rest[0]) / (EX - rest[0])); z = lerp(rest[2], off, Math.pow(pushed, .6));
      if (t >= SW_B) { const u = cl((t - SW_B) / .35); x = lerp(Math.max(rest[0], wallAt(SW_B) + MS * 1.25 + (i ? .1 : 0)), EX - .02, u); z = lerp(z, off * .5, u);
        if (t >= SW_B + .35) { // down the hopper, then up the tube and into the launcher
          const v = cl((t - SW_B - .35 - (i ? .25 : 0)) / 1.3), TX = OL / 2 + .07;
          if (v <= 0) return [EX + .03, FELT + .04, off * .4];
          return v < .15 ? [lerp(EX + .03, TX, v / .15), FELT + .04, off * .3] : v < .8 ? [TX, lerp(FELT + .04, TOPY + .1, (v - .15) / .65), off * .3] : [lerp(TX, MUZ[0] + .05, (v - .8) / .2), lerp(TOPY + .1, MUZ[1] - .03, (v - .8) / .2), off * .6]; } }
      return [x, FELT + MS, z]; };
    const rot = (i, seed) => t => { // tumble in flight, roll while pushed
      const fl = t < FIRE ? 0 : t < FIRE + 2.2 ? 1 - Math.pow(1 - (t - FIRE) / 2.2, 2) : 1, pu = t < SW_A ? 0 : cl((t - SW_A) / (SW_B + .35 - SW_A)), up = t > SW_B + .35 ? (t - SW_B - .35) : 0;
      return [fl * 10 + pu * 8 + up * 3 + seed, fl * 6 + seed, fl * 8 - pu * 5 + up * 2 - seed]; };
    const spin = t => { const r = t < FIRE ? t / FIRE : t < FIRE + .4 ? 1 : Math.max(.15, 1 - (t - FIRE - .4) * .6), r2 = t > 7.6 ? (t - 7.6) / 1.4 : 0; return Math.max(r, r2); };
    let acc = 0; const angle = []; for (let t = 0; t <= DUR + 1e-6; t += 1 / 30) { acc += spin(t) * 30 / 30; angle.push(acc); }
    const ang = t => angle[Math.min(angle.length - 1, Math.round(t * 30))];
    clips.push(new THREE.AnimationClip("Roll", DUR, [
      pTf("Moon_A", DUR, pos(0)), pTf("Moon_B", DUR, pos(1)), qTf("Moon_A", DUR, rot(0, .3)), qTf("Moon_B", DUR, rot(1, -.2)),
      sTf("Moon_A", DUR, t => t < FIRE - .02 ? [.001, .001, .001] : [1, 1, 1]), sTf("Moon_B", DUR, t => t < FIRE - .02 ? [.001, .001, .001] : [1, 1, 1]),
      qTf("Wheel_L", DUR, t => [0, ang(t), 0]), qTf("Wheel_R", DUR, t => [0, -ang(t), 0]),
      pTf("LaserWall", DUR, t => [wallAt(t), 0, 0]), sTf("Beam", DUR, t => [1, t < SW_ON ? .001 : t < SW_A ? Math.max(.001, (t - SW_ON) / (SW_A - SW_ON)) : t < SW_B ? 1 : t < SW_OFF ? Math.max(.001, 1 - (t - SW_B) / (SW_OFF - SW_B)) : .001, 1])])); }
  return { root, clips, height: 2.1 };
}
