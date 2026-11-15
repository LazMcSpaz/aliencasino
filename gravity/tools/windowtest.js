// After a spin: the betting window should block SPIN briefly while the aliens bet fast. Usage (from gravity/): node tools/windowtest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent(fs.readFileSync('gravity.html','utf8')); await p.waitForTimeout(600);
 await p.evaluate(()=>{ addBet(0,0,5); paint(); }); await p.click('#go'); await p.waitForFunction(()=>!spinning,null,{timeout:30000});
 const t0=Date.now(); const st=await p.evaluate(()=>({disabled:document.getElementById('go').disabled, label:document.querySelector('#go small').textContent}));
 // catch a frame mid-drop (arm at full reach, chip under it)
 let shot=false; for(let i=0;i<40 && !shot;i++){ await p.waitForTimeout(60); const v=await p.evaluate(()=>Others.active); if(v){ await p.waitForTimeout(380); await p.screenshot({path:OUT+'/w_drop.png'}); shot=true; } }
 await p.waitForFunction(()=>!document.getElementById('go').disabled,null,{timeout:8000}); const open=Date.now()-t0;
 const n=await p.evaluate(()=>{ let k=0; return k; });
 await p.screenshot({path:OUT+'/w_after.png'});
 console.log('right after the spin: SPIN disabled',st.disabled,'label',JSON.stringify(st.label),'| SPIN back after ~',open,'ms | errors',errs);
 await b.close(); })();
