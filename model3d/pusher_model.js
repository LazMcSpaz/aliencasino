// Star Dozer: the whole coin-pusher machine, used by BOTH the casino floor (lobby) and the game itself, so it looks the same from outside and from the player's seat.
// It is built at the game's real size: the play area (`play` group) has its origin where the physics has it — the tray floor is y = 0, x runs −W/2…W/2,
// z runs 0 (the wall behind the pusher) to L (the front lip, toward the player). The game puts its physics pieces in that space.
// Look: sculpted side panels in glossy dark paint with panel lines, chrome with its own reflections (no scene environment needed), glowing light strips with
// soft halos, a hood with downlights over the tray, a lookout screen (Zib) in the marquee, a gold star topper inside hologram rings, underglow at the floor.
// opts: { tex: { bar: bar-face image, zib: { neutral, wink, excited, surprised, angry } }, play: true in the game (no front glass, no fake pile; the game
//   draws the real pieces), dims: { W, L, PH, PD, GUTTER } (must match pusher/part_engine.js; these defaults do) }.
// Returns { root, play, pusher, height, depth, setFace(z), drawScreen(t, look), update(t) } — root's origin is on the floor under the middle of the machine.
// Also: buildPusher.barGeometry(THREE, [w,h,d]) and buildPusher.barMaterials(THREE, faceTexture, envMap) so the game's bars are the same shape.
function buildPusher(THREE, opts = {}) {
  const D = Object.assign({ W: 1.0, L: 1.2, PH: .075, PD: .6, GUTTER: .085 }, opts.dims || {}), { W, L, PH, PD, GUTTER } = D, T = opts.tex || {}, PLAY = !!opts.play;
  const TY = .95;                                      // tray floor height above the casino floor
  const BACK = -.82, FRONT = L + .3;                    // cabinet back and front (play-space z)
  const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
  const ctex = (c, rep) => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };
  const ENV = buildPusher.env(THREE);
  const std = (color, metalness, roughness, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, envMap: ENV, envMapIntensity: 1, ...extra });
  const glow = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: o < 1, opacity: o });
  const halo = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false });
  // panel lines: thin dark seams, small rivets and vents, mapped one texture per metre
  const panelTex = (() => { const [c, g] = canvas(512, 512); g.fillStyle = "#808080"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "#2a2a2a"; g.lineWidth = 3;
    for (const [x0, y0, x1, y1] of [[0, 150, 512, 150], [0, 380, 512, 380], [190, 0, 190, 150], [330, 150, 330, 380], [120, 380, 120, 512], [420, 380, 420, 512]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
    g.fillStyle = "#3a3a3a"; for (let i = 0; i < 7; i++) g.fillRect(360 + i * 16, 200, 8, 120);           // a vent
    g.fillStyle = "#b0b0b0"; for (const [x, y] of [[20, 170], [310, 170], [20, 360], [310, 360], [350, 170], [490, 170], [350, 360], [490, 360]]) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; })();
  const mat = {
    paint: new THREE.MeshPhysicalMaterial({ color: 0x1c1240, metalness: .4, roughness: .32, clearcoat: 1, clearcoatRoughness: .12, envMap: ENV, roughnessMap: panelTex, bumpMap: panelTex, bumpScale: .0025 }),
    paintDark: std(0x0d0b1a, .5, .45), chrome: std(0xcfd3e6, 1, .14), gun: std(0x3c3a52, .9, .3), black: std(0x05040a, .3, .6),
    pearl: new THREE.MeshPhysicalMaterial({ color: 0xe9e6f5, metalness: .1, roughness: .25, clearcoat: 1, clearcoatRoughness: .08, envMap: ENV }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xcff6ff, metalness: 0, roughness: .03, transparent: true, opacity: .12, envMap: ENV, envMapIntensity: 1.6, depthWrite: false }),
    green: glow(0x7dff9a), pink: glow(0xff4fae), cyan: glow(0x4fe6ff), red: glow(0xff4d6d), gold: glow(0xffc845) };
  const add = (parent, geo, m, p = [0, 0, 0], r = [0, 0, 0], name) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r);
    const lit = !(Array.isArray(m) ? m[0] : m).isMeshBasicMaterial && !(Array.isArray(m) ? m[0] : m).transparent; o.castShadow = o.receiveShadow = lit; if (name) o.name = name; parent.add(o); return o; };
  const grp = (parent, name, p = [0, 0, 0]) => { const g = new THREE.Group(); g.name = name; g.position.set(...p); parent.add(g); return g; };
  // a profile drawn in (z, y) and extruded across x (centred), with rounded edges
  const profile = (pts, depth, bevel = .012) => { const sh = new THREE.Shape(); pts.forEach((p, i) => { if (i === 0) sh.moveTo(p[0], p[1]); else if (p.length === 4) sh.quadraticCurveTo(p[2], p[3], p[0], p[1]); else sh.lineTo(p[0], p[1]); });
    const g = new THREE.ExtrudeGeometry(sh, { depth: depth - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 14 }); g.rotateY(-Math.PI / 2); g.translate(depth / 2 - bevel, 0, 0); return g; };
  const rbox = (w, h, d, r = .01) => { const sh = new THREE.Shape(), x = -w / 2 + r, y = -h / 2 + r, ww = w - 2 * r, hh = h - 2 * r; sh.moveTo(x, y); sh.lineTo(x + ww, y); sh.lineTo(x + ww, y + hh); sh.lineTo(x, y + hh); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3 }); g.translate(0, 0, -d / 2 + r); return g; };
  const tube = (parent, pts, col, r = .006) => { const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); const n = Math.max(24, pts.length * 12);
    add(parent, new THREE.TubeGeometry(curve, n, r, 8), glow(col)); add(parent, new THREE.TubeGeometry(curve, n, r * 3.2, 8), halo(col)); };

  const root = new THREE.Group(); root.name = "StarDozer";
  const midZ = (BACK + FRONT) / 2;
  const play = grp(root, "PlayArea", [0, TY, -midZ]);              // play-space origin, placed so root's origin sits under the middle of the cabinet
  const P = play;                                                   // everything below is in play space (y = 0 is the tray floor; the casino floor is y = −TY)
  const XO = W / 2 + .14;                                           // outer half-width of the cabinet

  // ---- side panels: a sculpted profile, glossy paint with panel lines, a chrome edge and a glowing strip along the top ----
  const cheekPts = [[BACK, -TY + .06], [FRONT - .1, -TY + .06], [FRONT + .02, -.62, FRONT + .06, -TY + .2], [FRONT - .02, -.16, FRONT + .04, -.4], [L + .1, .1, FRONT - .04, .06],
    [.62, .5, .9, .32], [.18, .86, .32, .74], [BACK + .12, 1.1, -.2, 1.1], [BACK, .96, BACK, 1.1]];
  const cheekTop = [[L + .12, .08], [.95, .28], [.62, .5], [.4, .66], [.18, .84], [-.1, 1.02], [BACK + .14, 1.1]];
  for (const s of [-1, 1]) { const g = add(P, profile(cheekPts, .1, .016), mat.paint, [s * (XO - .05), 0, 0]);
    add(P, profile(cheekPts.map(([z, y, a, b]) => a === undefined ? [z, y] : [z, y, a, b]), .012, .004), mat.chrome, [s * (XO - .102), 0, 0]);          // chrome inner edge
    tube(P, cheekTop.map(([z, y]) => [s * (XO - .1), y + .012, z]), s < 0 ? 0xff4fae : 0x4fe6ff, .0055);
    tube(P, [[s * (XO + .002), -TY + .5, FRONT - .04], [s * (XO + .002), -TY + .2, FRONT - .06], [s * (XO + .002), -TY + .1, FRONT - .2], [s * (XO + .002), -TY + .1, BACK + .1]], s < 0 ? 0xff4fae : 0x4fe6ff, .005); }
  // ---- base between the panels: body, a sloped console with the coin slot and two glowing hand pads (for slapping), a lit front, the win chute, underglow ----
  add(P, rbox(2 * XO - .1, TY - .1, FRONT - BACK - .2, .02), mat.paintDark, [0, -TY / 2 - .02, (BACK + FRONT) / 2 - .12]);
  add(P, new THREE.BoxGeometry(2 * XO + .02, .06, FRONT - BACK + .04), mat.black, [0, -TY + .03, midZ]);
  tube(P, [[-XO - .01, -TY + .065, FRONT + .03], [XO + .01, -TY + .065, FRONT + .03]], 0x7dff9a, .005);               // underglow along the front
  const con = grp(P, "Console", [0, -.07, L + .12]); con.rotation.x = .5;
  add(con, rbox(2 * XO - .12, .025, .26, .008), std(0x0a0816, .2, .7));
  { const [c, g] = canvas(512, 128); g.fillStyle = "#000"; g.fillRect(0, 0, 512, 128);
    const hand = (cx, flip, col) => { g.save(); g.translate(cx, 64); g.scale(flip, 1); g.strokeStyle = col; g.lineWidth = 5; g.shadowColor = col; g.shadowBlur = 14; g.lineJoin = g.lineCap = "round";
      g.beginPath(); g.moveTo(-22, 40); g.quadraticCurveTo(-38, 10, -34, -6); g.lineTo(-26, -8); g.lineTo(-20, 6); g.lineTo(-20, -40); g.lineTo(-10, -40); g.lineTo(-10, -2); g.lineTo(-8, -48); g.lineTo(2, -48); g.lineTo(2, -2);
      g.lineTo(6, -44); g.lineTo(16, -44); g.lineTo(14, 0); g.lineTo(20, -32); g.lineTo(30, -30); g.lineTo(26, 20); g.quadraticCurveTo(20, 40, 8, 44); g.closePath(); g.stroke(); g.restore(); };
    hand(70, 1, "#7dff9a"); hand(442, -1, "#7dff9a"); g.fillStyle = "#ffc845"; g.shadowColor = "#ffc845"; g.shadowBlur = 12; g.fillRect(236, 52, 40, 8); g.font = '400 18px "Share Tech Mono",monospace'; g.textAlign = "center"; g.fillText("1 BAR", 256, 92);
    add(con, new THREE.PlaneGeometry(2 * XO - .16, (2 * XO - .16) / 4), new THREE.MeshBasicMaterial({ map: ctex(c), toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), [0, .0135, 0], [-Math.PI / 2, 0, 0]); }
  { const [c, g] = canvas(512, 256), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#1a0f3a"); gr.addColorStop(1, "#05040f"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    g.strokeStyle = "#4fe6ff22"; g.lineWidth = 1; for (let x = 0; x < 512; x += 24) for (let y = 0; y < 256; y += 21) { g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.lineTo(x + (y / 21 % 2) * 12 + Math.cos(a) * 12, y + Math.sin(a) * 12); } g.closePath(); g.stroke(); }
    g.textAlign = "center"; g.font = '400 48px "Bungee",Impact,sans-serif'; g.shadowColor = "#ffc845"; g.shadowBlur = 18; g.fillStyle = "#fff1dc"; g.fillText("PUSH YOUR LUCK", 256, 84);
    const gem = (x, col, s) => { g.save(); g.translate(x, 172); g.shadowColor = col; g.shadowBlur = 16; g.fillStyle = col; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * .8, -s * .25); g.lineTo(s * .5, s * .8); g.lineTo(-s * .5, s * .8); g.lineTo(-s * .8, -s * .25); g.closePath(); g.fill();
      g.fillStyle = "#ffffff99"; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * .3, -s * .25); g.lineTo(-s * .3, -s * .25); g.fill(); g.restore(); };
    [["#4fe6ff", 22], ["#b48cff", 26], ["#ff4fae", 30], ["#ffc845", 36], ["#ff4fae", 30], ["#b48cff", 26], ["#4fe6ff", 22]].forEach(([col, s], i) => gem(76 + i * 60, col, s));
    add(P, new THREE.PlaneGeometry(2 * XO - .2, (2 * XO - .2) / 2), new THREE.MeshBasicMaterial({ map: ctex(c), toneMapped: false, color: 0xdddddd }), [0, -.62, FRONT - .068]); }
  add(P, rbox(2 * XO - .3, .1, .1, .02), mat.black, [0, -.3, FRONT - .1]); add(P, new THREE.BoxGeometry(2 * XO - .34, .01, .01), mat.green, [0, -.25, FRONT - .05]);   // the win chute opening

  // ---- the tray: a dark plate with a faint hex grid, green lip, red gutters at the front corners, glass sides with chrome rails ----
  { const [c, g] = canvas(256, 256); g.fillStyle = "#120a2c"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#4fe6ff2a"; g.lineWidth = 2;
    for (let x = 0; x < 256 + 32; x += 37) for (let y = 0; y < 256 + 32; y += 32) { g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.lineTo(x + (Math.round(y / 32) % 2) * 18.5 + Math.cos(a) * 18, y + Math.sin(a) * 18); } g.closePath(); g.stroke(); }
    add(P, new THREE.BoxGeometry(W + .2, .04, L + .7), std(0xffffff, .3, .6, { map: ctex(c, [4, 5]), envMapIntensity: .3 }), [0, -.02, (L - .7) / 2]).castShadow = false; }
  add(P, new THREE.BoxGeometry(W - 2 * GUTTER, .006, .012), mat.green, [0, .003, L - .006]);
  for (const s of [-1, 1]) { add(P, new THREE.BoxGeometry(GUTTER, .006, .012), mat.red, [s * (W / 2 - GUTTER / 2), .003, L - .006]);
    add(P, new THREE.BoxGeometry(GUTTER, .08, .1), mat.black, [s * (W / 2 - GUTTER / 2), -.13, L + .02]); }
  add(P, new THREE.BoxGeometry(W - 2 * GUTTER, .05, .3), mat.black, [0, -.18, L + .12], [-.3, 0, 0]);
  for (const s of [-1, 1]) { add(P, new THREE.PlaneGeometry(L + .3, .52), mat.glass, [s * (W / 2 + .002), .26, L / 2 - .15], [0, -s * Math.PI / 2, 0]);
    add(P, new THREE.BoxGeometry(.03, .025, L + .3), mat.chrome, [s * (W / 2 + .012), .52, L / 2 - .15]);
    add(P, new THREE.BoxGeometry(.03, .025, L + .3), mat.chrome, [s * (W / 2 + .012), .0125, L / 2 - .15]);
    add(P, new THREE.CylinderGeometry(.016, .016, .55, 16), mat.chrome, [s * (W / 2 + .012), .27, L - .01]);
    add(P, new THREE.BoxGeometry(.006, .006, L + .28), s < 0 ? mat.pink : mat.cyan, [s * (W / 2 - .004), .004, L / 2 - .15]);
    // filler between the glass and the side panel
    add(P, new THREE.BoxGeometry(XO - W / 2 - .12, .04, FRONT - BACK - .2), mat.paintDark, [s * (W / 2 + (XO - W / 2) / 2 - .03), -.02, midZ - .05]); }

  // ---- the back tower: the drop-zone panel above the pusher, the marquee screen, chrome bezels ----
  add(P, rbox(2 * XO - .2, 1.12, -BACK - .02, .025), mat.paintDark, [0, .54, BACK / 2 - .01]);
  { const [c, g] = canvas(1024, 300), gr = g.createLinearGradient(0, 0, 0, 300); gr.addColorStop(0, "#1a0f3a"); gr.addColorStop(1, "#07051a"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 300);
    for (let i = 0; i < 220; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .7 + .1})`; g.beginPath(); g.arc(Math.random() * 1024, Math.random() * 300, Math.random() < .08 ? 2.2 : 1, 0, 7); g.fill(); }
    const pl = g.createRadialGradient(150, 110, 8, 170, 130, 80); pl.addColorStop(0, "#ffb070"); pl.addColorStop(.6, "#c8486a"); pl.addColorStop(1, "#2a0f3a"); g.fillStyle = pl; g.beginPath(); g.arc(170, 130, 70, 0, 7); g.fill();
    g.strokeStyle = "#ffc84588"; g.lineWidth = 5; g.beginPath(); g.ellipse(170, 130, 120, 22, -.25, 0, 7); g.stroke();
    const p2 = g.createRadialGradient(880, 80, 4, 890, 90, 40); p2.addColorStop(0, "#c8fbff"); p2.addColorStop(1, "#1e5aa8"); g.fillStyle = p2; g.beginPath(); g.arc(890, 90, 36, 0, 7); g.fill();
    g.lineWidth = 9; g.lineJoin = "round"; g.shadowColor = "#7dff9a"; g.shadowBlur = 14; for (let i = 0; i < 5; i++) { g.strokeStyle = `rgba(125,255,154,${.25 + i * .17})`; const y = 60 + i * 40; g.beginPath(); g.moveTo(452, y); g.lineTo(512, y + 26); g.lineTo(572, y); g.stroke(); }
    g.font = '400 30px "Bungee",Impact,sans-serif'; g.textAlign = "center"; g.fillStyle = "#7dff9a"; g.shadowBlur = 12; g.fillText("DROP ZONE", 512, 286); g.shadowBlur = 0;
    add(P, new THREE.PlaneGeometry(W - .02, .29), new THREE.MeshBasicMaterial({ map: ctex(c), toneMapped: false, color: 0xbbbbbb }), [0, PH + .155, .0015]); }
  add(P, new THREE.BoxGeometry(W, .008, .02), mat.cyan, [0, PH + .012, .001]);                                           // lit edge where the scraper meets the pusher
  add(P, rbox(W - .06, .03, .05, .01), mat.chrome, [0, PH + .305, .03]); add(P, new THREE.BoxGeometry(W - .1, .005, .052), mat.pink, [0, PH + .29, .03]);   // the drop rail
  // marquee: a recessed screen in a chrome bezel, chasing lights round it
  const mqW = W - .06, mqH = mqW * 300 / 1024, mqY = PH + .48;
  { const sh = new THREE.Shape(), o = [mqW / 2 + .035, mqH / 2 + .035], i = [mqW / 2 + .004, mqH / 2 + .004];
    sh.moveTo(-o[0], -o[1]); sh.lineTo(o[0], -o[1]); sh.lineTo(o[0], o[1]); sh.lineTo(-o[0], o[1]); sh.closePath();
    const h = new THREE.Path(); h.moveTo(-i[0], -i[1]); h.lineTo(-i[0], i[1]); h.lineTo(i[0], i[1]); h.lineTo(i[0], -i[1]); h.closePath(); sh.holes.push(h);
    add(P, new THREE.ExtrudeGeometry(sh, { depth: .012, bevelEnabled: true, bevelThickness: .008, bevelSize: .006, bevelSegments: 3 }), mat.chrome, [0, mqY, -.002]); }
  const [sc, sg] = canvas(1024, 300), screenTex = ctex(sc);
  add(P, new THREE.PlaneGeometry(mqW, mqH), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }), [0, mqY, .004]);
  const NB = 44, bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(.009, 10, 8), new THREE.MeshBasicMaterial({ toneMapped: false }), NB), bulbPos = [];
  for (let i = 0; i < NB; i++) { const k = i / NB, per = 2 * (mqW + mqH) + .16, d = k * per, a = mqW + .08, b = mqH + .08; let x, y;
    if (d < a) { x = -a / 2 + d; y = b / 2; } else if (d < a + b) { x = a / 2; y = b / 2 - (d - a); } else if (d < 2 * a + b) { x = a / 2 - (d - a - b); y = -b / 2; } else { x = -a / 2; y = -b / 2 + (d - 2 * a - b); }
    bulbPos.push([x, mqY + y, .02]); const m = new THREE.Matrix4().makeTranslation(x, mqY + y, .022); bulbs.setMatrixAt(i, m); bulbs.setColorAt(i, new THREE.Color(0xffffff)); }
  P.add(bulbs);
  // the hood: sweeps forward over the pusher with a lit lip and downlights shining on the tray
  const hoodPts = [[BACK + .02, .98], [BACK + .02, 1.16], [-.02, 1.13, -.3, 1.19], [.16, .97, .12, 1.07], [.15, .935], [.0, .925, .08, .92], [BACK + .02, .98]];
  add(P, profile(hoodPts, 2 * XO - .06, .014), mat.paint);
  add(P, new THREE.BoxGeometry(2 * XO - .14, .012, .012), mat.cyan, [0, .935, .155]); add(P, new THREE.BoxGeometry(2 * XO - .1, .03, .03), halo(0x4fe6ff), [0, .935, .155]);
  for (let i = 0; i < 5; i++) { const x = (i - 2) * W / 5; add(P, new THREE.CylinderGeometry(.022, .022, .006, 20), glow(0xfff2dc), [x, .921, .06]);
    if (!PLAY) add(P, new THREE.ConeGeometry(.16, .82, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2dc, transparent: true, opacity: .035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), [x, .52, .2], [-.3, 0, 0]); }
  // ---- the topper: a gold five-pointed star on a chrome stalk, inside two tilted hologram rings ----
  const top = grp(P, "Star", [0, 1.2, -.18]);
  add(top, new THREE.CylinderGeometry(.018, .035, .18, 16), mat.chrome, [0, .04, 0]);
  const starShape = (() => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .068 : .165; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: .03, bevelEnabled: true, bevelThickness: .018, bevelSize: .014, bevelSegments: 3 }); g.translate(0, 0, -.015); return add(top, g, std(0xffc845, 1, .18, { emissive: 0xff9a00, emissiveIntensity: .35 }), [0, .3, 0]); })();
  const rings = [0, 1].map(i => { const r = add(top, new THREE.TorusGeometry(.25 + i * .04, .004, 8, 80), halo(i ? 0xff4fae : 0x4fe6ff), [0, .3, 0]); r.material.opacity = .7; r.rotation.set(1.2 + i * .5, 0, .3 - i * .6); return r; });

  // ---- the pusher block: diamond-plate chrome on top, hazard stripes on its face, a glowing front edge ----
  const pusher = grp(P, "Pusher", [0, PH / 2, .13 - PD / 2]);
  { const [c, g] = canvas(256, 256); g.fillStyle = "#6a6880"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#b4b2c8"; g.strokeStyle = "#3a384c"; g.lineWidth = 2;
    for (let y = 0; y < 256; y += 32) for (let x = (y / 32 % 2) * 16; x < 256; x += 32) { g.save(); g.translate(x + 8, y + 8); g.rotate(y / 32 % 2 ? .7 : -.7); g.beginPath(); g.ellipse(0, 0, 11, 3.5, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
    const [hc, hg] = canvas(512, 32); hg.fillStyle = "#14101e"; hg.fillRect(0, 0, 512, 32); hg.fillStyle = "#ffc845"; for (let x = -32; x < 512; x += 32) { hg.beginPath(); hg.moveTo(x, 32); hg.lineTo(x + 16, 0); hg.lineTo(x + 32, 0); hg.lineTo(x + 16, 32); hg.fill(); }
    const side = std(0x4a4860, .9, .32), topM = std(0xffffff, .9, .3, { map: ctex(c, [8, 5]) }), front = std(0xffffff, .3, .5, { map: ctex(hc, [3, 1]) });
    add(pusher, new THREE.BoxGeometry(W - .006, PH, PD), [side, side, topM, side, front, side]);
    add(pusher, new THREE.BoxGeometry(W - .006, .008, .006), mat.cyan, [0, PH / 2 - .006, PD / 2 + .002]); add(pusher, new THREE.BoxGeometry(W - .006, .02, .02), halo(0x4fe6ff), [0, PH / 2 - .006, PD / 2 + .002]); }

  // ---- outside only: the front glass, and a pile of bars with crystals on the tray (the game draws the real ones) ----
  const gems = [];
  if (!PLAY) {
    const fg = new THREE.PlaneGeometry(W + .02, Math.hypot(L - .3, .78)); add(P, fg, mat.glass, [0, .47, (L + .1 + .4) / 2], [-Math.atan2(L - .3, .78), 0, 0]);
    const BAR = [.11, .014, .066], bg = buildPusher.barGeometry(THREE, BAR), bm = buildPusher.barMaterials(THREE, T.bar ? new THREE.TextureLoader().load(T.bar, t => { t.encoding = THREE.sRGBEncoding; }) : null, ENV);
    const heap = []; for (let row = 0; row < 12; row++) for (let i = 0; i < 9; i++) { const x = -W / 2 + .07 + i * (BAR[0] + .012) + (row % 2) * .06, z = .42 + row * (BAR[2] + .0125); if (x > W / 2 - .05 || z > L - .03 || Math.random() < .1) continue;
      heap.push([x, BAR[1] / 2, z, (Math.random() - .5) * .5, 0]); if (Math.random() < .3) heap.push([x + (Math.random() - .5) * .04, BAR[1] * 1.5, z, Math.random() * 6, (Math.random() - .5) * .2]); }
    for (let i = 0; i < 10; i++) heap.push([(Math.random() - .5) * (W - .14), PH + BAR[1] / 2 + .002, .03 + Math.random() * .08, Math.random() * 6, 0]);
    const im = new THREE.InstancedMesh(bg, bm, heap.length), Mx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    heap.forEach(([x, y, z, ry, tilt], i) => { q.setFromEuler(e.set(tilt, ry, 0)); Mx.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, Mx); }); im.castShadow = im.receiveShadow = true; P.add(im);
    for (const [x, z, c, e2, s] of [[.08, .7, 0x1478e8, 0x0636a8, .085], [-.3, .9, 0xf02080, 0xa00848, .105], [.32, .55, 0x8a3df0, 0x4a12b0, .095], [-.05, 1.0, 0xffa800, 0xc06a00, .12]]) {
      gems.push(add(P, buildPusher.gemGeometry(THREE, s), new THREE.MeshPhysicalMaterial({ color: c, emissive: e2, emissiveIntensity: .4, roughness: .05, clearcoat: 1, flatShading: true, envMap: ENV, toneMapped: false }), [x, .05, z])); } }

  // ---- the lookout screen: the name on the left, Zib on the right watching for the guard ----
  const ZIB = {}; for (const [k, src] of Object.entries((T.zib && typeof T.zib === "object") ? T.zib : (T.zib ? { neutral: T.zib } : {}))) { const im = new Image(); im.src = src; ZIB[k] = im; }
  const LOOKCOL = { watch: "#ff4d6d", soon: "#ffc845", clear: "#7dff9a", busted: "#ff4d6d" };
  // look: { state: "watch"|"soon"|"clear", t: seconds left in it, left: slaps left, slaps, clear, soon: window lengths, bust: 0 | 1 (surprised) | 2 (angry) }
  function drawScreen(t, look) {
    if (!look || typeof look !== "object") { const c = t % 16; look = c < 9 ? { state: "watch", t: 9 - c } : c < 11 ? { state: "soon", t: 11 - c } : { state: "clear", t: 16 - c, left: c < 13 ? 2 : c < 14.5 ? 1 : 0 }; Object.assign(look, { slaps: 2, clear: 5, soon: 2 }); }
    const g = sg; g.fillStyle = "#0c0820"; g.fillRect(0, 0, 1024, 300); g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = "#ffffff08"; for (let y = 0; y < 300; y += 4) g.fillRect(0, y, 1024, 1);
    g.font = '400 118px "Monoton","Bungee",Impact,sans-serif'; g.shadowColor = "#ff7a3a"; g.shadowBlur = 30; g.fillStyle = "#fff1dc"; g.fillText("STAR", 330, 118);
    g.font = '400 96px "Yellowtail",cursive'; g.shadowColor = "#4fe6ff"; g.fillStyle = "#e6fbff"; g.fillText("Dozer", 470, 220); g.shadowBlur = 0;
    const bust = look.bust || 0, st = bust ? "busted" : look.state, col = LOOKCOL[st], x0 = 690, y0 = 30, w = 300, h = 240, flick = st === "clear" && Math.floor(t * 6) % 2;
    g.fillStyle = "#05060f"; g.fillRect(x0 - 8, y0 - 8, w + 16, h + 16); g.strokeStyle = "#8d8aa0"; g.lineWidth = 4; g.strokeRect(x0 - 8, y0 - 8, w + 16, h + 16);
    const gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, col + "40"); gr.addColorStop(1, col + "10"); g.fillStyle = gr; g.fillRect(x0, y0, w, h);
    g.fillStyle = col + "18"; for (let y = y0; y < y0 + h; y += 6) g.fillRect(x0, y, w, 2);
    const face = ZIB[bust ? (bust === 1 ? "surprised" : "angry") : { watch: "neutral", soon: "wink", clear: "excited" }[look.state]] || ZIB.neutral || ZIB[Object.keys(ZIB)[0]];
    if (face && face.complete && face.naturalWidth) { const fh = 140, fw = fh * face.naturalWidth / face.naturalHeight, bob = st === "clear" ? Math.sin(t * 14) * 5 : st === "watch" ? Math.sin(t * 1.3) * 3 : 0;
      g.save(); g.shadowColor = col; g.shadowBlur = 18; if (st === "watch") { g.translate(x0 + w / 2, 0); g.scale(Math.sin(t * .7) > 0 ? 1 : -1, 1); g.translate(-(x0 + w / 2), 0); }   // looks one way, then the other
      g.drawImage(face, x0 + w / 2 - fw / 2 + bob, y0 + 6, fw, fh); g.restore(); }
    g.font = '400 44px "Bungee",Impact,sans-serif'; g.fillStyle = flick ? "#ffffff" : col; g.shadowColor = col; g.shadowBlur = 16;
    g.fillText(bust ? "SECURITY!" : look.state === "clear" ? "CLEAR!" : look.state === "soon" ? "GET READY" : "WATCHING", x0 + w / 2, y0 + 172); g.shadowBlur = 0;
    const full = look.state === "clear" ? look.clear : look.state === "soon" ? look.soon : 0;
    if (full && !bust) { g.fillStyle = "#ffffff18"; g.fillRect(x0 + 20, y0 + 204, w - 40, 12); g.fillStyle = col; g.fillRect(x0 + 20, y0 + 204, (w - 40) * Math.min(1, look.t / full), 12); }
    if (look.state === "clear" && !bust) for (let i = 0; i < look.slaps; i++) { g.globalAlpha = i < look.left ? 1 : .25; g.fillStyle = col; g.beginPath(); g.arc(x0 + w - 34 - i * 30, y0 + 24, 10, 0, 7); g.fill(); } g.globalAlpha = 1;
    if (st === "watch" || bust) { g.fillStyle = Math.floor(t * 2) % 2 ? col : col + "44"; g.beginPath(); g.arc(x0 + 22, y0 + 22, 9, 0, 7); g.fill(); }   // the red "on air" light
    screenTex.needsUpdate = true; }
  for (const im of Object.values(ZIB)) im.addEventListener("load", () => drawScreen(0));
  drawScreen(0);

  const BCOL = [0xff4fae, 0xffc845, 0x7dff9a, 0x4fe6ff].map(c => new THREE.Color(c)), OFF = new THREE.Color(0x2a2040);
  let lastScreen = -1;
  const setFace = z => { pusher.position.z = z - PD / 2; };
  // animate the parts that move on their own: the star, the rings, the bulbs (and, outside the game, the pusher and the screen)
  function update(t, look) { starShape.rotation.y = t * 1.1; rings[0].rotation.z = t * .6; rings[1].rotation.z = -t * .45;
    const stp = Math.floor(t * 8); for (let i = 0; i < NB; i++) bulbs.setColorAt(i, (i + stp) % 3 === 0 ? BCOL[i % 4] : OFF); bulbs.instanceColor.needsUpdate = true;
    gems.forEach((g, i) => { g.rotation.y = t * .5 + i; g.position.y = .055 + Math.sin(t * 1.6 + i) * .006; });
    if (!PLAY) { setFace(.13 + .24 * (.5 - .5 * Math.cos(2 * Math.PI * t / 3.4))); if (Math.floor(t * 4) !== lastScreen) { lastScreen = Math.floor(t * 4); drawScreen(t, look); } } }
  return { root, play, pusher, height: TY + 1.55, depth: FRONT - BACK + .1, width: 2 * XO + .02, setFace, drawScreen, update };
}
// a reflection map for the machine's metal and glass: a dark room with soft white light panels and pink / cyan neon, drawn once and shared
buildPusher.env = THREE => { if (buildPusher._env) return buildPusher._env;
  const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#1a1630"); gr.addColorStop(.5, "#0b0918"); gr.addColorStop(1, "#040308"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  const soft = (x, y, w, h, col, a) => { g.globalAlpha = a; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 20; g.fillRect(x, y, w, h); g.globalAlpha = 1; g.shadowBlur = 0; };
  soft(40, 30, 90, 36, "#c8c8dc", .7); soft(300, 24, 120, 30, "#d8ccb8", .6); soft(200, 100, 18, 60, "#ff4fae", .8); soft(420, 100, 18, 60, "#4fe6ff", .8); soft(0, 140, 512, 4, "#b48cff", .4); soft(100, 120, 40, 14, "#ffc845", .5);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding; return buildPusher._env = t; };
// a gold bar: a plaque with cut corners, the bar picture across the top (UVs fill the top face), deep gold edges
buildPusher.barGeometry = (THREE, [bw, bh, bd]) => { const r = .009, e = .0022, sh = new THREE.Shape(), x = -bw / 2 + e, y = -bd / 2 + e, w = bw - 2 * e, h = bd - 2 * e;
  sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.lineTo(x + w, y + r); sh.lineTo(x + w, y + h - r); sh.lineTo(x + w - r, y + h); sh.lineTo(x + r, y + h); sh.lineTo(x, y + h - r); sh.lineTo(x, y + r); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: bh - 2 * e, bevelEnabled: true, bevelThickness: e, bevelSize: e, bevelSegments: 2, curveSegments: 4 }); g.rotateX(-Math.PI / 2); g.translate(0, -(bh - 2 * e) / 2, 0);
  const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + bw / 2) / bw, 1 - (p.getZ(i) + bd / 2) / bd); g.computeVertexNormals(); return g; };
buildPusher.barMaterials = (THREE, faceTex, env) => [new THREE.MeshStandardMaterial({ map: faceTex, color: faceTex ? 0xf0e2c8 : 0xe0a020, metalness: .5, roughness: .42, envMap: env || null, envMapIntensity: .6 }),
  new THREE.MeshStandardMaterial({ color: 0xb8700c, metalness: .9, roughness: .3, envMap: env || null, envMapIntensity: .8 })];
// a crystal: six-sided, pointed top and bottom (the game's physics uses the same points)
buildPusher.gemGeometry = (THREE, s) => { const p = []; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; p.push([Math.cos(a) * s * .5, 0, Math.sin(a) * s * .5]); } const top = [0, s * .62, 0], bot = [0, -s * .38, 0], tri = [];
  for (let i = 0; i < 6; i++) { const j = (i + 1) % 6; tri.push(...p[j], ...p[i], ...top, ...p[i], ...p[j], ...bot); } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3)); g.computeVertexNormals(); return g; };
