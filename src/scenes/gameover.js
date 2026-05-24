// Game-over scene. Stats + Play Again / Different Hero / Main Menu.
(function () {
  'use strict';

  function build() {
    G.ui.clearOverlays();
    const s = G.runState;

    // Persist meta stats
    G.storage.recordRun({
      timeSec: s ? Math.floor(s.runTime) : 0,
      level: s ? s.level : 1,
      kills: s ? s.kills : 0,
      pactCounts: s ? s.pactCounts : {},
    });

    const o = document.createElement('div');
    o.className = 'overlay';

    const t = document.createElement('div');
    t.className = 'title-big';
    t.style.color = '#c41e3a';
    t.textContent = 'You Have Fallen';
    o.appendChild(t);

    const sub = document.createElement('div');
    sub.className = 'title-sub';
    sub.textContent = 'the night took you';
    o.appendChild(sub);

    if (s) {
      const list = document.createElement('div');
      list.className = 'stats-list';
      const rows = [
        ['Survived', formatTime(Math.floor(s.runTime))],
        ['Level Reached', s.level],
        ['Kills', s.kills],
        ['Bosses Slain', s.bossesSpawned > 0 ? (s.bossesSpawned - (G.enemies.aliveCount() > 0 ? 1 : 0)) : 0],
        ['Pacts Made', s.pactCounts.power + s.pactCounts.brotherhood + s.pactCounts.greed + s.pactCounts.flesh],
      ];
      for (const [k, v] of rows) {
        const r = document.createElement('div'); r.className = 'row';
        const ks = document.createElement('span'); ks.textContent = k;
        const vs = document.createElement('span'); vs.className = 'v'; vs.textContent = v;
        r.appendChild(ks); r.appendChild(vs);
        list.appendChild(r);
      }
      o.appendChild(list);
    }

    const row = document.createElement('div');
    row.className = 'btn-row';
    row.appendChild(mkBtn('Play Again', 'btn btn-primary', () => {
      G.startRun(s ? s.heroId : 'hero');
    }));
    row.appendChild(mkBtn('Main Menu', 'btn', () => G.nextScene = 'menu'));
    o.appendChild(row);

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
  function formatTime(s) {
    const m = Math.floor(s / 60), ss = s % 60;
    return m + 'm ' + ss + 's';
  }

  G.sceneGameOver = { build };
})();
