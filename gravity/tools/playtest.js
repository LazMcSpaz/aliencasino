// Places bets by tapping the bowl, spins, screenshots mid-spin and after, and checks credits. Usage (from gravity/): node tools/playtest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>{ try{ return `@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`; }catch(e){ return ""; } };
const fonts=ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Monoton","monoton/files/monoton-latin-400-normal.woff2")+ff("Yellowtail","yellowtail/files/yellowtail-latin-400-normal.woff2")+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-700-normal.woff2",700)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-600-normal.woff2",600);
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync('gravity.html','utf8').replace('<style>','<style>'+fonts)+'</body></html>');
 await p.waitForTimeout(800);
 // tap a point on the bowl at (tier mid-radius, angle in turns)
 const tap=async(t,a)=>{ const xy=await p.evaluate(([t,a])=>{ const b=cv.getBoundingClientRect(); const r=t<0?0:(R[t]+R[t+1])/2; const [x,y]=P(r,a); return [b.left+x,b.top+y]; },[t,a]); await p.mouse.click(...xy); };
 await tap(0,.13); await tap(0,.13); await tap(1,.40); await tap(2,.77); await tap(-1,0);
 await p.click('#path'); await tap(0,.62); await tap(1,.66); await tap(2,.70); await p.click('#path');
 const before=await p.evaluate(()=>({credits, bet:totalBet(), path:pathReady(), tiers:JSON.stringify(bets.tiers), voidBet:bets.voidBet}));
 await p.waitForTimeout(300); await p.screenshot({path:OUT+'/g1_bets.png'});
 await p.click('#go'); await p.waitForTimeout(3300); await p.screenshot({path:OUT+'/g2_mid.png'});
 await p.waitForFunction(()=>!spinning,null,{timeout:15000}); await p.waitForTimeout(400); await p.screenshot({path:OUT+'/g3_done.png'});
 const after=await p.evaluate(()=>({credits, strip:[0,1,2,3].map(k=>document.querySelector('#c'+k+' b').textContent)}));
 // path jackpot through the debug force
 await p.evaluate(()=>{ FORCE.angles=bets.path.picks.map((pk,t)=>{ const [a0,a1]=sectionSpan(t,pk); return (a0+a1)/2; }); });
 const c0=await p.evaluate(()=>credits); await p.click('#go'); await p.waitForFunction(()=>!spinning,null,{timeout:15000});
 const jack=await p.evaluate(()=>credits); await p.screenshot({path:OUT+'/g4_jackpot.png'});
 console.log('before',JSON.stringify(before),'\nafter',JSON.stringify(after),'\npath jackpot spin: credits',c0,'→',jack,'(expect +',5*1250,'minus stake plus tier wins)','\nerrors',errs);
 await b.close(); })();
