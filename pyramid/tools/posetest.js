// Screenshots every mascot pose in the real page, facing both ways. Usage (from pyramid/): node tools/posetest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent(fs.readFileSync('pyramid.html','utf8')); await p.waitForTimeout(800);
 const poses=await p.evaluate(()=>Object.keys(POSES));
 for(const side of ['r','l']) for(const ps of poses){
   await p.evaluate(([ps,side])=>{ const m=document.querySelector('.mascot'); m.querySelector('.bubble').style.display='none';
     m.querySelector('.bob').style.animation='none'; m.querySelector('.rig').style.setProperty('--fx', side==='r'?1:-1); Mascot.set(ps); m.querySelector('.rig').style.setProperty('--fx', side==='r'?1:-1); },[ps,side]);
   await p.waitForTimeout(350); const el=await p.$('.mascot'); await el.screenshot({path:`${OUT}/p_${side}_${ps}.png`}); }
 console.log(poses.length*2,'poses, errors',errs); await b.close(); })();
