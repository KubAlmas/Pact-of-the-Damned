// Main menu scene: title, lore, [BEGIN] [SETTINGS] [STATS].
(function () {
  'use strict';

  function build() {
    G.ui.clearOverlays();
    const o = document.createElement('div');
    o.className = 'overlay';
    o.style.background = 'radial-gradient(ellipse at center, #1a0606 0%, #050000 70%, #000 100%)';

    const title = document.createElement('div');
    title.className = 'title-big';
    title.textContent = 'Pact of the Damned';
    o.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'title-sub';
    sub.textContent = 'a vampire survival';
    o.appendChild(sub);

    const lore = document.createElement('div');
    lore.className = 'lore';
    lore.innerHTML = `
      The night you cursed yourself, the dead remembered your name.<br/>
      They come in hordes now — clawing, biting, endless.<br/>
      At the heart of every storm waits an Altar. Kneel, and bargain.<br/>
      Trade your gifts for one great power, or call a brother to your side.<br/>
      <span style="color:#c41e3a">How much of you will be left at sunrise?</span>
    `;
    o.appendChild(lore);

    const row = document.createElement('div');
    row.className = 'btn-row';
    const begin = mkBtn('Begin the Hunt', 'btn btn-primary', () => G.startRun('hero'));
    const talents = mkBtn('Talents', 'btn', showTalents);
    const settings = mkBtn('Settings', 'btn', showSettings);
    const stats = mkBtn('Stats', 'btn', showStats);
    row.appendChild(begin); row.appendChild(talents); row.appendChild(settings); row.appendChild(stats);
    o.appendChild(row);

    const hint = document.createElement('div');
    hint.className = 'hud-bottom';
    hint.textContent = 'WASD to move • Auto attack • 1-4 ally commands • ESC pause';
    o.appendChild(hint);

    G.ui.root.appendChild(o);
  }

  function mkBtn(label, cls, onClick) {
    const b = document.createElement('button');
    b.className = cls;
    b.textContent = label;
    b.addEventListener('click', () => {
      if (G.sfx) G.sfx.play('button_click');
      onClick();
    });
    return b;
  }

  function go(scene) { G.nextScene = scene; }

  function showSettings() {
    G.ui.clearOverlays();
    const o = document.createElement('div');
    o.className = 'overlay';
    const t = document.createElement('div');
    t.className = 'title-big'; t.style.fontSize = '52px'; t.textContent = 'Settings';
    o.appendChild(t);

    const sfx = mkRange('SFX volume', G.meta.settings.sfxVol, (v) => {
      G.meta.settings.sfxVol = v; G.storage.save(G.meta);
      if (G.sfx) G.sfx.syncVolume();
    });
    const mus = mkRange('Music volume', G.meta.settings.musicVol, (v) => {
      G.meta.settings.musicVol = v; G.storage.save(G.meta);
      if (G.music) G.music.syncVolume();
    });
    const musOn = mkCheck('Music on', G.meta.settings.musicEnabled !== false, (v) => {
      G.meta.settings.musicEnabled = v;
      G.storage.save(G.meta);
      if (G.music) {
        G.music.syncVolume();           // mutes when off
        if (v) G.music.start();         // restart scheduling if previously stopped
      }
    });
    const shk = mkCheck('Screen shake', G.meta.settings.shake, (v) => { G.meta.settings.shake = v; G.storage.save(G.meta); });
    o.appendChild(sfx); o.appendChild(mus); o.appendChild(musOn); o.appendChild(shk);
    o.appendChild(mkBtn('Back', 'btn', build));
    G.ui.root.appendChild(o);
  }

  function showTalents() {
    G.ui.clearOverlays();
    const o = document.createElement('div');
    o.className = 'overlay';

    const t = document.createElement('div');
    t.className = 'title-big'; t.style.fontSize = '52px'; t.textContent = 'Talents';
    o.appendChild(t);

    const souls = document.createElement('div');
    souls.className = 'souls-banner';
    souls.textContent = '\u{1F480} ' + (G.meta.souls || 0) + ' SOULS';
    o.appendChild(souls);

    const wrap = document.createElement('div');
    wrap.className = 'talents-wrap';
    for (const sk of G.data.skills) {
      wrap.appendChild(makeTalentNode(sk, souls));
    }
    o.appendChild(wrap);

    const btnRow = document.createElement('div');
    btnRow.className = 'btn-row';
    btnRow.appendChild(mkBtn('Reset (refund all)', 'btn', () => {
      const refund = G.storage.resetTalents();
      if (G.sfx) G.sfx.play('pact_greed');
      showTalents();
    }));
    btnRow.appendChild(mkBtn('Back', 'btn', build));
    o.appendChild(btnRow);

    G.ui.root.appendChild(o);
  }

  function makeTalentNode(sk, soulsEl) {
    const node = document.createElement('div');
    node.className = 'talent-node';
    const lv = G.storage.talentLevel(sk.id);
    if (lv >= 5) node.classList.add('maxed');

    const icon = document.createElement('div'); icon.className = 'icon'; icon.textContent = sk.icon || '?';
    const name = document.createElement('div'); name.className = 'name'; name.textContent = sk.name;
    const pips = document.createElement('div'); pips.className = 'pips';
    for (let i = 0; i < 5; i++) {
      const p = document.createElement('div'); p.className = 'pip' + (i < lv ? ' on' : '');
      pips.appendChild(p);
    }
    const cost = document.createElement('div'); cost.className = 'cost';
    if (lv >= 5) cost.textContent = 'MAX';
    else {
      const c = G.storage.talentCost(lv);
      cost.textContent = c + ' souls';
      if ((G.meta.souls || 0) < c) node.classList.add('cant-afford');
    }
    node.appendChild(icon); node.appendChild(name); node.appendChild(pips); node.appendChild(cost);

    node.addEventListener('click', () => {
      if (G.storage.upgradeTalent(sk.id)) {
        if (G.sfx) G.sfx.play('level_up');
        // Re-render talents panel to reflect updated state
        showTalents();
      } else {
        if (G.sfx) G.sfx.play('pact_skip');
      }
    });
    return node;
  }

  function showStats() {
    G.ui.clearOverlays();
    const o = document.createElement('div');
    o.className = 'overlay';
    const t = document.createElement('div');
    t.className = 'title-big'; t.style.fontSize = '52px'; t.textContent = 'Stats';
    o.appendChild(t);

    const list = document.createElement('div');
    list.className = 'stats-list';
    const m = G.meta.stats;
    const fav = G.meta.stats.favoritePact ? ('Pact of ' + cap(G.meta.stats.favoritePact)) : 'none yet';
    const rows = [
      ['Runs', m.runs],
      ['Total Kills', m.totalKills],
      ['Best Time', formatTime(m.bestTimeSec)],
      ['Highest Level', m.bestLevel],
      ['Favorite Pact', fav],
      ['Soul Shards', G.meta.souls || 0],
    ];
    for (const [k, v] of rows) {
      const r = document.createElement('div'); r.className = 'row';
      const kEl = document.createElement('span'); kEl.textContent = k;
      const vEl = document.createElement('span'); vEl.className = 'v'; vEl.textContent = v;
      r.appendChild(kEl); r.appendChild(vEl);
      list.appendChild(r);
    }
    o.appendChild(list);
    o.appendChild(mkBtn('Back', 'btn', build));
    G.ui.root.appendChild(o);
  }

  function formatTime(s) {
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return m + 'm ' + ss + 's';
  }
  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

  function mkRange(label, val, onChange) {
    const row = document.createElement('div'); row.className = 'settings-row';
    const lbl = document.createElement('label'); lbl.textContent = label;
    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = 0; inp.max = 1; inp.step = 0.05; inp.value = val;
    inp.addEventListener('input', (e) => onChange(parseFloat(e.target.value)));
    row.appendChild(lbl); row.appendChild(inp);
    return row;
  }
  function mkCheck(label, val, onChange) {
    const row = document.createElement('div'); row.className = 'settings-row';
    const lbl = document.createElement('label'); lbl.textContent = label;
    const inp = document.createElement('input');
    inp.type = 'checkbox'; inp.checked = val;
    inp.addEventListener('change', (e) => onChange(e.target.checked));
    row.appendChild(lbl); row.appendChild(inp);
    return row;
  }

  G.sceneMenu = { build };
})();
