// Boot — runs last. Wires scene router, starts loop.
(function () {
  'use strict';

  G.sprites.build();
  G.enemies.buildTypeTable();

  // Start music on first user interaction (browser autoplay rules).
  function kickAudio() {
    if (G.sfx) G.sfx.unlock();
    if (G.music) G.music.start();
    window.removeEventListener('click', kickAudio);
    window.removeEventListener('keydown', kickAudio);
  }
  window.addEventListener('click', kickAudio);
  window.addEventListener('keydown', kickAudio);

  function setScene(name) {
    G.scene = name;
    G.ui.clearOverlays();
    if (name === 'menu') G.sceneMenu.build();
    else if (name === 'heroSelect') G.sceneHeroSelect.build();
    else if (name === 'gameover') G.sceneGameOver.build();
    // 'run' scene has no DOM overlay
  }

  G.startRun = function (heroId) {
    G.sceneRun.enter(heroId);
    G.scene = 'run';
    G.nextScene = null;
  };

  G.gameOver = function () {
    G.nextScene = 'gameover';
  };

  setScene('menu');

  G.loop.start(
    function update(dt) {
      try {
        if (G.nextScene && G.nextScene !== G.scene) {
          const ns = G.nextScene; G.nextScene = null;
          setScene(ns);
        }
        if (G.scene === 'run') {
          G.sceneRun.update(dt);
        } else {
          G.input.endFrame();
        }
      } catch (e) {
        console.error('[update error]', e);
      }
    },
    function render(alpha) {
      const ctx = G.ctx;
      try {
        if (G.scene === 'run') {
          G.sceneRun.render(ctx);
        } else {
          ctx.clearRect(0, 0, G.width, G.height);
          G.cam.updateShake(1 / 60);
        }
      } catch (e) {
        console.error('[render error]', e);
        // Visible recovery indicator
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, G.width, G.height);
        ctx.fillStyle = '#ff5050';
        ctx.font = 'bold 24px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('Render error — see console (F12)', G.width / 2, G.height / 2);
      }
    }
  );

  console.log('Pact of the Damned — running');
})();
