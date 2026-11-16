// Browser test. 1) bet 1 with auto ×2 on a ×3 launch → +10. 2) both bets: bet 1 auto ×1.8, bet 2 auto ×5, launch blows at ×2 → bet 1 +8, bet 2 −10.
// 3) repeat on: both bets go down by themselves next window; launch blows on the pad → −20. Usage (from warp/): node tools/playtest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2]||'.';
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.stack));
 await p.setContent(fs.readFileSync('warp.html','utf8')); await p.waitForTimeout(400);
 const toBoom=async()=>{ await p.waitForFunction(()=>phase==='boom',null,{timeout:30000}); await p.waitForTimeout(200); return p.evaluate(()=>credits); };
 const toWait=()=>p.waitForFunction(()=>phase==='wait',null,{timeout:9000});
 await p.evaluate(()=>{ FORCE.crash=3; }); await p.click('#autoTog'); await p.click('#go0'); const c1=await toBoom();
 await toWait(); await p.evaluate(()=>{ FORCE.crash=2; }); await p.click('#autoDn'); await p.click('.tab[data-s="1"]'); await p.click('.chip[data-v="5"]'); await p.click('.chip[data-v="5"]');
 await p.click('#autoTog'); await p.click('#autoUp'); await p.click('#autoUp'); await p.screenshot({path:OUT+'/w2_wait.png'}); await p.click('#go0'); await p.click('#go1');
 await p.waitForFunction(()=>phase==='flight',null,{timeout:9000}); await p.waitForTimeout(4500); await p.screenshot({path:OUT+'/w2_flight.png'}); const c2=await toBoom(); await p.screenshot({path:OUT+'/w2_boom.png'});
 await p.click('#repeat'); await toWait(); await p.evaluate(()=>{ FORCE.crash=1; }); const placed=await p.evaluate(()=>round.slots.map(s=>s.bet)); const c3=await toBoom();
 console.log('1) auto ×2 on ×3:',c1,'(expect 510) | 2) two bets, blows at ×2:',c2,'(expect 508) | 3) repeat placed',placed,'→',c3,'(expect 488) | errors',errs); await b.close(); })();
