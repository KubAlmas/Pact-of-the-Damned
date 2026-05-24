// Wave director. Spawns enemies in a ring around the player.
(function () {
  'use strict';

  let spawnAcc = 0;
  const bossSpawned = new Set();

  function reset() { spawnAcc = 0; bossSpawned.clear(); }

  function update(dt) {
    const s = G.runState;
    if (!s) return;
    // Boss schedule check FIRST so warning can trigger and clear field
    for (const b of G.data.waves.bossSchedule) {
      if (s.runTime >= b.t && !bossSpawned.has(b.t)) {
        bossSpawned.add(b.t);
        G.boss.startWarning(b.id);
        spawnAcc = 0;
        return;
      }
    }
    // No regular spawns during any boss phase (warning/fight/victory)
    if (s.bossPhase) { spawnAcc = 0; return; }
    const w = G.data.waves.wave(s.runTime);
    const limit = w.maxAlive;
    if (G.enemies.aliveCount() >= limit) { spawnAcc = 0; return; }
    spawnAcc += dt * w.rate;
    while (spawnAcc >= 1 && G.enemies.aliveCount() < limit) {
      spawnAcc -= 1;
      spawnOne(w);
    }
  }

  function spawnOne(w) {
    const s = G.runState;
    // Pick weighted type
    let r = Math.random();
    let pick = w.pool[0];
    for (let i = 0; i < w.pool.length; i++) {
      r -= w.weights[i];
      if (r <= 0) { pick = w.pool[i]; break; }
    }
    // Spawn just off-screen ring
    const ringMin = Math.max(G.width, G.height) * 0.6;
    const ringMax = ringMin + 80;
    const ang = Math.random() * Math.PI * 2;
    const dist = ringMin + Math.random() * (ringMax - ringMin);
    const x = s.px + Math.cos(ang) * dist;
    const y = s.py + Math.sin(ang) * dist;
    G.enemies.spawn(pick, x, y);
  }

  function spawnBoss(bossId) {
    const s = G.runState;
    const def = G.data.enemies[bossId];
    if (!def) return;
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.max(G.width, G.height) * 0.55;
    const x = s.px + Math.cos(ang) * dist;
    const y = s.py + Math.sin(ang) * dist;
    G.enemies.spawn(bossId, x, y);
    s.bossesSpawned++;
    G.cam.shake(20, 0.6);
    G.banner.show(def.bannerName || 'A BOSS APPROACHES', 3.5);
    G.particles.burst(x, y, { count: 80, color: def.color || '#c41e3a', size: 7, speed: 400, life: 1.2 });
    if (G.sfx) G.sfx.play('boss_spawn');
  }

  G.spawner = { update, reset };
})();
