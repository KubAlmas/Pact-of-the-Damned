// Canvas setup, layered drawing, screen shake, world->screen transform.
(function () {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: true });

  G.canvas = canvas;
  G.ctx = ctx;
  G.width = canvas.width;
  G.height = canvas.height;

  // Camera follows the player, centered.
  const camera = { x: 0, y: 0, shakeAmt: 0, shakeTime: 0, shakeOx: 0, shakeOy: 0 };

  function follow(x, y) { camera.x = x; camera.y = y; }
  function shake(amt, time) {
    if (G.meta && G.meta.settings && !G.meta.settings.shake) return;
    camera.shakeAmt = Math.max(camera.shakeAmt, amt);
    camera.shakeTime = Math.max(camera.shakeTime, time);
  }
  function updateShake(dt) {
    if (camera.shakeTime > 0) {
      camera.shakeTime -= dt;
      const a = camera.shakeAmt * Math.max(0, camera.shakeTime);
      camera.shakeOx = (Math.random() - 0.5) * a * 2;
      camera.shakeOy = (Math.random() - 0.5) * a * 2;
      if (camera.shakeTime <= 0) { camera.shakeOx = camera.shakeOy = 0; camera.shakeAmt = 0; }
    } else {
      camera.shakeOx = camera.shakeOy = 0;
    }
  }

  function worldToScreen(wx, wy) {
    return { x: wx - camera.x + G.width / 2 + camera.shakeOx, y: wy - camera.y + G.height / 2 + camera.shakeOy };
  }

  function screenToWorld(sx, sy) {
    return { x: sx + camera.x - G.width / 2 - camera.shakeOx, y: sy + camera.y - G.height / 2 - camera.shakeOy };
  }

  // Transparent floor — only clears the canvas so the gothic page background shows through.
  function drawFloor() {
    ctx.clearRect(0, 0, G.width, G.height);
  }

  G.camera = camera;
  G.cam = { follow, shake, updateShake, worldToScreen, screenToWorld, drawFloor };
})();
