// ---- Pyramid Scheme engine: pure game maths, no drawing. (Shared with tools/sim.js, which runs it in Node.) ----
// The player pays one bet to climb. Row 1 starts as 5 stones. Each DROP, the UFO lets go of a row as wide as the top of the stack;
// where it lands is chance. Stones with nothing beneath them crumble away, so the stack can only stay as wide or narrow.
// Reaching a band offers: cash out (band multiplier × value of every stone stacked) or keep climbing.
// Keep climbing and collapse = nothing. Reaching the top pays the capstone multiplier automatically.
// SKIM: between drops the player may skim any uncracked stone worth 2 or more: half its value (rounded down) goes straight to their
// gold and is kept even if the tower falls. The stone stays, cracked, keeping the other half for the bands. Every crack adds
// CRACK_RISK to the chance that the next drop — and every drop after — brings the whole tower down. And each skim itself has a
// SHATTER chance that the crack spreads and the tower falls on the spot (the skimmed gold is still kept).
// ANCHOR: once per climb, between drops, pay ANCHOR_COST × bet (rounded) to set an anchor stone right beside either end of the
// top row (if there's room). It's worth nothing and doesn't change how many stones drop next — it just gives the next row one more
// stone of support to land on, so less of it falls off. It can't hold a row up on its own: some of that row must rest on real stone.
const COLS = 5, ROWS = 10;
const ANCHOR_COST = .2;
const BANDS = { 4:{ mult:1.5, name:"MINOR" }, 7:{ mult:5, name:"MAJOR" }, 10:{ mult:30, name:"CAPSTONE" } };
const BETS = [20, 40, 100, 200, 400];                       // stone values scale with the bet (see UNIT_DIV)
const STONE_VALUES = [[1, 56], [2, 30], [3, 10], [5, 4]];  // [value in units, how common]
// Landing odds per row: hit = chance the row lands perfectly on top; otherwise it lands 1, 2, 3… columns off,
// each extra column `spread` times as likely as the last. Landing a full width off (or more) = collapse.
const DROP = { hit:r => .34, spread:.66 };   // tuned with tools/tune.js (TARGET=.83): every cash-out strategy pays ~83%
const CRACK_RISK = .04;                                    // added collapse chance per cracked stone, on every drop
const SHATTER = .04;                                       // chance a skim's crack spreads and the tower falls right then
const START = 400;
let credits = START, bet = 20, climb = null;

