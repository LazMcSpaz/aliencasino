// Golden stone effects + music tempo check. Usage (from pyramid/): node tools/goldfx.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent(fs.readFileSync('pyramid.html','utf8')); await p.waitForTimeout(700);
 await p.click('#go'); await p.waitForFunction(()=>!busy);
 await p.evaluate(()=>{ FORCE.gold=true; }); await p.click('#go');
 await p.waitForSelector('.goldrays',{timeout:8000}); await p.waitForTimeout(250); await p.screenshot({path:OUT+'/g1_burst.png'});
 await p.waitForFunction(()=>!busy,null,{timeout:10000}); await p.waitForTimeout(300); await p.screenshot({path:OUT+'/g2_beam.png'});
 console.log('errors',errs); await b.close(); })();
