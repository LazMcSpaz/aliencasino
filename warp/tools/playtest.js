// Browser test: bet, auto cash-out at ×2 on a ×3 launch (should win), then a manual bet on a pad blow (should lose). Usage (from warp/): node tools/playtest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2]||'.';
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.stack));
 await p.setContent(fs.readFileSync('warp.html','utf8')); await p.waitForTimeout(400);
 await p.evaluate(()=>{ FORCE.crash=3; }); await p.click('#autoTog'); // auto on at ×2
 await p.click('#go'); const placed=await p.evaluate(()=>round.bet);
 await p.screenshot({path:OUT+'/w_wait.png'});
 await p.waitForFunction(()=>phase==='flight',null,{timeout:9000}); await p.waitForTimeout(4200); await p.screenshot({path:OUT+'/w_flight.png'});
 await p.waitForFunction(()=>phase==='boom',null,{timeout:20000}); await p.waitForTimeout(300); await p.screenshot({path:OUT+'/w_boom.png'});
 const c1=await p.evaluate(()=>credits);
 await p.waitForFunction(()=>phase==='wait',null,{timeout:9000}); await p.evaluate(()=>{ FORCE.crash=1; }); await p.click('#autoTog'); await p.click('#go');
 await p.waitForFunction(()=>phase==='boom',null,{timeout:12000}); const c2=await p.evaluate(()=>credits);
 console.log('bet placed',placed,'| after ×2 auto on a ×3 launch',c1,'(expect 510) | after a pad blow',c2,'(expect 500) | history',await p.evaluate(()=>history),'| errors',errs); await b.close(); })();