let UNIT_DIV = 20;                                   // 1 stone-value unit = bet ÷ UNIT_DIV
const unit = () => bet / UNIT_DIV;
function rollValue(){ let t = Math.random()*STONE_VALUES.reduce((a,v)=>a+v[1],0); for(const [v,w] of STONE_VALUES){ if((t-=w)<0) return v; } return 1; }
function startClimb(){
  if(climb || credits < bet) return null;
  credits -= bet;
  const row = [0,1,2,3,4].map(c=>({ col:c, val:rollValue()*unit() }));
  climb = { row:1, a:0, w:COLS, rows:[row], total:row.reduce((s,x)=>s+x.val,0), bet, skimmed:0, cracks:0, anchorUsed:false, extra:0 };
  return climb;
}
const FORCE = { perfect:false, collapse:false };   // debug only: next drop lands perfectly / collapses
function pickShift(w, r){   // how many columns off the new row lands (w or more = collapse)
  if(FORCE.collapse){ FORCE.collapse=false; return w; }
  if(FORCE.perfect) return 0;
  if(Math.random() < DROP.hit(r)) return 0;
  let k = 1; while(k < w && Math.random() < DROP.spread) k++;
  return k;
}
// One drop. Returns what happened so the screen can animate it.
function drop(){
  if(!climb || climb.offer) return null;
  if(climb.cracks && Math.random() < crackRisk()){   // the cracks give way under the new row
    const res = { row:climb.row+1, start:climb.a, w:climb.w, kept:[], lost:[], stones:[], collapsed:true, cracked:true, paid:0 }; climb = null; return res; }
  const r = climb.row + 1, k = pickShift(climb.w, r), dir = Math.random()<.5 ? -1 : 1;
  const start = climb.a + dir*k;                                 // where the left edge of the falling row lands
  const cols = Array.from({length:climb.w}, (_,i)=>start+i);
  const onStone = c => c>=climb.a && c<climb.a+climb.w && c>=0 && c<COLS;
  // the anchor only extends a row: it holds a stone only if the same row also has stones resting on real stone
  const kept = cols.some(onStone) ? cols.filter(c=> onStone(c) || c===climb.anchorCol) : [];
  const lost = cols.filter(c=> !kept.includes(c));
  const stones = kept.map(c=>({ col:c, val:rollValue()*unit() }));
  const res = { row:r, start, w:climb.w, kept, lost, stones, collapsed: kept.length===0 };
  if(res.collapsed){ res.paid = 0; climb = null; return res; }
  climb.rows.push(stones); climb.row = r; climb.a = kept[0]; climb.w = kept.length; climb.anchorCol = null;
  climb.total += stones.reduce((s,x)=>s+x.val,0);
  res.total = climb.total;
  const band = BANDS[r];
  if(band){
    const amount = Math.round(band.mult * climb.total);
    if(r === ROWS){ credits += amount; res.paid = amount; res.top = true; climb = null; }
    else { climb.offer = { row:r, mult:band.mult, amount, name:band.name }; res.offer = climb.offer; }
  }
  return res;
}
// Which stones can be skimmed right now: [{row, col, val}]
function skimmable(){
  if(!climb || climb.offer) return [];
  const out = []; climb.rows.forEach((stones,i)=>stones.forEach(st=>{ if(!st.cracked && !st.anchor && Math.floor(st.val/2) >= 1) out.push({ row:i+1, ...st }); }));
  return out;
}
const crackRisk = () => climb ? Math.min(.95, climb.cracks * CRACK_RISK) : 0;
function skim(row, col){
  if(!skimmable().some(s=>s.row===row && s.col===col)) return null;
  const st = climb.rows[row-1].find(s=>s.col===col), take = Math.floor(st.val/2);
  st.val -= take; st.cracked = true; climb.cracks++; climb.total -= take; climb.skimmed += take; credits += take;
  const res = { row, col, take, left:st.val, total:climb.total, risk:crackRisk() };
  if(Math.random() < SHATTER){ res.shattered = true; climb = null; }
  return res;
}
const anchorCost = () => Math.max(1, Math.round(bet * ANCHOR_COST));
// where an anchor could go right now: [{side:"left"|"right", col}]
function anchorSpots(){
  if(!climb || climb.offer || climb.anchorUsed || climb.w < 2 || credits < anchorCost()) return [];   // a lone top stone can't use it
  const out = []; if(climb.a > 0) out.push({ side:"left", col:climb.a-1 }); if(climb.a+climb.w < COLS) out.push({ side:"right", col:climb.a+climb.w });
  return out;
}
function setAnchor(side){
  const spot = anchorSpots().find(s=>s.side===side); if(!spot) return null;
  const cost = anchorCost(); credits -= cost; climb.extra += cost; climb.anchorUsed = true;
  const top = climb.rows[climb.row-1], st = { col:spot.col, val:0, anchor:true };
  side==="left" ? top.unshift(st) : top.push(st);
  climb.anchorCol = spot.col;                                    // extra support for the next drop only
  return { ...spot, cost, row:climb.row };
}
function cashOut(){ if(!climb?.offer) return 0; const a = climb.offer.amount; credits += a; climb = null; return a; }
function keepClimbing(){ if(climb?.offer) climb.offer = null; }
function bandValue(r){ return climb && BANDS[r] ? Math.round(BANDS[r].mult * climb.total) : 0; }   // what a band would pay right now
