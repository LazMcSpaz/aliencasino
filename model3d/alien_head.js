// The alien patron's head on its own (study pass), built from the character sheet.
// A sculpted skull: wide at the eyes, a pointed chin, cream face that narrows to a peak up the forehead, big slanted teardrop eyes.
// The crest: a dozen fat, flattened lobes that grow from the crown and fall over the sides and back like a bob, tips curling.
// Units are metres; the chin is at the origin; it faces +Z. Node names: Head, Lobe<k>_<j> (crest bones, rest pose = no rotation).
// Clips: Idle (crest drifts, head looks around), Shake (head shakes no, the crest swings and lags behind).
function buildAlienHead(THREE, opts = {}) {
  const PAL = {
    purple: { base: "#8d3fbd", dark: "#4f2388", side: "#c24bbf", cream: "#f6ca98", crest: "#e455c8", crestHi: "#ff8fd8", crestUnder: "#c443b8", crestDark: "#7a34b4", spotA: "#c6e63a", spotB: "#ffd23a", blot: "#9a3fc0" },
    blue:   { base: "#2f7fd0", dark: "#1d4a96", side: "#3a9ee0", cream: "#bfe3ee", crest: "#3fb0e8", crestHi: "#8fe0ff", crestUnder: "#2f8fd0", crestDark: "#244fb0", spotA: "#ffb23a", spotB: "#ffd870", blot: "#2a62c0" },
    orange: { base: "#e8642a", dark: "#b03a3a", side: "#f07a3a", cream: "#ffd38a", crest: "#ff7a4a", crestHi: "#ffb07a", crestUnder: "#e85a4a", crestDark: "#c8305a", spotA: "#ffe36a", spotB: "#ff5fae", blot: "#d04a3a" },
    pale:   { base: "#9aa8c8", dark: "#6a6fa8", side: "#b0bcd8", cream: "#eef0ea", crest: "#c0cce4", crestHi: "#e6eeff", crestUnder: "#a8b2d4", crestDark: "#8a8fc8", spotA: "#b48cff", spotB: "#8fe0c8", blot: "#9a9ad0" } };
  const P = PAL[opts.palette] || PAL.purple;
  let seed = opts.seed || 11; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const C = s => new THREE.Color(s).convertSRGBToLinear();
  const ss = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  // a smooth profile through [height, value] points
  const prof = pts => { const d = new THREE.SplineCurve(pts.map(([y, r]) => new THREE.Vector2(y, r))).getPoints(400);
    return y => { if (y <= d[0].x) return d[0].y; for (let i = 1; i < d.length; i++) if (d[i].x >= y) { const a = d[i - 1], b = d[i], t = (y - a.x) / ((b.x - a.x) || 1); return a.y + (b.y - a.y) * t; } return d[d.length - 1].y; }; };

  const root = new THREE.Group(); root.name = "AlienHead";
  const head = new THREE.Group(); head.name = "Head"; head.position.set(0, .03, -.035); root.add(head);   // pivot at the top of the neck
  const H0 = new THREE.Vector3(0, -.03, .035);                     // offset so the parts below are written with the chin at the origin
  const inHead = o => { o.position.add(H0); head.add(o); return o; };

  // ---- skull: a sphere pushed into shape ring by ring ----
  const H = .36, ZC = -.02;                                         // height chin → crown; the skull's axis sits a little behind the face
  const RX = prof([[0, .01], [.03, .043], [.06, .071], [.09, .095], [.12, .11], [.15, .125], [.18, .131], [.22, .127], [.27, .11], [.32, .072], [.36, .004]]);   // half-width
  const RZF = prof([[0, .012], [.03, .034], [.06, .055], [.1, .072], [.15, .08], [.2, .08], [.26, .07], [.31, .048], [.36, .004]]);                          // front depth
  const RZB = prof([[0, .01], [.04, .028], [.1, .055], [.16, .085], [.23, .108], [.29, .105], [.33, .075], [.36, .004]]);                                        // back depth
  const HW = prof([[-.01, .03], [.04, .075], [.09, .112], [.13, .128], [.17, .126], [.21, .114], [.245, .088], [.275, .05], [.3, .012], [.31, 0]]);                 // half-width of the cream face
  const EYE_Y = .132, EYE_X = .063, TILT = .58;                     // eye centre height, spacing, slant (radians, outer corner up)
  const gauss = (u, v, su, sv) => Math.exp(-((u / su) ** 2 + (v / sv) ** 2));
  const eyeLocal = (x, y, s) => { const u = x - s * EYE_X, v = y - EYE_Y; return [u * s * Math.cos(TILT) + v * Math.sin(TILT), -u * Math.sin(TILT) + v * s * Math.cos(TILT)]; };   // along / across the slanted eye
  const surfZ = (x, y) => { const r = RX(y), cx = Math.min(1, Math.abs(x) / r); return ZC + RZF(y) * Math.sqrt(1 - cx * cx); };
  const blots = []; for (let i = 0; i < 9; i++) blots.push([(rnd() < .5 ? -1 : 1) * (1.5 + rnd() * 1.2), .04 + rnd() * .2, .25 + rnd() * .2, .02 + rnd() * .02]);   // [angle round, height, size round, size up]
  const skullGeo = new THREE.SphereGeometry(1, 112, 80), sp = skullGeo.attributes.position, col = [];
  const cScalp = C(P.crest).lerp(C(P.crestDark), .45), cCream = C(P.cream), cSide = C(P.side), cBase = C(P.base), cDark = C(P.dark), cBlot = C(P.blot), tmp = new THREE.Color();
  for (let i = 0; i < sp.count; i++) {
    const sx = sp.getX(i), sy = sp.getY(i), sz = sp.getZ(i), rr = Math.hypot(sx, sz), cx = rr > 1e-6 ? sx / rr : 0, cz = rr > 1e-6 ? sz / rr : 0;
    const y = (sy + 1) / 2 * H, x = RX(y) * cx; let z = ZC + (cz > 0 ? RZF(y) : RZB(y)) * cz;
    const f = Math.pow(Math.max(0, cz), 1.5); let dz = 0;          // features only on the front
    for (const s of [-1, 1]) { const [a, b] = eyeLocal(x, y, s);
      dz -= .026 * gauss(a, b, .06, .04);                         // eye sockets
      dz += .008 * gauss(x - s * .05, y - EYE_Y - .055, .05, .013);  // brow ridge
      dz += .005 * gauss(x - s * .088, y - EYE_Y + .05, .03, .022); } // cheekbones
    dz += .0055 * Math.exp(-((x / .011) ** 2)) * gauss(0, y - .072, 1, .036);   // nose ridge
    dz += .004 * gauss(x, y - .012, .016, .014);                    // a little chin
    z += dz * f; sp.setXYZ(i, x, y, z);
    // colour: cream face (chin, cheeks, a peak up the forehead), pink-purple sides and top, darker at the back, a few blotches
    const m = ss(-.008, .01, HW(y) - Math.abs(x)) * ss(-.2, .3, cz);
    tmp.copy(cBase).lerp(cSide, ss(.03, .2, y)).lerp(cDark, ss(.2, -.9, cz) * .45).lerp(cScalp, ss(.16, .27, y + (1 - cz) * .03));   // under the crest: crest-coloured
    const ang = Math.atan2(cx, cz); for (const [ba, by, bs, bv] of blots) { let da = Math.abs(ang - ba); da = Math.min(da, Math.PI * 2 - da); tmp.lerp(cBlot, .7 * gauss(da, y - by, bs, bv)); }
    tmp.lerp(cCream, m); col.push(tmp.r, tmp.g, tmp.b); }
  skullGeo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); skullGeo.computeVertexNormals();
  const skinMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .38, clearcoat: .55, clearcoatRoughness: .25 });
  const skull = new THREE.Mesh(skullGeo, skinMat); skull.name = "Skull"; skull.castShadow = skull.receiveShadow = true; inHead(skull);

  // ---- eyes: glossy black teardrops, wide at the outer corner, set into the sockets on the slant ----
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: 0x030205, roughness: .12, metalness: 0, clearcoat: 1, clearcoatRoughness: .04, sheen: .15, sheenColor: new THREE.Color(0x4a2a6a) });
  const glint = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const s of [-1, 1]) { const g = new THREE.SphereGeometry(1, 40, 28), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), k = (x + 1) / 2; const kk = s > 0 ? k : 1 - k; p.setY(i, p.getY(i) * (.55 + .45 * Math.pow(kk, .7))); }   // narrow inner corner, wide outer one
    g.scale(.056, .043, .019); g.computeVertexNormals();
    const e = new THREE.Group(); e.name = "Eye" + (s < 0 ? "R" : "L");   // its own right eye is on −X
    const ex = s * EYE_X, ez = surfZ(ex, EYE_Y), r = RX(EYE_Y), nx = ex / (r * r), nz = (ez - ZC) / (RZF(EYE_Y) ** 2);
    e.position.set(ex, EYE_Y, ez - .026 + .012); e.rotation.set(-.05, Math.atan2(nx, nz) * .8, s * TILT);
    const ball = new THREE.Mesh(g, eyeMat); ball.name = "EyeBall"; e.add(ball);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(.0075, 10, 8), glint); gl.position.set(s * .016, .015, .017); e.add(gl);
    const g2 = new THREE.Mesh(new THREE.SphereGeometry(.0035, 8, 6), glint); g2.position.set(-s * .016, -.008, .014); e.add(g2);
    inHead(e); }
  // mouth: a small downturned line just above the chin
  { const my = .036, mz = surfZ(0, my) - .001; const mc = new THREE.CatmullRomCurve3([[-.014, my - .004], [-.007, my + .0005], [0, my + .001], [.007, my + .0005], [.014, my - .004]].map(([x, y]) => new THREE.Vector3(x, y, mz - Math.abs(x) * .25)));
    const mouth = new THREE.Mesh(new THREE.TubeGeometry(mc, 16, .0016, 6), new THREE.MeshStandardMaterial({ color: 0x3a1a2a, roughness: .6 })); mouth.name = "Mouth"; inHead(mouth); }

  // ---- neck: slender, set back under the skull, cream down the front ----
  { const g = new THREE.CylinderGeometry(.04, .05, .26, 28, 8, true), p = g.attributes.position, c = [];
    for (let i = 0; i < p.count; i++) { const front = p.getZ(i) / .045; tmp.copy(cBase).lerp(cCream, ss(.72, .92, front)); c.push(tmp.r, tmp.g, tmp.b); }
    g.setAttribute("color", new THREE.Float32BufferAttribute(c, 3)); g.computeVertexNormals();
    const neck = new THREE.Mesh(g, skinMat); neck.name = "Neck"; neck.position.set(0, -.05, -.04); neck.rotation.x = .12; root.add(neck); }

  // ---- crest lobes ----
  const rest = {};
  const CC = new THREE.Vector3(0, .1, ZC - .1);                    // low behind the skull: lobes' flat faces look away from here, so the front ones face forward a little
  function lobeTex() { const c = document.createElement("canvas"); c.width = 256; c.height = 512; const g = c.getContext("2d");   // u round the lobe (.25 = top face, .75 = underside), v along it (canvas bottom = root)
    const gu = g.createLinearGradient(0, 0, 256, 0); gu.addColorStop(0, P.crest); gu.addColorStop(.25, P.crestHi); gu.addColorStop(.5, P.crest); gu.addColorStop(.75, P.crestUnder); gu.addColorStop(1, P.crest);
    g.fillStyle = gu; g.fillRect(0, 0, 256, 512);
    const gv = g.createLinearGradient(0, 512, 0, 0); gv.addColorStop(0, P.crestDark); gv.addColorStop(.22, "rgba(0,0,0,0)"); g.globalAlpha = .55; g.fillStyle = gv; g.fillRect(0, 0, 256, 512); g.globalAlpha = 1;
    for (let i = 0; i < 4; i++) { const y = 470 - (100 + i * 95 + rnd() * 30), x = 40 + rnd() * 50, rx = 14 + rnd() * 8 - i * 2, ry = rx * (2.2 + rnd() * .8);
      g.fillStyle = [P.spotA, P.spotA, P.spotB][i % 3]; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
      if (i % 2) { g.globalAlpha = .85; g.beginPath(); g.ellipse(x + 128, y - 40, rx * .7, ry * .7, 0, 0, 7); g.fill(); g.globalAlpha = 1; } }   // fewer, smaller on the underside
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
  // each lobe follows hand-placed points (head space, chin at the origin): root inside the skull → sweeping back and out → a curl at the tip
  const lobePath = L => L.pts.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const lobeMat = new THREE.MeshPhysicalMaterial({ map: lobeTex(), roughness: .32, clearcoat: .6, clearcoatRoughness: .2, side: THREE.DoubleSide });
  const K = 8, lobes = [];
  function lobe(name, L) {
    const NS = 80, NR = 16, pts = new THREE.CatmullRomCurve3(lobePath(L), false, "centripetal").getSpacedPoints(NS);
    const T = pts.map((p, i) => pts[Math.min(NS, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize());
    // frames carried along the path without twisting, starting with the flat face looking away from the skull
    const N = [], B = []; const n = pts[0].clone().sub(CC); n.addScaledVector(T[0], -n.dot(T[0])).normalize();
    for (let i = 0; i <= NS; i++) { if (i) { n.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(T[i - 1], T[i])); n.addScaledVector(T[i], -n.dot(T[i])).normalize(); }
      N.push(n.clone()); B.push(new THREE.Vector3().crossVectors(T[i], n).normalize()); }
    const wid = t => L.w * (1 + .4 * Math.sin(Math.PI * Math.min(1, t * 1.25))) * (1 - .82 * Math.pow(t, 1.7)) * (t > .95 ? Math.sqrt(Math.max(0, 1 - ((t - .95) / .05) ** 2)) : 1);
    const pos = [], uv = [], idx = [], si = [], sw = [];
    for (let i = 0; i <= NS; i++) { const t = i / NS, w = wid(t) / 2, h = w * (L.flat || .45), f = Math.min(K - 1e-6, t * K), b = Math.floor(f), fr = f - b, bw = fr > .5 && b < K - 1 ? fr - .5 : 0;
      for (let k = 0; k <= NR; k++) { const a = k / NR * Math.PI * 2, v = pts[i].clone().addScaledVector(B[i], Math.cos(a) * w).addScaledVector(N[i], Math.sin(a) * h);
        pos.push(v.x, v.y, v.z); uv.push(k / NR, t); si.push(b, Math.min(K - 1, b + 1), 0, 0); sw.push(1 - bw, bw, 0, 0); } }
    for (let i = 0; i < NS; i++) for (let k = 0; k < NR; k++) { const a = i * (NR + 1) + k, b = a + NR + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setIndex(idx); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4)); g.computeVertexNormals();
    // bones follow the path; rotating one swings everything past it
    const bones = []; for (let j = 0; j < K; j++) { const b = new THREE.Bone(); b.name = `${name}_${j}`; const p = pts[Math.round(j / K * NS)];
      if (j) { b.position.copy(p).sub(pts[Math.round((j - 1) / K * NS)]); bones[j - 1].add(b); } else b.position.copy(p); bones.push(b); rest[b.name] = [0, 0, 0]; }
    const mesh = new THREE.SkinnedMesh(g, lobeMat); mesh.name = name; mesh.add(bones[0]); mesh.bind(new THREE.Skeleton(bones)); mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
    inHead(mesh); lobes.push({ mesh, bones, phi: L.phi }); }
  // the crest grows from the forehead peak, along the top of the skull and down the back of it. Every lobe sweeps back and/or out,
  // so from the front it fans out beside the face, from behind it opens like a flower. Points are for the +X side; pairs are mirrored.
  const CREST = [
    { w: .11, pair: 1, pts: [[.005, .27, .0], [.02, .3, .04], [.08, .325, .04], [.16, .325, .01], [.225, .29, -.03], [.255, .23, -.045], [.25, .175, -.035], [.225, .165, -.02], [.215, .19, -.015]] },   // parted at the forehead, falling to the sides, tips curling beside the eyes
    { w: .12, pair: 1, pts: [[0, .31, .0], [.02, .36, .02], [.08, .42, -.02], [.17, .415, -.08], [.25, .35, -.13], [.275, .29, -.15], [.265, .24, -.14], [.24, .245, -.12], [.24, .275, -.115]] },        // upper sides: the widest part
    { w: .125, pts: [[0, .3, -.04], [0, .36, -.005], [0, .46, -.02], [0, .5, -.11], [0, .49, -.2], [0, .44, -.26], [0, .4, -.25], [0, .405, -.215]] },                                                // top centre: up off the forehead and back
    { w: .11, pair: 1, pts: [[0, .34, -.06], [.03, .41, -.08], [.07, .46, -.14], [.12, .455, -.22], [.17, .39, -.28], [.185, .33, -.29], [.17, .29, -.265], [.155, .305, -.24]] },                    // top back, rising backward
    { w: .1, pair: 1, pts: [[.04, .29, -.1], [.08, .32, -.14], [.15, .33, -.2], [.21, .3, -.24], [.245, .24, -.24], [.245, .19, -.21], [.225, .18, -.185], [.215, .2, -.18]] },                     // back sides
    { w: .12, pts: [[0, .25, -.07], [0, .29, -.115], [0, .35, -.17], [0, .41, -.2], [0, .455, -.225], [0, .47, -.265], [0, .45, -.295], [0, .425, -.285], [0, .43, -.26]] },                                               // centre back
    { w: .1, pair: 1, pts: [[.02, .22, -.07], [.05, .25, -.115], [.1, .285, -.165], [.16, .3, -.2], [.215, .27, -.215], [.235, .215, -.2], [.22, .18, -.18], [.2, .19, -.17], [.2, .215, -.175]] },   // back middle, fanning out
    { w: .085, pair: 1, pts: [[.03, .16, -.07], [.07, .175, -.11], [.13, .175, -.15], [.18, .15, -.17], [.2, .105, -.16], [.19, .07, -.14], [.17, .075, -.125], [.168, .095, -.125]] },                    // low at the back, flaring out over the nape
    { w: .045, pair: 1, flat: .7, pts: [[.09, .17, -.05], [.115, .165, -.04], [.145, .14, -.025], [.162, .095, -.01], [.158, .055, .0], [.14, .043, .0], [.128, .06, -.005], [.135, .078, -.01]] } ];      // small curls beside the jaw
  let k = 0;
  for (const L of CREST) for (const s of (L.pair ? [1, -1] : [1])) { const j = () => s < 0 ? 1 + (rnd() - .5) * .08 : 1;
    lobe("Lobe" + k++, { ...L, w: L.w * j(), pts: L.pts.map(([x, y, z], i) => [x * s * .85 * (i > 2 ? j() : 1), y * (i > 2 ? j() : 1), z]) }); }

  // ---- animation ----
  const TAU = Math.PI * 2, Q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray();
  const track = (name, D, fn, step = 1 / 24) => { const ts = [], v = []; for (let t = 0; t <= D + 1e-6; t += step) { ts.push(+t.toFixed(4)); const d = fn(t), r = rest[name] || [0, 0, 0]; v.push(...Q(r[0] + (d[0] || 0), r[1] + (d[1] || 0), r[2] + (d[2] || 0))); } return new THREE.QuaternionKeyframeTrack(name + ".quaternion", ts, v); };
  const sway = (D, cycles, amp, extra) => lobes.flatMap(({ bones, phi }, k) => bones.slice(1).map((b, i) => { const j = i + 1, f = j / (K - 1);
    return track(b.name, D, t => { const w = TAU * cycles * t / D - j * .5 + k * 1.3, e = extra ? extra(t, j, phi) : [0, 0, 0]; return [amp * f * Math.sin(w) + e[0], e[1], amp * .7 * f * Math.cos(w + k) + e[2]]; }); }));
  const clips = [];
  { const D = 5; clips.push(new THREE.AnimationClip("Idle", D, [...sway(D, 1, .045), track("Head", D, t => [.05 * Math.sin(TAU * t / D), .22 * Math.sin(TAU * t / D + 1), .04 * Math.sin(TAU * 2 * t / D)])])); }
  { // Shake: a quick "no"; the crest swings round after the head and settles
    const D = 2, env = t => ss(0, .2, t) * (1 - ss(1.2, 1.9, t)), yaw = t => .38 * Math.sin(TAU * 2 * t / D) * env(t);
    clips.push(new THREE.AnimationClip("Shake", D, [...sway(D, 1, .03, (t, j) => [0, -.09 * (j / (K - 1)) * Math.sin(TAU * 2 * t / D - .5 - j * .25) * env(t + .15), 0]), track("Head", D, t => [0, yaw(t), 0])])); }
  return { root, clips, palette: opts.palette || "purple" };
}
