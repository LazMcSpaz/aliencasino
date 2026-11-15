// Gravity Well table (concept pass): a round casino table with the stepped bowl sunk into it, a dealer console on the far side
// (the "top of the screen" in the game), and a big industrial arm on the console holding the two-wheel launcher over the bowl.
// Units are metres. The player sits on the +Z side looking toward −Z; the dealer is at −Z. Origin on the floor, table centred on it.
// Node names: GravityTable, Table, Bowl, Console, DealerScreen, Turret, Shoulder, Elbow, Wrist, Launcher, Wheel_L, Wheel_R, Comet.
function buildGravityTable(THREE, opts = {}) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const std = (name, color, metalness, roughness, extra = {}) => new THREE.MeshStandardMaterial({ name, color, metalness, roughness, flatShading: true, ...extra });
  const mat = {
    shell: std("Shell", 0x2c2b34, .55, .38), shellDark: std("ShellDark", 0x1c1b22, .45, .45), metal: std("Metal", 0x8d8aa0, .85, .3),
    trim: std("GoldTrim", 0xffc845, .85, .28), purple: std("Purple", 0x7a2fd0, .4, .4), dark: std("Dark", 0x0e0d13, .3, .55),
    wheel: std("Wheel", 0x2a2833, .3, .5), hub: std("Hub", 0xc9d2e0, .9, .22),
    hole: new THREE.MeshStandardMaterial({ name: "BlackHole", color: 0x000000, emissive: 0x050010, emissiveIntensity: 1, roughness: 1, side: THREE.DoubleSide }),
    glow: new THREE.MeshStandardMaterial({ name: "HorizonGlow", color: 0x000000, emissive: 0xff8a3a, emissiveIntensity: 1.6 }),
    comet: new THREE.MeshStandardMaterial({ name: "Comet", color: 0x000000, emissive: 0xbdf4ff, emissiveIntensity: 2.4 }),
    led: new THREE.MeshStandardMaterial({ name: "Led", color: 0x000000, emissive: 0xb45cff, emissiveIntensity: 1.4 }),
  };
  const T = opts.tex || {};
  const tex = img => { const t = new THREE.Texture(img); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; t.needsUpdate = !!img; return t; };
  // the bowl's playing surface is the game's own bowl artwork, projected straight down onto the stepped bowl
  { const t = tex(T.bowl); mat.bowl = new THREE.MeshStandardMaterial({ name: "BowlArt", color: 0x555555, map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .75, roughness: .5, metalness: .1, side: THREE.DoubleSide }); }   // backlit, like the game
  // the dealer's face: a dark screen with two glowing almond eyes
  const fc = document.createElement("canvas"); fc.width = 512; fc.height = 320; { const g = fc.getContext("2d");
    g.fillStyle = "#07051a"; g.fillRect(0, 0, 512, 320); const gr = g.createRadialGradient(256, 160, 20, 256, 160, 280); gr.addColorStop(0, "#2a1650"); gr.addColorStop(1, "#07051a"); g.fillStyle = gr; g.fillRect(0, 0, 512, 320);
    for (const sx of [-1, 1]) { g.save(); g.translate(256 + sx * 105, 150); g.rotate(sx * .32); g.shadowColor = "#ffc845"; g.shadowBlur = 30; g.fillStyle = "#ffd76a";
      g.beginPath(); g.ellipse(0, 0, 62, 34, 0, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0; g.fillStyle = "#3a2400"; g.beginPath(); g.ellipse(sx * 8, 4, 22, 22, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
    g.strokeStyle = "#ffc845aa"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.arc(256, 215, 40, .25, Math.PI - .25); g.stroke(); }
  const faceTex = new THREE.CanvasTexture(fc); faceTex.encoding = THREE.sRGBEncoding;
  // the slot face is wide; the dealer screen is tall: fit it by width, centred, on the face's own dark background
  function fitTall(img){ const c = document.createElement("canvas"); c.width = 400; c.height = 560; const g = c.getContext("2d");
    const t = document.createElement("canvas"); t.width = img.width; t.height = img.height; const tg = t.getContext("2d"); tg.drawImage(img, 0, 0);
    const d = tg.getImageData(0, 0, t.width, t.height), px = d.data;                       // the face's dark backdrop → pure black, so it blends into the screen
    for (let i = 0; i < px.length; i += 4) { const L = Math.max(px[i], px[i + 1], px[i + 2]); if (L < 70) { const k = Math.max(0, (L - 45) / 25); px[i] *= k; px[i + 1] *= k; px[i + 2] *= k; } }
    tg.putImageData(d, 0, 0); g.fillStyle = "#000"; g.fillRect(0, 0, 400, 560);
    const h = 400 * img.height / img.width; g.drawImage(t, 0, (560 - h) / 2, 400, h); return c; }
  mat.face = new THREE.MeshStandardMaterial({ name: "DealerFace", color: 0x000000, emissive: 0xffffff, emissiveMap: T.face ? tex(fitTall(T.face)) : faceTex });   // the same face as the slot machines

  function chamferBox(w, h, d, c) {
    const s = new THREE.Shape(), x = w / 2 - c, y = h / 2 - c; s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * c, bevelEnabled: true, bevelThickness: c, bevelSize: c, bevelSegments: 1, curveSegments: 1 });
    g.translate(0, 0, -(d - 2 * c) / 2); return g; }
  function add(parent, geom, material, name, p = [0, 0, 0], r = [0, 0, 0]) {
    const m = new THREE.Mesh(geom, material); m.name = name; m.position.set(...p); m.rotation.set(...r); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
  const grp = (parent, name, p = [0, 0, 0]) => { const g = new THREE.Group(); g.name = name; g.position.set(...p); parent.add(g); return g; };
  const lathe = (pts, seg = 48) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  const planarUV = (g, R) => { const p = g.attributes.position, uv = []; for (let i = 0; i < p.count; i++) uv.push(.5 + p.getX(i) / (2 * R), .5 - p.getZ(i) / (2 * R)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); return g; };

  const root = new THREE.Group(); root.name = "GravityTable";
  const table = grp(root, "Table");
  // ---- the table: flared pedestal, dark apron, the art-covered top with the bowl stepping down into a black hole ----
  // radii follow the game's bowl drawing (as shares of the art's half-width = TR metres): lip/colour band, three tiers, hole
  const TR = 1.0, TOP = .8, K = [.835, .655, .48, .315].map(k => k * TR);        // seated table height
  add(table, lathe([[0, 0], [.78, 0], [.74, .07], [.36, .22], [.3, .36], [.34, .4], [0, .4]], 40), mat.shell, "Pedestal");   // stays below the black hole
  // the table's outline: the round top grows a rounded tongue at the back that the dealer console stands on (one piece)
  const RT = 1.06, HW = .88, BACK = 1.84, CR = .24, zJoin = Math.sqrt(RT * RT - HW * HW);
  // plan coordinates: x to the right, y = −z (toward the dealer). One loop: round front → up the left side of the tongue → across the back → down the right.
  const outline = []; { const a0 = Math.atan2(zJoin, HW), sweep = Math.PI + 2 * a0;            // round edge runs the long way from the right join to the left join
    for (let i = 0; i <= 96; i++) { const a = a0 - sweep * (i / 96); outline.push([Math.cos(a) * RT, Math.sin(a) * RT]); }          // ends at (−HW, zJoin)
    const corner = (cx, cy, from, to) => { for (let i = 0; i <= 8; i++) { const a = from + (to - from) * i / 8; outline.push([cx + Math.cos(a) * CR, cy + Math.sin(a) * CR]); } };
    corner(-HW + CR, BACK - CR, Math.PI, Math.PI / 2); corner(HW - CR, BACK - CR, Math.PI / 2, 0); }
  const slab = (pts, depth, hole) => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); sh.closePath();
    if (hole) { const h = new THREE.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); sh.holes.push(h); }
    const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 1, curveSegments: 48 }); g.rotateX(-Math.PI / 2); return g; };
  add(table, slab(outline, .06, K[0]), mat.shellDark, "TableSlab", [0, TOP - .072, 0]);
  add(table, slab(outline.map(([x, y]) => [x * .95, y * .97 + .02]), .1, K[0]), mat.shell, "Skirt", [0, TOP - .19, 0]);   // hollow in the middle, so the bowl shows
  { const pts = outline.filter((_, i) => i % 2 === 0).map(([x, y]) => V(x, TOP + .004, -y));
    add(table, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 160, .028, 8, true), mat.trim, "Rail"); }
  { const g = planarUV(new THREE.RingGeometry(K[0], TR * .995, 96, 1), TR); g.rotateX(-Math.PI / 2); planarUV(g, TR);
    const m = add(table, g, mat.bowl, "TableTop", [0, TOP + .001, 0]); m.castShadow = false; }
  // the bowl: wall down to the rim tier, then each tier slopes inward and steps down; the hole drops away into the dark
  const bowlPts = [[K[0], TOP], [K[0], TOP - .04], [K[1], TOP - .07], [K[1], TOP - .105], [K[2], TOP - .135], [K[2], TOP - .17], [K[3], TOP - .2], [K[3] * .96, TOP - .36]];
  { const g = planarUV(lathe(bowlPts, 128), TR); const m = add(table, g, mat.bowl, "Bowl"); m.castShadow = false; }
  add(table, new THREE.CircleGeometry(K[3] * .96, 48), mat.hole, "BlackHole", [0, TOP - .36, 0], [-Math.PI / 2, 0, 0]);
  // the swirling black hole: accretion-disc spirals (violet and orange) turning around a pitch-black core, layered so they drift at different speeds
  const swirls = []; { const mk = (cols, arms, twist) => { const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d"), C = 256;
      for (let a = 0; a < arms; a++) for (let k = 0; k < 220; k++) { const t = k / 220, r = 30 + t * 220, ang = a / arms * Math.PI * 2 + t * twist;
        const x = C + Math.cos(ang) * r, y = C + Math.sin(ang) * r, al = Math.sin(t * Math.PI) * .38;
        g.fillStyle = cols[a % cols.length].replace("A", al.toFixed(3)); g.beginPath(); g.arc(x, y, 6 + t * 26, 0, Math.PI * 2); g.fill(); }
      const fade = g.createRadialGradient(C, C, 0, C, C, C); fade.addColorStop(0, "rgba(0,0,0,1)"); fade.addColorStop(.16, "rgba(0,0,0,1)"); fade.addColorStop(.3, "rgba(0,0,0,0)");
      g.fillStyle = fade; g.fillRect(0, 0, 512, 512);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
    const layers = [[["rgba(180,92,255,A)", "rgba(255,138,58,A)"], 2, 5.5, .55, TOP - .335], [["rgba(255,170,90,A)", "rgba(120,60,255,A)", "rgba(255,95,174,A)"], 3, 3.8, -.32, TOP - .325]];
    for (const [cols, arms, twist, speed, y] of layers) { const tx = mk(cols, arms, twist);
      const m = new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const d = add(table, new THREE.CircleGeometry(K[3] * .95, 48), m, "Swirl", [0, y, 0], [-Math.PI / 2, 0, 0]); d.castShadow = false; d.receiveShadow = false; d.userData.speed = speed; swirls.push(d); }
    const core = add(table, new THREE.CircleGeometry(K[3] * .22, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }), "Singularity", [0, TOP - .32, 0], [-Math.PI / 2, 0, 0]); core.castShadow = false; }
  add(table, new THREE.TorusGeometry(K[3] * .3, .006, 6, 48), mat.glow, "EventHorizon", [0, TOP - .318, 0], [Math.PI / 2, 0, 0]);

  // ---- the dealer: a console on the far side, face on its tilted screen, LED strips down its sides ----
  const CZ = -1.42, CXc = -.34, cons = grp(root, "Console", [CXc, 0, CZ]);
  // the console and the arm pedestal each run straight down to the floor, so nothing hangs off the table
  add(root, chamferBox(.6, TOP - .1, .42, .04), mat.shell, "ConsoleLegs", [CXc, (TOP - .1) / 2, CZ]);
  add(root, chamferBox(.72, .04, .52, .015), mat.shellDark, "ConsoleFoot", [CXc, .02, CZ]);
  const BODY_H = 1.05; add(cons, chamferBox(.66, BODY_H, .46, .05), mat.shell, "ConsoleBody", [0, TOP + BODY_H / 2, 0]);
  add(cons, chamferBox(.72, .05, .52, .02), mat.trim, "ConsoleBand", [0, TOP + .03, 0]);
  const FACE_Y = 1.5;                                                                                             // a little above seated eye level
  const scr = grp(cons, "ScreenMount", [0, FACE_Y + .04, .25]); scr.rotation.x = -.14;
  add(scr, chamferBox(.46, .62, .06, .02), mat.dark, "ScreenBezel");
  add(scr, new THREE.PlaneGeometry(.4, .56), mat.face, "DealerScreen", [0, 0, .032]);
  add(cons, chamferBox(.5, .07, .36, .02), mat.shellDark, "ConsoleCap", [0, TOP + BODY_H + .035, -.04]);
  // a stool at the player's spot, for scale
  const stool = grp(root, "Stool", [0, 0, 1.55]);
  add(stool, new THREE.CylinderGeometry(.2, .2, .07, 20), mat.purple, "StoolSeat", [0, .62, 0]);
  add(stool, new THREE.CylinderGeometry(.035, .05, .6, 10), mat.metal, "StoolPost", [0, .3, 0]);
  add(stool, new THREE.CylinderGeometry(.22, .25, .03, 20), mat.shellDark, "StoolFoot", [0, .015, 0]);
  add(stool, new THREE.TorusGeometry(.16, .012, 6, 20), mat.trim, "StoolRing", [0, .3, 0], [Math.PI / 2, 0, 0]);

  // ---- the arm: its own pedestal beside the console → turret → shoulder → upper arm → elbow → forearm → wrist → launcher ----
  const AX = .4, AZ = -1.4, PED_H = .42, L1 = .95, L2 = .9, TURRET_Y = TOP + PED_H, SH = [AX, TURRET_Y + .17, AZ];
  add(root, new THREE.CylinderGeometry(.16, .22, PED_H, 16), mat.shellDark, "ArmPedestal", [AX, TOP + PED_H / 2, AZ]);
  add(root, new THREE.CylinderGeometry(.2, .26, TOP - .1, 16), mat.shell, "ArmLeg", [AX, (TOP - .1) / 2, AZ]);   // down to the floor too
  add(root, new THREE.CylinderGeometry(.3, .3, .04, 16), mat.shellDark, "ArmFoot", [AX, .02, AZ]);
  add(root, new THREE.CylinderGeometry(.25, .27, .04, 16), mat.trim, "ArmPedestalRing", [AX, TOP + .02, AZ]);
  const turret = grp(root, "Turret", [SH[0], TURRET_Y, SH[2]]);
  add(turret, new THREE.CylinderGeometry(.2, .24, .14, 16), mat.shellDark, "TurretBase");
  add(turret, new THREE.CylinderGeometry(.23, .23, .03, 16), mat.trim, "TurretRing", [0, .08, 0]);
  const shoulder = grp(turret, "Shoulder", [0, SH[1] - TURRET_Y, 0]);
  add(shoulder, new THREE.CylinderGeometry(.13, .13, .3, 14), mat.metal, "ShoulderJoint", [0, 0, 0], [0, 0, Math.PI / 2]);
  add(shoulder, chamferBox(.17, L1, .17, .03), mat.shell, "UpperArm", [0, L1 / 2, 0]);
  add(shoulder, chamferBox(.19, .5, .04, .01), mat.purple, "UpperArmPanel", [0, L1 / 2, .095]);
  const elbow = grp(shoulder, "Elbow", [0, L1, 0]);
  add(elbow, new THREE.CylinderGeometry(.105, .105, .26, 14), mat.metal, "ElbowJoint", [0, 0, 0], [0, 0, Math.PI / 2]);
  add(elbow, chamferBox(.13, L2, .13, .025), mat.shell, "Forearm", [0, L2 / 2, 0]);
  add(elbow, new THREE.CylinderGeometry(.02, .02, L2 * .8, 6), mat.trim, "Hydraulic", [.085, L2 / 2, 0]);
  const wrist = grp(elbow, "Wrist", [0, L2, 0]);
  add(wrist, new THREE.SphereGeometry(.07, 12, 8), mat.metal, "WristBall");
  // the launcher is the game's sprite made solid: it lies flat, hanging from the wrist by the ring at its BACK end,
  // channel pointing forward (the comet leaves the far end), with the real wheels (cut from the same art) spinning on top
  const LH = .52, LW = LH * 358 / 420, RINGF = [.5, .052];
  const WH = [[.21,.543,.13,"Wheel_L"],[.79,.543,.13,"Wheel_R"],[.346,.814,.045,"Wheel_SL"],[.648,.814,.045,"Wheel_SR"]];
  const hang = grp(wrist, "Hang");
  add(hang, new THREE.CylinderGeometry(.018, .018, .15, 8), mat.metal, "HangRod", [0, -.08, 0]);
  const launcher = grp(hang, "Launcher", [0, -.16, 0]);                       // origin = the ring
  const art = grp(launcher, "LauncherArt", [0, 0, (.5 - RINGF[1]) * LH]);      // the sprite's centre sits forward of the ring
  { // modelled after the game's launcher art (fractions below are spots on that sprite: x across, y from the back ring to the front)
    const at = (fx, fy) => [(fx - .5) * LW, (fy - .5) * LH];
    const purpleGlow = new THREE.MeshStandardMaterial({ name: "PurpleGlow", color: 0x6a1fbf, emissive: 0x7a2fd0, emissiveIntensity: .6, roughness: .4, flatShading: true });
    const glass = std("ChannelGlass", 0x3a3c4c, .6, .15);
    add(art, chamferBox(LW * .9, .05, LH * .74, .018), mat.metal, "Chassis", [0, 0, LH * .03]);
    add(art, chamferBox(LW * .96, .03, LH * .56, .012), mat.shellDark, "ChassisUnder", [0, -.035, LH * .03]);
    for (const sx of [-1, 1]) {                                                    // side frames that wrap round the big wheels
      add(art, chamferBox(.03, .06, LH * .5, .01), mat.metal, "SideFrame", [sx * LW * .46, .015, LH * .03]);
      add(art, chamferBox(.09, .05, .04, .01), mat.metal, "FrameKnuckle", [sx * LW * .4, .015, LH * .31]);
    }
    // the channel: dark glass between two silver rails, running the full length and out past the front
    add(art, chamferBox(LW * .13, .012, LH * 1.0, .004), glass, "ChannelGlass", [0, .036, LH * .04]);
    for (const sx of [-1, 1]) add(art, chamferBox(.016, .028, LH * 1.02, .005), mat.hub, "ChannelRail", [sx * LW * .085, .04, LH * .04]);
    for (const [fy, nm] of [[.3, "A"], [.62, "B"], [.93, "C"]]) for (const sx of [-1, 1]) add(art, chamferBox(.03, .02, .03, .006), mat.metal, "RailClamp" + nm, [sx * LW * .11, .045, at(.5, fy)[1]]);
    // wheels: grooved dark discs with a purple ring and silver hub, sitting in round wells
    for (const [fx, fy, fr, name] of WH) { const [x, z] = at(fx, fy), r = fr * LH * 1.05;
      add(art, new THREE.CylinderGeometry(r * 1.12, r * 1.12, .02, 24), mat.dark, name + "Well", [x, .022, z]);
      const w = grp(art, name, [x, .045, z]);
      add(w, new THREE.CylinderGeometry(r, r, .028, 28), mat.wheel, name + "Disc");
      for (const k of [.92, .78, .64]) add(w, new THREE.TorusGeometry(r * k, r * .025, 4, 28), mat.shellDark, name + "Groove", [0, .015, 0], [Math.PI / 2, 0, 0]);
      add(w, new THREE.TorusGeometry(r * .45, r * .1, 6, 20), purpleGlow, name + "Ring", [0, .016, 0], [Math.PI / 2, 0, 0]);
      add(w, new THREE.CylinderGeometry(r * .3, r * .32, .036, 14), mat.hub, name + "Hub");
      add(w, chamferBox(r * .5, .008, r * .12, .002), mat.hub, name + "Mark", [r * .62, .016, 0]); }   // a mark so the spin reads
    // armour plates with three purple vent slits at the back corners
    for (const sx of [-1, 1]) { const [x, z] = at(sx < 0 ? .19 : .81, .27);
      const plate = grp(art, "VentPlate" + (sx < 0 ? "L" : "R"), [x, .045, z]); plate.rotation.y = sx * .08;
      add(plate, chamferBox(LW * .3, .03, LH * .19, .012), mat.metal, "Plate");
      for (let k = 0; k < 3; k++) add(plate, chamferBox(LW * .17, .008, .012, .003), purpleGlow, "Slit", [sx * LW * .02, .016, -LH * .05 + k * LH * .045]); }
    // purple blocks at the front corners
    for (const sx of [-1, 1]) { const [x, z] = at(sx < 0 ? .16 : .84, .87); add(art, chamferBox(LW * .14, .03, LH * .055, .008), purpleGlow, "CornerBlock", [x, .01, z]); }
    // the back: a roller with a purple band, and the eye ring the arm hangs it from
    add(art, new THREE.CylinderGeometry(.022, .022, LW * .5, 12), mat.metal, "BackRoller", [0, .045, at(.5, .16)[1]], [0, 0, Math.PI / 2]);
    add(art, new THREE.CylinderGeometry(.026, .026, LW * .15, 12), purpleGlow, "RollerBand", [0, .045, at(.5, .16)[1]], [0, 0, Math.PI / 2]);
    for (const sx of [-1, 1]) add(art, new THREE.CylinderGeometry(.03, .03, .03, 10), mat.hub, "RollerCap", [sx * LW * .27, .045, at(.5, .16)[1]], [0, 0, Math.PI / 2]);
    add(art, chamferBox(.05, .03, LH * .08, .008), mat.metal, "EyeNeck", [0, .045, at(.5, .095)[1]]);
    add(launcher, new THREE.TorusGeometry(.028, .01, 8, 16), mat.metal, "EyeRing", [0, .045, 0], [Math.PI / 2, 0, 0]);
  }
  const comet = add(root, new THREE.SphereGeometry(.028, 12, 8), mat.comet, "Comet", [0, -1, 0]); comet.castShadow = false;
  root.traverse(o => { if (o.isMesh && !["Bowl", "TableTop", "DealerScreen"].includes(o.name) && !/Groove|Ring$/.test(o.name)) { let g = o.geometry; if (g.index) g = g.toNonIndexed(); g.computeVertexNormals(); o.geometry = g; } });

  // ---- poses: two-link reach so the wrist lands where we want, launcher kept level ----
  // returns turret yaw, shoulder and elbow pitch, wrist pitch for a wrist target (world x, y, z)
  function reach([x, y, z]) {
    const yaw = Math.atan2(x - SH[0], z - SH[2]), h = Math.hypot(x - SH[0], z - SH[2]), v = y - SH[1], D = Math.min(L1 + L2 - .001, Math.hypot(h, v));
    const phi = Math.atan2(h, v), alpha = Math.acos((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D)), inner = Math.acos((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2));
    const A = phi - alpha, B = Math.PI - inner; return { yaw, A, B, W: -(A + B) }; }
  const RIM_A = .125, ta = RIM_A * Math.PI * 2, tan = [Math.cos(ta), Math.sin(ta)], back = (1 - RINGF[1]) * LH;
  const exitPt = [Math.sin(ta) * K[0] * .92, -Math.cos(ta) * K[0] * .92];
  const wristFire = [exitPt[0] - tan[0] * back, TOP + .21, exitPt[1] - tan[1] * back];      // over the ring, launcher just above the table
  const PARK = reach([AX - .1, SH[1] + .5, AZ + .5]), FIRE = reach(wristFire);
  const launcherYaw = Math.atan2(Math.cos(RIM_A * Math.PI * 2), Math.sin(RIM_A * Math.PI * 2));   // channel along the rim, clockwise as seen from above
  hang.rotation.y = launcherYaw - FIRE.yaw;

  // ---- animations ----
  const Q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray();
  const qT = (name, times, e) => new THREE.QuaternionKeyframeTrack(name + ".quaternion", times, e.flatMap(v => Q(...v)));
  const pT = (name, times, v) => new THREE.VectorKeyframeTrack(name + ".position", times, v.flat());
  const pose = (P, wob = 0) => ({ t: [0, P.yaw + wob * .4, 0], s: [P.A + wob * .3, 0, 0], e: [P.B - wob * .2, 0, 0], w: [P.W - wob * .1, 0, 0] });
  const spin = (times, turns) => times.map((t, i) => [0, -turns[i] * Math.PI * 2, 0]);
  const clips = [];
  { const N = 16, ts = Array.from({ length: N + 1 }, (_, i) => i / N * 4), ps = ts.map(t => pose(PARK, .05 * Math.sin(t / 4 * Math.PI * 2)));
    clips.push(new THREE.AnimationClip("Idle", 4, [qT("Turret", ts, ps.map(p => p.t)), qT("Shoulder", ts, ps.map(p => p.s)), qT("Elbow", ts, ps.map(p => p.e)), qT("Wrist", ts, ps.map(p => p.w)),
      qT("Wheel_L", ts, spin(ts, ts.map(t => t * .25 % 1))), qT("Wheel_R", ts, spin(ts, ts.map(t => -t * .25 % 1))), pT("Comet", [0, 4], [[0, -1, 0], [0, -1, 0]])])); }
  { // launch: swing out (0–1.2 s), wheels spin up, fire at 2.0 s, the comet spirals down the bowl while the arm swings home
    const key = [0, 1.2, 2.2, 3.4, 7], P = [PARK, FIRE, FIRE, PARK, PARK].map(p => pose(p));
    const wt = Array.from({ length: 71 }, (_, i) => i / 10); let a = 0; const turns = wt.map((t, i) => { const sp = t < .6 ? 0 : t < 2.2 ? (t - .6) * 3 : Math.max(.3, 4.8 - (t - 2.2) * 2); a += sp * .1; return a; });
    const prof = [[K[0], TOP - .04], [K[1], TOP - .07], [K[1], TOP - .105], [K[2], TOP - .135], [K[2], TOP - .17], [K[3], TOP - .2]];
    const yAt = r => { for (let i = 0; i < prof.length - 1; i++) { const [r0, y0] = prof[i], [r1, y1] = prof[i + 1]; if (r <= r0 && r >= r1) return r0 === r1 ? y1 : y0 + (y1 - y0) * (r0 - r) / (r0 - r1); } return TOP - .3; };
    const ct = [], cp = []; ct.push(0, 1.99); cp.push([0, -1, 0], [0, -1, 0]);
    for (let i = 0; i <= 50; i++) { const k = i / 50, t = 2 + k * 3.6, r = K[0] * .93 - (K[0] * .93 - K[3] * .9) * Math.pow(k, 1.4), ang = RIM_A + k * 5.5;
      ct.push(t); cp.push([Math.sin(ang * Math.PI * 2) * r, yAt(r) + .028, -Math.cos(ang * Math.PI * 2) * r]); }
    ct.push(5.9, 6.2, 7); cp.push([0, TOP - .34, 0], [0, -1, 0], [0, -1, 0]);
    clips.push(new THREE.AnimationClip("Launch", 7, [qT("Turret", key, P.map(p => p.t)), qT("Shoulder", key, P.map(p => p.s)), qT("Elbow", key, P.map(p => p.e)), qT("Wrist", key, P.map(p => p.w)),
      qT("Wheel_L", wt, spin(wt, turns)), qT("Wheel_R", wt, spin(wt, turns.map(x => -x))), pT("Comet", ct, cp)])); }
  // call every frame: the black hole swirls
  const update = t => { for (const d of swirls) d.rotation.z = t * d.userData.speed; };
  return { root, clips, height: 2.6, update };
}
