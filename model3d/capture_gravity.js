// Grabs the Gravity Well bowl (as drawn by the game) to use as the 3D table's bowl texture. Run from model3d/: node capture_gravity.js
const {chromium}=require('playwright'); const fs=require('fs');
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>{ try{ return `@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`; }catch(e){ return ""; } };
const fonts=ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-700-normal.woff2",700);
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:420,height:900},deviceScaleFactor:3});
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync('../gravity/gravity.html','utf8').replace('<style>','<style>'+fonts)+'</body></html>');
 await p.waitForTimeout(900);
 const url=await p.evaluate(async()=>{ await document.fonts.ready; clearInterval(window.__x); const c=document.getElementById('bowl');
   // a clean table: no chips, no "VOID BET" label, no pool dish
   bets.voidBet=0; bets.frenzyBet=0; const dp=drawPool; window.drawPool=()=>{}; spinning=true; draw(); return c.toDataURL('image/png'); });
 fs.mkdirSync('cap',{recursive:true}); fs.writeFileSync('cap/gw_bowl.png', Buffer.from(url.split(',')[1],'base64')); await b.close(); console.log('ok'); })();
