// Browser test. 1) 3 holes in the bottom row: crack 4 safe tiles, collect → 10 × ×multFor(3,4). 2) crack a hole → bet lost.
// Usage (from asteroid/): node tools/playtest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2]||'.';
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.stack));
 await p.setContent(fs.readFileSync('asteroid.html','utf8')); await p.waitForTimeout(600); await p.screenshot({path:OUT+'/a1_idle.png'});
 await p.evaluate(()=>{ FORCE.mines=[20,21,22]; }); await p.click('#go');
 for(const i of [0,6,12,3]){ await p.click(`.tile:nth-child(${i+1})`); await p.waitForTimeout(260); }
 await p.screenshot({path:OUT+'/a1_mid.png'}); const expect=await p.evaluate(()=>490+Math.floor(10*multFor(3,4)));
 await p.click('#go'); await p.waitForTimeout(300); await p.screenshot({path:OUT+'/a1_collect.png'}); const c1=await p.evaluate(()=>credits);
 await p.waitForTimeout(1500); await p.evaluate(()=>{ FORCE.mines=[20,21,22]; }); await p.click('#go'); await p.click('.tile:nth-child(1)'); await p.waitForTimeout(260); await p.click('.tile:nth-child(22)');
 await p.waitForTimeout(500); await p.screenshot({path:OUT+'/a1_hole.png'}); await p.waitForTimeout(1200); await p.screenshot({path:OUT+'/a1_after.png'}); const c2=await p.evaluate(()=>credits);
 console.log('collect after 4:',c1,'(expect',expect+')','| hole:',c2,'(expect',c1-10+')','| errors',errs); await b.close(); })();
