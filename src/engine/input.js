// Keyboard + mouse input. WASD movement, hotkeys 1-4 for ally commands, ESC pause.
(function () {
  'use strict';

  const keys = Object.create(null);
  const justPressed = Object.create(null);
  const mouse = { x: 0, y: 0, down: false, justClicked: false };

  // Physical key → canonical name. Lets WASD/digits/escape work on any keyboard
  // layout (Russian, Kazakh, etc.) because e.code is layout-independent.
  const codeToKey = {
    KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd',
    KeyQ: 'q', KeyE: 'e', KeyR: 'r', KeyF: 'f',
    ArrowUp: 'arrowup', ArrowDown: 'arrowdown', ArrowLeft: 'arrowleft', ArrowRight: 'arrowright',
    Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4',
    Numpad1: '1', Numpad2: '2', Numpad3: '3', Numpad4: '4',
    Escape: 'escape', Space: ' ', Enter: 'enter', Tab: 'tab',
  };

  function keyDown(e) {
    const fromKey = (e.key || '').toLowerCase();
    const fromCode = codeToKey[e.code];
    // Record both (so existing checks like `keys['w']` and any e.key checks both work)
    for (const k of [fromKey, fromCode]) {
      if (!k) continue;
      if (!keys[k]) justPressed[k] = true;
      keys[k] = true;
    }
    // Prevent default for movement keys + space, regardless of layout
    const blockedCodes = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'];
    if (blockedCodes.includes(e.code) ||
        [' ','arrowup','arrowdown','arrowleft','arrowright'].includes(fromKey)) {
      e.preventDefault();
    }
  }
  function keyUp(e) {
    const fromKey = (e.key || '').toLowerCase();
    const fromCode = codeToKey[e.code];
    if (fromKey) keys[fromKey] = false;
    if (fromCode) keys[fromCode] = false;
  }
  function mouseMove(e) {
    if (!G.canvas) return;
    const rect = G.canvas.getBoundingClientRect();
    const sx = G.canvas.width / rect.width;
    const sy = G.canvas.height / rect.height;
    mouse.x = (e.clientX - rect.left) * sx;
    mouse.y = (e.clientY - rect.top) * sy;
  }
  function mouseDown() { if (!mouse.down) mouse.justClicked = true; mouse.down = true; }
  function mouseUp() { mouse.down = false; }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('mousemove', mouseMove);
  window.addEventListener('mousedown', mouseDown);
  window.addEventListener('mouseup', mouseUp);

  function moveVec() {
    let x = 0, y = 0;
    if (keys['w'] || keys['arrowup']) y -= 1;
    if (keys['s'] || keys['arrowdown']) y += 1;
    if (keys['a'] || keys['arrowleft']) x -= 1;
    if (keys['d'] || keys['arrowright']) x += 1;
    if (x && y) { const inv = 0.70710678; x *= inv; y *= inv; }
    return { x, y };
  }

  function consumeJustPressed(key) {
    if (justPressed[key]) { justPressed[key] = false; return true; }
    return false;
  }

  function endFrame() {
    // Clear all justPressed flags
    for (const k in justPressed) justPressed[k] = false;
    mouse.justClicked = false;
  }

  G.input = {
    keys, mouse,
    moveVec, consumeJustPressed, endFrame,
    isDown: (k) => !!keys[k.toLowerCase()],
  };
})();
