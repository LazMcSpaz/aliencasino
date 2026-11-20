// The front of the app: a title menu shown before the 3D casino loads, with Quick Play (open any game straight away, no casino),
// a Daily Reward (a 7-day login streak), a Daily Spin (one free prize-wheel spin a day) and a Store (bar packs; test mode until the app-store version).
// The backdrop is a quiet canvas: a deep gradient, slow nebula glows and drifting stars (no drawn pictures).
// May use: GAMES, openGame, window.__alienWallet, Music, enterCasino, ART (all from lobby.src.html). Must not: touch the 3D scene.
const MENU = (() => {
  const W = window.__alienWallet, KEY = "alien-casino-daily";
  const today = () => new Date().toLocaleDateString("en-CA");                       // YYYY-MM-DD in the player's own time zone
  const dayDiff = (a, b) => Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / 864e5);
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };
  const REWARDS = [100, 150, 200, 300, 400, 500, 1000];                              // day 1…7 of a streak; day 7 is the big one, then it starts over
  // the daily spin's prizes, how often each comes up (chances add to 1; about 270 bars on average), and their colours
  const SPIN = [[100, .26, "#3fb8ff"], [50, .2, "#7a86a8"], [250, .16, "#9a52ff"], [150, .2, "#ff4fae"], [500, .1, "#3fd17a"], [100, 0, "#3fb8ff"], [1000, .06, "#ffb020"], [2500, .02, "#ff6a3a"]];
  const PACKS = [{ bars: 1000, price: "$0.99", n: 1, sub: "STARTER" }, { bars: 5500, price: "$4.99", n: 2, sub: "+10% BONUS" }, { bars: 12000, price: "$9.99", n: 3, sub: "+20% BONUS" },
    { bars: 30000, price: "$19.99", n: 5, sub: "+50% BONUS", best: true }, { bars: 80000, price: "$49.99", n: 7, sub: "+60% BONUS" }];
  const ICON = { slot: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 5v14M15 5v14"/><circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
    pyramid: '<path d="M12 3l9 17H3z"/><path d="M7.5 11.5h9M5 16h14"/>', asteroid: '<path d="M5 9l4-5 7 1 4 6-2 7-7 2-5-4z"/><circle cx="10" cy="10" r="1.4"/><circle cx="14" cy="15" r="1.1"/>',
    gravity: '<path d="M12 12m-1 0a1 1 0 1 0 2 0a3 3 0 1 0-6 0a5 5 0 1 0 10 0a7 7 0 1 0-14 0a9 9 0 1 0 18 0"/>', moons: '<circle cx="8" cy="12" r="5"/><circle cx="17" cy="9" r="3"/>',
    warp: '<path d="M12 2c3 3 4 7 3 12h-6C8 9 9 5 12 2z"/><path d="M9 14l-3 4h4M15 14l3 4h-4M11 18l1 4 1-4"/>', wheel: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/><circle cx="12" cy="12" r="2"/>',
    pusher: '<rect x="3" y="14" width="18" height="6" rx="1"/><path d="M5 14l2-4h4l1 4M12 14l2-3h4l1 3"/>' };
  const css = `
.mn{position:fixed;inset:0;z-index:40;overflow:hidden;background:#05030c;display:grid;grid-template-rows:auto 1fr auto;
  padding:calc(14px + env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) calc(16px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));box-sizing:border-box}
.mn canvas.sky{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.mn canvas.peek{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0;transition:opacity .25s}.mn canvas.peek.on{opacity:1}.mn canvas.peek.front{z-index:2}
.mn::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 80% at 50% 50%,transparent 55%,#000a)}
.mn > :not(canvas){position:relative;z-index:1}
.mn .top{display:flex;justify-content:space-between;align-items:center;min-height:44px}
.mn .bal{--k:9px;--hc:var(--gold);display:flex;align-items:center;gap:8px;padding:7px 13px 7px 9px;font:700 1.05rem var(--f-mono);color:#fff;text-shadow:0 0 8px #ffc84588}
.mn .bal i{width:28px;height:19px;background:var(--barimg) center/contain no-repeat;filter:drop-shadow(0 0 5px #ffc845aa)}
.mn .bal.bump{animation:mnbump .5s ease-out}
@keyframes mnbump{30%{transform:scale(1.15);filter:brightness(1.6)}}
.mn .body{display:grid;align-content:center;justify-items:center;gap:14px;min-height:0;overflow:auto;padding:4px 0}
.mn .page{display:grid;justify-items:center;gap:14px;width:100%;animation:mnin .45s cubic-bezier(.2,.9,.3,1) both}
@keyframes mnin{from{opacity:0;transform:translateY(14px) scale(.98)}}
.mn .logo{position:relative;text-align:center;margin:4px 0 10px;animation:mnfloat 5s ease-in-out infinite}
@keyframes mnfloat{50%{transform:translateY(-6px)}}
.mn .logo b{display:block;font:400 3.4rem/1 "Monoton",var(--f-sign);letter-spacing:.02em;color:#fbf4ff;text-shadow:0 0 4px #fff,0 0 14px #c89cff,0 0 34px #8a4dff,0 0 70px #6a2dff;animation:mnflick 7s infinite}
.mn .logo i{display:block;margin-top:-10px;font:400 2.7rem/1 "Yellowtail",cursive;color:#fff1d0;text-shadow:0 0 6px #fff4,0 0 16px #ffc845,0 0 36px #ff8a3a}
.mn .logo::after{content:"";display:block;margin:10px auto 0;width:70%;height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,#5fe8ff,#ff4fae,transparent);box-shadow:0 0 12px #5fe8ff}
@keyframes mnflick{0%,90%,100%{opacity:1}91%{opacity:.35}92.5%{opacity:1}94%{opacity:.55}95%{opacity:1}}
.mn .tag{font:400 .6rem var(--f-mono);letter-spacing:.28em;color:#c8b8ff;text-transform:uppercase;margin-top:-6px}
.mn .big{--k:16px;--hc:var(--gold);position:relative;overflow:hidden;width:min(88vw,340px);padding:17px 16px 15px;font:400 1.25rem/1 var(--f-sign);color:#fff;text-shadow:0 0 12px var(--gold);cursor:pointer;
  background:linear-gradient(180deg,#ffc84540,#ff8a3a1c),#120a26e6;animation:mnpulse 1.6s ease-in-out infinite alternate}
.mn .big::before{content:"";position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(100deg,transparent,#fff5,transparent);animation:mnshine 3.2s ease-in-out infinite}
@keyframes mnshine{0%,55%{left:-60%}100%{left:130%}}
.mn .big small{display:block;margin-top:6px;font:400 .58rem var(--f-mono);letter-spacing:.16em;color:#ffe9b0;text-shadow:none}
@keyframes mnpulse{to{box-shadow:inset 0 0 0 1px var(--hc),inset 0 0 34px color-mix(in srgb,var(--hc) 35%,transparent),0 0 22px color-mix(in srgb,var(--hc) 40%,transparent)}}
.mn .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:min(88vw,340px)}
.mn .tile{--k:13px;position:relative;padding:14px 8px 12px;cursor:pointer;display:grid;justify-items:center;gap:7px;font:400 .82rem var(--f-sign);color:#fff;transition:transform .15s}
.mn .tile:active,.mn .gcard:active,.mm .pack:active,.mn .big:active{transform:scale(.96)}
.mn .tile .ic{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--hc) 45%,transparent),color-mix(in srgb,var(--hc) 8%,transparent) 70%);box-shadow:0 0 0 1px color-mix(in srgb,var(--hc) 60%,transparent),0 0 18px color-mix(in srgb,var(--hc) 35%,transparent)}
.mn .tile svg{width:24px;height:24px;fill:none;stroke:#fff;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 5px var(--hc))}
.mn .tile small{font:400 .55rem var(--f-mono);letter-spacing:.08em;color:var(--dim)}
.mn .tile.ready small{color:#fff;text-shadow:0 0 8px var(--hc)}
.mn .tile.ready .ic{animation:mnring 1.2s ease-in-out infinite}
@keyframes mnring{50%{box-shadow:0 0 0 1px var(--hc),0 0 0 7px color-mix(in srgb,var(--hc) 18%,transparent),0 0 26px var(--hc)}}
.mn .tile.half{grid-template-columns:auto 1fr;justify-items:start;align-items:center;gap:9px;padding:9px 10px;font-size:.66rem;text-align:left}
.mn .tile.half .ic{width:30px;height:30px}.mn .tile.half svg{width:16px;height:16px}
.mn .tile.half .tx{display:grid;gap:3px}.mn .tile.half small{font:700 .58rem var(--f-mono);letter-spacing:.1em}
.mn .tile.half .dot{top:-6px;right:6px}
.mn .tile.off{filter:grayscale(1) brightness(.75);opacity:.7}.mn .tile.off small{color:#c8c4dc}
.mn .dot{z-index:3;position:absolute;top:8px;right:10px;padding:2px 6px;border-radius:9px;background:#ff4d6d;color:#fff;font:700 .5rem var(--f-mono);letter-spacing:.06em;box-shadow:0 0 10px #ff4d6d;animation:mnpulse2 .8s ease-in-out infinite alternate}
@keyframes mnpulse2{to{transform:scale(1.12)}}
.mn .foot{text-align:center;font:400 .56rem var(--f-mono);letter-spacing:.18em;color:#8a7fb0}
.mn .head{display:flex;align-items:center;gap:10px}
.mn .back{--k:8px;width:42px;height:42px;cursor:pointer;display:grid;place-items:center;padding:0}
.mn .back svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.mn h2{margin:0;font:400 1.2rem var(--f-sign);color:#fff;text-shadow:0 0 12px var(--holo2)}
.mn .games{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:440px;padding-top:6px}
.mn .gcard{--k:14px;--hc:var(--gc);position:relative;overflow:hidden;aspect-ratio:1/.92;padding:12px;cursor:pointer;display:grid;align-content:end;justify-items:start;gap:3px;text-align:left;transition:transform .15s;
  background:radial-gradient(90% 70% at 70% 25%,color-mix(in srgb,var(--gc) 38%,transparent),transparent 70%),linear-gradient(180deg,#0c0a22e6,#06051ae6);animation:mnin .45s cubic-bezier(.2,.9,.3,1) both}
.mn .gcard .art{position:absolute;right:-12%;top:-10%;width:78%;height:78%;fill:none;stroke:var(--gc);stroke-width:1.1;stroke-linecap:round;stroke-linejoin:round;opacity:.5;filter:drop-shadow(0 0 10px var(--gc));animation:mndrift 6s ease-in-out infinite alternate}
.mn .gcard:nth-child(2n) .art{animation-delay:-3s}
@keyframes mndrift{to{transform:rotate(-8deg) scale(1.06)}}
.mn .gcard .ico{width:30px;height:30px;fill:none;stroke:#fff;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 6px var(--gc));margin-bottom:4px}
.mn .gcard b{font:400 .86rem/1.1 var(--f-sign);color:#fff;text-shadow:0 0 10px color-mix(in srgb,var(--gc) 70%,transparent);padding-right:30px}
.mn .gcard small{font:400 .56rem/1.2 var(--f-mono);letter-spacing:.06em;color:#b8b0d8;padding-right:30px}
.mn .gcard .play{position:absolute;right:10px;bottom:10px;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--gc);box-shadow:0 0 12px var(--gc)}
.mn .gcard .play svg{width:11px;height:11px;fill:#0a0618}
.mm{position:fixed;inset:0;z-index:50;display:grid;place-items:center;background:radial-gradient(circle,#0a0420c0,#000e);padding:16px;animation:mmfade .25s both}
@keyframes mmfade{from{opacity:0}}
.mm .box{--k:18px;position:relative;box-sizing:border-box;width:min(100%,372px);max-height:90dvh;overflow:auto;padding:22px 16px 16px;background:linear-gradient(180deg,color-mix(in srgb,var(--hc) 16%,#0a0a1e),#08081af5);display:grid;gap:12px;justify-items:center;text-align:center;animation:mmpop .4s cubic-bezier(.2,1.4,.4,1) both}
@keyframes mmpop{from{opacity:0;transform:scale(.85) translateY(10px)}}
.mm .box::before{content:"";position:absolute;left:18%;right:18%;top:0;height:3px;background:linear-gradient(90deg,transparent,var(--hc),transparent);box-shadow:0 0 14px var(--hc)}
.mm h3{margin:0;font:400 1.35rem var(--f-sign);color:#fff;text-shadow:0 0 14px var(--hc)}
.mm p{margin:0;font:500 .85rem/1.4 var(--f-tech);color:#b8b0d8}
.mm .days{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;width:100%}
.mm .day{--k:9px;--hc:#4a4270;position:relative;padding:9px 2px 8px;display:grid;gap:4px;justify-items:center;font:400 .5rem var(--f-mono);letter-spacing:.12em;color:#8a80b0}
.mm .day b{font:700 .92rem var(--f-mono);color:#fff}.mm .day i{width:24px;height:16px;background:var(--barimg) center/contain no-repeat}
.mm .day.got{--hc:#3fd17a}
.mm .day.got::after{content:"";position:absolute;inset:0;z-index:3;background:#05101099 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M5 12l5 5 9-10' fill='none' stroke='%237dff9a' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/26px no-repeat}
.mm .day.now{--hc:var(--gold);animation:mnpulse 1s ease-in-out infinite alternate;transform:scale(1.05)}
.mm .day.big{grid-column:span 2}.mm .day.big i{width:40px;height:26px;filter:drop-shadow(0 0 8px #ffc845)}
.mm .go{--k:13px;--hc:var(--gold);position:relative;overflow:hidden;width:100%;padding:15px;cursor:pointer;font:400 1.1rem var(--f-sign);color:#fff;text-shadow:0 0 10px var(--hc);background:linear-gradient(180deg,color-mix(in srgb,var(--hc) 35%,transparent),color-mix(in srgb,var(--hc) 10%,transparent)),#0c0a20}
.mm .go:not([disabled])::before{content:"";position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(100deg,transparent,#fff5,transparent);animation:mnshine 2.6s ease-in-out infinite}
.mm .go[disabled]{--hc:#4a4270;color:#8a80b0;text-shadow:none;cursor:default}
.mm .x{--k:8px;--hc:#6a6a90;padding:9px 20px;cursor:pointer;font:400 .72rem var(--f-sign);color:#fff}
.mm canvas.sp{width:min(80vw,310px);height:min(80vw,310px)}
.mm .packs{display:grid;gap:8px;width:100%}
.mm .pack{--k:13px;--hc:#c8a040;position:relative;display:grid;grid-template-columns:62px 1fr auto;gap:10px;align-items:center;padding:12px 12px 12px 10px;cursor:pointer;text-align:left;transition:transform .15s}
.mm .pack.best{--hc:var(--gold);background:linear-gradient(90deg,#ffc84533,#ff8a3a18),#0c0a20;animation:mnpulse 1.2s ease-in-out infinite alternate}
.mm .pile{position:relative;width:62px;height:40px}
.mm .pile i{position:absolute;width:34px;height:22px;background:var(--barimg) center/contain no-repeat;filter:drop-shadow(0 2px 3px #000a) drop-shadow(0 0 4px #ffc84566)}
.mm .pack b{font:700 1.08rem var(--f-mono);color:#fff}.mm .pack em{display:block;font:400 .54rem var(--f-mono);font-style:normal;letter-spacing:.12em;color:var(--gold)}
.mm .pack span{font:400 .86rem var(--f-sign);color:#1a1030;padding:8px 11px;background:linear-gradient(180deg,#ffe08a,#ffb020);border-radius:9px;box-shadow:0 0 12px #ffc84566,inset 0 -2px 0 #0003}
.mm .pack span.ribbon{position:absolute;top:0;right:14px;padding:2px 8px;background:#ff4d6d;color:#fff;font:700 .5rem var(--f-mono);letter-spacing:.12em;border-radius:0 0 6px 6px;box-shadow:0 0 10px #ff4d6d}
.mm .note{font:400 .58rem/1.55 var(--f-mono);letter-spacing:.05em;color:#ff9ad6;padding:8px 10px;border:1px dashed #ff9ad666;border-radius:8px}
.mm .won{font:400 2.6rem/1 var(--f-sign);color:#fff;text-shadow:0 0 20px var(--gold),0 0 4px #fff}
.mm .won i{display:inline-block;width:46px;height:30px;margin-right:8px;vertical-align:-4px;background:var(--barimg) center/contain no-repeat;filter:drop-shadow(0 0 8px #ffc845)}
.mm canvas.conf{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2}
.mm .box.glass{clip-path:none;border-radius:28px;background:linear-gradient(180deg,#141028,#0a0816);box-shadow:inset 0 0 0 1px #2e2752,inset 0 0 50px #000,0 0 70px -24px var(--hc),0 20px 50px #000a;padding:18px 14px 16px}
.mm .box.glass::before{display:none}
.mm .box.glass::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:.3;background:repeating-linear-gradient(0deg,#ffffff06 0 1px,transparent 1px 3px)}
.mm .nt{position:relative;line-height:1;text-align:center;margin:-2px 0 -4px}
.mm .nt i{display:block;font:400 1.9rem/1 "Yellowtail",cursive;color:#fff3c8;text-shadow:0 0 4px #fff8,0 0 12px #ffd23f,0 0 26px #ff8a3a;margin-bottom:-8px;transform:rotate(-6deg) translateX(-34px)}
.mm .nt b{display:block;font:400 2.6rem/1 "Monoton",var(--f-sign);color:#f4ffe6;text-shadow:0 0 3px #fff,0 0 10px #b8ff3d,0 0 26px #7dff3a,0 0 48px #3d9a00;letter-spacing:.04em}
.mm .wheelwrap{position:relative;width:min(84vw,320px);aspect-ratio:680/700}
.mm .wheelwrap canvas.sp{width:100%;height:100%}
.mm .rd{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:10px;width:100%;margin-top:-4px}
.mm .rdb{border-radius:14px;padding:8px 6px;background:#000;box-shadow:inset 0 0 0 1px #2e2752,inset 0 0 18px #000;display:grid;gap:3px;justify-items:center}
.mm .rdb small{font:700 .52rem var(--f-tech);letter-spacing:.18em;color:#9a92c7}
.mm .rdb b{font:700 1.02rem var(--f-tech);color:#f1edff;letter-spacing:.04em;white-space:nowrap}
.mm .rdb b i{display:inline-block;width:20px;height:13px;margin-right:4px;vertical-align:-1px;background:var(--barimg) center/contain no-repeat}
.mm .rdb.hit{box-shadow:inset 0 0 0 1.5px #b8ff3d,inset 0 0 22px #b8ff3d33,0 0 18px -4px #b8ff3d}.mm .rdb.hit b{color:#e9ffd0;text-shadow:0 0 10px #b8ff3d}
.mm .spinbtn{position:relative;display:grid;place-items:center}
.mm .spinbtn::before{content:"";position:absolute;width:150%;height:150%;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,#b8ff3d70,transparent);animation:mmbreathe 2.4s ease-in-out infinite}
.mm .spinbtn:has(.bigspin:disabled)::before{opacity:0;animation:none}
.mm .spinbtn.on::before{opacity:1;animation:mmbreathe .5s ease-in-out infinite}
@keyframes mmbreathe{50%{opacity:.35}}
.mm .bigspin{position:relative;z-index:1;width:96px;height:96px;border-radius:50%;border:0;cursor:pointer;font:700 1.1rem/1.05 var(--f-tech);letter-spacing:.14em;color:#112000;
  background:radial-gradient(circle at 35% 30%,#eaffb8,#b8ff3d 45%,#5f9a00);box-shadow:0 6px 0 #3d6400,inset 0 -6px 14px #0004,inset 0 4px 10px #fff8,0 0 0 5px #0c0a1a,0 0 0 6px #2e2752,0 0 34px -6px #b8ff3d;transition:transform .08s,box-shadow .08s,filter .2s}
.mm .bigspin small{display:block;font:700 .62rem var(--f-tech);letter-spacing:.08em;opacity:.75}
.mm .bigspin:active:not(:disabled){transform:translateY(5px);box-shadow:0 1px 0 #3d6400,inset 0 -6px 14px #0004,inset 0 4px 10px #fff8,0 0 0 5px #0c0a1a,0 0 0 6px #2e2752}
.mm .bigspin:disabled{filter:grayscale(.85) brightness(.5);cursor:default}
.mm .spinbtn.on .bigspin{filter:none;animation:mmspinpulse .4s ease-in-out infinite alternate}
@keyframes mmspinpulse{to{box-shadow:0 6px 0 #3d6400,inset 0 -6px 14px #0004,inset 0 4px 10px #fff8,0 0 0 5px #0c0a1a,0 0 0 6px #b8ff3d,0 0 44px 0 #b8ff3d}}
.mm .msg{min-height:1.2em;font:600 .82rem var(--f-tech);color:#9a92c7}
.mm .box.glass .x{clip-path:none;border:0;border-radius:999px;padding:8px 20px;background:#1d1838;box-shadow:inset 0 0 0 1px #2e2752;font:700 .7rem var(--f-tech);letter-spacing:.14em;color:#9a92c7}
.mm .box.glass .day{clip-path:none;border-radius:12px;background:#000;box-shadow:inset 0 0 0 1px #2e2752,inset 0 0 14px #000}
.mm .box.glass .day::after{border-radius:inherit}
.mm .box.glass .day.got{box-shadow:inset 0 0 0 1px #3fd17a88}
.mm .box.glass .day.now{box-shadow:inset 0 0 0 1.5px #ffd23f,inset 0 0 18px #ffd23f33,0 0 16px -4px #ffd23f;animation:none;transform:none}
.mm .box.glass .go{clip-path:none;border:0;border-radius:999px;padding:14px;color:#2a1600;text-shadow:none;font:700 1rem var(--f-tech);letter-spacing:.14em;
  background:radial-gradient(120% 140% at 35% 20%,#fff3c0,#ffd23f 45%,#c88a00);box-shadow:0 5px 0 #7a5400,inset 0 -5px 12px #0003,inset 0 3px 8px #fff8,0 0 30px -8px #ffd23f}
.mm .box.glass .go:active:not([disabled]){transform:translateY(4px);box-shadow:0 1px 0 #7a5400,inset 0 -5px 12px #0003,inset 0 3px 8px #fff8}
.mm .box.glass .go[disabled]{filter:grayscale(.9) brightness(.5)}
.mm .box.glass .go::before{display:none}
.mm .box.glass .pack{clip-path:none;border:0;border-radius:16px;background:#000;box-shadow:inset 0 0 0 1px #2e2752,inset 0 0 18px #000}
.mm .box.glass .pack.best{box-shadow:inset 0 0 0 1.5px #ffd23f,inset 0 0 22px #ffd23f22,0 0 18px -6px #ffd23f;animation:none}
.mm .box.glass .note{border-radius:12px}
.mn.boarding > :not(canvas){opacity:0;transition:opacity .45s}
.intro{position:fixed;inset:0;z-index:55;overflow:hidden;pointer-events:all}
.intro .ibeam{position:absolute;top:-2%;left:50%;width:140vw;height:104%;translate:-50% 0;clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);mix-blend-mode:screen;opacity:0;
  background:linear-gradient(180deg,#eafff0f0,#9dffb8a0 35%,#7dff9a40 75%,#7dff9a00),repeating-linear-gradient(90deg,#ffffff00 0 22px,#ffffff14 22px 26px);transform-origin:50% 0;transform:scaleY(0);transition:opacity .3s}
.intro.beam .ibeam{opacity:1;transform:none;animation:ibeamOn .5s cubic-bezier(.2,1.2,.4,1) both,ibeamPulse .22s .5s ease-in-out infinite alternate}
@keyframes ibeamOn{from{transform:scaleY(0);opacity:0}to{transform:none;opacity:1}}
@keyframes ibeamPulse{to{opacity:.78;filter:brightness(1.25)}}
.intro .isrc{position:absolute;top:-70px;left:50%;width:340px;height:150px;translate:-50% 0;border-radius:50%;background:radial-gradient(closest-side,#fff,#c8ffd8 35%,#7dff9a55 65%,transparent);opacity:0;transition:opacity .3s}
.intro.beam .isrc{opacity:1}
.intro .ip{position:absolute;bottom:-10px;width:var(--s);height:var(--s);border-radius:50%;background:#eafff0;box-shadow:0 0 8px #7dff9a,0 0 2px #fff;opacity:0;animation:irise var(--d) linear infinite;animation-play-state:paused}
.intro.beam .ip{animation-play-state:running}
@keyframes irise{from{transform:translateY(0);opacity:0}15%{opacity:1}to{transform:translateY(-105vh);opacity:.2}}
.intro .ibw{position:absolute;inset:0;transition:opacity 1s ease-in}.intro.beamout .ibw{opacity:0}.intro.black .ibw{visibility:hidden}
.intro .idoor{position:absolute;top:0;bottom:0;width:50.5%;background:#000;opacity:0;transition:transform 1.15s cubic-bezier(.75,0,.2,1)}
.intro .idoor.l{left:0}.intro .idoor.r{right:0}
.intro.black .idoor{opacity:1}
.intro .idoor.l::after,.intro .idoor.r::after{content:"";position:absolute;top:0;bottom:0;width:2px;background:linear-gradient(180deg,transparent,#5fe8ff,#b8ff3d,#5fe8ff,transparent);opacity:0;transition:opacity .25s;box-shadow:0 0 14px #5fe8ff}
.intro .idoor.l::after{right:0}.intro .idoor.r::after{left:0}
.intro.seam .idoor::after{opacity:.9}
.intro.open .idoor.l{transform:translateX(-102%)}.intro.open .idoor.r{transform:translateX(102%)}
.intro.open{pointer-events:none}
.intro .iwel{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:4px;text-align:center;opacity:0;transition:opacity .6s;z-index:2}
.intro.wel .iwel{opacity:1}.intro.textout .iwel{opacity:0;transition:opacity .8s ease-in}
.intro .iwel small{font:700 .78rem var(--f-tech);letter-spacing:.42em;color:#c8b8ff;margin-bottom:6px;margin-right:-.42em}
.intro .iwel b{font:400 3.6rem/1 "Monoton",var(--f-sign);color:#fbf4ff;text-shadow:0 0 4px #fff,0 0 14px #c89cff,0 0 34px #8a4dff,0 0 70px #6a2dff}
.intro .iwel em{font:400 2.8rem/1 "Yellowtail",cursive;font-style:normal;color:#fff1d0;margin-top:-12px;text-shadow:0 0 6px #fff4,0 0 16px #ffc845,0 0 36px #ff8a3a}
.intro.wel .iwel b{animation:iflick 1.1s steps(1) both}.intro.wel .iwel em{animation:iflick 1.1s .25s steps(1) both}
@keyframes iflick{0%{opacity:0}10%{opacity:1}14%{opacity:.2}20%{opacity:1}34%{opacity:.5}40%,100%{opacity:1}}
.mn-home{--k:7px}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const el = document.createElement("div"); el.className = "mn"; el.innerHTML = '<canvas class="sky" aria-hidden="true"></canvas><div class="top"></div><div class="body"></div><div class="foot"></div>'; document.body.appendChild(el);
  const top = el.querySelector(".top"), body = el.querySelector(".body"), foot = el.querySelector(".foot");
  const svg = (p, cls = "") => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${p}</svg>`;
  const BACK = svg('<path d="M15 5l-7 7 7 7"/>'), PLAY = '<svg viewBox="0 0 10 10"><path d="M2 1l7 4-7 4z"/></svg>';
  let open = true, screen = "home";
  const $m = id => document.getElementById(id);

  // ---- sound: little synth chimes (on when the music is on) ----
  let ac = null;
  function tone(f, d, { type = "triangle", vol = .06, at = 0, slide = 1 } = {}) { if (typeof Music !== "undefined" && !Music.wanted) return;
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide !== 1) o.frequency.exponentialRampToValueAtTime(f * slide, t + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + .02); } catch (e) {} }
  const SFX = { tap: () => tone(1400, .05, { vol: .04 }), open: () => { tone(660, .12, { vol: .04 }); tone(990, .16, { vol: .04, at: .06 }); },
    tick: () => tone(1800 + Math.random() * 300, .02, { type: "square", vol: .02 }),
    win: big => { [523, 659, 784, 1047, big ? 1319 : 0, big ? 1568 : 0].filter(Boolean).forEach((f, i) => tone(f, .25, { vol: .07, at: i * .08 })); for (let i = 0; i < 8; i++) tone(2000 + Math.random() * 1500, .05, { vol: .025, at: .3 + i * .06 }); },
    coin: () => tone(1900 + Math.random() * 500, .06, { vol: .03 }) };

  // ---- the backdrop: stars drifting toward you over slow nebula glows ----
  const sky = el.querySelector("canvas.sky"), sg = sky.getContext("2d"); let SW = 1, SH = 1, stars = [];
  function skySize() { const d = Math.min(2, devicePixelRatio || 1); SW = el.clientWidth || innerWidth; SH = el.clientHeight || innerHeight; sky.width = SW * d; sky.height = SH * d; sg.setTransform(d, 0, 0, d, 0, 0);
    stars = Array.from({ length: 170 }, () => ({ x: (Math.random() - .5) * 2, y: (Math.random() - .5) * 2, z: Math.random(), tw: Math.random() * 6 })); }
  addEventListener("resize", skySize);
  function drawSky(t) {
    const g = sg, cx = SW / 2, cy = SH * .42;
    const bg = g.createLinearGradient(0, 0, 0, SH); bg.addColorStop(0, "#0a0420"); bg.addColorStop(.55, "#160a3a"); bg.addColorStop(1, "#05030c"); g.fillStyle = bg; g.fillRect(0, 0, SW, SH);
    for (const [x, y, r, c, ph] of [[.2, .25, .55, "120,40,200", 0], [.85, .6, .5, "30,120,200", 2], [.4, .85, .45, "200,40,120", 4]]) {
      const k = .85 + .15 * Math.sin(t * .2 + ph), gr = g.createRadialGradient(x * SW, y * SH, 0, x * SW, y * SH, r * Math.max(SW, SH) * k);
      gr.addColorStop(0, `rgba(${c},.32)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(0, 0, SW, SH); }
    for (const s of stars) { s.z -= .0009; if (s.z <= .02) { s.z = 1; s.x = (Math.random() - .5) * 2; s.y = (Math.random() - .5) * 2; }
      const px = cx + s.x / s.z * SW * .35, py = cy + s.y / s.z * SH * .35; if (px < 0 || px > SW || py < 0 || py > SH) continue;
      const r = Math.max(.4, (1 - s.z) * 2.1), a = Math.min(1, (1 - s.z) * 1.6) * (.65 + .35 * Math.sin(t * 3 + s.tw)); g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.arc(px, py, r, 0, 7); g.fill(); }
  }
  // boarding: the same sky streams downward (you're being lifted), the stars blur into streaks, and it all sinks into black
  let boardT = 0, bstars = [], lastB = 0;
  function drawBoard(now) { const g = sg, k = Math.min(1, (now - boardT) / 2100), dt = Math.min(.05, (now - (lastB || now)) / 1000); lastB = now;
    const sp = 30 + 2400 * k * k, off = SH * .9 * k * k;
    g.fillStyle = "#000"; g.fillRect(0, 0, SW, SH);
    g.save(); g.translate(0, off);
    const bg = g.createLinearGradient(0, 0, 0, SH); bg.addColorStop(0, "#0a0420"); bg.addColorStop(.55, "#160a3a"); bg.addColorStop(1, "#05030c"); g.fillStyle = bg; g.fillRect(0, 0, SW, SH);
    for (const [x, y, r, c] of [[.2, .25, .55, "120,40,200"], [.85, .6, .5, "30,120,200"], [.4, .85, .45, "200,40,120"]]) { const gr = g.createRadialGradient(x * SW, y * SH, 0, x * SW, y * SH, r * Math.max(SW, SH));
      gr.addColorStop(0, `rgba(${c},.32)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(0, 0, SW, SH); }
    const fade = g.createLinearGradient(0, -SH * .05, 0, SH * .75); fade.addColorStop(0, "#000"); fade.addColorStop(.35, "rgba(0,0,0,.75)"); fade.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = fade; g.fillRect(0, -SH * .05, SW, SH * .8); g.fillStyle = "#000"; g.fillRect(0, -SH * 1.2, SW, SH * 1.15);   // deep space above: no hard top edge
    g.restore();
    g.lineCap = "round";
    for (const st of bstars) { st.y += sp * st.v * dt; if (st.y > SH + 40) { st.y -= SH + 80; st.x = Math.random() * SW; }
      const len = Math.max(st.r * 1.2, sp * st.v * .045), a = st.a * (1 - Math.max(0, k - .75) * 4);
      if (a <= 0) continue; g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = st.r; g.beginPath(); g.moveTo(st.x, st.y); g.lineTo(st.x, st.y - len); g.stroke(); }
    g.fillStyle = `rgba(0,0,0,${Math.min(1, Math.max(0, (k - .45) / .5))})`; g.fillRect(0, 0, SW, SH); }   // into complete blackness
  function startBoard() { boardT = performance.now(); lastB = 0; bstars = Array.from({ length: 200 }, () => ({ x: Math.random() * SW, y: Math.random() * SH, r: .6 + Math.random() * 1.6, v: .5 + Math.random() * .8, a: .4 + Math.random() * .6 })); }
  let raf = 0; const loop = now => { if (!open) { raf = 0; return; } if (boardT) drawBoard(now); else if (!playingGame()) drawSky(now / 1000); raf = requestAnimationFrame(loop); };
  const playingGame = () => { const gm = document.getElementById("game"); return gm && !gm.hidden; };   // don't draw the sky behind an open game
  const startSky = () => { skySize(); if (!raf) raf = requestAnimationFrame(loop); };

  const bal = () => `<div class="bal holo" id="mnBal"><i></i><span>${W.get().toLocaleString()}</span></div>`;
  const clock = () => { const n = new Date(); n.setHours(24, 0, 0, 0); const sec = Math.max(0, Math.floor((n - new Date()) / 1000)), p = v => String(v).padStart(2, "0"); return `${p(Math.floor(sec / 3600))}:${p(Math.floor(sec / 60) % 60)}:${p(sec % 60)}`; };   // time to local midnight, hh:mm:ss
  setInterval(() => { if (!open || screen !== "home") return; el.querySelectorAll("[data-timer]").forEach(t => { if (t.dataset.timer) t.textContent = clock(); });
    if ((rewardReady() && $m("mnDaily") && $m("mnDaily").classList.contains("off")) || (spinReady() && $m("mnSpin") && $m("mnSpin").classList.contains("off"))) home(); }, 1000);   // past midnight: the tiles light up again
  const nextIn = () => { const n = new Date(); n.setHours(24, 0, 0, 0); const m = Math.ceil((n - new Date()) / 6e4); return `${Math.floor(m / 60)}h ${m % 60}m`; };
  const rewardReady = () => load().claim !== today(), spinReady = () => load().spin !== today();
  function streakDay() { const d = load(); if (!d.claim) return 0; const gap = dayDiff(d.claim, today()); return gap === 0 ? (d.streak - 1) % 7 : gap === 1 ? d.streak % 7 : 0; }   // which day (0…6) is up next
  // ---- the home screen ----
  function home() { screen = "home"; body.style.alignContent = "";
    top.innerHTML = bal() + `<span></span>`;
    const tile = (id, col, icon, name, sub) => `<button class="tile holo" id="${id}" style="--hc:${col}"><span class="ic">${svg(icon)}</span>${name}<small>${sub}</small></button>`;
    const half = (id, col, icon, name, ready, badge) => `<button class="tile half holo ${ready ? "ready" : "off"}" id="${id}" style="--hc:${col}"><span class="ic">${svg(icon)}</span><span class="tx">${name}<small data-timer="${ready ? "" : id}">${ready ? "ready!" : clock()}</small></span>${ready ? `<span class="dot">${badge}</span>` : ""}</button>`;
    body.innerHTML = `<div class="page"><div class="logo"><b>ALIEN</b><i>Casino</i></div><div class="tag">win your way home</div>
      <button class="big holo" id="mnEnter">ENTER THE CASINO<small>walk the floor &middot; 3D</small></button>
      <div class="grid2">
        ${tile("mnQuick", "#5fe8ff", '<path d="M7 4l12 8-12 8z"/>', "QUICK PLAY", "straight to a game")}
        ${tile("mnStore", "#ffc845", '<path d="M4 8h16l-1.5 12h-13z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>', "STORE", "get more bars")}
        ${half("mnDaily", "#7dff9a", '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>', "DAILY REWARD", rewardReady(), "NEW")}
        ${half("mnSpin", "#ff4fae", '<circle cx="12" cy="13" r="8"/><path d="M12 5v16M4 13h16M6.3 7.3l11.4 11.4M17.7 7.3L6.3 18.7"/><path d="M12 1l2 3h-4z"/>', "DAILY SPIN", spinReady(), "FREE")}
      </div></div>`;
    foot.textContent = "A TRAVELLING CASINO · SOMEWHERE PAST JUPITER";
    $m("mnEnter").onclick = () => INTRO.play(); $m("mnQuick").onclick = () => { SFX.tap(); quick(); }; $m("mnSpin").onclick = dailySpin; $m("mnDaily").onclick = dailyReward; $m("mnStore").onclick = store; }
  // ---- quick play: every game as a card; opens it straight away ----
  function quick() { screen = "quick"; body.style.alignContent = "start";
    top.innerHTML = `<div class="head"><button class="back holo" id="mnBack" aria-label="Back">${BACK}</button><h2>QUICK PLAY</h2></div>` + bal();
    body.innerHTML = `<div class="games">${GAMES.map((g, i) => `<button class="gcard holo" data-id="${g.id}" style="--gc:${g.col};animation-delay:${i * .05}s">${svg(ICON[g.id] || ICON.slot, "art")}${svg(ICON[g.id] || ICON.slot, "ico")}<b>${g.name}</b><small>${g.kind}</small><span class="play">${PLAY}</span></button>`).join("")}</div>`;
    foot.textContent = "";
    $m("mnBack").onclick = () => { SFX.tap(); home(); }; body.querySelectorAll(".gcard").forEach(b => b.onclick = () => { SFX.open(); openGame(GAMES.find(g => g.id === b.dataset.id), null); }); }
  function modal(hc, html) { SFX.open(); const m = document.createElement("div"); m.className = "mm"; m.innerHTML = `<div class="box glass" style="--hc:${hc}">${html}</div>`; document.body.appendChild(m);
    m.addEventListener("click", e => { if (e.target === m && !m.dataset.busy) close(); }); const close = () => { m.remove(); refresh(); }; return { m, close, q: s => m.querySelector(s) }; }
  // confetti and gold bars raining over a pop-up
  function confetti(m, big) { const c = document.createElement("canvas"); c.className = "conf"; m.appendChild(c); const d = Math.min(2, devicePixelRatio || 1), w = innerWidth, h = innerHeight; c.width = w * d; c.height = h * d; const g = c.getContext("2d"); g.scale(d, d);
    const bar = new Image(); bar.src = ART.bar; const cols = ["#ffc845", "#ff4fae", "#5fe8ff", "#7dff9a", "#b48cff"];
    const ps = Array.from({ length: big ? 140 : 80 }, (_, i) => ({ x: w / 2 + (Math.random() - .5) * 60, y: h * .42, vx: (Math.random() - .5) * 520, vy: -250 - Math.random() * 520, r: Math.random() * 6, s: 4 + Math.random() * 5, c: cols[i % 5], bar: i % 6 === 0, life: 1.8 + Math.random() }));
    let last = performance.now(), t = 0; (function f(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; g.clearRect(0, 0, w, h);
      for (const p of ps) { p.vy += 700 * dt; p.vx *= .99; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 6; const a = Math.max(0, 1 - t / p.life); if (!a) continue; g.globalAlpha = a; g.save(); g.translate(p.x, p.y); g.rotate(p.r);
        if (p.bar && bar.complete) g.drawImage(bar, -14, -9, 28, 18); else { g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); } g.restore(); }
      g.globalAlpha = 1; if (t < 3 && c.isConnected) requestAnimationFrame(f); else c.remove(); })(last); }
  // count a number up on screen, with coin ticks
  function countUp(node, n) { const t0 = performance.now(), dur = Math.min(1400, 500 + n / 3); let lastTick = 0;
    (function f(now) { const u = Math.min(1, (now - t0) / dur), v = Math.round(n * (1 - Math.pow(1 - u, 3))); node.innerHTML = `<i></i>+${v.toLocaleString()}`; if (now - lastTick > 70 && u < 1) { lastTick = now; SFX.coin(); } if (u < 1) requestAnimationFrame(f); })(t0); }
  function award(n) { W.set(W.get() + n); const b = $m("mnBal"); if (b) { b.querySelector("span").textContent = W.get().toLocaleString(); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); } }
  // ---- daily reward: a 7-day streak; miss a day and it starts again from day 1 ----
  function dailyReward() { const ready = rewardReady(), day = streakDay();
    const md = modal("#7dff9a", `<h3>DAILY REWARD</h3><p>${ready ? "Come back every day: the rewards grow, and day 7 is a big one." : "Already claimed today. Next reward in " + nextIn() + "."}</p>
      <div class="days">${REWARDS.map((r, i) => `<div class="day ${i < day || (!ready && i === day) ? "got" : ""} ${ready && i === day ? "now" : ""} ${i === 6 ? "big" : ""}">DAY ${i + 1}<i></i><b>${r.toLocaleString()}</b></div>`).join("")}</div>
      <button class="go" id="mmClaim" ${ready ? "" : "disabled"}>${ready ? "CLAIM " + REWARDS[day].toLocaleString() : "COME BACK TOMORROW"}</button><button class="x" id="mmX">CLOSE</button>`);
    md.q("#mmX").onclick = md.close;
    md.q("#mmClaim").onclick = () => { if (!rewardReady()) return; const d = load(), gap = d.claim ? dayDiff(d.claim, today()) : 9; d.streak = gap === 1 ? (d.streak || 0) + 1 : 1; d.claim = today(); save(d);
      const n = REWARDS[(d.streak - 1) % 7], dn = ((d.streak - 1) % 7) + 1; award(n); SFX.win(dn === 7); confetti(md.m, dn === 7);
      md.q(".box").innerHTML = `<h3>DAY ${dn}${dn === 7 ? " — JACKPOT!" : ""}</h3><div class="won" id="mmWon"></div><p>bars added. See you tomorrow!</p><button class="go" id="mmX2">NICE!</button>`; countUp(md.q("#mmWon"), n); md.q("#mmX2").onclick = md.close; }; }
  // ---- daily spin: one free spin of a prize wheel a day. Built like Gravity Well's bowl (a lit, riveted metal lip; inset enamel segments
  //      with recessed edges; light falling across from the top-left) with the slot machine's glossy SPIN button and readouts ----
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = v => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`; };
  function dailySpin() { const ready = spinReady(); SFX.open();
    const m = document.createElement("div"); m.className = "mm"; document.body.appendChild(m);
    m.innerHTML = `<div class="box glass" style="--hc:#b8ff3d"><div class="nt"><i>Daily</i><b>SPIN</b></div>
      <div class="wheelwrap"><canvas class="sp" width="680" height="700"></canvas></div>
      <div class="rd"><div class="rdb"><small>TOP PRIZE</small><b>2,500</b></div><div class="spinbtn"><button class="bigspin" id="mmGo" ${ready ? "" : "disabled"}>${ready ? "SPIN<small>FREE</small>" : "DONE<small>today</small>"}</button></div><div class="rdb"><small>WON</small><b id="mmWon">${ready ? "&ndash;" : "&ndash;"}</b></div></div>
      <p class="msg" id="mmMsg">${ready ? "One free spin every day." : "Already spun today. Next spin in " + nextIn() + "."}</p><button class="x" id="mmX">CLOSE</button></div>`;
    const close = () => { m.remove(); refresh(); }; m.addEventListener("click", e => { if (e.target === m && !m.dataset.busy) close(); });
    const q = sel => m.querySelector(sel), cv = q("canvas"), g = cv.getContext("2d"), N = SPIN.length, seg = Math.PI * 2 / N;
    const CX = 340, CY = 360, RO = 318, RL = 270, RS = 256, RH = 84;                  // outer lip, lip's inner edge, segments' outer edge, hub
    let ang = 0, busy = false, flap = 0, winK = -1, spinning = false, lit = 0;
    const bar = new Image(); bar.src = ART.bar;
    const TAU = Math.PI * 2, ring = (r0, r1) => { g.beginPath(); g.arc(CX, CY, r0, 0, TAU); g.moveTo(CX + r1, CY); g.arc(CX, CY, r1, TAU, 0, true); g.closePath(); };   // a clean donut
    const band = (r0, r1, a0, a1) => { g.beginPath(); g.arc(CX, CY, r0, a0, a1); g.arc(CX, CY, r1, a1, a0, true); g.closePath(); };
    function draw(t) { g.clearRect(0, 0, 680, 700);
      // the lip: brushed metal lit from the top-left, a specular streak, rivets and LEDs set into it
      g.save(); g.shadowColor = "#000"; g.shadowBlur = 26; g.shadowOffsetY = 10;
      const metal = g.createLinearGradient(CX - RO, CY - RO, CX + RO, CY + RO); metal.addColorStop(0, "#a8a5bc"); metal.addColorStop(.45, "#4c495e"); metal.addColorStop(1, "#1a1826");
      g.fillStyle = metal; g.beginPath(); g.arc(CX, CY, RO, 0, 7); g.fill(); g.restore();
      const brush = g.createRadialGradient(CX, CY, RL, CX, CY, RO); brush.addColorStop(0, "#00000070"); brush.addColorStop(.3, "#ffffff14"); brush.addColorStop(.75, "#00000010"); brush.addColorStop(1, "#00000090");
      g.fillStyle = brush; g.beginPath(); g.arc(CX, CY, RO, 0, 7); g.fill();
      g.save(); g.strokeStyle = "#ffffff80"; g.lineWidth = 3; g.lineCap = "round"; g.beginPath(); g.arc(CX, CY, RO - 7, Math.PI * 1.05, Math.PI * 1.45); g.stroke(); g.restore();
      for (let k = 0; k < 32; k++) { const a = (k + .5) / 32 * Math.PI * 2, rr = (RO + RL) / 2, x = CX + Math.cos(a) * rr, y = CY + Math.sin(a) * rr;
        if (k % 2) { g.fillStyle = "#1a1824"; g.beginPath(); g.arc(x, y + 1.2, 6, 0, 7); g.fill(); g.fillStyle = "#c4c1d4"; g.beginPath(); g.arc(x, y, 4.6, 0, 7); g.fill(); continue; }
        const i = k / 2, on = winK >= 0 ? Math.floor(t * 6) % 2 === 0 : spinning ? (i + Math.floor(t * 18)) % 4 === 0 : (i + Math.floor(t * 3)) % 8 === 0, c = ["#b8ff3d", "#ffd23f", "#ff5fae", "#4fd8ff"][i % 4];
        g.fillStyle = "#0a0816"; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
        const led = g.createRadialGradient(x - 2, y - 2, 1, x, y, 7.5); led.addColorStop(0, on ? "#fff" : "#4a4466"); led.addColorStop(.5, on ? c : "#2a2640"); led.addColorStop(1, on ? shade(c, .5) : "#16142a");
        g.fillStyle = led; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); if (on) { g.save(); g.globalAlpha = .5; g.shadowColor = c; g.shadowBlur = 18; g.fill(); g.restore(); } }
      // the drop from the lip to the face
      const wall = g.createRadialGradient(CX, CY, RS, CX, CY, RL); wall.addColorStop(0, "#07060d"); wall.addColorStop(1, "#3a3650");
      g.fillStyle = wall; ring(RL, RS); g.fill();
      // the face: inset enamel segments, turning with the wheel
      g.save(); g.translate(CX, CY); g.rotate(ang); g.translate(-CX, -CY);
      for (let i = 0; i < N; i++) { const [v, , col] = SPIN[i], a0 = -Math.PI / 2 - seg / 2 + i * seg, a1 = a0 + seg, alt = i % 2 ? .78 : 1, hot = winK === i;
        const gr = g.createRadialGradient(CX, CY, RH, CX, CY, RS); gr.addColorStop(0, shade(col, .32 * alt)); gr.addColorStop(.55, shade(col, .78 * alt)); gr.addColorStop(1, shade(col, 1.02 * alt));
        g.fillStyle = gr; band(RS, RH, a0, a1); g.fill();
        if (hot) { g.fillStyle = `rgba(255,255,255,${.3 + .25 * Math.sin(t * 10)})`; band(RS, RH, a0, a1); g.fill(); }
        g.strokeStyle = "#0a0818aa"; g.lineWidth = 3; band(RS, RH, a0, a1); g.stroke();                                   // recessed edge
        g.strokeStyle = shade(col, 1.35); g.globalAlpha = .55; g.lineWidth = 1.2; band(RS - 3, RH + 3, a0 + .012, a1 - .012); g.stroke(); g.globalAlpha = 1;   // its inner highlight
        const am = a0 + seg / 2; g.save(); g.translate(CX + Math.cos(am) * (RS - 72), CY + Math.sin(am) * (RS - 72)); g.rotate(am + Math.PI / 2);
        g.textAlign = "center"; g.textBaseline = "middle"; const txt = v.toLocaleString(); g.font = `700 ${txt.length > 3 ? 38 : 50}px "Chakra Petch",system-ui,sans-serif`;
        g.fillStyle = "#ffffff40"; g.fillText(txt, 0, 2); g.fillStyle = "#0d0b1ce6"; g.fillText(txt, 0, 0);                  // engraved: a light lower edge under dark ink
        g.restore(); }
      g.restore();
      // the step down into the face casts a shadow; light falls across from the top-left
      const sh = g.createRadialGradient(CX, CY, RS - 34, CX, CY, RS); sh.addColorStop(0, "#0000"); sh.addColorStop(1, "#000a"); g.fillStyle = sh; ring(RS, RS - 34); g.fill();
      g.save(); g.beginPath(); g.arc(CX, CY, RS, 0, 7); g.clip(); const lt = g.createLinearGradient(CX - RS, CY - RS, CX + RS, CY + RS); lt.addColorStop(0, "#ffffff22"); lt.addColorStop(.5, "#00000000"); lt.addColorStop(1, "#00000055"); g.fillStyle = lt; g.fillRect(0, 0, 680, 700); g.restore();
      // the hub: a machined collar round a dark glass dome with a lime LED ring
      const col2 = g.createLinearGradient(CX - RH, CY - RH, CX + RH, CY + RH); col2.addColorStop(0, "#b4b1c6"); col2.addColorStop(.5, "#4c495e"); col2.addColorStop(1, "#1a1826");
      g.save(); g.shadowColor = "#000"; g.shadowBlur = 16; g.fillStyle = col2; g.beginPath(); g.arc(CX, CY, RH, 0, 7); g.fill(); g.restore();
      const dome = g.createRadialGradient(CX - 18, CY - 22, 4, CX, CY, RH - 12); dome.addColorStop(0, "#3a3460"); dome.addColorStop(.6, "#0e0c1e"); dome.addColorStop(1, "#05040c");
      g.fillStyle = dome; g.beginPath(); g.arc(CX, CY, RH - 12, 0, 7); g.fill();
      g.save(); g.strokeStyle = "#b8ff3d"; g.lineWidth = 3; g.shadowColor = "#b8ff3d"; g.shadowBlur = 14 + 8 * (spinning ? 1 : Math.sin(t * 2.4) * .5 + .5); g.beginPath(); g.arc(CX, CY, RH - 20, 0, 7); g.stroke(); g.restore();
      g.fillStyle = "#ffffff30"; g.beginPath(); g.ellipse(CX - 16, CY - 26, 26, 12, -.5, 0, 7); g.fill();
      g.fillStyle = "#e9ffd0"; g.font = '400 24px "Bungee",Impact,sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "#b8ff3d"; g.shadowBlur = 12; g.fillText("FREE", CX, CY + 2); g.shadowBlur = 0;
      // the pointer: a machined tab over the top of the lip with a lime LED, kicking as the pegs pass
      g.save(); g.translate(CX, CY - RO + 14); g.rotate(flap);
      const pm = g.createLinearGradient(-30, -20, 30, 50); pm.addColorStop(0, "#d8d6e6"); pm.addColorStop(.5, "#6a677e"); pm.addColorStop(1, "#2a2838");
      g.shadowColor = "#000"; g.shadowBlur = 12; g.shadowOffsetY = 4; g.fillStyle = pm; g.beginPath(); g.moveTo(0, 62); g.lineTo(-26, 4); g.quadraticCurveTo(-28, -18, 0, -20); g.quadraticCurveTo(28, -18, 26, 4); g.closePath(); g.fill();
      g.shadowBlur = 0; g.shadowOffsetY = 0; g.strokeStyle = "#ffffff60"; g.lineWidth = 2; g.beginPath(); g.moveTo(-22, 2); g.quadraticCurveTo(-24, -14, 0, -16); g.stroke();
      const pl = g.createRadialGradient(-3, -3, 1, 0, 0, 10); pl.addColorStop(0, "#fff"); pl.addColorStop(.45, "#b8ff3d"); pl.addColorStop(1, "#3d6400"); g.fillStyle = pl; g.shadowColor = "#b8ff3d"; g.shadowBlur = 16; g.beginPath(); g.arc(0, 2, 9, 0, 7); g.fill(); g.restore(); }
    (function idle(now) { if (!m.isConnected) return; if (!spinning) draw(now / 1000); requestAnimationFrame(idle); })(performance.now());
    q("#mmX").onclick = () => { if (!busy) close(); };
    q("#mmGo").onclick = () => { if (busy || !spinReady()) return; busy = true; spinning = true; m.dataset.busy = 1; q("#mmGo").disabled = true; q(".spinbtn").classList.add("on");
      let r = Math.random(), k = 0; for (let i = 0; i < N; i++) { if (r < SPIN[i][1]) { k = i; break; } r -= SPIN[i][1]; }
      const d = load(); d.spin = today(); save(d);                                 // spent the moment it starts, so closing the app mid-spin can't reroll it
      const from = ang, start = performance.now(), dur = 5600;                     // land segment k under the pointer (the wheel turns clockwise) after six turns
      const end = from - (((from + k * seg) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI * 2 * 6 + (Math.random() - .5) * seg * .7;
      let lastPeg = Math.floor((from + seg / 2) / seg), fv = 0; q("#mmMsg").textContent = "Round and round…";
      (function step(now) { const u = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - u, 4); ang = from + (end - from) * e;
        const pg = Math.floor((ang + seg / 2) / seg); if (pg !== lastPeg) { lastPeg = pg; fv = -.45; SFX.tick(); } flap += (fv - flap) * .5; fv *= .8; draw(now / 1000);
        if (u < 1) return requestAnimationFrame(step);
        spinning = false; flap = 0; winK = k; const v = SPIN[k][0]; award(v); SFX.win(v >= 1000); confetti(m, v >= 1000); q(".spinbtn").classList.remove("on");
        countUp(q("#mmWon"), v); q("#mmWon").parentElement.classList.add("hit"); q("#mmMsg").textContent = v >= 1000 ? "Huge! Come back tomorrow for another." : "Nice! Come back tomorrow for another.";
        q("#mmGo").innerHTML = "DONE<small>today</small>"; busy = false; delete m.dataset.busy; })(start); }; }
  // ---- the store: bar packs. Test mode: nothing is charged; real purchases come with the app-store version ----
  const PILE = [[14, 18], [0, 18], [28, 18], [7, 9], [21, 9], [14, 0], [28, 2]];       // where each bar sits in a pack's little pile (up to 7)
  const pile = n => `<div class="pile">${PILE.slice(0, n).map(([x, y]) => `<i style="left:${x}px;top:${y}px"></i>`).join("")}</div>`;
  function store() { const md = modal("#ffc845", `<h3>STORE</h3><p>Top up your gold bars.</p><div class="packs">${PACKS.map((p, i) => `<button class="pack ${p.best ? "best" : ""}" data-i="${i}">${p.best ? '<span class="ribbon">BEST VALUE</span>' : ""}${pile(p.n)}<div><b>${p.bars.toLocaleString()}</b><em>${p.sub}</em></div><span>${p.price}</span></button>`).join("")}</div>
      <p class="note">TEST MODE &mdash; NO MONEY IS CHARGED. Tapping a pack just adds the bars, so we can try the flow. Real purchases come with the App Store / Google Play version.</p><button class="x" id="mmX">CLOSE</button>`);
    md.q("#mmX").onclick = md.close;
    md.m.querySelectorAll(".pack").forEach(b => b.onclick = () => { const p = PACKS[+b.dataset.i]; SFX.tap();
      md.q(".box").innerHTML = `<h3>${p.bars.toLocaleString()} BARS</h3>${pile(p.n)}<p>${p.price} &middot; test mode, nothing is charged</p><button class="go" id="mmBuy">CONFIRM</button><button class="x" id="mmNo">CANCEL</button>`;
      md.q("#mmNo").onclick = () => { md.close(); store(); };
      md.q("#mmBuy").onclick = () => { award(p.bars); SFX.win(p.bars >= 30000); confetti(md.m, p.bars >= 30000); md.q(".box").innerHTML = `<h3>THANK YOU!</h3><div class="won" id="mmWon"></div><p>bars added</p><button class="go" id="mmOk">DONE</button>`; countUp(md.q("#mmWon"), p.bars); md.q("#mmOk").onclick = md.close; }; }); }
  function refresh() { if (!open) return; if (screen === "home") home(); else { const b = top.querySelector(".bal span"); if (b) b.textContent = W.get().toLocaleString(); } }
  function show() { open = true; el.hidden = false; home(); startSky(); PEEK.schedule(true); }
  function hide() { open = false; el.hidden = true; }
  addEventListener("storage", refresh);
  home(); startSky();

  // ---- boarding: the loading screen that covers the casino being built. A tractor beam takes you up (the stars rush downward), everything
  //      goes black, "Welcome to Alien Casino" glows while the floor loads, then the black splits down the middle and slides open like doors.
  //      All the motion is CSS transforms and fades, so it stays smooth while the casino is being put together behind it. ----
  const INTRO = (() => { let busy = false;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    async function play() { if (busy) return; busy = true;
      const o = document.createElement("div"); o.className = "intro"; o.setAttribute("role", "status"); o.setAttribute("aria-label", "Welcome to the Alien Casino");
      o.innerHTML = `<div class="ibw"><div class="ibeam"></div><div class="isrc"></div>${Array.from({ length: 26 }, (_, i) => `<i class="ip" style="left:${38 + Math.random() * 24}%;animation-delay:${(i * .07).toFixed(2)}s;--d:${(.9 + Math.random() * .7).toFixed(2)}s;--s:${(2 + Math.random() * 3).toFixed(1)}px"></i>`).join("")}</div>
        <div class="idoor l"></div><div class="idoor r"></div><div class="iwel"><small>WELCOME TO THE</small><b>ALIEN</b><em>Casino</em></div>`;
      el.classList.add("boarding"); PEEK.stop(); document.body.appendChild(o); const off = document.getElementById("offl"); if (off) off.hidden = true;       // the menu fades away; the sky stays
      await sleep(450); o.classList.add("beam"); startBoard();                       // the beam comes in, and the sky starts streaming down
      tone(90, 2.2, { type: "sawtooth", vol: .025, slide: 2.2 }); tone(220, 1.8, { type: "sine", vol: .04, slide: 4 });
      await sleep(1300); o.classList.add("beamout");                               // the beam fades away as the sky sinks into black
      await sleep(900); o.classList.add("black");
      await sleep(350); hide(); boardT = 0; el.classList.remove("boarding");
      const ready = enterCasino();                                                    // build the casino behind the black (the beam stayed smooth)
      await sleep(250); o.classList.add("wel");
      await Promise.all([ready.catch ? ready.catch(() => {}) : ready, sleep(1900)]);   // let the welcome sit, and wait for the floor to be ready
      o.classList.add("textout"); await sleep(800);                                  // the welcome fades, then the doors
      o.classList.add("seam"); tone(1200, .3, { type: "sine", vol: .03 }); await sleep(300);
      o.classList.add("open"); tone(140, .7, { type: "sawtooth", vol: .03, slide: .5 }); tone(900, .9, { type: "sine", vol: .02, slide: .3, at: .05 });
      await sleep(1250); o.remove(); busy = false; }
    return { play }; })();

  // ---- the Living Slot peeks in: now and then the casino's slot robot leans in from the bottom-left corner, waves, looks at you and blinks.
  //      It's the same 3D robot as on the casino floor, drawn on its own canvas behind the buttons, and only while it's on screen. ----
  const PEEK = (() => { let ren = null, scene, cam, bot, faceMat, faceCanvas, faceImg, arms = {}, H = 2, S = 1, t0 = -1, timer = 0, loading = null, turn = 0, V = null;
    const DUR = 6.6, cv = document.createElement("canvas"); cv.className = "peek"; cv.setAttribute("aria-hidden", "true"); el.insertBefore(cv, el.children[1]);
    async function setup() { if (loading) return loading; return loading = (async () => {
      ren = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true }); ren.setPixelRatio(Math.min(2, devicePixelRatio || 1)); ren.outputEncoding = THREE.sRGBEncoding; ren.toneMapping = THREE.ACESFilmicToneMapping; ren.toneMappingExposure = 1.05;
      scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(30, 1, .1, 40); cam.position.set(0, 0, 6); cam.lookAt(0, 0, 0);
      scene.add(new THREE.HemisphereLight(0xd8ccff, 0x1a1030, 1.1)); const key = new THREE.DirectionalLight(0xfff2dc, 1.6); key.position.set(3, 4, 5); scene.add(key);
      const rimP = new THREE.DirectionalLight(0xff5fae, 1.4); rimP.position.set(-4, 2, -3); const rimC = new THREE.DirectionalLight(0x5fe8ff, 1.2); rimC.position.set(4, 1, -3); scene.add(rimP, rimC);
      const tex = await loadAll(TEX_SRC.slot), m = buildSlotBot(THREE, { mood: "happy", tex }); bot = m.root; faceCanvas = m.faceCanvas; faceImg = tex.faces.happy; scene.add(bot);
      bot.traverse(o => { if (o.isMesh && o.material && o.material.name === "FaceScreen") faceMat = o.material; });
      bot.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(bot); H = box.max.y - box.min.y; bot.userData.y0 = box.min.y; bot.userData.w = box.max.x - box.min.x; bot.userData.x0 = (box.max.x + box.min.x) / 2;
      // the arm on the screen-right side is the one that waves
      const L = bot.getObjectByName("Shoulder_L"), R = bot.getObjectByName("Shoulder_R"), wp = o => o ? o.getWorldPosition(new THREE.Vector3()).x : -9;
      const mk = a => a && { a, base: a.quaternion.clone(), sign: a === L ? -1 : 1 }; arms.right = mk(wp(L) > wp(R) ? L : R); arms.left = mk(wp(L) > wp(R) ? R : L); })(); }   // the arm on each side of the screen
    function size() { if (!ren) return; const w = el.clientWidth, h = el.clientHeight; ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
      const halfH = 6 * Math.tan(15 * Math.PI / 180); S = halfH * 2 * .27 / (H * .67); }            // the visible upper two-thirds fill about 27% of the screen height, below the buttons
    // blinking closes only the eyes: find the two glowing eyes in the face picture once, then squash just those patches
    let eyes = null;
    function findEyes() { const c = document.createElement("canvas"); c.width = 716; c.height = 410; const x = c.getContext("2d"); x.drawImage(faceImg, 0, 0, 716, 410);
      const d = x.getImageData(0, 0, 716, 230).data, box = [[999, 999, -1, -1], [999, 999, -1, -1]];
      for (let y = 0; y < 230; y += 2) for (let px = 0; px < 716; px += 2) {   // eyes only: the mouth sits lower
        const i = (y * 716 + px) * 4, r = d[i], gg = d[i + 1], b = d[i + 2];
        if (gg > 150 && gg > r + 25 && gg > b + 60) { const bx = box[px < 358 ? 0 : 1]; bx[0] = Math.min(bx[0], px); bx[1] = Math.min(bx[1], y); bx[2] = Math.max(bx[2], px); bx[3] = Math.max(bx[3], y); } }
      eyes = { boxes: box.filter(b => b[2] > b[0]).map(([x0, y0, x1, y1]) => { const bx = [x0 - 14, y0 - 14, x1 - x0 + 28, y1 - y0 + 28], p = x.getImageData(Math.max(0, bx[0]), Math.max(0, bx[1]), 1, 1).data; return { bx, bg: `rgb(${p[0]},${p[1]},${p[2]})` }; }) }; }
    function face(k) { if (!faceCanvas || !faceImg) return; const c = faceCanvas.getContext("2d"); c.clearRect(0, 0, 716, 410); c.drawImage(faceImg, 0, 0, 716, 410);
      if (k < 1) { if (!eyes) findEyes(); for (const { bx: [x, y, w, h], bg } of eyes.boxes) { c.fillStyle = bg; c.fillRect(x, y, w, h); c.drawImage(faceImg, x, y, w, h, x, y + h * (1 - k) / 2, w, Math.max(2, h * k)); } }
      if (faceMat && faceMat.emissiveMap) faceMat.emissiveMap.needsUpdate = true; }   // k < 1 squashes the eyes shut
    const ease = u => 1 - Math.pow(1 - u, 3), back = u => { const c = 1.6; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
    // two ways in, taking turns: from the bottom-left corner behind the buttons, or from the right edge, much closer to you
    const VARIANTS = {
      left:  { z: 0,   k: 1,   side: -1, show: .27, cut: .27, low: .33, arm: "right", front: false, lean: 0, yaw: .55 },
      right: { z: 4.0, k: .9,  side: 1,  show: .4,  cut: .24, low: .62, arm: "left",  front: true, lean: .26, yaw: .3 } };   // leans left the whole time
    function frame(now) { if (t0 < 0) return; const t = (now - t0) / 1000;
      if (t > DUR || !open || screen !== "home" || document.querySelector(".mm") || playingGame()) { t0 = -1; cv.classList.remove("on"); face(1); schedule(); return; }
      const halfH = (6 - V.z) * Math.tan(15 * Math.PI / 180), halfW = halfH * cam.aspect, sc = S * V.k, w = bot.userData.w * sc;
      // where it rests: the lower part below the screen's edge, part of its outer side off the side edge
      const rx = V.side * (halfW - w * V.cut) - bot.userData.x0 * sc, ry = -halfH - bot.userData.y0 * sc - H * sc * V.low, inK = t < .9 ? back(Math.min(1, t / .9)) : t > DUR - .8 ? 1 - ease((t - (DUR - .8)) / .8) : 1;
      bot.scale.setScalar(sc); bot.position.set(rx + V.side * (1 - inK) * w * 1.2, ry - (1 - inK) * H * sc * .5, V.z);
      // it leans in sideways, then turns to look at you (the close one stays tilted to the left)
      const look = Math.min(1, Math.max(0, (t - 2.6) / .45)); const roll = V.side * (V.lean + .18 * (1 - ease(look))) + Math.sin(t * 1.4) * .02; bot.rotation.set(0, -V.side * V.yaw * (1 - ease(look)), roll);
      bot.position.x += Math.sin(roll) * H * sc * .8;   // it pivots at its feet, far below the screen: shift it so the tilt doesn't swing its head across the screen
      for (const k of ["left", "right"]) { const A = arms[k]; if (!A) continue; const wv = k === V.arm && t > .9 && t < 2.6 ? Math.sin(Math.min(1, (t - .9) / .3) * Math.PI / 2) * (Math.min(1, (2.6 - t) / .3)) : 0;   // raise, wave, lower
        A.a.quaternion.copy(A.base).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-.3 * wv, 0, A.sign * (2.5 * wv + Math.sin(t * 13) * .4 * wv)))); }
      const bl = [3.2, 3.75].find(b => t > b && t < b + .18); face(bl ? Math.max(.06, Math.abs((t - bl) / .09 - 1)) : 1);   // two quick blinks
      ren.render(scene, cam); requestAnimationFrame(frame); }
    async function go() { if (!open || screen !== "home" || document.querySelector(".mm") || playingGame()) return schedule();
      try { await setup(); } catch (e) { return; } size(); V = VARIANTS[turn++ % 2 ? "right" : "left"]; cv.classList.toggle("front", V.front); cv.classList.add("on"); t0 = performance.now(); requestAnimationFrame(frame); }
    function schedule(first) { clearTimeout(timer); timer = setTimeout(go, first ? 3000 : 7000 + Math.random() * 5000); }   // every 7–12 seconds
    addEventListener("resize", size);
    function stop() { clearTimeout(timer); t0 = -1; cv.classList.remove("on"); }
    return { schedule, go, stop }; })();
  PEEK.schedule(true);
  // the first time each day, the reward pops up by itself
  if (rewardReady()) setTimeout(() => { if (open && screen === "home" && !document.querySelector(".mm")) dailyReward(); }, 900);
  return { show, hide, refresh, get open() { return open; }, store, peek: PEEK };
})();
