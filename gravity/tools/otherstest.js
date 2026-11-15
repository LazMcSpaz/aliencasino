// Watches the other players bet for a while, then spins. Usage (from gravity/): node tools/otherstest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent(fs.readFileSync('gravity.html','utf8')); await p.waitForTimeout(800);
 const shots=[]; for(let i=0;i<14;i++){ await p.waitForTimeout(500); if(await p.evaluate(()=>Others.active)){ await p.screenshot({path:OUT+`/o_${shots.length}.png`}); shots.push(i); if(shots.length>=3) break; } }
 await p.waitForTimeout(2500); await p.screenshot({path:OUT+'/o_table.png'});
 await p.evaluate(()=>{ addBet(0,0,5); paint(); }); await p.click('#go'); await p.waitForFunction(()=>!spinning,null,{timeout:30000}); await p.waitForTimeout(300); await p.screenshot({path:OUT+'/o_after.png'});
 console.log('arm shots',shots.length,'errors',errs); await b.close(); })();
