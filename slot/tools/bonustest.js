const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync('slot.html','utf8')+'</body></html>');
 await p.waitForTimeout(1000);
 for(const m of ["club","mob"]){
   await p.evaluate(m=>{ applyMachine(m); setMood("mischievous",30); applyMoodUI(false); FORCE.bonus=true; fastOn=true; },m);
   await p.click('#spin');
   const t0=Date.now(); await p.waitForFunction(()=>bonusMode,null,{timeout:15000});
   // tap through overlays until the bonus ends
   while(await p.evaluate(()=>bonusMode) && Date.now()-t0<120000){ await p.mouse.click(195,420); await p.waitForTimeout(700); }
   await p.waitForTimeout(1500);
   console.log(m,'bonus done in',Math.round((Date.now()-t0)/1000),'s · mood after:', await p.evaluate(()=>mood+' '+moodLeft));
 }
 console.log('errors',errs); await b.close(); })();
