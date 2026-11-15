const {chromium}=require('playwright'); const fs=require('fs');
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>`@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`;
const fonts=ff("Monoton","monoton/files/monoton-latin-400-normal.woff2")+ff("Yellowtail","yellowtail/files/yellowtail-latin-400-normal.woff2")+ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Outfit","outfit/files/outfit-latin-500-normal.woff2",500)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-700-normal.woff2",700)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-600-normal.woff2",600);
const OUT='/home/claude/slot/model3d/cap/'; fs.mkdirSync(OUT,{recursive:true});
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+fonts+'html,body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync('slot.html','utf8')+'</body></html>');
 await p.waitForTimeout(1500); await p.evaluate(()=>{ applyMachine("food"); render(); });
 // robot's top sign shows only the machine name
 await p.evaluate(()=>{ for(const id of ["coins","sndbtn","infobtn","bonuspill"]) document.getElementById(id).style.visibility="hidden"; });  await p.waitForTimeout(800);
 const R=await p.evaluate(()=>{ const r=s=>{ const b=document.querySelector(s).getBoundingClientRect(); return [b.left,b.top,b.width,b.height]; };
   return {hud:r('.hud'), face:r('#facebox'), glass:r('#glass'), controls:r('.controls'), vw:innerWidth, vh:innerHeight}; });
 fs.writeFileSync(OUT+'rects.json',JSON.stringify(R)); await p.screenshot({path:OUT+'full.png'});
 const moods={happy:["happy","Ooh, I like your style."],giddy:["big","Spin it! Spin it! Spin it!"],grumpy:["angry","Hmph. Fine. Spin, then."],sleepy:["sleepy","zzz... five more spins..."],mischievous:["sly","I know something you don't."]};
 for(const [m,[x,line]] of Object.entries(moods)){ await p.evaluate(([x,line])=>{ setFace(x,{hold:999999,line}); },[x,line]); await p.waitForTimeout(700);
   await p.screenshot({path:OUT+`face_${m}.png`,clip:{x:R.face[0]-12,y:R.face[1]-12,width:R.face[2]+24,height:R.face[3]+24}}); }
 console.log(R,errs); await b.close(); })();
