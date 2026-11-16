// Screenshots the lobby (served over http so the games can be fetched): overview, a focused game, a game opened.
// Usage (from lobby/, with "python3 -m http.server 8765" running here): node tools/shot.js <outdir> <three-node_modules-dir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2]||'.', NM=process.argv[3];
(async()=>{ const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}); const errs=[];
 const p=await b.newPage({viewport:{width:390,height:844}}); p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
 await p.route('https://cdn.jsdelivr.net/npm/**', r=>{ const u=r.request().url().replace('https://cdn.jsdelivr.net/npm/three@0.147.0/', NM+'/three/'); r.fulfill({body:fs.readFileSync(u),contentType:'application/javascript'}); });
 await p.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'',contentType:'text/css'}));
 const t0=Date.now(); await p.goto('http://localhost:8765/lobby.html'); await p.waitForFunction(()=>document.getElementById('hint').textContent.startsWith('TAP'),null,{timeout:90000});
 console.log('loaded in',Date.now()-t0,'ms'); await p.waitForTimeout(1500); await p.screenshot({path:OUT+'/lb_home.png'});
 for(const id of (process.argv[4]||'warp').split(',')){ await p.evaluate(id=>focus(id),id); await p.waitForTimeout(1600); await p.screenshot({path:OUT+`/lb_${id}.png`}); }
 await p.click('#cPlay'); await p.waitForTimeout(3500); await p.screenshot({path:OUT+'/lb_play.png'});
 console.log('errors',errs.slice(0,5)); await b.close(); })();
