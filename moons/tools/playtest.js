// Plays a come-out, a point, then hits it; and a crash. Checks credits each time. Usage (from moons/): node tools/playtest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>{ try{ return `@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`; }catch(e){ return ""; } };
const fonts=ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Monoton","monoton/files/monoton-latin-400-normal.woff2")+ff("Yellowtail","yellowtail/files/yellowtail-latin-400-normal.woff2")+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-700-normal.woff2",700)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-600-normal.woff2",600);
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync('moons.html','utf8').replace('<style>','<style>'+fonts)+'</body></html>');
 await p.waitForTimeout(700);
 const R=async(d)=>{ await p.evaluate(d=>{ FORCE.dice=d; },d); await p.click('#go'); await p.waitForTimeout(500); await p.waitForFunction(()=>!rolling,null,{timeout:8000}); return p.evaluate(()=>({credits, point, table:tableTotal()})); };
 await p.click('.spot.with'); await p.click('.spot[data-spot="3"]'); await p.click('.spot.collide');   // 5 + 5 + 5
 await p.screenshot({path:OUT+'/m1_bets.png'});
 const a=await R([2,5]); await p.screenshot({path:OUT+'/m2_point.png'});           // gap 3 come-out: point 3; gap-3 bet wins ×1.7 → 8; collide loses
 const b2=await R([1,4]); await p.screenshot({path:OUT+'/m3_hit.png'});            // gap 3 again: WITH wins ×2 → 10
 await p.click('.spot.against'); await p.click('.spot.collide');
 const c=await R([6,6]); await p.waitForTimeout(150); await p.screenshot({path:OUT+'/m4_crash.png'});   // come-out crash (not 1/8): against wins 10, collide 37
 console.log('after point set',JSON.stringify(a),'(expect 485+8=493, point 3)\nafter hit',JSON.stringify(b2),'(expect 503, no point)\nafter crash',JSON.stringify(c),'(expect 503-10+10+37=540)\nerrors',errs);
 await b.close(); })();
