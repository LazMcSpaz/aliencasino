const {chromium}=require('playwright'); const fs=require('fs');
const F='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/fonts/node_modules/@fontsource/';
const ff=(fam,file,w)=>`@font-face{font-family:"${fam}";font-weight:${w||400};src:url(data:font/woff2;base64,${fs.readFileSync(F+file).toString('base64')}) format("woff2")}`;
const fonts=ff("Monoton","monoton/files/monoton-latin-400-normal.woff2")+ff("Yellowtail","yellowtail/files/yellowtail-latin-400-normal.woff2")+ff("Bungee","bungee/files/bungee-latin-400-normal.woff2")+ff("Outfit","outfit/files/outfit-latin-500-normal.woff2",500)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-700-normal.woff2",700)+ff("Chakra Petch","chakra-petch/files/chakra-petch-latin-600-normal.woff2",600);
const OUT='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/';
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+fonts+'html,body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync('slot.html','utf8')+'</body></html>');
 await p.waitForTimeout(1200); await p.evaluate(()=>{ credits=2000; update(); });
 const shot=n=>p.screenshot({path:OUT+`mt_${n}.png`});
 const idle=()=>p.waitForFunction(()=>!spinning,null,{timeout:20000});
 const mood=async m=>{ await p.evaluate(m=>{ setMood(m,30); applyMoodUI(true); },m); await p.waitForTimeout(1300); };
 const reelBox=async i=>{ const bb=await p.locator('#r'+i).boundingBox(); return [bb.x+bb.width/2, bb.y+bb.height/2]; };
 // 1 happy: mood tip + pat
 await mood("happy"); await p.click('#facebox'); await p.waitForTimeout(500); await shot("1_happy");
 // 2 sleepy: tap reels to stop
 await mood("sleepy"); await shot("2a_sleepy_in"); await p.click('#spin'); await p.waitForTimeout(900);
 for(const i of [0,1,2]){ const [x,y]=await reelBox(i); await p.mouse.click(x,y); await p.waitForTimeout(350); }
 await p.waitForTimeout(150); await shot("2b_sleepy_tapped"); await idle(); await p.waitForTimeout(600);
 // 3 giddy: force a nudge
 await mood("giddy"); await p.evaluate(()=>{ MOODS.giddy.nudge=1; MOODS.giddy.pity=.9; });
 let got=false; for(let k=0;k<15 && !got;k++){ await p.click('#spin'); await p.waitForTimeout(400);
   got=await p.waitForFunction(()=>!!document.querySelector('.nudgebtn')||!spinning,null,{timeout:20000}).then(()=>p.evaluate(()=>!!document.querySelector('.nudgebtn')));
   if(!got){ await idle(); await p.waitForTimeout(700); } }
 console.log('nudge shown',got);
 if(got){ await shot("3a_nudge"); const c0=await p.evaluate(()=>credits); const [x,y]=await reelBox(2); await p.mouse.click(x,y); await p.waitForTimeout(600); await shot("3b_nudged"); await idle(); console.log('credits after nudge +', (await p.evaluate(()=>credits))-c0); }
 await p.evaluate(()=>{ MOODS.giddy.nudge=.35; MOODS.giddy.pity=.07; }); await p.waitForTimeout(2500);
 // 4 mischievous swap
 await mood("mischievous"); await p.evaluate(()=>{ MOODS.mischievous.swap=1; MOODS.mischievous.fake=0; });
 let sw=false; for(let k=0;k<8 && !sw;k++){ await p.click('#spin'); sw=await p.waitForFunction(()=>!!document.querySelector('.glass > .swapping')||!spinning,null,{timeout:20000}).then(()=>p.evaluate(()=>!!document.querySelector('.glass > .swapping'))); if(!sw){ await idle(); await p.waitForTimeout(700);} }
 console.log('swap shown',sw); if(sw){ await p.waitForTimeout(250); await shot("4_swap"); } await idle(); await p.waitForTimeout(2500);
 // 5 mischievous bluff
 await p.evaluate(()=>{ MOODS.mischievous.swap=0; MOODS.mischievous.fake=1; });
 await p.click('#spin'); const bl=await p.waitForSelector('.bluff',{timeout:8000}).then(()=>true).catch(()=>false); console.log('bluff shown',bl);
 if(bl){ await p.waitForTimeout(300); await shot("5a_bluff"); await p.locator('.bluff').dispatchEvent('pointerdown'); await idle(); await p.waitForTimeout(500); await shot("5b_called"); }
 await p.waitForTimeout(2500); await p.evaluate(()=>{ MOODS.mischievous.fake=.07; });
 // 6 grumpy smack
 await mood("grumpy"); await shot("6a_grumpy"); await p.click('#facebox'); await p.waitForTimeout(150); await shot("6b_smack");
 // 7 natural mood change
 await p.evaluate(()=>{ moodLeft=3; }); for(let k=0;k<3;k++){ await p.click('#spin'); await idle(); await p.waitForTimeout(2600); }
 console.log('mood now', await p.evaluate(()=>mood)); await shot("7_changed");
 console.log('errors',errs); await b.close(); })();
