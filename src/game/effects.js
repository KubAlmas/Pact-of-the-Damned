// Interprets skill effect tags and rebuilds runtime fields on RunState.
// Called whenever a skill is added/leveled or after a Pact sacrifice.
(function () {
  'use strict';

  function recompute() {
    const s = G.runState;
    if (!s) return;
    // Reset derived fields
    s.speed = s.hero.stats.speed;
    s.baseDamage = s.hero.stats.baseDamage;
    s.pickupRange = s.hero.stats.pickupRange;
    s.damageMult = 1;
    s.xpMult = 1;
    s.lifesteal = 0;
    s.fragile = 1;
    s.orbits = [];
    s.auras = [];
    s.whip = null;
    s.pullEffect = null;
    s.shieldPeriod = 0;
    s.burstFire = null;
    s.onHitAoe = null;
    s.onKillFlame = null;
    s.onLevelHeal = 0;
    s.onKillHeal = 0;
    s.cometCfg = null;
    s.ravensCfg = null;
    s.sigilCfg = null;
    s.chainCfg = null;
    s.novaCfg = null;
    s.bombCfg = null;
    s.yoinkCfg = null;
    s.holyCfg = null;
    s.thornsCfg = null;
    s.critChance = 0; s.critMult = 2;
    s.berserkVal = 0;
    s.regenVal = 0;
    s.armorVal = 0;
    s.killEcho = null;
    s.boomerangCfg = null;
    s.fireballCfg = null;
    s.bananaCfg = null;
    s.frostLanceCfg = null;
    s.shadowBoltCfg = null;
    s.daggerCfg = null;
    s.nukeCfg = null;
    s.antiAgroCfg = null;
    s.laserCfg = null;

    // Note: hp_mult flat is applied at acquisition time (in addSkill), not here.

    // Walk every skill, apply its effects at current level, scaled by talent level
    for (const id in s.skills) {
      const lv = s.skills[id];
      const sk = findSkill(id);
      if (!sk) continue;
      const eff = sk.effects(lv);
      const talentLv = G.storage ? G.storage.talentLevel(id) : 0;
      const talentMult = 1 + talentLv * 0.10;
      for (const e of eff) applyEffect(s, e, talentMult);
    }
    // Apply Pact-of-flesh permanent multipliers stored separately
    if (s._fleshMult) {
      s.damageMult *= s._fleshMult;
    }
    if (s._greedMult) {
      s.xpMult *= s._greedMult;
    }
  }

  function applyEffect(s, e, talentMult) {
    const m = talentMult || 1;
    switch (e.type) {
      case 'damage_mult': s.damageMult *= 1 + (e.value - 1) * m; break;
      case 'speed_mult':  s.speed *= 1 + (e.value - 1) * m; break;
      case 'xp_mult':     s.xpMult *= 1 + (e.value - 1) * m; break;
      case 'pickup_range': s.pickupRange += (e.flat || 0) * m; break;
      case 'orbit_damage':
        s.orbits.push({ count: e.count, damage: e.damage * m, radius: e.radius, speed: e.speed, big: !!e.big, spriteKey: e.spriteKey || 'batPet' });
        break;
      case 'aura_damage':
        s.auras.push({ dps: e.dps * m, radius: e.radius });
        break;
      case 'whip':
        s.whip = { cooldown: e.cooldown, damage: e.damage, range: e.range, arc: e.arc, timer: 0 };
        break;
      case 'pull':
        s.pullEffect = { force: e.force, radius: e.radius, dps: e.dps };
        break;
      case 'shield_periodic':
        s.shieldPeriod = e.cooldown;
        if (s.shieldCooldown <= 0) s.shieldCooldown = e.cooldown;
        break;
      case 'projectile_burst':
        s.burstFire = { cooldown: e.cooldown, damage: e.damage, count: e.count, speed: e.speed, pierce: e.pierce, timer: 0 };
        break;
      case 'on_hit_aoe':
        s.onHitAoe = { damage: e.damage, radius: e.radius };
        break;
      case 'on_kill_flame':
        s.onKillFlame = { dps: e.dps, duration: e.duration, radius: e.radius };
        break;
      case 'on_level_heal':
        s.onLevelHeal = e.value;
        break;
      case 'on_kill_heal':
        s.onKillHeal = e.value;
        break;
      case 'lifesteal':
        s.lifesteal += e.value;
        break;
      case 'fragile':
        s.fragile *= e.value;
        break;
      case 'comet':
        s.cometCfg = { cooldown: e.cooldown, damage: e.damage, radius: e.radius };
        break;
      case 'ravens':
        s.ravensCfg = { cooldown: e.cooldown, count: e.count, damage: e.damage };
        break;
      case 'sigil':
        s.sigilCfg = { cooldown: e.cooldown, dps: e.dps, duration: e.duration, radius: e.radius };
        break;
      case 'chain_lightning':
        s.chainCfg = { cooldown: e.cooldown, damage: e.damage, jumps: e.jumps, range: e.range };
        break;
      case 'frost_nova':
        s.novaCfg = { cooldown: e.cooldown, damage: e.damage, maxRadius: e.maxRadius, speed: e.speed };
        break;
      case 'bomb':
        s.bombCfg = { cooldown: e.cooldown, damage: e.damage, radius: e.radius, fuse: e.fuse };
        break;
      case 'yoink':
        s.yoinkCfg = { cooldown: e.cooldown, damage: e.damage, radius: e.radius };
        break;
      case 'holy_fire':
        s.holyCfg = { cooldown: e.cooldown, damage: e.damage, radius: e.radius };
        break;
      case 'thorns':
        s.thornsCfg = { damage: e.damage, radius: e.radius };
        break;
      case 'crit':
        s.critChance = Math.min(1, s.critChance + e.chance);
        s.critMult = e.mult || s.critMult;
        break;
      case 'berserk':
        s.berserkVal += e.value;
        break;
      case 'regen':
        s.regenVal += e.value;
        break;
      case 'armor':
        s.armorVal = Math.min(0.85, s.armorVal + e.value);
        break;
      case 'kill_echo':
        s.killEcho = { damage: e.damage, radius: e.radius };
        break;
      case 'boomerang':
        s.boomerangCfg = { cooldown: e.cooldown, count: e.count, damage: e.damage, range: e.range };
        break;
      case 'fireball':
        s.fireballCfg = { cooldown: e.cooldown, damage: e.damage, radius: e.radius, speed: e.speed };
        break;
      case 'banana':
        s.bananaCfg = { cooldown: e.cooldown, count: e.count, stunDuration: e.stunDuration, life: e.life, radius: e.radius || 65 };
        break;
      case 'frost_lance':
        s.frostLanceCfg = { cooldown: e.cooldown, damage: e.damage, pierce: e.pierce, speed: e.speed };
        break;
      case 'shadow_bolt':
        s.shadowBoltCfg = { cooldown: e.cooldown, damage: e.damage };
        break;
      case 'throwing_daggers':
        s.daggerCfg = { cooldown: e.cooldown, count: e.count, damage: e.damage, pierce: e.pierce, speed: e.speed };
        break;
      case 'nuke':
        s.nukeCfg = { cooldown: e.cooldown, damage: e.damage, radius: e.radius };
        break;
      case 'anti_agro':
        s.antiAgroCfg = { cooldown: e.cooldown, duration: e.duration };
        break;
      case 'laser':
        s.laserCfg = { cooldown: e.cooldown, duration: e.duration, beams: e.beams, dps: e.dps, range: e.range || 350 };
        break;
      case 'hp_mult':
        // Handled at acquisition time
        break;
      default:
        console.warn('Unknown effect', e.type);
    }
  }

  function findSkill(id) {
    return G.data.skills.find(x => x.id === id) || G.data.legendary.find(x => x.id === id);
  }

  // Add or level up a skill. If it's a legendary, treat as max-level.
  function addSkill(id) {
    const s = G.runState;
    const sk = findSkill(id);
    if (!sk) return;
    const isLegendary = G.data.legendary.some(l => l.id === id);
    if (isLegendary) {
      // Legendary skills don't level — they're already powerful
      s.skills[id] = 1;
      if (s.skillOrder.indexOf(id) === -1) s.skillOrder.push(id);
    } else {
      const cur = s.skills[id] || 0;
      const next = Math.min((sk.maxLevel || 5), cur + 1);
      s.skills[id] = next;
      if (cur === 0) s.skillOrder.push(id);
      // hp_mult is special: apply flat HP gain on each level pickup
      const eff = sk.effects(next);
      for (const e of eff) {
        if (e.type === 'hp_mult') {
          // For Vitality the difference vs previous level
          const prevFlat = cur === 0 ? 0 : sk.effects(cur)[0].flat;
          const inc = (e.flat || 0) - prevFlat;
          if (inc > 0) {
            s.maxHp += inc;
            if (e.heal) s.hp = s.maxHp;
            else s.hp = Math.min(s.maxHp, s.hp + inc);
          }
        }
      }
    }
    recompute();
  }

  function removeSkill(id) {
    const s = G.runState;
    delete s.skills[id];
    const i = s.skillOrder.indexOf(id);
    if (i >= 0) s.skillOrder.splice(i, 1);
    recompute();
  }

  function getAvailableForLevelUp() {
    const s = G.runState;
    const pool = [];
    for (const sk of G.data.skills) {
      const lv = s.skills[sk.id] || 0;
      if (lv < (sk.maxLevel || 5)) pool.push({ skill: sk, nextLevel: lv + 1, isNew: lv === 0 });
    }
    return pool;
  }

  // === Update logic for active skills (called each frame) ===
  function updateActive(dt) {
    const s = G.runState;
    if (!s) return;

    // Orbits — rotate around player; check enemy hits within radius
    if (s.orbits.length) {
      s._orbitAngle = (s._orbitAngle || 0) + dt;
      for (const o of s.orbits) {
        const tickCD = 0.25; // damage tick rate
        o._tick = (o._tick || 0) - dt;
        if (o._tick <= 0) {
          o._tick = tickCD;
          for (let k = 0; k < o.count; k++) {
            const ang = s._orbitAngle * o.speed + (k * Math.PI * 2) / o.count;
            const ox = s.px + Math.cos(ang) * o.radius;
            const oy = s.py + Math.sin(ang) * o.radius;
            G.enemies.damageInRadius(ox, oy, o.damage, o.big ? 60 : 22);
          }
        }
      }
    }

    // Auras — damage all enemies within radius continuously
    for (const a of s.auras) {
      a._tick = (a._tick || 0) - dt;
      if (a._tick <= 0) {
        a._tick = 0.25; // 4 ticks/sec
        G.enemies.damageInRadius(s.px, s.py, a.dps * 0.25, a.radius);
      }
    }

    // Pull effect dps
    if (s.pullEffect && s.pullEffect.dps > 0) {
      const p = s.pullEffect;
      p._tick = (p._tick || 0) - dt;
      if (p._tick <= 0) {
        p._tick = 0.25;
        G.enemies.damageInRadius(s.px, s.py, p.dps * 0.25, p.radius);
      }
    }

    // Whip — periodic forward sweep
    if (s.whip) {
      s.whip.timer -= dt;
      if (s.whip.timer <= 0) {
        s.whip.timer = s.whip.cooldown;
        const dir = s.facing;
        const arc = s.whip.arc;
        const r = s.whip.range;
        // Sample several points along arc
        for (let t = 0; t <= 1; t += 0.2) {
          const a = dir - arc / 2 + arc * t;
          const wx = s.px + Math.cos(a) * r * 0.7;
          const wy = s.py + Math.sin(a) * r * 0.7;
          G.enemies.damageInRadius(wx, wy, s.whip.damage, 40);
        }
        s._whipFx = { dir, arc, range: r, t: 0.18 };
        G.particles.burst(s.px + Math.cos(dir) * r * 0.5, s.py + Math.sin(dir) * r * 0.5,
          { count: 14, color: '#c41e3a', size: 4, speed: 220, life: 0.4, dir, spread: arc });
      }
    }

    // Projectile burst
    if (s.burstFire) {
      s.burstFire.timer -= dt;
      if (s.burstFire.timer <= 0) {
        s.burstFire.timer = s.burstFire.cooldown;
        // Aim at nearest enemy direction
        let bestD = Infinity, bestA = s.facing;
        for (let i = 0; i < G.enemies.count; i++) {
          if (!G.enemies.alive[i]) continue;
          const dx = G.enemies.px[i] - s.px, dy = G.enemies.py[i] - s.py;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; bestA = Math.atan2(dy, dx); }
        }
        const spread = Math.PI * 0.25;
        for (let k = 0; k < s.burstFire.count; k++) {
          const a = bestA + (k - (s.burstFire.count - 1) / 2) * (spread / Math.max(1, s.burstFire.count - 1));
          G.projectiles.fire(s.px, s.py, Math.cos(a) * s.burstFire.speed, Math.sin(a) * s.burstFire.speed,
            s.burstFire.damage, 1.6, s.burstFire.pierce - 1, 8);
        }
      }
    }

    // === Hero signature AOEs (persist through Pact sacrifice) ===
    if (s.sigCfg) updateSignature(s, dt);

    // Expand any active shockwave rings (signature + skill-spawned)
    updateRings(s, dt);

    // === New skill systems ===
    if (s.regenVal > 0 && s.hp < s.maxHp) {
      s.hp = Math.min(s.maxHp, s.hp + s.regenVal * dt);
    }

    if (s.ravensCfg) {
      s.ravensTimer -= dt;
      if (s.ravensTimer <= 0) {
        s.ravensTimer = s.ravensCfg.cooldown;
        const cfg = s.ravensCfg;
        for (let k = 0; k < cfg.count; k++) {
          const a = (k / cfg.count) * Math.PI * 2 + Math.random() * 0.3;
          const idx = G.projectiles.fire(
            s.px, s.py,
            Math.cos(a) * 240, Math.sin(a) * 240,
            cfg.damage, 4.5, 1, 16,
            { spriteKey: 'raven' }
          );
          if (idx >= 0) G.projectiles.markHoming(idx);
        }
        // Black feather puff
        G.particles.burst(s.px, s.py, { count: 16, color: '#0a0010', size: 3, speed: 180, life: 0.5 });
        G.particles.burst(s.px, s.py, { count: 8, color: '#3a2030', size: 2, speed: 120, life: 0.4 });
      }
    }

    if (s.sigilCfg) {
      s.sigilTimer -= dt;
      if (s.sigilTimer <= 0) {
        s.sigilTimer = s.sigilCfg.cooldown;
        s.sigils.push({
          x: s.px, y: s.py,
          life: s.sigilCfg.duration, max: s.sigilCfg.duration,
          dps: s.sigilCfg.dps, radius: s.sigilCfg.radius,
          tick: 0, rot: 0,
        });
        if (G.sfx) G.sfx.play('blood_pool');
      }
      for (let i = s.sigils.length - 1; i >= 0; i--) {
        const g = s.sigils[i];
        g.life -= dt; g.tick -= dt; g.rot += dt * 0.8;
        if (g.tick <= 0) {
          g.tick = 0.25;
          G.enemies.damageInRadius(g.x, g.y, g.dps * 0.25, g.radius);
        }
        if (g.life <= 0) s.sigils.splice(i, 1);
      }
    }

    if (s.chainCfg) {
      s.chainTimer -= dt;
      if (s.chainTimer <= 0) {
        s.chainTimer = s.chainCfg.cooldown;
        castChainLightning(s, s.chainCfg);
      }
    }
    // Tick lightning visuals
    for (let i = s.lightningFx.length - 1; i >= 0; i--) {
      s.lightningFx[i].life -= dt;
      if (s.lightningFx[i].life <= 0) s.lightningFx.splice(i, 1);
    }

    if (s.novaCfg) {
      s.novaTimer -= dt;
      if (s.novaTimer <= 0) {
        s.novaTimer = s.novaCfg.cooldown;
        s.boneRings.push({
          x: s.px, y: s.py, r: 20, maxR: s.novaCfg.maxRadius,
          speed: s.novaCfg.speed, damage: s.novaCfg.damage,
          color: '#a0e0ff', hit: new Set(),
        });
        G.particles.burst(s.px, s.py, { count: 18, color: '#a0e0ff', size: 4, speed: 200, life: 0.5 });
        if (G.sfx) G.sfx.play('bone_storm');
      }
    }

    if (s.bombCfg) {
      s.bombTimer -= dt;
      if (s.bombTimer <= 0) {
        s.bombTimer = s.bombCfg.cooldown;
        const ang = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 60;
        s.bombs.push({
          x: s.px + Math.cos(ang) * dist,
          y: s.py + Math.sin(ang) * dist,
          fuse: s.bombCfg.fuse, maxFuse: s.bombCfg.fuse,
          damage: s.bombCfg.damage, radius: s.bombCfg.radius,
        });
      }
      for (let i = s.bombs.length - 1; i >= 0; i--) {
        const b = s.bombs[i];
        b.fuse -= dt;
        if (b.fuse <= 0) {
          G.enemies.damageInRadius(b.x, b.y, b.damage, b.radius);
          G.particles.burst(b.x, b.y, { count: 50, color: '#ff8030', size: 6, speed: 320, life: 0.8 });
          G.cam.shake(8, 0.2);
          if (G.sfx) G.sfx.play('boss_spawn');
          s.bombs.splice(i, 1);
        }
      }
    }

    if (s.yoinkCfg) {
      s.yoinkTimer -= dt;
      if (s.yoinkTimer <= 0) {
        s.yoinkTimer = s.yoinkCfg.cooldown;
        // Find farthest NON-BOSS enemy within visible range
        const RANGE = 600;
        const RANGE2 = RANGE * RANGE;
        let bestI = -1, bestD = 0;
        for (let i = 0; i < G.enemies.count; i++) {
          if (!G.enemies.alive[i]) continue;
          const def = G.enemies.typeArr[G.enemies.type[i]].def;
          if (def.isBoss) continue; // never yank bosses onto the player
          const dx = G.enemies.px[i] - s.px, dy = G.enemies.py[i] - s.py;
          const d = dx * dx + dy * dy;
          if (d > bestD && d < RANGE2) { bestD = d; bestI = i; }
        }
        if (bestI >= 0) {
          const tx = G.enemies.px[bestI], ty = G.enemies.py[bestI];
          // 1) Ghostly tendril from player to target (visible for 0.4s)
          s.lightningFx.push({ x1: s.px, y1: s.py, x2: tx, y2: ty, color: '#a0e0ff', life: 0.4, max: 0.4, width: 4 });
          s.lightningFx.push({ x1: s.px, y1: s.py, x2: tx, y2: ty, color: '#e0f0ff', life: 0.4, max: 0.4, width: 2 });
          // 2) Grab particles at the target
          G.particles.burst(tx, ty, { count: 40, color: '#a0e0ff', size: 5, speed: 320, life: 0.75 });
          G.particles.burst(tx, ty, { count: 10, color: '#ffffff', size: 3, speed: 180, life: 0.45 });
          // 3) Yank — drop them 80px from player on a random arc (NOT on top of player)
          const dropAngle = Math.random() * Math.PI * 2;
          const dropDist = 80;
          G.enemies.px[bestI] = s.px + Math.cos(dropAngle) * dropDist;
          G.enemies.py[bestI] = s.py + Math.sin(dropAngle) * dropDist;
          // Prevent the yanked enemy from immediately contact-damaging the player
          if (G.enemies.attackCd) G.enemies.attackCd[bestI] = 1.5;
          // 4) Landing burst + AoE damage
          G.enemies.damageInRadius(s.px, s.py, s.yoinkCfg.damage, s.yoinkCfg.radius);
          G.particles.burst(s.px, s.py, { count: 36, color: '#80b0ff', size: 5, speed: 280, life: 0.6 });
          s.boneRings.push({ x: s.px, y: s.py, r: 8, maxR: s.yoinkCfg.radius + 20, speed: 480, damage: 0, color: '#a0e0ff', hit: null });
          // Short safety iframes so the yank itself never costs the player HP
          s.iframes = Math.max(s.iframes, 0.5);
          G.cam.shake(7, 0.22);
          if (G.sfx) G.sfx.play('sacrifice');
        }
      }
    }

    // === New ranged weapons ===
    if (s.boomerangCfg) {
      s._boomTimer = (s._boomTimer || 0) - dt;
      if (s._boomTimer <= 0) {
        s._boomTimer = s.boomerangCfg.cooldown;
        const cfg = s.boomerangCfg;
        for (let k = 0; k < cfg.count; k++) {
          const a = (k / cfg.count) * Math.PI * 2 + Math.random() * 0.4;
          G.projectiles.fire(s.px, s.py, Math.cos(a) * 280, Math.sin(a) * 280,
            cfg.damage, 3.5, 4, 10,
            { spriteKey: 'boomerang', behavior: 'boomerang', maxRange: cfg.range });
        }
      }
    }
    if (s.fireballCfg) {
      s._fireTimer = (s._fireTimer || 0) - dt;
      if (s._fireTimer <= 0) {
        s._fireTimer = s.fireballCfg.cooldown;
        const cfg = s.fireballCfg;
        // Aim at nearest enemy
        let bestI = -1, bestD = Infinity;
        for (let i = 0; i < G.enemies.count; i++) {
          if (!G.enemies.alive[i]) continue;
          const dx = G.enemies.px[i] - s.px, dy = G.enemies.py[i] - s.py;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; bestI = i; }
        }
        const a = bestI >= 0 ? Math.atan2(G.enemies.py[bestI] - s.py, G.enemies.px[bestI] - s.px) : s.facing;
        G.projectiles.fire(s.px, s.py, Math.cos(a) * cfg.speed, Math.sin(a) * cfg.speed,
          cfg.damage, 2.5, 0, 12,
          { spriteKey: 'fireball', behavior: 'fireball', explodeRadius: cfg.radius });
      }
    }
    if (s.bananaCfg) {
      s._bananaTimer = (s._bananaTimer || 0) - dt;
      if (s._bananaTimer <= 0) {
        s._bananaTimer = s.bananaCfg.cooldown;
        const cfg = s.bananaCfg;
        for (let k = 0; k < cfg.count; k++) {
          const a = (k / cfg.count) * Math.PI * 2 + Math.random() * 0.5;
          const d = 70 + Math.random() * 50;
          G.projectiles.fire(s.px + Math.cos(a) * d, s.py + Math.sin(a) * d, 0, 0,
            cfg.stunDuration, cfg.life, 0, 16,
            { spriteKey: 'banana', behavior: 'banana', explodeRadius: cfg.radius });
        }
      }
    }
    if (s.frostLanceCfg) {
      s._lanceTimer = (s._lanceTimer || 0) - dt;
      if (s._lanceTimer <= 0) {
        s._lanceTimer = s.frostLanceCfg.cooldown;
        const cfg = s.frostLanceCfg;
        let bestI = -1, bestD = Infinity;
        for (let i = 0; i < G.enemies.count; i++) {
          if (!G.enemies.alive[i]) continue;
          const dx = G.enemies.px[i] - s.px, dy = G.enemies.py[i] - s.py;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; bestI = i; }
        }
        const a = bestI >= 0 ? Math.atan2(G.enemies.py[bestI] - s.py, G.enemies.px[bestI] - s.px) : s.facing;
        G.projectiles.fire(s.px, s.py, Math.cos(a) * cfg.speed, Math.sin(a) * cfg.speed,
          cfg.damage, 1.5, cfg.pierce, 10,
          { spriteKey: 'frost_lance' });
      }
    }
    if (s.daggerCfg) {
      s._daggerTimer = (s._daggerTimer || 0) - dt;
      if (s._daggerTimer <= 0) {
        s._daggerTimer = s.daggerCfg.cooldown;
        const cfg = s.daggerCfg;
        // Aim at the mouse cursor (convert screen → world)
        const mw = G.cam.screenToWorld(G.input.mouse.x, G.input.mouse.y);
        const baseA = Math.atan2(mw.y - s.py, mw.x - s.px);
        const spread = cfg.count > 1 ? 0.18 : 0;
        for (let k = 0; k < cfg.count; k++) {
          const offset = cfg.count > 1 ? (k - (cfg.count - 1) / 2) * spread : 0;
          const a = baseA + offset;
          G.projectiles.fire(
            s.px, s.py,
            Math.cos(a) * cfg.speed, Math.sin(a) * cfg.speed,
            cfg.damage, 1.6, cfg.pierce, 8,
            { spriteKey: 'dagger' }
          );
        }
      }
    }
    if (s.shadowBoltCfg) {
      s._shadowTimer = (s._shadowTimer || 0) - dt;
      if (s._shadowTimer <= 0) {
        s._shadowTimer = s.shadowBoltCfg.cooldown;
        const cfg = s.shadowBoltCfg;
        const a = Math.random() * Math.PI * 2;
        const idx = G.projectiles.fire(s.px, s.py, Math.cos(a) * 260, Math.sin(a) * 260,
          cfg.damage, 3.0, 1, 10,
          { spriteKey: 'shadow_bolt' });
        if (idx >= 0) G.projectiles.markHoming(idx);
      }
    }

    // === Legendary: Nuke — periodic apocalyptic AoE ===
    if (s.nukeCfg) {
      s._nukeTimer = (s._nukeTimer || 0) - dt;
      if (s._nukeTimer <= 0) {
        s._nukeTimer = s.nukeCfg.cooldown;
        const cfg = s.nukeCfg;
        // Multi-ring shockwave + big damage
        G.enemies.damageInRadius(s.px, s.py, cfg.damage, cfg.radius);
        s.boneRings.push({ x: s.px, y: s.py, r: 30, maxR: cfg.radius, speed: 1200, damage: 0, color: '#ffff80', hit: null });
        s.boneRings.push({ x: s.px, y: s.py, r: 10, maxR: cfg.radius * 0.7, speed: 900, damage: 0, color: '#ffa030', hit: null });
        G.particles.burst(s.px, s.py, { count: 120, color: '#ffe040', size: 7, speed: 700, life: 1.2 });
        G.particles.burst(s.px, s.py, { count: 60,  color: '#ff5020', size: 8, speed: 450, life: 1.0 });
        G.cam.shake(30, 1.0);
        if (G.sfx) G.sfx.play('boss_spawn');
      }
    }

    // === Legendary: Laser (Homelander) ===
    if (s.laserCfg) {
      s._laserTimer = (s._laserTimer || 0) - dt;
      if (s._laserTimer <= 0) {
        s._laserTimer = s.laserCfg.cooldown;
        const ang = Math.random() * Math.PI * 2;
        s.homelanders.push({
          x: s.px + Math.cos(ang) * 40,
          y: s.py + Math.sin(ang) * 40 - 30,
          angle: 0,
          life: s.laserCfg.duration,
          max: s.laserCfg.duration,
          cfg: s.laserCfg,
        });
        G.cam.shake(6, 0.25);
        if (G.sfx) G.sfx.play('chain');
      }
      // Tick existing
      for (let i = s.homelanders.length - 1; i >= 0; i--) {
        const h = s.homelanders[i];
        h.life -= dt;
        h.angle += dt * 3.0;
        // Damage along each beam (sample line)
        for (let b = 0; b < h.cfg.beams; b++) {
          const a = h.angle + (b / h.cfg.beams) * Math.PI * 2;
          const dirx = Math.cos(a), diry = Math.sin(a);
          for (let r = 30; r <= h.cfg.range; r += 30) {
            G.enemies.damageInRadius(h.x + dirx * r, h.y + diry * r, h.cfg.dps * dt * 1.4, 26);
          }
        }
        if (h.life <= 0) s.homelanders.splice(i, 1);
      }
    }

    // === Legendary: Anti-Agro — enemies turn on each other ===
    if (s.antiAgroCfg) {
      s.antiAgroTimer = (s.antiAgroTimer || 0) - dt;
      s._antiAgroCdTimer = (s._antiAgroCdTimer || 0) - dt;
      if (s._antiAgroCdTimer <= 0 && s.antiAgroTimer <= 0) {
        s._antiAgroCdTimer = s.antiAgroCfg.cooldown;
        s.antiAgroTimer = s.antiAgroCfg.duration;
        G.banner.show('ANTI-AGRO: CHAOS', 1.5);
        G.particles.burst(s.px, s.py, { count: 40, color: '#80ffff', size: 5, speed: 400, life: 0.8 });
        if (G.sfx) G.sfx.play('chain');
      }
    }

    if (s.holyCfg) {
      s.holyTimer -= dt;
      if (s.holyTimer <= 0) {
        s.holyTimer = s.holyCfg.cooldown;
        if (G.enemies.count > 0) {
          let pick = -1;
          for (let tries = 0; tries < 8; tries++) {
            const i = Math.floor(Math.random() * G.enemies.count);
            if (G.enemies.alive[i]) { pick = i; break; }
          }
          if (pick >= 0) {
            const tx = G.enemies.px[pick], ty = G.enemies.py[pick];
            G.enemies.damageInRadius(tx, ty, s.holyCfg.damage, s.holyCfg.radius);
            G.particles.burst(tx, ty, { count: 28, color: '#ffe060', size: 5, speed: 260, life: 0.7 });
            s.lightningFx.push({ x1: tx, y1: ty - 400, x2: tx, y2: ty, color: '#ffd060', life: 0.18, max: 0.18, width: 5 });
          }
        }
      }
    }

    // Comet (legendary)
    if (s.cometCfg) {
      s.cometTimer -= dt;
      if (s.cometTimer <= 0) {
        s.cometTimer = s.cometCfg.cooldown;
        // Pick a random enemy from the count
        if (G.enemies.count > 0) {
          let pick = -1;
          for (let tries = 0; tries < 8; tries++) {
            const i = Math.floor(Math.random() * G.enemies.count);
            if (G.enemies.alive[i]) { pick = i; break; }
          }
          if (pick >= 0) {
            const tx = G.enemies.px[pick], ty = G.enemies.py[pick];
            G.enemies.damageInRadius(tx, ty, s.cometCfg.damage, s.cometCfg.radius);
            G.particles.burst(tx, ty, { count: 32, color: '#ff8030', size: 5, speed: 260, life: 0.6 });
            G.cam.shake(4, 0.1);
          }
        }
      }
    }
  }

  function updateSignature(s, dt) {
    const cfg = s.sigCfg;
    s.sigTimer -= dt;
    if (cfg.type === 'bat_burst') {
      if (s.sigTimer <= 0) {
        s.sigTimer = cfg.cooldown;
        for (let k = 0; k < cfg.count; k++) {
          const a = (k / cfg.count) * Math.PI * 2 + Math.random() * 0.2;
          G.projectiles.fire(s.px, s.py, Math.cos(a) * cfg.speed, Math.sin(a) * cfg.speed,
            cfg.damage, cfg.life, 2, 10);
        }
        G.particles.burst(s.px, s.py, { count: 18, color: '#7a3da8', size: 4, speed: 180, life: 0.5 });
        if (G.sfx) G.sfx.play('bat_burst');
      }
    } else if (cfg.type === 'blood_pool') {
      if (s.sigTimer <= 0) {
        s.sigTimer = cfg.cooldown;
        s.bloodPools.push({ x: s.px, y: s.py, life: cfg.duration, max: cfg.duration, dps: cfg.dps, radius: cfg.radius, tick: 0 });
        if (G.sfx) G.sfx.play('blood_pool');
      }
      // Tick existing pools
      for (let i = s.bloodPools.length - 1; i >= 0; i--) {
        const p = s.bloodPools[i];
        p.life -= dt; p.tick -= dt;
        if (p.tick <= 0) {
          p.tick = 0.25;
          G.enemies.damageInRadius(p.x, p.y, p.dps * 0.25, p.radius);
        }
        if (p.life <= 0) s.bloodPools.splice(i, 1);
      }
    } else if (cfg.type === 'bone_storm') {
      if (s.sigTimer <= 0) {
        s.sigTimer = cfg.cooldown;
        s.boneRings.push({ x: s.px, y: s.py, r: 20, maxR: cfg.maxRadius, speed: cfg.ringSpeed, damage: cfg.damage, color: '#f4e4c1', hit: new Set() });
        G.particles.burst(s.px, s.py, { count: 24, color: '#f4e4c1', size: 3, speed: 240, life: 0.5 });
        if (G.sfx) G.sfx.play('bone_storm');
      }
    }
  }

  // Generic expansion logic for ALL shockwave rings (bone storm, frost nova, soul echo).
  // Visual-only rings (damage <= 0) just animate without damaging.
  function updateRings(s, dt) {
    if (!s.boneRings || !s.boneRings.length) return;
    for (let i = s.boneRings.length - 1; i >= 0; i--) {
      const ring = s.boneRings[i];
      const prevR = ring.r;
      ring.r += ring.speed * dt;
      if (ring.r >= ring.maxR) { s.boneRings.splice(i, 1); continue; }
      if (ring.damage > 0 && ring.hit) {
        G.spatial.query(ring.x, ring.y, ring.r + 16, (ei) => {
          if (!G.enemies.alive[ei] || ring.hit.has(ei)) return;
          const dx = G.enemies.px[ei] - ring.x, dy = G.enemies.py[ei] - ring.y;
          const d = Math.hypot(dx, dy);
          if (d <= ring.r && d >= prevR - 16) {
            G.enemies.damageAt(ei, ring.damage);
            ring.hit.add(ei);
          }
        });
      }
    }
  }

  function castChainLightning(s, cfg) {
    const visited = new Set();
    let cx = s.px, cy = s.py;
    let prevX = s.px, prevY = s.py;
    for (let jump = 0; jump < cfg.jumps; jump++) {
      let bestI = -1, bestD = cfg.range * cfg.range;
      G.spatial.query(cx, cy, cfg.range, (i) => {
        if (!G.enemies.alive[i] || visited.has(i)) return;
        const dx = G.enemies.px[i] - cx, dy = G.enemies.py[i] - cy;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; bestI = i; }
      });
      if (bestI < 0) break;
      visited.add(bestI);
      const tx = G.enemies.px[bestI], ty = G.enemies.py[bestI];
      G.enemies.damageAt(bestI, cfg.damage);
      s.lightningFx.push({ x1: prevX, y1: prevY, x2: tx, y2: ty, color: '#a0e0ff', life: 0.18, max: 0.18, width: 3 });
      prevX = tx; prevY = ty; cx = tx; cy = ty;
    }
    if (visited.size > 0 && G.sfx) G.sfx.play('chain');
  }

  function renderBloodPool(ctx, p) {
    const sc = G.cam.worldToScreen(p.x, p.y);
    const r = p.radius;
    const life = Math.max(0, p.life / p.max);
    // Pulsing alpha at edges
    const baseA = 0.55 * Math.min(1, life * 1.4);
    // Pre-generate splatter pattern once per pool (stable look)
    if (!p._splats) {
      p._splats = [];
      const n = 7;
      for (let i = 0; i < n; i++) {
        p._splats.push({
          ox: (Math.random() - 0.5) * r * 0.95,
          oy: (Math.random() - 0.5) * r * 0.7,
          rad: r * (0.18 + Math.random() * 0.25),
        });
      }
      p._dots = [];
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = r * (0.55 + Math.random() * 0.55);
        p._dots.push({ ox: Math.cos(a) * d, oy: Math.sin(a) * d * 0.7, rad: 1 + Math.random() * 3 });
      }
    }
    // Soft outer pool (dark)
    const og = ctx.createRadialGradient(sc.x, sc.y, r * 0.15, sc.x, sc.y, r);
    og.addColorStop(0,   'rgba(180,20,30,' + (baseA * 0.95).toFixed(2) + ')');
    og.addColorStop(0.55,'rgba(120,12,20,' + (baseA * 0.75).toFixed(2) + ')');
    og.addColorStop(1,   'rgba(40,5,10,0)');
    ctx.fillStyle = og;
    ctx.beginPath(); ctx.ellipse(sc.x, sc.y, r, r * 0.72, 0, 0, Math.PI * 2); ctx.fill();
    // Brighter blob highlights
    for (const sp of p._splats) {
      const grad = ctx.createRadialGradient(sc.x + sp.ox, sc.y + sp.oy, 0, sc.x + sp.ox, sc.y + sp.oy, sp.rad);
      grad.addColorStop(0, 'rgba(220,60,80,' + (baseA * 0.85).toFixed(2) + ')');
      grad.addColorStop(0.7, 'rgba(160,20,40,' + (baseA * 0.45).toFixed(2) + ')');
      grad.addColorStop(1, 'rgba(80,5,15,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.ellipse(sc.x + sp.ox, sc.y + sp.oy, sp.rad, sp.rad * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    }
    // Splatter dots around the edge
    ctx.fillStyle = 'rgba(140,15,25,' + (baseA * 0.85).toFixed(2) + ')';
    for (const d of p._dots) {
      ctx.beginPath(); ctx.arc(sc.x + d.ox, sc.y + d.oy, d.rad, 0, Math.PI * 2); ctx.fill();
    }
    // Glossy center sheen
    const sh = ctx.createRadialGradient(sc.x - r * 0.18, sc.y - r * 0.18, 0, sc.x - r * 0.18, sc.y - r * 0.18, r * 0.45);
    sh.addColorStop(0, 'rgba(255,140,150,' + (baseA * 0.45).toFixed(2) + ')');
    sh.addColorStop(1, 'rgba(255,80,90,0)');
    ctx.fillStyle = sh;
    ctx.beginPath(); ctx.arc(sc.x - r * 0.18, sc.y - r * 0.18, r * 0.45, 0, Math.PI * 2); ctx.fill();
  }

  function renderHomelanders(ctx) {
    const s = G.runState;
    if (!s || !s.homelanders || !s.homelanders.length) return;
    const spr = G.sprites.pickFrame('homelander', 0);
    for (const h of s.homelanders) {
      const sc = G.cam.worldToScreen(h.x, h.y);
      const a = Math.max(0, h.life / h.max);
      // Rotating eye beams
      for (let b = 0; b < h.cfg.beams; b++) {
        const ang = h.angle + (b / h.cfg.beams) * Math.PI * 2;
        const ex = sc.x + Math.cos(ang) * h.cfg.range;
        const ey = sc.y + Math.sin(ang) * h.cfg.range;
        ctx.strokeStyle = 'rgba(255,30,30,' + (0.85 * a).toFixed(2) + ')';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(sc.x, sc.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,220,220,' + (0.85 * a).toFixed(2) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sc.x, sc.y); ctx.lineTo(ex, ey); ctx.stroke();
      }
      // Homelander himself
      if (spr) ctx.drawImage(spr, sc.x - spr.width / 2, sc.y - spr.height / 2);
    }
  }

  function renderSignature(ctx) {
    const s = G.runState;
    if (!s) return;
    // Blood pools — organic procedural splash (multi-blob + splatter dots)
    if (s.bloodPools && s.bloodPools.length) {
      for (const p of s.bloodPools) {
        renderBloodPool(ctx, p);
      }
    }
    // Bone storm rings (also frost nova - uses ring.color)
    if (s.boneRings && s.boneRings.length) {
      for (const ring of s.boneRings) {
        const sc = G.cam.worldToScreen(ring.x, ring.y);
        const fade = 1 - (ring.r / ring.maxR);
        const col = ring.color || '#f4e4c1';
        ctx.strokeStyle = withAlpha(col, 0.4 + 0.5 * fade);
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(sc.x, sc.y, ring.r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = withAlpha(col, 0.6 * fade);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sc.x, sc.y, ring.r + 4, 0, Math.PI * 2); ctx.stroke();
      }
    }
    // Sigils (Witch Sigil skill) - rotating purple pentagram
    if (s.sigils && s.sigils.length) {
      for (const g of s.sigils) {
        const sc = G.cam.worldToScreen(g.x, g.y);
        const lifeFrac = Math.max(0, g.life / g.max);
        ctx.save();
        ctx.translate(sc.x, sc.y);
        ctx.rotate(g.rot);
        // Outer ring
        ctx.strokeStyle = 'rgba(200,80,255,' + (0.55 * lifeFrac).toFixed(2) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, g.radius, 0, Math.PI * 2); ctx.stroke();
        // Inner ring
        ctx.strokeStyle = 'rgba(255,150,255,' + (0.4 * lifeFrac).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(0, 0, g.radius * 0.6, 0, Math.PI * 2); ctx.stroke();
        // Star
        ctx.strokeStyle = 'rgba(220,120,255,' + (0.7 * lifeFrac).toFixed(2) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const r = g.radius * 0.55;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
          const a2 = ((k + 2) % 5 / 5) * Math.PI * 2 - Math.PI / 2;
          if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          ctx.lineTo(Math.cos(a2) * r, Math.sin(a2) * r);
        }
        ctx.closePath(); ctx.stroke();
        // Fill glow
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, g.radius);
        grad.addColorStop(0, 'rgba(200,80,255,' + (0.18 * lifeFrac).toFixed(2) + ')');
        grad.addColorStop(1, 'rgba(80,20,120,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, g.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    // Bombs
    if (s.bombs && s.bombs.length) {
      for (const b of s.bombs) {
        const sc = G.cam.worldToScreen(b.x, b.y);
        const f = b.fuse / b.maxFuse;
        const pulse = 1 + 0.3 * Math.sin((1 - f) * 30);
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(sc.x, sc.y, 9 * pulse, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#5a5a5a';
        ctx.lineWidth = 1.5; ctx.stroke();
        // Fuse spark
        ctx.fillStyle = '#ffcc40';
        ctx.beginPath(); ctx.arc(sc.x + 4, sc.y - 8, 2 + Math.random() * 1.5, 0, Math.PI * 2); ctx.fill();
        // Warning ring as fuse runs out
        if (f < 0.4) {
          ctx.strokeStyle = 'rgba(255,80,30,' + ((0.4 - f) * 2).toFixed(2) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(sc.x, sc.y, b.radius, 0, Math.PI * 2); ctx.stroke();
        }
      }
    }
    // Chain Lightning / Holy Fire bolts
    if (s.lightningFx && s.lightningFx.length) {
      for (const f of s.lightningFx) {
        const a = f.x1 != null ? G.cam.worldToScreen(f.x1, f.y1) : null;
        const b = G.cam.worldToScreen(f.x2, f.y2);
        const alpha = f.life / f.max;
        ctx.strokeStyle = withAlpha(f.color, alpha);
        ctx.lineWidth = f.width || 2;
        ctx.beginPath();
        if (a) {
          // Jagged line for lightning feel
          ctx.moveTo(a.x, a.y);
          const segments = 6;
          for (let s = 1; s < segments; s++) {
            const t = s / segments;
            const x = a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 14;
            const y = a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 14;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();
        // Glow
        ctx.strokeStyle = withAlpha(f.color, alpha * 0.4);
        ctx.lineWidth = (f.width || 2) + 4;
        ctx.stroke();
      }
    }
  }

  function withAlpha(hex, a) {
    // Accept #rrggbb or rgba(...)
    if (hex.startsWith('#')) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(2) + ')';
    }
    return hex;
  }

  function renderActiveFx(ctx) {
    const s = G.runState;
    if (!s) return;
    // Signature AOEs render first (behind player)
    renderSignature(ctx);
    // Homelander laser beams above sprites
    renderHomelanders(ctx);
    // Orbits — each orbit may use its own sprite (bats, swords, etc.)
    if (s.orbits.length) {
      const ang = s._orbitAngle || 0;
      for (const o of s.orbits) {
        const spr = G.sprites.pickFrame(o.spriteKey || 'batPet', ang * 0.8);
        if (!spr) continue;
        for (let k = 0; k < o.count; k++) {
          const a = ang * o.speed + (k * Math.PI * 2) / o.count;
          const ox = s.px + Math.cos(a) * o.radius;
          const oy = s.py + Math.sin(a) * o.radius;
          const sc = G.cam.worldToScreen(ox, oy);
          if (o.big) {
            ctx.fillStyle = 'rgba(196,30,58,0.6)';
            ctx.beginPath(); ctx.arc(sc.x, sc.y, 40, 0, Math.PI * 2); ctx.fill();
          }
          // Swords spin: rotation = orbit angle + tangent offset + extra spin
          if (o.spriteKey === 'sword') {
            ctx.save();
            ctx.translate(sc.x, sc.y);
            // Blade tip points outward along the radius + extra fast spin for "whirling" feel
            ctx.rotate(a + Math.PI / 2 + ang * 6);
            ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
            ctx.restore();
            // Wind streak trail
            ctx.strokeStyle = 'rgba(180,220,240,0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const a2 = a - 0.25;
            const ox2 = s.px + Math.cos(a2) * o.radius;
            const oy2 = s.py + Math.sin(a2) * o.radius;
            const sc2 = G.cam.worldToScreen(ox2, oy2);
            ctx.moveTo(sc.x, sc.y); ctx.lineTo(sc2.x, sc2.y);
            ctx.stroke();
          } else {
            ctx.drawImage(spr, sc.x - spr.width / 2, sc.y - spr.height / 2);
          }
        }
      }
    }
    // Auras
    for (const a of s.auras) {
      const sc = G.cam.worldToScreen(s.px, s.py);
      ctx.strokeStyle = 'rgba(196,30,58,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sc.x, sc.y, a.radius, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(196,30,58,0.06)';
      ctx.beginPath(); ctx.arc(sc.x, sc.y, a.radius, 0, Math.PI * 2); ctx.fill();
    }
    // Whip flash
    if (s._whipFx) {
      s._whipFx.t -= 1 / 60;
      if (s._whipFx.t <= 0) { s._whipFx = null; }
      else {
        const fx = s._whipFx;
        const sc = G.cam.worldToScreen(s.px, s.py);
        ctx.save();
        ctx.translate(sc.x, sc.y);
        ctx.rotate(fx.dir);
        ctx.strokeStyle = 'rgba(196,30,58,' + (fx.t * 4).toFixed(2) + ')';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, fx.range * 0.7, -fx.arc / 2, fx.arc / 2);
        ctx.stroke();
        ctx.restore();
      }
    }
    // Pull effect ring
    if (s.pullEffect) {
      const sc = G.cam.worldToScreen(s.px, s.py);
      ctx.strokeStyle = 'rgba(100,200,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(sc.x, sc.y, s.pullEffect.radius, 0, Math.PI * 2); ctx.stroke();
    }
  }

  G.effects = { recompute, addSkill, removeSkill, getAvailableForLevelUp, updateActive, renderActiveFx, findSkill };
})();
