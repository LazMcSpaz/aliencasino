// <engine> (this block is also run by the tuning simulation)
// ---- Paytable (tuned by simulation) ----
// [id, name, weight, pays for 3 on a line, pays for first 2 on a line, banana?] — pays are × line cost
const SYMBOLS = [
  ["wild",    "Spiky fruit",  1.5, 150,10, 0],   // WILD: counts as any symbol
  ["boar",    "Alien boar",     2,  72, 5, 0],
  ["chicken", "Alien chicken",  3,  42, 3, 0],
  ["egg",     "Chicken egg",    4,  27, 2, 0],
  ["drink",   "Bubbly drink",   5,  19, 2, 0],
  ["pasta",   "Space pasta",    6,  13, 1, 0],
  ["wrap",    "Lettuce wrap",   7,   9, 1, 0],
  ["banana3", "Triple banana",  5,  15, 1, 1],
  ["banana2", "Double banana",  7,   8, 1, 1],
  ["banana1", "Single banana",  9,   5, 0, 1],
  ["bowl",    "Goop bowl",    2.6,   0, 0, 0],   // SCATTER: 3+ anywhere on screen starts Bowl-nus spins
  ["jug",     "Goop jug",       0,   0, 0, 0],   // appears only during Bowl-nus spins: each one adds spins
];
const WILD = 0, BOWL = 10, JUG = 11;
// Bowl-nus spins: free spins at the bet that triggered them, every win multiplied
// Multiplier booster: during Bowl-nus spins every top-paying symbol (role 1: boar / DJ / Capone) that lands adds +1 to the multiplier, up to multCap
const BONUS = { spins3:7, spins4:10, mult:2, multSym:1, multCap:5, jugAdds:2, weights:{ bowl:0, jug:0.15, boar:0.6 } };
let bonusMult = BONUS.mult;
let ANY_LABEL = "Any bananas";   // set per machine
const ANY_BANANA = 4;   // any mix of three bananas (or wilds) on a line
const LINE_COST = 2, START = 200;
const LINES = [[1,1,1],[0,0,0],[2,2,2],[0,1,2],[2,1,0]];  // turn on in this order
const LINE_COLORS = ["--l1","--l2","--l3","--l4","--l5"];
// Hidden streak system. The losing streak counts in "full bets" (a 1-line loss counts 1/5), so playing 1 line can't game it.
const STREAK = { pityPerLoss:0.09, pityBehind:0.35, pityMax:0.6, taxAhead:0.45, taxAfterBig:0.35, taxMax:0.6, bigWinX:12, coolSpins:5 };

// ---- Moods: the machine's mood changes how results arrive and what tapping does. Overall payout stays in a tight band; moods change the SHAPE of winning.
//  happy:       baseline, honest teases
//  giddy:       extra small wins + a few more bowls; after every spin the player may NUDGE one reel down a step (handled on screen)
//  grumpy:      throws back most small wins, but sometimes digs up a big one — swingier, same-ish payout
//  sleepy:      slow reels; the player taps to stop each reel themselves (handled on screen)
//  mischievous: fakes bonus teases (plants 2 bowls that can't land a 3rd) and sometimes swaps two symbols after the reels stop
const MOODS = {
  happy:       { len:[18,32] },
  giddy:       { len:[12,22], bowlX:1, tax:.2 },
  grumpy:      { len:[14,26], cutSmall:.75, hunt:.025, huntX:5 },
  sleepy:      { len:[10,18] },
  mischievous: { len:[12,22], swap:.16, swapGood:.4, fake:.07 },
};
const MOOD_LIST = Object.keys(MOODS);
let mood = "happy", moodLeft = 24, moodNext = null, moodRecent = [];
function setMood(m, len){ mood = m; moodNext = null; const L = MOODS[m].len; moodLeft = len || (L[0] + Math.floor(Math.random()*(L[1]-L[0]+1))); }
function pickNextMood(){
  // the player's recent results push the mood: winning big makes it grumpy, losing makes it happy/giddy (it's eating well)
  const net = moodRecent.reduce((a,b)=>a+b,0) / Math.max(1, cost()*moodRecent.length);
  const w = { happy:3, giddy:2, grumpy:2, sleepy:1.6, mischievous:1.6 };
  if(net > .1){ w.grumpy *= 3; w.giddy *= .5; }
  if(net < -.4){ w.happy *= 1.5; w.giddy *= 2; w.grumpy *= .5; }
  w[mood] = 0;
  let r = Math.random()*MOOD_LIST.reduce((a,m)=>a+w[m],0);
  for(const m of MOOD_LIST){ if((r -= w[m]) < 0) return m; } return "happy";
}
function moodTick(total, spent){   // once per paid spin; returns {warn: next} two spins before a change, {changed, from} when it happens
  moodRecent.push(total - spent); if(moodRecent.length > 12) moodRecent.shift();
  moodLeft--;
  if(moodLeft === 2){ moodNext = pickNextMood(); return { warn:moodNext }; }
  if(moodLeft <= 0){ const from = mood; setMood(moodNext || pickNextMood()); return { changed:mood, from }; }
  return null;
}

