// Floating damage numbers. Batched render, pooled.
(function () {
  'use strict';

  const MAX = 200;
  const px = new Float32Array(MAX);
  const py = new Float32Array(MAX);
  const vy = new Float32Array(MAX);
  const life = new Float32Array(MAX);
  const max = new Float32Array(MAX);
  const sz = new Float32Array(MAX);
  const txt = new Array(MAX);
  const col = new Array(MAX);
  let count = 0;

  function reset() { count = 0; }

  function add(x, y, value, opts) {
    if (count >= MAX) {
      // Drop oldest (shift left by 1)
      for (let i = 0; i < MAX - 1; i++) {
        px[i] = px[i + 1]; py[i] = py[i + 1]; vy[i] = vy[i + 1];
        life[i] = life[i + 1]; max[i] = max[i + 1]; sz[i] = sz[i + 1];
        txt[i] = txt[i + 1]; col[i] = col[i + 1];
      }
      count--;
    }
    const idx = count++;
    px[idx] = x + (Math.random() - 0.5) * 16;
    py[idx] = y - 10;
    vy[idx] = -45;
    const l = (opts && opts.life) || 0.7;
    life[idx] = l; max[idx] = l;
    sz[idx] = (opts && opts.size) || 16;
    txt[idx] = String(value);
    col[idx] = (opts && opts.color) || '#ffd060';
  }

  function update(dt) {
    let w = 0;
    for (let i = 0; i < count; i++) {
      life[i] -= dt;
      if (life[i] <= 0) continue;
      py[i] += vy[i] * dt;
      vy[i] *= 0.92;
      if (w !== i) {
        px[w] = px[i]; py[w] = py[i]; vy[w] = vy[i];
        life[w] = life[i]; max[w] = max[i]; sz[w] = sz[i]; txt[w] = txt[i]; col[w] = col[i];
      }
      w++;
    }
    count = w;
  }

  function render(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < count; i++) {
      const s = G.cam.worldToScreen(px[i], py[i]);
      const a = Math.max(0, life[i] / max[i]);
      ctx.globalAlpha = a;
      ctx.font = 'bold ' + sz[i] + 'px Georgia';
      ctx.fillStyle = '#000';
      ctx.fillText(txt[i], s.x + 1, s.y + 1);
      ctx.fillStyle = col[i];
      ctx.fillText(txt[i], s.x, s.y);
    }
    ctx.globalAlpha = 1;
  }

  G.damageNumbers = { add, update, render, reset };
})();
