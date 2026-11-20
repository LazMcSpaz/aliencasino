// Wheel of Worlds: the big wheel, used by BOTH the casino floor (lobby) and the game, so it looks the same from outside and from the player's seat.
// A 2 m wheel of 54 segments (each a world, a wormhole or a black hole) in a chrome rim with pegs and chasing bulbs, a gold flapper at the top that ticks
// over the pegs, a glowing hub with the alignment scanner, held up by a sculpted stand with light strips, and a curved sign arching over the top.
// Units are metres; it faces +Z; the floor is y = 0; the wheel's centre is at (0, CY, 0).
// opts: { layout: the 54 segment kinds in order (clockwise from the top), worlds: [{id, mult}], art: { planets: {id: image src} } (optional) }.
// Returns { root, wheel, R, CY, step, setAngle(a), angle, drawFace(boost), update(t), pegClick(cb) }.
// Angles: wheel.rotation.z = a. Segment i sits under the flapper when a ≡ i × step (mod 2π); the wheel turns clockwise as a decreases.
function buildWheel(THREE, opts = {}) {
  const LAY = opts.layout, S = LAY.length, step = Math.PI * 2 / S, MULT = Object.fromEntries((opts.worlds || []).map(w => [w.id, w.mult])), ART = (opts.art && opts.art.planets) || {};
  const R = 1.0, CY = 2.05;
  const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
  const ctex = (c, rep) => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };
  const ENV = buildWheel.env(THREE);
  const std = (color, metalness, roughness, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, envMap: ENV, ...extra });
  const glow = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  const halo = (c, o = .16) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
  const mat = { paint: new THREE.MeshPhysicalMaterial({ color: 0x1c1240, metalness: .4, roughness: .32, clearcoat: 1, clearcoatRoughness: .12, envMap: ENV }),
    dark: std(0x0d0b1a, .5, .45), chrome: std(0xcfd3e6, 1, .14), gold: std(0xffc845, 1, .2, { emissive: 0x6a4000, emissiveIntensity: .3 }), black: std(0x05040a, .3, .6) };
  const add = (parent, geo, m, p = [0, 0, 0], r = [0, 0, 0]) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); o.castShadow = o.receiveShadow = !m.isMeshBasicMaterial && !m.transparent; parent.add(o); return o; };
  const tube = (parent, pts, col, r = .008) => { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); add(parent, new THREE.TubeGeometry(c, 64, r, 8), glow(col)); add(parent, new THREE.TubeGeometry(c, 64, r * 3.2, 8), halo(col)); };
  const root = new THREE.Group(); root.name = "WheelOfWorlds";

  // ---- the stand: two sculpted arms rising from a plinth to hold the axle, glossy paint, light strips up their edges, underglow ----
  { const sh = new THREE.Shape(); sh.moveTo(-.55, 0); sh.lineTo(.55, 0); sh.quadraticCurveTo(.5, .5, .24, .9); sh.lineTo(.16, CY - .05); sh.quadraticCurveTo(0, CY + .14, -.16, CY - .05); sh.lineTo(-.24, .9); sh.quadraticCurveTo(-.5, .5, -.55, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: .16, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 4, curveSegments: 16 }); g.translate(0, 0, -.08);
    add(root, g, mat.paint, [0, 0, -.2]);
    for (const s of [-1, 1]) tube(root, [[s * .57, .1, -.04], [s * .5, .5, -.04], [s * .27, .9, -.04], [s * .19, CY - .1, -.04]], s < 0 ? 0xff4fae : 0x4fe6ff, .007); }
  add(root, new THREE.CylinderGeometry(.85, .95, .14, 48), mat.dark, [0, .07, -.15]);
  add(root, new THREE.CylinderGeometry(.86, .86, .02, 48), mat.chrome, [0, .15, -.15]);
  add(root, new THREE.TorusGeometry(.95, .008, 8, 96), glow(0x7dff9a), [0, .015, -.15], [Math.PI / 2, 0, 0]); add(root, new THREE.TorusGeometry(.95, .03, 8, 96), halo(0x7dff9a), [0, .015, -.15], [Math.PI / 2, 0, 0]);
  add(root, new THREE.CylinderGeometry(.07, .07, .5, 24), mat.chrome, [0, CY, -.1], [Math.PI / 2, 0, 0]);   // the axle
  // a glowing ring behind the wheel
  add(root, new THREE.TorusGeometry(R + .12, .012, 8, 128), glow(0xb48cff), [0, CY, -.12]); add(root, new THREE.TorusGeometry(R + .12, .05, 8, 128), halo(0xb48cff, .12), [0, CY, -.12]);

  // ---- the wheel ----
  const wheel = new THREE.Group(); wheel.name = "Wheel"; wheel.position.set(0, CY, 0); root.add(wheel);
  const [fc, fg] = canvas(2048, 2048), faceTex = ctex(fc);
  add(wheel, new THREE.CylinderGeometry(R, R, .06, 96), mat.dark, [0, 0, -.03], [Math.PI / 2, 0, 0]);
  add(wheel, new THREE.CircleGeometry(R - .025, 128), new THREE.MeshStandardMaterial({ map: faceTex, emissiveMap: faceTex, emissive: 0xffffff, emissiveIntensity: .55, roughness: .45, metalness: .1, envMap: ENV, envMapIntensity: .4 }), [0, 0, .002]);
  add(wheel, new THREE.TorusGeometry(R - .01, .03, 16, 160), mat.chrome);
  add(wheel, new THREE.TorusGeometry(R * .44, .018, 12, 96), mat.chrome, [0, 0, .004]);
  { const pg = new THREE.CylinderGeometry(.011, .011, .07, 10), pm = new THREE.InstancedMesh(pg, mat.chrome, S), M = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    for (let i = 0; i < S; i++) { const a = (i + .5) * step; M.compose(new THREE.Vector3(Math.sin(a) * (R - .055), Math.cos(a) * (R - .055), .035), q, new THREE.Vector3(1, 1, 1)); pm.setMatrixAt(i, M); }
    pm.castShadow = true; wheel.add(pm); }
  // the hub: a chrome dome with a glowing core and the scanner's beam emitter
  add(wheel, new THREE.CylinderGeometry(.2, .24, .07, 48), mat.chrome, [0, 0, .03], [Math.PI / 2, 0, 0]);
  add(wheel, new THREE.SphereGeometry(.15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x4fe6ff, emissive: 0x1a6aff, emissiveIntensity: .8, roughness: .05, clearcoat: 1, transmission: 0, envMap: ENV, toneMapped: false }), [0, 0, .065], [Math.PI / 2, 0, 0]);
  // bulbs round the outside of the rim (they stay still while the wheel turns), and the flapper at the top
  const NB = 48, bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(.022, 12, 8), new THREE.MeshBasicMaterial({ toneMapped: false }), NB);
  { const M = new THREE.Matrix4(); for (let i = 0; i < NB; i++) { const a = i / NB * Math.PI * 2; M.makeTranslation(Math.sin(a) * (R + .065), CY + Math.cos(a) * (R + .065), .02); bulbs.setMatrixAt(i, M); bulbs.setColorAt(i, new THREE.Color(0xffffff)); } root.add(bulbs); }
  add(root, new THREE.TorusGeometry(R + .065, .03, 12, 160), mat.dark, [0, CY, -.005]);
  const flap = new THREE.Group(); flap.position.set(0, CY + R + .1, .07); root.add(flap);
  { const sh = new THREE.Shape(); sh.moveTo(0, -.2); sh.lineTo(.055, -.02); sh.quadraticCurveTo(.06, .05, 0, .06); sh.quadraticCurveTo(-.06, .05, -.055, -.02); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: .02, bevelEnabled: true, bevelThickness: .01, bevelSize: .008, bevelSegments: 3 }); g.translate(0, 0, -.01); add(flap, g, mat.gold);
    add(flap, new THREE.CylinderGeometry(.025, .025, .06, 16), mat.chrome, [0, 0, 0], [Math.PI / 2, 0, 0]); add(flap, new THREE.SphereGeometry(.018, 12, 8), glow(0xff4d6d), [0, -.05, .025]); }
  // ---- the sign: a curved panel arching over the wheel ----
  { const [c, g] = canvas(2048, 256); g.fillStyle = "#0c0820"; g.fillRect(0, 0, 2048, 256); g.textAlign = "center"; g.textBaseline = "middle";
    g.font = '400 150px "Monoton","Bungee",Impact,sans-serif'; g.shadowColor = "#b48cff"; g.shadowBlur = 40; g.fillStyle = "#f2e6ff"; g.fillText("WHEEL", 640, 132);
    g.font = '400 120px "Yellowtail",cursive'; g.shadowColor = "#ffc845"; g.fillStyle = "#fff1dc"; g.fillText("of", 1024, 140);
    g.font = '400 150px "Monoton","Bungee",Impact,sans-serif'; g.shadowColor = "#4fe6ff"; g.fillStyle = "#e6fbff"; g.fillText("WORLDS", 1430, 132); g.shadowBlur = 0;
    const ri = R + .2, ro = R + .5, arcA = 1.5, st = Math.PI / 2 - arcA / 2, sg = new THREE.RingGeometry(ri, ro, 64, 1, st, arcA), p = sg.attributes.position, uv = sg.attributes.uv;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); uv.setXY(i, (st + arcA - Math.atan2(y, x)) / arcA, (Math.hypot(x, y) - ri) / (ro - ri)); }   // the text follows the curve
    add(root, sg, new THREE.MeshBasicMaterial({ map: ctex(c), toneMapped: false }), [0, CY, .03]);
    add(root, new THREE.RingGeometry(ri - .01, ro + .01, 64, 1, st - .01, arcA + .02), mat.dark, [0, CY, .02]);
    for (const r of [ri - .012, ro + .012]) { const t = add(root, new THREE.TorusGeometry(r, .014, 10, 64, arcA + .02), mat.chrome, [0, CY, .03]); t.rotation.z = st - .01; } }
  // ---- the alignment scanner: a beam from the hub to the boosted world, shown while the boost is being picked ----
  const beamPivot = new THREE.Group(); beamPivot.position.z = .04; wheel.add(beamPivot);
  const beam = add(beamPivot, new THREE.PlaneGeometry(.07, R * .55), halo(0xffc845, 0), [0, R * .72, 0]);

  // ---- the face: each wedge coloured by its world, its planet, its multiplier; boosted wedges glow with their boost ----
  const COL = { moon: ["#5d6a88", "#27304a"], red: ["#d8452c", "#5a1410"], ice: ["#3cc8f0", "#0c3a5a"], gas: ["#ff9a2c", "#6a3008"], ring: ["#9a52ff", "#2a0e5a"], earth: ["#2ed58a", "#0a3a4a"], worm: ["#ff4fae", "#2a0430"], hole: ["#1a1426", "#020104"] };
  const imgs = {}; for (const [k, src] of Object.entries(ART)) { const im = new Image(); im.onload = () => drawFace(lastBoost); im.src = src; imgs[k] = im; }
  const planet = (g, kind, x, y, s) => buildWheel.drawPlanet(g, kind, x, y, s, imgs[kind]);
  let lastBoost = null;
  function drawFace(boost) { lastBoost = boost || null; const g = fg, C = 1024, ro = 1000, ri = 450;
    g.fillStyle = "#07051a"; g.fillRect(0, 0, 2048, 2048);
    const sg = g.createRadialGradient(C, C, 0, C, C, ri); sg.addColorStop(0, "#2a1a5a"); sg.addColorStop(1, "#07051a"); g.fillStyle = sg; g.beginPath(); g.arc(C, C, ri, 0, 7); g.fill();
    for (let i = 0; i < 160; i++) { const a = Math.random() * 7, r = Math.random() * ri; g.fillStyle = `rgba(255,255,255,${Math.random() * .7 + .2})`; g.fillRect(C + Math.cos(a) * r, C + Math.sin(a) * r, 2, 2); }
    for (let i = 0; i < S; i++) { const k = LAY[i], a0 = -Math.PI / 2 + (i - .5) * step, a1 = a0 + step, am = (a0 + a1) / 2, [c1, c2] = COL[k], hot = boost && boost.world === k;
      const gr = g.createRadialGradient(C, C, ri, C, C, ro); gr.addColorStop(0, c2); gr.addColorStop(1, c1); g.fillStyle = gr;
      g.beginPath(); g.arc(C, C, ro, a0, a1); g.arc(C, C, ri, a1, a0, true); g.closePath(); g.fill();
      if (hot) { g.save(); g.fillStyle = "#ffc84566"; g.fill(); g.shadowColor = "#ffc845"; g.shadowBlur = 30; g.strokeStyle = "#ffe08a"; g.lineWidth = 14; g.stroke(); g.restore(); }
      g.save(); g.translate(C, C); g.rotate(am + Math.PI / 2);
      planet(g, k, 0, -ro + 92, k === "earth" ? 58 : k === "hole" ? 62 : 52);
      g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "#000"; g.shadowBlur = 10;
      if (MULT[k]) { g.save(); g.translate(0, -ro + 270); g.rotate(-Math.PI / 2); g.font = '400 70px "Bungee",Impact,sans-serif'; g.fillStyle = hot ? "#ffe08a" : "#ffffff"; g.fillText("\u00d7" + MULT[k], 0, 0); g.restore();
        if (hot) { g.save(); g.translate(0, -ro + 430); g.rotate(-Math.PI / 2); g.font = '400 52px "Bungee",Impact,sans-serif'; g.fillStyle = "#ffc845"; g.shadowColor = "#ffc845"; g.shadowBlur = 24; g.fillText("BOOST \u00d7" + boost.mult, 0, 0); g.restore(); } }
      g.restore(); }
    g.strokeStyle = "#ffc845"; g.lineWidth = 5; for (let i = 0; i < S; i++) { const a = -Math.PI / 2 + (i - .5) * step; g.beginPath(); g.moveTo(C + Math.cos(a) * ri, C + Math.sin(a) * ri); g.lineTo(C + Math.cos(a) * ro, C + Math.sin(a) * ro); g.stroke(); }
    g.lineWidth = 8; g.beginPath(); g.arc(C, C, ri, 0, 7); g.stroke();
    faceTex.needsUpdate = true; }
  drawFace(null);

  let angle = 0, lastPeg = 0, onPeg = null, flapV = 0, flapA = 0, prevA = 0;
  const pegIndex = a => Math.floor((a - step / 2) / step);
  function setAngle(a) { angle = a; wheel.rotation.z = a; const p = pegIndex(a); if (p !== lastPeg) { const dir = Math.sign(a - prevA) || -1; flapV += dir * 9; lastPeg = p; if (onPeg) onPeg(); } prevA = a; }
  const BCOL = [0xff4fae, 0xffc845, 0x7dff9a, 0x4fe6ff, 0xb48cff].map(c => new THREE.Color(c)), OFF = new THREE.Color(0x2a2040);
  let mode = "chase", beamT = -1, beamTo = 0;
  // update(t, dt): bulbs, the flapper's spring, the scanner beam. mode: "chase" (idle), "spin" (fast sparkle), "win" (all flashing)
  function update(t, dt = 1 / 60, m) { if (m) mode = m;
    const stp = Math.floor(t * (mode === "spin" ? 18 : 7));
    for (let i = 0; i < NB; i++) { const on = mode === "win" ? stp % 2 === 0 : mode === "spin" ? (i + stp) % 4 === 0 : (i + stp) % 3 === 0; bulbs.setColorAt(i, on ? BCOL[(i + (mode === "win" ? stp : 0)) % 5] : OFF); }
    bulbs.instanceColor.needsUpdate = true;
    flapV += (-flapA * 160 - flapV * 9) * dt; flapA += flapV * dt; flapA = Math.max(-.7, Math.min(.7, flapA)); flap.rotation.z = flapA;
    if (beamT >= 0) { beamT += dt; const k = Math.min(1, beamT / 1.6); beamPivot.rotation.z = beamTo * k + (1 - k) * (beamTo + Math.PI * 4) ; beam.material.opacity = beamT < 2.4 ? .7 : Math.max(0, .7 - (beamT - 2.4) * 1.5); if (beamT > 3) beamT = -1; }
    if (opts.idle) setAngle(angle - dt * .25); }
  // point the scanner beam at segment i (in the wheel's own frame) — it sweeps round twice and settles
  function scan(i) { beamTo = -i * step; beamT = 0; }
  return { root, wheel, R, CY, step, S, setAngle, get angle() { return angle; }, drawFace, update, scan, pegClick(cb) { onPeg = cb; } };
}
// the reflection map for the metal (the same dark room with light panels as Star Dozer's)
buildWheel.env = THREE => { if (typeof buildPusher !== "undefined" && buildPusher.env) return buildPusher.env(THREE); if (buildWheel._env) return buildWheel._env;
  const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#1a1630"); gr.addColorStop(.5, "#0b0918"); gr.addColorStop(1, "#040308"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  const soft = (x, y, w, h, col, a) => { g.globalAlpha = a; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 20; g.fillRect(x, y, w, h); g.globalAlpha = 1; g.shadowBlur = 0; };
  soft(40, 30, 90, 36, "#c8c8dc", .7); soft(300, 24, 120, 30, "#d8ccb8", .6); soft(200, 100, 18, 60, "#ff4fae", .8); soft(420, 100, 18, 60, "#4fe6ff", .8); soft(0, 140, 512, 4, "#b48cff", .4); soft(100, 120, 40, 14, "#ffc845", .5);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding; return buildWheel._env = t; };
