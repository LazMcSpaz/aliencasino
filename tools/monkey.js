// "Monkey" stress test: taps random buttons and spots on each game as fast as a frantic player would, for a while,
// and watches for crashes and impossible balances (negative, not a whole number, NaN).
// Needs lobby/ served on :8765 (python3 -m http.server 8765). Usage (from repo root): node tools/monkey.js <three node_modules dir> <seconds per game> [game ...]
const { chromium } = require("playwright"); const fs = require("fs"); const [NM, SECS = "60", ...ONLY] = process.argv.slice(2);
const ALL = ["slot", "pyramid", "asteroid", "gravity", "moons", "warp", "wheel", "pusher"];
(async () => { const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }); let bad = 0;
  for (const g of (ONLY.length ? ONLY : ALL)) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = new Set(), probs = new Set();
    p.on("pageerror", e => errs.add(e.message.slice(0, 160))); p.on("console", m => { if (m.type() === "error" && !/fonts|net::|Failed to load/.test(m.text())) errs.add("console: " + m.text().slice(0, 160)); });
    await p.route("https://cdn.jsdelivr.net/npm/**", r => { const u = r.request().url().replace("https://cdn.jsdelivr.net/npm/", NM + "/").replace(/@[0-9.]+\//, "/"); try { r.fulfill({ body: fs.readFileSync(u), contentType: "application/javascript" }); } catch (e) { r.abort(); } });
    await p.route("https://fonts.googleapis.com/**", r => r.fulfill({ body: "", contentType: "text/css" }));
    await p.goto("http://localhost:8765/games/" + g + ".html");   // served (lobby/ on :8765) so storage works like on a phone await p.waitForTimeout(3000);
    const t0 = Date.now(); let taps = 0, min = Infinity, max = -Infinity, refills = 0;
    while (Date.now() - t0 < SECS * 1000) {
      // pick a visible, enabled button (or a random spot) and tap it, sometimes in a burst
      const pick = await p.evaluate(() => { const els = [...document.querySelectorAll("button,[role=button],.tile,.world,.chip,.spot,.bet,.cell,.slotbtn,canvas")].filter(e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight && s.visibility !== "hidden" && s.pointerEvents !== "none" && !e.disabled && !e.closest("[hidden]"); });
        if (!els.length || Math.random() < .15) return [Math.random() * innerWidth, Math.random() * innerHeight]; const e = els[Math.floor(Math.random() * els.length)], r = e.getBoundingClientRect();
        return [r.left + r.width * (.2 + Math.random() * .6), r.top + r.height * (.2 + Math.random() * .6)]; });
      const burst = Math.random() < .2 ? 2 + Math.floor(Math.random() * 6) : 1;
      for (let i = 0; i < burst; i++) await p.mouse.click(pick[0], pick[1]).catch(() => {});
      taps += burst; await p.waitForTimeout(Math.random() < .3 ? 600 + Math.random() * 1500 : 30 + Math.random() * 150);
      const st = await p.evaluate(() => { const c = typeof credits !== "undefined" ? credits : null; return { c, card: !!document.querySelector(".rf .take:not([disabled])") }; }).catch(e => ({ c: "eval failed" }));
      if (typeof st.c !== "number" || !Number.isFinite(st.c) || st.c < 0 || !Number.isInteger(st.c)) probs.add("bad balance: " + st.c); else { min = Math.min(min, st.c); max = Math.max(max, st.c); }
      if (st.card) { refills++; await p.evaluate(() => localStorage.removeItem("alien-casino-refill-at")); }
    }
    const fin = await p.evaluate(() => [credits, localStorage.getItem("alien-casino-bars")]);
    console.log(`${g.padEnd(9)} taps ${taps} | balance ${min}..${max}, end ${fin[0]} (saved ${fin[1]}) | refill offers ${refills} | ${errs.size ? "ERRORS: " + [...errs].join(" || ") : "no errors"} ${probs.size ? "| PROBLEMS: " + [...probs].join("; ") : ""}`);
    if (errs.size || probs.size) bad++; await p.close(); }
  await b.close(); process.exit(bad ? 1 : 0); })();
