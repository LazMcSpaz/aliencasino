// Star Dozer coin pusher cabinet, matching the game: a base with a lit front and a chute of winnings, a glass case holding the tray (a heap of gold bars,
// the casino's currency, with glowing crystals on it), the diamond-plate pusher sliding at the back under a starfield "drop zone" panel, a chrome-framed
// marquee with chasing bulbs and Zib's lookout screen, and a spinning gold star on top. Units are metres; it faces +Z (players stand in front); the floor is y = 0.
// opts.tex: { bar: the bar's face image, zib: Zib's head } (optional; plain gold and no face without them).
// Node names: StarDozer, Base, Chute, Case, Tray, Pusher, Marquee, Star. update(t) slides the pusher, spins the star and runs the lights.
function buildPusher(THREE, opts = {}) {
  const T = opts.tex || {};
  const std = (color, metalness, roughness, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  const glow = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  const ctex = (c, rep) => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };
  const itex = (src, rep) => { if (!src) return null; const t = new THREE.TextureLoader().load(src); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };
  const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
  const mat = { shell: std(0x241c44, .55, .38), dark: std(0x110d22, .45, .5), chrome: std(0x8a88a0, .95, .24), trim: std(0xffc845, .85, .28),
    glass: new THREE.MeshStandardMaterial({ color: 0xbfefff, metalness: 0, roughness: .05, transparent: true, opacity: .12, depthWrite: false }),
    green: glow(0x8dff6a), pink: glow(0xff5fae), cyan: glow(0x5fe8ff), red: glow(0xff4d6d) };
  const add = (parent, geo, m, p = [0, 0, 0], r = [0, 0, 0], name) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); o.castShadow = o.receiveShadow = !(m.transparent || m.isMeshBasicMaterial); if (name) o.name = name; parent.add(o); return o; };
  const grp = (parent, name, p = [0, 0, 0]) => { const g = new THREE.Group(); g.name = name; g.position.set(...p); parent.add(g); return g; };
  const root = new THREE.Group(); root.name = "StarDozer";
  const BW = 1.3, BD = 1.1, BH = .92, CH = .95;                 // width, depth, base height, glass case height

  // ---- base: shell, a lit front with the bar and crystals on it, neon tubes up the front corners, a chute full of winnings ----
  const base = grp(root, "Base");
  add(base, new THREE.BoxGeometry(BW, BH, BD), mat.shell, [0, BH / 2, 0]);
  add(base, new THREE.BoxGeometry(BW + .04, .06, BD + .04), mat.dark, [0, .03, 0]);                         // kick plate
  { const [c, g] = canvas(512, 256), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#1a0f3a"); gr.addColorStop(1, "#05040f"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .6 + .1})`; g.fillRect(Math.random() * 512, Math.random() * 256, 2, 2); }
    g.textAlign = "center"; g.font = '400 50px "Bungee",Impact,sans-serif'; g.shadowColor = "#ffc845"; g.shadowBlur = 18; g.fillStyle = "#fff1dc"; g.fillText("PUSH YOUR LUCK", 256, 78);
    const gem = (x, col, s) => { g.save(); g.translate(x, 170); g.shadowColor = col; g.shadowBlur = 16; g.fillStyle = col; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * .8, -s * .25); g.lineTo(s * .5, s * .8); g.lineTo(-s * .5, s * .8); g.lineTo(-s * .8, -s * .25); g.closePath(); g.fill();
      g.fillStyle = "#ffffff99"; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * .3, -s * .25); g.lineTo(-s * .3, -s * .25); g.fill(); g.restore(); };
    [["#5fe8ff", 22], ["#b48cff", 26], ["#ff5fae", 30], ["#ffc845", 36], ["#ff5fae", 30], ["#b48cff", 26], ["#5fe8ff", 22]].forEach(([col, s], i) => gem(76 + i * 60, col, s));
    add(base, new THREE.PlaneGeometry(BW * .86, BH * .42), new THREE.MeshBasicMaterial({ map: ctex(c), toneMapped: false, color: 0xdddddd }), [0, BH * .3, BD / 2 + .002]); }
  for (const s of [-1, 1]) { add(base, new THREE.CylinderGeometry(.012, .012, BH - .1, 10), s < 0 ? mat.pink : mat.cyan, [s * (BW / 2 - .02), BH / 2 + .02, BD / 2 + .01]);
    add(base, new THREE.BoxGeometry(.05, BH - .06, .03), mat.chrome, [s * (BW / 2 - .02), BH / 2 + .03, BD / 2 - .01]); }
  add(base, new THREE.BoxGeometry(BW + .02, .03, BD + .02), mat.chrome, [0, BH - .015, 0]);
  const chute = grp(base, "Chute", [0, BH * .62, BD / 2 - .1]);
  add(chute, new THREE.BoxGeometry(BW * .8, .14, .3), mat.dark); add(chute, new THREE.BoxGeometry(BW * .82, .02, .02), mat.green, [0, .075, .15]);
  add(chute, new THREE.BoxGeometry(BW * .78, .01, .26), std(0x2a1f50, .3, .6, { emissive: 0x3a2a7a, emissiveIntensity: .5 }), [0, .02, 0]);

  // ---- gold bars: the same shape as the game's (a plaque with cut corners), the bar picture on top, deep gold edges ----
  const BAR = [.11, .022, .066];
  const barGeo = (() => { const [bw, bh, bd] = BAR, r = .012, sh = new THREE.Shape(), x = -bw / 2, y = -bd / 2;
    sh.moveTo(x + r, y); sh.lineTo(x + bw - r, y); sh.lineTo(x + bw, y + r); sh.lineTo(x + bw, y + bd - r); sh.lineTo(x + bw - r, y + bd); sh.lineTo(x + r, y + bd); sh.lineTo(x, y + bd - r); sh.lineTo(x, y + r); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: bh - .004, bevelEnabled: true, bevelThickness: .002, bevelSize: .002, bevelSegments: 1 }); g.rotateX(-Math.PI / 2); g.translate(0, -bh / 2 + .002, 0);
    const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + bw / 2) / bw, 1 - (p.getZ(i) + bd / 2) / bd); return g; })();
  const barMats = [std(T.bar ? 0xffffff : 0xe0a020, .45, .4, { map: itex(T.bar) || null, emissive: 0x4a2c00, emissiveIntensity: .6 }), std(0xb8700c, .9, .3)];
  const heap = [];
  const bar = (x, y, z, ry, tilt = 0) => heap.push([x, y, z, ry, tilt]);
  for (let i = 0; i < 22; i++) bar((Math.random() - .5) * BW * .68, BH * .62 + .085 + Math.random() * .015, BD / 2 - .1 + (Math.random() - .5) * .18, Math.random() * 6, (Math.random() - .5) * .6);

  // ---- glass case on top: chrome posts, glass, neon along the top edges, pillars at the back with glowing tubes ----
  const cs = grp(root, "Case", [0, BH, 0]);
  for (const x of [-BW / 2 + .03, BW / 2 - .03]) for (const z of [-BD / 2 + .03, BD / 2 - .03]) add(cs, new THREE.BoxGeometry(.05, CH, .05), mat.chrome, [x, CH / 2, z]);
  add(cs, new THREE.BoxGeometry(BW, .05, BD), mat.shell, [0, CH, 0]);
  add(cs, new THREE.PlaneGeometry(BW - .06, CH), mat.glass, [0, CH / 2, BD / 2 - .03]); for (const s of [-1, 1]) add(cs, new THREE.PlaneGeometry(BD - .06, CH), mat.glass, [s * (BW / 2 - .03), CH / 2, 0], [0, s * Math.PI / 2, 0]);
  for (const s of [-1, 1]) { add(cs, new THREE.BoxGeometry(.012, .012, BD - .06), s < 0 ? mat.pink : mat.cyan, [s * (BW / 2 - .03), CH - .03, 0]);
    add(cs, new THREE.BoxGeometry(.09, CH, .12), std(0x15102e, .5, .45), [s * (BW / 2 - .08), CH / 2, -BD / 2 + .1]);
    add(cs, new THREE.CylinderGeometry(.01, .01, CH - .08, 10), s < 0 ? mat.pink : mat.cyan, [s * (BW / 2 - .12), CH / 2, -BD / 2 + .165]); }
  add(cs, new THREE.BoxGeometry(BW - .04, .015, .015), mat.green, [0, .03, BD / 2 - .02]);
  // the back wall: a starfield "drop zone" panel with green chevrons pointing down at the pusher
  { const [c, g] = canvas(1024, 512), gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#1a0f3a"); gr.addColorStop(1, "#07051a"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .7 + .1})`; g.beginPath(); g.arc(Math.random() * 1024, Math.random() * 512, Math.random() < .08 ? 2.4 : 1.1, 0, 7); g.fill(); }
    const pl = g.createRadialGradient(180, 200, 10, 200, 220, 100); pl.addColorStop(0, "#ffb070"); pl.addColorStop(.6, "#c8486a"); pl.addColorStop(1, "#2a0f3a"); g.fillStyle = pl; g.beginPath(); g.arc(200, 220, 90, 0, 7); g.fill();
    g.strokeStyle = "#ffc84588"; g.lineWidth = 6; g.beginPath(); g.ellipse(200, 220, 150, 28, -.25, 0, 7); g.stroke();
    const p2 = g.createRadialGradient(850, 140, 4, 860, 150, 50); p2.addColorStop(0, "#c8fbff"); p2.addColorStop(1, "#1e5aa8"); g.fillStyle = p2; g.beginPath(); g.arc(860, 150, 46, 0, 7); g.fill();
    g.lineWidth = 12; g.lineJoin = "round"; g.shadowColor = "#7dff9a"; g.shadowBlur = 16; for (let i = 0; i < 5; i++) { g.strokeStyle = `rgba(125,255,154,${.25 + i * .17})`; const y = 120 + i * 56; g.beginPath(); g.moveTo(432, y); g.lineTo(512, y + 36); g.lineTo(592, y); g.stroke(); }
    g.font = '400 44px "Bungee",Impact,sans-serif'; g.textAlign = "center"; g.fillStyle = "#7dff9a"; g.fillText("DROP ZONE", 512, 470); g.shadowBlur = 0;
    add(cs, new THREE.PlaneGeometry(BW - .26, CH - .12), new THREE.MeshBasicMaterial({ map: ctex(c), toneMapped: false, color: 0xbbbbbb }), [0, CH / 2 + .02, -BD / 2 + .045]); }
  add(cs, new THREE.BoxGeometry(BW - .2, .03, .06), mat.dark, [0, CH - .12, -BD / 2 + .16]); add(cs, new THREE.BoxGeometry(BW - .2, .006, .062), mat.pink, [0, CH - .135, -BD / 2 + .16]);   // the drop rail

  // ---- the tray inside: a dark violet grid plate, green lip at the front, red gutters at the corners ----
  const tray = grp(cs, "Tray", [0, .1, 0]); const TD = BD - .14, TZ0 = -TD / 2, TZ1 = TD / 2, TW = BW - .26;
  { const [c, g] = canvas(256, 256); g.fillStyle = "#140c30"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#5fe8ff33"; g.lineWidth = 2; for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
    add(tray, new THREE.BoxGeometry(BW - .1, .03, TD), std(0xffffff, .2, .7, { map: ctex(c, [5, 4]) })); }
  add(tray, new THREE.BoxGeometry(TW * .82, .01, .02), mat.green, [0, .02, TZ1 - .01]);
  for (const s of [-1, 1]) add(tray, new THREE.BoxGeometry(TW * .09, .01, .02), mat.red, [s * TW * .455, .02, TZ1 - .01]);
  for (let row = 0; row < 7; row++) for (let i = 0; i < 9; i++) { const x = -TW / 2 + .07 + i * .123 + (row % 2) * .06, z = TZ0 + .4 + row * .08; if (x > TW / 2 - .05 || z > TZ1 - .03 || Math.random() < .1) continue;
    bar(x + (Math.random() - .5) * .015, BH + .1 + .027, z, (Math.random() - .5) * .5); if (Math.random() < .3) bar(x + (Math.random() - .5) * .04, BH + .1 + .05, z + (Math.random() - .5) * .03, Math.random() * 6, (Math.random() - .5) * .3); }
  // crystals: six-sided gems, pointed top and bottom, glowing
  const gemGeo = s => { const p = []; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; p.push([Math.cos(a) * s * .5, 0, Math.sin(a) * s * .5]); } const top = [0, s * .62, 0], bot = [0, -s * .38, 0], tri = [];
    for (let i = 0; i < 6; i++) { const j = (i + 1) % 6; tri.push(...p[j], ...p[i], ...top, ...p[i], ...p[j], ...bot); } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3)); g.computeVertexNormals(); return g; };
  const gems = []; for (const [x, z, c, e, s] of [[.05, .08, 0x1478e8, 0x0636a8, .1], [-.32, .3, 0xf02080, 0xa00848, .11], [.36, .02, 0x8a3df0, 0x4a12b0, .1], [-.1, .36, 0xffa800, 0xc06a00, .13]]) {
    const gm = add(tray, gemGeo(s), new THREE.MeshPhysicalMaterial({ color: c, emissive: e, emissiveIntensity: .5, roughness: .06, clearcoat: 1, flatShading: true, toneMapped: false }), [x, .07, z]); gems.push(gm); }

  // ---- the pusher: diamond-plate chrome on top, hazard stripes on its face, a lit strip along the front edge; bars riding on it ----
  const pusher = grp(tray, "Pusher");
  { const [c, g] = canvas(256, 256); g.fillStyle = "#6a6880"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#9896ae"; g.strokeStyle = "#3a384c"; g.lineWidth = 2;
    for (let y = 0; y < 256; y += 32) for (let x = (y / 32 % 2) * 16; x < 256; x += 32) { g.save(); g.translate(x + 8, y + 8); g.rotate(y / 32 % 2 ? .7 : -.7); g.beginPath(); g.ellipse(0, 0, 11, 3.5, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
    const [hc, hg] = canvas(512, 32); hg.fillStyle = "#14101e"; hg.fillRect(0, 0, 512, 32); hg.fillStyle = "#ffc845"; for (let x = -32; x < 512; x += 32) { hg.beginPath(); hg.moveTo(x, 32); hg.lineTo(x + 16, 0); hg.lineTo(x + 32, 0); hg.lineTo(x + 16, 32); hg.fill(); }
    const side = std(0x4a4860, .85, .38), top = std(0xffffff, .85, .36, { map: ctex(c, [8, 3]) }), front = std(0xffffff, .3, .5, { map: ctex(hc, [3, 1]) });
    add(pusher, new THREE.BoxGeometry(BW - .12, .09, .34), [side, side, top, side, front, side], [0, .06, TZ0 + .17]); add(pusher, new THREE.BoxGeometry(BW - .12, .012, .012), mat.cyan, [0, .1, TZ0 + .34]); }
  const ride = []; for (let i = 0; i < 9; i++) ride.push([-BW / 2 + .14 + Math.random() * (BW - .28), .118, TZ0 + .05 + Math.random() * .24, Math.random() * 6]);
  const placeBars = (list, parent, yOff = 0) => { const im = new THREE.InstancedMesh(barGeo, barMats, list.length), Mx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    list.forEach(([x, y, z, ry, tilt = 0], i) => { q.setFromEuler(e.set(tilt, ry, 0)); Mx.compose(new THREE.Vector3(x, y + yOff, z), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, Mx); }); im.castShadow = im.receiveShadow = true; parent.add(im); return im; };
  placeBars(heap, root); placeBars(ride, pusher);

  // ---- the marquee: chrome frame, the name on the left, Zib's lookout screen on the right, chasing bulbs ----
  const mq = grp(root, "Marquee", [0, BH + CH + .23, .04]);
  add(mq, new THREE.BoxGeometry(BW + .06, .44, .3), mat.shell);
  for (const y of [.225, -.225]) add(mq, new THREE.BoxGeometry(BW + .1, .035, .32), mat.chrome, [0, y, 0]);
  for (const s of [-1, 1]) add(mq, new THREE.BoxGeometry(.035, .48, .32), mat.chrome, [s * (BW / 2 + .045), 0, 0]);
  const [mc, mg] = canvas(1024, 320); mg.fillStyle = "#120b26"; mg.fillRect(0, 0, 1024, 320); mg.textAlign = "center"; mg.textBaseline = "middle";
  mg.font = '400 130px "Monoton","Bungee",Impact,sans-serif'; mg.shadowColor = "#ff7a3a"; mg.shadowBlur = 30; mg.fillStyle = "#fff1dc"; mg.fillText("STAR", 330, 118);
  mg.font = '400 104px "Yellowtail",cursive'; mg.shadowColor = "#5fe8ff"; mg.fillStyle = "#e6fbff"; mg.fillText("Dozer", 470, 235); mg.shadowBlur = 0;
  mg.fillStyle = "#05060f"; mg.fillRect(682, 30, 316, 260); mg.strokeStyle = "#8d8aa0"; mg.lineWidth = 5; mg.strokeRect(682, 30, 316, 260);
  const sg = mg.createLinearGradient(0, 40, 0, 280); sg.addColorStop(0, "#7dff9a44"); sg.addColorStop(1, "#7dff9a10"); mg.fillStyle = sg; mg.fillRect(690, 38, 300, 244);
  mg.fillStyle = "#7dff9a1c"; for (let y = 38; y < 282; y += 6) mg.fillRect(690, y, 300, 2);
  mg.font = '400 46px "Bungee",Impact,sans-serif'; mg.fillStyle = "#7dff9a"; mg.shadowColor = "#7dff9a"; mg.shadowBlur = 16; mg.fillText("CLEAR!", 840, 240); mg.shadowBlur = 0;
  const mqTex = ctex(mc);
  if (T.zib) { const im = new Image(); im.onload = () => { const fh = 150, fw = fh * im.naturalWidth / im.naturalHeight; mg.save(); mg.shadowColor = "#7dff9a"; mg.shadowBlur = 18; mg.drawImage(im, 840 - fw / 2, 48, fw, fh); mg.restore(); mqTex.needsUpdate = true; }; im.src = T.zib; }
  add(mq, new THREE.PlaneGeometry(BW * .94, .36), new THREE.MeshBasicMaterial({ map: mqTex, toneMapped: false }), [0, 0, .152]);
  const bulbs = [], bulbGeo = new THREE.SphereGeometry(.018, 8, 6), COLS = [0xff5fae, 0xffc845, 0x8dff6a, 0x5fe8ff];
  for (let i = 0; i < 24; i++) { const x = -BW / 2 + .01 + i * (BW - .02) / 23; for (const y of [.226, -.226]) { const b = add(mq, bulbGeo, new THREE.MeshBasicMaterial({ color: COLS[i % 4], toneMapped: false }), [x, y, .17]); bulbs.push({ b, i, col: new THREE.Color(COLS[i % 4]) }); } }
  // ---- the topper: a gold five-pointed star on a chrome stalk, spinning slowly ----
  const star = grp(root, "Star", [0, BH + CH + .58, .04]);
  add(star, new THREE.CylinderGeometry(.015, .03, .14, 10), mat.chrome, [0, -.07, 0]);
  { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .07 : .17; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: .03, bevelEnabled: true, bevelThickness: .015, bevelSize: .012, bevelSegments: 2 }); g.translate(0, 0, -.015);
    add(star, g, std(0xffc845, .9, .25, { emissive: 0xffa000, emissiveIntensity: .45 }), [0, .12, 0], [0, 0, 0], "StarShape"); }
  const starShape = star.getObjectByName("StarShape"), off = new THREE.Color(0x2a2040);
  function update(t) { const k = .5 - .5 * Math.cos(2 * Math.PI * t / 3.4); pusher.position.z = k * .2; gems.forEach((g, i) => { g.rotation.y = t * .5 + i; g.position.y = .075 + Math.sin(t * 1.6 + i) * .006; });
    starShape.rotation.y = t * 1.2; const step = Math.floor(t * 8); bulbs.forEach(o => o.b.material.color.copy((o.i + step) % 3 === 0 ? o.col : off)); }
  return { root, clips: [], height: BH + CH + .8, update };
}
