// Can any skimming strategy beat the house? Usage (from pyramid/): node tools/simskim.js
const fs=require('fs'); const src=fs.readFileSync(__dirname+'/../part_engine.js','utf8');
const E=new Function(src+`
const strategies = {
  "never skim":                        ()=>[],
  "skim everything, every turn":       ()=>skimmable(),
  "skim row 1 at the start only":      (phase)=> phase==="start" ? skimmable() : [],
  "skim only 5s":                      ()=>skimmable().filter(s=>s.val>=5),
  "skim all just after a band":        (phase)=> phase==="afterBand" ? skimmable() : [],
  "skim 1 stone per turn":             ()=>skimmable().slice(0,1),
};
function run(N, name, cashAt){ const strat=strategies[name]; let paid=0, bets=0;
  for(let i=0;i<N;i++){ credits=1e9; const c0=credits; startClimb(); let phase="start";
    while(climb){
      for(const s of strat(phase)){ if(!climb) break; const r=skim(s.row,s.col); }
      if(!climb) break;
      phase="drop"; const r=drop(); if(r.collapsed) break;
      if(r.top) break;
      if(r.offer){ if(r.row>=cashAt){ cashOut(); break; } keepClimbing(); phase="afterBand"; }
    }
    paid += credits - c0 + bet; bets += bet; }
  return paid/bets; }
return { strategies:Object.keys(strategies), run };`)();
for(const name of E.strategies){ const row=[4,7,10].map(at=>(E.run(200000,name,at)*100).toFixed(1)+'%');
  console.log(name.padEnd(40), '| cash at row 4:', row[0], ' row 7:', row[1], ' top:', row[2]); }
