// Pixel-art sprite encoder. Sprites defined as arrays of bitmap-string frames.
// Characters map to palette colors. '.' is transparent.
(function () {
  'use strict';

  /** Bake a multi-frame pixel sprite to an array of offscreen canvases.
   *  @param frames Array of frames. Each frame = array of N strings (rows), all same length.
   *  @param palette {Object} char -> css color
   *  @param scale Pixel size (each source px -> scale x scale block)
   *  @returns Array<HTMLCanvasElement>
   */
  function bake(frames, palette, scale) {
    return frames.map(rows => {
      const H = rows.length;
      const W = rows[0].length;
      const c = document.createElement('canvas');
      c.width = W * scale; c.height = H * scale;
      const cx = c.getContext('2d');
      cx.imageSmoothingEnabled = false;
      for (let y = 0; y < H; y++) {
        const row = rows[y];
        for (let x = 0; x < W; x++) {
          const ch = row[x];
          if (ch === '.' || ch === ' ') continue;
          cx.fillStyle = palette[ch] || palette['#'] || '#fff';
          cx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
      return c;
    });
  }

  // Single-frame helper
  function bakeOne(rows, palette, scale) {
    return bake([rows], palette, scale)[0];
  }

  G.pixelArt = { bake, bakeOne };
})();
