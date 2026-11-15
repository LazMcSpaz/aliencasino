// average multiplier reached by the end of a Bowl-nus round, and how often each level is reached
const fs=require('fs'); const eng=fs.readFileSync(process.argv[2]||'part_engine.js','utf8');
const E=new Function(eng.replace(/^[^\n]*\n/,'').replace(/const \$ = id[^\n]*\n/,'')+`
return { run(N){ const ends=[]; for(let i=0;i<N;i++){ bonusLeft=BONUS.spins3; bonusMult=BONUS.mult; lines=5; credits=START; mood="happy"; moodLeft=99;
  while(bonusLeft>0) resolveSpin(); ends.push(bonusMult); } return ends; } };`)();
const e=E.run(20000), avg=e.reduce((a,b)=>a+b,0)/e.length, dist={}; e.forEach(v=>dist[v]=(dist[v]||0)+1);
console.log('avg end ×'+avg.toFixed(2), Object.entries(dist).map(([k,v])=>'×'+k+' '+Math.round(v/e.length*100)+'%').join('  '));
