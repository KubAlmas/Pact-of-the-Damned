// Ally vampire system. 4 commands on hotkeys 1-4: Follow / Hunt / Guard / Sacrifice.
(function () {
  'use strict';

  // Commands
  const FOLLOW = 'follow';
  const HUNT = 'hunt';
  const GUARD = 'guard';
  const SACRIFICE = 'sacrifice';

  function makeAlly(x, y) {
    return {
      x, y, vx: 0, vy: 0,
      hp: 80, maxHp: 80,
      damage: 15,
      attackCd: 0,
      command: FOLLOW,
      guardX: 0, guardY: 0,
      sacrificing: false, sacTargetX: 0, sacTargetY: 0,
      flash: 0,
      iframes: 0,
      animTime: Math.random(),
      alive: true,
    };
  }

  function spawn() {
    const s = G.runState;
    if (!s) return;
    const a = makeAlly(s.px + 40, s.py);
    s.allies.push(a);
    G.particles.burst(a.x, a.y, { count: 30, color: '#a070c0', size: 5, speed: 220, life: 0.8 });
    G.cam.shake(6, 0.3);
    return a;
  }

  function commandAll(cmd) {
    const s = G.runState;
    if (!s) return;
    let any = false;
    for (const a of s.allies) {
      if (!a.alive) continue;
      if (cmd === SACRIFICE) {
        a.command = SACRIFICE;
        a.sacrificing = true;
        // Target = nearest enemy to player, fallback to facing
        let bestI = -1, bestD = Infinity;
        for (let i = 0; i < G.enemies.count; i++) {
          if (!G.enemies.alive[i]) continue;
          const dx = G.enemies.px[i] - s.px, dy = G.enemies.py[i] - s.py;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; bestI = i; }
        }
        if (bestI >= 0) {
          a.sacTargetX = G.enemies.px[bestI];
          a.sacTargetY = G.enemies.py[bestI];
        } else {
          a.sacTargetX = s.px + Math.cos(s.facing) * 200;
          a.sacTargetY = s.py + Math.sin(s.facing) * 200;
        }
      } else if (cmd === GUARD) {
        a.command = GUARD;
        a.guardX = a.x; a.guardY = a.y;
      } else {
        a.command = cmd;
      }
      any = true;
    }
    if (any) {
      G.particles.burst(s.px, s.py, { count: 8, color: '#ffd060', size: 3, speed: 100, life: 0.4 });
      if (G.sfx) G.sfx.play(cmd === 'sacrifice' ? 'sacrifice' : 'ally_command');
    }
  }

  function update(dt) {
    const s = G.runState;
    if (!s) return;

    // Hotkeys 1-4
    if (G.input.consumeJustPressed('1')) commandAll(FOLLOW);
    if (G.input.consumeJustPressed('2')) commandAll(HUNT);
    if (G.input.consumeJustPressed('3')) commandAll(GUARD);
    if (G.input.consumeJustPressed('4')) commandAll(SACRIFICE);

    for (let ai = s.allies.length - 1; ai >= 0; ai--) {
      const a = s.allies[ai];
      if (!a.alive) { s.allies.splice(ai, 1); continue; }
      if (a.flash > 0) a.flash -= dt;
      if (a.iframes > 0) a.iframes -= dt;
      a.attackCd -= dt;

      let tx = a.x, ty = a.y;
      const speed = 230;

      // Choose target/destination based on command
      if (a.command === FOLLOW) {
        const dx = s.px - a.x, dy = s.py - a.y;
        const d = Math.hypot(dx, dy);
        if (d > 50) { tx = s.px; ty = s.py; }
        else { tx = a.x; ty = a.y; }
      } else if (a.command === HUNT) {
        // Nearest enemy
        let bestI = -1, bestD = Infinity;
        for (let i = 0; i < G.enemies.count; i++) {
          if (!G.enemies.alive[i]) continue;
          const dx = G.enemies.px[i] - a.x, dy = G.enemies.py[i] - a.y;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; bestI = i; }
        }
        if (bestI >= 0) { tx = G.enemies.px[bestI]; ty = G.enemies.py[bestI]; }
        else { tx = s.px; ty = s.py; }
      } else if (a.command === GUARD) {
        tx = a.guardX; ty = a.guardY;
      } else if (a.command === SACRIFICE) {
        tx = a.sacTargetX; ty = a.sacTargetY;
        // Explode on arrival or when close to any enemy
        const dx = tx - a.x, dy = ty - a.y;
        if (Math.hypot(dx, dy) < 30) {
          G.enemies.damageInRadius(a.x, a.y, 300, 120);
          G.particles.burst(a.x, a.y, { count: 60, color: '#c41e3a', size: 6, speed: 400, life: 0.9 });
          G.cam.shake(14, 0.35);
          a.alive = false;
          continue;
        }
      }

      // Steering toward target
      const dx = tx - a.x, dy = ty - a.y;
      const d = Math.hypot(dx, dy);
      if (d > 4) {
        a.vx = (dx / d) * speed;
        a.vy = (dy / d) * speed;
      } else {
        a.vx *= 0.6; a.vy *= 0.6;
      }
      // Soft separation from other allies
      for (const o of s.allies) {
        if (o === a || !o.alive) continue;
        const ox = a.x - o.x, oy = a.y - o.y;
        const od = Math.hypot(ox, oy);
        if (od > 0 && od < 30) {
          a.vx += (ox / od) * 60;
          a.vy += (oy / od) * 60;
        }
      }
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.animTime += dt;

      // Melee attack: damage closest enemy in radius if cd ready
      if (a.attackCd <= 0) {
        let bestI = -1, bestD = Infinity;
        G.spatial.query(a.x, a.y, 36, (i) => {
          if (!G.enemies.alive[i]) return;
          const dx = G.enemies.px[i] - a.x, dy = G.enemies.py[i] - a.y;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; bestI = i; }
        });
        if (bestI >= 0) {
          G.enemies.damageAt(bestI, a.damage);
          a.attackCd = 0.6;
          G.particles.burst(G.enemies.px[bestI], G.enemies.py[bestI],
            { count: 4, color: '#a070c0', size: 3, speed: 130, life: 0.3 });
        }
      }

      // Enemies hurt the ally if they touch
      G.spatial.query(a.x, a.y, 20, (i) => {
        if (!G.enemies.alive[i] || a.iframes > 0) return;
        const dx = G.enemies.px[i] - a.x, dy = G.enemies.py[i] - a.y;
        if (dx * dx + dy * dy < 20 * 20) {
          a.hp -= G.enemies.typeArr[G.enemies.type[i]].def.damage * 0.3;
          a.iframes = 0.4;
          a.flash = 0.1;
          if (a.hp <= 0) {
            G.particles.burst(a.x, a.y, { count: 30, color: '#a070c0', size: 4, speed: 220, life: 0.7 });
            a.alive = false;
          }
        }
      });
    }
  }

  function render(ctx) {
    const s = G.runState;
    if (!s) return;
    for (const a of s.allies) {
      if (!a.alive) continue;
      const spr = G.sprites.pickFrame('ally', a.animTime);
      const sc = G.cam.worldToScreen(a.x, a.y);
      if (a.flash > 0) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.globalCompositeOperation = 'screen';
        if (spr) ctx.drawImage(spr, sc.x - spr.width / 2, sc.y - spr.height / 2);
        ctx.restore();
      }
      if (spr) ctx.drawImage(spr, sc.x - spr.width / 2, sc.y - spr.height / 2);
      // Sacrifice mode aura
      if (a.command === SACRIFICE) {
        ctx.strokeStyle = 'rgba(255,200,0,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sc.x, sc.y, 22, 0, Math.PI * 2); ctx.stroke();
      }
      // Tiny HP bar
      const w = 28;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(sc.x - w / 2, sc.y - 22, w, 3);
      ctx.fillStyle = '#a070c0';
      ctx.fillRect(sc.x - w / 2, sc.y - 22, w * Math.max(0, a.hp / a.maxHp), 3);
      // Command icon (small letter)
      ctx.fillStyle = '#ffd060';
      ctx.font = 'bold 10px Georgia';
      ctx.textAlign = 'center';
      const letters = { follow: 'F', hunt: 'H', guard: 'G', sacrifice: 'S' };
      ctx.fillText(letters[a.command] || '?', sc.x, sc.y - 26);
    }
  }

  G.ally = { spawn, update, render, commandAll, COMMANDS: { FOLLOW, HUNT, GUARD, SACRIFICE } };
})();
