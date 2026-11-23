// Lobby monkey: hammers the app shell (menu, quick play, opening/closing games, the casino walk) with random taps,
// watching for crashes and a broken wallet. Needs lobby/ served on :8765. Usage: node tools/monkey_lobby.js <three node_modules dir> <seconds>
const { chromium } = require("playwright"); const fs = require("fs"); const [NM, SECS = "90"] = process.argv.slice(2);
(async () => { const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = new Set(), probs = new Set();
  p.on("pageerror", e => errs.add(e.message.slice(0, 160)));
  await p.route("https://cdn.jsdelivr.net/npm/**", r => { const u = r.request().url().replace("https://cdn.jsdelivr.net/npm/", NM + "/").replace(/@[0-9.]+\//, "/"); try { r.fulfill({ body: fs.readFileSync(u), contentType: "application/javascript" }); } catch (e) { r.abort(); } });
  await p.route("https://fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
  await p.goto("http://localhost:8765/lobby.html"); await p.waitForTimeout(3000);
  const t0 = Date.now(); let taps = 0, opened = new Set();
  while (Date.now() - t0 < SECS * 1000) {
    const pick = await p.evaluate(() => { const els = [...document.querySelectorAll("button,.gcard,.tile,canvas")].filter(e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight && s.visibility !== "hidden" && !e.disabled && !e.closest("[hidden]"); });
      if (!els.length || Math.random() < .2) return [Math.random() * innerWidth, Math.random() * innerHeight]; const e = els[Math.floor(Math.random() * els.length)], r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    const burst = Math.random() < .2 ? 3 : 1; for (let i = 0; i < burst; i++) await p.mouse.click(pick[0], pick[1]).catch(() => {});
    taps += burst; await p.waitForTimeout(Math.random() < .3 ? 800 + Math.random() * 1500 : 40 + Math.random() * 200);
    if (Math.random() < .08) await p.evaluate(() => { const g = document.getElementById("game"); if (g && !g.hidden) document.getElementById("gBack").click(); });   // back out of a game now and then
    const st = await p.evaluate(() => ({ bars: window.__alienWallet.get(), game: !document.getElementById("game").hidden && (window.__alienLaunch ? JSON.stringify(window.__alienLaunch) : "?") }));
    if (!Number.isInteger(st.bars) || st.bars < 0) probs.add("bad wallet " + st.bars); if (st.game) opened.add(st.game);
  }
  console.log(`lobby taps ${taps} | games opened ${opened.size} | wallet ${await p.evaluate(() => window.__alienWallet.get())} | ${errs.size ? "ERRORS: " + [...errs].join(" || ") : "no errors"} ${probs.size ? "| PROBLEMS: " + [...probs].join("; ") : ""}`);
  await b.close(); })();