const W_BASE  = SYMBOLS.map(s=>s[2]);
const W_BONUS = SYMBOLS.map(s=> s[0] in BONUS.weights ? BONUS.weights[s[0]] : s[2]);
const W_GIDDY = SYMBOLS.map((s,i)=> i===BOWL ? s[2]*MOODS.giddy.bowlX : s[2]);
const SUM = w => w.reduce((a,b)=>a+b,0), SUM_BASE = SUM(W_BASE), SUM_BONUS = SUM(W_BONUS), SUM_GIDDY = SUM(W_GIDDY);
const $ = id => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

let credits = typeof Wallet !== "undefined" ? Wallet.load() : START, lines = 3, spinning = false;
let lossStreak = 0, coolLeft = 0, lastPity = 0, lastTax = 0;
let bonusLeft = 0, bonusTotal = 0, bonusPlayed = 0;
let grid = [[7,1,5],[4,0,8],[3,2,6]]; // grid[reel][row]
const cost = () => lines * LINE_COST;

function pick(bonus=false, giddy=false){ const w = bonus ? W_BONUS : giddy ? W_GIDDY : W_BASE; let r = Math.random()*(bonus ? SUM_BONUS : giddy ? SUM_GIDDY : SUM_BASE);
  for(let i=0;i<w.length;i++){ if((r-=w[i])<0) return i; } return 0; }
function rollGrid(bonus=false, giddy=false){ return [0,1,2].map(()=>[0,1,2].map(()=>pick(bonus, giddy))); }
const countOf = (g, sym) => g.flat().filter(v=>v===sym).length;

// Best pay on one line, treating the wild as whatever symbol pays most
function linePay(a,b,c){
  let best = null;
  const usedWild = n => [a,b,c].slice(0,n).includes(WILD);
  const consider = (count, mult, label) => { if(mult>0 && (!best || mult>best.mult)) best = {count, mult, label, wild:usedWild(count)}; };
  if(a===WILD && b===WILD && c===WILD) consider(3, SYMBOLS[WILD][3], SYMBOLS[WILD][1]);
  for(let x=0; x<SYMBOLS.length; x++){ if(x===WILD) continue;
    const m = v => v===x || v===WILD;
    if(m(a) && m(b) && m(c)) consider(3, SYMBOLS[x][3], SYMBOLS[x][1]);
    else if(m(a) && m(b)) consider(2, SYMBOLS[x][4], SYMBOLS[x][1]);
  }
  const ban = v => v===WILD || SYMBOLS[v][5];
  if(ban(a) && ban(b) && ban(c)) consider(3, ANY_BANANA, ANY_LABEL);
  if(best && best.wild && best.label!==SYMBOLS[WILD][1]) best.label += " (wild)";
  return best;
}
function evaluate(g){
  const wins = [];
  LINES.slice(0, lines).forEach((L,li)=>{ const w = linePay(g[0][L[0]], g[1][L[1]], g[2][L[2]]);
    if(w) wins.push({line:li, count:w.count, label:w.label, amount:w.mult*LINE_COST}); });
  return wins;
}
const payOf = g => evaluate(g).reduce((a,w)=>a+w.amount,0);

