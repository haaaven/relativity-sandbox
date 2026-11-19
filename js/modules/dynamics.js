/* Tab 6 - relativistic dynamics (Dragan ch. 7): four-momentum diagram, invariant mass, CM frame,
   collision / decay / threshold calculators, force vs acceleration, constant force. Units: c = 1. */
(function () {
  'use strict';
  const SR = window.SR, P = SR.phys, ui = SR.ui, C = SR.COLORS, f = ui.fmt, v3 = P.v3;
  const COLS = ['#1f6feb', '#cf222e', '#1a7f37', '#8250df', '#bf8700'];
  const MASS = { e: 0.51099895, mu: 105.6584, pi: 139.5704, pi0: 134.9768, K: 493.677, p: 938.2721, n: 939.5654, Lambda: 1115.683 };

  SR.modules.push({
    id: 'dynamics', order: 6, title: '6 · Dynamics', tip: 'Four-momentum, E = mc², collisions, decays, thresholds, force (ch. 7)',
    init(panel) {
      const L = ui.layout(panel);
      const r1 = L.row({ flex: '1.6 1 0' }), r2 = L.row({ flex: '1 1 0' });
      const cE = L.canvas({ parent: r1, title: 'Energy–momentum diagram (1D momenta). Drag the arrow tips. Hyperbolas: mass shells E² − p² = m²' });
      const cF = L.canvas({ parent: r1, title: 'Force vs acceleration (2D). Drag the tips of v and F.' });
      const cP = L.canvas({ parent: r2, title: 'Constant force from rest: momentum grows linearly, velocity saturates' });

      const st = { V: 0, parts: [], chain: true, v: [0.7, 0, 0], F: [0.35, 0.55, 0] };
      const presets = {
        collide: { label: 'equal masses head-on', parts: [{ m: 1, p: 4 / 3, kind: 'm' }, { m: 1, p: -4 / 3, kind: 'm' }] },
        target: { label: 'beam on resting target', parts: [{ m: 1, p: 3, kind: 'm' }, { m: 1, p: 0, kind: 'm' }] },
        photons: { label: 'two photons', parts: [{ m: 0, p: 1.5, kind: 'g' }, { m: 0, p: -0.8, kind: 'g' }] },
        photon: { label: 'one photon (Doppler)', parts: [{ m: 0, p: 1.5, kind: 'g' }] },
        decay: { label: 'π⁺ → μ⁺ν at rest (MeV/100)', parts: (() => { const d = P.decay2(1.395704, 1.056584, 0); return [{ m: 1.056584, p: d.p, kind: 'm' }, { m: 0, p: -d.p, kind: 'g' }]; })() },
        tachyon: { label: 'a tachyon (imaginary mass)', parts: [{ m: 1, p: 1.6, kind: 't' }] }
      };
      function loadPreset(k) { st.parts = presets[k].parts.map((q, i) => Object.assign({ color: COLS[i % COLS.length] }, q)); st.V = 0; if (sV) sV.set(0); upd(); }

      /* ----------------------------------------- energy-momentum diagram */
      const E = new SR.View2D(cE, { lockAspect: true });
      E.setBox(-4, 4, -1.5, 5.5);
      /** lab four-momentum of a particle */
      const lab = q => q.kind === 'g' ? [Math.abs(q.p), q.p] : q.kind === 't' ? [Math.sign(q.Es || 1) * Math.sqrt(Math.max(0, q.p * q.p - q.m * q.m)), q.p] : [Math.sqrt(q.p * q.p + q.m * q.m), q.p];
      const shown = q => { const [e, p] = lab(q); return P.Ep.boost(st.V, e, p); };   // [E', p'] in the displayed frame
      function setFromShown(q, pp, Esign) {
        // keep the particle on its shell: choose E' from p' in the displayed frame, then boost back
        let Ep;
        if (q.kind === 'g') Ep = Math.abs(pp);
        else if (q.kind === 't') { if (Math.abs(pp) < q.m) pp = Math.sign(pp || 1) * q.m; Ep = (Esign || 1) * Math.sqrt(pp * pp - q.m * q.m); }
        else Ep = Math.sqrt(pp * pp + q.m * q.m);
        const [e, p] = P.Ep.boost(-st.V, Ep, pp);
        q.p = p; if (q.kind === 't') q.Es = Math.sign(e) || 1;
      }
      for (let i = 0; i < 6; i++) {
        E.addHandle(() => {
          const q = st.parts[i]; if (!q) return null;
          const base = baseOf(i), s = shown(q);
          return [base[1] + s[1], base[0] + s[0]];
        }, (X, Y) => {
          const q = st.parts[i]; if (!q) return;
          const base = baseOf(i);
          const s = shown(q);
          setFromShown(q, X - base[1], q.kind === 't' ? Math.sign(Y - base[0]) || Math.sign(s[0]) : 1);
          upd();
        }, { enabled: () => !!st.parts[i] });
      }
      function baseOf(i) {   // chained head-to-tail: start of arrow i
        if (!st.chain) return [0, 0];
        let e = 0, p = 0;
        for (let k = 0; k < i; k++) { const s = shown(st.parts[k]); e += s[0]; p += s[1]; }
        return [e, p];
      }
      E.onRender = () => {
        const g = E, b = g.bounds();
        g.line(b.xmin, 0, b.xmax, 0, { color: '#c9d1d9' }); g.line(0, b.ymin, 0, b.ymax, { color: '#c9d1d9' });
        g.text(b.xmax, 0, 'p', { dx: -12, dy: -10, font: 'bold 13px system-ui' });
        g.text(0, b.ymax, 'E', { dx: 8, dy: 10, font: 'bold 13px system-ui' });
        const R = Math.max(Math.abs(b.xmin), Math.abs(b.xmax), Math.abs(b.ymax)) * 1.5;
        g.line(-R, R, 0, 0, { color: C.light, width: 1.5, dash: [6, 4] }); g.line(0, 0, R, R, { color: C.light, width: 1.5, dash: [6, 4] });
        const shell = (m, col, dash, tach) => {
          const pts = [], U = Math.asinh(R / Math.max(m, 1e-3)) + 0.2;
          if (!tach) { for (let i = 0; i <= 120; i++) { const u = -U + 2 * U * i / 120; pts.push([m * Math.sinh(u), m * Math.cosh(u)]); } g.poly(pts, { color: col, width: 1.2, dash, alpha: 0.7 }); }
          else [1, -1].forEach(sg => { const q = []; for (let i = 0; i <= 120; i++) { const u = -U + 2 * U * i / 120; q.push([sg * m * Math.cosh(u), m * Math.sinh(u)]); } g.poly(q, { color: col, width: 1.2, dash, alpha: 0.7 }); });
        };
        st.parts.forEach(q => { if (q.kind !== 'g') shell(q.m, q.color, [3, 3], q.kind === 't'); });
        // total
        let Et = 0, pt = 0;
        st.parts.forEach((q, i) => {
          const s = shown(q), base = baseOf(i);
          g.arrow(base[1], base[0], base[1] + s[1], base[0] + s[0], { color: q.color, width: 2.6 }, 11);
          g.dot(base[1] + s[1], base[0] + s[0], 5, '#fff', q.color);
          g.text(base[1] + s[1], base[0] + s[0], (q.kind === 'g' ? 'γ' : q.kind === 't' ? 'tachyon' : 'm=' + f(q.m, 2)) + ' #' + (i + 1), { dx: 9, dy: -10, color: q.color, bg: 'rgba(255,255,255,.7)' });
          Et += s[0]; pt += s[1];
        });
        if (st.parts.length > 1) {
          g.arrow(0, 0, pt, Et, { color: '#222', width: 1.6, dash: [6, 3] }, 10);
          const M2 = Et * Et - pt * pt;
          if (M2 > 1e-9) shell(Math.sqrt(M2), '#222', [8, 5]);
          g.text(pt, Et, 'total, M = ' + f(Math.sqrt(Math.max(0, M2)), 3), { dx: 8, dy: 12, color: '#222', bg: 'rgba(255,255,255,.75)' });
        }
        g.stext(8, 22, 'frame velocity V = ' + f(st.V, 3), { bg: 'rgba(255,255,255,.85)' });
      };

      /* ----------------------------------------- force & acceleration */
      const F = new SR.View2D(cF, { lockAspect: true });
      F.pannable = false;
      F.setBox(-1.25, 1.25, -1.1, 1.25);
      F.addHandle(() => [st.v[0], st.v[1]], (x, y) => { const n = Math.hypot(x, y); const s = n > 0.995 ? 0.995 / n : 1; st.v = [x * s, y * s, 0]; updF(); });
      F.addHandle(() => [st.F[0], st.F[1]], (x, y) => { st.F = [x, y, 0]; updF(); });
      F.onRender = () => {
        const g = F, v = st.v, Fv = st.F, a = P.accelerationFromForce(Fv, v, 1);
        const pts = []; for (let i = 0; i <= 100; i++) { const t = 2 * Math.PI * i / 100; pts.push([Math.cos(t), Math.sin(t)]); }
        g.poly(pts, { color: '#f0d9a8', width: 1.2, dash: [4, 4] });
        g.text(0.7, 0.75, '|v| = c', { color: '#b07600', font: '10.5px system-ui' });
        g.arrow(0, 0, v[0], v[1], { color: '#222', width: 2.2 }, 10); g.text(v[0], v[1], 'v', { dx: 8, dy: 8, font: 'bold 13px system-ui' });
        g.arrow(0, 0, Fv[0], Fv[1], { color: '#1f6feb', width: 2.6 }, 10); g.text(Fv[0], Fv[1], 'F = dp/dt', { dx: 8, dy: -8, color: '#1f6feb' });
        g.arrow(0, 0, a[0], a[1], { color: '#cf222e', width: 2.6 }, 10); g.text(a[0], a[1], 'a (m = 1)', { dx: 8, dy: 12, color: '#cf222e' });
        const vn = v3.norm(v);
        if (vn > 1e-6) {
          const u = v3.scale(v, 1 / vn), apar = v3.scale(u, v3.dot(a, u)), aperp = v3.sub(a, apar);
          g.arrow(0, 0, apar[0], apar[1], { color: '#cf222e', width: 1.2, dash: [4, 3], alpha: 0.7 }, 7);
          g.arrow(apar[0], apar[1], apar[0] + aperp[0], apar[1] + aperp[1], { color: '#cf222e', width: 1.2, dash: [4, 3], alpha: 0.7 }, 7);
        }
        g.stext(8, 22, 'a = (F − (F·v)v)/(γm):  a∥ = F∥/(γ³m),  a⊥ = F⊥/(γm)', { bg: 'rgba(255,255,255,.85)', font: '11.5px system-ui' });
      };

      /* ----------------------------------------- constant force plot */
      const PL = new SR.Plot(cP, { xlabel: 'time t (units mc/F)', ylabel: '' });
      PL.pannable = PL.zoomable = false;
      PL.margin.t = 34;
      PL.setBox(0, 5, 0, 2.2);
      PL.onRender = () => {
        PL.axes({ ylabel: 'p/mc, v/c' });
        PL.clipped(() => {
          PL.hline(1, { color: C.light, dash: [5, 4] }, 'c');
          PL.fn(t => t, { color: '#1a7f37', width: 2 });
          PL.fn(t => t, { color: '#8c959f', width: 1.5, dash: [6, 4] });
          PL.fn(t => t / Math.sqrt(1 + t * t), { color: '#cf222e', width: 2.4 });
          PL.fn(t => Math.asinh(t) / 2.2, { color: '#8250df', width: 1.5, dash: [2, 3] });
        });
        const c = PL.ctx; c.font = '11.5px system-ui'; c.textAlign = 'left'; c.textBaseline = 'top';
        c.fillStyle = '#1a7f37'; c.fillText('momentum p = Ft (and Newton\'s v, grey dashed)', PL.margin.l + 8, PL.margin.t + 4);
        c.fillStyle = '#cf222e'; c.fillText('velocity v = Ft/√(m² + F²t²) → c (hyperbolic motion)', PL.margin.l + 8, PL.margin.t + 19);
        c.fillStyle = '#8250df'; c.fillText('proper time τ = (mc/F)·asinh(Ft/mc)  (scaled ×1/2.2)', PL.margin.l + 8, PL.margin.t + 34);
      };

      /* ----------------------------------------- side panel */
      const s1 = ui.section(L.side, 'Four-momentum diagram');
      const pb = ui.el('div', { class: 'btns' }); s1.append(pb);
      Object.keys(presets).forEach(k => { const b = ui.el('button', { text: presets[k].label }); b.onclick = () => loadPreset(k); pb.append(b); });
      const sV = ui.slider(s1, { label: 'observer V', min: -0.99, max: 0.99, step: 0.001, value: 0, onInput: v => { st.V = v; upd(); } });
      ui.buttons(s1, [
        { label: 'go to CM frame', onClick: () => { const t = totals(true); if (t.E > Math.abs(t.p)) { const target = t.p / t.E; ui.tweenVelocity(st.V, target, 600, v => { st.V = v; sV.set(v); upd(); }); } } },
        { label: 'back to lab', onClick: () => ui.tweenVelocity(st.V, 0, 600, v => { st.V = v; sV.set(v); upd(); }) },
        { label: '+ massive', onClick: () => { if (st.parts.length < 6) { st.parts.push({ m: 0.8, p: 0.5, kind: 'm', color: COLS[st.parts.length % 5] }); upd(); } } },
        { label: '+ photon', onClick: () => { if (st.parts.length < 6) { st.parts.push({ m: 0, p: -1, kind: 'g', color: COLS[st.parts.length % 5] }); upd(); } } },
        { label: 'remove last', onClick: () => { st.parts.pop(); upd(); } }
      ]);
      ui.checkbox(s1, { label: 'chain arrows head-to-tail (vector sum)', value: true, onChange: v => { st.chain = v; upd(); } });
      const massBox = ui.el('div'); s1.append(massBox);
      const ro1 = ui.readout(s1);

      const s2 = ui.section(L.side, 'Calculators (units: MeV, c = 1)');
      const calcSel = ui.select(s2, {
        label: 'calculator', value: 'kin',
        options: [{ value: 'kin', label: 'particle: from v, γ, p, E or K' }, { value: 'decay', label: 'two-body decay at rest' }, { value: 'thr', label: 'threshold energy (fixed target)' },
          { value: 'el', label: '1D elastic collision' }, { value: 'stick', label: '1D sticky collision (mass from KE)' }, { value: 'compton', label: 'Compton scattering' }],
        onChange: () => buildCalc()
      });
      const calcBox = ui.el('div'); s2.append(calcBox);

      const s3 = ui.section(L.side, 'Force vs acceleration');
      const roF = ui.readout(s3);

      const s4 = ui.section(L.side, 'Predict, then reveal');
      [
        ['Two 1 kg lumps collide at ±0.8c and stick. What is the mass of the result?', 'M = 2γm = 3.33 kg. Kinetic energy became rest energy (internal energy). Mass is not additive; energy and momentum are conserved (7.5). See preset "equal masses head-on".'],
        ['Can a free electron absorb a photon?', 'No. In the CM frame the final electron would be at rest with energy m, but before absorption the moving electron alone already had more than m, plus the photon. Formally: invariant mass² = m² + 2E_γ(E − p cos θ) > m² (7.9).'],
        ['Can e⁺e⁻ annihilate into ONE photon?', 'No. The pair has a CM frame (total p = 0, E > 0), but a single photon never has p = 0. You need at least two photons.'],
        ['Is the invariant mass of two photons zero?', 'Only if they move in the same direction. Head-on with energies E₁, E₂: M = 2√(E₁E₂) (preset "two photons").'],
        ['Boost a single photon. What happens to its arrow?', 'It slides along the light cone and gets longer or shorter by exactly the Doppler factor √((1 ± V)/(1 ∓ V)). That is why E = hf is consistent: E and f transform the same way (7.7).'],
        ['When is ma not parallel to the force?', 'Whenever F has components both along and across v: a∥ = F∥/γ³m but a⊥ = F⊥/γm, so the acceleration tilts towards the perpendicular direction (7.6). Drag F in the right-hand panel.'],
        ['Tachyon preset: what does a boost do to its energy?', 'Its mass shell lies outside the light cone; a boost can make its energy negative. Dragan reinterprets that as a tachyon moving the other way in time (7.8–7.9).']
      ].forEach(q => ui.reveal(s4, q[0], q[1]));

      /* ----------------------------------------- calculators */
      function field(parent, label, value, onCh, unit) {
        const inp = ui.el('input', { type: 'number', value, step: 'any' });
        inp.style.width = '110px';
        const row = ui.el('div', { class: 'sel' }, ui.el('label', { html: label }), ui.el('span', {}, inp, unit ? ' ' + unit : ''));
        parent.append(row);
        inp.addEventListener('input', onCh);
        return { get: () => +inp.value, set: v => { inp.value = v; } };
      }
      function buildCalc() {
        calcBox.innerHTML = '';
        const out = ui.readout(calcBox);
        const k = calcSel.get();
        if (k === 'kin') {
          const sel = ui.select(calcBox, { label: 'particle', value: 'p', options: [{ value: 'e', label: 'electron 0.511' }, { value: 'mu', label: 'muon 105.66' }, { value: 'pi', label: 'pion 139.57' }, { value: 'p', label: 'proton 938.27' }], onChange: v => { m.set(MASS[v]); go(); } });
          const m = field(calcBox, 'mass m', MASS.p, () => go(), 'MeV');
          const which = ui.select(calcBox, { label: 'known quantity', value: 'K', options: [{ value: 'v', label: 'v (units of c)' }, { value: 'gamma', label: 'γ' }, { value: 'p', label: 'p (MeV/c)' }, { value: 'E', label: 'E (MeV)' }, { value: 'K', label: 'K (MeV)' }], onChange: () => go() });
          const val = field(calcBox, 'value', 1000, () => go());
          calcBox.append(out.el);
          const go = () => {
            const kn = {}; kn[which.get()] = val.get();
            const r = P.kinematics(m.get(), kn);
            if (!isFinite(r.gamma) || r.gamma < 1) { out.set([['invalid input', '']]); return; }
            out.set([['γ', f(r.gamma, 6)], ['v/c', f(r.v, 6)], ['p (MeV/c)', f(r.p, 4)], ['E (MeV)', f(r.E, 4)], ['K = E − m (MeV)', f(r.K, 4)], ['rapidity', f(r.rapidity, 4)],
              ['Newtonian ½mv² (MeV)', f(0.5 * m.get() * r.v * r.v, 4)], ['E² − p² = m² ✓', f(Math.sqrt(r.E * r.E - r.p * r.p), 4)]]);
          };
          go(); sel.set('p');
        } else if (k === 'decay') {
          const pre = [['π⁺ → μ⁺ ν', MASS.pi, MASS.mu, 0], ['K⁺ → π⁺ π⁰', MASS.K, MASS.pi, MASS.pi0], ['Λ → p π⁻', MASS.Lambda, MASS.p, MASS.pi], ['π⁰ → γ γ', MASS.pi0, 0, 0], ['n → p e⁻ (+ν̄, ignored)', MASS.n, MASS.p, MASS.e]];
          const ps = ui.select(calcBox, { label: 'preset', value: '0', options: pre.map((q, i) => ({ value: String(i), label: q[0] })), onChange: v => { const q = pre[+v]; M.set(q[1]); m1.set(q[2]); m2.set(q[3]); go(); } });
          const M = field(calcBox, 'parent M', MASS.pi, () => go(), 'MeV'), m1 = field(calcBox, 'daughter m₁', MASS.mu, () => go(), 'MeV'), m2 = field(calcBox, 'daughter m₂', 0, () => go(), 'MeV');
          const bp = field(calcBox, 'parent speed in lab β', 0, () => go());
          calcBox.append(out.el);
          const go = () => {
            const d = P.decay2(M.get(), m1.get(), m2.get());
            if (!d) { out.set([['forbidden', 'M < m₁ + m₂', 'bad']]); return; }
            const rows = [['p* (each daughter)', f(d.p, 4) + ' MeV/c', 'hl'], ['E₁ = (M² + m₁² − m₂²)/2M', f(d.E1, 4) + ' MeV'], ['E₂', f(d.E2, 4) + ' MeV'],
              ['K₁, K₂', f(d.K1, 4) + ', ' + f(d.K2, 4)], ['v₁, v₂', f(d.v1, 5) + ', ' + f(d.v2, 5)], ['released energy Q = M − m₁ − m₂', f(M.get() - m1.get() - m2.get(), 4)]];
            const b = bp.get();
            if (b > 0 && b < 1) {
              const g = P.gamma(b);
              rows.push('parent moving with β = ' + f(b, 3) + ' (daughter 1 along / against motion)');
              rows.push(['E₁ max = γ(E₁ + βp*)', f(g * (d.E1 + b * d.p), 4)]);
              rows.push(['E₁ min = γ(E₁ − βp*)', f(g * (d.E1 - b * d.p), 4)]);
            }
            out.set(rows);
          };
          go();
        } else if (k === 'thr') {
          const pre = [['p p → p p p p̄', MASS.p, MASS.p, [MASS.p, MASS.p, MASS.p, MASS.p]], ['γ p → p π⁰', 0, MASS.p, [MASS.p, MASS.pi0]], ['p p → p p π⁰', MASS.p, MASS.p, [MASS.p, MASS.p, MASS.pi0]],
            ['e⁺ e⁻(at rest) → μ⁺ μ⁻', MASS.e, MASS.e, [MASS.mu, MASS.mu]], ['γ e⁻ → e⁻ e⁺ e⁻', 0, MASS.e, [MASS.e, MASS.e, MASS.e]], ['π⁻ p → K⁰ Λ', MASS.pi, MASS.p, [497.611, MASS.Lambda]]];
          const ps = ui.select(calcBox, { label: 'reaction', value: '0', options: pre.map((q, i) => ({ value: String(i), label: q[0] })), onChange: v => { const q = pre[+v]; ma.set(q[1]); mb.set(q[2]); fin.set(q[3].map(x => +x.toFixed(4)).join(', ')); go(); } });
          const ma = field(calcBox, 'beam mass', MASS.p, () => go(), 'MeV'), mb = field(calcBox, 'target mass (at rest)', MASS.p, () => go(), 'MeV');
          const finInp = ui.el('input', { type: 'text', value: [MASS.p, MASS.p, MASS.p, MASS.p].join(', ') }); finInp.style.width = '100%';
          calcBox.append(ui.el('div', { class: 'note small', html: 'final-state masses (comma separated):' }), finInp);
          finInp.addEventListener('input', () => go());
          const fin = { set: v => { finInp.value = v; } };
          calcBox.append(out.el);
          const go = () => {
            const S = finInp.value.split(',').map(Number).filter(x => !Number.isNaN(x)).reduce((a, b) => a + b, 0);
            const th = P.thresholdFixedTarget(ma.get(), mb.get(), S);
            const below = S <= ma.get() + mb.get();
            out.set([['Σ final masses', f(S, 4) + ' MeV'], ['condition: √s = Σm_final', 's = m_a² + m_b² + 2 m_b E_a'],
              ['threshold beam energy E', below ? 'no threshold (exothermic)' : f(th.E, 4) + ' MeV', 'hl'], ['threshold kinetic energy K', below ? '—' : f(th.K, 4) + ' MeV', 'hl'],
              ['beam momentum', below ? '—' : f(th.p, 4) + ' MeV/c'],
              ['head-on collider (equal masses, each)', f(S / 2, 4) + ' MeV total energy per beam']]);
          };
          go();
        } else if (k === 'el' || k === 'stick') {
          const m1 = field(calcBox, 'm₁', 1, () => go()), u1 = field(calcBox, 'u₁ (units of c)', 0.8, () => go());
          const m2 = field(calcBox, 'm₂', 1, () => go()), u2 = field(calcBox, 'u₂ (units of c)', k === 'el' ? 0 : -0.8, () => go());
          calcBox.append(out.el);
          const go = () => {
            const a = m1.get(), b = m2.get(), x = u1.get(), y = u2.get();
            if (Math.abs(x) >= 1 || Math.abs(y) >= 1 || a <= 0 || b <= 0) { out.set([['need |u| < 1 and m > 0', '']]); return; }
            const E0 = a * P.gamma(x) + b * P.gamma(y), p0 = a * P.gamma(x) * x + b * P.gamma(y) * y;
            if (k === 'el') {
              const o = P.elastic1D(a, x, b, y);
              const E1 = a * P.gamma(o.w1) + b * P.gamma(o.w2), p1 = a * P.gamma(o.w1) * o.w1 + b * P.gamma(o.w2) * o.w2;
              out.set([['CM velocity', f(o.Vcm, 5)], ['final u₁′', f(o.w1, 5), 'hl'], ['final u₂′', f(o.w2, 5), 'hl'], ['E before / after', f(E0, 5) + ' / ' + f(E1, 5)], ['p before / after', f(p0, 5) + ' / ' + f(p1, 5)],
                ['Newtonian answer u₁′, u₂′', f(((a - b) * x + 2 * b * y) / (a + b), 4) + ', ' + f(((b - a) * y + 2 * a * x) / (a + b), 4)]]);
            } else {
              const o = P.merge1D(a, x, b, y);
              out.set([['mass of the lump M = √(E² − p²)', f(o.M, 5), 'hl'], ['m₁ + m₂', f(a + b, 5)], ['mass gained (= KE turned internal)', f(o.M - a - b, 5)], ['velocity of the lump p/E', f(o.V, 5)], ['total E, p', f(o.E, 5) + ', ' + f(o.p, 5)]]);
            }
          };
          go();
        } else {
          const Eg = field(calcBox, 'photon energy E', 662, () => go(), 'keV'), th = field(calcBox, 'scattering angle θ', 90, () => go(), '°');
          calcBox.append(out.el);
          const go = () => {
            const me = 511, Ep = P.compton(Eg.get(), me, th.get() * Math.PI / 180);
            out.set([["E' = E/(1 + (E/mc²)(1 − cos θ))", f(Ep, 4) + ' keV', 'hl'], ['electron kinetic energy E − E′', f(Eg.get() - Ep, 4) + ' keV'],
              ["λ' − λ = (h/mc)(1 − cos θ)", f(2.42631 * (1 - Math.cos(th.get() * Math.PI / 180)), 4) + ' pm'], ['backscatter (θ = 180°) E′', f(P.compton(Eg.get(), me, Math.PI), 4) + ' keV']]);
          };
          go();
        }
      }

      function totals(raw) {
        let Et = 0, pt = 0;
        st.parts.forEach(q => { const s = raw ? lab(q) : shown(q); Et += s[0]; pt += s[1]; });
        return { E: Et, p: pt };
      }
      function buildMassBox() {
        massBox.innerHTML = '';
        st.parts.forEach((q, i) => {
          if (q.kind === 'g') return;
          ui.slider(massBox, { label: '<span style="color:' + q.color + '">■</span> #' + (i + 1) + (q.kind === 't' ? ' |m| (tachyon)' : ' mass m'), min: 0.05, max: 3, step: 0.01, value: q.m, onInput: v => { q.m = v; upd(true); } });
        });
      }
      let lastCount = -1;
      function upd(keepBox) {
        if (!keepBox || st.parts.length !== lastCount) { buildMassBox(); lastCount = st.parts.length; }
        const rows = [];
        st.parts.forEach((q, i) => {
          const [e, p] = shown(q);
          const v = e !== 0 ? p / e : Infinity;
          let line = 'E = ' + f(e, 3) + ', p = ' + f(p, 3) + ', v = ' + f(v, 3);
          if (q.kind === 'm') line += ', K = ' + f(e - q.m, 3);
          rows.push(['<span style="color:' + q.color + '">#' + (i + 1) + ' ' + (q.kind === 'g' ? 'photon' : q.kind === 't' ? 'tachyon' : 'm = ' + f(q.m, 2)) + '</span>', line]);
        });
        const t = totals(false), M2 = t.E * t.E - t.p * t.p;
        rows.push(null);
        rows.push(['total E, p (this frame)', f(t.E, 4) + ', ' + f(t.p, 4)]);
        rows.push(['invariant mass M = √(E² − p²)', M2 >= 0 ? f(Math.sqrt(M2), 4) : 'imaginary (spacelike total)', 'hl']);
        const sumM = st.parts.reduce((s, q) => s + (q.kind === 'm' ? q.m : 0), 0);
        rows.push(['sum of rest masses Σm', f(sumM, 4)]);
        if (M2 > 0 && t.E > 0) rows.push(['CM frame velocity p/E', f(t.p / t.E, 4)]);
        if (st.parts.length === 1 && st.parts[0].kind === 'g') rows.push(['Doppler factor E′/E (photon)', f(shown(st.parts[0])[0] / lab(st.parts[0])[0], 4) + ' = √((1∓V)/(1±V))']);
        if (M2 > 0) rows.push(['could create particles with Σm up to', f(Math.sqrt(M2), 4) + ' (≥ 2 particles)']);
        ro1.set(rows);
        E.requestDraw();
      }
      function updF() {
        const v = st.v, Fv = st.F, g = P.gammaVec(v), a = P.accelerationFromForce(Fv, v, 1);
        const vn = v3.norm(v), u = vn > 1e-9 ? v3.scale(v, 1 / vn) : [1, 0, 0];
        const Fp = v3.dot(Fv, u), Fperp = v3.norm(v3.sub(Fv, v3.scale(u, Fp)));
        const ang = Math.acos(Math.max(-1, Math.min(1, v3.dot(Fv, a) / (v3.norm(Fv) * v3.norm(a) || 1))));
        roF.set([['|v|, γ', f(vn, 3) + ', ' + f(g, 4)], ['F∥, F⊥', f(Fp, 3) + ', ' + f(Fperp, 3)],
          ['a∥ = F∥/γ³m', f(Fp / (g * g * g), 4)], ['a⊥ = F⊥/γm', f(Fperp / g, 4)], ['angle between F and a', ui.deg(ang), ang > 1e-3 ? 'hl' : ''],
          ['"longitudinal / transverse mass"', 'γ³m = ' + f(g * g * g, 3) + ', γm = ' + f(g, 3)]]);
        F.requestDraw();
      }
      loadPreset('collide');
      buildCalc();
      updF();
    }
  });
})();
