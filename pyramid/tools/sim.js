// Payout simulation: runs the real engine. Usage (from pyramid/): node tools/sim.js
const fs=require('fs'); const src=fs.readFileSync(__dirname+'/../part_engine.js','utf8');
const E=new Function(src+`
return { run(N, cashAt){ let paid=0, bets=0, bust=0; const reach={4:0,7:0,10:0};
  for(let i=0;i<N;i++){ credits=1e9; startClimb(); bets+=bet; let done=false;
    while(!done){ const r=drop(); if(r.collapsed){ if(climb===null && !r.paid) {} done=true; if(r.row<=4) bust++; break; }
      if(BANDS[r.row]) reach[r.row]++;
      if(r.top){ paid+=r.paid; done=true; }
      else if(r.offer){ if(r.row>=cashAt){ paid+=cashOut(); done=true; } else keepClimbing(); } }
  } return { rtp:paid/bets, bustBeforeMinor:bust/N, reach4:reach[4]/N, reach7:reach[7]/N, top:reach[10]/N }; } };`)();
for(const at of [4,7,10]){ const r=E.run(300000,at);
  console.log(`cash out at row ${String(at).padStart(2)} | payout ${(r.rtp*100).toFixed(1)}% | reach row4 ${(r.reach4*100).toFixed(0)}%  row7 ${(r.reach7*100).toFixed(0)}%  top ${(r.top*100).toFixed(1)}%`); }
