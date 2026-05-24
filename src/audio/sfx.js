// Retro SFX synth. Web Audio API. No external files.
// Volume gated by G.meta.settings.sfxVol. Each SFX is a short envelope-shaped oscillator.
(function () {
  'use strict';

  let ctx = null;
  let masterGain = null;
  let lastPlayTime = Object.create(null); // throttle spam (e.g., hits)

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = (G.meta && G.meta.settings ? G.meta.settings.sfxVol : 0.6);
      masterGain.connect(ctx.destination);
    } catch (e) { console.warn('audio init failed', e); ctx = null; }
    return ctx;
  }

  function syncVolume() {
    if (masterGain && G.meta && G.meta.settings) {
      masterGain.gain.value = G.meta.settings.sfxVol;
    }
  }

  // Throttle: don't replay 'id' within `minGap` seconds.
  function throttle(id, minGap) {
    const now = performance.now() / 1000;
    if (lastPlayTime[id] && now - lastPlayTime[id] < minGap) return false;
    lastPlayTime[id] = now;
    return true;
  }

  // Core synth helpers --------------------------------------------------------
  function envelope(g, t0, attack, hold, release, peak) {
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + attack);
    g.gain.setValueAtTime(peak, t0 + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
  }

  function tone(freq, dur, opts) {
    if (!ensureCtx()) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = (opts && opts.type) || 'square';
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (opts && opts.endFreq != null) {
      o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.endFreq), ctx.currentTime + dur);
    }
    if (opts && opts.detune) o.detune.setValueAtTime(opts.detune, ctx.currentTime);
    envelope(g, ctx.currentTime, 0.005, dur * 0.3, dur * 0.7, (opts && opts.vol) || 0.25);
    o.connect(g); g.connect(masterGain);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + dur + 0.05);
  }

  function noise(dur, opts) {
    if (!ensureCtx()) return;
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = (opts && opts.filter) || 'lowpass';
    f.frequency.value = (opts && opts.cutoff) || 800;
    envelope(g, ctx.currentTime, 0.002, dur * 0.2, dur * 0.8, (opts && opts.vol) || 0.18);
    src.connect(f); f.connect(g); g.connect(masterGain);
    src.start(); src.stop(ctx.currentTime + dur + 0.05);
  }

  function chord(freqs, dur, opts) {
    for (const f of freqs) tone(f, dur, Object.assign({ vol: 0.12 }, opts));
  }

  function sequence(notes, opts) {
    // notes: [{freq, t, dur, type, vol, endFreq}, ...]
    if (!ensureCtx()) return;
    const t0 = ctx.currentTime;
    for (const n of notes) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = n.type || (opts && opts.type) || 'square';
      o.frequency.setValueAtTime(n.freq, t0 + n.t);
      if (n.endFreq != null) o.frequency.exponentialRampToValueAtTime(Math.max(20, n.endFreq), t0 + n.t + n.dur);
      envelope(g, t0 + n.t, 0.005, n.dur * 0.25, n.dur * 0.75, n.vol || (opts && opts.vol) || 0.2);
      o.connect(g); g.connect(masterGain);
      o.start(t0 + n.t); o.stop(t0 + n.t + n.dur + 0.05);
    }
  }

  // SFX library ---------------------------------------------------------------
  const sfx = {
    hit() {
      if (!throttle('hit', 0.02)) return;
      noise(0.05, { cutoff: 2200, vol: 0.10 });
      tone(380, 0.05, { type: 'square', endFreq: 220, vol: 0.10 });
    },
    enemy_kill() {
      if (!throttle('enemy_kill', 0.04)) return;
      tone(440, 0.10, { type: 'square', endFreq: 130, vol: 0.14 });
      noise(0.08, { cutoff: 1400, vol: 0.07 });
    },
    player_hurt() {
      if (!throttle('player_hurt', 0.20)) return;
      tone(200, 0.18, { type: 'sawtooth', endFreq: 80, vol: 0.28 });
      noise(0.18, { cutoff: 600, vol: 0.18 });
    },
    level_up() {
      // C E G C arpeggio
      sequence([
        { t: 0,    dur: 0.10, freq: 523.25, type: 'triangle' },
        { t: 0.10, dur: 0.10, freq: 659.25, type: 'triangle' },
        { t: 0.20, dur: 0.10, freq: 783.99, type: 'triangle' },
        { t: 0.30, dur: 0.22, freq: 1046.5, type: 'triangle' },
      ], { vol: 0.28 });
    },
    altar() {
      // Slow ominous chord (D minor low)
      chord([55, 65.41, 87.31], 1.2, { type: 'sine', vol: 0.18 });
      chord([110, 130.81, 174.61], 1.2, { type: 'triangle', vol: 0.10 });
      // Bell hit
      setTimeout(() => tone(880, 0.6, { type: 'sine', vol: 0.18 }), 200);
    },
    pact_power() {
      // Heavy descending dark chord
      sequence([
        { t: 0,    dur: 0.6, freq: 220, type: 'sawtooth', endFreq: 110, vol: 0.30 },
        { t: 0.05, dur: 0.6, freq: 261, type: 'sawtooth', endFreq: 130, vol: 0.20 },
        { t: 0.10, dur: 0.6, freq: 329, type: 'sawtooth', endFreq: 165, vol: 0.16 },
      ]);
      noise(0.4, { cutoff: 400, vol: 0.15 });
    },
    pact_brotherhood() {
      // Rising welcoming triad
      sequence([
        { t: 0,    dur: 0.18, freq: 261.6, type: 'triangle' },
        { t: 0.15, dur: 0.18, freq: 392.0, type: 'triangle' },
        { t: 0.30, dur: 0.40, freq: 523.2, type: 'triangle' },
      ], { vol: 0.26 });
    },
    pact_greed() {
      // Coin-y chimes
      sequence([
        { t: 0,    dur: 0.10, freq: 1567 },
        { t: 0.10, dur: 0.10, freq: 1976 },
        { t: 0.20, dur: 0.20, freq: 2349 },
      ], { type: 'square', vol: 0.18 });
    },
    pact_flesh() {
      // Visceral squelch + bass
      noise(0.30, { cutoff: 350, vol: 0.22 });
      tone(60, 0.35, { type: 'sawtooth', endFreq: 30, vol: 0.30 });
    },
    pact_skip() {
      tone(220, 0.15, { type: 'triangle', endFreq: 110, vol: 0.16 });
    },
    boss_spawn() {
      // Deep thud + descending roar
      tone(50, 0.8, { type: 'sine', vol: 0.50 });
      tone(80, 0.8, { type: 'sawtooth', endFreq: 30, vol: 0.30 });
      noise(0.7, { cutoff: 300, vol: 0.25 });
    },
    ally_command() {
      if (!throttle('ally_command', 0.05)) return;
      tone(880, 0.06, { type: 'triangle', vol: 0.15 });
    },
    sacrifice() {
      // Rising whoosh
      tone(150, 0.5, { type: 'sawtooth', endFreq: 1500, vol: 0.25 });
      noise(0.5, { cutoff: 2000, vol: 0.12 });
    },
    bat_burst() {
      if (!throttle('bat_burst', 0.10)) return;
      noise(0.08, { cutoff: 3500, vol: 0.10 });
      tone(720, 0.07, { type: 'square', endFreq: 480, vol: 0.10 });
    },
    blood_pool() {
      if (!throttle('blood_pool', 0.10)) return;
      noise(0.20, { cutoff: 500, vol: 0.18 });
      tone(120, 0.20, { type: 'sine', endFreq: 60, vol: 0.18 });
    },
    bone_storm() {
      if (!throttle('bone_storm', 0.10)) return;
      sequence([
        { t: 0,    dur: 0.08, freq: 880, type: 'square' },
        { t: 0.04, dur: 0.20, freq: 440, type: 'square', endFreq: 220 },
      ], { vol: 0.16 });
    },
    death() {
      // Long descending wail
      tone(440, 1.0, { type: 'sawtooth', endFreq: 55, vol: 0.35 });
      noise(0.8, { cutoff: 800, vol: 0.18 });
    },
    pickup_gem() {
      if (!throttle('pickup_gem', 0.02)) return;
      tone(1567, 0.04, { type: 'triangle', vol: 0.08 });
    },
    button_click() {
      tone(880, 0.04, { type: 'triangle', vol: 0.10 });
    },
    chain() {
      if (!throttle('chain', 0.08)) return;
      sequence([
        { t: 0,    dur: 0.06, freq: 1567, type: 'square' },
        { t: 0.03, dur: 0.10, freq: 1175, type: 'square', endFreq: 600 },
      ], { vol: 0.16 });
      noise(0.08, { cutoff: 4000, vol: 0.06 });
    },
  };

  function play(id) {
    if (!ensureCtx()) return;
    const fn = sfx[id];
    if (fn) fn();
  }

  // Resume context on first user gesture (browser autoplay rules)
  function unlock() {
    if (!ctx) ensureCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }
  window.addEventListener('click', unlock, { once: false });
  window.addEventListener('keydown', unlock, { once: false });

  G.sfx = { play, unlock, syncVolume };
})();
