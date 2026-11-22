// Screenshots each slot machine's top sign, reels and buttons (one set per machine: Take a Bite, Club Zorp, Al'ien Capone)
// for the robots' screens, so each robot on the casino floor shows the machine it actually opens.
// Run from model3d/: node capture_machines.js   -> cap/tex_{hud,glass,controls}_<machine>.png (build converts to webp)
const { chromium } = require("playwright"); const fs = require("fs"); const F = "../web/fonts/";
const fam = { "bungee": "Bungee", "chakra-petch": "Chakra Petch", "monoton": "Monoton", "outfit": "Outfit", "share-tech-mono": "Share Tech Mono", "yellowtail": "Yellowtail" };
const css = fs.readdirSync(F).filter(f => f.endsWith(".woff2")).map(f => { const m = f.match(/^(.*)-latin-(\d+)-normal/); return `@font-face{font-family:"${fam[m[1]]}";font-weight:${m[2]};src:url(data:font/woff2;base64,${fs.readFileSync(F + f).toString("base64")}) format("woff2")}`; }).join("\n");
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.route("https://fonts.googleapis.com/**", r => r.fulfill({ body: css, contentType: "text/css" }));
  await p.setContent(fs.readFileSync("../slot/slot.html", "utf8")); await p.waitForTimeout(2000);
  await p.evaluate(() => { for (const id of ["coins", "sndbtn", "infobtn", "bonuspill"]) { const e = document.getElementById(id); if (e) e.style.visibility = "hidden"; } });
  for (const m of ["food", "club", "mob"]) {
    await p.evaluate(m => { applyMachine(m); fitTitle(); render(); update(); }, m); await p.waitForTimeout(1200);
    for (const [name, sel] of [["hud", ".hud"], ["glass", "#glass"], ["controls", ".controls"]]) await (await p.$(sel)).screenshot({ path: `cap/tex_${name}_${m}.png` }); }
  console.log("done", errs); await b.close(); })();
