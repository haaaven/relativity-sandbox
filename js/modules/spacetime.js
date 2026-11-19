/* Tab 1 - free Minkowski-diagram sandbox (Dragan ch. 1-2). */
(function () {
  'use strict';
  const SR = window.SR, P = SR.phys, ui = SR.ui, C = SR.COLORS;
  const f = ui.fmt;

  SR.modules.push({
    id: 'spacetime', order: 1, title: '1 · Spacetime diagram', tip: 'Free Minkowski diagram: events, frames, intervals (ch. 1-2)',
    init(panel) {
      const L = ui.layout(panel);
      const cv = L.canvas({ flex: '1 1 0' });
      const D = new SR.MinkowskiDiagram(cv);
      D.setBox(-6, 6, -4.5, 6.5);

      const st = {
        V1: 0.6, V2: -0.4, showS2: false, viewV: 0, viewName: 'S', kind: 'lorentz',
        gridS: true, grid1: true, ticks: true, hyper: true, cones: false, sim1: true, proj: true,
        events: [{ name: 'A', t: 1, x: -1 }, { name: 'B', t: 2, x: 3 }, { name: 'C', t: 3.5, x: 0.5 }],
        worlds: [{ name: 'rocket', t0: 0, x0: 2.5, v: -0.5, color: '#8250df' }],
        sel: [0, 1]
      };
      let nextName = 3;
      const names = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const frames = () => {
        const fr = [{ V: 0, name: 'S', prime: '', color: C.S }, { V: st.V1, name: 'S′', prime: '′', color: C.S1 }];
        if (st.showS2) fr.push({ V: st.V2, name: 'S″', prime: '″', color: C.S2 });
        return fr;
      };
      const snap = v => Math.round(v * 20) / 20;

      /* ------------------------------------------------------------ draggables */
      st.events.forEach((_, i) => addEventHandle(i));
      function addEventHandle(i) {
        D.addHandle(
          () => { const e = st.events[i]; return e ? D.pt(e.t, e.x) : null; },
          (X, Y) => { const e = st.events[i]; if (!e) return; const [t, x] = D.toLab(X, Y); e.t = snap(t); e.x = snap(x); refresh(false); },
          { start: () => select(i, true) });
      }
      st.worlds.forEach((_, i) => addWorldHandle(i));
      function addWorldHandle(i) {
        D.addHandle(
          () => { const w = st.worlds[i]; return w ? D.pt(w.t0, w.x0) : null; },
          (X, Y) => { const w = st.worlds[i]; if (!w) return; const [t, x] = D.toLab(X, Y); w.t0 = snap(t); w.x0 = snap(x); refresh(false); },
          { cursor: 'move' });
      }
      function select(i, keepIfSelected) {
        const k = st.sel.indexOf(i);
        if (k >= 0) { if (!keepIfSelected) st.sel.splice(k, 1); }
        else { st.sel.push(i); if (st.sel.length > 2) st.sel.shift(); }
        refresh(true);
      }
      D.onClick = (X, Y, e, item) => { /* selection handled on drag start */ };
      D.onDblClick = (X, Y) => {
        const [t, x] = D.toLab(X, Y);
        addEvent(snap(t), snap(x));
      };
      D.onHover = () => D.requestDraw();
      function addEvent(t, x) {
        const name = names[nextName % 26] + (nextName >= 26 ? Math.floor(nextName / 26) : '');
        nextName++;
        st.events.push({ name, t, x });
        addEventHandle(st.events.length - 1);
        select(st.events.length - 1);
        buildEventTable();
        refresh(true);
      }

      /* --------------------------------------------------------------- render */
      D.onRender = () => {
        D.kind = st.kind;
        const fr = frames();
        if (st.gridS) D.drawFrame(0, { color: C.S, grid: true, axes: false, gridAlpha: 0.10 });
        if (st.grid1) D.drawFrame(st.V1, { color: C.S1, grid: true, axes: false, gridAlpha: 0.16 });
        if (st.hyper) D.drawHyperbolas([1, 2, 3, 4, 5, 6, 8, 10]);
        D.drawLightCone(0, 0, { color: C.light, width: 1.4, dash: [7, 5] });
        fr.forEach(F => D.drawFrame(F.V, { color: F.color, prime: F.prime, ticks: st.ticks, width: F.V === 0 ? 1.4 : 1.8 }));
        // worldlines
        st.worlds.forEach(w => {
          // proper time zero at the anchor event (t0, x0)
          const wl2 = P.uniform(w.x0 - w.v * w.t0, w.v, { tmin: -1e4, tmax: 1e4, tau0: (-1e4 - w.t0) / P.gamma(w.v) });
          D.drawWorldline(wl2, { color: w.color, width: 2.2 });
          if (st.kind === 'lorentz') D.drawTicks(wl2, 1, { color: w.color, labels: true, side: 1 });
          const a = D.pt(w.t0, w.x0);
          D.ctx.fillStyle = w.color; D.ctx.fillRect(D.sx(a[0]) - 4, D.sy(a[1]) - 4, 8, 8);
          D.text(a[0], a[1], w.name + ' (v=' + f(w.v, 2) + ')', { dx: 8, dy: 12, color: w.color, bg: 'rgba(255,255,255,.7)' });
        });
        // light cones at events
        if (st.cones) st.events.forEach(e => D.drawLightCone(e.t, e.x, { color: C.light, width: 1, alpha: 0.55 }));
        // simultaneity lines of S' through events
        if (st.sim1) st.events.forEach(e => D.drawSimLine(e.t, e.x, st.V1, { color: C.S1, width: 1, dash: [5, 4], alpha: 0.8 }));
        // projections of first selected event onto S' (and S) axes
        if (st.proj && st.sel.length) {
          const e = st.events[st.sel[st.sel.length - 1]];
          if (e) projections(e);
        }
        // events
        st.events.forEach((e, i) => D.drawEvent(e.t, e.x, { label: e.name, selected: st.sel.includes(i) }));
        orderBadge();
        D.drawCursorInfo(fr);
      };
      function projections(e) {
        for (const F of frames()) {
          if (F.V === st.viewV && F.name !== 'S′') continue;
          const A = D.frameToView(F.V);
          const q = D.inFrame(F.V, e.t, e.x);     // [t', x']
          const p = D.pt(e.t, e.x);
          const onT = [A[1][0] * q[0], A[0][0] * q[0]], onX = [A[1][1] * q[1], A[0][1] * q[1]];
          const style = { color: F.color, width: 1.2, dash: [2, 3], alpha: 0.95 };
          D.line(p[0], p[1], onT[0], onT[1], style);  // parallel to x'-axis -> reads t'
          D.line(p[0], p[1], onX[0], onX[1], style);  // parallel to t'-axis -> reads x'
          D.dot(onT[0], onT[1], 3, F.color); D.dot(onX[0], onX[1], 3, F.color);
          D.text(onT[0], onT[1], D.tName + F.prime + '=' + f(q[0], 2), { dx: -6, dy: -8, align: 'right', color: F.color, bg: 'rgba(255,255,255,.8)', font: '11px system-ui' });
          D.text(onX[0], onX[1], D.xName + F.prime + '=' + f(q[1], 2), { dx: 4, dy: 10, color: F.color, bg: 'rgba(255,255,255,.8)', font: '11px system-ui' });
        }
      }
      function orderBadge() {
        if (st.sel.length < 2) return;
        const a = st.events[st.sel[0]], b = st.events[st.sel[1]];
        if (!a || !b) return;
        const lines = frames().map(F => {
          const qa = D.inFrame(F.V, a.t, a.x), qb = D.inFrame(F.V, b.t, b.x), dt = qb[0] - qa[0];
          const ord = Math.abs(dt) < 1e-9 ? 'simultaneous' : (dt > 0 ? a.name + ' first' : b.name + ' first');
          return 'in ' + F.name + ': ' + ord + '  (Δ' + D.tName + F.prime + ' = ' + f(dt, 2) + ')';
        });
        D.stext(8, 6, lines.join('\n'), { bg: 'rgba(255,255,255,.9)', color: '#333' });
      }

      /* ------------------------------------------------------------- side panel */
      const s1 = ui.section(L.side, 'Frames');
      ui.note(s1, 'Lab frame <b>S</b> (black) and <b>S′</b> moving with velocity V along x (blue). Origins coincide. <span class="kbd">drag</span> events / background, <span class="kbd">wheel</span> zoom, <span class="kbd">double-click</span> adds an event.', 'small');
      const sV1 = ui.slider(s1, { label: 'S′ velocity V', min: -0.99, max: 0.99, step: 0.01, value: st.V1, onInput: v => { st.V1 = v; if (st.viewName === 'S′') st.viewV = v; refresh(true); } });
      const cS2 = ui.checkbox(s1, { label: 'show a third frame S″ (green)', value: st.showS2, onChange: v => { st.showS2 = v; refresh(true); } });
      const sV2 = ui.slider(s1, { label: 'S″ velocity', min: -0.99, max: 0.99, step: 0.01, value: st.V2, onInput: v => { st.V2 = v; if (st.viewName === 'S″') st.viewV = v; refresh(true); } });
      let cancelTween = null;
      const viewSeg = ui.segmented(s1, {
        label: 'Draw everything as seen from:', value: 'S',
        options: [{ value: 'S', label: 'S' }, { value: 'S′', label: 'S′' }, { value: 'S″', label: 'S″' }],
        onChange: v => {
          st.viewName = v;
          const target = v === 'S' ? 0 : v === 'S′' ? st.V1 : st.V2;
          if (v === 'S″' && !st.showS2) { st.showS2 = true; cS2.set(true); }
          if (cancelTween) cancelTween();
          cancelTween = ui.tweenVelocity(st.viewV, target, 700, w => { st.viewV = w; D.viewV = w; refresh(false); });
        }
      });
      const roFrames = ui.readout(s1);

      const s2 = ui.section(L.side, 'Transformation law (compare!)');
      ui.segmented(s2, {
        value: 'lorentz',
        options: [{ value: 'lorentz', label: 'Lorentz' }, { value: 'galilean', label: 'Galilean' }, { value: 'euclid', label: 'Euclidean rotation' }],
        onChange: v => { st.kind = v; refresh(true); }
      });
      const lawNote = ui.note(s2, '', 'small');

      const s3 = ui.section(L.side, 'Display');
      const grid = ui.el('div', { class: 'chkgrid' }); s3.append(grid);
      [['gridS', 'S grid'], ['grid1', 'S′ grid'], ['ticks', 'axis ticks'], ['hyper', 'invariant hyperbolas'],
        ['cones', 'light cones at events'], ['sim1', 'S′ simultaneity lines'], ['proj', 'projections of selected']].forEach(([k, lab]) =>
        ui.checkbox(grid, { label: lab, value: st[k], onChange: v => { st[k] = v; refresh(false); } }));

      const s4 = ui.section(L.side, 'Events');
      ui.note(s4, 'Edit lab coordinates directly. Click a name to select (two selected = pair analysis).', 'small');
      const evTable = ui.el('table', { class: 'grid' }); s4.append(evTable);
      ui.buttons(s4, [
        { label: '+ event', onClick: () => { const c = D.toLab((D.bounds().xmin + D.bounds().xmax) / 2, (D.bounds().ymin + D.bounds().ymax) / 2); addEvent(snap(c[0]), snap(c[1])); } },
        { label: 'delete selected', onClick: () => { const del = st.sel.slice().sort((a, b) => b - a); del.forEach(i => st.events[i] = null); st.events = st.events.filter(Boolean); rebuildHandles(); st.sel = []; buildEventTable(); refresh(true); } },
        { label: 'reset view', onClick: () => { D.setBox(-6, 6, -4.5, 6.5); } }
      ]);

      const s5 = ui.section(L.side, 'Pair analysis (two selected events)');
      const roPair = ui.readout(s5);
      const pairBtns = ui.buttons(s5, [
        { id: 'go', label: 'set S′ to the special frame', onClick: () => { if (special !== null) { st.V1 = special; sV1.set(special); refresh(true); } } }
      ]);
      let special = null;

      const s6 = ui.section(L.side, 'Worldlines (with proper-time ticks)');
      const wlBox = ui.el('div'); s6.append(wlBox);
      ui.buttons(s6, [
        { label: '+ worldline through selected event', onClick: () => {
          const e = st.events[st.sel[st.sel.length - 1]] || { t: 0, x: 0 };
          st.worlds.push({ name: 'w' + (st.worlds.length + 1), t0: e.t, x0: e.x, v: 0.3, color: ['#8250df', '#bf3989', '#0a7a7a', '#9a6700'][st.worlds.length % 4] });
          addWorldHandle(st.worlds.length - 1); buildWorlds(); refresh(true);
        } },
        { label: 'remove last', onClick: () => { st.worlds.pop(); rebuildHandles(); buildWorlds(); refresh(true); } }
      ]);

      const s7 = ui.section(L.side, 'Things to try (predict before opening)');
      [
        ['Switch the view to S′. Which way do the axes of S now lean, and why?',
          'S moves with −V relative to S′, so its axes close up toward the light cone on the <i>other</i> side. Nothing is special about S: switching view is just a hyperbolic rotation of the whole picture (Dragan 1.2).'],
        ['A and B start spacelike. Find the S′ velocity for which they are simultaneous. What happens beyond it?',
          'V = cΔt/Δx (here (2−1)/(3−(−1)) = 0.25). Beyond it the order flips: B happens before A. The pair analysis button sets that frame for you. A pair that is timelike can never be flipped (eq. 1.13).'],
        ['Why are the ticks on the tilted S′ axes further apart on the screen?',
          'The paper is Euclidean, spacetime is not. One unit of S′ time lies on the hyperbola c²t² − x² = 1, which is further out along a tilted axis. Turn on the hyperbolas: each tick sits exactly on one.'],
        ['Drag event C into the future light cone of A. Can any frame (|V| < 1) make C happen before A?',
          'No. Δt′ = γ(Δt − VΔx) keeps the sign of Δt when |Δx| < c|Δt|. Causal order is absolute; only spacelike pairs have frame-dependent order.'],
        ['Switch the law to Galilean, then Euclidean. What happens to the light cone and the hyperbolas?',
          'Galilean: the x′ axis does not tilt (absolute simultaneity), but the light cone is sheared, so the speed of light would depend on the frame. Euclidean rotation: x′ tilts the wrong way, the light cone rotates, the hyperbolas are not preserved (circles would be). Only the Lorentz pseudo-rotation keeps the light cone fixed (Dragan 1.1).'],
        ['The rocket moves with v = −0.5. Compare its one-unit ticks with the S time grid.',
          'Between consecutive ticks S measures γ = 1.155 units of time: time dilation. In the rocket frame the S clocks are the slow ones. Both are true because they compare different pairs of events (via different simultaneity lines).']
      ].forEach(q => ui.reveal(s7, q[0], q[1]));

      /* -------------------------------------------------------------- updates */
      function rebuildHandles() {
        D.draggables = [];
        st.events.forEach((_, i) => addEventHandle(i));
        st.worlds.forEach((_, i) => addWorldHandle(i));
      }
      function buildEventTable() {
        const fr = frames();
        evTable.innerHTML = '';
        const head = ui.el('tr');
        head.append(ui.el('th', { text: '' }), ui.el('th', { text: D.tName }), ui.el('th', { text: 'x' }));
        fr.slice(1).forEach(F => head.append(ui.el('th', { text: D.tName + F.prime }), ui.el('th', { text: 'x' + F.prime })));
        evTable.append(head);
        st.events.forEach((e, i) => {
          const tr = ui.el('tr');
          const nm = ui.el('td', { html: '<a class="tablink">' + e.name + '</a>' });
          nm.addEventListener('click', () => select(i));
          const mk = key => {
            const inp = ui.el('input', { type: 'number', step: 0.05, value: e[key] });
            inp.addEventListener('change', () => { const v = +inp.value; if (!Number.isNaN(v)) { e[key] = v; refresh(false); } });
            inp.dataset.key = key;
            return ui.el('td', {}, inp);
          };
          tr.append(nm, mk('t'), mk('x'));
          fr.slice(1).forEach(() => tr.append(ui.el('td', { class: 'tp' }), ui.el('td', { class: 'xp' })));
          evTable.append(tr);
        });
        updateEventTable();
      }
      function updateEventTable() {
        const fr = frames().slice(1);
        const rows = evTable.querySelectorAll('tr');
        st.events.forEach((e, i) => {
          const tr = rows[i + 1];
          if (!tr) return;
          tr.classList.toggle('selected', st.sel.includes(i));
          tr.querySelectorAll('input').forEach(inp => { if (document.activeElement !== inp) inp.value = (+e[inp.dataset.key]).toFixed(2); });
          const tds = tr.querySelectorAll('td');
          fr.forEach((F, k) => {
            const q = D.inFrame(F.V, e.t, e.x);
            if (tds[3 + 2 * k]) tds[3 + 2 * k].textContent = f(q[0], 2);
            if (tds[4 + 2 * k]) tds[4 + 2 * k].textContent = f(q[1], 2);
          });
        });
      }
      function buildWorlds() {
        wlBox.innerHTML = '';
        st.worlds.forEach((w, i) => {
          ui.slider(wlBox, { label: '<span style="color:' + w.color + '">■</span> ' + w.name + ' velocity', min: -0.99, max: 0.99, step: 0.01, value: w.v, onInput: v => { w.v = v; refresh(false); } });
        });
        if (!st.worlds.length) ui.note(wlBox, 'none', 'small');
      }
      function updateFrames() {
        const g = P.gamma(st.V1), phi = P.rapidity(st.V1);
        const rows = [
          ['γ(V) = 1/√(1−V²)', f(g, 4)],
          ['rapidity φ = artanh V', f(phi, 4)],
          ['axis tilt α, tan α = V', ui.deg(Math.atan(st.V1))]
        ];
        if (st.showS2) {
          const rel = P.transformVelocity(st.V2, st.V1);
          rows.push(['S″ seen from S′: (V″−V′)/(1−V″V′)', f(rel, 4)]);
          rows.push(['rapidities: φ″ − φ′', f(P.rapidity(st.V2) - P.rapidity(st.V1), 4) + ' = artanh(' + f(rel, 3) + ')']);
        }
        rows.push(['currently drawn from', st.viewName + ' (V = ' + f(st.viewV, 3) + ')']);
        roFrames.set(rows);
        const M = P.frameMatrix(st.V1, st.kind), dt = M[0][0] + M[0][1], dx = M[1][0] + M[1][1];
        const cS1 = dx / dt;
        const msg = {
          lorentz: 'Lorentz: c²t² − x² is the same in every frame. The light cone stays put; frames scissor symmetrically about it.',
          galilean: 'Galilean: t′ = t, x′ = x − Vt. Simultaneity is absolute (x′ axis = x axis), but the light cone is sheared.',
          euclid: 'Euclidean rotation by α = arctan V: t² + x² would be invariant, x′ tilts the "wrong" way, and the light cone rotates.'
        }[st.kind];
        lawNote.innerHTML = msg + '<br>A light ray with x = ct moves in S′ with speed <b>' + f(cS1, 3) + ' c</b>' + (Math.abs(cS1 - 1) < 1e-9 ? ' ✓' : ' ✗');
      }
      function updatePair() {
        special = null;
        if (st.sel.length < 2 || !st.events[st.sel[0]] || !st.events[st.sel[1]]) {
          roPair.set([['select two events', '(click their names or drag them)']]);
          pairBtns.style.display = 'none';
          return;
        }
        const a = st.events[st.sel[0]], b = st.events[st.sel[1]];
        const pa = P.pairAnalysis(a, b);
        const rows = ['Δ from ' + a.name + ' to ' + b.name];
        frames().forEach(F => {
          const qa = D.inFrame(F.V, a.t, a.x), qb = D.inFrame(F.V, b.t, b.x);
          const dt = qb[0] - qa[0], dx = qb[1] - qa[1];
          const inv = st.kind === 'euclid' ? dt * dt + dx * dx : dt * dt - dx * dx;
          rows.push(['in ' + F.name + ': (Δ' + D.tName + F.prime + ', Δx' + F.prime + ')', '(' + f(dt, 3) + ', ' + f(dx, 3) + ')']);
          rows.push(['&nbsp;&nbsp;Δ' + D.tName + '² − Δx²' + (st.kind === 'euclid' ? ' | Euclid Δt²+Δx²' : ''), f(dt * dt - dx * dx, 4) + (st.kind === 'euclid' ? ' | ' + f(inv, 4) : '')]);
        });
        rows.push(null);
        const cls = { timelike: 'good', spacelike: 'bad', null: 'hl' }[pa.type];
        rows.push(['interval type (Lorentz)', pa.type, cls]);
        if (pa.type === 'timelike') {
          rows.push(['proper time √(s²)', f(pa.tau, 4)]);
          rows.push(['frame where both happen at the same place', 'V = Δx/Δt = ' + f(pa.Vsame, 4)]);
          rows.push(['order', 'same in every frame (causal)']);
          special = pa.Vsame;
        } else if (pa.type === 'spacelike') {
          rows.push(['proper distance √(−s²)', f(pa.sigma, 4)]);
          rows.push(['frame where they are simultaneous', 'V = cΔt/Δx = ' + f(pa.Vsim, 4)]);
          rows.push(['order', 'frame dependent: reversed for V beyond ' + f(pa.Vsim, 3)]);
          special = pa.Vsim;
        } else {
          rows.push(['light-like', 'every observer agrees on the order; Δct′ = ±Δx′']);
        }
        roPair.set(rows);
        pairBtns.style.display = special !== null ? '' : 'none';
        if (special !== null) pairBtns.byId.go.textContent = 'set S′ to V = ' + f(special, 4) + (pa.type === 'timelike' ? ' (same place)' : ' (simultaneous)');
      }
      function refresh(structural) {
        D.viewV = st.viewV;
        D.kind = st.kind;
        if (structural) buildEventTable(); else updateEventTable();
        updateFrames(); updatePair();
        D.requestDraw();
      }
      buildWorlds();
      buildEventTable();
      refresh(true);
      this._refresh = () => refresh(true);
      /* load events / frame velocity from another tab (e.g. the drill's "show in sandbox") */
      this._load = arg => {
        if (arg.events) {
          st.events = arg.events.map(e => ({ name: e.name, t: e.t, x: e.x }));
          nextName = st.events.length;
          st.sel = st.events.length >= 2 ? [0, 1] : [0];
          rebuildHandles();
        }
        if (arg.V !== undefined) { st.V1 = arg.V; sV1.set(arg.V); }
        const ext = Math.max(4, ...st.events.map(e => Math.max(Math.abs(e.t), Math.abs(e.x)))) + 1.5;
        D.setBox(-ext, ext, -ext * 0.6, ext);
        refresh(true);
      };
    },
    show(arg) { if (arg && this._load) this._load(arg); else if (this._refresh) this._refresh(); }
  });
})();
