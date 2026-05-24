// Hero sprite-sheets — 4 frames per direction, horizontal layout.
// Animation: walks faster than idles. drawImage(src-rect, dst-rect) per frame.
(function () {
  'use strict';

  const sheets = {};

  function load(key, src, frames, fps) {
    const img = new Image();
    img.onerror = () => { console.warn('Failed to load hero sheet:', src); };
    img.src = src;
    sheets[key] = { img, frames, fps };
  }

  // Idle: slow 3 fps breathing
  load('idle_N', 'north-idle-hero.png', 4, 3);
  load('idle_S', 'south-idle-hero.png', 4, 3);
  load('idle_E', 'east-idle-hero.png',  4, 3);
  load('idle_W', 'west_idle-hero.png',  4, 3);

  // Run: active 9 fps step cycle
  load('run_N',   'north-run-hero.png',                  4, 9);
  load('run_S',   'south-run-hero.png',                  4, 9);
  load('run_ESE', 'east-and-south_east-run-hero.png',    4, 9);
  load('run_WNW', 'west-and-north_west-run-hero.png',    4, 9);
  load('run_SW',  'south_west-run-hero.png',             4, 9);

  function pickKey(dir, moving) {
    if (!moving) {
      switch (dir) {
        case 'N': case 'NE': case 'NW': return 'idle_N';
        case 'S': case 'SE': case 'SW': return 'idle_S';
        case 'E': return 'idle_E';
        case 'W': return 'idle_W';
      }
      return 'idle_S';
    }
    switch (dir) {
      case 'N':  return 'run_N';
      case 'S':  return 'run_S';
      case 'E':
      case 'SE':
      case 'NE': return 'run_ESE';
      case 'W':
      case 'NW': return 'run_WNW';
      case 'SW': return 'run_SW';
    }
    return 'run_S';
  }

  // Returns { img, sx, sy, sw, sh } for the current frame, or null if not loaded.
  function pick(dir, moving, animTime) {
    const sheet = sheets[pickKey(dir, moving)];
    if (!sheet || !sheet.img.complete || sheet.img.naturalWidth === 0) return null;
    const frameW = sheet.img.naturalWidth / sheet.frames;
    const frameH = sheet.img.naturalHeight;
    const idx = Math.floor((animTime || 0) * sheet.fps) % sheet.frames;
    return { img: sheet.img, sx: idx * frameW, sy: 0, sw: frameW, sh: frameH };
  }

  G.heroGifs = { sheets, pick };
})();
