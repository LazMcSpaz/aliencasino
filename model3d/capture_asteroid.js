// Screenshots Asteroid Field mid-run for the cabinet's curved screen (the same cabinet as the Pyramid robot). Run from model3d/: node capture_asteroid.js
const {chromium}=require('playwright'); const fs=require('fs');
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>{ try{ return `@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`; }catch(e){ return ""; } };
const fonts=ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Monoton","monoton/files/monoton-latin-400-normal.woff2")+ff("Yellowtail","yellowtail/files/yellowtail-latin-400-normal.woff2")+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-700-normal.woff2",700);
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 await p.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'',contentType:'text/css'}));
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync('../asteroid/asteroid.html','utf8').replace('<style>','<style>'+fonts)+'</body></html>'); await p.waitForTimeout(700);
 await p.evaluate(()=>{ FORCE.mines=[4,9,14]; }); await p.click('#go');
 for(const i of [0,6,12,18,7]){ await p.click(`.tile:nth-child(${i+1})`); await p.waitForTimeout(300); }
 await p.waitForTimeout(1900); await p.evaluate(()=>document.querySelectorAll('.bub,.banner').forEach(e=>e.style.display='none'));
 const R=await p.evaluate(()=>{ const a=document.getElementById('app').getBoundingClientRect(), c=document.querySelector('.controls').getBoundingClientRect(); return { top:a.top, ctrl:c.top-a.top-6 }; });
 await p.screenshot({path:'cap/ast_screen.png'}); const sz=await p.evaluate(()=>[innerWidth*2,innerHeight*2]);
 fs.writeFileSync('cap/ast_rects.json',JSON.stringify({w:sz[0],h:sz[1],ctrlTop:Math.round(R.ctrl*2)})); await b.close(); console.log('ok',sz,R); })();
