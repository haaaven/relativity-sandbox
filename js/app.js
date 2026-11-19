/* app.js - builds the tab bar, lazily initialises modules, runs the physics self-tests. */
(function () {
  'use strict';
  const SR = window.SR;

  function start() {
    const tabs = document.getElementById('tabs'), main = document.getElementById('main');
    const header = document.querySelector('header');
    const fixHeader = () => document.documentElement.style.setProperty('--header-h', header.getBoundingClientRect().height + 'px');
    new ResizeObserver(fixHeader).observe(header);
    fixHeader();

    const mods = SR.modules.slice().sort((a, b) => a.order - b.order);
    const entries = {};
    for (const m of mods) {
      const btn = SR.ui.el('button', { text: m.title, title: m.tip || '' });
      btn.addEventListener('click', () => go(m.id));
      const panel = SR.ui.el('div', { class: 'panel' + (m.doc ? ' doc' : ''), id: 'panel-' + m.id });
      tabs.append(btn); main.append(panel);
      entries[m.id] = { m, btn, panel, inited: false };
    }
    let current = null;
    function go(id, arg) {
      const e = entries[id] || entries[mods[0].id];
      if (current && current !== e && current.m.hide) current.m.hide();
      for (const k in entries) {
        entries[k].btn.classList.toggle('active', entries[k] === e);
        entries[k].panel.classList.toggle('active', entries[k] === e);
      }
      if (!e.inited) {
        e.inited = true;
        try { e.m.init(e.panel); }
        catch (err) { console.error(err); e.panel.innerHTML = '<pre class="err">' + (err.stack || err) + '</pre>'; }
      }
      current = e;
      try { if (e.m.show) e.m.show(arg); } catch (err) { console.error(err); }
      if (location.hash.slice(1) !== e.m.id) history.replaceState(null, '', '#' + e.m.id);
      try { localStorage.setItem('sr-tab', e.m.id); } catch (_) { /* file:// may block storage */ }
    }
    SR.app = { go };
    window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (entries[id] && current !== entries[id]) go(id); });

    let initial = (location.hash || '').slice(1);
    if (!entries[initial]) { try { initial = localStorage.getItem('sr-tab'); } catch (_) { initial = null; } }
    go(entries[initial] ? initial : mods[0].id);

    // physics self-tests
    const badge = document.getElementById('tests-badge');
    setTimeout(() => {
      try {
        const res = SR.runTests(), ok = res.filter(r => r.ok).length;
        badge.textContent = (ok === res.length ? '✓ ' : '✗ ') + ok + '/' + res.length + ' physics self-tests';
        badge.classList.toggle('bad', ok !== res.length);
        badge.title = res.filter(r => !r.ok).map(r => 'FAILED: ' + r.name).join('\n') || 'All checks of the physics core passed. Click for details.';
      } catch (err) { badge.textContent = 'self-tests crashed'; badge.classList.add('bad'); console.error(err); }
    }, 50);
  }
  document.addEventListener('DOMContentLoaded', start);
})();
