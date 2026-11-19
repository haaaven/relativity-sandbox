/* Tab 9 - Drill: randomised exam-style problems with answer checking and worked solutions. */
(function () {
  'use strict';
  const SR = window.SR, P = SR.phys, ui = SR.ui;
  const c_ms = 299792458, c_kms = 299792.458;
  const fm = (x, d) => ui.fmt(x, d === undefined ? 4 : d);

  function rng() {
    return {
      pick: a => a[Math.floor(Math.random() * a.length)],
      int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
      bool: () => Math.random() < 0.5
    };
  }
  const MASSES = { electron: 0.51099895, muon: 105.6584, proton: 938.2721 };

  const G = [];
  /* 1 */ G.push({
    id: 'lt', topic: 'Lorentz transformation of an event', gen(r) {
      const V = r.pick([0.6, 0.8, -0.6, 0.28, 0.96, -0.8, 0.5]);
      let t = 0, x = 0;
      while (t === 0 && x === 0) { t = r.int(-5, 6); x = r.int(-5, 6); }
      const g = P.gamma(V), tp = g * (t - V * x), xp = g * (x - V * t);
      return {
        text: `In frame S an event has coordinates (ct, x) = (${t} m, ${x} m). Frame S′ moves with V = ${V}c along +x; the origins coincide at t = t′ = 0. Find ct′ and x′.`,
        answers: [{ label: 'ct′ (m)', value: tp }, { label: 'x′ (m)', value: xp }],
        solution: `γ = 1/√(1 − ${V}²) = ${fm(g)}<br>ct′ = γ(ct − Vx/c) = ${fm(g)}·(${t} − (${V})·(${x})) = <b>${fm(tp)}</b> m<br>x′ = γ(x − V t) = ${fm(g)}·(${x} − (${V})·(${t})) = <b>${fm(xp)}</b> m<br>Check the invariant: (ct)² − x² = ${t * t - x * x} = (ct′)² − x′² = ${fm(tp * tp - xp * xp, 3)} ✓`,
        viz: { tab: 'spacetime', arg: { V, events: [{ name: 'E', t, x }] } }
      };
    }
  });
  /* 2 */ G.push({
    id: 'pair', topic: 'Special frames for a pair of events (interval)', gen(r) {
      if (r.bool()) {
        const dx = r.pick([3, 4, 5, 6, 8]), dt = r.pick([1, 2]);
        const V = dt / dx, sig = Math.sqrt(dx * dx - dt * dt);
        return {
          text: `Event A is at (ct, x) = (0, 0), event B at (ct, x) = (${dt} ly, ${dx} ly). (a) In which frame (velocity V along x) are A and B simultaneous? (b) How far apart are they in that frame?`,
          answers: [{ label: 'V (units of c)', value: V }, { label: 'distance (ly)', value: sig }],
          solution: `s² = (cΔt)² − Δx² = ${dt * dt} − ${dx * dx} = ${dt * dt - dx * dx} &lt; 0: <b>spacelike</b>, so such a frame exists.<br>Δt′ = γ(Δt − VΔx/c²) = 0 ⇒ V = cΔt/Δx = <b>${fm(V)}</b>c.<br>In that frame s² = −Δx′², so Δx′ = √(Δx² − c²Δt²) = <b>${fm(sig)}</b> ly (the proper distance).`,
          viz: { tab: 'spacetime', arg: { V, events: [{ name: 'A', t: 0, x: 0 }, { name: 'B', t: dt, x: dx }] } }
        };
      }
      const dt = r.pick([5, 6, 8, 10]), dx = r.pick([1, 2, 3, 4]);
      const V = dx / dt, tau = Math.sqrt(dt * dt - dx * dx);
      return {
        text: `Event A is at (ct, x) = (0, 0), event B at (ct, x) = (${dt} ly, ${dx} ly). (a) In which frame (velocity V along x) do A and B happen at the same place? (b) How much time separates them in that frame?`,
        answers: [{ label: 'V (units of c)', value: V }, { label: 'time (years)', value: tau }],
        solution: `s² = ${dt * dt} − ${dx * dx} = ${dt * dt - dx * dx} &gt; 0: <b>timelike</b>.<br>Δx′ = γ(Δx − VΔt) = 0 ⇒ V = Δx/Δt = <b>${fm(V)}</b>c.<br>There s² = (cΔt′)², so Δt′ = √(s²)/c = <b>${fm(tau)}</b> years (the proper time).`,
        viz: { tab: 'spacetime', arg: { V, events: [{ name: 'A', t: 0, x: 0 }, { name: 'B', t: dt, x: dx }] } }
      };
    }
  });
  /* 3 */ G.push({
    id: 'order', topic: 'Relativity of simultaneity / order of events', gen(r) {
      const L = r.pick([300, 600, 900, 1500]), V = r.pick([0.5, 0.6, 0.8]);
      const g = P.gamma(V), dtp = -g * V * L / c_kms * 1000;
      return {
        text: `Two lightning bolts strike simultaneously in the ground frame at points ${L} km apart (A at x = 0, B at x = ${L} km). A train moves from A towards B at ${V}c. Find t′_B − t′_A in the train frame (in ms). Which one strikes first for the train?`,
        answers: [{ label: 't′_B − t′_A (ms)', value: dtp }],
        solution: `Δt′ = γ(Δt − VΔx/c²) = −γVΔx/c² with Δt = 0.<br>γ = ${fm(g)}, Δx/c = ${L}/${c_kms} s = ${fm(L / c_kms * 1000)} ms.<br>Δt′ = −${fm(g)}·${V}·${fm(L / c_kms * 1000)} ms = <b>${fm(dtp)}</b> ms: B (ahead of the train) strikes first.`,
        viz: { tab: 'paradox', arg: 'feet' }
      };
    }
  });
  /* 4 */ G.push({
    id: 'muon', topic: 'Time dilation: atmospheric muons', gen(r) {
      const b = r.pick([0.98, 0.99, 0.995, 0.998]), tau0 = 2.197e-6, g = P.gamma(b);
      const d = g * b * c_ms * tau0 / 1000, naive = b * c_ms * tau0 / 1000;
      return {
        text: `A muon (mean lifetime 2.197 μs in its rest frame) moves at ${b}c. How far does it travel on average before decaying, measured in the Earth frame?`,
        answers: [{ label: 'distance (km)', value: d }],
        solution: `γ = 1/√(1 − ${b}²) = ${fm(g)}. Lifetime in the Earth frame γτ₀ = ${fm(g * tau0 * 1e6)} μs.<br>Distance = v·γτ₀ = ${b}·(2.998·10⁸ m/s)·${fm(g * tau0 * 1e6)} μs = <b>${fm(d)}</b> km (without dilation only ${fm(naive)} km).<br>Muon frame: it lives 2.197 μs, but the atmosphere is contracted by γ, giving the same count of decays.`
      };
    }
  });
  /* 5 */ G.push({
    id: 'length', topic: 'Length contraction', gen(r) {
      if (r.bool()) {
        const L0 = r.pick([1, 2, 5, 10, 100]), b = r.pick([0.6, 0.8, 0.9, 0.99]), L = L0 / P.gamma(b);
        return {
          text: `A rod of rest length ${L0} m flies along its length at ${b}c. What length do you measure (positions of both ends marked at the same time in your frame)?`,
          answers: [{ label: 'L (m)', value: L }],
          solution: `L = L₀√(1 − v²/c²) = ${L0}·√(1 − ${b}²) = <b>${fm(L)}</b> m.`, viz: { tab: 'paradox', arg: 'length' }
        };
      }
      const q = r.pick([0.5, 0.25, 0.1, 0.8]), b = Math.sqrt(1 - q * q);
      return {
        text: `How fast must a spaceship move for an observer at rest to measure it at ${q * 100}% of its rest length?`,
        answers: [{ label: 'v (units of c)', value: b }],
        solution: `L/L₀ = 1/γ = ${q} ⇒ γ = ${fm(1 / q)} ⇒ v/c = √(1 − 1/γ²) = √(1 − ${q}²) = <b>${fm(b)}</b>.`
      };
    }
  });
  /* 6 */ G.push({
    id: 'vadd', topic: 'Velocity addition', gen(r) {
      const u = r.pick([0.5, 0.6, 0.8, 0.9]), w = r.pick([0.5, 0.6, 0.7, 0.9]), s = r.pick([1, -1]);
      const res = (u + s * w) / (1 + s * u * w);
      return {
        text: `A spaceship moves away from Earth at ${u}c and launches a probe ${s > 0 ? 'forward' : 'backward'} at ${w}c relative to the ship. What is the probe's velocity relative to Earth (positive = direction of the ship's motion)?`,
        answers: [{ label: 'v (units of c)', value: res }],
        solution: `v = (u + w′)/(1 + uw′/c²) with u = ${u}, w′ = ${s * w}: v = (${u} ${s > 0 ? '+' : '−'} ${w})/(1 ${s > 0 ? '+' : '−'} ${fm(u * w, 3)}) = <b>${fm(res)}</b>c (Galilean: ${fm(u + s * w, 3)}c).`,
        viz: { tab: 'velocity' }
      };
    }
  });
  /* 7 */ G.push({
    id: 'chain', topic: 'Rapidity: chains of boosts', gen(r) {
      const b = r.pick([0.5, 0.6, 0.8]), n = r.pick([2, 3, 4, 5]), v = P.chainVelocity(b, n);
      return {
        text: `A rocket launches a second rocket at ${b}c relative to itself, which launches a third at ${b}c relative to itself, and so on, all along one line. Rocket 1 moves at ${b}c relative to Earth. What is the velocity of rocket ${n} relative to Earth?`,
        answers: [{ label: 'v (units of c)', value: v }],
        solution: `Rapidities add: φ = artanh(${b}) = ${fm(Math.atanh(b))}. Rocket ${n} has rapidity ${n}φ = ${fm(n * Math.atanh(b))}, so v = tanh(${n}φ) = <b>${fm(v)}</b>c.`,
        viz: { tab: 'velocity' }
      };
    }
  });
  /* 8 */ G.push({
    id: 'doppler', topic: 'Doppler effect', gen(r) {
      const b = r.pick([0.2, 0.5, 0.6, 0.8]), l0 = r.pick([400, 500, 600]), kind = r.pick(['recede', 'approach', 'trans']);
      const l = kind === 'recede' ? l0 * Math.sqrt((1 + b) / (1 - b)) : kind === 'approach' ? l0 * Math.sqrt((1 - b) / (1 + b)) : l0 * P.gamma(b);
      const how = kind === 'recede' ? 'moves directly away from you' : kind === 'approach' ? 'moves directly towards you' : 'moves perpendicular to the line of sight (at the moment of emission, in your frame)';
      return {
        text: `A source emitting light of wavelength ${l0} nm (in its rest frame) ${how} at ${b}c. What wavelength do you observe?`,
        answers: [{ label: 'λ (nm)', value: l }],
        solution: kind === 'trans' ? `Eq. (6.1): λ = λ₀γ(1 + v_r/c) with v_r = 0: λ = γλ₀ = ${fm(P.gamma(b))}·${l0} = <b>${fm(l)}</b> nm (transverse redshift, pure time dilation).`
          : `λ = λ₀γ(1 + v_r/c) with v_r = ${kind === 'recede' ? '+' : '−'}${b}c: λ = λ₀√((1 ${kind === 'recede' ? '+' : '−'} β)/(1 ${kind === 'recede' ? '−' : '+'} β)) = <b>${fm(l)}</b> nm.`,
        viz: { tab: 'optics' }
      };
    }
  });
  /* 9 */ G.push({
    id: 'kin', topic: 'Energy and momentum of a particle', gen(r) {
      const name = r.pick(Object.keys(MASSES)), m = MASSES[name], k = r.pick([0.5, 1, 2, 4, 9]), K = +(k * m).toPrecision(4);
      const g = 1 + K / m, b = Math.sqrt(1 - 1 / (g * g)), p = g * m * b;
      return {
        text: `A${name === 'electron' ? 'n' : ''} ${name} (mc² = ${m.toPrecision(6)} MeV) has kinetic energy ${K} MeV. Find γ, v/c and its momentum (MeV/c).`,
        answers: [{ label: 'γ', value: g }, { label: 'v/c', value: b }, { label: 'p (MeV/c)', value: p }],
        solution: `γ = 1 + K/mc² = 1 + ${K}/${m.toPrecision(6)} = <b>${fm(g)}</b>; v/c = √(1 − 1/γ²) = <b>${fm(b)}</b>; pc = √(E² − m²c⁴) = √(${fm(g * m, 6)}² − ${m.toPrecision(6)}²) = <b>${fm(p)}</b> MeV.`,
        viz: { tab: 'dynamics' }
      };
    }
  });
  /* 10 */ G.push({
    id: 'thr', topic: 'Threshold energy (fixed target)', gen(r) {
      const mp = 938.2721, mpi0 = 134.9768, me = 0.511;
      const R = r.pick([
        ['p + p → p + p + p + p̄', mp, mp, 4 * mp], ['p + p → p + p + π⁰', mp, mp, 2 * mp + mpi0], ['γ + p → p + π⁰', 0, mp, mp + mpi0], ['γ + e⁻ → e⁻ + e⁻ + e⁺', 0, me, 3 * me]]);
      const th = P.thresholdFixedTarget(R[1], R[2], R[3]);
      return {
        text: `Reaction ${R[0]} with the second particle at rest. Find the threshold kinetic energy of the incoming particle (MeV). Masses: m_p = 938.27, m_π⁰ = 134.98, m_e = 0.511 MeV.`,
        answers: [{ label: 'K_th (MeV)', value: th.K }],
        solution: `Invariant: s = (E_a + m_b)² − p_a² = m_a² + m_b² + 2m_bE_a. At threshold the products are at rest in the CM frame: √s = Σm_f = ${fm(R[3], 5)} MeV.<br>E_a = (Σm_f² − m_a² − m_b²)/(2m_b) = ${fm(th.E, 5)} MeV, so K = E_a − m_a = <b>${fm(th.K, 5)}</b> MeV.`,
        viz: { tab: 'dynamics' }
      };
    }
  });
  /* 11 */ G.push({
    id: 'decay', topic: 'Two-body decay at rest', gen(r) {
      const R = r.pick([['π⁺ → μ⁺ + ν', 139.5704, 105.6584, 0], ['K⁺ → π⁺ + π⁰', 493.677, 139.5704, 134.9768], ['Λ → p + π⁻', 1115.683, 938.2721, 139.5704]]);
      const d = P.decay2(R[1], R[2], R[3]);
      return {
        text: `${R[0]} at rest (masses ${R[1]}, ${R[2]}, ${R[3]} MeV). Find the momentum of each product and the kinetic energy of the first one.`,
        answers: [{ label: 'p (MeV/c)', value: d.p }, { label: 'K₁ (MeV)', value: d.K1 }],
        solution: `Conservation: E₁ + E₂ = M, p₁ = −p₂. Then E₁ = (M² + m₁² − m₂²)/(2M) = ${fm(d.E1, 5)} MeV, p = √(E₁² − m₁²) = <b>${fm(d.p, 5)}</b> MeV/c, K₁ = E₁ − m₁ = <b>${fm(d.K1, 5)}</b> MeV.`,
        viz: { tab: 'dynamics' }
      };
    }
  });
  /* 12 */ G.push({
    id: 'twin', topic: 'Twin paradox', gen(r) {
      const D = r.pick([4, 6, 8, 10, 12]), b = r.pick([0.6, 0.8, 0.96]), T = 2 * D / b, tau = T / P.gamma(b);
      return {
        text: `Rob flies to a star ${D} ly away at ${b}c, turns around instantly and comes back at the same speed. How much time passes for Alice (on Earth) and for Rob?`,
        answers: [{ label: 'Alice (years)', value: T }, { label: 'Rob (years)', value: tau }],
        solution: `Alice: T = 2D/v = <b>${fm(T)}</b> yr. Rob: τ = T/γ = T√(1 − β²) = <b>${fm(tau)}</b> yr. (On each leg Rob sees the distance contracted to ${fm(D / P.gamma(b))} ly.)`,
        viz: { tab: 'twins' }
      };
    }
  });
  /* 13 */ G.push({
    id: 'accel', topic: 'Uniform proper acceleration', gen(r) {
      const g = 1.03, tau = r.pick([1, 2, 3, 5]);
      const v = Math.tanh(g * tau), t = Math.sinh(g * tau) / g, x = (Math.cosh(g * tau) - 1) / g;
      return {
        text: `A rocket starts from rest and accelerates at 1 g (proper acceleration; 1 g = 1.03 ly/yr²) for ${tau} year${tau > 1 ? 's' : ''} of its own time. Find its final speed, the Earth time elapsed and the distance covered (Earth frame).`,
        answers: [{ label: 'v/c', value: v }, { label: 'Earth time (yr)', value: t }, { label: 'distance (ly)', value: x }],
        solution: `Rapidity grows linearly: φ = gτ/c = ${fm(g * tau)}. v = c·tanh φ = <b>${fm(v)}</b>c; t = (c/g)sinh φ = <b>${fm(t)}</b> yr; x = (c²/g)(cosh φ − 1) = <b>${fm(x)}</b> ly.`,
        viz: { tab: 'accel' }
      };
    }
  });
  /* 14 */ G.push({
    id: 'compton', topic: 'Compton scattering', gen(r) {
      const E = r.pick([100, 200, 511, 662, 1000]), th = r.pick([60, 90, 120, 180]), Ep = P.compton(E, 511, th * Math.PI / 180);
      return {
        text: `A ${E} keV photon scatters off a free electron at rest (mc² = 511 keV) through ${th}°. Find the energy of the scattered photon.`,
        answers: [{ label: 'E′ (keV)', value: Ep }],
        solution: `From four-momentum conservation: E′ = E/(1 + (E/mc²)(1 − cos θ)) = ${E}/(1 + ${fm(E / 511, 4)}·${fm(1 - Math.cos(th * Math.PI / 180), 3)}) = <b>${fm(Ep)}</b> keV.`
      };
    }
  });
  /* 15 */ G.push({
    id: 'sticky', topic: 'Inelastic collision: mass from kinetic energy', gen(r) {
      const m = r.pick([1, 2, 5]), b = r.pick([0.6, 0.8, 0.5]), M = 2 * m * P.gamma(b);
      return {
        text: `Two lumps of clay, each of mass ${m} kg, collide head-on at ±${b}c and stick together. What is the mass of the resulting lump?`,
        answers: [{ label: 'M (kg)', value: M }],
        solution: `Total momentum 0, so the lump is at rest; energy conservation: Mc² = 2γmc² ⇒ M = 2γm = 2·${fm(P.gamma(b))}·${m} = <b>${fm(M)}</b> kg &gt; ${2 * m} kg. Kinetic energy became rest energy.`,
        viz: { tab: 'dynamics' }
      };
    }
  });
  /* 16 */ G.push({
    id: 'trans', topic: 'Transverse velocity transformation', gen(r) {
      const V = r.pick([0.6, 0.8]), u = r.pick([0.5, 0.6, 0.8]), uy = u * Math.sqrt(1 - V * V), sp = Math.hypot(V, uy);
      return {
        text: `Frame S′ moves with V = ${V}c along x relative to S. In S′ a particle moves with speed ${u}c along y′. What is its speed in S?`,
        answers: [{ label: 'speed (units of c)', value: sp }],
        solution: `Eq. (2.14) inverse (u′_x = 0): u_x = V = ${V}c, u_y = u′_y√(1 − V²)/(1 + u′_xV) = ${u}·${fm(Math.sqrt(1 - V * V), 3)} = ${fm(uy)}c.<br>Speed = √(u_x² + u_y²) = <b>${fm(sp)}</b>c (&lt; c ✓; Galilean would be ${fm(Math.hypot(V, u), 3)}c).`,
        viz: { tab: 'velocity' }
      };
    }
  });

  SR.modules.push({
    id: 'drill', order: 9, title: '9 · Drill', doc: true, tip: 'Random exam-style problems with worked solutions',
    init(panel) {
      const inner = ui.el('div', { class: 'doc-inner' });
      panel.append(inner);
      inner.append(ui.el('h2', { text: 'Drill: randomised problems' }));
      ui.note(inner, 'Pick topics, get a fresh problem, type your answers (1% tolerance; decimals with "." or ","), then check or open the worked solution. "Show in sandbox" opens the relevant tab. Units: c = 1 unless stated.', 'small');
      const filt = ui.el('div', { class: 'chkgrid', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' } });
      inner.append(filt);
      const on = {};
      G.forEach(g => { on[g.id] = true; ui.checkbox(filt, { label: g.topic, value: true, onChange: v => { on[g.id] = v; } }); });
      const score = { right: 0, tried: 0 };
      const bar = ui.buttons(inner, [{ label: 'New problem', primary: true, onClick: () => next() }, { label: 'All topics on/off', onClick: () => { const all = !Object.values(on).every(Boolean); filt.querySelectorAll('input').forEach((c, i) => { c.checked = all; on[G[i].id] = all; }); } }]);
      const sc = ui.el('span', { class: 'note small', style: { marginLeft: '10px' } }); bar.append(sc);
      const box = ui.el('div'); inner.append(box);
      const parse = s => { s = String(s).trim().replace(/−/g, '-').replace(',', '.').replace(/[×·]\s*10\^?/g, 'e'); return s === '' ? NaN : Number(s); };
      function next() {
        const pool = G.filter(g => on[g.id]);
        if (!pool.length) { box.innerHTML = '<div class="card">Select at least one topic.</div>'; return; }
        const g = pool[Math.floor(Math.random() * pool.length)];
        const pr = g.gen(rng());
        const card = ui.el('div', { class: 'card' });
        card.append(ui.el('div', { class: 'meta', text: g.topic }), ui.el('div', { class: 'q', html: pr.text }));
        const ans = ui.el('div', { class: 'answers' });
        const inputs = pr.answers.map(a => { const inp = ui.el('input', { type: 'text', placeholder: '?' }); const mark = ui.el('span', { class: 'status' }); ans.append(ui.el('label', {}, a.label + ' ', inp, ' ', mark)); return { a, inp, mark }; });
        card.append(ans);
        const sol = ui.el('div', { class: 'sol', html: pr.solution, style: { display: 'none' } });
        let counted = false;
        const btns = [{ label: 'Check', primary: true, onClick: () => {
          let all = true;
          inputs.forEach(({ a, inp, mark }) => {
            const v = parse(inp.value), ok = Number.isFinite(v) && Math.abs(v - a.value) <= Math.max(0.01 * Math.abs(a.value), 5e-4);
            mark.textContent = ok ? '✓' : '✗ ';
            mark.className = 'status ' + (ok ? 'good' : 'bad');
            if (!ok) all = false;
          });
          if (!counted) { counted = true; score.tried++; if (all) score.right++; sc.textContent = `score: ${score.right} / ${score.tried}`; }
        } }, { label: 'Show solution', onClick: () => { sol.style.display = ''; inputs.forEach(({ a, mark }) => { if (!mark.textContent) { mark.textContent = '= ' + ui.fmt(a.value, 4); } }); } }];
        if (pr.viz) btns.push({ label: 'Show in sandbox →', onClick: () => SR.app.go(pr.viz.tab, pr.viz.arg) });
        btns.push({ label: 'Next', onClick: () => next() });
        ui.buttons(card, btns);
        card.append(sol);
        box.innerHTML = '';
        box.append(card);
        const first = card.querySelector('input'); if (first) first.focus();
        card.addEventListener('keydown', e => { if (e.key === 'Enter') card.querySelector('.btns button').click(); });
      }
      next();
    }
  });
})();