// Test hook (debug menu): force the next paid spin to trigger the bonus or land a big win
const FORCE = { bonus:false, big:false };
function forcedGrid(){
  const g = rollGrid().map(col=>col.map(v=>v===BOWL ? 6 : v));      // start from a random screen with no stray bowls
  if(FORCE.bonus){ FORCE.bonus=false; [0,1,2].forEach(r=>{ g[r][Math.floor(Math.random()*3)] = BOWL; }); return g; }
  FORCE.big=false; [0,1,2].forEach(r=>{ g[r][1] = 1; }); return g;   // three of the top symbol on the middle line
}
function decideResult(){ // runs after the bet is taken
  if(FORCE.bonus || FORCE.big) return forcedGrid();
  const M = MOODS[mood], roll = () => rollGrid(false, mood==="giddy");
  let g = roll();
  const behind = Math.max(0,(START-credits)/START), ahead = Math.max(0,(credits-START)/START);
  lastPity = Math.min(.8, Math.min(STREAK.pityMax, STREAK.pityPerLoss*lossStreak + STREAK.pityBehind*behind) + (M.pity||0));
  lastTax  = Math.min(STREAK.taxMax, STREAK.taxAhead*ahead + (coolLeft>0 ? STREAK.taxAfterBig : 0));
  if(payOf(g)===0 && countOf(g,BOWL)<3 && Math.random()<lastPity) g = roll();
  if(payOf(g)>0  && Math.random()<lastTax)  g = roll();
  if(M.tax && payOf(g)>0 && countOf(g,BOWL)<3 && Math.random()<M.tax) g = roll();   // giddy: nudges hand out wins, so the base spin is a touch leaner
  if(M.cutSmall){ const p = payOf(g); if(p>0 && p<cost()*3 && countOf(g,BOWL)<3 && Math.random()<M.cutSmall) g = roll(); }   // grumpy throws back small wins…
  if(M.hunt && payOf(g)===0 && countOf(g,BOWL)<3 && Math.random()<M.hunt){                                                   // …and now and then digs up a big one
    for(let k=0;k<40;k++){ const h = roll(); if(payOf(h) >= cost()*M.huntX){ g = h; break; } } }
  return g;
}
function afterSpin(total, spent){
  lossStreak = total===0 ? lossStreak + lines/5 : 0;
  if(total >= spent*STREAK.bigWinX) coolLeft = STREAK.coolSpins; else if(coolLeft>0) coolLeft--;
  if(typeof document==="undefined") return; // running inside the simulation
  $("debug").textContent = `losing streak ${lossStreak.toFixed(1)} full bets · comeback chance ${Math.round(lastPity*100)}% · cool-off ${Math.round(lastTax*100)}%${coolLeft?` · cold spins left ${coolLeft}`:""}`;
}

// Mischievous: find two neighbouring symbols to swap that change the payout (helpful with chance `good`, otherwise harmful)
function pickSwap(g, good){
  const base = payOf(g), up = [], down = [];
  const cells = []; for(let r=0;r<3;r++) for(let row=0;row<3;row++) cells.push([r,row]);
  for(const a of cells) for(const b of cells){
    const adj = (a[0]===b[0] && b[1]===a[1]+1) || (a[1]===b[1] && b[0]===a[0]+1);
    if(!adj || g[a[0]][a[1]]===g[b[0]][b[1]]) continue;
    const h = g.map(c=>c.slice()); [h[a[0]][a[1]], h[b[0]][b[1]]] = [h[b[0]][b[1]], h[a[0]][a[1]]];
    const d = payOf(h) - base; if(d>0) up.push({a,b,d,h}); else if(d<0) down.push({a,b,d,h}); }
  const list = (Math.random()<good && up.length) || !down.length ? up : down;
  return list.length ? list[Math.floor(Math.random()*list.length)] : null;
}
// Giddy nudge: slide reel k down one step and score the NEW result in place of the old one —
// nudge a winning spin and you can lose the win, so it's a real decision.
function nudgeReel(r, k){
  const g = r.g.map(c=>c.slice()); g[k] = [r.above[k], g[k][0], g[k][1]];
  const wins = evaluate(g), total = wins.reduce((a,w)=>a+w.amount,0), gain = total - r.total;
  credits += gain; if(total>0) lossStreak = 0;
  Object.assign(r, { g, wins, total }); return { gain, wins, total };
}
// Re-score a spin after the player changed the reels (sleepy stop, giddy nudge). Adjusts credits by the difference.
function rescore(r, g){
  const wins = evaluate(g).map(w=>({...w, amount:w.amount*r.mult})), total = wins.reduce((a,w)=>a+w.amount,0);
  credits += total - r.total;
  if(r.inBonus) bonusTotal += total - r.total;
  else {
    const bowls = countOf(g,BOWL); if(total>0) lossStreak = 0;
    if(bowls>=3 && !r.triggered){ r.triggered = bowls>=4 ? BONUS.spins4 : BONUS.spins3; bonusLeft = r.triggered; bonusTotal = 0; bonusPlayed = 0; bonusMult = BONUS.mult; }
    else if(bowls<3 && r.triggered){ bonusLeft = 0; r.triggered = 0; }
    r.bowls = bowls;
  }
  Object.assign(r, { g, wins, total }); return r;
}

