// Payback per bet, using the real engine. Usage (from moons/): node tools/sim.js
const fs=require('fs'); const E=new Function(fs.readFileSync(__dirname+'/../part_engine.js','utf8')+`
function run(N, spot){ let staked=0, back=0;
  for(let i=0;i<N;i++){ credits=1e9; point=null; bets={with:0,against:0,gaps:{},collide:0}; history=[]; const c0=credits;
    placeBet(spot,100); staked+=100; let guard=0;
    while(guard++<500){ const r=roll(); if(!r) break; const open = bets.with||bets.against||bets.collide||Object.keys(bets.gaps).length; if(!open) break; }
    back+=credits-c0+100; }
  return back/staked; }
return { run };`)();
const N=+process.env.N||800000;
for(const s of ["with","against","collide",1,2,3,4,5,6,7]) console.log(String(s).padEnd(8), (E.run(N,s)*100).toFixed(2)+'%');
