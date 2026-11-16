// Warp Drive stage (concept pass): a tall portrait screen in the middle showing the drone flight from the game, standing on a
// glowing plinth with holo rings, and a semicircle of betting podiums with stools facing it — one for each alien player plus you.
// Units are metres. The screen faces +Z; the podiums sweep round the +Z side. Origin on the floor at the screen's centre.
// Node names: WarpStage, Stage, ScreenTower, FlightScreen, HoloRing_A, HoloRing_B, Crown, Podium_<NAME>, Stool_<NAME>.
function buildWarpStage(THREE, opts = {}) {
  const std = (name, color, metalness, roughness, extra = {}) => new THREE.MeshStandardMaterial({ name, color, metalness, roughness, flatShading: true, ...extra });
  const glow = (name, color, k = 1.6) => new THREE.MeshStandardMaterial({ name, color: 0x000000, emissive: color, emissiveIntensity: k });
  const mat = {
    shell: std("Shell", 0x2c2b34, .55, .38), shellDark: std("ShellDark", 0x17161d, .45, .45), metal: std("Metal", 0x8d8aa0, .85, .3),
    trim: std("GoldTrim", 0xffc845, .85, .28), purple: std("Purple", 0x7a2fd0, .4, .4), dark: std("Dark", 0x0b0a10, .3, .55),
    cyan: glow("HoloCyan", 0x5fe8ff), violet: glow("HoloViolet", 0xb48cff),
    edge: glow("ScreenEdge", 0x5fe8ff, 1.8), plinthGlow: glow("PlinthGlow", 0x5fe8ff, 1.6),
    holo: new THREE.MeshBasicMaterial({ name: "HoloRing", color: 0x5fe8ff, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
  };
  const T = opts.tex || {};
  const tex = img => { const t = new THREE.Texture(img); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; t.needsUpdate = !!img; return t; };
  const ctex = c => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; };
  function chamferBox(w, h, d, c) {
    const s = new THREE.Shape(), x = w / 2 - c, y = h / 2 - c; s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * c, bevelEnabled: true, bevelThickness: c, bevelSize: c, bevelSegments: 1, curveSegments: 1 });
    g.translate(0, 0, -(d - 2 * c) / 2); return g; }
  function add(parent, geom, material, name, p = [0, 0, 0], r = [0, 0, 0]) {
    const m = new THREE.Mesh(geom, material); m.name = name; m.position.set(...p); m.rotation.set(...r); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
  const grp = (parent, name, p = [0, 0, 0], r = [0, 0, 0]) => { const g = new THREE.Group(); g.name = name; g.position.set(...p); g.rotation.set(...r); parent.add(g); return g; };
  const noShadow = m => { m.castShadow = m.receiveShadow = false; return m; };

  const root = new THREE.Group(); root.name = "WarpStage";
  // ---- the stage floor: a dark disc with glowing rings and spokes toward the podiums ----
  const stage = grp(root, "Stage");
  const R_POD = 2.35, ARC = 66;                        // podium ring radius, and how far round each side the arc reaches (degrees)
  add(stage, new THREE.CylinderGeometry(4.1, 4.2, .08, 64), mat.shellDark, "StageDisc", [0, .04, 0]);
  add(stage, new THREE.TorusGeometry(4.1, .02, 6, 96), mat.cyan, "StageEdge", [0, .081, 0], [Math.PI / 2, 0, 0]);
  for (const r of [1.35, 2.2]) noShadow(add(stage, new THREE.TorusGeometry(r, .012, 6, 96), r < 2 ? mat.cyan : mat.violet, "StageRing", [0, .082, 0], [Math.PI / 2, 0, 0]));

  // ---- the screen tower ----
  const SW = 1.25, SH = SW * 1536 / 484, SY = .75 + SH / 2;            // the flight screen keeps the game's portrait shape
  const tower = grp(root, "ScreenTower");
  // stepped octagonal plinth with a glowing step edge
  add(tower, new THREE.CylinderGeometry(1.05, 1.15, .22, 8), mat.shell, "PlinthLow", [0, .19, 0], [0, Math.PI / 8, 0]);
  add(tower, new THREE.CylinderGeometry(.82, .92, .2, 8), mat.shellDark, "PlinthHigh", [0, .4, 0], [0, Math.PI / 8, 0]);
  noShadow(add(tower, new THREE.TorusGeometry(1.08, .015, 4, 8), mat.plinthGlow, "PlinthGlow", [0, .301, 0], [Math.PI / 2, 0, Math.PI / 8]));
  add(tower, new THREE.CylinderGeometry(.85, .85, .02, 8), mat.trim, "PlinthTrim", [0, .5, 0], [0, Math.PI / 8, 0]);
  // a spine behind the screen, the frame round it, edge lights and side emitter fins
  add(tower, chamferBox(.5, SH + .3, .3, .05), mat.shellDark, "Spine", [0, .5 + (SH + .3) / 2, -.22]);
  add(tower, chamferBox(SW + .2, SH + .2, .16, .05), mat.shell, "ScreenFrame", [0, SY, 0]);
  add(tower, chamferBox(SW + .04, SH + .04, .02, .01), mat.dark, "ScreenBezel", [0, SY, .075]);
  const finLights = [], vents = [];
  for (const sx of [-1, 1]) { noShadow(add(tower, chamferBox(.025, SH, .02, .006), mat.edge, "EdgeLight", [sx * (SW / 2 + .07), SY, .085]));
    const fin = grp(tower, "Fin" + (sx < 0 ? "L" : "R"), [sx * (SW / 2 + .14), SY - SH * .1, -.02]);
    const fb = grp(fin, "FinTilt", [sx * .05, 0, 0], [0, 0, -sx * .05]);                 // everything on the fin shares its slight outward lean
    add(fb, chamferBox(.12, SH * .7, .1, .03), mat.shell, "FinBody");
    for (let k = 0; k < 6; k++) { const lm = glow("FinLight", k % 2 ? 0xb48cff : 0x5fe8ff, 1.6); finLights.push({ m: lm, k, base: k % 2 ? 0xb48cff : 0x5fe8ff }); noShadow(add(fb, chamferBox(.03, .14, .02, .005), lm, "FinLight", [0, -SH * .28 + k * SH * .11, .055])); }
    // steam vents near the foot of each arm: they blast at liftoff
    add(fb, new THREE.CylinderGeometry(.045, .055, .08, 12), mat.metal, "SteamVent", [sx * .07, -SH * .3, .0], [0, 0, sx * Math.PI / 2]);
    vents.push(new THREE.Vector3(sx * (SW / 2 + .14 + .2), SY - SH * .1 - SH * .3, .0));
    add(fin, chamferBox(.16, .06, .14, .02), mat.trim, "FinCap", [sx * .03, SH * .36, 0]); }
  { const back = grp(tower, "TowerBack", [0, SY, -.375]);
    for (let k = 0; k < 7; k++) add(back, chamferBox(.36, .05, .03, .01), mat.shell, "Vent", [0, -SH * .3 + k * .09, 0]);
    for (const sx of [-1, 1]) noShadow(add(back, chamferBox(.02, SH * .8, .02, .006), k => 0, "BackLight", [sx * .19, 0, 0])).material = mat.violet;
    add(back, chamferBox(.3, .3, .04, .03), mat.trim, "BackBadge", [0, SH * .3, 0]); noShadow(add(back, new THREE.CircleGeometry(.09, 24), mat.cyan, "BackEye", [0, SH * .3, -.025], [0, Math.PI, 0])); }
  // the flight screen itself: frames captured from the game, swapped over during the Launch animation
  const frames = ["pad", "clouds", "orbit", "nebula", "boom"].map(k => T[k] ? tex(T[k]) : null);
  const screenMat = new THREE.MeshBasicMaterial({ name: "FlightScreen", map: frames[0], color: frames[0] ? 0xffffff : 0x000000 });
  noShadow(add(tower, new THREE.PlaneGeometry(SW, SH), screenMat, "FlightScreen", [0, SY, .087]));
  // crown: the game's sign on top
  const sc = document.createElement("canvas"); sc.width = 1024; sc.height = 300; { const g = sc.getContext("2d");
    g.textAlign = "center"; g.textBaseline = "middle"; g.font = '400 170px "Monoton","Bungee",Impact,sans-serif'; g.shadowColor = "#5fe8ff"; g.shadowBlur = 40; g.fillStyle = "#eafcff"; g.fillText("WARP", 470, 135);
    g.font = '400 110px "Yellowtail",cursive'; g.shadowColor = "#b48cff"; g.fillStyle = "#f3e6ff"; g.save(); g.translate(760, 215); g.rotate(-.12); g.fillText("Drive", 0, 0); g.restore(); }
  const crown = grp(tower, "Crown", [0, SY + SH / 2 + .32, 0]);
  add(crown, chamferBox(SW + .5, .42, .2, .06), mat.shellDark, "SignBox");
  noShadow(add(crown, new THREE.PlaneGeometry(SW + .4, (SW + .4) * 300 / 1024), new THREE.MeshBasicMaterial({ map: ctex(sc), transparent: true }), "Sign", [0, .02, .102]));
  add(crown, chamferBox(SW + .56, .04, .24, .015), mat.trim, "SignTrim", [0, -.23, 0]);
  // holo rings round the plinth and above the crown (they turn)
  const ringA = noShadow(add(tower, new THREE.TorusGeometry(1.35, .012, 4, 96), mat.holo, "HoloRing_A", [0, .9, 0], [Math.PI / 2, 0, 0]));
  const ringB = noShadow(add(tower, new THREE.TorusGeometry(1.15, .008, 4, 96), mat.holo, "HoloRing_B", [0, 1.4, 0], [Math.PI / 2 + .25, 0, 0]));
  const ringC = noShadow(add(tower, new THREE.TorusGeometry(.95, .01, 4, 96), mat.holo, "HoloRing_C", [0, SY + SH / 2 + .75, 0], [Math.PI / 2, 0, 0]));
  // ---- the leaderboard: a second tall screen, half as wide, to the right of the main one ----
  // it hangs a little higher than the main screen, held off the main screen's spine by two arms behind both screens
  const LW = SW / 2, LH = SH * .82, LX = SW / 2 + .72 + LW / 2, LY = SY + SH / 2 + .7 - LH / 2;
  const board = grp(root, "LeaderboardTower", [LX, 0, 0]);
  add(board, chamferBox(.26, LH, .2, .04), mat.shellDark, "BoardSpine", [0, LY, -.16]);
  { const x0 = .25, x1 = LX, RISE = .55, AZ = -.3, arms = grp(root, "BoardArms");          // x1: the centre strip down the back of the board
    for (const yb of [LY + LH * .28, LY - LH * .22]) { const ya = yb - RISE, len = Math.hypot(x1 - x0, RISE), ang = Math.atan2(RISE, x1 - x0);
      const arm = grp(arms, "Arm", [x0, ya, AZ], [0, 0, ang]);
      add(arm, chamferBox(len, .1, .1, .025), mat.shell, "ArmBody", [len / 2, 0, 0]);
      noShadow(add(arm, chamferBox(len * .78, .025, .02, .006), mat.violet, "ArmLight", [len / 2, .052, 0]));
      add(arm, new THREE.CylinderGeometry(.018, .018, len * .7, 8), mat.metal, "Piston", [len / 2, -.075, 0], [0, 0, Math.PI / 2]);
      for (const [x, y] of [[x0, ya], [x1, yb]]) { add(arms, new THREE.CylinderGeometry(.075, .075, .18, 14), mat.metal, "ArmJoint", [x, y, AZ], [Math.PI / 2, 0, 0]);
        add(arms, new THREE.CylinderGeometry(.08, .08, .02, 14), mat.trim, "JointCap", [x, y, AZ - .1], [Math.PI / 2, 0, 0]); } } }
  add(board, chamferBox(LW + .16, LH + .16, .14, .04), mat.shell, "BoardFrame", [0, LY, 0]);
  for (const sx of [-1, 1]) noShadow(add(board, chamferBox(.02, LH, .02, .006), mat.edge, "BoardEdge", [sx * (LW / 2 + .055), LY, .075]));
  add(board, chamferBox(LW + .26, .12, .18, .03), mat.trim, "BoardCap", [0, LY + LH / 2 + .1, 0]);
  const PLAYERS = [["YOU", "#ffffff", 25, 2.0], ["QUELL", "#6f95ff", 250, 7.5], ["NIX", "#ffe14a", 50, 1.3], ["BLORB", "#ff5fae", 25, 4.2], ["KRILL", "#3fe6c8", 100, 1.6], ["VEXA", "#8dff6a", 10, 2.5], ["GLIM", "#ff8a3a", 100, 15]];
  function boardTex(stage) {   // stage 0: bets in · 1: mid-flight, the careful ones bailed · 2: after the explosion
    const c = document.createElement("canvas"); c.width = 320; c.height = Math.round(320 * LH / LW); const g = c.getContext("2d"), H = c.height, crash = 5.3, now = stage === 1 ? 3.6 : crash;
    g.fillStyle = "#03101a"; g.fillRect(0, 0, 320, H); g.strokeStyle = "#5fe8ff14"; for (let y = 0; y < H; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(320, y); g.stroke(); }
    g.strokeStyle = "#5fe8ff"; g.lineWidth = 4; g.strokeRect(8, 8, 304, H - 16);
    g.textAlign = "center"; g.fillStyle = "#5fe8ff"; g.shadowColor = "#5fe8ff"; g.shadowBlur = 14; g.font = '400 34px "Bungee",Impact,sans-serif'; g.fillText("FLIGHT", 160, 70); g.fillText("BOARD", 160, 110); g.shadowBlur = 0;
    g.font = '700 30px "Chakra Petch",monospace'; g.fillStyle = stage === 2 ? "#ff4d6d" : "#eafcff"; g.fillText(stage === 0 ? "LAUNCH IN 5" : stage === 1 ? "×" + now.toFixed(2) : "BOOM ×" + crash.toFixed(2), 160, 160);
    const rowH = (H - 230) / PLAYERS.length;
    PLAYERS.forEach(([name, col, bet, aim], i) => { const y = 200 + i * rowH, out = stage > 0 && aim <= now, lost = stage === 2 && !out;
      g.fillStyle = out ? "#7dff9a1c" : lost ? "#ff4d6d18" : "#ffffff08"; g.fillRect(20, y, 280, rowH - 14);
      g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 10; g.beginPath(); g.arc(42, y + 32, 9, 0, 7); g.fill(); g.font = '400 30px "Bungee",Impact,sans-serif'; g.textAlign = "left"; g.fillText(name, 62, y + 42); g.shadowBlur = 0;
      g.font = '700 26px "Chakra Petch",monospace'; g.textAlign = "right"; g.fillStyle = "#9fc7d6"; g.fillText(bet, 288, y + 42);
      g.textAlign = "left"; g.font = '700 30px "Chakra Petch",monospace'; g.fillStyle = out ? "#7dff9a" : lost ? "#ff4d6d" : "#cfeeff";
      g.fillText(out ? `+${Math.floor(bet * aim)} @ ×${aim.toFixed(2)}` : lost ? `LOST ${bet}` : stage ? "riding…" : `aiming ×${aim.toFixed(2)}`, 34, y + 92); });
    return ctex(c); }
  const boards = [0, 1, 2].map(boardTex);
  const boardMat = new THREE.MeshBasicMaterial({ name: "Leaderboard", map: boards[0] });
  noShadow(add(board, new THREE.PlaneGeometry(LW, LH), boardMat, "Leaderboard", [0, LY, .072]));
  // a soft holo light cone up the front of the screen
  { const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d"), gr = g.createLinearGradient(0, 256, 0, 0); gr.addColorStop(0, "rgba(95,232,255,.45)"); gr.addColorStop(1, "rgba(95,232,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const m = new THREE.MeshBasicMaterial({ map: ctex(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    noShadow(add(tower, new THREE.CylinderGeometry(.9, 1.15, 1.1, 32, 1, true), m, "HoloCone", [0, 1.05, 0])); }

  // ---- the podiums: a semicircle facing the screen, one per player, each with its own stool ----
  const SEATS = [["QUELL", 0x6f95ff], ["NIX", 0xffe14a], ["BLORB", 0xff5fae], ["YOU", 0xffffff], ["KRILL", 0x3fe6c8], ["VEXA", 0x8dff6a], ["GLIM", 0xff8a3a]];
  const hexc = c => "#" + c.toString(16).padStart(6, "0");
  function consoleTex(name, col) { const c = document.createElement("canvas"); c.width = 384; c.height = 240; const g = c.getContext("2d"), C = hexc(col);
    g.fillStyle = "#041019"; g.fillRect(0, 0, 384, 240); g.strokeStyle = "#5fe8ff22"; g.lineWidth = 1; for (let x = 0; x < 384; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 240); g.stroke(); } for (let y = 0; y < 240; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(384, y); g.stroke(); }
    g.strokeStyle = C; g.lineWidth = 4; g.strokeRect(6, 6, 372, 228);
    g.fillStyle = C; g.font = '400 30px "Bungee",Impact,sans-serif'; g.textAlign = "left"; g.textBaseline = "middle"; g.shadowColor = C; g.shadowBlur = 12; g.fillText(name, 22, 34);
    g.font = '700 28px "Chakra Petch",monospace'; g.textAlign = "right"; g.fillStyle = "#eafcff"; g.fillText("×" + (1 + Math.random() * 4).toFixed(2), 362, 34); g.shadowBlur = 0;
    [["#5fe8ff", "1"], ["#7dff9a", "5"], ["#b48cff", "25"], ["#ffc845", "100"]].forEach(([cc, v], i) => { const x = 52 + i * 62, y = 108; g.strokeStyle = cc; g.lineWidth = 6; g.shadowColor = cc; g.shadowBlur = 10; g.beginPath(); g.arc(x, y, 24, 0, 7); g.stroke(); g.shadowBlur = 0;
      g.fillStyle = "#fff"; g.font = '700 20px "Chakra Petch",monospace'; g.textAlign = "center"; g.fillText(v, x, y + 1); });
    for (const [i, lab] of [[0, "BET 1"], [1, "BET 2"]]) { const x = 22 + i * 176, y = 160; g.fillStyle = i ? "#ffc84522" : "#7dff9a22"; g.fillRect(x, y, 164, 58); g.strokeStyle = i ? "#ffc845" : "#7dff9a"; g.lineWidth = 3; g.strokeRect(x, y, 164, 58);
      g.fillStyle = "#fff"; g.font = '400 24px "Bungee",Impact,sans-serif'; g.textAlign = "center"; g.fillText(lab, x + 82, y + 30); }
    return ctex(c); }
  const podLights = [];
  SEATS.forEach(([name, col], i) => { const a = (-ARC + i * 2 * ARC / (SEATS.length - 1)) * Math.PI / 180, x = Math.sin(a) * R_POD, z = Math.cos(a) * R_POD;
    const pod = grp(root, "Podium_" + name, [x, 0, z], [0, a + Math.PI, 0]);            // local −Z faces the screen... turned so its front (+Z) looks at the centre
    const accent = glow("Accent_" + name, col, 1.8), panel = new THREE.MeshBasicMaterial({ name: "Console_" + name, map: consoleTex(name, col) });
    add(pod, new THREE.CylinderGeometry(.34, .38, .06, 6), mat.shellDark, "PodFoot", [0, .03, 0], [0, Math.PI / 6, 0]);
    noShadow(add(pod, new THREE.TorusGeometry(.36, .012, 4, 6), accent, "PodRing", [0, .065, 0], [Math.PI / 2, 0, Math.PI / 6]));
    add(pod, chamferBox(.42, .82, .32, .05), mat.shell, "PodColumn", [0, .47, 0]);
    noShadow(add(pod, chamferBox(.03, .6, .02, .008), accent, "PodStripe", [0, .47, -.165]));
    add(pod, chamferBox(.46, .04, .36, .015), mat.trim, "PodBand", [0, .9, 0]);
    const head = grp(pod, "PodHead", [0, 1.0, .02], [-.5, 0, 0]);                         // tilted console, leaning toward the seated player
    add(head, chamferBox(.56, .06, .38, .02), mat.shellDark, "ConsoleBody");
    noShadow(add(head, new THREE.PlaneGeometry(.5, .31), panel, "ConsoleScreen", [0, .032, 0], [-Math.PI / 2, 0, Math.PI]));
    add(pod, chamferBox(.2, .14, .16, .03), mat.shell, "Neck", [0, .92, .02]);
    // a little chip stack beside the console
    const cm = std("Chip_" + name, col, .2, .45);
    for (let k = 0; k < 3 + (i % 4); k++) add(pod, new THREE.CylinderGeometry(.022, .022, .007, 16), cm, "Chip", [.22, .926 + k * .0072, .12]);
    podLights.push(accent);
    // the stool, a step further out, facing the screen
    const st = grp(root, "Stool_" + name, [Math.sin(a) * (R_POD + .55), 0, Math.cos(a) * (R_POD + .55)]);
    add(st, new THREE.CylinderGeometry(.19, .19, .07, 20), std("Seat_" + name, 0x2a1a4f, .2, .5), "StoolSeat", [0, .66, 0]);
    noShadow(add(st, new THREE.TorusGeometry(.19, .01, 4, 24), accent, "SeatRing", [0, .66, 0], [Math.PI / 2, 0, 0]));
    add(st, new THREE.CylinderGeometry(.03, .045, .63, 10), mat.metal, "StoolPost", [0, .32, 0]);
    add(st, new THREE.CylinderGeometry(.2, .24, .03, 20), mat.shellDark, "StoolFoot", [0, .015, 0]);
    add(st, new THREE.TorusGeometry(.15, .011, 6, 20), mat.trim, "FootRing", [0, .3, 0], [Math.PI / 2, 0, 0]); });
  root.traverse(o => { if (o.isMesh && !["FlightScreen", "Sign", "ConsoleScreen", "HoloCone"].includes(o.name) && !/Ring|Torus/.test(o.geometry.type) && !o.name.startsWith("Holo")) { let g = o.geometry; if (g.index) g = g.toNonIndexed(); g.computeVertexNormals(); o.geometry = g; } });

  // ---- animations: the rings turn (faster during a launch); the screen runs through the flight; podium lights breathe ----
  const Q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray();
  // each ring spins in its own plane and wobbles gently back and forth (whole wobble cycles per loop, so it repeats seamlessly)
  const ringTracks = (D, turns, wob) => { const ts = Array.from({ length: 97 }, (_, i) => i / 96 * D);
    const tr = (name, tilt, k, ph) => new THREE.QuaternionKeyframeTrack(name + ".quaternion", ts, ts.flatMap(t => { const u = Math.PI * 2 * t / D;
      return Q(Math.PI / 2 + tilt + wob * Math.sin(u * 2 + ph), wob * .8 * Math.sin(u * 3 + ph * 1.7), k * turns * u); }));
    return [tr("HoloRing_A", 0, 1, 0), tr("HoloRing_B", .25, -1.3, 2.1), tr("HoloRing_C", 0, .8, 4.2)]; };
  const clips = [new THREE.AnimationClip("Idle", 8, ringTracks(8, 1, .07)), new THREE.AnimationClip("Launch", 8, ringTracks(8, 3, .11))];
  const LAUNCH = [[0, 0], [1.6, 1], [3.2, 2], [4.8, 3], [6.6, 4]];                      // seconds into the loop → which frame
  const STAGE_COL = [0x5fe8ff, 0xff9a4a, 0xb48cff, 0xff5fae, 0xff2a3a];                  // pad, liftoff/clouds, orbit, nebula, explosion
  const BOARD_AT = [0, 1, 1, 1, 2];
  // steam: soft sprites that jet out sideways from the arms' vents, then rise and spread
  const sc2 = document.createElement("canvas"); sc2.width = sc2.height = 64; { const g = sc2.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(235,240,255,.8)"); gr.addColorStop(.5, "rgba(210,215,240,.35)"); gr.addColorStop(1, "rgba(200,205,235,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  const steamTex = ctex(sc2), puffs = [];
  for (let i = 0; i < 140; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0 })); s.name = "Steam"; s.visible = false; tower.add(s); puffs.push({ s, life: 0 }); }
  let shown = -1, shownB = -1, lastT = 0, prevLoop = -1;
  const col = new THREE.Color(), white = new THREE.Color(0xffffff);
  const update = (t, mode) => { const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t; const lt = t % 8, launching = mode === "Launch";
    const f = launching ? LAUNCH.filter(([s]) => lt >= s).pop()[1] : 0;
    if (f !== shown && frames[f]) { shown = f; screenMat.map = frames[f]; screenMat.needsUpdate = true; }
    const bf = launching ? BOARD_AT[f] : 0; if (bf !== shownB) { shownB = bf; boardMat.map = boards[bf]; boardMat.needsUpdate = true; }
    // screen lights: the colour of the flight stage; a white flash at liftoff; the explosion flashes red
    col.setHex(STAGE_COL[f]); let k = 1.8;
    if (launching && lt >= 1.6 && lt < 2.1) { col.lerp(white, 1 - (lt - 1.6) / .5); k = 3.2; }
    if (launching && f === 4) k = 1.2 + 2.2 * (Math.sin(lt * 18) > 0 ? 1 : 0);
    if (!launching) k = 1.6 + .25 * Math.sin(t * 1.5);
    mat.edge.emissive.copy(col); mat.edge.emissiveIntensity = k; mat.plinthGlow.emissive.copy(col); mat.plinthGlow.emissiveIntensity = k * .9;
    // fin lights: a slow shimmer while idle; during a flight they chase upward, faster as it climbs
    finLights.forEach(({ m, k: j, base }) => { if (!launching || f === 0) { m.emissive.setHex(base); m.emissiveIntensity = 1.2 + .5 * Math.sin(t * 2 + j); return; }
      const speed = 4 + f * 3, on = ((Math.floor(lt * speed) % 6) === j) || ((Math.floor(lt * speed) + 3) % 6 === j); m.emissive.copy(col); m.emissiveIntensity = on ? 3.4 : .5; });
    // steam: a burst from both vents as the drone lifts off, tailing away
    const loop = Math.floor(t / 8); if (loop !== prevLoop) prevLoop = loop;
    const blasting = launching && lt >= 1.5 && lt < 3.0, rate = blasting ? (lt < 2.1 ? 150 : 90 * (3 - lt)) : 0;
    let spawn = rate * dt + (Math.random() < (rate * dt % 1) ? 1 : 0);
    for (const p of puffs) { if (spawn >= 1 && p.life <= 0) { spawn--; const v = vents[Math.random() < .5 ? 0 : 1], sx = Math.sign(v.x);
        p.life = 1; p.s.visible = true; p.s.position.copy(v); p.vel = new THREE.Vector3(sx * (1.6 + Math.random() * 1.4), (Math.random() - .3) * .5, .2 + Math.random() * .6); p.size = .07; }
      if (p.life > 0) { p.life -= dt * .9; p.vel.multiplyScalar(.95); p.vel.y += 1.1 * dt; p.s.position.addScaledVector(p.vel, dt); p.size += dt * .75;
        p.s.scale.setScalar(p.size); p.s.material.opacity = Math.max(0, p.life) * .55; if (p.life <= 0) p.s.visible = false; } }
    podLights.forEach((m, i) => m.emissiveIntensity = 1.4 + .6 * Math.sin(t * 2 + i * .7)); };
  return { root, clips, height: 5.4, update };
}
