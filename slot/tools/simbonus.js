const fs=require('fs');
const eng=fs.readFileSync(process.argv[2]||'part_engine.js','utf8');
const make=()=>new Function(eng.replace(/^[^\n]*\n/,'')+`
return {SYMBOLS, BONUS, set(o){Object.assign(BONUS,o)},
 play(paid,nLines){credits=START;lines=nLines;lossStreak=0;coolLeft=0;bonusLeft=0;let bet=0,won=0,trig=0,bwon=0,n=0,bust=false;
  while(n<paid){ if(bonusLeft===0){ if(credits<cost()){bust=true;break;} n++; }
    const r=resolveSpin(); bet+=r.spent; won+=r.total; if(r.triggered)trig++; if(r.inBonus)bwon+=r.total; }
  return {c:credits,bust,bet,won,trig,bwon};}};`)();
function report(E,label){
 for(const L of [1,3,5]){const N=15000;let TB=0,TW=0,TT=0,TBW=0,b=0,e=[];
  for(let i=0;i<N;i++){const r=E.play(100,L);TB+=r.bet;TW+=r.won;TT+=r.trig;TBW+=r.bwon;if(r.bust)b++;e.push(r.c);}
  e.sort((a,b)=>a-b);
  console.log(`${label} ${L} lines | RTP ${(TW/TB).toFixed(3)} (bonus share ${(TBW/TW*100).toFixed(0)}%) | Bowl-nus every ~${Math.round(N*100/TT)} spins | bust@100 ${(b/N*100).toFixed(0)}% | median@100 ${e[N/2|0]}`);}}
module.exports={make,report};
if(require.main===module){ const E=make(); report(E, process.argv[3]||''); }
