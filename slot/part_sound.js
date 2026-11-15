// ---- Sound: all synthesized live with Web Audio, no sound files needed ----
const Sound = (()=>{
  let ctx=null, master=null, mbus=null, on=true, musicOn=true, mlevel=1;
  try{ on = localStorage.getItem("slot-sound")!=="off"; musicOn = localStorage.getItem("slot-music")!=="off"; }catch(e){}
  function ensure(){
    if(!ctx){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null;
      ctx=new AC(); master=ctx.createGain(); master.gain.value=0.55;
      const lim=ctx.createDynamicsCompressor(); lim.threshold.value=-10; lim.knee.value=6; lim.ratio.value=8; lim.attack.value=.003; lim.release.value=.15;
      master.connect(lim).connect(ctx.destination);   // limiter: stops loud moments from overdriving a phone speaker
      const hp=ctx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=90; hp.Q.value=.7;
      mbus=ctx.createGain(); mbus.gain.value=musicOn?mlevel:0; mbus.connect(hp).connect(master); decodeClips(); }
    if(ctx.state==="suspended") ctx.resume();
    return ctx;
  }
  // lp = low-pass filter cutoff (warmer, rounder sound); lpEnd = where the cutoff sweeps to; detune in cents; bus "music" goes through the music volume
  function tone(freq, dur, {type="sine", vol=0.2, at=0, slide=0, attack=0.004, lp=0, lpEnd=0, q=1, detune=0, bus=null, vib=0}={}){
    if(!on) return; const c=ensure(); if(!c) return; if(bus==="music") attack=Math.max(attack,.008);   // softer note starts = no clicks
    const t=c.currentTime+Math.max(0,at), o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,t); if(detune) o.detune.value=detune;
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*slide), t+dur);
    if(vib){ const l=c.createOscillator(), lg=c.createGain(); l.frequency.value=5.5; lg.gain.value=freq*vib; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t+dur+0.05); }
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+attack); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    let node=o; if(lp){ const f=c.createBiquadFilter(); f.type="lowpass"; f.Q.value=q; f.frequency.setValueAtTime(lp,t); if(lpEnd) f.frequency.exponentialRampToValueAtTime(lpEnd,t+dur); node.connect(f); node=f; }
    node.connect(g).connect(bus==="music"?mbus:master); o.start(t); o.stop(t+dur+0.05);
  }
  function thud(vol=0.25, freq=260){
    if(!on) return; const c=ensure(); if(!c) return;
    const len=Math.floor(c.sampleRate*0.09), buf=c.createBuffer(1,len,c.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);
    const src=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain();
    src.buffer=buf; f.type="lowpass"; f.frequency.value=freq; g.gain.value=vol;
    src.connect(f).connect(g).connect(master); src.start();
  }
  // Recorded clips (base64 mp3 in SND_SRC) are decoded once the audio system wakes up, then played through the same volume control
  const clips={};
  function decodeClips(){ if(typeof SND_SRC==="undefined") return;
    for(const [k,b64] of Object.entries(SND_SRC)){ if(clips[k]) continue; clips[k]="loading";
      const bin=atob(b64.split(",")[1]), buf=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
      ctx.decodeAudioData(buf.buffer).then(ab=>{ clips[k]=ab; }).catch(()=>{ delete clips[k]; }); } }
  function clip(name, {vol=1, at=0}={}){ // returns false if the clip isn't ready, so callers can fall back to synth sounds
    if(!on) return true; const c=ensure(); const ab=clips[name]; if(!c || !(ab instanceof AudioBuffer)) return false;
    const src=c.createBufferSource(), g=c.createGain(); src.buffer=ab; g.gain.value=vol; src.connect(g).connect(master); src.start(c.currentTime+at); return true; }
  function noise(dur, {vol=0.2, at=0, type="lowpass", freq=1200, q=0.8, attack=0.004, sweep=0, bus=null}={}){   // filtered noise burst: gunshots, tyres, crowds, scribbles
    if(!on) return; const c=ensure(); if(!c) return; if(bus==="music") attack=Math.max(attack,.01);   // no instant starts on music percussion
    const t=c.currentTime+Math.max(0,at), len=Math.max(1,Math.floor(c.sampleRate*dur)), buf=c.createBuffer(1,len,c.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
    const src=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain();
    src.buffer=buf; f.type=type; f.frequency.setValueAtTime(freq,t); f.Q.value=q; if(sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40,freq*sweep), t+dur);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+attack); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    src.connect(f).connect(g).connect(bus==="music"?mbus:master); src.start(t); src.stop(t+dur+0.05);
  }
  const note = n => 440*Math.pow(2,(n-9)/12); // n = semitones above C4 (0 = C)
  const arp = (notes, gap, opts) => notes.forEach((n,i)=>tone(note(n), opts.dur||0.18, {...opts, at:i*gap}));
  return {
    get on(){ return on; },
    set on(v){ on=v; try{ localStorage.setItem("slot-sound", v?"on":"off"); }catch(e){} if(v) ensure(); },
    unlock(){ if(on) ensure(); },
    get musicOn(){ return musicOn; },
    set musicOn(v){ musicOn=v; try{ localStorage.setItem("slot-music", v?"on":"off"); }catch(e){} if(mbus) mbus.gain.setTargetAtTime(v?mlevel:0, ctx.currentTime, .05); },
    musicLevel(v){ mlevel=v; if(mbus && musicOn) mbus.gain.setTargetAtTime(v, ctx.currentTime, .08); },
    now(){ return ctx ? ctx.currentTime : null; },
    ready(){ return !!ctx && ctx.state==="running"; },
    tap(){ tone(880,.05,{type:"triangle",vol:.08}); },
    lines(n){ arp([0,4,7,12,16].slice(0,n), .045, {type:"triangle", vol:.09, dur:.12}); },
    spinStart(){ tone(140,.4,{type:"sawtooth",vol:.05,slide:3}); tone(70,.25,{type:"sine",vol:.12,slide:.8}); },
    tick(){ tone(1500+Math.random()*400,.02,{type:"square",vol:.018}); },
    reelStop(i){ thud(.35, 240); tone(150-i*18,.14,{type:"sine",vol:.22,slide:.55}); },
    wild(){ arp([24,28,31,36], .05, {type:"sine", vol:.08, dur:.25}); },
    lose(){ tone(note(-5),.18,{type:"triangle",vol:.05}); tone(note(-8),.25,{type:"triangle",vol:.05,at:.12}); },
    win(level){ // 0 small, 1 medium
      if(level===0) arp([12,16,19], .07, {type:"triangle", vol:.12, dur:.2});
      else { arp([7,12,16,19,24], .07, {type:"triangle", vol:.13, dur:.22}); arp([19,24], .1, {type:"sine", vol:.06, dur:.5, at:0}); }
    },
    bigWin(){
      arp([0,4,7,12, 4,7,12,16, 7,12,16,19,24], .085, {type:"square", vol:.05, dur:.16});
      [0,4,7,12].forEach(n=>tone(note(n),1.4,{type:"triangle",vol:.06,at:1.1,attack:.02}));
      for(let i=0;i<10;i++) tone(2000+Math.random()*1500,.05,{type:"sine",vol:.03,at:1.1+i*.07});
    },
    noise, clip,
    refill(){ for(let i=0;i<8;i++) tone(1800+i*120,.04,{type:"triangle",vol:.05,at:i*.04}); },
  };
})();