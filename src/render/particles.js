// Pooled generic particle burst — used for hits, kills, pact, level-up, sacrifice.
(function () {
  'use strict';

  const MAX = 800;
  const px = new Float32Array(MAX);
  const py = new Float32Array(MAX);
  const vx = new Float32Array(MAX);
  const vy = new Float32Array(MAX);
  const life = new Float32Array(MAX);
  const max = new Float32Array(MAX);
  const sz = new Float32Array(MAX);
  const col = new Array(MAX);
  let count = 0;

  function reset() { count = 0; }

  function burst(x, y, opts) {
    const n = opts.count || 12;
    const speed = opts.speed || 140;
    const lifeSec = opts.life || 0.5;
    const size = opts.size || 3;
    const color = opts.color || '#ff5050';
    const spread = opts.spread != null ? opts.spread : Math.PI * 2;
    const dir = opts.dir != null ? opts.dir : 0;
    for (let i = 0; i < n; i++) {
      if (count >= MAX) return;
      const idx = count++;
      const a = dir + (Math.random() - 0.5) * spread;
      const sp = speed * (0.5 + Math.random() * 0.7);
      px[idx] = x; py[idx] = y;
      vx[idx] = Math.cos(a) * sp; vy[idx] = Math.sin(a) * sp;
      const l = lifeSec * (0.7 + Math.random() * 0.6);
      life[idx] = l; max[idx] = l;
      sz[idx] = size * (0.7 + Math.random() * 0.6);
      col[idx] = color;
    }
  }

  function update(dt) {
    let w = 0;
    for (let i = 0; i < count; i++) {
      life[i] -= dt;
      if (life[i] <= 0) continue;
      px[i] += vx[i] * dt;
      py[i] += vy[i] * dt;
      vx[i] *= 0.93; vy[i] *= 0.93;
      if (w !== i) {
        px[w] = px[i]; py[w] = py[i]; vx[w] = vx[i]; vy[w] = vy[i];
        life[w] = life[i]; max[w] = max[i]; sz[w] = sz[i]; col[w] = col[i];
      }
      w++;
    }
    count = w;
  }

  function render(ctx) {
    for (let i = 0; i < count; i++) {
      const s = G.cam.worldToScreen(px[i], py[i]);
      const a = Math.max(0, life[i] / max[i]);
      ctx.globalAlpha = a;
      ctx.fillStyle = col[i];
      ctx.beginPath();
      ctx.arc(s.x, s.y, sz[i] * a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  G.particles = { burst, update, render, reset };
})();
