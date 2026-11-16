const {chromium}=require('playwright'); const fs=require('fs');
const NM='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/m3d/node_modules/';
const OUT='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/';
(async()=>{ const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}); const errs=[];
 const p=await b.newPage({viewport:{width:800,height:900}}); p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('fonts'))errs.push(m.text())});
 await p.route('https://cdn.jsdelivr.net/npm/**', r=>{ const u=r.request().url().replace('https://cdn.jsdelivr.net/npm/three@0.147.0/', NM+'three/'); r.fulfill({body:fs.readFileSync(u),contentType:'application/javascript'}); });
 await p.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'',contentType:'text/css'}));
 await p.goto('file://'+__dirname+'/warp_stage.html'); await p.waitForTimeout(2500);
 const views=JSON.parse(process.argv[2]||'[]');
 for(const [i,v] of views.entries()){ await p.evaluate(v=>{ ctl.autoRotate=false; cam.position.set(...v.cam); if(v.t) ctl.target.set(...v.t); if(v.anim) setAnim(v.anim); ctl.update(); }, v); await p.waitForTimeout(v.wait||400); await p.screenshot({path:OUT+`wst_${i}.png`}); }
 console.log(errs); await b.close(); })();
