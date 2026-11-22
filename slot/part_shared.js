// Shared by every game (inlined after the wallet by each game's build.py): the big-win celebration and the free refill.
// Lives in slot/ with the wallet and sound engine. Uses the game's Sound if it has one, and the game's own `credits`.
//   BigWin.show(win, bet, pre?) -> Promise   full-screen celebration when win is at least 10x the bet (and 50+ bars); resolves when it's gone
//   Refill.start(minBet, busy)         watches the balance; when it stays below minBet (and busy() isn't true: a round still in play), offers a free top-up (once every 10 minutes)
const Shared = (() => {
  const css = `
.bw{position:fixed;inset:0;z-index:9000;display:grid;place-items:center;overflow:hidden;cursor:pointer;
  background:radial-gradient(ellipse at 50% 46%,#2a1250e6 0%,#0b0418f2 62%,#030108fa 100%);animation:bwIn .35s ease-out both;-webkit-tap-highlight-color:transparent}
.bw.out{animation:bwOut .4s ease-in forwards}
.bw canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.bw .rays{position:absolute;left:50%;top:46%;width:180vmax;height:180vmax;translate:-50% -50%;opacity:.55;pointer-events:none;
  background:repeating-conic-gradient(from 0deg,var(--bw-a) 0deg 6deg,transparent 6deg 18deg);mask:radial-gradient(circle,#000 0%,#0008 22%,transparent 52%);
  -webkit-mask:radial-gradient(circle,#000 0%,#0008 22%,transparent 52%);animation:bwSpin 14s linear infinite}
.bw .box{position:relative;text-align:center;padding:0 16px;animation:bwPop .6s cubic-bezier(.2,1.6,.4,1) both .1s}
.bw .pre{font:400 clamp(1.6rem,8vw,2.4rem)/1 "Yellowtail",cursive;color:#fff;text-shadow:0 0 12px var(--bw-b),0 2px 0 #0008;rotate:-6deg;margin-bottom:.1em}
.bw .tier{font:400 clamp(2.6rem,15vw,5rem)/.95 "Bungee","Chakra Petch",system-ui,sans-serif;letter-spacing:.02em;
  background:linear-gradient(180deg,#fffbe6 0%,var(--bw-a) 45%,var(--bw-c) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 14px var(--bw-b)) drop-shadow(0 4px 0 #0009);animation:bwPulse 1.1s ease-in-out infinite .7s}
.bw .amt{display:inline-flex;align-items:center;gap:.25em;margin-top:.35em;padding:.18em .6em .14em;border-radius:999px;
  font:400 clamp(2rem,11vw,3.4rem)/1 "Bungee","Chakra Petch",system-ui,sans-serif;color:#ffe9a8;background:#0009;
  box-shadow:inset 0 0 0 2px #ffd56a88,0 0 30px #ffb52e55;text-shadow:0 2px 0 #7a4a00}
.bw .amt i{width:.95em;height:.55em;border-radius:.12em;background:linear-gradient(180deg,#fff4b8,#ffc93d 45%,#b97a10);box-shadow:inset 0 -2px 0 #8a5a0a}
.bw .x{margin-top:.6em;font:700 clamp(.8rem,3.6vw,1rem)/1 "Chakra Petch",system-ui,sans-serif;letter-spacing:.3em;color:#ffffffb0}
.bw .tap{position:absolute;bottom:max(28px,env(safe-area-inset-bottom));left:0;right:0;text-align:center;font:600 .8rem "Chakra Petch",system-ui,sans-serif;letter-spacing:.3em;color:#ffffff66;animation:bwIn .4s 1.6s both}
.bw.t3 .tier{font-size:clamp(2rem,10.5vw,3.6rem)}
.bw.t3 .box{animation:bwPop .6s cubic-bezier(.2,1.6,.4,1) both .1s,bwShake .5s .2s 2}
@keyframes bwIn{from{opacity:0}}@keyframes bwOut{to{opacity:0}}@keyframes bwSpin{to{rotate:360deg}}
@keyframes bwPop{from{opacity:0;transform:scale(.3)}}@keyframes bwPulse{50%{transform:scale(1.06)}}
@keyframes bwShake{20%{translate:-6px 3px}40%{translate:5px -4px}60%{translate:-4px -2px}80%{translate:3px 4px}}
.rf{position:fixed;inset:0;z-index:8900;display:grid;place-items:center;padding:16px;background:#05020cd9;animation:bwIn .3s ease-out both}
.rf .card{position:relative;width:min(340px,100%);padding:26px 22px 22px;border-radius:22px;text-align:center;color:#fff;
  background:linear-gradient(180deg,#24124a,#120826);box-shadow:inset 0 0 0 1.5px #ffd56a55,0 20px 60px #000c,0 0 40px #b45cff33;animation:bwPop .45s cubic-bezier(.2,1.6,.4,1) both}
.rf h3{margin:0;font:400 1.9rem/1 "Bungee","Chakra Petch",system-ui,sans-serif;color:#ffd56a;text-shadow:0 0 14px #ff9d3d88}
.rf p{margin:.7em 0 1.1em;font:500 .98rem/1.4 "Chakra Petch",system-ui,sans-serif;color:#e8dcff}
.rf .bars{display:flex;justify-content:center;gap:4px;margin:4px 0 14px}.rf .bars i{width:30px;height:16px;border-radius:3px;background:linear-gradient(180deg,#fff4b8,#ffc93d 45%,#b97a10);box-shadow:inset 0 -2px 0 #8a5a0a;animation:rfBob 1.6s ease-in-out infinite}
.rf .bars i:nth-child(2){animation-delay:.15s}.rf .bars i:nth-child(3){animation-delay:.3s}
@keyframes rfBob{50%{translate:0 -4px}}
.rf button.take{width:100%;border:0;border-radius:999px;padding:15px 18px;font:400 1.1rem/1 "Bungee","Chakra Petch",system-ui,sans-serif;color:#2a1400;cursor:pointer;
  background:radial-gradient(circle at 50% 30%,#fff3b0,#ffc93d 55%,#d98a12);box-shadow:inset 0 -3px 0 #a5650a,0 0 24px #ffb52e66}
.rf button.take:disabled{filter:grayscale(1) brightness(.6);box-shadow:none;cursor:default}
.rf button.close{position:absolute;top:10px;right:12px;width:34px;height:34px;border:0;border-radius:50%;background:#ffffff14;color:#fff;font:700 1rem system-ui;cursor:pointer}
.rf small{display:block;margin-top:12px;font:600 .72rem "Chakra Petch",system-ui,sans-serif;letter-spacing:.2em;color:#ffffff70}`;
  let styled = false; const style = () => { if (styled) return; styled = true; const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); };
  const snd = () => (typeof Sound !== "undefined" ? Sound : null);
  const play = (f) => { try { const S = snd(); if (S) f(S); } catch (e) {} };
  const repaint = () => { try { if (typeof setCredits === "function") setCredits(800); } catch (e) {} try { if (typeof update === "function") update(); } catch (e) {}
    try { if (typeof paint === "function") paint(); } catch (e) {} const el = document.getElementById("credits"); if (el && typeof credits === "number" && typeof setCredits !== "function") el.textContent = credits; };

  // ---- big wins: three sizes, each louder than the last ----
  const TIERS = [[50, "ALIEN-SIZED WIN", "Out of this world", "#7dff3a", "#2bff9a", "#0f8a3a", 3], [25, "HUGE WIN", "Whoa!", "#ff7ad9", "#ff3fae", "#8a1a6a", 2], [10, "BIG WIN", "Nice!", "#ffd23f", "#ff9d3d", "#9a5a00", 1]];
  let showing = null;
  function show(win, bet, pre) {
    win = Math.round(win); if (!(win >= 50) || !(bet > 0) || win < bet * 10 || showing) return Promise.resolve(false);
    style(); const x = win / bet, T = TIERS.find(t => x >= t[0]), lvl = T[6];
    const el = document.createElement("div"); el.className = "bw t" + lvl; el.style.setProperty("--bw-a", T[3]); el.style.setProperty("--bw-b", T[4]); el.style.setProperty("--bw-c", T[5]);
    el.innerHTML = `<div class="rays"></div><canvas></canvas><div class="box"><div class="pre">${pre || T[2]}</div><div class="tier">${T[1].replace(" ", "<br>")}</div><div class="amt"><i></i><span>0</span></div><div class="x">${x >= 100 ? Math.round(x) : x.toFixed(x < 20 ? 1 : 0)}× YOUR BET</div></div><div class="tap">TAP TO COLLECT</div>`;
    document.body.appendChild(el);
    // falling gold bars and sparks
    const cv = el.querySelector("canvas"), c = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1); let W, H, bits = [], raf = 0;
    const size = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); }; size();
    const spawn = (n, burst) => { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, sp = burst ? 4 + Math.random() * 9 : 0;
      bits.push({ x: burst ? W / 2 : Math.random() * W, y: burst ? H * .46 : -20 - Math.random() * H * .3, vx: burst ? Math.cos(a) * sp : (Math.random() - .5) * 1.2, vy: burst ? Math.sin(a) * sp - 3 : 2 + Math.random() * 3,
        r: Math.random() * 6, vr: (Math.random() - .5) * .3, s: 8 + Math.random() * 10, spark: Math.random() < .35, life: 1 }); } };
    spawn(30 + lvl * 25, true); let rain = 0;
    const tick = () => { c.clearRect(0, 0, W, H); if (rain++ % (5 - lvl) === 0 && bits.length < 220) spawn(2 + lvl, false);
      bits = bits.filter(b => { b.vy += .22; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.r += b.vr; if (b.spark) b.life -= .012; return b.y < H + 30 && b.life > 0; });
      for (const b of bits) { c.save(); c.translate(b.x, b.y); c.rotate(b.r); c.globalAlpha = b.life;
        if (b.spark) { c.fillStyle = T[3]; c.beginPath(); c.arc(0, 0, b.s * .18, 0, 7); c.fill(); }
        else { const w = b.s * 1.6, h = b.s * .9, g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, "#fff4b8"); g.addColorStop(.45, "#ffc93d"); g.addColorStop(1, "#b97a10");
          c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(-w / 2, -h / 2, w, h, 2) : c.rect(-w / 2, -h / 2, w, h); c.fill(); }
        c.restore(); }
      raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick);
    // the amount counts up, with a coin-counter tick
    const amt = el.querySelector(".amt span"), dur = 1200 + lvl * 600, t0 = performance.now(); let lastTick = 0;
    const count = n => { const k = Math.min(1, (n - t0) / dur), e = 1 - Math.pow(1 - k, 3); amt.textContent = Math.round(win * e).toLocaleString();
      if (n - lastTick > 70 && k < 1) { lastTick = n; play(S => S.tone && S.tone(1400 + e * 900, .03, { type: "square", vol: .03 })); }
      if (k < 1 && el.isConnected) requestAnimationFrame(count); }; requestAnimationFrame(count);
    play(S => { if (S.bigWin) S.bigWin(); if (lvl >= 2 && S.arp) setTimeout(() => S.arp([0, 4, 7, 12, 16, 19, 24], .06, { type: "triangle", vol: .09, dur: .3 }), 500); });
    showing = new Promise(res => { let done = false;
      const close = () => { if (done) return; done = true; el.classList.add("out"); setTimeout(() => { cancelAnimationFrame(raf); el.remove(); showing = null; res(true); }, 400); };
      const minT = setTimeout(() => el.addEventListener("pointerdown", e => { e.stopPropagation(); close(); }), 700); setTimeout(close, dur + 2600 + lvl * 400); });
    return showing;
  }

  // ---- free refill: when the balance runs dry, the house tops you back up (once every 10 minutes) ----
  const KEY = "alien-casino-refill-at", COOL = 10 * 60 * 1000, TO = 500;
  const lastAt = () => { try { return Number(localStorage.getItem(KEY)) || 0; } catch (e) { return 0; } };
  let card = null, dismissedUntilReady = false, minBet = 10, low = 0;
  function offer() {
    if (card) return; style(); card = document.createElement("div"); card.className = "rf";
    card.innerHTML = `<div class="card"><button class="close" aria-label="Close">✕</button><h3>OUT OF BARS</h3><p>The aliens don't want you leaving early. Have some on the house.</p><div class="bars"><i></i><i></i><i></i></div><button class="take"></button><small></small></div>`;
    document.body.appendChild(card); const take = card.querySelector(".take"), note = card.querySelector("small");
    const paintCard = () => { if (!card) return; const left = COOL - (Date.now() - lastAt());
      if (left <= 0) { take.disabled = false; take.textContent = `TAKE ${TO} FREE BARS`; note.textContent = "A free refill every 10 minutes"; }
      else { const m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60; take.disabled = true; take.textContent = `NEXT REFILL ${m}:${String(s).padStart(2, "0")}`; note.textContent = "Or grab your daily reward from the menu"; } };
    paintCard(); const iv = setInterval(paintCard, 500);
    const shut = () => { clearInterval(iv); if (card) card.remove(); card = null; };
    card.querySelector(".close").onclick = () => { dismissedUntilReady = COOL - (Date.now() - lastAt()) > 0; shut(); };
    take.onclick = () => { if (take.disabled || typeof credits !== "number") return; try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
      credits = Math.max(credits, TO); play(S => S.refill && S.refill()); repaint(); shut(); };
  }
  function start(mb, busy) { minBet = mb || 1;
    setInterval(() => { if (typeof credits !== "number") return; try { if (busy && busy()) { low = 0; return; } } catch (e) {} if (credits >= minBet) { low = 0; dismissedUntilReady = false; if (card) { card.remove(); card = null; } return; }
      low++; const ready = COOL - (Date.now() - lastAt()) <= 0; if (dismissedUntilReady && ready) dismissedUntilReady = false;
      if (low >= 8 && !card && !dismissedUntilReady && !showing) offer(); }, 500); }   // 4 s of being broke, so a round still paying out can land first
  return { BigWin: { show }, Refill: { start } };
})();
const BigWin = Shared.BigWin, Refill = Shared.Refill;
