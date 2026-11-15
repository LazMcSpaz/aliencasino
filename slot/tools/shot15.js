const {chromium}=require('playwright'); const fs=require('fs');
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>`@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`;
const fonts=ff("Monoton","monoton/files/monoton-latin-400-normal.woff2")+ff("Yellowtail","yellowtail/files/yellowtail-latin-400-normal.woff2")+ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Outfit","outfit/files/outfit-latin-500-normal.woff2",500)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-700-normal.woff2",700)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-600-normal.woff2",600);
(async()=>{const b=await chromium.launch(); const d=process.argv[2]; const which=process.argv[3]; const times=process.argv.slice(4).map(Number); const errs=[];
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1}); p.on('pageerror',e=>errs.push(e.message));
await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+fonts+'html,body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync('slot.html','utf8')+'</body></html>');
await p.waitForTimeout(1500); await p.evaluate(m=>{ applyMachine(m); render(); FORCE.bonus=true; }, which); await p.click('#spin');
let last=0; for(const [i,t] of times.entries()){ await p.waitForTimeout(t-last); last=t; await p.screenshot({path:`${d}/u_${which}_${i}.png`}); }
console.log(errs); await b.close();})();
