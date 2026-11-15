// Bets the frenzy pool by tapping the dish, forces a frenzy, checks the payout. Usage (from gravity/): node tools/pooltest.js <outdir>
const {chromium}=require('playwright'); const fs=require('fs'); const OUT=process.argv[2];
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.setContent(fs.readFileSync('gravity.html','utf8')); await p.waitForTimeout(700);
 const xy=await p.evaluate(()=>{ const b=cv.getBoundingClientRect(), [x,y]=poolXY(); return [b.left+x,b.top+y]; }); await p.mouse.click(...xy);
 const bet=await p.evaluate(()=>bets.frenzyBet); await p.screenshot({path:OUT+'/pool_bet.png'});
 await p.evaluate(()=>{ FORCE.frenzy=true; }); const c0=await p.evaluate(()=>credits); let res=null; await p.exposeFunction('grab',r=>{res=r;}); await p.evaluate(()=>{ const s0=spin; spin=()=>{ const r=s0(); grab(JSON.parse(JSON.stringify(r))); return r; }; });
 await p.click('#go'); await p.waitForTimeout(1200); await p.screenshot({path:OUT+'/pool_win.png'}); await p.waitForFunction(()=>!spinning,null,{timeout:30000});
 const c1=await p.evaluate(()=>credits);
 console.log('pool bet',bet,'| frenzy',res.frenzy,'pool win',res.frenzyWin,'| credits',c0,'→',c1,'expected',c0-res.staked+res.totalWin,'| errors',errs); await b.close(); })();
