// Is the anchor (20% of the bet) ever a money-maker? Usage (from pyramid/): node tools/simanchor.js
const fs=require('fs'); const src=fs.readFileSync(__dirname+'/../part_engine.js','utf8');
const E=new Function(src+`
const strategies = {
  "never anchor":                    ()=>false,
  "anchor at the first chance":      ()=>true,
  "anchor when 2 wide or less":      ()=>climb.w<=2,
  "anchor when down to 1 stone":     ()=>climb.w===1,
  "anchor when 1 wide, after row 4": ()=>climb.w===1 && climb.row>=4,
};
function run(N, name, cashAt){ const want=strategies[name]; let paid=0, bets=0;
  for(let i=0;i<N;i++){ credits=1e9; const c0=credits; startClimb(); let spent=bet;
    while(climb){
      if(want()){ const sp=anchorSpots(); if(sp.length){ const r=setAnchor(sp[Math.floor(Math.random()*sp.length)].side); spent+=r.cost; } }
      const r=drop(); if(r.collapsed || r.top) break;
      if(r.offer){ if(r.row>=cashAt){ cashOut(); break; } keepClimbing(); }
    }
    paid += credits - c0 + spent; bets += spent; }
  return paid/bets; }
return { strategies:Object.keys(strategies), run };`)();
for(const name of E.strategies){ const row=[4,7,10].map(at=>(E.run(200000,name,at)*100).toFixed(1)+'%');
  console.log(name.padEnd(34), '| cash at row 4:', row[0], ' row 7:', row[1], ' top:', row[2]); }
