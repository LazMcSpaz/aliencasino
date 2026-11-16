// Checks the table holds still during a roll, and snapshots the cut-scenes. Usage (from moons/): node tools/cinetest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent(fs.readFileSync('moons.html','utf8')); await p.waitForFunction(()=>!Others.open,null,{timeout:8000}); await p.waitForTimeout(600);
 const shown=()=>p.evaluate(()=>({bet:document.getElementById('bet').textContent, puck:document.querySelector('#puck b').textContent, credits:document.getElementById('credits').textContent}));
 await p.click('.spot.with'); await p.evaluate(()=>{ FORCE.dice=[2,5]; }); await p.click('#go'); await p.waitForFunction(()=>!rolling&&!Others.open,null,{timeout:20000});
 // point 3 is on; now hit it and watch the table during the animation
 await p.evaluate(()=>{ FORCE.dice=[1,4]; }); await p.click('#go'); await p.waitForTimeout(900); const mid=await shown();
 await p.waitForTimeout(1300); await p.screenshot({path:OUT+'/c_orbit.png'}); const mid2=await shown();
 await p.waitForFunction(()=>!rolling&&!Others.open,null,{timeout:20000}).catch(async e=>{ console.log('STUCK', await p.evaluate(()=>({rolling,inFlight,point,view:!!view,comets:typeof comets}))); throw e; }); const after=await shown();
 await p.click('.spot.against'); await p.evaluate(()=>{ FORCE.dice=[5,5]; }); await p.click('#go');
 await p.waitForTimeout(1950); await p.screenshot({path:OUT+'/c_crash1.png'}); await p.waitForTimeout(500); await p.screenshot({path:OUT+'/c_crash2.png'});
 await p.waitForFunction(()=>!rolling&&!Others.open,null,{timeout:20000});
 console.log('during the point-hit animation:',JSON.stringify(mid),JSON.stringify(mid2),'| after:',JSON.stringify(after),'| errors',errs); await b.close(); })();
