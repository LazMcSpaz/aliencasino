// Close-up screenshots of the alien (head, torso, gown), posed still. Usage (from model3d/): node shotalien.js '<views json>' [outPrefix]
const {chromium}=require('playwright'); const fs=require('fs');
const NM='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/m3d/node_modules/', OUT='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/';
const views=JSON.parse(process.argv[2]||'[{"cam":[1.6,1.7,4.2]}]');
(async()=>{ const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}); const errs=[];
 const p=await b.newPage({viewport:{width:800,height:900}}); p.on('pageerror',e=>errs.push(e.message));
 await p.route('https://cdn.jsdelivr.net/npm/**', r=>{ const u=r.request().url().replace('https://cdn.jsdelivr.net/npm/three@0.147.0/', NM+'three/'); r.fulfill({body:fs.readFileSync(u),contentType:'application/javascript'}); });
 await p.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'',contentType:'text/css'}));
 await p.goto('file://'+__dirname+'/'+(process.env.PAGE||'alien_patron.html')); await p.waitForTimeout(2000);
 await p.evaluate(()=>{ document.querySelector('.ui').style.display='none'; document.querySelector('header').style.display='none'; });
 for(const [i,v] of views.entries()){ await p.evaluate(v=>{ ctl.autoRotate=false; ctl.minDistance=.2; cam.position.set(...v.cam); if(v.t) ctl.target.set(...v.t); setAnim(v.anim||'Stop'); ctl.update(); }, v); await p.waitForTimeout(v.wait||500); await p.screenshot({path:OUT+(process.env.PRE||'al_')+i+'.png'}); }
 console.log(errs); await b.close(); })();
