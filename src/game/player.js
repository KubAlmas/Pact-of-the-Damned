// Player update and render. Movement, auto-attacks via skills, death.
(function () {
  'use strict';

  // 8-direction picker from movement vector.
  // Returns one of: 'N','NE','E','SE','S','SW','W','NW' or null when idle.
  function dirFromVec(vx, vy) {
    const ax = Math.abs(vx), ay = Math.abs(vy);
    if (ax < 0.1 && ay < 0.1) return null;
    // 8-way snap with a small bias toward cardinal axes (~1.5×)
    if (ax > ay * 1.5) return vx > 0 ? 'E' : 'W';
    if (ay > ax * 1.5) return vy > 0 ? 'S' : 'N';
    if (vx > 0 && vy > 0) return 'SE';
    if (vx > 0 && vy < 0) return 'NE';
    if (vx < 0 && vy > 0) return 'SW';
    return 'NW';
  }

  function update(dt) {
    const s = G.runState;
    if (!s) return;
    const mv = G.input.moveVec();
    s.vx = mv.x * s.speed;
    s.vy = mv.y * s.speed;
    s.px += s.vx * dt;
    s.py += s.vy * dt;
    if (mv.x || mv.y) s.facing = Math.atan2(mv.y, mv.x);
    const newDir = dirFromVec(mv.x, mv.y);
    if (newDir) s.dir = newDir;
    if (!s.dir) s.dir = 'S';
    s.animTime = (s.animTime || 0) + dt * (mv.x || mv.y ? 1 : 0.4);

    if (s.iframes > 0) s.iframes -= dt;
    if (s.shieldPeriod > 0) {
      s.shieldCooldown -= dt;
      if (s.shieldCooldown <= 0 && !s.shieldReady) {
        s.shieldReady = true;
        s.shieldCooldown = s.shieldPeriod;
      }
    }
  }

  function takeDamage(amount) {
    const s = G.runState;
    if (!s || s.hp <= 0) return;
    if (s.iframes > 0) return;
    if (s.shieldReady) {
      s.shieldReady = false;
      s.iframes = 0.4;
      G.particles.burst(s.px, s.py, { count: 14, color: '#a0e0ff', size: 4, speed: 200, life: 0.5 });
      return;
    }
    let dmg = amount * s.fragile;
    // Armor reduces incoming
    if (s.armorVal > 0) dmg *= (1 - s.armorVal);
    dmg = Math.max(1, Math.floor(dmg));
    s.hp -= dmg;
    s.iframes = 0.35;
    G.damageNumbers.add(s.px, s.py, dmg, { color: '#ff5050', size: 18 });
    G.cam.shake(8, 0.18);
    if (G.sfx) G.sfx.play('player_hurt');
    // Thorns — blast attackers in radius
    if (s.thornsCfg) {
      G.enemies.damageInRadius(s.px, s.py, s.thornsCfg.damage, s.thornsCfg.radius, 'thorns');
      G.particles.burst(s.px, s.py, { count: 14, color: '#60ff80', size: 3, speed: 200, life: 0.4 });
    }
    if (s.hp <= 0) {
      s.hp = 0;
      G.particles.burst(s.px, s.py, { count: 60, color: '#c41e3a', size: 5, speed: 240, life: 1.0 });
      G.cam.shake(20, 0.6);
      if (G.sfx) G.sfx.play('death');
      G.gameOver();
    }
  }

  function heal(amount) {
    const s = G.runState;
    if (!s) return;
    s.hp = Math.min(s.maxHp, s.hp + amount);
    // Skip damage-number for imperceptible heals (e.g. nerfed lifesteal ticks)
    if (amount >= 1) {
      G.damageNumbers.add(s.px, s.py - 20, '+' + Math.floor(amount), { color: '#80ff80', size: 16 });
    }
  }

  function gainXp(amount) {
    const s = G.runState;
    if (!s) return;
    const v = Math.floor(amount * s.xpMult);
    s.xp += v;
    while (s.xp >= s.xpToNext) {
      s.xp -= s.xpToNext;
      s.level++;
      s.xpToNext = Math.floor(5 + s.level * 4 + s.level * s.level * 0.6);
      s.pendingLevelups++;
      if (G.sfx) G.sfx.play('level_up');
      if (s.onLevelHeal) heal(s.onLevelHeal);
    }
  }

  function render(ctx) {
    const s = G.runState;
    if (!s) return;
    const screen = G.cam.worldToScreen(s.px, s.py);
    const dir = s.dir || 'S';
    const moving = (s.vx * s.vx + s.vy * s.vy) > 100;

    // Always-visible pulsing halo at player feet — impossible to miss
    const pulse = 1 + 0.18 * Math.sin(performance.now() / 220);
    ctx.save();
    // Shadow under feet
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y + 22, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Outer pulsing ring (gold)
    ctx.strokeStyle = 'rgba(255,210,80,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 28 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    // Inner faint ring
    ctx.strokeStyle = 'rgba(255,240,150,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Prefer user-provided sprite-sheet frames; scale to ~56px tall.
    let frame = null;
    if (G.heroGifs) frame = G.heroGifs.pick(dir, moving, s.animTime || 0);
    if (frame) {
      ctx.save();
      if (s.iframes > 0 && Math.floor(s.iframes * 30) % 2 === 0) ctx.globalAlpha = 0.5;
      const targetH = 56;
      const scale = targetH / frame.sh;
      const w = frame.sw * scale;
      const h = targetH;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        frame.img,
        frame.sx, frame.sy, frame.sw, frame.sh,
        screen.x - w / 2, screen.y - h / 2, w, h
      );
      ctx.restore();
      return;
    }

    // Fallback: stick-figure sprite while GIFs load (or if missing)
    let key = 'hero_' + s.heroId + '_' + dir;
    let flip = false;
    if (dir === 'W')  { key = 'hero_' + s.heroId + '_E';  flip = true; }
    else if (dir === 'NW') { key = 'hero_' + s.heroId + '_NE'; flip = true; }
    else if (dir === 'SW') { key = 'hero_' + s.heroId + '_SE'; flip = true; }
    const spr = G.sprites.pickFrame(key, s.animTime || 0);
    if (spr) {
      ctx.save();
      if (s.iframes > 0 && Math.floor(s.iframes * 30) % 2 === 0) ctx.globalAlpha = 0.5;
      const x = screen.x - spr.width / 2;
      const y = screen.y - spr.height / 2;
      if (flip) { ctx.scale(-1, 1); ctx.drawImage(spr, -x - spr.width, y); }
      else { ctx.drawImage(spr, x, y); }
      ctx.restore();
      return;
    }
    // Last-resort visible marker so the player is NEVER invisible (large, bright)
    ctx.save();
    if (s.iframes > 0 && Math.floor(s.iframes * 30) % 2 === 0) ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#f4e4c1';
    ctx.strokeStyle = '#c41e3a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (s.shieldReady) {
      ctx.strokeStyle = 'rgba(180,220,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, 30, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  G.player = { update, render, takeDamage, heal, gainXp };
})();
