/* ui.js - tiny DOM helpers (sliders, readouts, reveal boxes, number formatting). */
(function () {
  'use strict';
  const SR = window.SR = window.SR || {};
  SR.modules = SR.modules || [];
  const ui = SR.ui = {};

  ui.el = function (tag, attrs) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v === undefined || v === null) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    for (let i = 2; i < arguments.length; i++) {
      const kids = [].concat(arguments[i]);
      for (const kid of kids) if (kid !== null && kid !== undefined) e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return e;
  };

  /* --------------------------------------------------------------- numbers */
  ui.fmt = function (x, d) {
    if (d === undefined) d = 3;
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (x === Infinity) return '∞';
    if (x === -Infinity) return '−∞';
    if (Math.abs(x) < 1e-12) x = 0;              // hide floating-point noise
    const ax = Math.abs(x);
    let s;
    if (ax !== 0 && (ax >= 1e6 || ax < Math.pow(10, -d))) s = x.toExponential(Math.max(1, d - 1)).replace('e', '·10^').replace('^+', '^');
    else s = x.toFixed(d);
    if (/^-0\.?0*$/.test(s)) s = s.slice(1);
    return s.replace(/^-/, '−');
  };
  ui.fmtv = (v, d) => '(' + v.slice(0, 2).map(c => ui.fmt(c, d === undefined ? 3 : d)).join(', ') + ')';
  ui.deg = r => ui.fmt(r * 180 / Math.PI, 2) + '°';

  /* ----------------------------------------------------------------- layout */
  ui.layout = function (panel) {
    const main = ui.el('div', { class: 'main' }), side = ui.el('div', { class: 'side' });
    panel.append(main, side);
    const api = {
      main, side,
      /** add a canvas inside a sized wrapper. opts: {height, flex, parent, title} */
      canvas(opts) {
        opts = opts || {};
        const style = {};
        if (opts.height) { style.flex = '0 0 ' + opts.height + 'px'; style.height = opts.height + 'px'; }
        else if (opts.flex) style.flex = opts.flex;
        const wrap = ui.el('div', { class: 'cv', style });
        const c = ui.el('canvas');
        wrap.append(c);
        if (opts.title) wrap.append(ui.el('div', { class: 'cv-title', html: opts.title }));
        (opts.parent || main).append(wrap);
        c.wrap = wrap;
        return c;
      },
      row(opts) {
        const r = ui.el('div', { class: 'row', style: opts && opts.flex ? { flex: opts.flex } : (opts && opts.height ? { flex: '0 0 ' + opts.height + 'px' } : {}) });
        main.append(r);
        return r;
      }
    };
    return api;
  };
  ui.section = (parent, title, open) => {
    const s = ui.el('div', { class: 'sec' });
    if (title) s.append(ui.el('h3', { html: title }));
    parent.append(s);
    return s;
  };

  /* --------------------------------------------------------------- controls */
  ui.slider = function (parent, o) {
    const step = o.step || 0.001;
    const row = ui.el('div', { class: 'ctrl', title: o.title || '' });
    const lab = ui.el('label', { html: o.label });
    const rng = ui.el('input', { type: 'range', min: o.min, max: o.max, step });
    const num = ui.el('input', { type: 'number', min: o.min, max: o.max, step });
    row.append(lab, rng, num);
    parent.append(row);
    let value = o.value;
    const digits = o.digits !== undefined ? o.digits : Math.max(0, Math.min(4, Math.round(-Math.log10(step))));
    const show = () => { rng.value = value; if (document.activeElement !== num) num.value = (+value).toFixed(digits); };
    show();
    const api = {
      el: row,
      get: () => value,
      set(v, fire) { value = v; show(); if (fire && o.onInput) o.onInput(value); },
      setLabel(h) { lab.innerHTML = h; },
      setRange(min, max) { rng.min = num.min = min; rng.max = num.max = max; show(); }
    };
    rng.addEventListener('input', () => { value = +rng.value; num.value = value.toFixed(digits); o.onInput && o.onInput(value); });
    num.addEventListener('change', () => {
      let v = +num.value; if (Number.isNaN(v)) return;
      const lo = +rng.min, hi = +rng.max;
      if (!o.unclamped) v = Math.max(lo, Math.min(hi, v));
      value = v; rng.value = v; num.value = v.toFixed(digits);
      o.onInput && o.onInput(value);
    });
    return api;
  };
  ui.checkbox = function (parent, o) {
    const inp = ui.el('input', { type: 'checkbox' });
    inp.checked = !!o.value;
    const lab = ui.el('label', { class: 'chk', title: o.title || '' }, inp, ui.el('span', { html: o.label }));
    parent.append(lab);
    inp.addEventListener('change', () => o.onChange && o.onChange(inp.checked));
    return { el: lab, get: () => inp.checked, set(v) { inp.checked = !!v; } };
  };
  ui.select = function (parent, o) {
    const sel = ui.el('select');
    for (const op of o.options) {
      const opt = ui.el('option', { value: op.value, text: op.label });
      sel.append(opt);
    }
    sel.value = o.value;
    const row = ui.el('div', { class: 'sel' }, ui.el('label', { html: o.label || '' }), sel);
    parent.append(row);
    sel.addEventListener('change', () => o.onChange && o.onChange(sel.value));
    return { el: row, get: () => sel.value, set(v) { sel.value = v; } };
  };
  ui.buttons = function (parent, list) {
    const r = ui.el('div', { class: 'btns' });
    const out = {};
    for (const b of list) {
      const btn = ui.el('button', { html: b.label, title: b.title || '', class: b.primary ? 'primary' : '' });
      btn.addEventListener('click', b.onClick);
      r.append(btn);
      if (b.id) out[b.id] = btn;
    }
    parent.append(r);
    r.byId = out;
    return r;
  };
  /** segmented single choice */
  ui.segmented = function (parent, o) {
    const wrap = ui.el('div');
    if (o.label) wrap.append(ui.el('div', { class: 'seglabel', html: o.label }));
    const r = ui.el('div', { class: 'seg' });
    wrap.append(r);
    parent.append(wrap);
    let value = o.value;
    const btns = o.options.map(op => {
      const b = ui.el('button', { html: op.label, title: op.title || '' });
      b.addEventListener('click', () => { api.set(op.value); o.onChange && o.onChange(op.value); });
      r.append(b);
      return [op.value, b];
    });
    const api = {
      el: wrap, get: () => value,
      set(v) { value = v; btns.forEach(([val, b]) => b.classList.toggle('on', val === v)); }
    };
    api.set(value);
    return api;
  };
  ui.readout = function (parent) {
    const tbl = ui.el('table', { class: 'ro' });
    parent.append(tbl);
    return {
      el: tbl,
      set(rows) {
        tbl.innerHTML = rows.filter(r => r !== false && r !== undefined).map(r => {
          if (r === null) return '<tr><td colspan="2" style="border:0;height:4px"></td></tr>';
          if (typeof r === 'string') return `<tr class="head"><td colspan="2">${r}</td></tr>`;
          return `<tr class="${r[2] || ''}"><td>${r[0]}</td><td>${r[1]}</td></tr>`;
        }).join('');
      }
    };
  };
  ui.note = (parent, html, cls) => { const n = ui.el('div', { class: 'note ' + (cls || ''), html }); parent.append(n); return n; };
  ui.reveal = (parent, q, a) => {
    const d = ui.el('details', { class: 'reveal' });
    d.append(ui.el('summary', { html: q }), ui.el('div', { class: 'ans', html: a }));
    parent.append(d);
    return d;
  };
  ui.questions = (parent, list, title) => {
    if (!list || !list.length) return;
    const s = ui.section(parent, title || 'Predict first, then reveal');
    list.forEach(q => ui.reveal(s, q[0], q[1]));
    return s;
  };
  ui.legend = (parent, items) => {
    const l = ui.el('div', { class: 'legend' });
    for (const it of items) {
      const s = ui.el('span', { html: it.label });
      s.style.setProperty('--c', it.color);
      s.style.setProperty('--d', it.dash ? 'dashed' : 'solid');
      l.append(s);
    }
    parent.append(l);
    return l;
  };

  /* ------------------------------------------------------------- animation */
  /** smooth tween; returns a cancel function */
  ui.tween = function (from, to, ms, fn, done) {
    const t0 = performance.now();
    let alive = true;
    const step = now => {
      if (!alive) return;
      const s = Math.min(1, (now - t0) / ms), e = s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2;
      fn(from + (to - from) * e);
      if (s < 1) requestAnimationFrame(step); else if (done) done();
    };
    requestAnimationFrame(step);
    return () => { alive = false; };
  };
  /** tween a frame velocity through rapidity space (looks like a uniform hyperbolic rotation) */
  ui.tweenVelocity = function (from, to, ms, fn, done) {
    const a = Math.atanh(Math.max(-0.9999, Math.min(0.9999, from))), b = Math.atanh(Math.max(-0.9999, Math.min(0.9999, to)));
    return ui.tween(a, b, ms, phi => fn(Math.tanh(phi)), done);
  };
  /** play/pause driver: calls fn(dtSeconds) each frame while running */
  ui.player = function (fn) {
    let running = false, last = 0;
    const loop = now => {
      if (!running) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (fn(dt) === false) { running = false; api.onStop && api.onStop(); return; }
      requestAnimationFrame(loop);
    };
    const api = {
      get running() { return running; },
      start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(loop); },
      stop() { running = false; },
      toggle() { running ? api.stop() : api.start(); return running; }
    };
    return api;
  };
})();
