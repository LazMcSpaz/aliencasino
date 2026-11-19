// Lounge music for the casino floor, played live in the browser (no audio files): a slow, swung space-lounge groove.
// Electric piano chords, a walking bass, soft drums, and now and then a theremin-like tune, through a little reverb and echo.
// Browsers only allow sound after a tap, so Music.start() runs from one. Music.pulse() gives 0…1 on each beat for the lights,
// Music.bar() which bar of the tune it is (both keep ticking, more softly, while the music is off).
// May use: the Web Audio API. Must not: touch the 3D scene (the scene asks it for the beat).
const Music = (() => {
  const BPM = 94, BEAT = 60 / BPM, SWING = .64, BAR = 4 * BEAT;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  // the tune: 8 bars, each [bass root, chord] (MIDI notes)
  const SONG = [
    [36, [51, 55, 58, 62]],        // C minor 9
    [41, [56, 60, 63, 67]],        // F minor 9
    [34, [56, 62, 67, 70]],        // B♭ 13
    [39, [55, 58, 62, 65]],        // E♭ major 9
    [32, [55, 60, 62, 63]],        // A♭ major 9
    [38, [53, 56, 60, 65]],        // D half-diminished
    [31, [53, 59, 63, 68]],        // G 7 (altered)
    [31, [53, 59, 62, 65]] ];      // G 7, back round to the top
  const PENTA = [60, 63, 65, 67, 70, 72, 75, 77, 79];   // C minor pentatonic, for the tune on top
  let ctx = null, master, keys, drums, verbSend, echoSend, wanted = true, on = false, t0 = 0, step = 0, timer = null, noise = null, melody = null;
  try { wanted = localStorage.getItem("alien-casino-music") !== "off"; } catch (e) {}

  function setup() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = 0; master.connect(comp);
    // reverb: a made-up room (two seconds of fading noise)
    const verb = ctx.createConvolver(), len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb.buffer = ir; verbSend = ctx.createGain(); verbSend.gain.value = .5; verbSend.connect(verb); verb.connect(master);
    // echo: three-eighths of a beat, fading, darker each time round
    const dl = ctx.createDelay(2), fb = ctx.createGain(), lp = ctx.createBiquadFilter(); dl.delayTime.value = BEAT * .75; fb.gain.value = .38; lp.type = "lowpass"; lp.frequency.value = 2200;
    echoSend = ctx.createGain(); echoSend.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(master); lp.connect(verbSend);
    // the piano bus wobbles in volume a little (the classic electric-piano tremolo)
    keys = ctx.createGain(); keys.gain.value = .8; const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 4.2; lg.gain.value = .14; lfo.connect(lg); lg.connect(keys.gain); lfo.start();
    const kf = ctx.createBiquadFilter(); kf.type = "lowpass"; kf.frequency.value = 2600; keys.connect(kf); kf.connect(master); kf.connect(verbSend);
    drums = ctx.createGain(); drums.gain.value = .9; drums.connect(master); const ds = ctx.createGain(); ds.gain.value = .15; drums.connect(ds); ds.connect(verbSend);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    // the theremin: one sine that glides between notes, with vibrato, always running, faded in when it plays
    const mo = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain(), mg = ctx.createGain();
    mo.type = "sine"; vib.frequency.value = 5.6; vg.gain.value = 5; vib.connect(vg); vg.connect(mo.frequency); mg.gain.value = 0;
    mo.connect(mg); mg.connect(master); mg.connect(echoSend); const ms = ctx.createGain(); ms.gain.value = .6; mg.connect(ms); ms.connect(verbSend); mo.start(); vib.start(); melody = { o: mo, g: mg };
  }

  // ---- the instruments ----
  function piano(t, midi, dur, vel) { const f = mtof(midi), a = ctx.createOscillator(), b = ctx.createOscillator(), g = ctx.createGain(), gb = ctx.createGain();
    a.frequency.value = f; b.frequency.value = f * 4.003; b.type = "sine";   // body + a bell-like "tine" on top that dies fast
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + .006); g.gain.exponentialRampToValueAtTime(vel * .3, t + .35); g.gain.exponentialRampToValueAtTime(.0001, t + dur + .5);
    gb.gain.setValueAtTime(vel * .22, t); gb.gain.exponentialRampToValueAtTime(.0001, t + .12);
    a.connect(g); b.connect(gb); gb.connect(g); g.connect(keys); a.start(t); b.start(t); a.stop(t + dur + .6); b.stop(t + .2); }
  function bass(t, midi, dur, vel = .5) { const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "triangle"; o.frequency.value = mtof(midi); f.type = "lowpass"; f.frequency.value = 520; f.Q.value = 2;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + .012); g.gain.setTargetAtTime(vel * .55, t + .05, .15); g.gain.setTargetAtTime(0, t + dur, .06);
    o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .4); }
  function kick(t, vel = .8) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(115, t); o.frequency.exponentialRampToValueAtTime(42, t + .14);
    g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(.0001, t + .38); o.connect(g); g.connect(drums); o.start(t); o.stop(t + .4); }
  function hiss(t, vel, freq, type, dec, q = .8) { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(.0001, t + dec); s.connect(f); f.connect(g); g.connect(drums); s.start(t, Math.random() * .5); s.stop(t + dec + .02); }
  const hat = (t, vel) => hiss(t, vel, 8000, "highpass", .045);
  const rim = (t, vel) => { hiss(t, vel, 1900, "bandpass", .07, 2.5); const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "triangle"; o.frequency.value = 420; g.gain.setValueAtTime(vel * .5, t); g.gain.exponentialRampToValueAtTime(.0001, t + .03); o.connect(g); g.connect(drums); o.start(t); o.stop(t + .05); };
  function sing(t, midi, dur) { const f = mtof(midi); melody.o.frequency.setTargetAtTime(f, t, .05); melody.g.gain.setTargetAtTime(.075, t, .04); melody.g.gain.setTargetAtTime(0, t + dur * .85, .09); }

  // ---- the sequencer: eighth notes, swung, scheduled a little ahead of time ----
  const timeOf = s => t0 + Math.floor(s / 2) * BEAT + (s % 2 ? SWING * BEAT : 0);
  let tune = [];   // the notes of the current phrase on top
  function playStep(s) { const t = timeOf(s), e = s % 8, barN = Math.floor(s / 8), [root, chord] = SONG[barN % SONG.length], next = SONG[(barN + 1) % SONG.length][0];
    // drums: kick on 1 (and a ghost before 3), rim on 2 and 4, hats on every eighth
    if (e === 0) kick(t, .75); if (e === 3 && barN % 2) kick(t, .35); if (e === 4) kick(t, .5);
    if (e === 2 || e === 6) rim(t, .22); hat(t, e % 2 ? .07 : .045); if (e === 7 && barN % 4 === 3) hiss(t, .06, 6000, "highpass", .25);   // an open hat into each four-bar turn
    // bass: root, fifth, octave, then a step toward the next chord
    const walk = [root, root + 7, root + 12, next + (next > root ? -1 : 1)];
    if (e % 2 === 0) bass(t, walk[e / 2], BEAT * .85, e ? .42 : .5);
    // piano: a long chord on 1, a short stab on the "and" of 2, sometimes on 4
    if (e === 0) chord.forEach((m, i) => piano(t + i * .008, m, BEAT * 1.6, .07));
    if (e === 3) chord.forEach(m => piano(t, m, BEAT * .35, .05));
    if (e === 6 && barN % 2 === 0) chord.slice(1).forEach(m => piano(t, m + 12, BEAT * .3, .03));
    // the tune: every fourth bar a new phrase starts, wandering up and down the scale
    if (e === 0 && barN % 4 === 0) { let k = 3 + Math.floor(Math.random() * 3); tune = []; for (let i = 0; i < 6; i++) { k = Math.max(0, Math.min(PENTA.length - 1, k + Math.floor(Math.random() * 5) - 2)); tune.push([[0, 3, 6, 8, 11, 14][i], PENTA[k], [3, 2, 2, 3, 3, 5][i]]); } }
    const rel = s % 32 - 16; tune.forEach(([at, m, len]) => { if (rel === at) sing(t, m, len * BEAT * .5); });   // it sings in the third and fourth bars of every four
  }
  function pump() { if (!on) return; const ahead = ctx.currentTime + .15; while (timeOf(step) < ahead) playStep(step++); }

  function start() { if (!ctx) setup(); if (ctx.state === "suspended") ctx.resume(); if (on) return;
    on = true; t0 = ctx.currentTime + .1; step = 0; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(.32, ctx.currentTime, .6);
    clearInterval(timer); timer = setInterval(pump, 25); pump(); }
  function stop(fade = .3) { if (!on) return; on = false; clearInterval(timer); master.gain.setTargetAtTime(0, ctx.currentTime, fade);
    melody.g.gain.setTargetAtTime(0, ctx.currentTime, .05); setTimeout(() => { if (!on && ctx.state === "running") ctx.suspend(); }, 1500); }
  const offClock = () => performance.now() / 1000;
  return {
    get on() { return on; }, get wanted() { return wanted; },
    // the player's choice, remembered; start() still needs a tap
    setWanted(v) { wanted = v; try { localStorage.setItem("alien-casino-music", v ? "on" : "off"); } catch (e) {} if (v) start(); else stop(); },
    start, stop,
    // lights: 1 on the beat, falling away to 0 before the next (dimmer when the music is off)
    pulse() { const ph = on ? ((ctx.currentTime - t0) / BEAT) : offClock() / BEAT; return ph < 0 ? 0 : Math.exp(-(ph % 1) * 4) * (on ? 1 : .5); },
    beat() { return Math.floor(on ? Math.max(0, (ctx.currentTime - t0) / BEAT) : offClock() / BEAT); },
    bar() { return Math.floor(this.beat() / 4); }
  };
})();
