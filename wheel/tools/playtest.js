// Plays Wheel of Worlds in a headless phone-sized browser: bets, spins (forcing a wormhole, then Earth), takes screenshots.
// Usage (from wheel/, with `python3 -m http.server 8771` running here): node tools/playtest.js <outdir> <node_modules dir with three@0.147>
const { chromium } = require("playwright"); const fs = require("fs"); const OUT = process.argv[2] || ".", NM = process.argv[3];
(async () => { const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await p.route("https://cdn.jsdelivr.net/npm/**", r => { const u = r.request().url().replace("https://cdn.jsdelivr.net/npm/", NM + "/").replace(/@[0-9.]+\//, "/"); r.fulfill({ body: fs.readFileSync(u), contentType: "application/javascript" }); });
  await p.route("https://fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
  await p.goto("http://localhost:8771/wheel.html"); await p.waitForFunction(() => window.__ready, null, { timeout: 60000 }); await p.waitForTimeout(3500);
  await p.screenshot({ path: OUT + "/w_0.png" });
  const c0 = await p.evaluate(() => credits);
  await p.click(".world:nth-child(1)", { force: true }); await p.click(".world:nth-child(6)", { force: true }); await p.click(".world:nth-child(3)", { force: true });
  console.log("bets", JSON.stringify(await p.evaluate(() => bets)), "credits", c0, "->", await p.evaluate(() => credits));
  await p.evaluate(() => { FORCE.seg = "worm"; }); await p.click("#spin", { force: true }); await p.waitForTimeout(2500); await p.screenshot({ path: OUT + "/w_1.png" });
  await p.waitForFunction(() => ride > 1, null, { timeout: 30000 }); await p.evaluate(() => { FORCE.seg = "earth"; }); await p.waitForTimeout(500); await p.screenshot({ path: OUT + "/w_2.png" });
  await p.waitForFunction(() => phase === "done", null, { timeout: 40000 }); await p.waitForTimeout(400); await p.screenshot({ path: OUT + "/w_3.png" });
  console.log("history", JSON.stringify(await p.evaluate(() => history)), "credits", await p.evaluate(() => credits));
  console.log("errors", errs.slice(0, 5)); await b.close(); })();
