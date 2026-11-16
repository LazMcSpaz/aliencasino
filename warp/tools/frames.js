// Screenshots of a long flight at set multipliers (uses window.__frozen to stop time). Usage: node tools/frames.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2]||'.';
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.stack));
 await p.setContent(fs.readFileSync('warp.html','utf8')); await p.waitForTimeout(1500); await p.screenshot({path:OUT+'/x_wait.png'});
 await p.evaluate(()=>{ FORCE.crash=80; }); await p.click('#go');
 await p.waitForFunction(()=>phase==='flight',null,{timeout:9000});
 // jump time: shift the launch clock so the multiplier hits each target
 for(const m of [1.12,1.35,2.05,3.1,5.2,26,52]){ await p.evaluate(m=>{ t0=performance.now()-timeFor(m)*1000; },m); await p.waitForTimeout(m===1.12?250:420); await p.screenshot({path:OUT+`/x_${m}.png`}); }
 await p.evaluate(()=>{ t0=performance.now()-timeFor(79.9)*1000; }); await p.waitForTimeout(500); await p.screenshot({path:OUT+'/x_boom.png'});
 console.log('errors',errs); await b.close(); })();
