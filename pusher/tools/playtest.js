// Plays Star Dozer in a headless phone-sized browser: drops coins, holds to drop, forces a saucer, reloads to check the pile is kept.
// Usage (from pusher/, with `python3 -m http.server 8770` running here): node tools/playtest.js <outdir>
const { chromium } = require("playwright"); const OUT = process.argv[2] || ".";
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = [];
  p.on("pageerror", e => errs.push(e.message)); await p.route("https://fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
  await p.goto("http://localhost:8770/pusher.html"); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  await p.screenshot({ path: OUT + "/pu_0.png" }); const box = await p.locator("#cv").boundingBox();
  const c0 = await p.evaluate(() => credits); console.log("start: credits", c0, "coins on tray", await p.evaluate(() => coins.length));
  for (let i = 0; i < 12; i++) { await p.mouse.click(box.x + box.width * (.2 + .6 * Math.random()), box.y + box.height * .2); await p.waitForTimeout(250); }
  await p.mouse.move(box.x + box.width * .5, box.y + box.height * .2); await p.mouse.down(); await p.waitForTimeout(4000); await p.mouse.up();
  await p.waitForTimeout(6000); await p.screenshot({ path: OUT + "/pu_1.png" });
  console.log("after ~27 drops + 6 s: credits", await p.evaluate(() => credits), "won", await p.evaluate(() => won), "stacked", await p.evaluate(() => coins.filter(c => c.layer === 2).length));
  await p.evaluate(() => { FORCE.item = "ufo"; }); await p.mouse.click(box.x + box.width * .5, box.y + box.height * .2);
  await p.click("#auto"); await p.waitForTimeout(25000); await p.screenshot({ path: OUT + "/pu_2.png" }); await p.click("#auto");
  console.log("after AUTO 25 s: credits", await p.evaluate(() => credits), "won", await p.evaluate(() => won), "saucer still on tray:", await p.evaluate(() => coins.some(c => c.kind === "ufo")));
  const n1 = await p.evaluate(() => coins.length); await p.evaluate(() => save()); await p.reload(); await p.waitForTimeout(800);
  console.log("reload keeps the pile:", n1, "->", await p.evaluate(() => coins.length), "; credits kept:", await p.evaluate(() => credits));
  console.log("errors", errs); await b.close(); })();
