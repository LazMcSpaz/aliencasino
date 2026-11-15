// Browser run-through with screenshots. Usage (from pyramid/): node tools/shots.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>`@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`;
const fonts=ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Bungee Shade","bungee-shade/files/bungee-shade-latin-400-normal.woff2")+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-700-normal.woff2",700)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-600-normal.woff2",600)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-500-normal.woff2",500);
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 const html=fs.readFileSync('pyramid.html','utf8').replace('<style>','<style>'+fonts);
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>');
 await p.waitForTimeout(800); const shot=n=>p.screenshot({path:`${OUT}/py_${n}.png`});
 await shot('0_start');
 await p.click('#play'); await p.waitForSelector('#drop'); await shot('1_row1');
 await p.evaluate(()=>{ FORCE.perfect=true; });
 await p.click('#drop'); await p.waitForTimeout(500); await shot('2_sliding'); await p.waitForSelector('#drop'); 
 await p.evaluate(()=>{ FORCE.perfect=false; });
 while(!(await p.$('#cash'))){ if(!(await p.$('#drop'))) break; await p.click('#drop'); await p.waitForFunction(()=>!busy,null,{timeout:10000}); }
 await shot('3_band');
 if(await p.$('#cash')){ await p.click('#climb'); await p.evaluate(()=>{ FORCE.collapse=true; }); await p.click('#drop'); await p.waitForTimeout(1900); await shot('4_collapse'); await p.waitForSelector('#play'); }
 // perfect climb to the top
 await p.evaluate(()=>{ FORCE.perfect=true; });
 await p.click('#play'); await p.waitForSelector('#drop');
 for(let i=0;i<12;i++){ if(await p.$('#climb')) await p.click('#climb'); if(!(await p.$('#drop'))) break; await p.click('#drop'); await p.waitForTimeout(150); await p.waitForFunction(()=>!busy || !climb,null,{timeout:10000}); await p.waitForTimeout(700); if(await p.evaluate(()=>!climb)) break; }
 await shot('5_top');
 console.log('credits', await p.evaluate(()=>credits), 'errors', errs); await b.close(); })();
