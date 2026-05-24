// Fixed-timestep game loop with accumulator. Render interpolated via rAF.
(function () {
  'use strict';

  const STEP = 1 / 60; // logical frame in seconds
  const MAX_STEPS_PER_FRAME = 5;

  let last = 0;
  let accumulator = 0;
  let running = false;
  let updateFn = null;
  let renderFn = null;
  let fps = 60;
  let fpsAcc = 0, fpsCount = 0, fpsTimer = 0;

  function start(update, render) {
    updateFn = update; renderFn = render;
    last = performance.now();
    running = true;
    requestAnimationFrame(tick);
  }
  function stop() { running = false; }

  function tick(t) {
    if (!running) return;
    const dt = Math.min(0.1, (t - last) / 1000);
    last = t;
    accumulator += dt;
    let steps = 0;
    while (accumulator >= STEP && steps < MAX_STEPS_PER_FRAME) {
      if (updateFn) updateFn(STEP);
      accumulator -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS_PER_FRAME) accumulator = 0; // discard overflow
    if (renderFn) renderFn(accumulator / STEP);

    // FPS counter
    fpsTimer += dt;
    fpsAcc += dt; fpsCount++;
    if (fpsTimer >= 0.5) {
      fps = Math.round(fpsCount / fpsAcc);
      fpsTimer = 0; fpsAcc = 0; fpsCount = 0;
    }

    requestAnimationFrame(tick);
  }

  G.loop = {
    start, stop, STEP,
    get fps() { return fps; },
  };
})();
