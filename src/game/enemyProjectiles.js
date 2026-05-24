// Enemy / boss projectiles. SoA. Damages the player on contact.
(function () {
  'use strict';

  const MAX = 500;
  const px = new Float32Array(MAX);
  const py = new Float32Array(MAX);
  const vx = new Float32Array(MAX);
  const vy = new Float32Array(MAX);
  const damage = new Float32Array(MAX);
  const life = new Float32Array(MAX);
  const radius = new Float32Array(MAX);
  const color = new Array(MAX);
  const alive = new Uint8Array(MAX);
  let count = 0;

  function reset() {
    count = 0;
    for (let i = 0; i < MAX; i++) alive[i] = 0;
  }

  function fire(x, y, vxn, vyn, dmg, lifeSec, r, col) {
    let i = 0;
    for (; i < MAX; i++) if (!alive[i]) break;
    if (i >= MAX) return -1;
    px[i] = x; py[i] = y; vx[i] = vxn; vy[i] = vyn;
    damage[i] = dmg; life[i] = lifeSec; radius[i] = r || 8;
    color[i] = col || '#ff6030';
    alive[i] = 1;
    if (i >= count) count = i + 1;
    return i;
  }

  function clearAll() {
    for (let i = 0; i < count; i++) alive[i] = 0;
    count = 0;
  }

  function update(dt) {
    const s = G.runState;
    if (!s || s.hp <= 0) return;
    const pr = 14;
    for (let i = 0; i < count; i++) {
      if (!alive[i]) continue;
      life[i] -= dt;
      if (life[i] <= 0) { alive[i] = 0; continue; }
      px[i] += vx[i] * dt;
      py[i] += vy[i] * dt;
      const dx = s.px - px[i], dy = s.py - py[i];
      const r = pr + radius[i];
      if (dx * dx + dy * dy < r * r) {
        G.player.takeDamage(damage[i]);
        alive[i] = 0;
      }
    }
    while (count > 0 && !alive[count - 1]) count--;
  }

  function render(ctx) {
    for (let i = 0; i < count; i++) {
      if (!alive[i]) continue;
      const s = G.cam.worldToScreen(px[i], py[i]);
      // Colored bullet with white outline + bright inner core (clean, no broken gradient)
      ctx.fillStyle = color[i];
      ctx.beginPath(); ctx.arc(s.x, s.y, radius[i], 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#fff8e8';
      ctx.beginPath(); ctx.arc(s.x, s.y, radius[i] * 0.45, 0, Math.PI * 2); ctx.fill();
    }
  }

  G.enemyProjectiles = { fire, update, render, reset, clearAll, MAX };
})();
