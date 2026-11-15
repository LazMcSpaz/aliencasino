// Renders one machine's music with only one instrument playing at a time, to hunt clicks. Usage (from slot/): node tools/renderparts.js mob base
const { chromium } = require('playwright'); const fs=require('fs'); const OUT='/tmp/claude-0/-home-claude/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/scratchpad/';
const [mach,kind,list]=process.argv.slice(2);
(async()=>{ const b=await chromium.launch();
  for(const only of (list ? list.split(",") : ["upright","ride","brush","piano","lead","kick","snare","hat","stab","block","bass"])){ const p=await b.newPage();
    await p.addInitScript(()=>{ const SR=44100, LEN=8; let t0=null;
      class F extends OfflineAudioContext{ constructor(){ super(1,SR*LEN,SR); window.__off=this; t0=performance.now(); } get currentTime(){ return (performance.now()-t0)/1000; } get state(){ return "running"; } resume(){ return Promise.resolve(); } }
      window.AudioContext=F; window.webkitAudioContext=F; });
    await p.goto('file://'+__dirname+'/../slot.html'); await p.waitForTimeout(400);
    const wav=await p.evaluate(async([mach,kind,only])=>{ applyMachine(mach); for(const k of Object.keys(MI)) if(k!==only) MI[k]=()=>{};
      Sound.unlock(); Music.stop(); Music.play(kind); await new Promise(r=>setTimeout(r,7000)); Music.stop();
      const d=(await window.__off.startRendering()).getChannelData(0); let bin=""; const u=new Uint8Array(d.buffer); for(let i=0;i<u.length;i+=8192) bin+=String.fromCharCode.apply(null,u.subarray(i,i+8192)); return btoa(bin); },[mach,kind,only]);
    fs.writeFileSync(OUT+`part_${mach}_${kind}_${only}.f32`, Buffer.from(wav,'base64')); await p.close(); }
  await b.close(); })();
