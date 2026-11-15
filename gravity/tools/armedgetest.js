// Checks every alien visit: the arm's cut end must always land outside the play area. Usage (from gravity/): node tools/armedgetest.js
const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent(fs.readFileSync('gravity.html','utf8')); await p.waitForTimeout(600);
 // wrap drawImage on the fx layer to find where each arm's cut end is drawn
 const bad=await p.evaluate(async()=>{ let worst=-1e9, n=0; const ctx=document.getElementById('fx').getContext('2d'), di=ctx.drawImage.bind(ctx);
   ctx.drawImage=function(im,x,y,w,h){ const W=Others && im.src && im.src.length; const m=ctx.getTransform(), dpr=Math.min(3,devicePixelRatio||1);
     const arm=[...document.querySelectorAll('x')]; di(im,x,y,w,h);
     const who=['tentacle_purple','tentacle_orange','hand_pinch','hand_closed'].find(k=>ART.arms[k]===im.src); if(!who) return;
     const B={tentacle_purple:[.30,.975],tentacle_orange:[.55,.02],hand_pinch:[.52,.985],hand_closed:[.5,.985]}[who];
     const st=document.getElementById('fx').getBoundingClientRect();
     for(const off of [-.38,0,.38]){ const lx=x+(B[0]+off)*w, ly=y+B[1]*h, X=(m.a*lx+m.c*ly+m.e)/dpr, Y=(m.b*lx+m.d*ly+m.f)/dpr;   // both corners and the middle of the cut end
       const inside=Math.min(X, Y, st.width-X, st.height-Y); worst=Math.max(worst,inside); } n++; };
   await new Promise(r=>setTimeout(r,12000)); return {worst:Math.round(worst), frames:n}; });
 console.log('cut-end distance inside the play area (negative = safely outside):',bad.worst,'px over',bad.frames,'arm frames | errors',errs);
 await b.close(); })();
