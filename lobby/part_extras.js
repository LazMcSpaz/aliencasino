// The casino's life and decoration: the front lounge (DJ stage with an LED wall, a light-up dance floor, booths, a statue),
// a jackpot board and game screens on the walls, plants and hanging planets, and the alien patrons who wander, dance and drink.
// The aliens, plants, planets and statue are free CC0 models by Quaternius (Ultimate Space Kit, Ultimate Modular Sci-Fi), in assets/.
// May use: the lobby's scene, ctex, updates, mixers, pickables, walkers/placeWalker, and Music (for the beat). Must not: open games or touch the wallet.
const EXTRAS = (() => {
  const M = (o) => new THREE.MeshStandardMaterial(o), B = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
  const mat = { dark: M({ color: 0x15121f, metalness: .5, roughness: .4 }), shell: M({ color: 0x2c2b34, metalness: .55, roughness: .38 }), gold: M({ color: 0xffc845, metalness: .85, roughness: .28 }),
    plush: M({ color: 0x7a2a8a, roughness: .8 }), plush2: M({ color: 0x4a1f6a, roughness: .85 }), chrome: M({ color: 0x8d8aa0, metalness: .9, roughness: .25 }),
    pink: B(0xff5fae), cyan: B(0x5fe8ff), violet: B(0xb48cff), black: M({ color: 0x08060e, roughness: .3, metalness: .2 }) };
  const add = (parent, geo, m, p = [0, 0, 0], r = [0, 0, 0], shadow = true) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); o.castShadow = o.receiveShadow = shadow; parent.add(o); return o; };
  const grp = (p = [0, 0, 0], ry = 0) => { const g = new THREE.Group(); g.position.set(...p); g.rotation.y = ry; scene.add(g); return g; };
  const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
  const live = (c) => { const t = ctex(c); return t; };   // a canvas texture we redraw

  // ---- the DJ stage, against the left wall at the front: platform, booth with spinning decks, speakers that thump, an LED wall ----
  function stage() {
    const g = grp([-RX + 1.1, 0, 17.5]);   // centre of the platform
    add(g, new THREE.BoxGeometry(2.2, .35, 3.6), mat.dark, [0, .175, 0]);
    add(g, new THREE.BoxGeometry(.02, .05, 3.6), mat.cyan, [1.105, .3, 0], [0, 0, 0], false); add(g, new THREE.BoxGeometry(2.2, .05, .02), mat.pink, [0, .3, 1.805], [0, 0, 0], false); add(g, new THREE.BoxGeometry(2.2, .05, .02), mat.pink, [0, .3, -1.805], [0, 0, 0], false);
    // the booth: front panel lit with a gradient, two decks on top
    const [bc, bg] = canvas(256, 128), gr = bg.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, "#ff5fae"); gr.addColorStop(.5, "#b48cff"); gr.addColorStop(1, "#5fe8ff"); bg.fillStyle = "#0a0716"; bg.fillRect(0, 0, 256, 128);
    bg.fillStyle = gr; for (let i = 0; i < 9; i++) bg.fillRect(12 + i * 26, 30, 16, 68); bg.font = '400 22px "Bungee",Impact,sans-serif'; bg.textAlign = "center"; bg.fillStyle = "#fff"; bg.fillText("DJ ZORP", 128, 120);
    const booth = new THREE.Group(); booth.position.set(.55, .35, 0); g.add(booth);
    add(booth, new THREE.BoxGeometry(.6, 1.0, 1.6), mat.shell, [0, .5, 0]); add(booth, new THREE.PlaneGeometry(1.6, .8), new THREE.MeshBasicMaterial({ map: ctex(bc) }), [.301, .5, 0], [0, Math.PI / 2, 0], false);
    add(booth, new THREE.BoxGeometry(.66, .04, 1.7), mat.black, [0, 1.02, 0]);
    // a riser box behind the booth for the DJ to stand on, so it shows above the decks
    add(g, new THREE.BoxGeometry(.75, .32, .85), mat.shell, [-.45, .51, 0]); add(g, new THREE.BoxGeometry(.77, .02, .87), mat.cyan, [-.45, .68, 0], [0, 0, 0], false);
    const decks = [-.42, .42].map(z => { add(booth, new THREE.CylinderGeometry(.2, .2, .03, 24), mat.chrome, [-.02, 1.055, z]); const rec = add(booth, new THREE.CylinderGeometry(.17, .17, .012, 24), mat.black, [-.02, 1.075, z]);
      add(rec, new THREE.CylinderGeometry(.05, .05, .014, 16), mat.pink, [0, .002, 0], [0, 0, 0], false); add(rec, new THREE.BoxGeometry(.1, .016, .01), mat.cyan, [.06, .002, 0], [0, 0, 0], false); return rec; });
    // speakers either side, cones that thump on the beat
    const cones = [];
    for (const z of [-1.5, 1.5]) { const s = new THREE.Group(); s.position.set(.65, .35, z); g.add(s); add(s, new THREE.BoxGeometry(.5, 1.5, .55), mat.black, [0, .75, 0]);
      for (const [y, r] of [[1.15, .14], [.55, .2]]) { add(s, new THREE.TorusGeometry(r + .02, .015, 6, 24), mat.violet, [.26, y, 0], [0, Math.PI / 2, 0], false); const c = add(s, new THREE.ConeGeometry(r, .08, 24, 1, true), mat.shell, [.24, y, 0], [0, 0, -Math.PI / 2]); cones.push(c); } }
    // the LED wall behind: an equaliser and rings, redrawn to the beat
    const [lc, lg] = canvas(512, 300), led = live(lc), panel = add(scene, new THREE.PlaneGeometry(4.6, 2.7), new THREE.MeshBasicMaterial({ map: led }), [-RX + .04, 3.0, 17.5], [0, Math.PI / 2, 0], false);
    add(scene, new THREE.BoxGeometry(.06, 2.84, 4.74), mat.dark, [-RX + .01, 3.0, 17.5]); add(scene, new THREE.BoxGeometry(.02, 2.86, .03), mat.cyan, [-RX + .05, 3.0, 15.14], [0, 0, 0], false); add(scene, new THREE.BoxGeometry(.02, 2.86, .03), mat.cyan, [-RX + .05, 3.0, 19.86], [0, 0, 0], false);
    const light = new THREE.PointLight(0xb48cff, 1.2, 7, 2); light.position.set(-RX + 2.4, 3.6, 17.5); scene.add(light);
    const hues = [300, 190, 270, 330, 170]; let lastDraw = 0, heights = new Array(24).fill(0);
    updates.push(t => { const p = Music.pulse(), bar = Music.bar(); decks.forEach(d => d.rotation.y -= .06); cones.forEach(c => c.scale.set(1, 1 + p * .5, 1));
      light.intensity = .8 + p * 1.4; light.color.setHSL(hues[bar % hues.length] / 360, .8, .6);
      if (t - lastDraw < 1 / 24) return; lastDraw = t; const h = hues[bar % hues.length];
      lg.fillStyle = "#07040f"; lg.fillRect(0, 0, 512, 300);
      for (let i = 0; i < 5; i++) { lg.strokeStyle = `hsla(${h + i * 20},90%,65%,${(.6 - i * .1) * (.4 + p)})`; lg.lineWidth = 6; lg.beginPath(); lg.arc(256, 130, 30 + i * 32 + p * 18, 0, 7); lg.stroke(); }
      heights = heights.map((v, i) => Math.max(v * .86, (Math.sin(t * 3 + i * .7) * .5 + .5) * p * (.5 + Math.random() * .5)));
      heights.forEach((v, i) => { const x = 16 + i * 20.3, hh = 12 + v * 130; lg.fillStyle = `hsl(${h + i * 4},90%,${55 + v * 20}%)`; for (let y = 0; y < hh; y += 10) lg.fillRect(x, 292 - y - 8, 15, 7); });
      lg.font = '400 34px "Monoton","Bungee",sans-serif'; lg.textAlign = "center"; lg.fillStyle = `hsl(${h},90%,85%)`; lg.shadowColor = `hsl(${h},90%,60%)`; lg.shadowBlur = 20; lg.fillText("ALIEN FM", 256, 142); lg.shadowBlur = 0;
      led.needsUpdate = true; });
  }

  // ---- a dance floor of light-up tiles in front of the stage ----
  function danceFloor() {
    const C = 9, R = 7, S = .62, x0 = -8.75, z0 = 15.55, geo = new THREE.BoxGeometry(S - .05, .03, S - .05), im = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff }), C * R), m4 = new THREE.Matrix4();
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { m4.makeTranslation(x0 + c * S, .016, z0 + r * S); im.setMatrixAt(r * C + c, m4); }
    add(scene, new THREE.BoxGeometry(C * S + .1, .02, R * S + .1), mat.black, [x0 + (C - 1) * S / 2, .01, z0 + (R - 1) * S / 2], [0, 0, 0], false);
    scene.add(im); const col = new THREE.Color(), PAL = [0xff5fae, 0x5fe8ff, 0xb48cff, 0xffc845, 0x8dff6a]; let base = [];
    const repaint = (bar) => { const mode = bar % 4; base = []; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const k = mode === 0 ? (r + c) % 2 * 2 : mode === 1 ? (c + bar) % PAL.length : mode === 2 ? (r + bar) % PAL.length : Math.floor(Math.random() * PAL.length); base.push(PAL[k]); } };
    let lastBeat = -1;
    updates.push(() => { const b = Music.beat(), p = Music.pulse(); if (b !== lastBeat) { lastBeat = b; repaint(Math.floor(b / 4) + b % 4); }
      for (let i = 0; i < C * R; i++) { const r = Math.floor(i / C), c = i % C, wave = .5 + .5 * Math.sin(b * 1.3 + c * .9 - r * .6); im.setColorAt(i, col.setHex(base[i]).multiplyScalar(.18 + .7 * p * wave)); }
      im.instanceColor.needsUpdate = true; });
  }

  // ---- lounge booths along the right wall at the front: curved seats round a lit table ----
  const BOOTHS = [14.2, 16.5, 18.8], TABLES = [[5.2, 15.0], [6.8, 17.4], [4.8, 19.2]];
  function booths() {
    // a curved bench (seat cushion + taller backrest) wrapped round the wall side of a round table, open toward the room
    const sector = (r0, r1, a0, a1) => { const sh = new THREE.Shape(); sh.absarc(0, 0, r1, a0, a1, false); sh.absarc(0, 0, r0, a1, a0, true); sh.closePath(); return sh; };
    const curved = (r0, r1, h, a0, a1, bev) => { const g = new THREE.ExtrudeGeometry(sector(r0, r1, a0, a1), { depth: h, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 32 }); g.rotateX(-Math.PI / 2); return g; };
    const A = Math.PI * .58;   // the bench wraps ±104° round the back (toward the wall, +x)
    for (const z of BOOTHS) { const g = grp([RX - 1.38, 0, z]);
      add(g, curved(.66, 1.02, .36, -A, A, .05), mat.plush, [0, .05, 0]);                         // seat cushion
      add(g, curved(.98, 1.13, .95, -A, A, .04), mat.plush2, [0, .05, 0]);                        // backrest
      add(g, new THREE.TorusGeometry(1.055, .025, 6, 48, 2 * A), mat.gold, [0, 1.06, 0], [Math.PI / 2, 0, -A], false);   // gold piping along the top
      add(g, new THREE.CylinderGeometry(.42, .42, .04, 28), mat.black, [0, .7, 0]); add(g, new THREE.TorusGeometry(.42, .012, 6, 32), mat.cyan, [0, .71, 0], [Math.PI / 2, 0, 0], false);
      add(g, new THREE.CylinderGeometry(.05, .14, .68, 12), mat.chrome, [0, .34, 0]);
      for (const [x, zz, c] of [[-.12, .1, 0xff5fae], [.1, -.14, 0x8dff6a]]) add(g, new THREE.CylinderGeometry(.04, .03, .12, 10), B(c, { transparent: true, opacity: .85 }), [x, .78, zz], [0, 0, 0], false);   // drinks
    }
    // cocktail tables to stand at in the lounge: a chrome post, a lit round top
    for (const [x, z] of TABLES) { const g = grp([x, 0, z]); add(g, new THREE.CylinderGeometry(.05, .2, 1.05, 12), mat.chrome, [0, .525, 0]); add(g, new THREE.CylinderGeometry(.38, .38, .04, 24), mat.black, [0, 1.07, 0]);
      add(g, new THREE.TorusGeometry(.38, .012, 6, 32), mat.pink, [0, 1.08, 0], [Math.PI / 2, 0, 0], false); add(g, new THREE.CylinderGeometry(.04, .03, .12, 10), B(0x5fe8ff, { transparent: true, opacity: .85 }), [.1, 1.15, .05], [0, 0, 0], false); }
  }

  // ---- the jackpot board on the back wall: a big number that keeps climbing ----
  function jackpot() {
    const [c, g] = canvas(1024, 256), tex = live(c);
    for (const x of [-7.6, 7.6]) { add(scene, new THREE.PlaneGeometry(3.6, .9), new THREE.MeshBasicMaterial({ map: tex }), [x, 4.2, -9.95], [0, 0, 0], false);
      add(scene, new THREE.BoxGeometry(3.76, 1.06, .06), mat.dark, [x, 4.2, -9.99]); add(scene, new THREE.BoxGeometry(3.78, .02, .02), mat.gold, [x, 4.73, -9.95], [0, 0, 0], false); add(scene, new THREE.BoxGeometry(3.78, .02, .02), mat.gold, [x, 3.67, -9.95], [0, 0, 0], false); }
    let last = 0; const startAt = 1284500 + Math.floor(Math.random() * 40000);
    updates.push(t => { if (t - last < .2) return; last = t; const v = Math.floor(startAt + t * 23.7);
      g.fillStyle = "#07040f"; g.fillRect(0, 0, 1024, 256); g.textAlign = "center"; g.textBaseline = "middle";
      g.font = '400 46px "Bungee",Impact,sans-serif'; g.fillStyle = "#ffc845"; g.shadowColor = "#ff9a3a"; g.shadowBlur = 18; g.fillText("MEGA JACKPOT", 512, 58); for (const x of [250, 774]) { g.save(); g.translate(x, 56); g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 22, an = i * Math.PI / 5 - Math.PI / 2; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.fill(); g.restore(); }   // stars drawn, not typed (fonts lack the symbol)
      g.font = '400 120px "Share Tech Mono",monospace'; g.fillStyle = Math.floor(t * 2) % 2 ? "#fff6d8" : "#ffe9a8"; g.shadowColor = "#ffc845"; g.shadowBlur = 26; g.fillText(v.toLocaleString("en-US"), 512, 170); g.shadowBlur = 0;
      for (let i = 0; i < 40; i++) { g.fillStyle = (i + Math.floor(t * 8)) % 4 ? "#3a2a10" : "#ffc845"; g.beginPath(); g.arc(14 + i * 25.6, 8, 4, 0, 7); g.fill(); g.beginPath(); g.arc(14 + i * 25.6, 248, 4, 0, 7); g.fill(); }
      tex.needsUpdate = true; });
  }

  // ---- framed screens showing the games, on the side walls ----
  function screens(TX) {
    const screen = (img, p, ry, w, h, col) => { if (!img) return; const t = new THREE.Texture(img); t.encoding = THREE.sRGBEncoding; t.needsUpdate = true;
      const g = grp(p, ry); add(g, new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }), [0, 0, .035], [0, 0, 0], false);
      add(g, new THREE.BoxGeometry(w + .14, h + .14, .05), mat.dark, [0, 0, 0]); const e = B(col); for (const [x, y, ww, hh] of [[0, h / 2 + .07, w + .16, .02], [0, -h / 2 - .07, w + .16, .02], [w / 2 + .07, 0, .02, h + .16], [-w / 2 - .07, 0, .02, h + .16]]) add(g, new THREE.BoxGeometry(ww, hh, .02), e, [x, y, .03], [0, 0, 0], false); };
    const PY = TX.pyramid && TX.pyramid.screen, AS = TX.asteroid && TX.asteroid.screen, WO = TX.warp && TX.warp.orbit, hw = (im, w) => w * im.height / im.width;
    if (PY) { screen(PY, [-RX + .04, 3.4, 1.0], Math.PI / 2, 1.8, hw(PY, 1.8), 0xffc845); screen(PY, [RX - .04, 3.7, 1.9], -Math.PI / 2, 1.5, hw(PY, 1.5), 0xffc845); }
    if (AS) { screen(AS, [-RX + .04, 3.4, 8.2], Math.PI / 2, 1.6, hw(AS, 1.6), 0x5fe8ff); screen(AS, [RX - .04, 3.4, -4.4], -Math.PI / 2, 1.6, hw(AS, 1.6), 0x5fe8ff); screen(AS, [RX - .04, 3.7, 9.1], -Math.PI / 2, 1.3, hw(AS, 1.3), 0x5fe8ff); }
    if (WO) { screen(WO, [RX - .04, 3.2, 16.5], -Math.PI / 2, 3.0, hw(WO, 3.0), 0xff5fae); screen(WO, [-RX + .04, 3.4, -5.2], Math.PI / 2, 2.4, hw(WO, 2.4), 0xff5fae); }
  }

  // ---- planters: a dark pot with a gold rim, a plant goes in later ----
  const POTS = [ { p: [-11.35, 0, -9.35], r: .45, plant: "tree_blob_1", s: .34 }, { p: [11.35, 0, -9.35], r: .45, plant: "tree_blob_1", s: .3, ry: 2 },
    { p: [-11.4, 0, -5.4], r: .35, plant: "plant_3", s: .4 }, { p: [11.4, 0, -.4], r: .35, plant: "tree_light_1", s: .42 }, { p: [11.35, 0, 11.8], r: .4, plant: "tree_light_1", s: .45, ry: 1 },
    { p: [-11.4, 0, 10.2], r: .35, plant: "plant_1", s: .42 }, { p: [-11.3, 0, 13.4], r: .45, plant: "tree_spiral_1", s: .34 },
    { p: [-2.9, 0, 7.75], r: .32, plant: "bush_1", s: .2 }, { p: [2.9, 0, 7.75], r: .32, plant: "bush_1", s: .2, ry: 1.5 },
    { p: [-2.4, 0, 20.3], r: .5, plant: "tree_floating_1", s: .55 }, { p: [2.4, 0, 20.3], r: .5, plant: "tree_floating_1", s: .55, ry: 2 },
    { p: [-11.3, 0, 20.4], r: .45, plant: "plant_3", s: .45 }, { p: [11.3, 0, 20.4], r: .45, plant: "tree_spiral_1", s: .32 } ];
  function planters() { for (const o of POTS) { const g = grp(o.p); add(g, new THREE.CylinderGeometry(o.r, o.r * .78, .55, 20), mat.dark, [0, .275, 0]); add(g, new THREE.TorusGeometry(o.r, .025, 6, 24), mat.gold, [0, .55, 0], [Math.PI / 2, 0, 0], false); o.g = g; } }

  // ---- a ceiling for walking around: dark panels with little lights. It only faces down, so from the bird's-eye view above it isn't drawn ----
  function ceiling() { const [c, g] = canvas(512, 512); g.fillStyle = "#0c0820"; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "#1c1440"; g.lineWidth = 4; for (let i = 0; i <= 512; i += 128) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
    for (let i = 0; i < 90; i++) { const x = Math.random() * 512, y = Math.random() * 512, r = Math.random() < .15 ? 3 : 1.5; g.fillStyle = ["#ffffff", "#bfefff", "#ffd8f0", "#e8dcff"][i % 4]; g.globalAlpha = .5 + Math.random() * .5; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } g.globalAlpha = 1;
    for (const [x, y] of [[64, 64], [320, 320]]) { g.strokeStyle = "#5fe8ff99"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 40, 0, 7); g.stroke(); g.strokeStyle = "#b48cff88"; g.beginPath(); g.arc(x, y, 50, 0, 7); g.stroke(); }
    const t = ctex(c, [6, 8]), back = ZC - RD / 2, front = ZF, len = front - back;
    add(scene, new THREE.PlaneGeometry(RW, len), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .28, roughness: .9 }), [0, WH, (back + front) / 2], [Math.PI / 2, 0, 0], false); }

  // ---- the edge of the room at the front: a neon line on the floor ----
  // the front wall, with the airlock you came in through. Everything here faces into the room only, so from the bird's-eye view outside it isn't drawn
  function frontEdge() { const [c, g] = canvas(512, 640);
    g.fillStyle = "#14101f"; g.fillRect(0, 0, 512, 640); g.fillStyle = "#1e1830"; g.fillRect(40, 40, 432, 600);
    for (let i = 0; i < 2; i++) { const x = 56 + i * 204; g.fillStyle = "#2c2b34"; g.fillRect(x, 56, 196, 584); g.fillStyle = "#3a3846"; g.fillRect(x + 12, 70, 172, 560);
      g.fillStyle = "#ffc845"; for (let y = 300; y < 380; y += 26) { g.beginPath(); const d = i ? -1 : 1; g.moveTo(x + 98 - d * 50, y); g.lineTo(x + 98 + d * 10, y + 12); g.lineTo(x + 98 - d * 50, y + 24); g.lineTo(x + 98 - d * 38, y + 24); g.lineTo(x + 98 + d * 22, y + 12); g.lineTo(x + 98 - d * 38, y); g.fill(); } }   // hazard chevrons pointing at the seam
    g.fillStyle = "#5fe8ff"; g.fillRect(253, 56, 6, 584); g.font = '400 54px "Bungee",Impact,sans-serif'; g.textAlign = "center"; g.fillStyle = "#ff5fae"; g.shadowColor = "#ff5fae"; g.shadowBlur = 16; g.fillText("AIRLOCK", 256, 210); g.shadowBlur = 0;
    g.font = '600 20px "Share Tech Mono",monospace'; g.fillStyle = "#bfefff"; g.fillText("NO EXIT FOR EARTHLINGS", 256, 250);
    const one = (geo, m, p, r = [0, Math.PI, 0]) => { m.side = THREE.FrontSide; return add(scene, geo, m, p, r, false); };
    const wm = new THREE.MeshStandardMaterial({ color: 0x241c3c, roughness: .7, metalness: .2 });
    one(new THREE.PlaneGeometry(RW, WH), wm, [0, WH / 2, ZF]);
    one(new THREE.PlaneGeometry(2.4, 3.0), new THREE.MeshBasicMaterial({ map: ctex(c) }), [0, 1.5, ZF - .02]);
    for (const [w, h, x, y, col] of [[2.6, .05, 0, 3.05, 0x5fe8ff], [.05, 3.05, -1.25, 1.52, 0x5fe8ff], [.05, 3.05, 1.25, 1.52, 0x5fe8ff], [RW, .06, 0, .25, 0xb48cff], [RW, .06, 0, WH - .4, 0xb48cff]]) one(new THREE.PlaneGeometry(w, h), B(col), [x, y, ZF - .03]);
    const l = new THREE.PointLight(0x5fe8ff, .8, 5, 2); l.position.set(0, 3.2, ZF - .8); scene.add(l); }

  // ---- loading the CC0 models ----
  // each model is published as base64 text (the artifact host doesn't serve .glb files); build.py writes assets/<name>.b64.txt
  function loadGLB(name) { return fetch("assets/" + name + ".b64.txt").then(r => { if (!r.ok) throw new Error(name + " " + r.status); return r.text(); })
    .then(txt => { const bin = atob(txt.trim()), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }).then(buf => new Promise((res, rej) => {
    // the page may not fetch blob: URLs, so make the loader decode textures through <img> instead of fetch
    const cib = window.createImageBitmap; try { window.createImageBitmap = undefined; } catch (e) {}
    try { new THREE.GLTFLoader().parse(buf, "", res, rej); } finally { try { window.createImageBitmap = cib; } catch (e) {} } })); }
  // recolour a model's texture by turning the hue wheel (keeps whites and darks as they are)
  const tintCache = new Map();
  function tinted(src, deg) { if (!deg) return null; const key = src.uuid + deg; if (tintCache.has(key)) return tintCache.get(key);
    const m = src.clone(), im = src.map && src.map.image; if (im) { const w = im.width || im.naturalWidth, h = im.height || im.naturalHeight, [c, g] = canvas(w, h); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, w, h), px = d.data, a = deg * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
      const k = [.213 + cs * .787 - sn * .213, .715 - cs * .715 - sn * .715, .072 - cs * .072 + sn * .928, .213 - cs * .213 + sn * .143, .715 + cs * .285 + sn * .14, .072 - cs * .072 - sn * .283, .213 - cs * .213 - sn * .787, .715 - cs * .715 + sn * .715, .072 + cs * .928 + sn * .072];
      for (let i = 0; i < px.length; i += 4) { const r = px[i], gg = px[i + 1], b = px[i + 2]; px[i] = k[0] * r + k[1] * gg + k[2] * b; px[i + 1] = k[3] * r + k[4] * gg + k[5] * b; px[i + 2] = k[6] * r + k[7] * gg + k[8] * b; }
      g.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); for (const p of ["encoding", "flipY", "wrapS", "wrapT", "magFilter", "minFilter"]) t[p] = src.map[p]; m.map = t; }
    tintCache.set(key, m); return m; }

  // ---- the alien patrons ----
  const aliens = [];
  function alien(src, { scale, hue = 0, pos, ry = 0, anim, base }) {
    const r = THREE.SkeletonUtils.clone(src.scene); r.scale.setScalar(scale);
    r.traverse(o => { if (o.isMesh) { const t = tinted(o.material, hue); if (t) o.material = t; o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
    const holder = grp(pos || [0, 0, 0], ry); holder.add(r); const mx = new THREE.AnimationMixer(r); mixers.push(mx);
    const a = { holder, root: r, mx, cur: null, base: base || anim, busy: false,
      play(n, fade = .35, once = false) { const clip = src.animations.find(c => c.name === n); if (!clip) return 0; const act = mx.clipAction(clip); if (a.cur === act && !once) return clip.duration;
        act.reset(); act.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); act.clampWhenFinished = once; act.fadeIn(fade).play(); if (a.cur && a.cur !== act) a.cur.fadeOut(fade); a.cur = act; return clip.duration; },
      // tapped: a wave (or a happy nod for the floating ones), then back to what it was doing
      react() { if (a.busy) return; a.busy = true; if (a.walker) a.walker.paused = true; const d = a.play(src.animations.some(c => c.name === "Wave") ? "Wave" : "Yes", .2, true);
        setTimeout(() => { a.busy = false; a.play(a.base); if (a.walker) a.walker.paused = false; }, (d || 1.5) * 1000); } };
    a.play(anim); mx.update(Math.random() * 3);
    r.traverse(o => { if (o.isMesh) { o.userData.alien = a; pickables.push(o); } });
    aliens.push(a); return a; }

  async function life() {
    const names = ["enemy_large", "enemy_small", "enemy_extrasmall", "enemy_flying", "plant_1", "plant_3", "bush_1", "tree_floating_1", "tree_light_1", "tree_blob_1", "tree_spiral_1", "planet_1", "planet_2", "planet_5", "planet_9", "props_statue"];
    const got = {}; await Promise.all(names.map(n => loadGLB(n).then(g => got[n] = g).catch(e => console.warn("model", n, e))));
    const place = (n, p, s, ry = 0) => { if (!got[n]) return null; const o = got[n].scene.clone(true); o.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } }); o.scale.setScalar(s); o.position.set(...p); o.rotation.y = ry; scene.add(o); return o; };
    // plants into their pots
    POTS.forEach(o => place(o.plant, [o.p[0], .5, o.p[2]], o.s, o.ry || 0));
    // planets hanging high along the walls, slowly turning
    const planets = [["planet_2", [-10.6, 4.9, -8.6], .2], ["planet_9", [-3.8, 5.0, -9.3], .14], ["planet_1", [3.8, 4.9, -9.3], .17], ["planet_5", [10.6, 4.8, -8.4], .17], ["planet_9", [-10.9, 4.9, 2.4], .14],
      ["planet_1", [10.9, 5.0, -2.6], .15], ["planet_5", [-10.9, 4.8, 12.6], .15], ["planet_2", [10.9, 4.9, 12.4], .14], ["planet_9", [0, 5.0, 19.8], .18]]
      .map(([n, p, s]) => { const o = place(n, p, s); if (o) { const cord = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, WH - p[1]), mat.chrome); cord.position.set(p[0], (WH + p[1]) / 2 + .2, p[2]); scene.add(cord); } return o; }).filter(Boolean);
    updates.push(t => planets.forEach((o, i) => { o.rotation.y = t * (.15 + i * .04); o.position.y += Math.sin(t * .8 + i) * .0008; }));
    // the statue in the lounge, with a gold bar turning over it
    if (place("props_statue", [0, 0, 16], .55)) { const bar = new THREE.Group(); bar.position.set(0, 2.05, 16); scene.add(bar);
      add(bar, new THREE.BoxGeometry(.42, .16, .2), mat.gold, [0, 0, 0]); add(bar, new THREE.TorusGeometry(.4, .012, 6, 40), mat.cyan, [0, 0, 0], [Math.PI / 2, 0, 0], false);
      const l = new THREE.PointLight(0xffc845, .9, 4, 2); l.position.set(0, 2.6, 16); scene.add(l); updates.push(t => { bar.rotation.y = t * 1.2; bar.position.y = 2.05 + Math.sin(t * 2) * .06; }); }
    // walking, dancing, drinking aliens (the green "big alien", tinted to different colours)
    const L = got.enemy_large, SC = .41;
    if (L) {
      const walk = (path, speed, hue) => { const a = alien(L, { scale: SC, hue, anim: "Walk" }); const w = { holder: a.holder, path, seg: 0, k: Math.random(), speed, paused: false }; walkers.push(w); a.walker = w; placeWalker(w, 0); a.mx.timeScale = speed / .5; return a; };
      walk([[-1.7, 19.4], [-1.7, -2.9], [1.7, -2.9], [1.7, 19.4]], .5, 0);                    // up and down the centre aisle
      walk([[2.3, -2.9], [6.8, -2.9], [6.8, .5], [2.3, .5]], .45, 285);                          // round the right Twin Moons table
      walk([[-2.3, -2.9], [-2.3, .5], [-6.8, .5], [-6.8, -2.9]], .4, 45);                        // round the left one
      walk([[-9, 7.75], [9, 7.75]], .45, 140);                                                   // across the room between the banks
      walk([[3.2, 13.9], [8.4, 13.9], [8.4, 20.2], [3.2, 20.2]], .42, 210);                      // round the lounge
      alien(L, { scale: SC, hue: 200, pos: [-RX + .65, .67, 17.5], ry: Math.PI / 2, anim: "Yes" });          // the DJ on its riser, nodding along
      const dancers = [[-7.9, 16.2, 35], [-5.8, 17.2, 160], [-7.2, 18.9, 300], [-4.6, 16.0, 110], [-4.3, 18.6, 250], [-6.3, 19.6, 75]]
        .map(([x, z, hue], i) => alien(L, { scale: SC, hue, pos: [x, 0, z], ry: -Math.PI / 2 + (i % 3 - 1) * .4, anim: ["Yes", "Jump_Idle", "Wave", "Yes", "Jump_Idle", "Yes"][i] }));
      const MOVES = ["Yes", "Jump_Idle", "Yes", "Wave", "Jump_Idle"]; let lastBar = -1;
      updates.push(() => { const b = Music.bar(); if (b === lastBar || b % 2) return; lastBar = b; dancers.forEach((d, i) => { if (!d.busy) { d.base = MOVES[(b / 2 + i * 2) % MOVES.length]; d.play(d.base, .4); } }); });
      for (const [z, hue] of [[2.0, 100], [5.9, 330], [9.0, 20]]) alien(L, { scale: SC, hue, pos: [RX - 1.95, 0, z], ry: Math.PI / 2 + (z % 2 - .5) * .4, anim: "Idle" });   // at the bar
      alien(L, { scale: SC, hue: 250, pos: [2.9, 0, -3.5], ry: Math.PI - .4, anim: "Idle" });          // watching the drone launch
      alien(L, { scale: SC, hue: 60, pos: [-5.3, 0, -4.4], ry: -2.4, anim: "Idle" });                  // at the Gravity Wells
      alien(L, { scale: SC, hue: 170, pos: [5.3, 0, -4.4], ry: 2.4, anim: "Idle" });
      alien(L, { scale: SC, hue: 300, pos: [-4.6, 0, .35], ry: Math.PI, anim: "Idle" });               // at the Twin Moons tables
      alien(L, { scale: SC, hue: 15, pos: [6.55, 0, -1.2], ry: -Math.PI / 2, anim: "Idle" });
      for (const [x, z, hue, ry] of [[5.2, 15.65, 120, Math.PI], [7.45, 17.4, 270, -Math.PI / 2], [4.8, 18.55, 40, 0]]) alien(L, { scale: SC, hue, pos: [x, 0, z], ry, anim: "Idle" });   // at the cocktail tables
    }
    // floating blob aliens: bobbing over the dance floor, by a booth, and one drifting round the whole room up high
    const floaters = [];
    const float = (src, o) => { if (!src) return; const a = alien(src, { scale: o.s, hue: o.hue, pos: [0, 0, 0], anim: "Flying_Idle" }); floaters.push({ a, ...o }); };
    float(got.enemy_small, { s: .3, hue: 0, c: [-6.1, 1.9, 17.6], r: 1.4, w: .5, ph: 0 });                 // over the dance floor
    float(got.enemy_extrasmall, { s: .34, hue: 230, c: [-6.1, 2.4, 17.6], r: 1.0, w: -.6, ph: 2 });
    float(got.enemy_flying, { s: .26, hue: 120, c: [-6.1, 2.15, 17.6], r: 2.0, w: .35, ph: 4 });
    float(got.enemy_flying, { s: .26, hue: 25, c: [RX - 1.38, 1.2, 14.2], r: .12, w: .4, ph: 1 });           // over the booth tables
    float(got.enemy_small, { s: .28, hue: 320, c: [RX - 1.38, 1.25, 18.8], r: .12, w: -.4, ph: 3 });
    float(got.enemy_extrasmall, { s: .3, hue: 300, c: [RX - .45, 1.7, 3.0], r: .3, w: .5, ph: 4 });          // behind the bar
    float(got.enemy_small, { s: .3, hue: 175, c: [0, 3.6, 6], r: 6.5, w: .1, ph: 3, rz: 1.4 });              // drifting round the room up high
    float(got.enemy_flying, { s: .24, hue: 200, c: [0, 3.3, -3.4], r: 3.6, w: -.14, ph: 1 });
    updates.push(t => floaters.forEach(f => { if (f.a.busy) return; const ang = f.ph + t * f.w, x = f.c[0] + Math.cos(ang) * f.r, z = f.c[2] + Math.sin(ang) * f.r * (f.rz || 1);
      const y = f.c[1] + Math.sin(t * 1.7 + f.ph) * .08; const h = f.a.holder; h.position.set(x, y, z); h.rotation.y = Math.atan2(-Math.sin(ang) * Math.sign(f.w), Math.cos(ang) * Math.sign(f.w) * (f.rz || 1)); }));
  }

  // footprints the first-person walker can't pass through: [x0, z0, x1, z1]
  // (worked out when asked: this file runs before the room's size is known)
  function obstacles() { const o = [[-RX, 15.7, -RX + 2.2, 19.3], [-.45, 15.55, .45, 16.45]];
    BOOTHS.forEach(z => o.push([RX - 2.55, z - 1.15, RX, z + 1.15])); TABLES.forEach(([x, z]) => o.push([x - .4, z - .4, x + .4, z + .4]));
    POTS.forEach(q => o.push([q.p[0] - q.r, q.p[2] - q.r, q.p[0] + q.r, q.p[2] + q.r])); return o; }
  return { build(TX) { stage(); danceFloor(); booths(); jackpot(); screens(TX); planters(); frontEdge(); ceiling(); return life(); }, aliens, get obstacles() { return obstacles(); } };
})();
