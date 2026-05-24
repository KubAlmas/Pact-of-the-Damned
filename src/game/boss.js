// Boss state machine: warning → fight → victory.
// Arcade-style: enemies cleared, boss hovers and fires bullet patterns,
// player must dodge. Death → reward choice (3 skill upgrades OR 100 souls).
(function () {
  'use strict';

  function reset() {
    const s = G.runState;
    if (!s) return;
    s.bossPhase = null;
    s.bossWarningTimer = 0;
    s.bossIdx = -1;
    s.bossState = null;
    s.pendingBossId = null;
  }

  function startWarning(bossId) {
    const s = G.runState;
    if (s.bossPhase) return;
    // Clear field: kill all enemies without XP drops
    G.enemies.clearAll();
    // Clear any in-flight enemy bullets and projectiles
    if (G.enemyProjectiles) G.enemyProjectiles.clearAll();
    s.bossPhase = 'warning';
    s.bossWarningTimer = 3.5;
    s.pendingBossId = bossId;
    G.banner.showWarning('WARNING - BOSS IS COMING', 3.5);
    G.cam.shake(18, 0.6);
    if (G.sfx) G.sfx.play('altar');
  }

  function update(dt) {
    const s = G.runState;
    if (!s || !s.bossPhase) return;

    if (s.bossPhase === 'warning') {
      s.bossWarningTimer -= dt;
      if (s.bossWarningTimer <= 0) {
        spawnTheBoss(s);
      }
      return;
    }

    if (s.bossPhase === 'fight') {
      if (s.bossIdx < 0 || !G.enemies.alive[s.bossIdx]) {
        triggerVictory(s);
        return;
      }
      runBossAI(s, dt);
    }
  }

  function spawnTheBoss(s) {
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.max(G.width, G.height) * 0.42;
    const bx = s.px + Math.cos(ang) * dist;
    const by = s.py + Math.sin(ang) * dist;
    const idx = G.enemies.spawn(s.pendingBossId, bx, by);
    if (idx < 0) { s.bossPhase = null; return; }
    // Scale by boss count: 1st boss = base, 2nd = ×1.5, 3rd = ×2.25, 4th = ×3.375 ...
    const bossIndex = s.bossesSpawned || 0;
    const mult = Math.pow(1.5, bossIndex);
    G.enemies.hp[idx] *= mult;
    G.enemies.maxHp[idx] *= mult;
    s.bossesSpawned = bossIndex + 1;
    s.bossPhase = 'fight';
    s.bossIdx = idx;
    s.bossState = { atkTimer: 2.0, phase: 0, strafeDir: 1, strafeFlip: 0, damageMult: mult };
    const def = G.data.enemies[s.pendingBossId];
    G.banner.show(def.bannerName || 'A BOSS APPROACHES', 3.0);
    G.cam.shake(22, 0.7);
    G.particles.burst(bx, by, { count: 80, color: def.color || '#c41e3a', size: 7, speed: 400, life: 1.2 });
    if (G.sfx) G.sfx.play('boss_spawn');
  }

  function runBossAI(s, dt) {
    const i = s.bossIdx;
    const st = s.bossState;
    const bx = G.enemies.px[i], by = G.enemies.py[i];

    // Movement — maintain mid-range from player, strafe perpendicular
    const dx = s.px - bx, dy = s.py - by;
    const d = Math.hypot(dx, dy) || 1;
    const desired = 280;
    if (d > desired + 50) {
      G.enemies.px[i] += (dx / d) * 55 * dt;
      G.enemies.py[i] += (dy / d) * 55 * dt;
    } else if (d < desired - 50) {
      G.enemies.px[i] -= (dx / d) * 45 * dt;
      G.enemies.py[i] -= (dy / d) * 45 * dt;
    } else {
      // Strafe perpendicular; flip direction every couple of seconds
      st.strafeFlip += dt;
      if (st.strafeFlip > 2.5) { st.strafeDir *= -1; st.strafeFlip = 0; }
      G.enemies.px[i] += (-dy / d) * 70 * dt * st.strafeDir;
      G.enemies.py[i] += (dx / d) * 70 * dt * st.strafeDir;
    }

    // Attack patterns rotate. Bosses past minute 1 attack progressively faster.
    st.atkTimer -= dt;
    if (st.atkTimer <= 0) {
      const patterns = patternListForBoss(s.pendingBossId);
      const p = patterns[st.phase % patterns.length];
      st.phase++;
      fireBossPattern(p, bx, by, s);
      const minute = Math.floor(s.runTime / 60);
      const speedFactor = Math.max(0.35, 1 - Math.max(0, minute - 1) * 0.15);
      st.atkTimer = (p.cooldown || 1.0) * speedFactor;
    }
    // Tick active boss laser beams
    updateBossBeams(s, dt);
  }

  function patternListForBoss(bossId) {
    switch (bossId) {
      case 'crimsonLord': return [
        { name: 'spread12', cooldown: 1.2 },
        { name: 'aimed5',   cooldown: 0.9 },
        { name: 'laser',    cooldown: 2.2 },
        { name: 'spiral16', cooldown: 2.6 },
        { name: 'mortar',   cooldown: 1.5 },
        { name: 'wall',     cooldown: 2.0 },
      ];
      case 'boneTyrant': return [
        { name: 'spread16', cooldown: 1.1 },
        { name: 'aimed7',   cooldown: 1.0 },
        { name: 'volley',   cooldown: 1.3 },
        { name: 'laser',    cooldown: 2.0 },
        { name: 'beam',     cooldown: 1.5 },
        { name: 'petal',    cooldown: 2.0 },
        { name: 'lasers_cross', cooldown: 3.5 },
      ];
      case 'plagueMother': return [
        { name: 'rain',     cooldown: 0.7 },
        { name: 'spread20', cooldown: 1.4 },
        { name: 'spiral24', cooldown: 3.0 },
        { name: 'laser',    cooldown: 2.4 },
        { name: 'mortar',   cooldown: 1.2 },
        { name: 'petal',    cooldown: 2.2 },
      ];
      case 'voidLord': return [
        { name: 'spiral20', cooldown: 1.6 },
        { name: 'aimed9',   cooldown: 0.8 },
        { name: 'spread24', cooldown: 1.4 },
        { name: 'laser',    cooldown: 1.8 },
        { name: 'beam',     cooldown: 1.2 },
        { name: 'petal',    cooldown: 1.8 },
        { name: 'wall',     cooldown: 1.6 },
        { name: 'lasers_cross', cooldown: 3.0 },
      ];
      default: return [
        { name: 'spread12', cooldown: 1.2 },
        { name: 'aimed5',   cooldown: 1.0 },
        { name: 'laser',    cooldown: 2.0 },
      ];
    }
  }

  function fireBossPattern(p, bx, by, s) {
    const dmgMult = (s.bossState && s.bossState.damageMult) || 1;
    const px = s.px, py = s.py;
    const baseA = Math.atan2(py - by, px - bx);

    if (p.name.startsWith('spread')) {
      const n = parseInt(p.name.slice(6), 10) || 12;
      const color = p.name === 'spread24' ? '#c050ff' : (p.name === 'spread16' ? '#fff080' : '#ff8030');
      const speed = 170;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        G.enemyProjectiles.fire(bx, by, Math.cos(a) * speed, Math.sin(a) * speed, 12 * dmgMult, 6, 9, color);
      }
    } else if (p.name.startsWith('aimed')) {
      const n = parseInt(p.name.slice(5), 10) || 5;
      const spread = 0.55;
      const color = n >= 9 ? '#ff20a0' : (n >= 7 ? '#ffc040' : '#ff3030');
      for (let k = 0; k < n; k++) {
        const a = baseA + (k - (n - 1) / 2) * (spread / Math.max(1, n - 1));
        G.enemyProjectiles.fire(bx, by, Math.cos(a) * 260, Math.sin(a) * 260, 14 * dmgMult, 5, 9, color);
      }
    } else if (p.name.startsWith('spiral')) {
      const n = parseInt(p.name.slice(6), 10) || 16;
      const color = '#c050ff';
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 4;
        const delay = k * 0.055;
        setTimeout(() => {
          const rs = G.runState;
          if (!rs || rs.bossPhase !== 'fight') return;
          const bi = rs.bossIdx;
          if (bi < 0 || !G.enemies.alive[bi]) return;
          G.enemyProjectiles.fire(
            G.enemies.px[bi], G.enemies.py[bi],
            Math.cos(a) * 200, Math.sin(a) * 200,
            11 * dmgMult, 6, 9, color);
        }, delay * 1000);
      }
    } else if (p.name === 'rain') {
      for (let k = -1; k <= 2; k++) {
        const dx = (Math.random() - 0.5) * 200;
        G.enemyProjectiles.fire(px + dx, py - 400, 0, 280, 18 * dmgMult, 3, 11, '#80ff60');
      }
    } else if (p.name === 'volley') {
      for (let k = 0; k < 5; k++) {
        const a = baseA + (Math.random() - 0.5) * 0.9;
        G.enemyProjectiles.fire(bx, by, Math.cos(a) * 240, Math.sin(a) * 240, 13 * dmgMult, 5, 10, '#e0d0a0');
      }
    } else if (p.name === 'laser') {
      // Telegraphed sweeping laser: warning 0.4s, then live beam 0.6s
      if (!s.bossBeams) s.bossBeams = [];
      s.bossBeams.push({
        x: bx, y: by, angle: baseA, len: 900,
        warning: 0.4, life: 0.6, max: 0.6,
        damage: 6 * dmgMult, tickT: 0,
      });
      if (G.sfx) G.sfx.play('chain');
    } else if (p.name === 'beam') {
      // Dense, fast bullet line — like a quasi-laser, easy to dodge sideways
      for (let k = 0; k < 14; k++) {
        const a = baseA + (Math.random() - 0.5) * 0.05;
        G.enemyProjectiles.fire(bx, by, Math.cos(a) * 520, Math.sin(a) * 520, 9 * dmgMult, 3.5, 7, '#ff20ff');
      }
      if (G.sfx) G.sfx.play('chain');
    } else if (p.name === 'mortar') {
      // 5 falling mortars — arc down onto player area
      for (let k = -2; k <= 2; k++) {
        const tx = px + k * 70 + (Math.random() - 0.5) * 30;
        const ty = py + (Math.random() - 0.5) * 40;
        G.enemyProjectiles.fire(tx, ty - 420, 0, 360, 14 * dmgMult, 1.5, 11, '#ff8030');
      }
    } else if (p.name === 'petal') {
      // 5-petal flower — 5 streams of 5 bullets each at angles
      const petals = 5, perPetal = 5;
      for (let p_i = 0; p_i < petals; p_i++) {
        const petalA = (p_i / petals) * Math.PI * 2 + baseA;
        for (let k = 0; k < perPetal; k++) {
          const a = petalA + (k - (perPetal - 1) / 2) * 0.13;
          G.enemyProjectiles.fire(bx, by, Math.cos(a) * 190, Math.sin(a) * 190, 10 * dmgMult, 5, 8, '#ff60ff');
        }
      }
    } else if (p.name === 'wall') {
      // Wall of bullets perpendicular to player direction
      const perpA = baseA + Math.PI / 2;
      const ux = Math.cos(perpA), uy = Math.sin(perpA);
      for (let k = -8; k <= 8; k++) {
        const sx = bx + ux * k * 32;
        const sy = by + uy * k * 32;
        G.enemyProjectiles.fire(sx, sy, Math.cos(baseA) * 230, Math.sin(baseA) * 230, 11 * dmgMult, 5, 9, '#80ffff');
      }
    } else if (p.name === 'lasers_cross') {
      // 4 lasers in a cross around player position
      if (!s.bossBeams) s.bossBeams = [];
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 8;
        s.bossBeams.push({
          x: bx, y: by, angle: a, len: 900,
          warning: 0.5, life: 0.5, max: 0.5,
          damage: 5 * dmgMult, tickT: 0,
        });
      }
      if (G.sfx) G.sfx.play('chain');
    }
  }

  // Update + render boss laser beams (called from runBossAI / sceneRun render)
  function updateBossBeams(s, dt) {
    if (!s.bossBeams || !s.bossBeams.length) return;
    for (let i = s.bossBeams.length - 1; i >= 0; i--) {
      const b = s.bossBeams[i];
      if (b.warning > 0) {
        b.warning -= dt;
      } else {
        b.life -= dt;
        b.tickT -= dt;
        // Damage tick
        if (b.tickT <= 0) {
          b.tickT = 0.12;
          // Line-vs-point distance: project player onto beam line
          const dx = s.px - b.x, dy = s.py - b.y;
          const ux = Math.cos(b.angle), uy = Math.sin(b.angle);
          const proj = dx * ux + dy * uy;
          if (proj > 0 && proj < b.len) {
            const perpX = dx - ux * proj, perpY = dy - uy * proj;
            const distSq = perpX * perpX + perpY * perpY;
            if (distSq < 22 * 22) { // 22px beam half-width
              G.player.takeDamage(b.damage);
            }
          }
        }
        if (b.life <= 0) s.bossBeams.splice(i, 1);
      }
    }
  }

  function renderBossBeams(ctx) {
    const s = G.runState;
    if (!s || !s.bossBeams || !s.bossBeams.length) return;
    for (const b of s.bossBeams) {
      const a = G.cam.worldToScreen(b.x, b.y);
      const ex = b.x + Math.cos(b.angle) * b.len;
      const ey = b.y + Math.sin(b.angle) * b.len;
      const e = G.cam.worldToScreen(ex, ey);
      if (b.warning > 0) {
        // Thin telegraph line
        const a1 = (b.warning / 0.4);
        ctx.strokeStyle = 'rgba(255,80,80,' + (0.6 - a1 * 0.4).toFixed(2) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(e.x, e.y); ctx.stroke();
      } else {
        // Active fat beam
        const fade = b.life / b.max;
        ctx.strokeStyle = 'rgba(255,30,80,' + (0.85 * fade).toFixed(2) + ')';
        ctx.lineWidth = 22;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(e.x, e.y); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,200,200,' + (0.9 * fade).toFixed(2) + ')';
        ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(e.x, e.y); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,' + (1.0 * fade).toFixed(2) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(e.x, e.y); ctx.stroke();
      }
    }
  }

  // Off-screen boss arrow indicator
  function renderBossIndicator(ctx) {
    const s = G.runState;
    if (!s || s.bossPhase !== 'fight' || s.bossIdx < 0) return;
    if (!G.enemies.alive[s.bossIdx]) return;
    const bx = G.enemies.px[s.bossIdx], by = G.enemies.py[s.bossIdx];
    const sc = G.cam.worldToScreen(bx, by);
    const margin = 50;
    const onScreen = sc.x >= margin && sc.x <= G.width - margin &&
                     sc.y >= margin && sc.y <= G.height - margin;
    if (onScreen) return;

    const cx = G.width / 2, cy = G.height / 2;
    const dx = sc.x - cx, dy = sc.y - cy;
    const angle = Math.atan2(dy, dx);
    const halfW = G.width / 2 - margin;
    const halfH = G.height / 2 - margin;
    let tx, ty;
    const c = Math.cos(angle), si = Math.sin(angle);
    if (Math.abs(c) * halfH > Math.abs(si) * halfW) {
      tx = c > 0 ? halfW : -halfW;
      ty = tx * (si / c);
    } else {
      ty = si > 0 ? halfH : -halfH;
      tx = ty * (c / si);
    }
    const ex = cx + tx, ey = cy + ty;

    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(angle);
    // Arrow body
    ctx.fillStyle = '#ff3030';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-10, -14);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-10, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Distance label
    const dist = Math.floor(Math.hypot(bx - s.px, by - s.py));
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    const labelY = ey + 28 * (ey < cy ? 1 : -1);
    ctx.fillText('BOSS ' + dist, ex + 1, labelY + 1);
    ctx.fillStyle = '#ffd060';
    ctx.fillText('BOSS ' + dist, ex, labelY);
    ctx.restore();
  }

  function triggerVictory(s) {
    s.bossPhase = 'victory';
    G.cam.shake(24, 0.9);
    if (G.sfx) G.sfx.play('level_up');
    G.banner.show('VICTORY', 2.0);
    G.enemyProjectiles.clearAll();
    s.paused = true;
    s.pauseReason = 'bossReward';
    G.ui.showBossReward(onRewardPicked);
  }

  function onRewardPicked(choice) {
    const s = G.runState;
    if (!s) return;
    G.ui.hideBossReward();
    s.bossPhase = null;
    s.bossIdx = -1;
    if (choice === 'skills') {
      s.pendingLevelups += 3;
      s.paused = false;
      s.pauseReason = null;
      G.levelup.trigger();
    } else if (choice === 'souls') {
      const reward = 100;
      G.meta.souls = (G.meta.souls || 0) + reward;
      G.storage.save(G.meta);
      G.banner.show('+' + reward + ' SOULS', 2.0);
      s.paused = false;
      s.pauseReason = null;
    }
  }

  G.boss = { startWarning, update, reset, renderBeams: renderBossBeams, renderIndicator: renderBossIndicator };
})();
