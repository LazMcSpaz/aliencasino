// Mascot + band-choice run-through. Usage (from pyramid/): node tools/mascottest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>{ try{ return `@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`; }catch(e){ return ""; } };
const fonts=ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Monoton","monoton/files/monoton-latin-400-normal.woff2")+ff("Yellowtail","yellowtail/files/yellowtail-latin-400-normal.woff2")+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-700-normal.woff2",700)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-600-normal.woff2",600);
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync('pyramid.html','utf8').replace('<style>','<style>'+fonts)+'</body></html>');
 await p.waitForTimeout(900); await p.screenshot({path:OUT+'/m1_idle.png'});
 await p.evaluate(()=>{ FORCE.perfect=true; });
 await p.click('#go'); await p.waitForFunction(()=>!busy); await p.waitForTimeout(1200); await p.screenshot({path:OUT+'/m2_start.png'});
 for(let i=0;i<3;i++){ await p.click('#go'); await p.waitForTimeout(100); await p.waitForFunction(()=>!busy,null,{timeout:10000}); }
 await p.waitForTimeout(400); await p.screenshot({path:OUT+'/m3_offer_early.png'});
 // a fast tap right after the panel appears must not pick anything
 await p.mouse.click(195, 300); const early=await p.evaluate(()=>!!climb?.offer);
 await p.waitForTimeout(900); await p.screenshot({path:OUT+'/m4_offer.png'});
 // tapping where DROP lives does nothing while choosing
 const g=await p.$('#go'); const dis=await g.isDisabled();
 await p.click('#climb'); await p.waitForTimeout(300);
 await p.evaluate(()=>{ FORCE.perfect=false; FORCE.gold=true; });
 await p.click('#go'); await p.waitForTimeout(100); await p.waitForFunction(()=>!busy,null,{timeout:15000}); await p.waitForTimeout(600);
 await p.screenshot({path:OUT+'/m5_beam.png'});
 const st=await p.evaluate(()=>({beam:climb&&climb.beam, row:climb&&climb.row}));
 console.log('offer survived early tap:',early,'| DROP disabled during choice:',dis,'| after gold',JSON.stringify(st),'| errors',errs);
 await b.close(); })();
