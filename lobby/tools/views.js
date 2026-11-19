// Screenshots the lobby from set camera spots. Usage (from lobby/, http.server on 8765 running): node tools/views.js <outdir> <three-node_modules-dir> '<json [{name,w,h,cam?,t?}]>'
const {chromium}=require('playwright'); const fs=require('fs'); const [OUT,NM,J]=process.argv.slice(2);
(async()=>{ const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}); const errs=[];
 for(const v of JSON.parse(J)){ const p=await b.newPage({viewport:{width:v.w||1280,height:v.h||720}}); p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.route('https://cdn.jsdelivr.net/npm/**', r=>{ const u=r.request().url().replace('https://cdn.jsdelivr.net/npm/three@0.147.0/', NM+'/three/'); r.fulfill({body:fs.readFileSync(u),contentType:'application/javascript'}); });
  await p.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'',contentType:'text/css'}));
  const t0=Date.now(); await p.goto('http://localhost:8765/lobby.html'); await p.waitForFunction(()=>window.__lobbyReady,null,{timeout:120000});
  if(v.cam){ await p.evaluate(v=>{ cam.position.set(...v.cam); ctl.target.set(...v.t); ctl.update(); },v); }
  await p.waitForTimeout(v.wait||1500); await p.screenshot({path:`${OUT}/lv_${v.name}.png`}); console.log(v.name,'loaded in',Date.now()-t0,'ms'); await p.close(); }
 console.log('errors',errs.slice(0,6)); await b.close(); })();
