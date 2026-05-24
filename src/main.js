// Pact of the Damned - global namespace
// Loaded BEFORE every other script. Everything else attaches to window.G.
(function () {
  'use strict';
  /** @type {Object} */
  const G = {
    // Engine handles
    canvas: null,
    ctx: null,
    width: 1280,
    height: 720,

    // Scene routing
    scene: 'menu', // 'menu' | 'heroSelect' | 'run' | 'gameover' | 'settings' | 'stats'
    nextScene: null,

    // Time
    now: 0,        // ms since game start
    runTime: 0,    // seconds of current run

    // Subsystems (filled by their respective files)
    rng: null,
    input: null,
    loop: null,
    sprites: null,
    particles: null,
    damageNumbers: null,
    spatial: null,

    // Game state (filled by state.js)
    state: null,

    // Data (filled by data/*.js)
    data: {
      heroes: null,
      enemies: null,
      skills: null,
      pacts: null,
      waves: null,
    },

    // Meta state from localStorage
    meta: null,

    // UI containers
    ui: null,

    // Utility
    log(...args) { console.log('[G]', ...args); },
  };

  window.G = G;
})();
