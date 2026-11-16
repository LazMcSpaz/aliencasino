// Grabs the Warp Drive flight screen at a few moments (pad, clouds, orbit, nebula, explosion) and the betting panel,
// to use as the 3D concept's screen textures. Run from model3d/: node capture_warp.js
const {chromium}=require('playwright'); const fs=require('fs');
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>{ try{ return `@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`; }catch(e){ return ""; } };
const fonts=ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-700-normal.woff2",700)+ff("Monoton","monoton/files/monoton-latin-400-normal.woff2")+ff("Yellowtail","yellowtail/files/yellowtail-latin-400-normal.woff2");
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 await p.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'',contentType:'text/css'}));
 await p.setContent(fs.readFileSync('../warp/warp.html','utf8').replace('<style>','<style>'+fonts)); await p.waitForTimeout(1800);
 const shot=async(name,sel)=>{ const el=await p.$(sel); await el.screenshot({path:`cap/${name}.png`}); };
 await p.evaluate(()=>{ document.querySelectorAll('.bub,.abub').forEach(e=>e.style.display='none'); }); await shot('warp_pad','#screen');
 await p.evaluate(()=>{ FORCE.crash=60; }); await p.waitForFunction(()=>phase==='flight',null,{timeout:9000});
 for(const [n,m] of [['warp_clouds',1.3],['warp_orbit',3.3],['warp_nebula',27]]){ await p.evaluate(m=>{ t0=performance.now()-timeFor(m)*1000; },m); await p.waitForTimeout(700);
   await p.evaluate(()=>{ document.querySelectorAll('.bub,.abub').forEach(e=>e.style.display='none'); }); await shot(n,'#screen'); }
 await p.evaluate(()=>{ t0=performance.now()-timeFor(59.9)*1000; }); await p.waitForTimeout(450); await shot('warp_boom','#screen');
 await b.close(); console.log('ok'); })();
