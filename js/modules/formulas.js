/* Tab 11 - formula sheet (my own compilation; equation numbers refer to Dragan's script). */
(function () {
  'use strict';
  const SR = window.SR, ui = SR.ui;

  const SHEET = [
    ['Lorentz transformation (1.7, 1.11, 3.5)', [
      ['t′ = γ(t − Vx/c²),  x′ = γ(x − Vt),  y′ = y,  z′ = z', 'S′ moves with V along +x, common origin'],
      ['γ = 1/√(1 − V²/c²)', 'Lorentz factor (≥ 1)'],
      ['inverse: V → −V', 't = γ(t′ + Vx′/c²), x = γ(x′ + Vt′)'],
      ['ct′ = ct cosh φ − x sinh φ,  x′ = x cosh φ − ct sinh φ', 'hyperbolic rotation, rapidity φ = artanh(V/c)'],
      ['cosh φ = γ,  sinh φ = γV/c,  tan α = V/c', 'α = tilt of the S′ axes on the diagram'],
      ['t′ = γ(t − r·V/c²),  r′ = r + (γ − 1)(r·V̂)V̂ − γVt', 'boost in any direction'],
      ['Galilean limit: t′ = t, x′ = x − Vt', 'c → ∞']]],
    ['Interval and causality (1.14)', [
      ['s² = c²Δt² − Δx² − Δy² − Δz²', 'the same in every inertial frame'],
      ['s² > 0 timelike,  s² = 0 null,  s² < 0 spacelike', ''],
      ['Δτ = √(s²)/c', 'proper time (timelike pair): frame V = Δx/Δt sees both at one place'],
      ['Δσ = √(−s²)', 'proper distance (spacelike pair): frame V = c²Δt/Δx sees them simultaneous'],
      ['Δt′ = γ(Δt − VΔx/c²)', 'order of spacelike events can flip; timelike / null never']]],
    ['Simultaneity, dilation, contraction (2.1–2.3, 2.11)', [
      ['Δt′ = −γVΔx/c²', 'events simultaneous in S (Δt = 0), Δx apart'],
      ['Δt = γΔτ', 'time dilation of a clock at rest in S′'],
      ['L = L₀/γ', 'length of a moving rod, ends marked with Δt = 0'],
      ['ΔT = L₀V/c²', 'leading clock lags (clocks synchronised in their own frame, L₀ apart)'],
      ['τ = ∫√(1 − v²(t)/c²) dt', 'proper time along any worldline (clock postulate)'],
      ['2γVd/c²,  2γd', 'speed walker: flight time and footprint distance (2.12)']]],
    ['Velocities (2.13, 2.14, 3.6, 6.2)', [
      ['u′ = (u − V)/(1 − uV/c²)', 'velocity seen from S′ (u may be superluminal)'],
      ["u′_y = u_y√(1 − V²/c²)/(1 − u_xV/c²)", 'transverse components change too'],
      ['u ⊕ w = (u + w)/(1 + uw/c²)', 'collinear composition; rapidities add: φ = φ₁ + φ₂'],
      ['v_n = c·tanh(n·artanh β)', 'n boosts of β each'],
      ['u′ = [u_⊥/γ − V + u_∥]/(1 − u·V/c²)', 'general velocity transformation (3.6)'],
      ['u = (c/n + V)/(1 + V/(nc)) ≈ c/n + V(1 − 1/n²)', 'light in a moving medium (Fizeau)']]],
    ['Thomas–Wigner rotation (3.2–3.4, 7.11)', [
      ['B(v′) B(V) = R(θ) B(v)', 'two non-collinear boosts = boost + rotation'],
      ['cos θ = (1 + γ + γ₁ + γ₂)²/((1 + γ)(1 + γ₁)(1 + γ₂)) − 1', 'γ = γ₁γ₂(1 + V·v′/c²)'],
      ['cos θ = (γ₁ + γ₂)/(1 + γ₁γ₂)', 'perpendicular boosts'],
      ['ω_T = (γ²/(γ + 1)) (a × v)/c²', 'Thomas precession rate (3.13)'],
      ['Δθ = 2π(γ − 1) per orbit', 'retrograde (3.14); ≈ πv²/c² for slow orbits'],
      ['V/(c + √(c² − V²)) = (γu − γ′u′)/(γ + γ′)/c', 'hardest problem: Bob\'s velocity from the Witch\'s u (Alice) and u′ (Bob)']]],
    ['Optics (6.1–6.4)', [
      ['λ = λ₀γ(1 + v_r/c)', 'Doppler; v_r = radial velocity of the source (away > 0)'],
      ['f/f₀ = 1/(γ(1 − β cos θ))', 'θ: source velocity vs direction to the observer'],
      ['f/f₀ = √((1 + β)/(1 − β))', 'head-on approach (recession: β → −β)'],
      ['f/f₀ = 1/γ', 'transverse Doppler (θ = 90° in observer frame)'],
      ['cos θ′ = (cos θ + β)/(1 + β cos θ)', 'aberration: star directions crowd forward'],
      ['outline of a moving sphere is a circle', 'Terrell–Penrose rotation']]],
    ['Four-vectors and energy (7.1–7.5)', [
      ['A·B = A⁰B⁰ − A·B', 'Minkowski product (invariant)'],
      ['U = γ(c, u),  U·U = c²', 'four-velocity'],
      ['P = (E/c, p),  E = γmc²,  p = γmu', 'four-momentum'],
      ['E² = p²c² + m²c⁴', 'mass shell'],
      ['K = (γ − 1)mc²,  u = pc²/E', 'kinetic energy, velocity'],
      ['E = pc = hf', 'massless particle'],
      ['M²c⁴ = (ΣE)² − (Σp)²c²', 'invariant mass of a system (not additive!)'],
      ['V_CM = (Σp)c²/(ΣE)', 'velocity of the centre-of-momentum frame']]],
    ['Collisions and decays (7.4–7.9)', [
      ['s = m_a²c⁴ + m_b²c⁴ + 2m_bc²E_a', 'beam a on target b at rest'],
      ['E_th = ((Σm_f)² − m_a² − m_b²)c²/(2m_b)', 'threshold: products at rest in the CM frame'],
      ['p*c = √((M² − (m₁ + m₂)²)(M² − (m₁ − m₂)²))c²/(2M)', 'two-body decay at rest'],
      ['E₁ = (M² + m₁² − m₂²)c²/(2M)', 'energy of daughter 1'],
      ["E′ = E/(1 + (E/mc²)(1 − cos θ)),  λ′ − λ = (h/mc)(1 − cos θ)", 'Compton scattering'],
      ['forbidden: e + γ → e,  e⁺e⁻ → γ,  M → M + m', 'check with invariant mass']]],
    ['Force (7.6)', [
      ['F = dp/dt', 'definition'],
      ['a = (F − (F·u)u/c²)/(γm)', 'acceleration from force'],
      ['a∥ = F∥/(γ³m),  a⊥ = F⊥/(γm)', '"longitudinal / transverse mass"'],
      ['u(t) = Ft/√(m² + F²t²/c²)', 'constant force from rest (momentum p = Ft)'],
      ['x(t) = (mc²/F)(√(1 + (Ft/mc)²) − 1)', 'hyperbolic motion']]],
    ['Uniform acceleration (ch. 8)', [
      ['t = (c/g) sinh(gτ/c),  x = (c²/g)(cosh(gτ/c) − 1)', 'from rest at the origin'],
      ['u = c·tanh(gτ/c),  γ = cosh(gτ/c)', 'rapidity grows linearly with proper time'],
      ['horizon: x = ct − c²/g', 'light sent after t = c/g from the start never arrives'],
      ['ct = ξ sinh η,  x = ξ cosh η', 'Rindler coordinates; observer ξ has proper acceleration c²/ξ'],
      ['τ(ξ) = ξη/c', 'proper time of the observer at ξ: clocks higher up run faster'],
      ['rate_top / rate_bottom = 1 + gh/c²', 'gravitational time dilation; light sent up arrives redshifted by this factor'],
      ['g_front = g/(1 + gL/c²)', 'Born-rigid rocket of length L'],
      ['Δτ = (c/g) ln 2', 'hungry astronaut: last moment to rescue the dropped sausage']]],
    ['Useful numbers', [
      ['c = 299 792 458 m/s', '1 ly/yr = c'],
      ['1 g = 9.81 m/s² ≈ 1.03 ly/yr²', 'c/g ≈ 0.97 yr, c²/g ≈ 0.97 ly'],
      ['m_e c² = 0.511 MeV,  m_μ c² = 105.66 MeV', 'electron, muon'],
      ['m_p c² = 938.27 MeV,  m_n c² = 939.57 MeV', 'proton, neutron'],
      ['m_π± c² = 139.57 MeV,  m_π⁰ c² = 134.98 MeV,  m_K± c² = 493.68 MeV', 'mesons'],
      ['τ_μ = 2.197 μs', 'muon lifetime at rest'],
      ['h/(m_e c) = 2.426 pm,  ħc = 197.33 MeV·fm', 'Compton wavelength']]]
  ];

  SR.modules.push({
    id: 'formulas', order: 11, title: '11 · Formula sheet', doc: true, tip: 'All the key formulas on one page (c kept explicit)',
    init(panel) {
      const inner = ui.el('div', { class: 'doc-inner', style: { maxWidth: '1400px' } });
      panel.append(inner);
      inner.append(ui.el('h2', { text: 'Formula sheet' }));
      ui.note(inner, 'Equation numbers refer to the script. The sandbox itself uses c = 1 (t means ct, velocities are fractions of c).', 'small');
      const grid = ui.el('div', { class: 'fgrid' }); inner.append(grid);
      SHEET.forEach(([title, rows]) => {
        const card = ui.el('div', { class: 'fcard' });
        card.append(ui.el('h3', { text: title }));
        const tbl = ui.el('table');
        rows.forEach(([fo, note]) => tbl.append(ui.el('tr', {}, ui.el('td', { class: 'f', text: fo }), ui.el('td', { text: note }))));
        card.append(tbl);
        grid.append(card);
      });
      ui.buttons(inner, [{ label: 'Print this sheet', onClick: () => window.print() }]);
    }
  });
})();
