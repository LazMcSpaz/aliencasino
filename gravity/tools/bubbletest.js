// Shows the dealer and alien bubbles. Usage (from gravity/): node tools/bubbletest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent(fs.readFileSync('gravity.html','utf8')); await p.waitForTimeout(700);
 // make every alien speak once, plus the dealer
 await p.evaluate(()=>{ say("Place your bets, little earthling."); ["bet","win","lose","pool"].forEach((k,i)=>setTimeout(()=>Others.talk(Others._who? Others._who[i] : null,k,true),10)); });
 await p.waitForTimeout(400); await p.screenshot({path:OUT+'/bub.png'}); console.log(errs); await b.close(); })();
