// Active Touhou-style procedural music.
// 150 BPM. 4-bar progression Dm — Bb — Am — A (i — VI — iv — V).
// Layers: kick drum, hi-hat, bass (8th notes), arp (16ths), lead melody, pad.
(function () {
  'use strict';

  let ctx = null, masterGain = null, busDrum = null, busSynth = null;
  let nextBeat = 0;        // absolute time of next 16th-note step
  let stepIdx = 0;         // 0..63 (16 steps × 4 bars)
  let timer = null;
  let running = false;

  const BPM = 150;
  const STEP_SEC = 60 / BPM / 4;          // 1/16 note
  const LOOK_AHEAD = 0.25;
  const SCHEDULE_MS = 40;

  // Chord progression (one per bar): Dm — Bb — Am — A
  // Each entry: { root, fifth, lead: [4 melody notes per bar], pad: triad }
  const chords = [
    // Dm: D F A
    { root: 73.42, fifth: 110.00, octRoot: 146.83,
      pad: [146.83, 174.61, 220.00],
      arp: [146.83, 174.61, 220.00, 293.66],
      lead: [587.33, 698.46, 880.00, 698.46] },
    // Bb: Bb D F
    { root: 58.27, fifth: 87.31, octRoot: 116.54,
      pad: [116.54, 146.83, 174.61],
      arp: [116.54, 146.83, 174.61, 233.08],
      lead: [466.16, 587.33, 698.46, 587.33] },
    // Am: A C E
    { root: 55.00, fifth: 82.41, octRoot: 110.00,
      pad: [110.00, 130.81, 164.81],
      arp: [110.00, 130.81, 164.81, 220.00],
      lead: [440.00, 523.25, 659.25, 523.25] },
    // A major (V): A C# E
    { root: 55.00, fifth: 82.41, octRoot: 110.00,
      pad: [110.00, 138.59, 164.81],
      arp: [110.00, 138.59, 164.81, 220.00],
      lead: [440.00, 554.37, 659.25, 880.00] },
  ];

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = volumeValue();
      // Soft master compressor for cohesion
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 3;
      comp.attack.value = 0.005; comp.release.value = 0.15;
      masterGain.connect(comp); comp.connect(ctx.destination);
      busDrum = ctx.createGain(); busDrum.gain.value = 0.9; busDrum.connect(masterGain);
      busSynth = ctx.createGain(); busSynth.gain.value = 1.0; busSynth.connect(masterGain);
    } catch (e) { ctx = null; }
    return ctx;
  }

  function volumeValue() {
    if (!G.meta || !G.meta.settings) return 0.4;
    if (G.meta.settings.musicEnabled === false) return 0;
    return G.meta.settings.musicVol;
  }

  function syncVolume() {
    if (masterGain) masterGain.gain.value = volumeValue();
  }

  function note(freq, t0, dur, type, vol, bus, opts) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (opts && opts.endFreq != null) {
      o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.endFreq), t0 + dur);
    }
    const atk = (opts && opts.attack) || 0.005;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + atk);
    g.gain.setValueAtTime(vol, t0 + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus || busSynth);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  // Kick drum: short sine sweep
  function kick(t0, vol) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t0);
    o.frequency.exponentialRampToValueAtTime(40, t0 + 0.10);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.14);
    o.connect(g); g.connect(busDrum);
    o.start(t0); o.stop(t0 + 0.18);
    // Click layer
    const c = ctx.createOscillator();
    const cg = ctx.createGain();
    c.type = 'triangle'; c.frequency.setValueAtTime(800, t0);
    c.frequency.exponentialRampToValueAtTime(80, t0 + 0.02);
    cg.gain.setValueAtTime(vol * 0.5, t0);
    cg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.02);
    c.connect(cg); cg.connect(busDrum);
    c.start(t0); c.stop(t0 + 0.03);
  }

  // Hi-hat: short high-passed noise
  function hat(t0, vol, dur) {
    const len = dur || 0.03;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + len);
    src.connect(f); f.connect(g); g.connect(busDrum);
    src.start(t0); src.stop(t0 + len + 0.02);
  }

  // Snare: noise + sine
  function snare(t0, vol) {
    const len = 0.10;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + len);
    src.connect(f); f.connect(g); g.connect(busDrum);
    src.start(t0); src.stop(t0 + len + 0.02);
    // tonal layer
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(200, t0);
    o.frequency.exponentialRampToValueAtTime(120, t0 + 0.08);
    og.gain.setValueAtTime(vol * 0.4, t0);
    og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
    o.connect(og); og.connect(busDrum);
    o.start(t0); o.stop(t0 + 0.10);
  }

  // Schedule a single 16th-step: stepIdx (0..15 within bar), chord
  function scheduleStep(t0, stepInBar, chord) {
    const beat = Math.floor(stepInBar / 4);        // 0..3 quarter beat
    const isOnBeat = (stepInBar % 4 === 0);
    const isHalf = (stepInBar % 8 === 0);

    // --- Drums ---
    if (stepInBar === 0 || stepInBar === 8) {
      kick(t0, 0.55);
    }
    if (stepInBar === 4 || stepInBar === 12) {
      snare(t0, 0.30);
    }
    // Hi-hat on every 8th
    if (stepInBar % 2 === 0) {
      hat(t0, stepInBar % 4 === 0 ? 0.10 : 0.07);
    }
    // Open hat on 7 and 15 (off-beat sparkle)
    if (stepInBar === 14) hat(t0, 0.12, 0.06);

    // --- Bass: root on beats, octave fifth on off-beats ---
    if (stepInBar % 4 === 0) {
      // Beat: root, slightly accented
      note(chord.root, t0, 0.32, 'sawtooth', 0.20, busSynth, { attack: 0.005 });
    } else if (stepInBar % 4 === 2) {
      // Off-beat: fifth (lighter)
      note(chord.fifth, t0, 0.18, 'sawtooth', 0.13, busSynth);
    }

    // --- Arp: 16ths cycling through chord tones ---
    const arp = chord.arp;
    const arpFreq = arp[stepInBar % arp.length];
    note(arpFreq, t0, 0.10, 'square', 0.08, busSynth);

    // --- Lead melody: one note per quarter beat ---
    if (isOnBeat) {
      const leadFreq = chord.lead[beat];
      note(leadFreq, t0, 0.30, 'triangle', 0.15, busSynth, { attack: 0.008 });
      // Octave shimmer
      note(leadFreq * 2, t0, 0.15, 'sine', 0.05, busSynth);
    }

    // --- Pad: sustained triad on bar start ---
    if (stepInBar === 0) {
      for (const f of chord.pad) {
        note(f, t0, 60 / BPM * 4 - 0.05, 'triangle', 0.045, busSynth, { attack: 0.04 });
      }
    }
  }

  function tick() {
    if (!running || !ctx) return;
    // Skip scheduling entirely when music disabled
    if (G.meta && G.meta.settings && G.meta.settings.musicEnabled === false) return;
    while (nextBeat < ctx.currentTime + LOOK_AHEAD) {
      const barIdx = Math.floor(stepIdx / 16) % chords.length;
      const stepInBar = stepIdx % 16;
      scheduleStep(nextBeat, stepInBar, chords[barIdx]);
      nextBeat += STEP_SEC;
      stepIdx++;
    }
  }

  function start() {
    if (running) return;
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume();
    running = true;
    nextBeat = ctx.currentTime + 0.1;
    stepIdx = 0;
    tick();
    timer = setInterval(tick, SCHEDULE_MS);
  }

  function stop() {
    running = false;
    if (timer) { clearInterval(timer); timer = null; }
  }

  G.music = { start, stop, syncVolume };
})();
