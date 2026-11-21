// Records short "attract mode" clips of each game for the lobby's wall screens: plays a round on a frozen clock,
// screenshotting one frame every 1/12 s. Frames are packed into a sprite sheet by tools/attract_pack.py.
// Usage (from lobby/): node tools/attract.js <outdir> <three-node_modules-dir> [game ...]
const { chromium } = require("playwright"); const fs = require("fs"); const [OUT, NM, ...ONLY] = process.argv.slice(2);
const N = 64, STEP = 1000 / 12;
// per game: the part of the phone screen to film (x, y, w, h at 390x844), setup before filming, and actions at given frames
const GAMES = {
  slot:     { clip: [0, 34, 390, 300], at: { 2: "#spin", 34: "#spin" }, pre: p => p.evaluate(() => { FORCE.big = true; }) },
  pyramid:  { clip: [0, 60, 390, 300], at: { 2: "#go", 14: "#go", 26: "#go", 38: "#go", 50: "#go" }, pre: p => p.evaluate(() => { FORCE.perfect = true; }) },
  asteroid: { clip: [0, 50, 390, 300], at: { 1: "#go", 6: ".tile:nth-child(8)", 12: ".tile:nth-child(14)", 18: ".tile:nth-child(3)", 24: ".tile:nth-child(19)", 30: ".tile:nth-child(11)", 36: ".tile:nth-child(22)" }, pre: p => p.evaluate(() => { FORCE.mines = [20, 21, 22]; }) },
  gravity:  { clip: [0, 90, 390, 300], skip: 40, at: {}, pre: async p => { const tap = async (a) => { const xy = await p.evaluate(a => { const b = cv.getBoundingClientRect(); const [x, y] = P((R[0] + R[1]) / 2, a); return [b.left + x, b.top + y]; }, a); await p.mouse.click(...xy); }; await tap(.13); await tap(.4); await p.click("#go"); } },
  moons:    { clip: [0, 40, 390, 300], at: { 1: "#go", 34: "#go" }, pre: p => p.click(".spot.with") },
  warp:     { clip: [0, 34, 390, 300], skip: 50, at: {}, pre: async p => { await p.evaluate(() => { FORCE.crash = 3.4; }); await p.click("#go0"); } },
  wheel:    { clip: [0, 70, 390, 300], at: { 1: "#spin" }, pre: async p => { for (const i of [1, 3, 6]) await p.click(`.world:nth-child(${i})`, { force: true }); } },
};
(async () => { const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }); fs.mkdirSync(OUT, { recursive: true });
  for (const [g, G] of Object.entries(GAMES)) { if (ONLY.length && !ONLY.includes(g)) continue;
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.route("https://cdn.jsdelivr.net/npm/**", r => { const u = r.request().url().replace("https://cdn.jsdelivr.net/npm/", NM + "/").replace(/@[0-9.]+\//, "/"); try { r.fulfill({ body: fs.readFileSync(u), contentType: "application/javascript" }); } catch (e) { r.abort(); } });
    await p.route("https://fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
    await p.clock.install(); await p.setContent(fs.readFileSync("games/" + g + ".html", "utf8")); await p.waitForTimeout(3500);
    await p.clock.pauseAt(await p.evaluate(() => Date.now() + 100));
    await G.pre(p); for (let i = 0; i < (G.skip || 0); i++) await p.clock.runFor(STEP);
    const [x, y, w, h] = G.clip;
    for (let f = 0; f < N; f++) { if (G.at[f]) await p.click(G.at[f], { force: true }).catch(e => errs.push("click " + G.at[f])); await p.clock.runFor(STEP);
      await p.screenshot({ path: `${OUT}/${g}_${String(f).padStart(2, "0")}.png` }); }
    console.log(g, "done", errs.slice(0, 3)); await p.close(); }
  await b.close(); })();
