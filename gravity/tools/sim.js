// Payback check: runs the real engine for many spins per bet type. Usage (from gravity/): node tools/sim.js
const fs=require('fs'); const E=new Function(fs.readFileSync(__dirname+'/../part_engine.js','utf8')+`
function run(N, place){ let paid=0, staked=0;
  for(let i=0;i<N;i++){ credits=1e9; clearBets(); place(); const r=spin(); collect(r.totalWin); paid+=r.totalWin; staked+=r.staked; }
  return paid/staked; }
return { run, TIERS, addBet, addVoidBet, setPathPick, setPathAmount };`)();
const N=+process.env.N||2000000, pct=x=>(x*100).toFixed(2)+'%';
console.log('rim (any quadrant)  ', pct(E.run(N, ()=>E.addBet(0, Math.floor(Math.random()*4), 1))));
console.log('belt (any section)  ', pct(E.run(N, ()=>E.addBet(1, Math.floor(Math.random()*12), 1))));
console.log('core (any pocket)   ', pct(E.run(N, ()=>E.addBet(2, Math.floor(Math.random()*24), 1))));
console.log('path (one per tier) ', pct(E.run(N, ()=>{ [4,12,24].forEach((n,t)=>E.setPathPick(t,Math.floor(Math.random()*n))); E.setPathAmount(1); })));
console.log('void side bet       ', pct(E.run(N, ()=>E.addVoidBet(1))));
console.log('cover every rim     ', pct(E.run(N/4, ()=>{ for(let i=0;i<4;i++) E.addBet(0,i,1); })));
