// Projectile pool: bone spears, comets, etc.
(function () {
  'use strict';

  const MAX = 500;
  const px = new Float32Array(MAX);
  const py = new Float32Array(MAX);
  const vx = new Float32Array(MAX);
  const vy = new Float32Array(MAX);
  const damage = new Float32Array(MAX);
  const life = new Float32Array(MAX);
  const pierce = new Int32Array(MAX);
  const radius = new Float32Array(MAX);
  const homing = new Uint8Array(MAX);
  const animTime = new Float32Array(MAX);
  const spriteKey = new Array(MAX);
  const behavior = new Array(MAX);        // 'normal' | 'boomerang' | 'fireball' | 'banana' | 'shadow'
  const originX = new Float32Array(MAX);
  const originY = new Float32Array(MAX);
  const explodeRadius = new Float32Array(MAX);
  const maxRange = new Float32Array(MAX); // for boomerang turnaround
  const rotation = new Float32Array(MAX); // for spinning rendering
  const alive = new Uint8Array(MAX);
  let count = 0;

  function reset() {
    count = 0;
    for (let i = 0; i < MAX; i++) { alive[i] = 0; homing[i] = 0; spriteKey[i] = 'projectile'; }
  }

  function fire(x, y, vxn, vyn, dmg, lifeSec, pierceN, r, opts) {
    let i = 0;
    for (; i < MAX; i++) if (!alive[i]) break;
    if (i >= MAX) return -1;
    px[i] = x; py[i] = y; vx[i] = vxn; vy[i] = vyn;
    damage[i] = dmg; life[i] = lifeSec; pierce[i] = pierceN; radius[i] = r;
    homing[i] = 0;
    animTime[i] = Math.random();
    spriteKey[i] = (opts && opts.spriteKey) || 'projectile';
    behavior[i] = (opts && opts.behavior) || 'normal';
    originX[i] = x; originY[i] = y;
    explodeRadius[i] = (opts && opts.explodeRadius) || 0;
    maxRange[i] = (opts && opts.maxRange) || 0;
    rotation[i] = 0;
    alive[i] = 1;
    if (i >= count) count = i + 1;
    return i;
  }
  function markHoming(i) { if (i >= 0 && i < MAX) homing[i] = 1; }

  function update(dt) {
    for (let i = 0; i < count; i++) {
      if (!alive[i]) continue;
      life[i] -= dt;
      if (life[i] <= 0) { alive[i] = 0; continue; }
      // Homing: steer velocity toward nearest enemy
      if (homing[i]) {
        let bestI = -1, bestD = 200 * 200;
        G.spatial.query(px[i], py[i], 200, (ei) => {
          if (!G.enemies.alive[ei]) return;
          const dx = G.enemies.px[ei] - px[i], dy = G.enemies.py[ei] - py[i];
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; bestI = ei; }
        });
        if (bestI >= 0) {
          const dx = G.enemies.px[bestI] - px[i], dy = G.enemies.py[bestI] - py[i];
          const dn = Math.hypot(dx, dy) || 1;
          const cur = Math.hypot(vx[i], vy[i]) || 1;
          // Blend toward target direction
          const blend = 0.18;
          vx[i] = vx[i] * (1 - blend) + (dx / dn) * cur * blend;
          vy[i] = vy[i] * (1 - blend) + (dy / dn) * cur * blend;
          // Renormalize to keep constant speed
          const nn = Math.hypot(vx[i], vy[i]) || 1;
          vx[i] = (vx[i] / nn) * cur;
          vy[i] = (vy[i] / nn) * cur;
        }
      }
      // Behavior: boomerang turnaround
      if (behavior[i] === 'boomerang' && maxRange[i] > 0) {
        const dx = px[i] - originX[i], dy = py[i] - originY[i];
        if (dx * dx + dy * dy > maxRange[i] * maxRange[i]) {
          // Reverse toward player (origin moves with player; refresh on update)
          const ps = G.runState;
          if (ps) { originX[i] = ps.px; originY[i] = ps.py; }
          const rx = originX[i] - px[i], ry = originY[i] - py[i];
          const rd = Math.hypot(rx, ry) || 1;
          const sp = Math.hypot(vx[i], vy[i]) || 1;
          vx[i] = (rx / rd) * sp;
          vy[i] = (ry / rd) * sp;
        }
      }
      // Banana doesn't move
      if (behavior[i] === 'banana') { vx[i] = 0; vy[i] = 0; }
      px[i] += vx[i] * dt;
      py[i] += vy[i] * dt;
      animTime[i] += dt;
      rotation[i] += dt * 14; // for spinning sprites
      // Collide with enemies in radius
      const r = radius[i];
      G.spatial.query(px[i], py[i], r + 24, (ei) => {
        if (!alive[i] || pierce[i] < 0) return;
        if (!G.enemies.alive[ei]) return;
        const dx = G.enemies.px[ei] - px[i], dy = G.enemies.py[ei] - py[i];
        const er = G.enemies.radius[ei] + r;
        if (dx * dx + dy * dy < er * er) {
          // Fireball: explode on first hit, AoE damage, vanish
          if (behavior[i] === 'fireball' && explodeRadius[i] > 0) {
            G.enemies.damageInRadius(px[i], py[i], damage[i], explodeRadius[i]);
            G.particles.burst(px[i], py[i], { count: 40, color: '#ff8030', size: 5, speed: 320, life: 0.7 });
            G.particles.burst(px[i], py[i], { count: 14, color: '#ffe080', size: 4, speed: 200, life: 0.4 });
            G.cam.shake(5, 0.15);
            alive[i] = 0;
            return;
          }
          // Banana: stun enemies in radius for damage[i] seconds, no HP damage
          if (behavior[i] === 'banana') {
            G.enemies.stunInRadius(px[i], py[i], damage[i], explodeRadius[i] || 60);
            G.particles.burst(px[i], py[i], { count: 16, color: '#ffd040', size: 3, speed: 200, life: 0.4 });
            G.particles.burst(px[i], py[i], { count: 8,  color: '#fff080', size: 2, speed: 130, life: 0.3 });
            if (G.sfx) G.sfx.play('pickup_gem');
            alive[i] = 0;
            return;
          }
          G.enemies.damageAt(ei, damage[i]);
          pierce[i] -= 1;
          if (pierce[i] < 0) { alive[i] = 0; }
        }
      });
    }
    while (count > 0 && !alive[count - 1]) count--;
  }

  function render(ctx) {
    for (let i = 0; i < count; i++) {
      if (!alive[i]) continue;
      const s = G.cam.worldToScreen(px[i], py[i]);
      const spr = G.sprites.pickFrame(spriteKey[i] || 'projectile', animTime[i]);
      if (!spr) continue;
      // Sprite-specific orientation
      if (spriteKey[i] === 'raven' || spriteKey[i] === 'frost_lance' || spriteKey[i] === 'shadow_bolt') {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(Math.atan2(vy[i], vx[i]));
        ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
        ctx.restore();
      } else if (spriteKey[i] === 'dagger') {
        // Dagger sprite is drawn point-up — rotate so tip points along velocity
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(Math.atan2(vy[i], vx[i]) + Math.PI / 2);
        ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
        ctx.restore();
      } else if (spriteKey[i] === 'boomerang') {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(rotation[i]);
        ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
        ctx.restore();
      } else {
        ctx.drawImage(spr, s.x - spr.width / 2, s.y - spr.height / 2);
      }
    }
  }

  G.projectiles = { fire, markHoming, update, render, reset, MAX };
})();
