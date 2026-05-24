// Run scene: the actual gameplay. Drives all systems each frame.
(function () {
  'use strict';

  function enter(heroId) {
    G.ui.clearOverlays();
    G.runState = G.state.makeRunState(heroId);
    G.enemies.reset();
    G.projectiles.reset();
    G.enemyProjectiles.reset();
    G.xp.reset();
    G.particles.reset();
    G.damageNumbers.reset();
    G.spawner.reset();
    G.pact.reset();
    G.boss.reset();
    G.enemies.buildTypeTable();

    // Apply starting skills
    for (const id of G.runState.hero.startingSkills || []) {
      G.effects.addSkill(id);
    }
    if (G.runState.hero.startingAlly) {
      G.ally.spawn();
    }
    G.effects.recompute();

    // Tutorial prompts only first run
    if (!G.meta.tutorialSeen) {
      G.runState.tutPhase = 0;
      G.runState.tutTimer = 0;
    } else {
      G.runState.tutPhase = 3;
    }
  }

  function update(dt) {
    const s = G.runState;
    if (!s) return;

    // ESC toggles pause overlay with Main Menu option
    if (G.input.consumeJustPressed('escape')) {
      if (s.paused && s.pauseReason === 'menu') {
        s.paused = false; s.pauseReason = null; G.ui.clearOverlays();
      } else if (!s.paused) {
        s.paused = true; s.pauseReason = 'menu'; showPauseMenu();
      }
    }

    if (!s.paused) {
      s.runTime += dt;
      G.player.update(dt);
      G.enemies.update(dt);
      G.ally.update(dt);
      G.projectiles.update(dt);
      G.enemyProjectiles.update(dt);
      G.xp.update(dt);
      G.effects.updateActive(dt);
      G.spawner.update(dt);
      G.pact.tick(dt);
      G.boss.update(dt);

      // Trigger queued level-ups (only after physics)
      if (s.pendingLevelups > 0 && !s.paused) {
        G.levelup.trigger();
      }

      // Tutorial logic
      tickTutorial(dt);
    }

    // Camera follow + shake update regardless of pause
    G.cam.follow(s.px, s.py);
    G.cam.updateShake(dt);

    // Particles + damage numbers
    G.particles.update(dt);
    G.damageNumbers.update(dt);
    G.banner.tick(dt);

    G.input.endFrame();
  }

  function tickTutorial(dt) {
    const s = G.runState;
    if (s.tutPhase >= 3) return;
    s.tutTimer += dt;
    if (s.tutPhase === 0) {
      const sc = G.cam.worldToScreen(s.px, s.py);
      G.ui.showTut('WASD', sc.x, sc.y - 30);
      if (Math.abs(s.vx) + Math.abs(s.vy) > 10) s.tutPhase = 1;
      if (s.tutTimer > 6) s.tutPhase = 1;
    } else if (s.tutPhase === 1) {
      G.ui.showTut('COLLECT THE GEMS', G.width / 2, G.height - 100);
      if (s.kills >= 3) s.tutPhase = 2;
      if (s.tutTimer > 12) s.tutPhase = 2;
    } else if (s.tutPhase === 2) {
      G.ui.showTut('LEVEL UP TO CHOOSE A POWER', G.width / 2, G.height - 100);
      if (s.level >= 2) {
        s.tutPhase = 3;
        G.ui.hideTut();
        G.meta.tutorialSeen = true;
        G.storage.save(G.meta);
      }
      if (s.tutTimer > 30) {
        s.tutPhase = 3; G.ui.hideTut();
        G.meta.tutorialSeen = true; G.storage.save(G.meta);
      }
    }
  }

  function render(ctx) {
    // Floor
    G.cam.drawFloor();
    // World order
    G.xp.render(ctx);
    G.effects.renderActiveFx(ctx);
    G.enemies.render(ctx);
    G.projectiles.render(ctx);
    G.enemyProjectiles.render(ctx);
    // Boss laser beams render over bullets (very prominent telegraph + active)
    if (G.boss && G.boss.renderBeams) G.boss.renderBeams(ctx);
    G.ally.render(ctx);
    G.player.render(ctx);
    G.particles.render(ctx);
    G.damageNumbers.render(ctx);
    // HUD
    G.hud.render(ctx);
    // Off-screen boss arrow indicator
    if (G.boss && G.boss.renderIndicator) G.boss.renderIndicator(ctx);

    // In-canvas pause indicator (DOM overlay can be missed/dismissed)
    const sr = G.runState;
    if (sr && sr.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, G.width, G.height);
      ctx.fillStyle = '#f4e4c1';
      ctx.font = 'bold 72px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', G.width / 2, G.height / 2 - 12);
      ctx.font = '18px Georgia';
      ctx.fillStyle = '#c9b896';
      const hint = sr.pauseReason === 'menu' ? 'ESC to resume — or click a button above'
                 : sr.pauseReason === 'levelup' ? 'choose a power above'
                 : sr.pauseReason === 'altar' ? 'choose a Pact above'
                 : sr.pauseReason === 'bossReward' ? 'claim your spoils above'
                 : 'click an option above';
      ctx.fillText(hint, G.width / 2, G.height / 2 + 36);
    }
  }

  function showPauseMenu() {
    G.ui.clearOverlays();
    const o = document.createElement('div');
    o.className = 'overlay';
    o.style.zIndex = '30';

    const title = document.createElement('div');
    title.className = 'title-big';
    title.style.fontSize = '64px';
    title.textContent = 'Paused';
    o.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'title-sub';
    sub.textContent = 'the hunt waits';
    o.appendChild(sub);

    const row = document.createElement('div');
    row.className = 'btn-row';

    const resume = mkBtn('Resume', 'btn btn-primary', () => {
      const s = G.runState;
      s.paused = false; s.pauseReason = null;
      G.ui.clearOverlays();
    });
    const restart = mkBtn('Restart', 'btn', () => {
      const s = G.runState;
      const heroId = s.heroId;
      G.ui.clearOverlays();
      G.startRun(heroId);
    });
    const menu = mkBtn('Main Menu', 'btn', () => {
      // Save stats as if run ended (no death — just abandon)
      const s = G.runState;
      if (s) {
        G.storage.recordRun({
          timeSec: Math.floor(s.runTime),
          level: s.level,
          kills: s.kills,
          pactCounts: s.pactCounts,
        });
      }
      G.runState = null;
      G.ui.clearOverlays();
      G.nextScene = 'menu';
    });
    row.appendChild(resume); row.appendChild(restart); row.appendChild(menu);
    o.appendChild(row);

    const hint = document.createElement('div');
    hint.className = 'hud-bottom';
    hint.textContent = 'press ESC to resume';
    o.appendChild(hint);

    G.ui.root.appendChild(o);
  }

  function mkBtn(label, cls, fn) {
    const b = document.createElement('button');
    b.className = cls; b.textContent = label;
    b.addEventListener('click', () => {
      if (G.sfx) G.sfx.play('button_click');
      fn();
    });
    return b;
  }

  G.sceneRun = { enter, update, render };
})();
