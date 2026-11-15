const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{
  const b=await chromium.launch(); const errs=[]; const out={};
  for(const [mach,kind] of [["food","base"],["food","bonus"],["club","base"],["club","bonus"],["mob","base"],["mob","bonus"]]){ const p=await b.newPage(); p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.addInitScript(()=>{
    const SR=22050, LEN=12; let t0=null;
    class F extends OfflineAudioContext{ constructor(){ super(1,SR*LEN,SR); window.__off=this; t0=performance.now(); }
      get currentTime(){ return (performance.now()-t0)/1000; } get state(){ return "running"; } resume(){ return Promise.resolve(); } }
    window.AudioContext=F; window.webkitAudioContext=F;
  });
  await p.goto('file://'+__dirname+'/slot.html'); await p.waitForTimeout(500);
    const r = await p.evaluate(async([mach,kind])=>{
      applyMachine(mach); Sound.unlock(); Music.stop(); Music.play(kind);
      await new Promise(r=>setTimeout(r,10500)); Music.stop();
      const buf=await window.__off.startRendering(); const d=buf.getChannelData(0);
      let pk=0, ss=0; for(const v of d){ pk=Math.max(pk,Math.abs(v)); ss+=v*v; }
      // 16-bit wav
      const n=d.length, ab=new ArrayBuffer(44+n*2), dv=new DataView(ab); const w=(o,s)=>[...s].forEach((c,i)=>dv.setUint8(o+i,c.charCodeAt(0)));
      w(0,"RIFF"); dv.setUint32(4,36+n*2,true); w(8,"WAVEfmt "); dv.setUint32(16,16,true); dv.setUint16(20,1,true); dv.setUint16(22,1,true); dv.setUint32(24,buf.sampleRate,true); dv.setUint32(28,buf.sampleRate*2,true); dv.setUint16(32,2,true); dv.setUint16(34,16,true); w(36,"data"); dv.setUint32(40,n*2,true);
      for(let i=0;i<n;i++) dv.setInt16(44+i*2, Math.max(-1,Math.min(1,d[i]))*32767, true);
      let bin=""; const u=new Uint8Array(ab); for(let i=0;i<u.length;i+=8192) bin+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
      return {peak:pk.toFixed(3), rms:Math.sqrt(ss/n).toFixed(4), wav:btoa(bin)};
    },[mach,kind]);
    fs.writeFileSync(`/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/${mach}_${kind}.wav`, Buffer.from(r.wav,'base64'));
    out[mach+"_"+kind]={peak:r.peak,rms:r.rms}; await p.close();
  }
  console.log(out, errs.slice(0,5)); await b.close();
})();
