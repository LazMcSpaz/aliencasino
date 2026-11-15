// Plays spins on a phone-sized screen with the CPU slowed 4x (roughly a mid-range phone) and records frame times
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3});
const cdp=await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
const html=require('fs').readFileSync(process.argv[2]||'slot.html','utf8');
await p.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html,body{margin:0}[hidden]{display:none!important}</style></head><body>'+html+'</body></html>');
await p.waitForTimeout(6000);
const measure = async (label, action, ms) => {
  await p.evaluate(()=>{ window.__f=[]; let last=performance.now(); window.__run=true; (function f(t){ window.__f.push(t-last); last=t; if(window.__run) requestAnimationFrame(f); })(last); });
  await action(); await p.waitForTimeout(ms);
  const f = await p.evaluate(()=>{ window.__run=false; return window.__f.slice(2); });
  f.sort((a,b)=>a-b); const avg=f.reduce((a,b)=>a+b,0)/f.length, p95=f[Math.floor(f.length*.95)], long=f.filter(x=>x>50).length;
  console.log(`${label.padEnd(22)} avg ${avg.toFixed(1)}ms (~${(1000/avg).toFixed(0)} fps) | worst 5% ${p95.toFixed(0)}ms | frames over 50ms: ${long}`);
};
await measure('normal spin + win', async()=>{ await p.evaluate(()=>{ window.decideResult=()=>[[1,1,5],[3,1,7],[8,1,4]]; }); await p.click('#spin'); }, 4500);
await measure('bonus mode idle', async()=>{ await p.evaluate(()=>{ applyMachine('mob'); bonusLeft=8; bonusMode=true; setBonusVisuals(true); update(); }); }, 3000);
await measure('bonus steady (later)', async()=>{}, 3000);
await measure('bonus spin + win', async()=>{ await p.evaluate(()=>{ window.decideResult=()=>[[2,2,5],[3,2,7],[8,2,4]]; spin(); }); }, 4000);
await b.close();})();