// a world's picture: the art if there is any, otherwise drawn in code (also used by the game's betting tiles)
buildWheel.drawPlanet = (g, kind, x, y, s, im) => {
    if (im && im.complete && im.naturalWidth) { g.drawImage(im, x - s, y - s, s * 2, s * 2); return; }
    g.save(); g.translate(x, y);
    if (kind === "hole") { const gr = g.createRadialGradient(0, 0, s * .2, 0, 0, s); gr.addColorStop(0, "#000"); gr.addColorStop(.55, "#000"); gr.addColorStop(.7, "#ff9a3a"); gr.addColorStop(.8, "#b4407a"); gr.addColorStop(1, "#b4407a00"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, s, 0, 7); g.fill(); g.restore(); return; }
    if (kind === "worm") { for (let i = 0; i < 5; i++) { g.strokeStyle = ["#ff4fae", "#b48cff", "#4fe6ff", "#ffffff", "#ff4fae"][i]; g.lineWidth = s * .12; g.beginPath(); for (let a = 0; a < 9; a += .2) { const r = s * (1 - a / 9) ; g.lineTo(Math.cos(a + i * 1.25) * r, Math.sin(a + i * 1.25) * r); } g.stroke(); } g.restore(); return; }
    const [a, b] = { moon: ["#c8d0e0", "#5a6276"], red: ["#ff8a5a", "#8a2410"], ice: ["#e6fbff", "#3a8ac8"], gas: ["#ffd08a", "#c85a10"], ring: ["#d0a8ff", "#5a24a8"], earth: ["#5ab4ff", "#0a3a8a"] }[kind];
    if (kind === "ring") { g.strokeStyle = "#ffc845"; g.lineWidth = s * .14; g.beginPath(); g.ellipse(0, 0, s * 1.5, s * .38, -.35, Math.PI, 2 * Math.PI); g.stroke(); }
    const gr = g.createRadialGradient(-s * .35, -s * .35, s * .1, 0, 0, s); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, s, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(0, 0, s, 0, 7); g.clip();
    if (kind === "moon") { g.fillStyle = "#00000033"; for (const [cx, cy, r] of [[-.3, .2, .25], [.35, -.1, .18], [.1, .5, .14], [-.1, -.45, .12]]) { g.beginPath(); g.arc(cx * s, cy * s, r * s, 0, 7); g.fill(); } }
    if (kind === "red") { g.fillStyle = "#5a141066"; g.beginPath(); g.ellipse(s * .1, s * .2, s * .6, s * .18, .3, 0, 7); g.fill(); g.fillStyle = "#fff4"; g.beginPath(); g.ellipse(0, -s * .85, s * .4, s * .15, 0, 0, 7); g.fill(); }
    if (kind === "ice") { g.strokeStyle = "#ffffffaa"; g.lineWidth = s * .05; g.beginPath(); g.moveTo(-s * .6, -s * .2); g.lineTo(-s * .1, s * .1); g.lineTo(s * .2, -s * .4); g.moveTo(-s * .1, s * .1); g.lineTo(s * .1, s * .6); g.stroke(); }
    if (kind === "gas") { for (let i = -3; i <= 3; i++) { g.fillStyle = i % 2 ? "#8a3a0855" : "#ffe0b055"; g.fillRect(-s, i * s * .28 - s * .08, s * 2, s * .16); } g.fillStyle = "#a8301899"; g.beginPath(); g.ellipse(s * .3, s * .25, s * .22, s * .12, 0, 0, 7); g.fill(); }
    if (kind === "earth") { g.fillStyle = "#3ac86a"; for (const [cx, cy, rx, ry] of [[-.3, -.2, .35, .25], [.35, .3, .3, .35], [.2, -.55, .2, .12]]) { g.beginPath(); g.ellipse(cx * s, cy * s, rx * s, ry * s, .4, 0, 7); g.fill(); } g.fillStyle = "#ffffffaa"; g.beginPath(); g.ellipse(-s * .1, s * .1, s * .5, s * .08, -.3, 0, 7); g.fill(); }
    g.restore();
    if (kind === "ring") { g.strokeStyle = "#ffc845"; g.lineWidth = s * .14; g.beginPath(); g.ellipse(0, 0, s * 1.5, s * .38, -.35, 0, Math.PI); g.stroke(); }
    g.fillStyle = "#ffffff55"; g.beginPath(); g.ellipse(-s * .4, -s * .45, s * .25, s * .14, -.7, 0, 7); g.fill();
    g.restore(); };
