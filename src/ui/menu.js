// UI root + reusable helpers (banner, tutorial prompts, generic menu builder).
(function () {
  'use strict';

  const root = document.getElementById('ui');

  let bannerEl = null;
  let bannerTimer = 0;

  function showBanner(text, sec) {
    clearBanner();
    bannerEl = document.createElement('div');
    bannerEl.style.position = 'absolute';
    bannerEl.style.top = '90px';
    bannerEl.style.left = '0';
    bannerEl.style.right = '0';
    bannerEl.style.textAlign = 'center';
    bannerEl.style.color = '#c41e3a';
    bannerEl.style.fontSize = '32px';
    bannerEl.style.fontWeight = 'bold';
    bannerEl.style.letterSpacing = '4px';
    bannerEl.style.textTransform = 'uppercase';
    bannerEl.style.textShadow = '0 0 20px #c41e3a, 0 0 40px #c41e3a';
    bannerEl.style.pointerEvents = 'none';
    bannerEl.style.animation = 'pulse 1s ease-in-out infinite';
    bannerEl.textContent = text;
    root.appendChild(bannerEl);
    bannerTimer = sec;
  }

  function tickBanner(dt) {
    if (bannerTimer > 0) {
      bannerTimer -= dt;
      if (bannerTimer <= 0) clearBanner();
    }
  }

  function clearBanner() {
    if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
    bannerEl = null;
    bannerTimer = 0;
  }

  function showWarning(text, sec) {
    clearBanner();
    bannerEl = document.createElement('div');
    bannerEl.style.position = 'absolute';
    bannerEl.style.top = '38%';
    bannerEl.style.left = '0';
    bannerEl.style.right = '0';
    bannerEl.style.textAlign = 'center';
    bannerEl.style.color = '#ff3030';
    bannerEl.style.fontSize = '64px';
    bannerEl.style.fontWeight = '900';
    bannerEl.style.letterSpacing = '10px';
    bannerEl.style.textTransform = 'uppercase';
    bannerEl.style.textShadow = '0 0 30px #ff3030, 0 0 60px #ff0000, 0 0 100px #c41e3a';
    bannerEl.style.pointerEvents = 'none';
    bannerEl.style.animation = 'pulse 0.35s ease-in-out infinite';
    bannerEl.textContent = text;
    root.appendChild(bannerEl);
    bannerTimer = sec;
  }

  function clearOverlays() {
    while (root.firstChild) root.removeChild(root.firstChild);
    bannerEl = null;
    tutEl = null; tutCurText = '';
  }

  // Tutorial prompts (DOM, positioned over canvas, reused each frame)
  let tutEl = null;
  let tutCurText = '';
  function showTut(text, screenX, screenY) {
    if (!tutEl || !tutEl.parentNode) {
      tutEl = document.createElement('div');
      tutEl.className = 'tut-prompt';
      root.appendChild(tutEl);
      tutCurText = '';
    }
    if (text !== tutCurText) { tutEl.textContent = text; tutCurText = text; }
    const rect = G.canvas.getBoundingClientRect();
    const sx = rect.width / G.width;
    const sy = rect.height / G.height;
    tutEl.style.left = (rect.left + screenX * sx) + 'px';
    tutEl.style.top = (rect.top + screenY * sy) + 'px';
  }
  function hideTut() {
    if (tutEl && tutEl.parentNode) tutEl.parentNode.removeChild(tutEl);
    tutEl = null;
    tutCurText = '';
  }

  // === Public ===
  G.ui = {
    root,
    showCards: (...a) => G.uiCards.showCards(...a),
    hideCards: () => G.uiCards.hideCards(),
    showAltar: (...a) => G.uiAltar.showAltar(...a),
    hideAltar: () => G.uiAltar.hideAltar(),
    showBossReward: (...a) => G.uiBossReward.show(...a),
    hideBossReward: () => G.uiBossReward.hide(),
    clearOverlays,
    showTut, hideTut,
  };
  G.banner = { show: showBanner, showWarning, clear: clearBanner, tick: tickBanner };
})();
