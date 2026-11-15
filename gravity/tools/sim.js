// Payback check: runs the real engine for many spins per betting style. Usage (from gravity/): node tools/sim.js
const fs=require('fs'); const E=new Function(fs.readFileSync(__dirname+'/../part_engine.js','utf8')+`
function run(N, place){ let paid=0, staked=0, paths=0;
  for(let i=0;i<N;i++){ credits=1e9; clearBets(); place(); const r=spin(); collect(r.totalWin); paid+=r.totalWin; staked+=r.staked; if(r.balls.some(b=>b.pathWin)) paths++; }
  return [paid/staked, paths/N, pathBonus()]; }
return { run, addBet, addVoidBet, addColorBet, addFrenzyBet, pathBonus, clearBets };`)();
const N=+process.env.N||1500000, R=n=>Math.floor(Math.random()*n);
const styles={
  "one rim chip":                 ()=>E.addBet(0,R(4),1),
  "one chip on each tier":        ()=>{ E.addBet(0,R(4),1); E.addBet(1,R(12),1); E.addBet(2,R(24),1); },
  "cover all 4 rim + 1 + 1":      ()=>{ for(let i=0;i<4;i++) E.addBet(0,i,1); E.addBet(1,R(12),1); E.addBet(2,R(24),1); },
  "cover EVERYTHING":             ()=>{ [4,12,24].forEach((n,t)=>{ for(let i=0;i<n;i++) E.addBet(t,i,1); }); },
  "2 rim, 4 belt, 6 core":        ()=>{ [[0,2,4],[1,4,12],[2,6,24]].forEach(([t,k,n])=>{ const s=new Set(); while(s.size<k) s.add(R(n)); s.forEach(i=>E.addBet(t,i,1)); }); },
  "big rim, tiny belt+core":      ()=>{ E.addBet(0,R(4),25); E.addBet(1,R(12),1); E.addBet(2,R(24),1); },
  "void bet":                     ()=>E.addVoidBet(1),
  "colour bet":                   ()=>E.addColorBet(R(4),1),
  "frenzy pool":                  ()=>E.addFrenzyBet(1),
  "all 4 colour bets":            ()=>{ for(let q=0;q<4;q++) E.addColorBet(q,1); },
};
for(const [n,f] of Object.entries(styles)){ const [rtp,ph,mult]=E.run(N,f); console.log(n.padEnd(28), (rtp*100).toFixed(2)+'%', ' path hit', (ph*100).toFixed(2)+'%', ' bonus ×'+mult); }
