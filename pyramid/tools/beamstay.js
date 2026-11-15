// Golden stone on a band row: the mascot must arrive, then beam, then stay put. Usage (from pyramid/): node tools/beamstay.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent(fs.readFileSync('pyramid.html','utf8')); await p.waitForTimeout(700);
 await p.evaluate(()=>{ FORCE.perfect=true; }); await p.click('#go'); await p.waitForFunction(()=>!busy);
 for(let i=0;i<2;i++){ await p.click('#go'); await p.waitForTimeout(100); await p.waitForFunction(()=>!busy,null,{timeout:10000}); }
 await p.evaluate(()=>{ FORCE.perfect=false; FORCE.gold=true;
   window.trace=[]; const m=document.querySelector('.mascot'); const t0=performance.now();
   setInterval(()=>trace.push([Math.round(performance.now()-t0), m.getBoundingClientRect().left|0, document.getElementById('app').classList.contains('beam')]),100); });
 await p.click('#go'); await p.waitForTimeout(100); await p.waitForFunction(()=>!busy,null,{timeout:15000});
 const offer=await p.evaluate(()=>!!climb?.offer); await p.waitForTimeout(800); await p.screenshot({path:OUT+'/b1_offer.png'});
 if(offer){ await p.click('#climb'); await p.waitForTimeout(1200); }
 await p.screenshot({path:OUT+'/b2_after_climb.png'});
 await p.click('#go'); await p.waitForTimeout(100); await p.waitForFunction(()=>!busy,null,{timeout:15000});
 const tr=await p.evaluate(()=>trace);
 // first moment the beam is on, and the mascot x range from then on (excluding the last beam drop)
 const on=tr.findIndex(x=>x[2]); const xs=tr.slice(on).filter(x=>x[2]).map(x=>x[1]);
 const before=tr.slice(Math.max(0,on-3),on).map(x=>x[1]);
 console.log('gold row was a band (offer):',offer,'| x just before beam:',before.join(','),'| x while beaming: min',Math.min(...xs),'max',Math.max(...xs),'| errors',errs);
 await b.close(); })();
