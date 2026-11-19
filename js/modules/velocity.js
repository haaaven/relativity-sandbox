/* Tab 4 - velocities: transformation (2.10, 2.14), superluminal waves, rapidity chains, Fizeau drag (6.2). */
(function () {
  'use strict';
  const SR = window.SR, P = SR.phys, ui = SR.ui, C = SR.COLORS, f = ui.fmt;

  SR.modules.push({
    id: 'velocity', order: 4, title: '4 · Velocities', tip: 'Velocity transformation, superluminal waves, rapidity, aberration, Fizeau (1.3, 2.10, 3.1, 6.2)',
    init(panel) {
      const L = ui.layout(panel);
      const r1 = L.row(), r2 = L.row();
      const c1 = L.canvas({ parent: r1, title: 'Velocity of an object/wave as seen by an observer moving with V (Fig. 2.10 / 2.12)' });
      const c2 = L.canvas({ parent: r1, title: 'Velocity space (2D): circle = c. Drag the black arrow tip.' });
      const c3 = L.canvas({ parent: r2, title: 'n boosts in a row, each β relative to the previous one' });
      const c4 = L.canvas({ parent: r2, title: 'Light in moving water: u(V), eq. (6.2)' });
      const st = { v: 0.5, V: 0.3, u: [0.6, 0.45, 0], Vx: 0.6, beta: 0.5, n: 10, idx: 1.33, Vw: 0.3, showPhotons: true };

      /* ------------------------------------------- plot 1: v'(V) */
      const p1 = new SR.Plot(c1, { xlabel: 'observer velocity V', ylabel: "v' measured by the observer" });
      p1.pannable = p1.zoomable = false;
      p1.setBox(-1, 1, -4, 4);
      p1.margin.t = 40;
      p1.onRender = () => {
        p1.axes();
        p1.clipped(() => {
          p1.hline(1, { color: C.light, dash: [5, 4] }, 'c'); p1.hline(-1, { color: C.light, dash: [5, 4] }, '−c');
          p1.fn(V => st.v - V, { color: '#8c959f', dash: [6, 4], width: 1.5 });
          p1.fn(V => P.transformVelocity(st.v, V), { color: '#cf222e', width: 2.4 }, -0.999, 0.999, 1200);
          if (Math.abs(st.v) > 1) p1.vline(1 / st.v, { color: '#8250df', dash: [3, 3] }, 'V = c²/v: all at once');
          if (Math.abs(st.v) < 1) p1.vline(st.v, { color: '#1a7f37', dash: [3, 3] }, 'V = v: object at rest');
          const vp = P.transformVelocity(st.v, st.V);
          p1.vline(st.V, { color: '#1f6feb' });
          if (isFinite(vp) && Math.abs(vp) < 50) p1.dot(st.V, vp, 5, '#1f6feb');
        });
        const c = p1.ctx; c.font = '11.5px system-ui'; c.textAlign = 'right'; c.textBaseline = 'top';
        c.fillStyle = '#cf222e'; c.fillText('relativistic (v − V)/(1 − vV/c²)', p1.W - 16, p1.margin.t + 4);
        c.fillStyle = '#6e7781'; c.fillText('Galilean v − V', p1.W - 16, p1.margin.t + 19);
      };

      /* ------------------------------------------- plot 2: velocity space */
      const v2 = new SR.View2D(c2, { lockAspect: true });
      v2.pannable = false; v2.zoomable = true;
      v2.setBox(-1.6, 1.6, -1.25, 1.35);
      v2.addHandle(() => [st.u[0], st.u[1]], (x, y) => { const n = Math.hypot(x, y); const s = n > 2 ? 2 / n : 1; st.u = [x * s, y * s, 0]; upd(); });
      v2.onRender = () => {
        const g = v2;
        // circles
        const circ = (r, st2) => { const pts = []; for (let i = 0; i <= 120; i++) { const a = 2 * Math.PI * i / 120; pts.push([r * Math.cos(a), r * Math.sin(a)]); } g.poly(pts, st2); };
        g.line(-2, 0, 2, 0, { color: '#d0d7de' }); g.line(0, -2, 0, 2, { color: '#d0d7de' });
        circ(1, { color: C.light, width: 2 });
        [0.25, 0.5, 0.75].forEach(r => circ(r, { color: '#eceff3' }));
        g.text(0.72, 0.72, '|v| = c', { color: '#b07600' });
        // photons: directions in S and their transformed directions in S'
        if (st.showPhotons) {
          for (let k = 0; k < 24; k++) {
            const a = 2 * Math.PI * k / 24, n = [Math.cos(a), Math.sin(a), 0];
            const np = P.transformVelocity3(n, [st.Vx, 0, 0]);
            g.line(n[0], n[1], np[0], np[1], { color: '#e3b341', width: 0.8, alpha: 0.7 });
            g.dot(n[0], n[1], 2.5, '#c9d1d9');
            g.dot(np[0], np[1], 3, '#e39b12');
          }
        }
        // observer velocity
        g.arrow(0, 0, st.Vx, 0, { color: '#1f6feb', width: 2 }, 8);
        g.text(st.Vx, 0, 'V (observer)', { dy: 12, align: 'center', color: '#1f6feb' });
        const up = P.transformVelocity3(st.u, [st.Vx, 0, 0]);
        g.arrow(0, 0, st.u[0] - st.Vx, st.u[1], { color: '#8c959f', width: 1.5, dash: [5, 3] }, 8);
        g.arrow(0, 0, st.u[0], st.u[1], { color: '#222', width: 2.5 }, 10);
        g.text(st.u[0], st.u[1], 'u (in S)', { dx: 8, dy: -8 });
        if (isFinite(up[0]) && Math.hypot(up[0], up[1]) < 50) {
          g.arrow(0, 0, up[0], up[1], { color: '#cf222e', width: 2.5 }, 10);
          g.text(up[0], up[1], "u' (in S')", { dx: 8, dy: 10, color: '#cf222e' });
        }
        g.stext(8, g.H - 46, 'grey dashed: Galilean u − V   ·   orange dots: light rays in all directions,\ngrey dots before, orange after the change of frame (aberration: still on the circle!)', { color: '#57606a', font: '11px system-ui', lh: 14 });
      };

      /* ------------------------------------------- plot 3: rapidity chain */
      const p3 = new SR.Plot(c3, { xlabel: 'number of boosts n', ylabel: 'final velocity' });
      p3.pannable = p3.zoomable = false;
      p3.margin.t = 40;
      p3.onRender = () => {
        p3.box ={ xmin: 0, xmax: st.n, ymin: 0, ymax: Math.min(2.2, Math.max(1.1, st.beta * st.n * 1.05)) }; p3._fit();
        p3.axes();
        p3.clipped(() => {
          p3.hline(1, { color: C.light, dash: [5, 4] }, 'c');
          p3.fn(k => k * st.beta, { color: '#8c959f', dash: [6, 4], width: 1.5 }, 0, st.n);
          p3.fn(k => P.chainVelocity(st.beta, k), { color: '#cf222e', width: 2.2 }, 0, st.n);
          for (let k = 0; k <= st.n && k <= 200; k++) p3.dot(k, P.chainVelocity(st.beta, k), st.n > 40 ? 1.8 : 3, '#cf222e');
        });
        const c = p3.ctx; c.font = '11.5px system-ui'; c.textAlign = 'right'; c.textBaseline = 'top';
        c.fillStyle = '#cf222e'; c.fillText('tanh(n·artanh β): rapidities add', p3.W - 16, p3.margin.t + 4);
        c.fillStyle = '#6e7781'; c.fillText('Galilean n·β', p3.W - 16, p3.margin.t + 19);
      };

      /* ------------------------------------------- plot 4: Fizeau */
      const p4 = new SR.Plot(c4, { xlabel: 'water velocity V (along the light)', ylabel: 'light speed u in lab' });
      p4.pannable = p4.zoomable = false;
      p4.margin.t = 40;
      p4.setBox(-1, 1, -0.6, 1.8);
      p4.onRender = () => {
        p4.axes();
        p4.clipped(() => {
          p4.hline(1, { color: C.light, dash: [5, 4] }, 'c');
          p4.fn(V => 1 / st.idx + V, { color: '#8c959f', dash: [6, 4], width: 1.5 });
          p4.fn(V => 1 / st.idx + V * (1 - 1 / (st.idx * st.idx)), { color: '#1a7f37', dash: [2, 3], width: 1.5 });
          p4.fn(V => P.lightInMedium(st.idx, V), { color: '#1f6feb', width: 2.4 }, -0.999, 0.999);
          p4.vline(-1 / st.idx, { color: '#8250df', dash: [3, 3] }, 'V = −c/n: light at rest');
          p4.dot(st.Vw, P.lightInMedium(st.idx, st.Vw), 5, '#1f6feb');
        });
        const c = p4.ctx; c.font = '11.5px system-ui'; c.textAlign = 'right'; c.textBaseline = 'top';
        c.fillStyle = '#1f6feb'; c.fillText('relativistic (c/n + V)/(1 + V/nc)', p4.W - 16, p4.margin.t + 4);
        c.fillStyle = '#1a7f37'; c.fillText('Fresnel drag c/n + V(1 − 1/n²)', p4.W - 16, p4.margin.t + 19);
        c.fillStyle = '#6e7781'; c.fillText('Galilean c/n + V', p4.W - 16, p4.margin.t + 34);
      };

      /* ------------------------------------------- side panel */
      const s1 = ui.section(L.side, "1 · Transforming a velocity (eq. 2.13)");
      ui.slider(s1, { label: 'object/wave v (in S)', min: -3, max: 3, step: 0.01, value: st.v, onInput: v => { st.v = v; upd(); } });
      ui.buttons(s1, [{ label: 'v = 0.5c', onClick: () => setV(0.5) }, { label: 'v = c', onClick: () => setV(1) }, { label: 'v = 1.5c (wave)', onClick: () => setV(1.5) }, { label: 'v = −2c', onClick: () => setV(-2) }]);
      const sV = ui.slider(s1, { label: 'observer V', min: -0.99, max: 0.99, step: 0.005, value: st.V, onInput: v => { st.V = v; upd(); } });
      const ro1 = ui.readout(s1);
      const s2 = ui.section(L.side, '2 · Velocity space (eq. 2.14, 3.6)');
      ui.slider(s2, { label: 'observer V (along x)', min: -0.99, max: 0.99, step: 0.005, value: st.Vx, onInput: v => { st.Vx = v; upd(); } });
      ui.checkbox(s2, { label: 'show light rays (aberration)', value: true, onChange: v => { st.showPhotons = v; upd(); } });
      const ro2 = ui.readout(s2);
      const s3 = ui.section(L.side, '3 · Chain of boosts (rapidity)');
      ui.slider(s3, { label: 'β per step', min: 0.01, max: 0.99, step: 0.01, value: st.beta, onInput: v => { st.beta = v; upd(); } });
      ui.slider(s3, { label: 'n steps', min: 1, max: 100, step: 1, value: st.n, onInput: v => { st.n = Math.round(v); upd(); } });
      ui.buttons(s3, [{ label: '100 rockets at 0.9c (exercise 2.12)', onClick: () => { st.beta = 0.9; st.n = 100; rebuildSide(); upd(); } }]);
      const ro3 = ui.readout(s3);
      const s4 = ui.section(L.side, '4 · Light in moving water (6.2)');
      ui.slider(s4, { label: 'refractive index n', min: 1, max: 2.5, step: 0.01, value: st.idx, onInput: v => { st.idx = v; upd(); } });
      ui.slider(s4, { label: 'water velocity V', min: -0.99, max: 0.99, step: 0.005, value: st.Vw, onInput: v => { st.Vw = v; upd(); } });
      const ro4 = ui.readout(s4);
      const s5 = ui.section(L.side, 'Calculator: u ⊕ w');
      const cu = ui.slider(s5, { label: 'u', min: -0.999, max: 0.999, step: 0.001, value: 0.9, onInput: () => upd() });
      const cw = ui.slider(s5, { label: 'w', min: -0.999, max: 0.999, step: 0.001, value: 0.9, onInput: () => upd() });
      const ro5 = ui.readout(s5);
      const s6 = ui.section(L.side, 'Predict, then reveal');
      [
        ['You chase a light ray at V = 0.99c. How fast does it recede from you?', 'Still exactly c: (1 − V)/(1 − V) = 1 (eq. 2.15). Try v = c in panel 1: the red line is flat at 1.'],
        ['You chase a superluminal wave (v = 1.5c). Does it slow down as you speed up?', 'No, it speeds up, becomes infinite at V = c²/v = 0.667c and then moves backwards. Superluminal "things" (Mexican waves, laser spots) carry no signal, so nothing forbids this.'],
        ['An object moves along y in S. Does an observer moving along x see the y component unchanged?', 'No: u′_y = u_y√(1−V²)/(1 − u_x V). Time runs differently in S′, so the transverse velocity changes too (Questions 3.5).'],
        ['Does the direction of a light ray depend on the observer?', 'Yes (aberration). Its speed does not: the orange dots stay on the circle |v| = c, but they bunch up opposite to the observer\'s motion, so stars ahead appear even more ahead.'],
        ['What is the speed of light in water flowing towards the light at V = c/n?', 'Zero: (c/n − c/n)/(1 − 1/n²) = 0. The flowing medium "drags" the light (Fizeau, 1851). To first order: u ≈ c/n + V(1 − 1/n²).']
      ].forEach(q => ui.reveal(s6, q[0], q[1]));

      function setV(v) { st.v = v; rebuildSide(); upd(); }
      function rebuildSide() {
        // refresh slider positions after preset buttons
        s1.querySelectorAll('input[type=range]')[0].value = st.v; s1.querySelectorAll('input[type=number]')[0].value = st.v.toFixed(2);
        s3.querySelectorAll('input[type=range]')[0].value = st.beta; s3.querySelectorAll('input[type=number]')[0].value = st.beta.toFixed(2);
        s3.querySelectorAll('input[type=range]')[1].value = st.n; s3.querySelectorAll('input[type=number]')[1].value = st.n;
      }
      function upd() {
        const vp = P.transformVelocity(st.v, st.V);
        ro1.set([['v in S', f(st.v, 3)], ["v' = (v − V)/(1 − vV)", f(vp, 4), 'hl'], ['Galilean v − V', f(st.v - st.V, 4)],
          Math.abs(st.v) > 1 ? ['V where the wave is infinitely fast: c²/v', f(1 / st.v, 4)] : ['frame where the object rests', 'V = ' + f(st.v, 3)]]);
        const up = P.transformVelocity3(st.u, [st.Vx, 0, 0]);
        ro2.set([['u in S', ui.fmtv(st.u, 3) + '  |u| = ' + f(Math.hypot(st.u[0], st.u[1]), 3)],
          ["u' in S'", ui.fmtv(up, 3) + "  |u'| = " + f(Math.hypot(up[0], up[1]), 3), 'hl'],
          ['Galilean u − V', ui.fmtv([st.u[0] - st.Vx, st.u[1]], 3) + '  |…| = ' + f(Math.hypot(st.u[0] - st.Vx, st.u[1]), 3)],
          ["u'_y / u_y", f(st.u[1] !== 0 ? up[1] / st.u[1] : NaN, 4) + ' = √(1−V²)/(1−u_xV)']]);
        const phi = st.n * Math.atanh(st.beta), vend = Math.tanh(phi);
        ro3.set([['rapidity per step artanh β', f(Math.atanh(st.beta), 4)], ['total rapidity nφ', f(phi, 3)], ['final velocity tanh(nφ)', vend > 0.999999 ? '1 − 10^' + f(P.log10OneMinusTanh(phi), 2) : f(vend, 6), 'hl'],
          ['Galilean would give', f(st.n * st.beta, 3) + ' c']]);
        const uw = P.lightInMedium(st.idx, st.Vw);
        ro4.set([['c/n (water at rest)', f(1 / st.idx, 4)], ['u (relativistic)', f(uw, 4), 'hl'], ['Fresnel first order', f(1 / st.idx + st.Vw * (1 - 1 / st.idx / st.idx), 4)], ['Galilean c/n + V', f(1 / st.idx + st.Vw, 4)]]);
        const u = cu.get(), w = cw.get();
        ro5.set([['u ⊕ w = (u + w)/(1 + uw)', f(P.addVelocities(u, w), 6), 'hl'], ['rapidities add: artanh u + artanh w', f(Math.atanh(u) + Math.atanh(w), 4)],
          ['closing speed of u and −w in S', f(u + w, 4) + ' (not a velocity of anything)']]);
        sV.set(st.V);
        p1.requestDraw(); v2.requestDraw(); p3.requestDraw(); p4.requestDraw();
      }
      upd();
    }
  });
})();
