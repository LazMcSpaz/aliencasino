const {chromium}=require('playwright'); const fs=require('fs');
const OUT='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/';
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync('slot.html','utf8')+'</body></html>');
 await p.waitForTimeout(1000);
 await p.evaluate(()=>{ credits=5000; update(); setMood("giddy",999); applyMoodUI(false); fastOn=true; });
 const res=[]; let shot=false;
 for(let k=0;k<14;k++){
   await p.click('#spin'); await p.waitForFunction(()=>!spinning,null,{timeout:20000}); await p.waitForTimeout(900);
   const open=await p.evaluate(()=>!!nudgeState && document.querySelectorAll('.nudgebtn.dn').length);
   if(!shot){ await p.screenshot({path:OUT+'n2_open.png'}); }
   const reel=k%3, bb=await p.locator('#r'+reel).boundingBox();
   const before=await p.evaluate(()=>({c:credits, t:nudgeState.r.total, above:nudgeState.r.above.slice(), g:nudgeState.r.g.map(c=>c.slice())}));
   await p.mouse.click(bb.x+bb.width/2, bb.y+bb.height/2); await p.waitForFunction(()=>!spinning,null,{timeout:5000}); await p.waitForTimeout(400);
   if(!shot){ await p.screenshot({path:OUT+'n2_after.png'}); shot=true; }
   const after=await p.evaluate(()=>({c:credits, g:grid.map(c=>c.slice()), dom:[0,1,2].map(i=>[...$("s"+i).children].map(c=>SYMBOLS.findIndex(s=>c.classList.contains("s-"+s[0])))), tags:document.querySelectorAll('.nudgebtn').length}));
   const expected=before.g.map(c=>c.slice()); expected[reel]=[before.above[reel],before.g[reel][0],before.g[reel][1]];
   const newPay=await p.evaluate(g=>payOf(g),expected);
   res.push({open, shifted: JSON.stringify(after.dom)===JSON.stringify(expected), credit: after.c-before.c===newPay-before.t, was:before.t, now:newPay, tagsGone: after.tags===0});
   await p.waitForTimeout(900);
 }
 console.log('nudge offered every spin:',res.every(r=>r.open===3),'| reel slid correctly:',res.filter(r=>r.shifted).length+'/'+res.length,'| credits right:',res.filter(r=>r.credit).length+'/'+res.length,'| one nudge only:',res.every(r=>r.tagsGone));
 console.log('win before → after:',res.map(r=>r.was+'→'+r.now).join('  '));
 console.log('errors',errs); await b.close(); })();
