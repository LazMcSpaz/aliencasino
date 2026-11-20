// Clicks through the menu in a headless phone-sized browser: daily reward, daily spin, store (test purchase), quick play into a game and back, then into the casino.
// Usage (from lobby/, with `python3 -m http.server 8765` running here): node tools/menutest.js <outdir> <node_modules dir with three@0.147>
const { chromium } = require("playwright"); const fs = require("fs"); const OUT = process.argv[2] || ".", NM = process.argv[3], URL = process.argv[4] || "http://localhost:8765/lobby.html";
(async () => { const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await p.route("https://cdn.jsdelivr.net/npm/**", r => { const u = r.request().url().replace("https://cdn.jsdelivr.net/npm/", NM + "/").replace(/@[0-9.]+\//, "/"); r.fulfill({ body: fs.readFileSync(u), contentType: "application/javascript" }); });
  await p.route("https://fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1500);
  const bal = () => p.evaluate(() => window.__alienWallet.get());
  await p.screenshot({ path: OUT + "/m_reward.png" }); console.log("start", await bal());
  await p.click("#mmClaim"); await p.waitForTimeout(900); await p.screenshot({ path: OUT + "/m_claimed.png" }); console.log("after reward", await bal()); await p.click("#mmX2"); await p.waitForTimeout(300); await p.screenshot({ path: OUT + "/m_home.png" });
  await p.click("#mnSpin"); await p.waitForTimeout(500); await p.screenshot({ path: OUT + "/m_spin0.png" }); await p.click("#mmGo"); await p.waitForTimeout(1500); await p.screenshot({ path: OUT + "/m_spin.png" }); await p.waitForTimeout(5400); await p.screenshot({ path: OUT + "/m_spinwon.png" }); console.log("after spin", await bal(), await p.textContent("#mmWon")); await p.click("#mmX");
  await p.click("#mnStore"); await p.waitForTimeout(300); await p.screenshot({ path: OUT + "/m_store.png" }); await p.click('.pack[data-i="0"]'); await p.click("#mmBuy"); console.log("after buy", await bal()); await p.click("#mmOk");
  await p.click("#mnQuick"); await p.waitForTimeout(300); await p.screenshot({ path: OUT + "/m_quick.png" }); await p.click('.gcard[data-id="wheel"]'); await p.waitForTimeout(4000);
  console.log("game open:", await p.evaluate(() => !document.getElementById("game").hidden), "casino built:", await p.evaluate(() => !!window.__lobbyReady));
  await p.click("#gBack", { force: true }); await p.waitForTimeout(300); await p.click("#mnBack"); await p.click("#mnEnter");
  await p.waitForFunction(() => window.__lobbyReady, null, { timeout: 120000 }); await p.waitForTimeout(800); await p.screenshot({ path: OUT + "/m_casino.png" });
  await p.click("#home"); await p.waitForTimeout(300); console.log("menu back:", await p.evaluate(() => MENU.open));
  console.log("errors", errs.slice(0, 5)); await b.close(); })();
