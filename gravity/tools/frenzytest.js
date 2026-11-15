// Forces a frenzy spin and checks all three comets pay. Usage (from gravity/): node tools/frenzytest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent(fs.readFileSync('gravity.html','utf8')); await p.waitForTimeout(800);
 await p.evaluate(()=>{ for(let i=0;i<4;i++) addBet(0,i,5); addBet(1,0,5); addBet(2,0,5); FORCE.frenzy=true; paint(); });
 const c0=await p.evaluate(()=>credits);
 let res=null; await p.exposeFunction('grab',r=>{ res=r; }); await p.evaluate(()=>{ const s0=spin; spin=()=>{ const r=s0(); grab(JSON.parse(JSON.stringify(r))); return r; }; });
 await p.click('#go'); await p.waitForTimeout(3600); await p.screenshot({path:OUT+'/f1_frenzy.png'});
 await p.waitForFunction(()=>!spinning,null,{timeout:30000}); await p.waitForTimeout(800); await p.screenshot({path:OUT+'/f2_done.png'});
 const c1=await p.evaluate(()=>credits);
 console.log('frenzy:',res.frenzy,'balls:',res.balls.length,'| per-ball wins:',res.balls.map(b=>b.win),'| staked',res.staked,'| credits',c0,'→',c1,'expected',c0-res.staked+res.totalWin,'| errors',errs);
 await b.close(); })();
