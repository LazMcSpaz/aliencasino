// Close look at the pad: before launch, the first moments of liftoff, and the exhaust. Usage: node tools/padframes.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2]||'.';
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}); const errs=[]; p.on('pageerror',e=>errs.push(e.stack));
 await p.setContent(fs.readFileSync('warp.html','utf8')); await p.waitForTimeout(5200); await p.screenshot({path:OUT+'/p_wait.png'});
 await p.evaluate(()=>{ FORCE.crash=40; }); await p.waitForFunction(()=>phase==='flight',null,{timeout:9000});
 for(const [i,ms] of [[0,300],[1,600],[2,900]]){ await p.waitForTimeout(i?300:300); await p.screenshot({path:OUT+`/p_lift${i}.png`}); }
 await p.evaluate(()=>{ t0=performance.now()-timeFor(2.6)*1000; }); await p.waitForTimeout(400); await p.screenshot({path:OUT+'/p_fly.png'});
 console.log('errors',errs); await b.close(); })();
