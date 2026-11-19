// Star Dozer coin pusher cabinet: a base with a lit front and a winnings chute full of coins, a glass case on top holding the tray
// (a heap of coins, a couple of gold bars and a toy saucer on it), the pusher block sliding back and forth at the back with coins riding on it,
// and a marquee with chasing lights. Units are metres; it faces +Z (players stand in front); the floor is y = 0.
// Node names: StarDozer, Base, Chute, Case, Tray, Pusher, Marquee. update(t) slides the pusher and runs the lights.
function buildPusher(THREE, opts = {}) {
  const std = (color, metalness, roughness, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  const mat = { shell: std(0x2c2b34, .55, .38), dark: std(0x15121f, .45, .45), trim: std(0xffc845, .85, .28), chrome: std(0x8d8aa0, .9, .25),
    gold: std(0xffc845, .9, .3), silver: std(0xd8dce8, .9, .28), tray: std(0x1a1240, .3, .5, { emissive: 0x2a1a5a, emissiveIntensity: .4 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xbfefff, metalness: 0, roughness: .05, transparent: true, opacity: .14, depthWrite: false }),
    neon: new THREE.MeshBasicMaterial({ color: 0x8dff6a }), pink: new THREE.MeshBasicMaterial({ color: 0xff5fae }), cyan: new THREE.MeshBasicMaterial({ color: 0x5fe8ff }) };
  const add = (parent, geo, m, p = [0, 0, 0], r = [0, 0, 0], name) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); o.castShadow = o.receiveShadow = m !== mat.glass; if (name) o.name = name; parent.add(o); return o; };
  const grp = (parent, name, p = [0, 0, 0]) => { const g = new THREE.Group(); g.name = name; g.position.set(...p); parent.add(g); return g; };
  const ctex = c => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; };
  const root = new THREE.Group(); root.name = "StarDozer";
  const BW = 1.3, BD = 1.1, BH = .92, CH = .95;                 // width, depth, base height, glass case height

  // ---- base: shell, lit front panel, gold trim, a chute at the front full of winnings ----
  const base = grp(root, "Base");
  add(base, new THREE.BoxGeometry(BW, BH, BD), mat.shell, [0, BH / 2, 0]);
  const [fc, fg] = (() => { const c = document.createElement("canvas"); c.width = 512; c.height = 256; return [c, c.getContext("2d")]; })();
  const gr = fg.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, "#8dff6a"); gr.addColorStop(.5, "#5fe8ff"); gr.addColorStop(1, "#b48cff");
  fg.fillStyle = "#0a0716"; fg.fillRect(0, 0, 512, 256); fg.fillStyle = gr; for (let i = 0; i < 12; i++) fg.fillRect(20 + i * 40, 150, 24, 80);
  fg.font = '400 54px "Bungee",Impact,sans-serif'; fg.textAlign = "center"; fg.fillStyle = "#fff"; fg.fillText("PUSH YOUR LUCK", 256, 90);
  add(base, new THREE.PlaneGeometry(BW * .86, BH * .42), new THREE.MeshBasicMaterial({ map: ctex(fc) }), [0, BH * .3, BD / 2 + .002]);
  for (const y of [BH - .01, .02]) add(base, new THREE.BoxGeometry(BW + .02, .025, BD + .02), mat.trim, [0, y, 0]);
  const chute = grp(base, "Chute", [0, BH * .62, BD / 2 - .12]);
  add(chute, new THREE.BoxGeometry(BW * .8, .14, .28), mat.dark, [0, 0, 0]); add(chute, new THREE.BoxGeometry(BW * .82, .02, .02), mat.neon, [0, .075, .14]);
  // ---- coins: two batches (gold and silver), heaped on the tray, in the chute and on the pusher ----
  const coinGeo = new THREE.CylinderGeometry(.032, .032, .009, 18), heap = { gold: [], silver: [] };
  const coin = (x, y, z, tilt = 0) => heap[Math.random() < .35 ? "gold" : "silver"].push([x, y, z, tilt]);
  for (let i = 0; i < 26; i++) coin(chute.position.x + (Math.random() - .5) * BW * .7, chute.position.y + .075 + Math.random() * .02, chute.position.z + (Math.random() - .5) * .2, (Math.random() - .5) * .8);
  // ---- glass case on top ----
  const cs = grp(root, "Case", [0, BH, 0]);
  for (const x of [-BW / 2 + .03, BW / 2 - .03]) for (const z of [-BD / 2 + .03, BD / 2 - .03]) add(cs, new THREE.BoxGeometry(.05, CH, .05), mat.chrome, [x, CH / 2, z]);
  add(cs, new THREE.BoxGeometry(BW, .04, BD), mat.shell, [0, CH, 0]);
  add(cs, new THREE.PlaneGeometry(BW - .06, CH), mat.glass, [0, CH / 2, BD / 2 - .03]); for (const s of [-1, 1]) add(cs, new THREE.PlaneGeometry(BD - .06, CH), mat.glass, [s * (BW / 2 - .03), CH / 2, 0], [0, s * Math.PI / 2, 0]);
  add(cs, new THREE.PlaneGeometry(BW - .06, CH), mat.dark, [0, CH / 2, -BD / 2 + .04]);
  for (const [y, m] of [[CH - .02, mat.neon], [.03, mat.cyan]]) add(cs, new THREE.BoxGeometry(BW - .04, .015, .015), m, [0, y, BD / 2 - .02]);
  add(cs, new THREE.BoxGeometry(BW - .2, .03, .06), mat.dark, [0, CH - .12, -BD / 2 + .16]); add(cs, new THREE.BoxGeometry(BW - .2, .006, .062), mat.pink, [0, CH - .135, -BD / 2 + .16]);   // the drop rail
  // ---- the tray inside, with its heap of coins and prizes ----
  const tray = grp(cs, "Tray", [0, .1, 0]); const TD = BD - .14, TZ0 = -TD / 2, TZ1 = TD / 2;   // tray depth and its back / front edge
  add(tray, new THREE.BoxGeometry(BW - .1, .03, TD), mat.tray, [0, 0, 0]);
  add(tray, new THREE.BoxGeometry(BW - .1, .01, .02), mat.neon, [0, .02, TZ1 - .01]);
  for (let row = 0; row < 9; row++) for (let i = 0; i < 16; i++) { const x = -BW / 2 + .1 + i * .072 + (row % 2) * .036, z = TZ0 + .36 + row * .062; if (x > BW / 2 - .08 || z > TZ1 - .02 || Math.random() < .08) continue;
    coin(x + (Math.random() - .5) * .01, cs.position.y + tray.position.y + .02 + (Math.random() < .25 ? .01 : 0), z, (Math.random() - .5) * .15); }
  const barGeo = new THREE.BoxGeometry(.12, .04, .06); for (const [x, z, ry] of [[-.25, .12, .3], [.2, .3, -.4]]) add(tray, barGeo, mat.gold, [x, .045, z], [0, ry, 0]);
  const ufo = grp(tray, "Saucer", [.05, .045, -.02]); add(ufo, new THREE.CylinderGeometry(.075, .085, .025, 20), mat.chrome); add(ufo, new THREE.SphereGeometry(.04, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8fe8ff, transparent: true, opacity: .7 }), [0, .01, 0]);
  // ---- the pusher block, sliding at the back, coins riding on it ----
  const pusher = grp(tray, "Pusher", [0, 0, 0]);
  add(pusher, new THREE.BoxGeometry(BW - .12, .09, .34), mat.chrome, [0, .06, TZ0 + .17]); add(pusher, new THREE.BoxGeometry(BW - .12, .012, .012), mat.cyan, [0, .1, TZ0 + .34]);
  const ride = []; for (let i = 0; i < 12; i++) ride.push([-BW / 2 + .14 + Math.random() * (BW - .28), .11, TZ0 + .04 + Math.random() * .26]);
  for (const [k, list] of Object.entries(heap)) { const im = new THREE.InstancedMesh(coinGeo, mat[k], list.length), M = new THREE.Matrix4(), q = new THREE.Quaternion();
    list.forEach(([x, y, z, tilt], i) => { q.setFromEuler(new THREE.Euler(tilt, Math.random() * 6, 0)); M.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, M); }); im.castShadow = im.receiveShadow = true; root.add(im); }
  { const im = new THREE.InstancedMesh(coinGeo, mat.gold, ride.length), M = new THREE.Matrix4(); ride.forEach(([x, y, z], i) => { M.makeTranslation(x, y, z); im.setMatrixAt(i, M); }); pusher.add(im); }
  // ---- the marquee with chasing lights ----
  const mq = grp(root, "Marquee", [0, BH + CH + .2, .06]);
  add(mq, new THREE.BoxGeometry(BW + .04, .38, .3), mat.shell);
  const [mc, mg] = (() => { const c = document.createElement("canvas"); c.width = 1024; c.height = 320; return [c, c.getContext("2d")]; })();
  mg.fillStyle = "#120b26"; mg.fillRect(0, 0, 1024, 320); mg.font = '400 150px "Monoton","Bungee",Impact,sans-serif'; mg.textAlign = "center"; mg.textBaseline = "middle"; mg.shadowColor = "#ff7a3a"; mg.shadowBlur = 30; mg.fillStyle = "#fff1dc"; mg.fillText("STAR", 512, 120);
  mg.font = '400 110px "Yellowtail",cursive'; mg.shadowColor = "#5fe8ff"; mg.fillStyle = "#e6fbff"; mg.fillText("Dozer", 600, 245);
  add(mq, new THREE.PlaneGeometry(BW * .92, .3), new THREE.MeshBasicMaterial({ map: ctex(mc) }), [0, 0, .152]);
  const bulbs = [], bulbGeo = new THREE.SphereGeometry(.018, 8, 6), COLS = [0xff5fae, 0xffc845, 0x8dff6a, 0x5fe8ff];
  for (let i = 0; i < 22; i++) { const x = -BW / 2 + .02 + i * (BW - .04) / 21; for (const y of [.205, -.205]) { const b = add(mq, bulbGeo, new THREE.MeshBasicMaterial({ color: COLS[i % 4] }), [x, y, .13]); b.castShadow = false; bulbs.push({ b, i, col: new THREE.Color(COLS[i % 4]) }); } }
  const off = new THREE.Color(0x2a2040);
  function update(t) { const k = .5 - .5 * Math.cos(2 * Math.PI * t / 3.4); pusher.position.z = k * .2; ufo.rotation.y = t * .3;
    const step = Math.floor(t * 8); bulbs.forEach(o => o.b.material.color.copy((o.i + step) % 3 === 0 ? o.col : off)); }
  return { root, clips: [], height: BH + CH + .4, update };
}
