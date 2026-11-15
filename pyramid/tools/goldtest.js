// Golden stone run-through. Usage (from pyramid/): node tools/goldtest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>`@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`;
const fonts=ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Monoton","monoton/files/monoton-latin-400-normal.woff2")+ff("Yellowtail","yellowtail/files/yellowtail-latin-400-normal.woff2")+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-700-normal.woff2",700)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-600-normal.woff2",600)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-500-normal.woff2",500);
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync('pyramid.html','utf8').replace('<style>','<style>'+fonts)+'</body></html>');
 await p.waitForTimeout(700);
 await p.click('#go'); await p.waitForFunction(()=>!busy);
 await p.evaluate(()=>{ FORCE.gold=true; }); await p.click('#go'); await p.waitForTimeout(2350); await p.screenshot({path:OUT+'/gd_1.png'});
 await p.waitForFunction(()=>!busy,null,{timeout:10000}); await p.screenshot({path:OUT+'/gd_2.png'});
 const log=[];
 for(let i=0;i<3;i++){ if(await p.evaluate(()=>!!climb?.offer)){ await p.waitForTimeout(650); await p.click('#climb'); } if(!(await p.evaluate(()=>!!climb))) break;
   const before=await p.evaluate(()=>({w:climb.w, beam:climb.beam})); await p.click('#go'); await p.waitForTimeout(100); await p.waitForFunction(()=>!busy,null,{timeout:10000});
   log.push(await p.evaluate(b=>climb ? `beam ${b.beam}→${climb.beam}, width ${b.w}→${climb.w}` : 'climb ended', before)); if(i===1) await p.screenshot({path:OUT+'/gd_3.png'}); }
 console.log(log.join(' | ')); console.log('beam visuals off at end:', await p.evaluate(()=>!document.getElementById('app').classList.contains('beam')));
 console.log('errors',errs); await b.close(); })();
