// Skim run-through. Usage (from pyramid/): node tools/skimtest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>`@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`;
const fonts=ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Monoton","monoton/files/monoton-latin-400-normal.woff2")+ff("Yellowtail","yellowtail/files/yellowtail-latin-400-normal.woff2")+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-700-normal.woff2",700)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-600-normal.woff2",600)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-500-normal.woff2",500);
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync('pyramid.html','utf8').replace('<style>','<style>'+fonts)+'</body></html>');
 await p.waitForTimeout(700); await p.evaluate(()=>{ FORCE.perfect=true; });
 await p.click('#go'); await p.waitForFunction(()=>!busy);
 for(let i=0;i<2;i++){ await p.click('#go'); await p.waitForTimeout(100); await p.waitForFunction(()=>!busy); }
 const before=await p.evaluate(()=>({credits, total:climb.total, n:document.querySelectorAll('.stone.skimmable').length}));
 // skim the two most valuable shimmering stones
 for(let k=0;k<2;k++){ const ok=await p.evaluate(()=>{ const s=stoneEls.filter(x=>x.el.classList.contains('skimmable')).sort((a,b)=>b.val-a.val)[0]; if(!s) return false; s.el.click(); return true; }); await p.waitForTimeout(250); }
 await p.waitForTimeout(500); await p.screenshot({path:OUT+'/sk_1.png'});
 const after=await p.evaluate(()=>({credits, total:climb.total, cracks:climb.cracks, risk:document.querySelector('#stackwin .next').textContent}));
 console.log('skimmable stones:',before.n,'| credits',before.credits,'->',after.credits,'| stacked',before.total,'->',after.total,'|',after.risk);
 // crack collapse
 await p.evaluate(()=>{ climb.cracks=200; }); await p.click('#go'); await p.waitForTimeout(600); await p.screenshot({path:OUT+'/sk_2.png'});
 await p.waitForFunction(()=>!busy,null,{timeout:8000}); console.log('after crack collapse: climb over =', await p.evaluate(()=>!climb), '| credits kept', await p.evaluate(()=>credits));
 console.log('errors',errs); await b.close(); })();
