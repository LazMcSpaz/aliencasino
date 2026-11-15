// Frame-by-frame look at the cut-scenes (with the real fonts). Usage (from moons/): node tools/cineframes.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>{ try{ return `@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`; }catch(e){ return ""; } };
const fonts=ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Monoton","monoton/files/monoton-latin-400-normal.woff2")+ff("Yellowtail","yellowtail/files/yellowtail-latin-400-normal.woff2")+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-600-normal.woff2",600);
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync('moons.html','utf8').replace('<style>','<style>'+fonts)+'</body></html>'); await p.waitForTimeout(800);
 const shots=async(fn,times,tag)=>{ await p.evaluate(()=>{ window.__cineSlow=.12; }); await p.evaluate(fn); const t0=Date.now(); for(const [i,ms] of times.entries()){ const wt=ms/.12-(Date.now()-t0); if(wt>0) await p.waitForTimeout(wt); await p.screenshot({path:`${OUT}/${tag}_${i}.png`}); } await p.waitForTimeout(26000); };
 await shots(()=>{ Cine.collision([5,5],"Crashed before gap 3"); },[450,820,950,1080,1300,1750],'col');
 await shots(()=>{ Cine.orbit([2,5],"POINT HIT!","Gap 3 again"); },[400,700,900,1300,1900],'orb');
 console.log(errs); await b.close(); })();
