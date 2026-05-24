// XP gems. Magnetized to player within pickupRange.
(function () {
  'use strict';

  const MAX = 3000;
  const px = new Float32Array(MAX);
  const py = new Float32Array(MAX);
  const vx = new Float32Array(MAX);
  const vy = new Float32Array(MAX);
  const value = new Float32Array(MAX);
  const alive = new Uint8Array(MAX);
  let count = 0;

  function reset() {
    count = 0;
    for (let i = 0; i < MAX; i++) alive[i] = 0;
  }

  function spawn(x, y, v) {
    // Optionally merge into bigger gems for value > 1
    let i = 0;
    for (; i < MAX; i++) if (!alive[i]) break;
    if (i >= MAX) return;
    px[i] = x + (Math.random() - 0.5) * 6;
    py[i] = y + (Math.random() - 0.5) * 6;
    vx[i] = (Math.random() - 0.5) * 30;
    vy[i] = (Math.random() - 0.5) * 30;
    value[i] = v;
    alive[i] = 1;
    if (i >= count) count = i + 1;
  }

  function update(dt) {
    const s = G.runState;
    if (!s) return;
    const ppx = s.px, ppy = s.py;
    const pr = s.pickupRange;
    const pr2 = pr * pr;
    const grabR = 18; // physical pickup radius
    const grab2 = grabR * grabR;
    for (let i = 0; i < count; i++) {
      if (!alive[i]) continue;
      // Slow down initial scatter
      vx[i] *= 0.92; vy[i] *= 0.92;
      const dx = ppx - px[i], dy = ppy - py[i];
      const d2 = dx * dx + dy * dy;
      if (d2 < pr2) {
        const d = Math.sqrt(d2) || 1;
        const pull = 180 + (1 - d / pr) * 700;
        vx[i] = (dx / d) * pull;
        vy[i] = (dy / d) * pull;
      }
      px[i] += vx[i] * dt;
      py[i] += vy[i] * dt;
      if (d2 < grab2) {
        G.player.gainXp(value[i]);
        if (G.sfx) G.sfx.play('pickup_gem');
        alive[i] = 0;
      }
    }
    while (count > 0 && !alive[count - 1]) count--;
  }

  function render(ctx) {
    const spr = G.sprites.pickFrame('gem', 0);
    const sprBig = G.sprites.pickFrame('gemBig', 0);
    for (let i = 0; i < count; i++) {
      if (!alive[i]) continue;
      const s = G.cam.worldToScreen(px[i], py[i]);
      const sp = value[i] >= 3 ? sprBig : spr;
      if (sp) ctx.drawImage(sp, s.x - sp.width / 2, s.y - sp.height / 2);
    }
  }

  G.xp = { spawn, update, render, reset };
})();
