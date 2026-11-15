// Searches drop odds + band multipliers so every cash-out strategy pays ~87%. Usage: node tools/tune.js
const fs=require('fs'); const src=fs.readFileSync(__dirname+'/../part_engine.js','utf8');
const E=new Function(src+`
return { set(p){ UNIT_DIV=p.div; DROP.hit=r=>Math.max(p.floor, p.h0 - p.hd*r); DROP.spread=p.sp; BANDS[4].mult=p.m4; BANDS[7].mult=p.m7; BANDS[10].mult=p.m10; },
 run(N, cashAt){ let paid=0, bets=0; const reach={4:0,7:0,10:0}, tot={4:0,7:0,10:0};
  for(let i=0;i<N;i++){ credits=1e9; startClimb(); bets+=bet;
    while(true){ const r=drop(); if(r.collapsed) break;
      if(BANDS[r.row]){ reach[r.row]++; tot[r.row]+=r.total/bet; }
      if(r.top){ paid+=r.paid; break; }
      if(r.offer){ if(r.row>=cashAt){ paid+=cashOut(); break; } else keepClimbing(); } } }
  return { rtp:paid/bets, r4:reach[4]/N, r7:reach[7]/N, top:reach[10]/N, t4:tot[4]/Math.max(1,reach[4]), t7:tot[7]/Math.max(1,reach[7]), t10:tot[10]/Math.max(1,reach[10]) }; } };`)();
// 1) pick drop odds so ~50% reach row 4, ~15% row 7, ~2-3% the top; 2) then set multipliers = 0.87 / (reach × avg stacked)
const p={div:20, h0:.32, hd:0, floor:.2, sp:.66, m4:1.5, m7:5.5, m10:40}; E.set(p);
const b=E.run(200000,10);
console.log('reach row4', (b.r4*100).toFixed(0)+'%', 'row7', (b.r7*100).toFixed(0)+'%', 'top', (b.top*100).toFixed(1)+'%', '| avg stacked (×bet) at 4/7/10:', b.t4.toFixed(2), b.t7.toFixed(2), b.t10.toFixed(2));
const T=+process.env.TARGET||.87; const m4=T/(b.r4*b.t4), m7=T/(b.r7*b.t7), m10=T/(b.top*b.t10);
console.log("multipliers for target:", m4.toFixed(2), m7.toFixed(2), m10.toFixed(2));
E.set(p);
for(const at of [4,7,10]) console.log('cash at', at, '→', (E.run(300000,at).rtp*100).toFixed(1)+'%', ' with ×', p.m4, '×', p.m7, '×', p.m10);
