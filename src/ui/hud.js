// HUD drawn directly on canvas. HP bar, XP bar, level, time, kills, FPS, ally commands, altar countdown.
(function () {
  'use strict';

  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function render(ctx) {
    const s = G.runState;
    if (!s) return;

    // === Top-left: HP and XP ===
    ctx.save();
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // HP bar
    const hpw = 280, hph = 22;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(16, 16, hpw, hph);
    ctx.fillStyle = '#3a0a0a';
    ctx.fillRect(18, 18, hpw - 4, hph - 4);
    const hpr = Math.max(0, s.hp / s.maxHp);
    const hpg = ctx.createLinearGradient(0, 0, hpw, 0);
    hpg.addColorStop(0, '#c41e3a'); hpg.addColorStop(1, '#ff5070');
    ctx.fillStyle = hpg;
    ctx.fillRect(18, 18, (hpw - 4) * hpr, hph - 4);
    ctx.fillStyle = '#f4e4c1';
    ctx.fillText(Math.ceil(s.hp) + ' / ' + s.maxHp, 24, 21);

    // XP bar (thin, below HP)
    const xpw = 280, xph = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(16, 42, xpw, xph);
    const xpr = Math.min(1, s.xp / s.xpToNext);
    const xpg = ctx.createLinearGradient(0, 0, xpw, 0);
    xpg.addColorStop(0, '#d4af37'); xpg.addColorStop(1, '#fff080');
    ctx.fillStyle = xpg;
    ctx.fillRect(17, 43, (xpw - 2) * xpr, xph - 2);

    // Level
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 16px Georgia';
    ctx.fillText('LV ' + s.level, 16, 56);

    // === Top-center: Time + altar countdown ===
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px Georgia';
    ctx.fillStyle = '#f4e4c1';
    ctx.fillText(fmtTime(s.runTime), G.width / 2, 14);

    ctx.font = '12px Georgia';
    ctx.fillStyle = '#c41e3a';
    const next = Math.max(0, Math.ceil(s.altarTimer));
    ctx.fillText('NEXT ALTAR IN ' + next + 's', G.width / 2, 48);

    // === Top-right: Kills, FPS ===
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px Georgia';
    ctx.fillStyle = '#b8a886';
    ctx.fillText('KILLS  ' + s.kills, G.width - 16, 16);
    ctx.fillText('ENEMIES  ' + G.enemies.aliveCount(), G.width - 16, 36);
    ctx.fillStyle = G.loop.fps < 45 ? '#ff8080' : '#80b080';
    ctx.fillText('FPS ' + G.loop.fps, G.width - 16, 56);

    // === Bottom: Ally commands + skill list ===
    // Ally commands
    if (s.allies.length > 0) {
      ctx.textAlign = 'left';
      ctx.font = 'bold 14px Georgia';
      ctx.fillStyle = '#a070c0';
      ctx.fillText('[1] FOLLOW   [2] HUNT   [3] GUARD   [4] SACRIFICE', 16, G.height - 60);
      ctx.fillStyle = '#b8a886';
      ctx.font = '12px Georgia';
      const counts = { follow: 0, hunt: 0, guard: 0, sacrifice: 0 };
      for (const a of s.allies) if (a.alive) counts[a.command]++;
      ctx.fillText('Allies: ' + s.allies.filter(a => a.alive).length + '  (' +
        'F:' + counts.follow + ' H:' + counts.hunt + ' G:' + counts.guard + ' S:' + counts.sacrifice + ')', 16, G.height - 40);
    }

    // Skill icons + signature (bottom-right, compact 2-column for many skills)
    ctx.textAlign = 'right';
    ctx.font = '11px Georgia';
    const lineH = 15;
    let col = 0, row = 0;
    if (s.sigCfg) {
      ctx.fillStyle = '#d4af37';
      ctx.fillText('★ ' + s.sigCfg.name, G.width - 16, G.height - 24);
      row = 1;
    }
    ctx.fillStyle = '#b8a886';
    const ids = Object.keys(s.skills);
    for (const id of ids) {
      const sk = G.effects.findSkill(id);
      if (!sk) continue;
      const x = G.width - 16 - col * 160;
      const y = G.height - 24 - row * lineH;
      ctx.fillText((sk.icon || '?') + ' ' + sk.name + ' L' + s.skills[id], x, y);
      row++;
      if (row >= 10) { row = 1; col++; if (col > 2) break; }
    }

    ctx.restore();
  }

  G.hud = { render };
})();
