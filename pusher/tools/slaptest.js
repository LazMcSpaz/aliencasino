// Plays the slap mechanic in a headless phone-sized browser: slaps while the guard watches (caught, fined), then forces a clear window and slaps twice.
// Usage (from pusher/, with `python3 -m http.server 8770` running here): node tools/slaptest.js <outdir> <node_modules dir with three@0.147 and @dimforge/rapier3d-compat@0.14>
const { chromium } = require("playwright"); const fs = require("fs"); const OUT = process.argv[2] || ".", NM = process.argv[3];
(async () => { const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = [];
  p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await p.route("https://cdn.jsdelivr.net/npm/**", r => { const u = r.request().url().replace("https://cdn.jsdelivr.net/npm/", NM + "/").replace(/@[0-9.]+\//, "/"); r.fulfill({ body: fs.readFileSync(u), contentType: "application/javascript" }); });
  await p.route("https://fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
  await p.goto("http://localhost:8770/pusher.html"); await p.evaluate(() => localStorage.clear()); await p.reload();
  await p.waitForFunction(() => window.__ready, null, { timeout: 60000 }); await p.waitForTimeout(1200);
  await p.screenshot({ path: OUT + "/s_watch.png" });
  const c0 = await p.evaluate(() => credits); await p.click("#slapr", { force: true }); await p.waitForTimeout(300); console.log("guard", await p.evaluate(() => [$("guard").getAttribute("class"), $("banner").className, $("flash").className, getComputedStyle($("guard")).opacity, getComputedStyle($("banner")).opacity]));
  console.log("caught slap: credits", c0, "->", await p.evaluate(() => credits), "lookout", JSON.stringify(await p.evaluate(() => lookout())));
  await p.waitForTimeout(600); await p.screenshot({ path: OUT + "/s_caught.png" }); await p.waitForTimeout(600); await p.screenshot({ path: OUT + "/s_caught2.png" }); await p.waitForTimeout(4000);
  await p.evaluate(() => forceClear()); await p.waitForTimeout(300); await p.screenshot({ path: OUT + "/s_clear.png" });
  const w0 = await p.evaluate(() => won), c1 = await p.evaluate(() => credits);
  console.log("before:", JSON.stringify(await p.evaluate(() => lookout()))); await p.click("#slapl", { force: true }); await p.waitForTimeout(120); await p.screenshot({ path: OUT + "/s_slap.png" }); await p.waitForTimeout(1200); await p.click("#slapr", { force: true }); await p.waitForTimeout(3500);
  console.log("two clear slaps: credits", c1, "->", await p.evaluate(() => credits), "won +", (await p.evaluate(() => won)) - w0, "lookout", JSON.stringify(await p.evaluate(() => lookout())));
  await p.screenshot({ path: OUT + "/s_after.png" }); console.log("errors", errs.slice(0, 5)); await b.close(); })();
