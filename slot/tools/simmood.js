// Payout per mood, played by an attentive player (takes nudges, calls fake teases, smacks grumpy once per mood, aims sleepy stops)
const fs=require('fs'); const eng=fs.readFileSync('part_engine.js','utf8');
const SLEEP_SEE=+process.argv[2]||3, SLEEP_SLIP=+process.argv[3]||3;
const E=new Function('SLEEP_SEE','SLEEP_SLIP',eng.replace(/^[^\n]*\n/,'').replace(/const \$ = id[^\n]*\n/,'')+`
return { run(m, paid, nLines, skill){  lines=nLines; lossStreak=0; coolLeft=0; bonusLeft=0; let bet=0, won=0, extra=0, n=0, trig=0;
  while(n<paid){ if(bonusLeft===0){ n++; mood=m; moodLeft=99; }
    credits=START; const r=resolveSpin(); credits=START+r.total-r.spent;
    if(skill){
      if(r.above && r.total===0) nudgeReel(r, Math.floor(Math.random()*3));   // nudge a random reel after a loss (can't see what's coming)
      if(r.fake) extra += Math.max(1, Math.round(r.spent/2));                     // called the bluff
      if(m==="grumpy" && n%20===0 && !r.inBonus) extra += r.spent*.3;             // one smack per grumpy stretch, pays a bet 30% of the time
      if(m==="sleepy" && !r.inBonus){                                              // aims each reel at the best of a few visible positions; 50% slips one more
        const g=r.g.map(c=>c.slice());
        for(let k=0;k<3;k++){ const strip=Array.from({length:9},()=>pick()); let best=0,bs=-1;
          for(let s=0;s<SLEEP_SEE;s++){ const col=strip.slice(s,s+3); const sc=col.filter(v=>v===BOWL).length*3+col.filter(v=>v===WILD).length*2+col.filter(v=>v===1||v===2).length; if(sc>bs){bs=sc;best=s;} }
          const s2=Math.min(6, best+Math.floor(Math.random()*SLEEP_SLIP)); g[k]=strip.slice(s2,s2+3); }
        rescore(r,g);
      }
    }
    bet+=r.spent; won+=r.total; if(r.triggered) trig++; }
  return { rtp:(won+extra)/bet, trig:paid/Math.max(1,trig) }; } };`)(SLEEP_SEE,SLEEP_SLIP);
for(const m of ["happy","giddy","grumpy","sleepy","mischievous"]){
  const a=E.run(m,400000,5,false), b=E.run(m,400000,5,true);
  console.log(m.padEnd(12), "hands-off", a.rtp.toFixed(3), "| attentive", b.rtp.toFixed(3), "| bonus every", Math.round(b.trig));
}