// One full spin: takes the bet (unless it's a Bowl-nus spin), picks the result, pays out, handles the bonus
function resolveSpin(){
  const inBonus = bonusLeft > 0, spent = inBonus ? 0 : cost();
  let g;
  if(inBonus){ bonusLeft--; bonusPlayed++; g = rollGrid(true); }
  let landed = null, swap = null, nudge = null, fake = false, above = null;
  if(!inBonus){ credits -= spent; const forced = FORCE.bonus || FORCE.big; g = decideResult();
    const M = MOODS[mood];
    if(!forced && mood==="mischievous" && countOf(g,BOWL)<3){
      if(Math.random() < M.fake){   // fake tease: a bowl on reels 1 and 2, and none on reel 3 — it can't actually land
        [0,1].forEach(r=>{ if(!g[r].includes(BOWL)) g[r][Math.floor(Math.random()*3)] = BOWL; });
        g[2] = g[2].map(v=> v===BOWL ? 6 : v); fake = true; }
      else if(Math.random() < M.swap){ const sw = pickSwap(g, M.swapGood); if(sw){ landed = g; g = sw.h; swap = { a:sw.a, b:sw.b, helped:sw.d>0 }; } }
    }
    if(mood==="giddy"){   // the symbol sitting just above each reel — what a nudge would pull into view (never a bowl)
      above = [0,1,2].map(()=>{ let v; do v = pick(); while(v===BOWL || v===WILD); return v; }); }
  }
  const boosts = inBonus ? countOf(g, BONUS.multSym) : 0, multBefore = bonusMult;
  if(inBonus) bonusMult = Math.min(BONUS.multCap, bonusMult + boosts);
  const mult = inBonus ? bonusMult : 1;
  const wins = evaluate(g).map(w=>({...w, amount:w.amount*mult}));
  const total = wins.reduce((a,w)=>a+w.amount,0);
  const bowls = countOf(g,BOWL), jugs = inBonus ? countOf(g,JUG) : 0;
  let triggered = 0, added = 0, bonusEnded = false;
  credits += total;
  if(inBonus){
    bonusTotal += total;
    if(jugs){ added = jugs*BONUS.jugAdds; bonusLeft += added; }
    if(bonusLeft===0){ bonusEnded = true; if(bonusTotal >= cost()*STREAK.bigWinX) coolLeft = STREAK.coolSpins; }
  } else {
    afterSpin(total + (bowls>=3 ? 1 : 0), spent);
    if(bowls>=3){ triggered = bowls>=4 ? BONUS.spins4 : BONUS.spins3; bonusLeft = triggered; bonusTotal = 0; bonusPlayed = 0; bonusMult = BONUS.mult; }
  }
  const spinMood = mood, moodEvent = inBonus ? null : moodTick(total, spent);
  return { g, wins, total, spent, inBonus, mult, bowls, jugs, triggered, added, bonusEnded, landed, swap, nudge, fake, above, moodEvent, mood:spinMood, boosts, multBefore };
}

// Tease planner: looks at the result before the reels stop and decides how much drama to add
// tier "goop" = 2 bowls on reels 1–2 (one more starts Bowl-nus) · "big" = a top symbol set up on a played line · "mild" = a mid symbol set up
// early = a bowl on reel 1, so reel 2 lingers a moment
const TEASE_TOP = new Set([WILD, 1, 2]);   // wild, boar, chicken
const TEASE_MID = new Set([3, 4, 7]);      // egg, drink, triple banana
function teaseInfo(g, bonus=false){
  const out = { early:false, tier:null, setup:[], line:null };
  if(!bonus && g[0].includes(BOWL)) out.early = true;
  const bowls01 = [];
  [0,1].forEach(r=>g[r].forEach((v,row)=>{ if(v===BOWL) bowls01.push([r,row]); }));
  if(!bonus && bowls01.length>=2){ out.tier="goop"; out.setup=bowls01; return out; }
  let best = 0;
  LINES.slice(0,lines).forEach((L,li)=>{ const a=g[0][L[0]], b=g[1][L[1]];
    if(a===BOWL || b===BOWL || a===JUG || b===JUG) return;
    if(!(a===b || a===WILD || b===WILD)) return;
    const sym = a===WILD ? b : a;
    const rank = TEASE_TOP.has(sym) ? 2 : TEASE_MID.has(sym) ? 1 : 0;
    if(rank > best){ best = rank; out.line = li; out.setup = [[0,L[0]],[1,L[1]]]; } });
  out.tier = best===2 ? "big" : best===1 ? "mild" : null;
  return out;
}

// keep the shared wallet in step with this game's balance (not in Node tests)
if (typeof Wallet !== "undefined") Wallet.watch(() => credits);
