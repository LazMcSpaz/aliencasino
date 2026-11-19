// Plays Star Dozer (3D) in a headless phone-sized browser: drops bars, holds to drop, runs AUTO, forces a rainbow crystal, reloads to check the pile is kept.
// Usage (from pusher/, with `python3 -m http.server 8770` running here): node tools/playtest.js <outdir> <node_modules dir with three@0.147 and @dimforge/rapier3d-compat@0.14>
const { chromium } = require("playwright"); const fs = require("fs"); const OUT = process.argv[2] || ".", NM = process.argv[3];
(async () => { const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = [];
  p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await p.route("https://cdn.jsdelivr.net/npm/**", r => { const u = r.request().url().replace("https://cdn.jsdelivr.net/npm/", NM + "/").replace(/@[0-9.]+\//, "/"); r.fulfill({ body: fs.readFileSync(u), contentType: "application/javascript" }); });
  await p.route("https://fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
  await p.goto("http://localhost:8770/pusher.html"); await p.evaluate(() => localStorage.clear()); await p.reload();
  const t0 = Date.now(); await p.waitForFunction(() => window.__ready || document.getElementById("boot").classList.contains("err"), null, { timeout: 60000 });
  console.log("physics ready in", Date.now() - t0, "ms; boot message:", await p.evaluate(() => document.getElementById("boot").hidden ? "(hidden)" : document.getElementById("boot").textContent));
  await p.waitForTimeout(800); await p.screenshot({ path: OUT + "/p3_0.png" }); const box = await p.locator("#cv").boundingBox();
  console.log("start: credits", await p.evaluate(() => credits), "pieces", await p.evaluate(() => pieces.length));
  for (let i = 0; i < 10; i++) { await p.mouse.click(box.x + box.width * (.2 + .6 * Math.random()), box.y + box.height * .45); await p.waitForTimeout(300); }
  await p.mouse.move(box.x + box.width * .5, box.y + box.height * .45); await p.mouse.down(); await p.waitForTimeout(2500); await p.screenshot({ path: OUT + "/p3_1.png" }); await p.mouse.up();
  await p.evaluate(() => { FORCE.item = "rainbow"; }); await p.mouse.click(box.x + box.width * .5, box.y + box.height * .45); await p.evaluate(() => { FORCE.item = "gold"; }); await p.mouse.click(box.x + box.width * .4, box.y + box.height * .45);
  await p.click("#auto"); await p.waitForTimeout(20000); await p.screenshot({ path: OUT + "/p3_2.png" }); await p.click("#auto");
  const fps = await p.evaluate(() => new Promise(r => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 2000) requestAnimationFrame(f); else r(n / 2); }; requestAnimationFrame(f); }));
  console.log("after play: credits", await p.evaluate(() => credits), "won", await p.evaluate(() => won), "pieces", await p.evaluate(() => pieces.length), "crystals on tray", await p.evaluate(() => pieces.filter(q => q.kind !== "bar").map(q => q.kind).join(",")), "| fps here (software graphics)", fps);
  const n1 = await p.evaluate(() => { save(); return pieces.length; }); await p.reload(); await p.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  console.log("reload keeps the pile:", n1, "->", await p.evaluate(() => pieces.length), "; credits kept:", await p.evaluate(() => credits));
  console.log("errors", errs.slice(0, 5)); await b.close(); })();
