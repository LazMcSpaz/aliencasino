// Screenshots the real Pyramid Scheme game mid-climb for the pyramid robot's curved screen. Run from model3d/: node capture_pyramid.js
const {chromium}=require('playwright'); const fs=require('fs');
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>{ try{ return `@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`; }catch(e){ return ""; } };
const fonts=ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Monoton","monoton/files/monoton-latin-400-normal.woff2")+ff("Yellowtail","yellowtail/files/yellowtail-latin-400-normal.woff2")+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-700-normal.woff2",700)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-600-normal.woff2",600);
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync('../pyramid/pyramid.html','utf8').replace('<style>','<style>'+fonts)+'</body></html>');
 await p.waitForTimeout(800); await p.evaluate(()=>{ Math.random=(s=>()=>(s=(s*16807)%2147483647)/2147483647)(7); FORCE.perfect=true; });
 await p.click('#go'); await p.waitForFunction(()=>!busy);
 for(let i=0;i<4;i++){ if(await p.evaluate(()=>!!climb?.offer)){ await p.waitForTimeout(650); await p.click('#climb'); } await p.click('#go'); await p.waitForTimeout(100); await p.waitForFunction(()=>!busy,null,{timeout:10000}); }
 await p.evaluate(()=>{ document.querySelector('.bubble')?.classList.remove('show'); }); await p.waitForTimeout(1300);
 const R=await p.evaluate(()=>{ const a=document.getElementById('app').getBoundingClientRect(), c=document.getElementById('controls').getBoundingClientRect(); return {h:a.height, ctrlTop:c.top-a.top-6}; });
 fs.mkdirSync('cap',{recursive:true}); await p.screenshot({path:'cap/pyr_screen.png'});
 fs.writeFileSync('cap/pyr_rects.json',JSON.stringify(R)); console.log(R); await b.close(); })();
