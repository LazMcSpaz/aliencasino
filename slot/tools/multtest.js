const {chromium}=require('playwright'); const fs=require('fs');
const OUT='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/';
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync('slot.html','utf8')+'</body></html>');
 await p.waitForTimeout(1000);
 await p.evaluate(()=>{ applyMachine("food"); FORCE.bonus=true; fastOn=true;
   const orig=rollGrid; window.MULTLOG=[]; rollGrid=(bonus,g)=>{ const x=orig(bonus,g); if(bonus){ x[Math.floor(Math.random()*3)][Math.floor(Math.random()*3)]=BONUS.multSym; } return x; };
   const rs=resolveSpin; resolveSpin=()=>{ const r=rs(); if(r.inBonus) MULTLOG.push({boosts:r.boosts, before:r.multBefore, mult:r.mult, total:r.total, base:evaluate(r.g).reduce((a,w)=>a+w.amount,0)}); return r; }; });
 await p.click('#spin'); await p.waitForFunction(()=>bonusMode,null,{timeout:15000});
 let shot=0; const t0=Date.now();
 while(await p.evaluate(()=>bonusMode) && Date.now()-t0<90000){
   if(shot<2 && await p.evaluate(()=>!!document.querySelector('.boostfly'))){ await p.waitForTimeout(250); await p.screenshot({path:OUT+`mult_${shot}.png`}); shot++; }
   await p.mouse.click(195,420); await p.waitForTimeout(300); }
 const L=await p.evaluate(()=>MULTLOG);
 console.log(L.map(x=>`+${x.boosts}: ×${x.before}→×${x.mult} pays ${x.total} (=${x.base}×${x.mult}? ${x.total===x.base*x.mult})`).join('\n'));
 console.log('errors',errs); await b.close(); })();
