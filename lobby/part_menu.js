// The front of the app: a title menu shown before the 3D casino loads, with Quick Play (open any game straight away, no casino),
// a Daily Reward (a 7-day login streak), a Daily Spin (one free prize-wheel spin a day) and a Store (bar packs; test mode until the app-store version).
// May use: GAMES, openGame, window.__alienWallet, Music, enterCasino (all from lobby.src.html). Must not: touch the 3D scene.
const MENU = (() => {
  const W = window.__alienWallet, KEY = "alien-casino-daily";
  const today = () => new Date().toLocaleDateString("en-CA");                       // YYYY-MM-DD in the player's own time zone
  const dayDiff = (a, b) => Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / 864e5);
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };
  const REWARDS = [100, 150, 200, 300, 400, 500, 1000];                              // day 1…7 of a streak; day 7 is the big one, then it starts over
  // the daily spin's prizes and how often each comes up (chances add to 1); about 290 bars on average
  const SPIN = [[100, .26, "#5fe8ff"], [50, .2, "#9aa6c8"], [250, .16, "#b48cff"], [150, .2, "#ff5fae"], [500, .1, "#7dff9a"], [100, 0, "#5fe8ff"], [1000, .06, "#ffc845"], [2500, .02, "#ff7a3a"]];
  SPIN[5][1] = 0; // (a second 100 segment for looks; the first one carries its chance)
  const PACKS = [{ bars: 1000, price: "$0.99" }, { bars: 5500, price: "$4.99", tag: "+10%" }, { bars: 12000, price: "$9.99", tag: "+20%" }, { bars: 30000, price: "$19.99", tag: "BEST VALUE" }, { bars: 80000, price: "$49.99", tag: "+60%" }];
  const ICON = { slot: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 5v14M15 5v14"/><circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
    pyramid: '<path d="M12 3l9 17H3z"/><path d="M7.5 11.5h9M5 16h14"/>', asteroid: '<path d="M5 9l4-5 7 1 4 6-2 7-7 2-5-4z"/><circle cx="10" cy="10" r="1.4"/><circle cx="14" cy="15" r="1.1"/>',
    gravity: '<path d="M12 12m-1 0a1 1 0 1 0 2 0a3 3 0 1 0-6 0a5 5 0 1 0 10 0a7 7 0 1 0-14 0a9 9 0 1 0 18 0"/>', moons: '<circle cx="8" cy="12" r="5"/><circle cx="17" cy="9" r="3"/>',
    warp: '<path d="M12 2c3 3 4 7 3 12h-6C8 9 9 5 12 2z"/><path d="M9 14l-3 4h4M15 14l3 4h-4M11 18l1 4 1-4"/>', wheel: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/><circle cx="12" cy="12" r="2"/>',
    pusher: '<rect x="3" y="14" width="18" height="6" rx="1"/><path d="M5 14l2-4h4l1 4M12 14l2-3h4l1 3"/>' };
  const css = `
.mn{position:fixed;inset:0;z-index:40;overflow:hidden;background:radial-gradient(120% 70% at 50% 25%,#2a1460 0%,#07040f 70%);display:grid;grid-template-rows:auto 1fr auto;
  padding:calc(14px + env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) calc(16px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));box-sizing:border-box}
.mn .stars{position:absolute;inset:-50%;pointer-events:none;background-image:radial-gradient(1.5px 1.5px at 20% 30%,#fff,transparent),radial-gradient(1px 1px at 70% 60%,#fff,transparent),radial-gradient(1.2px 1.2px at 40% 80%,#cfe,transparent),radial-gradient(1px 1px at 85% 20%,#fff,transparent),radial-gradient(1.4px 1.4px at 10% 70%,#fde,transparent);background-size:220px 220px;animation:mnstar 90s linear infinite;opacity:.8}
@keyframes mnstar{to{transform:rotate(360deg)}}
.mn > *{position:relative}
.mn .top{display:flex;justify-content:space-between;align-items:center}
.mn .bal{display:flex;align-items:center;gap:7px;padding:6px 12px 6px 8px;font:700 1.05rem var(--f-mono)}
.mn .bal i{width:26px;height:18px;background:var(--barimg) center/contain no-repeat;filter:drop-shadow(0 0 4px #ffc84588)}
.mn .body{display:grid;align-content:center;justify-items:center;gap:12px;min-height:0;overflow:auto}
.mn .logo{text-align:center;margin:0 0 6px}
.mn .logo b{display:block;font:400 3rem/1 "Monoton",var(--f-sign);color:#f2e6ff;text-shadow:0 0 6px #fff,0 0 18px #b48cff,0 0 40px #8a4dff;animation:mnflick 6s infinite}
.mn .logo i{display:block;margin-top:-6px;font:400 2.4rem/1 "Yellowtail",cursive;color:#ffe9b0;text-shadow:0 0 14px #ffc845}
@keyframes mnflick{0%,92%,100%{opacity:1}93%{opacity:.4}95%{opacity:1}97%{opacity:.6}}
.mn .big{--k:14px;--hc:var(--gold);width:min(86vw,330px);padding:16px;font:400 1.2rem/1 var(--f-sign);color:#fff;text-shadow:0 0 12px var(--gold);cursor:pointer;animation:mnpulse 1.4s ease-in-out infinite alternate}
.mn .big small{display:block;margin-top:5px;font:400 .58rem var(--f-mono);letter-spacing:.14em;color:#ffe9b0;text-shadow:none}
@keyframes mnpulse{to{box-shadow:inset 0 0 0 1px var(--gold),inset 0 0 30px #ffc84555,0 0 18px #ffc84566}}
.mn .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:min(86vw,330px)}
.mn .tile{--k:12px;padding:14px 8px;cursor:pointer;display:grid;justify-items:center;gap:6px;font:400 .82rem var(--f-sign);color:#fff}
.mn .tile svg{width:28px;height:28px;fill:none;stroke:var(--hc);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 5px var(--hc))}
.mn .tile small{font:400 .54rem var(--f-mono);letter-spacing:.08em;color:var(--dim)}
.mn .dot{position:absolute;top:7px;right:9px;min-width:9px;height:9px;border-radius:9px;background:#ff4d6d;box-shadow:0 0 8px #ff4d6d;animation:mnpulse2 .8s ease-in-out infinite alternate}
@keyframes mnpulse2{to{transform:scale(1.4)}}
.mn .foot{text-align:center;font:400 .56rem var(--f-mono);letter-spacing:.16em;color:var(--dim)}
.mn .head{display:flex;align-items:center;gap:10px}
.mn .back{--k:8px;width:40px;height:40px;cursor:pointer;display:grid;place-items:center;padding:0}
.mn .back svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.mn h2{margin:0;font:400 1.15rem var(--f-sign);color:#fff;text-shadow:0 0 10px var(--holo2)}
.mn .games{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:420px;align-self:start;padding-top:12px}
.mn .gcard{--k:12px;--hc:var(--gc);padding:12px 10px;cursor:pointer;display:grid;grid-template-columns:auto 1fr;gap:4px 10px;align-items:center;text-align:left}
.mn .gcard svg{grid-row:1/3;width:30px;height:30px;fill:none;stroke:var(--gc);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 5px var(--gc))}
.mn .gcard b{font:400 .78rem/1.1 var(--f-sign);color:#fff}.mn .gcard small{font:400 .56rem/1.2 var(--f-mono);color:var(--dim)}
.mm{position:fixed;inset:0;z-index:50;display:grid;place-items:center;background:#000b;padding:16px}
.mm .box{--k:16px;box-sizing:border-box;width:min(100%,370px);max-height:90dvh;overflow:auto;padding:18px 16px;background:#090a1cf2;display:grid;gap:12px;justify-items:center;text-align:center}
.mm h3{margin:0;font:400 1.25rem var(--f-sign);color:#fff;text-shadow:0 0 12px var(--hc)}
.mm p{margin:0;font:500 .85rem/1.4 var(--f-tech);color:var(--dim)}
.mm .days{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;width:100%}
.mm .day{--k:8px;--hc:#5a5280;padding:8px 2px;display:grid;gap:4px;justify-items:center;font:400 .5rem var(--f-mono);letter-spacing:.1em;color:var(--dim)}
.mm .day b{font:700 .9rem var(--f-mono);color:#fff}.mm .day i{width:22px;height:15px;background:var(--barimg) center/contain no-repeat}
.mm .day.got{--hc:#7dff9a;opacity:.6}.mm .day.now{--hc:var(--gold);animation:mnpulse 1s ease-in-out infinite alternate}.mm .day.big{grid-column:span 2}
.mm .go{--k:12px;--hc:var(--gold);width:100%;padding:14px;cursor:pointer;font:400 1.05rem var(--f-sign);color:#fff;text-shadow:0 0 10px var(--gold)}
.mm .go[disabled]{--hc:#5a5280;color:var(--dim);text-shadow:none;cursor:default}
.mm .x{--k:8px;--hc:#7a7aa0;padding:9px 18px;cursor:pointer;font:400 .72rem var(--f-sign);color:#fff}
.mm canvas.sp{width:min(78vw,300px);height:min(78vw,300px)}
.mm .packs{display:grid;gap:8px;width:100%}
.mm .pack{--k:12px;--hc:var(--gold);display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:12px;cursor:pointer;text-align:left}
.mm .pack i{width:42px;height:28px;background:var(--barimg) center/contain no-repeat;filter:drop-shadow(0 0 6px #ffc84588)}
.mm .pack b{font:700 1.05rem var(--f-mono);color:#fff}.mm .pack em{display:block;font:400 .52rem var(--f-mono);font-style:normal;letter-spacing:.1em;color:var(--gold)}
.mm .pack span{font:400 .85rem var(--f-sign);color:#fff;padding:7px 10px;background:#ffc84522;border:1px solid var(--gold);border-radius:8px}
.mm .note{font:400 .58rem/1.5 var(--f-mono);letter-spacing:.06em;color:#ff9ad6}
.mm .won{font:400 2.2rem/1 var(--f-sign);color:#fff;text-shadow:0 0 18px var(--gold)}
.mn-home{--k:7px}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const el = document.createElement("div"); el.className = "mn"; el.innerHTML = '<div class="stars"></div><div class="top"></div><div class="body"></div><div class="foot"></div>'; document.body.appendChild(el);
  const top = el.querySelector(".top"), body = el.querySelector(".body"), foot = el.querySelector(".foot");
  const svg = (p, vb = "0 0 24 24") => `<svg viewBox="${vb}" aria-hidden="true">${p}</svg>`;
  const BACK = svg('<path d="M15 5l-7 7 7 7"/>');
  let open = true, screen = "home";
  const bal = () => `<div class="bal holo"><i></i><span>${W.get().toLocaleString()}</span></div>`;
  const nextIn = () => { const n = new Date(); n.setHours(24, 0, 0, 0); const m = Math.ceil((n - new Date()) / 6e4); return `${Math.floor(m / 60)}h ${m % 60}m`; };
  const rewardReady = () => load().claim !== today(), spinReady = () => load().spin !== today();
  function streakDay() { const d = load(); if (!d.claim) return 0; const gap = dayDiff(d.claim, today()); return gap === 0 ? (d.streak - 1) % 7 : gap === 1 ? d.streak % 7 : 0; }   // which day (0…6) is up next
  // ---- the home screen ----
  function home() { screen = "home"; body.style.alignContent = "";
    top.innerHTML = bal() + `<span></span>`;
    body.innerHTML = `<div class="logo"><b>ALIEN</b><i>Casino</i></div>
      <button class="big holo" id="mnEnter">ENTER THE CASINO<small>walk the floor &middot; 3D</small></button>
      <div class="grid2">
        <button class="tile holo" id="mnQuick" style="--hc:#5fe8ff">${svg('<path d="M5 3l14 9-14 9z"/>')}QUICK PLAY<small>straight to a game</small></button>
        <button class="tile holo" id="mnSpin" style="--hc:#ff5fae">${svg('<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/><path d="M12 1l2 3h-4z"/>')}DAILY SPIN<small>${spinReady() ? "ready!" : "next in " + nextIn()}</small>${spinReady() ? '<span class="dot"></span>' : ""}</button>
        <button class="tile holo" id="mnDaily" style="--hc:#7dff9a">${svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>')}DAILY REWARD<small>${rewardReady() ? "claim now!" : "next in " + nextIn()}</small>${rewardReady() ? '<span class="dot"></span>' : ""}</button>
        <button class="tile holo" id="mnStore" style="--hc:#ffc845">${svg('<path d="M4 8h16l-1.5 12h-13z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>')}STORE<small>get more bars</small></button>
      </div>`;
    foot.textContent = "A TRAVELLING CASINO · SOMEWHERE PAST JUPITER";
    $m("mnEnter").onclick = () => { hide(); enterCasino(); }; $m("mnQuick").onclick = quick; $m("mnSpin").onclick = dailySpin; $m("mnDaily").onclick = dailyReward; $m("mnStore").onclick = store; }
  // ---- quick play: every game as a card; opens it straight away ----
  function quick() { screen = "quick"; body.style.alignContent = "start";
    top.innerHTML = `<div class="head"><button class="back holo" id="mnBack" aria-label="Back">${BACK}</button><h2>QUICK PLAY</h2></div>` + bal();
    body.innerHTML = `<div class="games">${GAMES.map(g => `<button class="gcard holo" data-id="${g.id}" style="--gc:${g.col}">${svg(ICON[g.id] || ICON.slot)}<b>${g.name}</b><small>${g.kind}</small></button>`).join("")}</div>`;
    foot.textContent = "";
    $m("mnBack").onclick = home; body.querySelectorAll(".gcard").forEach(b => b.onclick = () => openGame(GAMES.find(g => g.id === b.dataset.id), null)); }
  const $m = id => document.getElementById(id);
  function modal(hc, html) { const m = document.createElement("div"); m.className = "mm"; m.innerHTML = `<div class="box holo" style="--hc:${hc}">${html}</div>`; document.body.appendChild(m);
    m.addEventListener("click", e => { if (e.target === m) close(); }); const close = () => { m.remove(); refresh(); }; return { m, close, q: s => m.querySelector(s) }; }
  function award(n) { W.set(W.get() + n); refresh(); }
  // ---- daily reward: a 7-day streak; miss a day and it starts again from day 1 ----
  function dailyReward() { const ready = rewardReady(), day = streakDay();
    const md = modal("#7dff9a", `<h3>DAILY REWARD</h3><p>${ready ? "Come back every day: the rewards grow, and day 7 is a big one." : "Already claimed today. Next reward in " + nextIn() + "."}</p>
      <div class="days">${REWARDS.map((r, i) => `<div class="day holo ${i < day || (!ready && i === day) ? "got" : ""} ${ready && i === day ? "now" : ""} ${i === 6 ? "big" : ""}">DAY ${i + 1}<i></i><b>${r.toLocaleString()}</b></div>`).join("")}</div>
      <button class="go holo" id="mmClaim" ${ready ? "" : "disabled"}>${ready ? "CLAIM " + REWARDS[day].toLocaleString() : "COME BACK TOMORROW"}</button><button class="x holo" id="mmX">CLOSE</button>`);
    md.q("#mmX").onclick = md.close;
    md.q("#mmClaim").onclick = () => { if (!rewardReady()) return; const d = load(), gap = d.claim ? dayDiff(d.claim, today()) : 9; d.streak = gap === 1 ? (d.streak || 0) + 1 : 1; d.claim = today(); save(d);
      const n = REWARDS[(d.streak - 1) % 7]; award(n); md.q(".box").innerHTML = `<h3>DAY ${((d.streak - 1) % 7) + 1}</h3><div class="won">+${n.toLocaleString()}</div><p>bars added. See you tomorrow!</p><button class="x holo" id="mmX2">NICE</button>`; md.q("#mmX2").onclick = md.close; }; }
  // ---- daily spin: one free spin of a prize wheel a day ----
  function dailySpin() { const ready = spinReady();
    const md = modal("#ff5fae", `<h3>DAILY SPIN</h3><canvas class="sp" width="600" height="600"></canvas><p id="mmMsg">${ready ? "One free spin every day." : "Already spun today. Next spin in " + nextIn() + "."}</p>
      <button class="go holo" id="mmGo" style="--hc:#ff5fae" ${ready ? "" : "disabled"}>${ready ? "SPIN!" : "COME BACK TOMORROW"}</button><button class="x holo" id="mmX">CLOSE</button>`);
    const cv = md.q("canvas"), g = cv.getContext("2d"), N = SPIN.length, seg = Math.PI * 2 / N; let ang = 0, busy = false;
    function draw(tick) { g.clearRect(0, 0, 600, 600); g.save(); g.translate(300, 310); g.rotate(ang);
      for (let i = 0; i < N; i++) { const [v, , c] = SPIN[i], a0 = -Math.PI / 2 - seg / 2 + i * seg; const gr = g.createRadialGradient(0, 0, 40, 0, 0, 250); gr.addColorStop(0, "#120a2c"); gr.addColorStop(1, c);
        g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 250, a0, a0 + seg); g.closePath(); g.fill(); g.strokeStyle = "#ffc845"; g.lineWidth = 4; g.stroke();
        g.save(); g.rotate(a0 + seg / 2 + Math.PI / 2); g.fillStyle = "#fff"; g.shadowColor = "#000"; g.shadowBlur = 8; g.textAlign = "center"; g.font = '400 44px "Bungee",Impact,sans-serif'; g.fillText(v >= 1000 ? (v / 1000) + "K" : v, 0, -170); g.restore(); }
      g.beginPath(); g.arc(0, 0, 250, 0, 7); g.lineWidth = 12; g.strokeStyle = "#cfd3e6"; g.stroke();
      for (let i = 0; i < N * 2; i++) { const a = i / (N * 2) * Math.PI * 2; g.fillStyle = (i + (tick || 0)) % 2 ? "#ffc845" : "#ff5fae"; g.beginPath(); g.arc(Math.cos(a) * 262, Math.sin(a) * 262, 7, 0, 7); g.fill(); }
      g.restore(); g.save(); g.translate(300, 310); const hub = g.createRadialGradient(-10, -10, 4, 0, 0, 46); hub.addColorStop(0, "#c8fbff"); hub.addColorStop(1, "#1a6aff"); g.fillStyle = hub; g.beginPath(); g.arc(0, 0, 44, 0, 7); g.fill(); g.restore();
      g.fillStyle = "#ffc845"; g.shadowColor = "#ffc845"; g.shadowBlur = 14; g.beginPath(); g.moveTo(300, 92); g.lineTo(282, 40); g.lineTo(318, 40); g.closePath(); g.fill(); g.shadowBlur = 0; }
    draw(0);
    md.q("#mmX").onclick = () => { if (!busy) md.close(); };
    md.q("#mmGo").onclick = () => { if (busy || !spinReady()) return; busy = true; md.q("#mmGo").disabled = true;
      let r = Math.random(), k = 0; for (let i = 0; i < N; i++) { if (r < SPIN[i][1]) { k = i; break; } r -= SPIN[i][1]; }
      const d = load(); d.spin = today(); save(d);                                 // spent the moment it starts, so closing the app mid-spin can't reroll it
      const from = ang, start = performance.now(), dur = 5200;
      const end = from - (((from + k * seg) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI * 2 * 6 + (Math.random() - .5) * seg * .7;
      (function step(now) { const u = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - u, 4); ang = from + (end - from) * e; draw(Math.floor(now / 120));
        if (u < 1) return requestAnimationFrame(step);
        const v = SPIN[k][0]; award(v); md.q("#mmMsg").innerHTML = `<span class="won">+${v.toLocaleString()}</span>`; md.q("#mmGo").textContent = "COME BACK TOMORROW"; busy = false; })(start); }; }
  // ---- the store: bar packs. Test mode: nothing is charged; real purchases come with the app-store version ----
  function store() { const md = modal("#ffc845", `<h3>STORE</h3><p>Top up your gold bars.</p><div class="packs">${PACKS.map((p, i) => `<button class="pack holo" data-i="${i}"><i></i><div><b>${p.bars.toLocaleString()}</b>${p.tag ? `<em>${p.tag}</em>` : ""}</div><span>${p.price}</span></button>`).join("")}</div>
      <p class="note">TEST MODE &mdash; NO MONEY IS CHARGED. Tapping a pack just adds the bars, so we can try the flow. Real purchases come with the App Store / Google Play version.</p><button class="x holo" id="mmX">CLOSE</button>`);
    md.q("#mmX").onclick = md.close;
    md.m.querySelectorAll(".pack").forEach(b => b.onclick = () => { const p = PACKS[+b.dataset.i];
      md.q(".box").innerHTML = `<h3>${p.bars.toLocaleString()} BARS</h3><p>${p.price} &middot; test mode, nothing is charged</p><button class="go holo" id="mmBuy">CONFIRM</button><button class="x holo" id="mmNo">CANCEL</button>`;
      md.q("#mmNo").onclick = () => { md.close(); store(); };
      md.q("#mmBuy").onclick = () => { award(p.bars); md.q(".box").innerHTML = `<h3>THANK YOU!</h3><div class="won">+${p.bars.toLocaleString()}</div><p>bars added</p><button class="x holo" id="mmOk">DONE</button>`; md.q("#mmOk").onclick = md.close; }; }); }
  function refresh() { if (!open) return; if (screen === "home") home(); else { const b = top.querySelector(".bal span"); if (b) b.textContent = W.get().toLocaleString(); } }
  function show() { open = true; el.hidden = false; home(); }
  function hide() { open = false; el.hidden = true; }
  addEventListener("storage", refresh);
  home();
  // the first time each day, the reward pops up by itself
  if (rewardReady()) setTimeout(() => { if (open && screen === "home" && !document.querySelector(".mm")) dailyReward(); }, 700);
  return { show, hide, refresh, get open() { return open; }, store };
})();
