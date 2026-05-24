// Enemy SoA system. Up to MAX_ENEMIES active. Movement, contact damage, soft separation.
(function () {
  'use strict';

  const MAX = 1500;
  const px = new Float32Array(MAX);
  const py = new Float32Array(MAX);
  const hp = new Float32Array(MAX);
  const maxHp = new Float32Array(MAX);
  const speed = new Float32Array(MAX);
  const damage = new Float32Array(MAX);
  const radius = new Float32Array(MAX);
  const xpValue = new Float32Array(MAX);
  const attackCd = new Float32Array(MAX);
  const flash = new Float32Array(MAX); // hit flash timer
  const animTime = new Float32Array(MAX); // walk anim seed
  const stunTimer = new Float32Array(MAX); // stop-everything timer
  const type = new Int32Array(MAX);    // index into typeArr
  const alive = new Uint8Array(MAX);
  let count = 0;
  const typeArr = []; // [{id, def, sprite}]
  const typeById = Object.create(null);

  function reset() {
    count = 0;
    _aliveCache = 0;
    for (let i = 0; i < MAX; i++) alive[i] = 0;
  }

  // Hard wipe (boss warning) — no XP drops, no kill effects
  function clearAll() {
    for (let i = 0; i < count; i++) {
      if (alive[i]) {
        const tx = px[i], ty = py[i];
        alive[i] = 0;
        G.particles.burst(tx, ty, { count: 4, color: '#202020', size: 2, speed: 80, life: 0.25 });
      }
    }
    count = 0;
    _aliveCache = 0;
  }

  function buildTypeTable() {
    typeArr.length = 0;
    let idx = 0;
    for (const id in G.data.enemies) {
      const def = G.data.enemies[id];
      typeArr.push({ id, def, sprite: G.sprites.cache[id] });
      typeById[id] = idx;
      idx++;
    }
  }

  let _aliveCache = 0;
  function aliveCount() { return _aliveCache; }
  function recomputeAlive() {
    let c = 0;
    for (let i = 0; i < count; i++) if (alive[i]) c++;
    _aliveCache = c;
  }

  function spawn(typeId, x, y) {
    if (count >= MAX) return -1;
    const ti = typeById[typeId];
    if (ti === undefined) return -1;
    const def = typeArr[ti].def;
    // Find free slot
    let i = 0;
    for (; i < MAX; i++) if (!alive[i]) break;
    if (i >= MAX) return -1;
    // Per-minute scaling for regular enemies: +10 HP, +3 damage each minute.
    // Bosses are excluded — they use boss.js scaling.
    const minute = (G.runState && !def.isBoss) ? Math.floor(G.runState.runTime / 60) : 0;
    const hpBonus = minute * 10;
    const dmgBonus = minute * 3;
    px[i] = x; py[i] = y;
    hp[i] = def.hp + hpBonus;
    maxHp[i] = def.hp + hpBonus;
    speed[i] = def.speed;
    damage[i] = def.damage + dmgBonus;
    radius[i] = def.radius;
    xpValue[i] = def.xp;
    attackCd[i] = 0;
    flash[i] = 0;
    stunTimer[i] = 0;
    animTime[i] = Math.random();
    type[i] = ti;
    alive[i] = 1;
    if (i >= count) count = i + 1;
    _aliveCache++;
    return i;
  }

  function kill(i) {
    if (!alive[i]) return;
    const tx = px[i], ty = py[i], xv = xpValue[i];
    const def = typeArr[type[i]].def;
    alive[i] = 0;
    _aliveCache--;
    G.runState.kills++;
    if (G.sfx) G.sfx.play('enemy_kill');
    // Spawn XP gem(s)
    G.xp.spawn(tx, ty, xv);
    // Particles
    G.particles.burst(tx, ty, { count: 8, color: def.color || '#aa3030', size: 3, speed: 130, life: 0.35 });
    // On-kill effects
    const s = G.runState;
    if (s.onKillFlame) {
      // For simplicity, treat as an instant AoE pulse at the kill site
      damageInRadius(tx, ty, s.onKillFlame.dps * s.onKillFlame.duration, s.onKillFlame.radius);
      G.particles.burst(tx, ty, { count: 18, color: '#ff9030', size: 4, speed: 110, life: 0.7 });
    }
    if (s.onKillHeal) G.player.heal(s.onKillHeal);
    if (s.killEcho) {
      damageInRadius(tx, ty, s.killEcho.damage, s.killEcho.radius, 'echo');
      s.boneRings.push({
        x: tx, y: ty, r: 6, maxR: s.killEcho.radius,
        speed: s.killEcho.radius * 2.5, damage: 0,
        color: '#c080ff', hit: null,
      });
      G.particles.burst(tx, ty, { count: 14, color: '#c080ff', size: 3, speed: 220, life: 0.45 });
    }
    // Enemy-specific death behaviors
    if (def.onDeath === 'split_slime') {
      for (let k = 0; k < 2; k++) {
        const a = Math.random() * Math.PI * 2;
        spawn('miniSlime', tx + Math.cos(a) * 16, ty + Math.sin(a) * 16);
      }
    } else if (def.onDeath === 'split_skeletons') {
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        spawn('skeleton', tx + Math.cos(a) * 40, ty + Math.sin(a) * 40);
      }
      G.cam.shake(12, 0.4);
    } else if (def.onDeath === 'split_slime_swarm') {
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const d = 30 + (k % 2) * 20;
        spawn('miniSlime', tx + Math.cos(a) * d, ty + Math.sin(a) * d);
      }
      G.cam.shake(14, 0.5);
    }

    // Compact count if last
    while (count > 0 && !alive[count - 1]) count--;
  }

  function damageAt(i, amount, source) {
    if (!alive[i]) return false;
    const s = G.runState;
    let mult = s.damageMult;
    // Berserk: bonus when low HP
    if (s.berserkVal > 0 && s.hp < s.maxHp * 0.5) mult *= (1 + s.berserkVal);
    // Crit
    let isCrit = false;
    if (s.critChance > 0 && Math.random() < s.critChance) { mult *= s.critMult; isCrit = true; }
    const dmg = Math.max(1, Math.floor(amount * mult));
    hp[i] -= dmg;
    flash[i] = 0.08;
    if (G.sfx) G.sfx.play('hit');
    G.damageNumbers.add(px[i], py[i], dmg, {
      color: isCrit ? '#ff6060' : '#ffe080',
      size: isCrit ? 20 : 14,
    });
    if (s.lifesteal > 0) {
      // Heavily nerfed: 0.1% of max HP per proc (was: % of damage dealt)
      G.player.heal(s.maxHp * 0.001);
    }
    if (s.onHitAoe && source !== 'aoe') {
      damageInRadius(px[i], py[i], s.onHitAoe.damage, s.onHitAoe.radius, 'aoe');
      G.particles.burst(px[i], py[i], { count: 6, color: '#ffb030', size: 3, speed: 90, life: 0.3 });
    }
    if (hp[i] <= 0) {
      kill(i);
      return true;
    }
    return false;
  }

  function damageInRadius(x, y, amount, r, source) {
    const r2 = r * r;
    G.spatial.query(x, y, r, (i) => {
      if (!alive[i]) return;
      const dx = px[i] - x, dy = py[i] - y;
      if (dx * dx + dy * dy <= r2) damageAt(i, amount, source);
    });
  }

  function stunInRadius(x, y, duration, r) {
    const r2 = r * r;
    G.spatial.query(x, y, r, (i) => {
      if (!alive[i]) return;
      // Bosses are immune to stun (banana traps etc.)
      const def = typeArr[type[i]].def;
      if (def.isBoss) return;
      const dx = px[i] - x, dy = py[i] - y;
      if (dx * dx + dy * dy <= r2) {
        if (stunTimer[i] < duration) stunTimer[i] = duration;
        flash[i] = 0.08;
      }
    });
  }

  function update(dt) {
    const s = G.runState;
    if (!s) return;
    const ppx = s.px, ppy = s.py;

    // Rebuild spatial hash
    G.spatial.clear();
    for (let i = 0; i < count; i++) {
      if (alive[i]) G.spatial.insert(i, px[i], py[i]);
    }

    const antiAgro = s.antiAgroTimer && s.antiAgroTimer > 0;

    for (let i = 0; i < count; i++) {
      if (!alive[i]) continue;
      // Stunned enemies skip movement and attacks entirely
      if (stunTimer[i] > 0) {
        stunTimer[i] -= dt;
        if (flash[i] > 0) flash[i] -= dt;
        animTime[i] += dt * 0.3;
        continue;
      }
      // Boss movement is owned by boss.runBossAI — skip the standard chase.
      const isBoss = (s.bossIdx === i && s.bossPhase === 'fight');
      let antiTargetIdx = -1;
      if (antiAgro && !isBoss) {
        // Find nearest OTHER alive enemy for anti-agro targeting
        let bestD = 200 * 200;
        G.spatial.query(px[i], py[i], 200, (j) => {
          if (j === i || !alive[j]) return;
          const ex = px[j] - px[i], ey = py[j] - py[i];
          const ed = ex * ex + ey * ey;
          if (ed < bestD) { bestD = ed; antiTargetIdx = j; }
        });
      }
      if (!isBoss) {
        const tx = antiTargetIdx >= 0 ? px[antiTargetIdx] : ppx;
        const ty = antiTargetIdx >= 0 ? py[antiTargetIdx] : ppy;
        const mdx = tx - px[i], mdy = ty - py[i];
        const md = Math.hypot(mdx, mdy) || 1;
        const sp = speed[i];
        px[i] += (mdx / md) * sp * dt;
        py[i] += (mdy / md) * sp * dt;
      }
      // Player-relative distance used by pull/separation/contact below
      const dx = ppx - px[i], dy = ppy - py[i];
      const d = Math.hypot(dx, dy) || 1;

      // Pull effect (from garlic_reverse)
      if (s.pullEffect && d < s.pullEffect.radius) {
        px[i] += (-dx / d) * s.pullEffect.force * dt;
        py[i] += (-dy / d) * s.pullEffect.force * dt;
      }

      // Soft separation against neighbors
      G.spatial.query(px[i], py[i], 24, (j) => {
        if (j === i || !alive[j]) return;
        const ex = px[i] - px[j], ey = py[i] - py[j];
        const ed = Math.hypot(ex, ey);
        const minD = radius[i] + radius[j];
        if (ed > 0 && ed < minD) {
          const push = (minD - ed) * 0.5;
          px[i] += (ex / ed) * push;
          py[i] += (ey / ed) * push;
        }
      });

      // Contact damage
      attackCd[i] -= dt;
      if (antiAgro && antiTargetIdx >= 0) {
        // Bite the target enemy when close (use target-relative distance, not `d`)
        const adx = px[antiTargetIdx] - px[i], ady = py[antiTargetIdx] - py[i];
        const ad = Math.hypot(adx, ady);
        const arsum = radius[i] + radius[antiTargetIdx];
        if (ad < arsum + 4 && attackCd[i] <= 0) {
          damageAt(antiTargetIdx, damage[i] * 1.5, 'anti-agro');
          attackCd[i] = 0.5;
        }
      } else {
        const rsum = radius[i] + 14; // player radius
        if (d < rsum && attackCd[i] <= 0) {
          G.player.takeDamage(damage[i]);
          attackCd[i] = 0.8;
        }
      }

      if (flash[i] > 0) flash[i] -= dt;
      animTime[i] += dt;
    }
  }

  function render(ctx) {
    const s = G.runState;
    for (let i = 0; i < count; i++) {
      if (!alive[i]) continue;
      const sp = typeArr[type[i]];
      const spr = G.sprites.pickFrame(sp.id, animTime[i]);
      const screen = G.cam.worldToScreen(px[i], py[i]);
      // Cull
      if (screen.x < -50 || screen.x > G.width + 50 || screen.y < -50 || screen.y > G.height + 50) continue;
      if (spr) {
        if (flash[i] > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.9;
          ctx.drawImage(spr, screen.x - spr.width / 2, screen.y - spr.height / 2);
          ctx.restore();
        }
        ctx.drawImage(spr, screen.x - spr.width / 2, screen.y - spr.height / 2);
      }
      // HP bar for boss only
      if (sp.def.isBoss && spr) {
        const w = 80;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(screen.x - w / 2, screen.y - spr.height / 2 - 14, w, 6);
        ctx.fillStyle = '#c41e3a';
        ctx.fillRect(screen.x - w / 2, screen.y - spr.height / 2 - 14, w * (hp[i] / maxHp[i]), 6);
      }
      // Stun indicator: 3 yellow stars orbiting above the head
      if (stunTimer[i] > 0 && spr) {
        const t = performance.now() / 200;
        const cy = screen.y - spr.height / 2 - 8;
        ctx.fillStyle = '#ffe040';
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'center';
        for (let k = 0; k < 3; k++) {
          const a = t + (k * Math.PI * 2) / 3;
          ctx.fillText('*', screen.x + Math.cos(a) * 10, cy + Math.sin(a) * 4);
        }
      }
    }
  }

  G.enemies = {
    MAX, reset, clearAll, buildTypeTable, aliveCount, spawn, kill, damageAt, damageInRadius, stunInRadius, update, render,
    get count() { return count; },
    px, py, hp, maxHp, radius, alive, type, typeArr, stunTimer, attackCd,
  };
})();
