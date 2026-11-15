// Anchor run-through. Usage (from pyramid/): node tools/anchortest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>`@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`;
const fonts=ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Monoton","monoton/files/monoton-latin-400-normal.woff2")+ff("Yellowtail","yellowtail/files/yellowtail-latin-400-normal.woff2")+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-700-normal.woff2",700)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-600-normal.woff2",600)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-500-normal.woff2",500);
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync('pyramid.html','utf8').replace('<style>','<style>'+fonts)+'</body></html>');
 await p.waitForTimeout(700);
 // play until the top row is 2–4 wide with no offer showing
 let ready=false;
 for(let g=0; g<30 && !ready; g++){
   if(await p.evaluate(()=>!climb)){ await p.click('#go'); await p.waitForFunction(()=>!busy); }
   ready = await p.evaluate(()=>climb && !climb.offer && climb.w>=2 && climb.w<5);
   if(ready) break;
   if(await p.$('#climb')) await p.click('#climb');
   await p.click('#go'); await p.waitForTimeout(100); await p.waitForFunction(()=>!busy,null,{timeout:10000});
   ready = await p.evaluate(()=>climb && !climb.offer && climb.w>=2 && climb.w<5);
 }
 console.log('found a narrower top row:', ready);
 const c0=await p.evaluate(()=>({credits, a:climb.a, w:climb.w, row:climb.row}));
 await p.waitForTimeout(400); await p.screenshot({path:OUT+'/an_1.png'});
 const nSpots=await p.evaluate(()=>document.querySelectorAll('.ghost').length);
 await p.locator('.ghost').first().click(); await p.waitForTimeout(500); await p.screenshot({path:OUT+'/an_2.png'});
 const c1=await p.evaluate(()=>({credits, anchorCol:climb.anchorCol, used:climb.anchorUsed, btn:document.getElementById('anchorbtn').textContent, disabled:document.querySelectorAll('.ghost').length===0}));
 console.log('spots shown:',nSpots,'| credits',c0.credits,'->',c1.credits,'(cost',c0.credits-c1.credits,') | anchor col',c1.anchorCol,'| button:',c1.btn,'disabled',c1.disabled);
 await p.click('#go'); await p.waitForTimeout(100); await p.waitForFunction(()=>!busy,null,{timeout:10000}); await p.screenshot({path:OUT+'/an_3.png'});
 console.log('after drop:', await p.evaluate(()=>climb ? `row ${climb.row}, width ${climb.w}, anchor support cleared: ${climb.anchorCol==null}` : 'collapsed'));
 console.log('errors',errs); await b.close(); })();
