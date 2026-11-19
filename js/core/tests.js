/* ==========================================================================
   tests.js  -  self-checks of the physics core. Run by tests.html and by the
   app footer (so a broken formula is visible immediately).
   ========================================================================== */
(function (root) {
  'use strict';
  const SR = root.SR;
  const P = SR.phys, v3 = P.v3, m4 = P.m4;

  function rng(seed) {           // deterministic pseudo-random numbers
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  const rand = rng(12345);
  const r = (a, b) => a + (b - a) * rand();
  const randVel = (max) => {    // random 3-velocity with |v| < max, in the xy-plane unless 3d
    const th = r(0, 2 * Math.PI), ph = r(-1, 1), sp = r(0, max);
    const s = Math.sqrt(1 - ph * ph);
    return [sp * s * Math.cos(th), sp * s * Math.sin(th), sp * ph];
  };
  const close = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-9) * Math.max(1, Math.abs(a), Math.abs(b));
  const closeV = (a, b, tol) => a.every((x, i) => close(x, b[i], tol));

  const T = [];
  function test(name, ref, fn) { T.push({ name, ref, fn }); }

  test('Interval is invariant under 1+1 boosts', '1.14', () => {
    for (let i = 0; i < 200; i++) {
      const V = r(-0.999, 0.999), t = r(-10, 10), x = r(-10, 10);
      const [tp, xp] = P.boost(V, t, x);
      if (!close(t * t - x * x, tp * tp - xp * xp, 1e-9)) return [false, `V=${V}`];
    }
    return [true, '200 random events'];
  });
  test('Boost by V then by -V is the identity', '1.8', () => {
    for (let i = 0; i < 100; i++) {
      const V = r(-0.99, 0.99), t = r(-5, 5), x = r(-5, 5);
      const [a, b] = P.boost(V, t, x), [c, d] = P.unboost(V, a, b);
      if (!close(c, t) || !close(d, x)) return [false, ''];
    }
    return [true, ''];
  });
  test('Collinear composition = adding rapidities', '2.12 ex.', () => {
    for (let i = 0; i < 100; i++) {
      const u = r(-0.99, 0.99), v = r(-0.99, 0.99);
      if (!close(P.rapidity(P.addVelocities(u, v)), P.rapidity(u) + P.rapidity(v), 1e-8)) return [false, ''];
    }
    return [true, ''];
  });
  test('Light moves at c in every frame (eq. 2.15)', '2.15', () => {
    for (let i = 0; i < 50; i++) {
      const V = r(-0.99, 0.99);
      if (!close(P.transformVelocity(1, V), 1) || !close(P.transformVelocity(-1, V), -1)) return [false, ''];
    }
    return [true, ''];
  });
  test('Superluminal wave: infinitely fast for V = 1/v, sign flips beyond (Fig. 2.12)', '2.10', () => {
    const v = 1.5;
    const a = P.transformVelocity(v, 1 / v - 1e-6), b = P.transformVelocity(v, 1 / v + 1e-6);
    return [a > 1e5 && b < -1e5, `v'=${a.toExponential(2)} then ${b.toExponential(2)}`];
  });
  test('3D boost: interval invariant, inverse correct', '3.5', () => {
    for (let i = 0; i < 100; i++) {
      const V = randVel(0.99), x = [r(-3, 3), r(-3, 3), r(-3, 3), r(-3, 3)];
      const L = P.boostMatrix(V), xp = m4.vec(L, x);
      if (!close(P.mdot(x, x), P.mdot(xp, xp), 1e-9)) return [false, 'interval'];
      const back = m4.vec(m4.lorentzInverse(L), xp);
      if (!closeV(back, x, 1e-9)) return [false, 'inverse'];
    }
    return [true, ''];
  });
  test('Velocity transformation (3.6) = four-velocity transformation', '3.6', () => {
    for (let i = 0; i < 100; i++) {
      const v = randVel(0.99), V = randVel(0.99);
      const U = m4.vec(P.boostMatrix(V), P.fourVelocity(v));
      const viaU = [U[1] / U[0], U[2] / U[0], U[3] / U[0]];
      if (!closeV(viaU, P.transformVelocity3(v, V), 1e-9)) return [false, ''];
    }
    return [true, ''];
  });
  test('Transverse velocity (2.14): v=(0,u) -> v\'=(-V, u/gamma)', '2.14', () => {
    const u = 0.6, V = 0.8, vp = P.transformVelocity3([0, u, 0], [V, 0, 0]);
    return [closeV(vp, [-V, u / P.gamma(V), 0]), `v'=(${vp[0].toFixed(3)}, ${vp[1].toFixed(3)})`];
  });
  test('Two boosts = boost * pure rotation (Thomas-Wigner, eq. 3.9)', '3.2', () => {
    for (let i = 0; i < 100; i++) {
      const V = randVel(0.95), vp = randVel(0.95), d = P.composeBoosts(V, vp);
      const R = d.R4;
      if (!close(R[0][0], 1, 1e-8) || Math.abs(R[0][1]) + Math.abs(R[1][0]) + Math.abs(R[0][2]) > 1e-8) return [false, 'not a rotation'];
      // velocity of W relative to A must equal vp "added" on top of V
      if (!closeV(d.v, P.transformVelocity3(vp, v3.neg(V)), 1e-8)) return [false, 'velocity'];
    }
    return [true, ''];
  });
  test('Wigner angle: matrix decomposition = closed formula', '3.2', () => {
    let worst = 0;
    for (let i = 0; i < 200; i++) {
      const V = randVel(0.95), vp = randVel(0.95), d = P.composeBoosts(V, vp);
      worst = Math.max(worst, Math.abs(d.angle - P.wignerAngleFormula(V, vp)));
    }
    return [worst < 1e-7, `max error ${worst.toExponential(1)} rad`];
  });
  test('No Wigner rotation for collinear boosts', '3.5 Q', () => {
    const d = P.composeBoosts([0.6, 0, 0], [0.7, 0, 0]);
    return [Math.abs(d.angle) < 1e-12, ''];
  });
  test('Hardest problem: one-line formula (7.11) recovers the relative velocity', '7.3', () => {
    for (let i = 0; i < 200; i++) {
      const V = randVel(0.95), v = randVel(0.95), vp = P.transformVelocity3(v, V);
      if (!closeV(P.relativeVelocityCorrect(v, vp), V, 1e-7)) return [false, ''];
    }
    return [true, '200 random Witches'];
  });
  test('Correct relative velocity is antisymmetric in (v, v\')', '3.4', () => {
    for (let i = 0; i < 50; i++) {
      const v = randVel(0.95), vp = randVel(0.95);
      if (!closeV(P.relativeVelocityCorrect(v, vp), v3.neg(P.relativeVelocityCorrect(vp, v)), 1e-9)) return [false, ''];
    }
    return [true, ''];
  });
  test('Naive formula (3.7) is NOT antisymmetric (that is the point of sec. 3.2)', '3.7', () => {
    const v = [0.6, 0, 0], vp = [0, 0.6, 0];
    const a = P.relativeVelocityNaive(v, vp), b = P.relativeVelocityNaive(vp, v);
    return [!closeV(a, v3.neg(b), 1e-3), `V(v,v')=(${a[0].toFixed(3)},${a[1].toFixed(3)}), V(v',v)=(${b[0].toFixed(3)},${b[1].toFixed(3)})`];
  });
  test('Identity (7.11) holds for an arbitrary four-vector', '7.11', () => {
    for (let i = 0; i < 100; i++) {
      const V = randVel(0.95), A = [r(-3, 3), r(-3, 3), r(-3, 3), r(-3, 3)], Ap = m4.vec(P.boostMatrix(V), A);
      const lhs = [1, 2, 3].map(k => (A[k] - Ap[k]) / (A[0] + Ap[0]));
      const rhs = v3.scale(V, 1 / (1 + Math.sqrt(1 - v3.dot(V, V))));
      if (Math.abs(A[0] + Ap[0]) > 1e-3 && !closeV(lhs, rhs, 1e-7)) return [false, ''];
    }
    return [true, ''];
  });
  test('Thomas precession: composing 4000 tiny boosts per orbit gives -2pi(gamma-1)', '3.14', () => {
    const out = [];
    for (const b of [0.3, 0.6, 0.9]) {
      const num = P.thomasNumeric(b, 4000, 1), th = -P.thomasAnglePerOrbit(b);
      if (Math.abs(num - th) > 2e-3 * Math.abs(th) + 1e-6) return [false, `beta=${b}: ${num} vs ${th}`];
      out.push(`${b}: ${(num * 180 / Math.PI).toFixed(2)} deg`);
    }
    return [true, out.join(', ')];
  });
  test('Thomas rate (3.13) integrated over one orbit = 2pi(gamma-1)', '3.13', () => {
    const b = 0.7, R = 1, v = [0, b, 0], a = [-b * b / R, 0, 0];
    const w = v3.norm(P.thomasOmega(v, a)) * (2 * Math.PI * R / b);
    return [close(w, P.thomasAnglePerOrbit(b), 1e-12), ''];
  });
  test('Twin paradox: (0,0)->(5,4)->(10,0) has proper time 6', '2.11', () => {
    const wl = new P.Worldline([[0, 0], [5, 4], [10, 0]]);
    return [close(wl.tauEnd(), 6), `tau = ${wl.tauEnd()}`];
  });
  test('Constant proper acceleration: exact hyperbola', '8.2', () => {
    const a = 1.3, wl = P.tripFromPhases([{ tau: 2, a }], { dtau: 0.1 });
    const e = wl.pts[wl.pts.length - 1];
    return [close(e[0], P.hyper.tOfTau(2, a), 1e-12) && close(e[1], P.hyper.xOfTau(2, a), 1e-12), ''];
  });
  test('Worldline intersection with a tilted "now" line', 'tool', () => {
    const wl = P.uniform(0, 0, { tmin: -10, tmax: 10 });      // clock at rest at x=0
    const V = 0.6, g = P.gamma(V), hit = wl.intersect(g, -g * V, 2);   // t' = 2
    return [close(hit.t, 2 / g) && close(hit.tau, 2 / g), `t = ${hit.t.toFixed(4)}`];
  });
  test('pi+ -> mu+ nu: muon momentum 29.79 MeV', '7.4', () => {
    const d = P.decay2(139.570, 105.658, 0);
    return [Math.abs(d.p - 29.79) < 0.01, `p = ${d.p.toFixed(3)} MeV`];
  });
  test('p p -> p p p pbar threshold: K = 6 m_p', '7.9', () => {
    const m = 938.272, th = P.thresholdFixedTarget(m, m, 4 * m);
    return [close(th.K, 6 * m, 1e-12), ''];
  });
  test('Elastic 1D collision conserves E and p', '7.4', () => {
    for (let i = 0; i < 50; i++) {
      const m1 = r(0.1, 3), m2 = r(0.1, 3), u1 = r(-0.95, 0.95), u2 = r(-0.95, 0.95);
      const o = P.elastic1D(m1, u1, m2, u2);
      const E0 = m1 * P.gamma(u1) + m2 * P.gamma(u2), E1 = m1 * P.gamma(o.w1) + m2 * P.gamma(o.w2);
      const p0 = m1 * P.gamma(u1) * u1 + m2 * P.gamma(u2) * u2, p1 = m1 * P.gamma(o.w1) * o.w1 + m2 * P.gamma(o.w2) * o.w2;
      if (!close(E0, E1, 1e-9) || !close(p0, p1, 1e-9)) return [false, ''];
    }
    return [true, ''];
  });
  test('Sticky collision: two masses m at +-v form M = 2 gamma m', '7.5', () => {
    const o = P.merge1D(1, 0.6, 1, -0.6);
    return [close(o.M, 2 * P.gamma(0.6)) && Math.abs(o.V) < 1e-15, `M = ${o.M}`];
  });
  test('Force vs acceleration: a_par = F/(g^3 m), a_perp = F/(g m)', '7.6', () => {
    const v = [0.8, 0, 0], g = P.gamma(0.8);
    const aPar = P.accelerationFromForce([1, 0, 0], v, 1), aPerp = P.accelerationFromForce([0, 1, 0], v, 1);
    return [close(aPar[0], 1 / (g * g * g)) && close(aPerp[1], 1 / g), ''];
  });
  test('Compton: no shift forward, maximal backward', '7.7', () => {
    const m = 0.511, E = 1;
    return [close(P.compton(E, m, 0), E) && close(P.compton(E, m, Math.PI), E / (1 + 2 * E / m)), ''];
  });
  test('Doppler (6.1): transverse = 1/gamma, head-on = sqrt((1+b)/(1-b))', '6.1', () => {
    const b = 0.6;
    return [close(P.dopplerFactor(b, 0), 1 / P.gamma(b)) && close(P.dopplerFactor(b, 1), P.dopplerLongitudinal(b)), ''];
  });
  test('Aberration keeps light at c and matches photon four-momentum', '6.4', () => {
    for (let i = 0; i < 50; i++) {
      const s = v3.unit(randVel(1)), b = r(0, 0.99), o = P.aberrateStar(s, b);
      if (!close(v3.norm(o.s), 1, 1e-12)) return [false, 'norm'];
      // incoming photon momentum k = -s, energy 1; boost to frame moving with +b x
      const k4 = m4.vec(P.boostMatrix([b, 0, 0]), [1, -s[0], -s[1], -s[2]]);
      if (!close(k4[0], o.D, 1e-9) || !closeV([-k4[1] / k4[0], -k4[2] / k4[0], -k4[3] / k4[0]], o.s, 1e-9)) return [false, 'D'];
    }
    return [true, ''];
  });
  test('Fresnel drag (6.2): n=1 gives c; V=-1/n stops light', '6.2', () => {
    return [close(P.lightInMedium(1, 0.3), 1) && Math.abs(P.lightInMedium(1.5, -1 / 1.5)) < 1e-12, ''];
  });
  test('100 rockets at 0.9c each: 1 - v ~ 10^-128', '2.12 ex.', () => {
    const l = P.log10OneMinusTanh(100 * Math.atanh(0.9));
    return [l < -127 && l > -129, `log10(1-v) = ${l.toFixed(2)}`];
  });
  test('Rindler coordinates round trip', '8.6', () => {
    const [t, x] = P.rindler.toMinkowski(0.7, 2.1), b = P.rindler.fromMinkowski(t, x);
    return [close(b.eta, 0.7) && close(b.xi, 2.1), ''];
  });
  test('Frame where a spacelike pair is simultaneous: V = dt/dx', '2.11 Q', () => {
    const A = { t: 0, x: 0 }, B = { t: 1, x: 3 }, a = P.pairAnalysis(A, B);
    const [tA] = P.boost(a.Vsim, A.t, A.x), [tB] = P.boost(a.Vsim, B.t, B.x);
    return [close(tA, tB, 1e-12), `V = ${a.Vsim.toFixed(4)}`];
  });
  test('Cable paradox: magnetic force V^2 in the lab, electric gamma*V^2 in the electron frame, F*gamma_u invariant', '2.5', () => {
    const V = 0.5, g = P.gamma(V);
    const lab = P.cableForce(V, 0), el = P.cableForce(V, V);
    if (!close(lab.Fout, -V * V) || Math.abs(lab.Felec) > 1e-12) return [false, 'lab'];
    if (!close(el.Fout, -g * V * V) || Math.abs(el.Fmag) > 1e-12) return [false, 'electron frame'];
    for (let i = 0; i < 50; i++) {
      const Vv = r(-0.95, 0.95), c = P.cableForce(V, Vv);
      if (!close(c.Fout * P.gamma(c.u), -g * V * V, 1e-9)) return [false, 'Vv=' + Vv];
    }
    return [true, `lab ${lab.Fout.toFixed(4)}, electron frame ${el.Fout.toFixed(4)}`];
  });
  test('Galilean matrix gives x\' = x - Vt; Euclidean one preserves t^2 + x^2', '1.6 ex.', () => {
    const G = P.frameMatrix(0.5, 'galilean'), E = P.frameMatrix(0.5, 'euclid');
    const [tg, xg] = P.apply2(G, 2, 3), [te, xe] = P.apply2(E, 2, 3);
    return [close(tg, 2) && close(xg, 2) && close(te * te + xe * xe, 13), ''];
  });

  SR.runTests = function () {
    const out = [];
    for (const t of T) {
      let ok = false, detail = '';
      try { const res = t.fn(); ok = !!res[0]; detail = res[1] || ''; }
      catch (e) { ok = false; detail = 'exception: ' + e.message; }
      out.push({ name: t.name, ref: t.ref, ok, detail });
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
