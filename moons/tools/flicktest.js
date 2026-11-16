// Holds on the table, shakes, flicks up: should throw. Then checks the streak ladder lights. Usage (from moons/): node tools/flicktest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844},hasTouch:false}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent(fs.readFileSync('moons.html','utf8')); await p.waitForTimeout(700);
 await p.click('.spot.with'); await p.click('.streakspot');
 const z=await p.evaluate(()=>{ const r=document.getElementById('zone').getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height*.75]; });
 await p.mouse.move(...z); await p.mouse.down(); await p.waitForTimeout(500); await p.screenshot({path:OUT+'/f_shake.png'});
 await p.evaluate(()=>{ FORCE.dice=[2,5]; });
 await p.mouse.move(z[0]+10,z[1]-40,{steps:2}); await p.mouse.move(z[0]+30,z[1]-200,{steps:3}); await p.mouse.up();
 await p.waitForTimeout(500); await p.screenshot({path:OUT+'/f_flight.png'}); const thrown=await p.evaluate(()=>rolling);
 await p.waitForFunction(()=>!rolling,null,{timeout:12000});
 for(const d of [[1,4],[3,7],[2,6],[5,8],[1,4]]){ await p.evaluate(d=>{ FORCE.dice=d; },d); await p.click('#go'); await p.waitForTimeout(300); await p.waitForFunction(()=>!rolling,null,{timeout:15000}); }
 await p.screenshot({path:OUT+'/f_streak.png'}); const lit=await p.evaluate(()=>document.querySelectorAll('.rung.lit').length);
 console.log('flick threw the dice:',thrown,'| ladder rungs lit after 3 points:',lit,'| errors',errs); await b.close(); })();
