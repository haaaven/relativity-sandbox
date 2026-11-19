/* ==========================================================================
   physics.js  -  the special-relativity core of the sandbox.
   Units: c = 1 everywhere (t means ct, velocities are beta = v/c).
   Lab frame S has coordinates (t, x, y, z). A frame S' moving with velocity
   V relative to S is reached with the passive Lorentz transformation
       t' = g (t - V x),  x' = g (x - V t)          (Dragan eq. 1.7)
   Every function here is pure math; the UI lives elsewhere.
   ========================================================================== */
(function (root) {
  'use strict';
  const P = {};
  const EPS = 1e-12;

  /* ---------------------------------------------------------------- scalars */
  P.gamma = b => 1 / Math.sqrt(1 - b * b);
  P.rapidity = b => Math.atanh(b);
  P.velocityFromRapidity = phi => Math.tanh(phi);
  /** composition of collinear velocities: u (+) v  */
  P.addVelocities = (u, v) => (u + v) / (1 + u * v);
  /** velocity of an object (velocity v in S) seen from S' moving with V. eq. (2.13).
   *  v may be superluminal (Mexican waves, laser spots); V must satisfy |V|<1. */
  P.transformVelocity = (v, V) => {
    if (!isFinite(v)) return -1 / V;           // infinitely fast wave -> -1/V (c^2/V)
    const d = 1 - v * V;
    if (Math.abs(d) < 1e-15) return (v - V) >= 0 ? Infinity : -Infinity;
    return (v - V) / d;
  };
  /** n successive boosts, each with beta relative to the previous one (rapidities add) */
  P.chainVelocity = (beta, n) => Math.tanh(n * Math.atanh(beta));
  /** log10(1 - tanh(x)) without catastrophic cancellation */
  P.log10OneMinusTanh = x => (x > 15)
    ? Math.log10(2) - 2 * x / Math.LN10 - Math.log10(1 + Math.exp(-2 * x))
    : Math.log10(1 - Math.tanh(x));
  /** speed of light in a medium of index n moving with V (along the light). eq. (6.2) */
  P.lightInMedium = (n, V) => (1 / n + V) / (1 + V / n);

  /* ---------------------------------------------------------- 1+1 boosts */
  P.boost = (V, t, x) => { const g = P.gamma(V); return [g * (t - V * x), g * (x - V * t)]; };
  P.unboost = (V, t, x) => P.boost(-V, t, x);
  /** 2x2 matrix acting on column [t, x] (lab -> frame). kind: lorentz|galilean|euclid */
  P.frameMatrix = (V, kind) => {
    if (kind === 'galilean') return [[1, 0], [-V, 1]];
    if (kind === 'euclid') {   // ordinary rotation with the t'-axis along x = V t
      const a = Math.atan(V), c = Math.cos(a), s = Math.sin(a);
      return [[c, s], [-s, c]];
    }
    const g = P.gamma(V);
    return [[g, -g * V], [-g * V, g]];
  };
  P.inv2 = M => {
    const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
    return [[M[1][1] / det, -M[0][1] / det], [-M[1][0] / det, M[0][0] / det]];
  };
  P.mul2 = (A, B) => [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
  P.apply2 = (M, t, x) => [M[0][0] * t + M[0][1] * x, M[1][0] * t + M[1][1] * x];

  /* -------------------------------------------------- interval & causality */
  P.interval2 = (dt, dx, dy, dz) => dt * dt - dx * dx - (dy || 0) * (dy || 0) - (dz || 0) * (dz || 0);
  P.classify = (s2, scale) => {
    const tol = 1e-9 * Math.max(1, scale || 1);
    return s2 > tol ? 'timelike' : (s2 < -tol ? 'spacelike' : 'null');
  };
  /** analysis of an event pair (A -> B) in 1+1 */
  P.pairAnalysis = (A, B) => {
    const dt = B.t - A.t, dx = B.x - A.x;
    const s2 = dt * dt - dx * dx;
    const type = P.classify(s2, dt * dt + dx * dx);
    const r = { dt, dx, s2, type };
    if (type === 'timelike') { r.tau = Math.sqrt(s2); r.Vsame = dx / dt; }
    if (type === 'spacelike') { r.sigma = Math.sqrt(-s2); r.Vsim = dt / dx; }
    return r;
  };

  /* ------------------------------------------------------------ worldlines */
  /** Piecewise-linear worldline in lab coordinates: pts = [[t, x], ...] with increasing t.
   *  opts.tau0: proper time at the first vertex; opts.tau: explicit proper time per vertex
   *  (used for smooth curves sampled exactly); opts.flags: one tag per segment. */
  function Worldline(pts, opts) {
    opts = opts || {};
    this.pts = pts;
    this.flags = opts.flags || null;
    if (opts.tau) { this.tau = opts.tau.slice(); }
    else {
      this.tau = new Array(pts.length);
      let tau = opts.tau0 || 0;
      this.tau[0] = tau;
      for (let i = 1; i < pts.length; i++) {
        const dt = pts[i][0] - pts[i - 1][0], dx = pts[i][1] - pts[i - 1][1];
        tau += Math.sqrt(Math.max(0, dt * dt - dx * dx));
        this.tau[i] = tau;
      }
    }
  }
  /** first event where a*t + b*x = T  (a,b = first row of a frame matrix -> "frame time = T") */
  Worldline.prototype.intersect = function (a, b, T) {
    const p = this.pts;
    let f0 = a * p[0][0] + b * p[0][1] - T;
    for (let i = 1; i < p.length; i++) {
      const f1 = a * p[i][0] + b * p[i][1] - T;
      if ((f0 <= 0 && f1 >= 0) || (f0 >= 0 && f1 <= 0)) {
        const s = (f1 === f0) ? 0 : f0 / (f0 - f1);
        const t = p[i - 1][0] + s * (p[i][0] - p[i - 1][0]);
        const x = p[i - 1][1] + s * (p[i][1] - p[i - 1][1]);
        const dT = p[i][0] - p[i - 1][0];
        return {
          t, x, seg: i - 1, s,
          tau: this.tau[i - 1] + s * (this.tau[i] - this.tau[i - 1]),
          v: dT !== 0 ? (p[i][1] - p[i - 1][1]) / dT : 0,
          flag: this.flags ? this.flags[i - 1] : null
        };
      }
      f0 = f1;
    }
    return null;
  };
  Worldline.prototype.atLabTime = function (t) { return this.intersect(1, 0, t); };
  Worldline.prototype.atTau = function (tau) {
    const T = this.tau, p = this.pts;
    for (let i = 1; i < p.length; i++) {
      if (tau >= T[i - 1] - 1e-12 && tau <= T[i] + 1e-12 && T[i] > T[i - 1]) {
        const s = (tau - T[i - 1]) / (T[i] - T[i - 1]);
        const dT = p[i][0] - p[i - 1][0];
        return {
          t: p[i - 1][0] + s * dT, x: p[i - 1][1] + s * (p[i][1] - p[i - 1][1]), tau, seg: i - 1,
          v: dT !== 0 ? (p[i][1] - p[i - 1][1]) / dT : 0, flag: this.flags ? this.flags[i - 1] : null
        };
      }
    }
    return null;
  };
  Worldline.prototype.tauStart = function () { return this.tau[0]; };
  Worldline.prototype.tauEnd = function () { return this.tau[this.tau.length - 1]; };
  Worldline.prototype.ticks = function (dtau) {
    const out = [];
    const k0 = Math.ceil(this.tau[0] / dtau - 1e-9), k1 = Math.floor(this.tauEnd() / dtau + 1e-9);
    if (k1 - k0 > 4000) return out;
    for (let k = k0; k <= k1; k++) { const e = this.atTau(k * dtau); if (e) out.push(e); }
    return out;
  };
  P.Worldline = Worldline;
  /** uniform motion x = x0 + v t; clock synchronised in its own rest frame (reads g(t - v x)) */
  P.uniform = (x0, v, opts) => {
    opts = opts || {};
    const t0 = opts.tmin !== undefined ? opts.tmin : -1e4, t1 = opts.tmax !== undefined ? opts.tmax : 1e4;
    const g = P.gamma(v);
    const tau0 = opts.tau0 !== undefined ? opts.tau0 : (t0 / g - g * v * x0) + (opts.offset || 0);
    return new Worldline([[t0, x0 + v * t0], [t1, x0 + v * t1]], { tau0, flags: opts.flags });
  };
  /** convert a list of events given in frame V ([t', x']) to lab coordinates */
  P.fromFrame = (V, pts) => pts.map(q => P.unboost(V, q[0], q[1]));

  /** worldline built from phases of constant proper acceleration, starting at rest.
   *  phases: [{tau, a, flag}] ; integrates exactly (rapidity is linear in proper time). */
  P.tripFromPhases = (phases, opt) => {
    opt = opt || {};
    const dtau = opt.dtau || 0.02;
    let t = opt.t0 || 0, x = opt.x0 || 0, phi = opt.phi0 || 0, tau = 0;
    const pts = [[t, x]], taus = [0], flags = [], phis = [phi];
    for (const ph of phases) {
      const n = Math.max(1, Math.ceil(ph.tau / dtau)), h = ph.tau / n;
      for (let i = 0; i < n; i++) {
        const phi1 = phi + ph.a * h;
        if (Math.abs(ph.a) > 1e-12) {
          t += (Math.sinh(phi1) - Math.sinh(phi)) / ph.a;
          x += (Math.cosh(phi1) - Math.cosh(phi)) / ph.a;
        } else { t += Math.cosh(phi) * h; x += Math.sinh(phi) * h; }
        phi = phi1; tau += h;
        pts.push([t, x]); taus.push(tau); flags.push(ph.flag || null); phis.push(phi);
      }
    }
    const wl = new Worldline(pts, { tau: taus, flags });
    wl.phis = phis;
    return wl;
  };

  /* ---------------------------------------------------------- 3-vectors */
  const v3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm: a => Math.hypot(a[0], a[1], a[2]),
    neg: a => [-a[0], -a[1], -a[2]],
    unit: a => { const n = Math.hypot(a[0], a[1], a[2]); return n > 0 ? [a[0] / n, a[1] / n, a[2] / n] : [0, 0, 0]; }
  };
  P.v3 = v3;
  P.gammaVec = v => 1 / Math.sqrt(1 - v3.dot(v, v));

  /* ------------------------------------------------- 4x4 Lorentz matrices */
  const m4 = {
    identity: () => [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
    mul: (A, B) => {
      const C = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        let s = 0; for (let k = 0; k < 4; k++) s += A[i][k] * B[k][j]; C[i][j] = s;
      }
      return C;
    },
    vec: (A, x) => [0, 1, 2, 3].map(i => A[i][0] * x[0] + A[i][1] * x[1] + A[i][2] * x[2] + A[i][3] * x[3]),
    /** inverse of a Lorentz matrix: eta L^T eta */
    lorentzInverse: L => {
      const s = [1, -1, -1, -1], R = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) R[i][j] = s[i] * s[j] * L[j][i];
      return R;
    }
  };
  P.m4 = m4;
  /** passive boost to a frame moving with velocity V (3-vector). Dragan eq. (3.5). */
  P.boostMatrix = V => {
    const b2 = v3.dot(V, V);
    if (b2 < EPS) return m4.identity();
    const g = 1 / Math.sqrt(1 - b2);
    const L = [[g, -g * V[0], -g * V[1], -g * V[2]], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    for (let i = 0; i < 3; i++) {
      L[i + 1][0] = -g * V[i];
      for (let j = 0; j < 3; j++) L[i + 1][j + 1] = (i === j ? 1 : 0) + (g - 1) * V[i] * V[j] / b2;
    }
    return L;
  };
  /** velocity of an object (velocity v in S) as measured in S' moving with V. eq. (3.6).
   *  Works for superluminal v as well. */
  P.transformVelocity3 = (v, V) => {
    const V2 = v3.dot(V, V);
    if (V2 < EPS) return v.slice();
    const g = 1 / Math.sqrt(1 - V2), vV = v3.dot(v, V);
    const vpar = v3.scale(V, vV / V2), vperp = v3.sub(v, vpar);
    return v3.scale(v3.add(v3.scale(vperp, 1 / g), v3.sub(vpar, V)), 1 / (1 - vV));
  };
  /** axis-angle of a 3x3 rotation matrix (acting on coordinates) */
  P.axisAngle = R => {
    const tr = R[0][0] + R[1][1] + R[2][2];
    const angle = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
    let axis = [R[2][1] - R[1][2], R[0][2] - R[2][0], R[1][0] - R[0][1]];
    const n = v3.norm(axis);
    axis = n > 1e-14 ? v3.scale(axis, 1 / n) : [0, 0, 1];
    return { angle, axis };
  };
  /** split a proper orthochronous Lorentz matrix as L = R * B(v)  (Dragan eq. 3.9).
   *  v = velocity of the new frame relative to the old one, R = residual (Wigner) rotation. */
  P.decomposeLorentz = L => {
    const v = [-L[0][1] / L[0][0], -L[0][2] / L[0][0], -L[0][3] / L[0][0]];
    const R4 = m4.mul(L, P.boostMatrix(v3.neg(v)));
    const R = [[R4[1][1], R4[1][2], R4[1][3]], [R4[2][1], R4[2][2], R4[2][3]], [R4[3][1], R4[3][2], R4[3][3]]];
    const aa = P.axisAngle(R);
    // signed angle of the coordinate rotation about +z (planar problems)
    const angleZ = Math.atan2(R[1][0] - R[0][1], R[0][0] + R[1][1]);
    return { v, R, R4, angle: aa.angle, axis: aa.axis, angleZ };
  };
  /** A -> B (B moves with V w.r.t. A) followed by B -> W (W moves with vp w.r.t. B).
   *  Returns the composite L = B(vp) B(V) = R B(v), with v = W's velocity w.r.t. A. */
  P.composeBoosts = (V, vp) => {
    const L = m4.mul(P.boostMatrix(vp), P.boostMatrix(V));
    const d = P.decomposeLorentz(L);
    d.L = L;
    return d;
  };
  /** closed-form Thomas-Wigner angle for the same composition (unsigned) */
  P.wignerAngleFormula = (V, vp) => {
    const g1 = P.gammaVec(V), g2 = P.gammaVec(vp), g = g1 * g2 * (1 + v3.dot(V, vp));
    const c = (1 + g + g1 + g2) * (1 + g + g1 + g2) / ((1 + g) * (1 + g1) * (1 + g2)) - 1;
    return Math.acos(Math.max(-1, Math.min(1, c)));
  };
  /** "The hardest problem" (sec. 3.2/7.3): Alice sees the Witch at v, Bob sees her at vp.
   *  Bob's velocity w.r.t. Alice:  V/(1+sqrt(1-V^2)) = (u - u')/(u0 + u0')  (eq. 7.11). */
  P.relativeVelocityCorrect = (v, vp) => {
    const g = P.gammaVec(v), gp = P.gammaVec(vp);
    const W = v3.scale(v3.sub(v3.scale(v, g), v3.scale(vp, gp)), 1 / (g + gp));
    return v3.scale(W, 2 / (1 + v3.dot(W, W)));
  };
  /** the tempting but wrong answer, eq. (3.7): pretend W's frame is a pure boost from both */
  P.relativeVelocityNaive = (v, vp) => P.transformVelocity3(v3.neg(vp), v3.neg(v));
  /** Thomas precession */
  P.thomasAnglePerOrbit = beta => 2 * Math.PI * (P.gamma(beta) - 1);
  /** angular velocity (lab time) for velocity v and acceleration a, eq. (3.13): (g^2/(g+1)) a x v */
  P.thomasOmega = (v, a) => { const g = P.gammaVec(v); return v3.scale(v3.cross(a, v), g * g / (g + 1)); };
  /** numerically compose N tiny boosts around a counter-clockwise circular orbit
   *  (Fermi-Walker transport: each step is a pure boost in the body's own frame).
   *  Each step gives a coordinate rotation R (x_new = R x_pureboost); summing their angles
   *  gives theta, and the gyroscope axis, seen against lab-aligned axes, turns by -theta.
   *  Returns that physical gyroscope angle (negative = retrograde). */
  P.thomasNumeric = (beta, N, turns) => {
    N = N || 2000; turns = turns || 1;
    let total = 0;
    let vPrev = [0, beta, 0];
    const steps = Math.round(N * turns);
    for (let k = 1; k <= steps; k++) {
      const th = 2 * Math.PI * k / N;
      const v = [-beta * Math.sin(th), beta * Math.cos(th), 0];
      const w = P.transformVelocity3(v, vPrev);          // new velocity seen from the old rest frame
      const d = P.composeBoosts(vPrev, w);               // B(w) B(vPrev) = R B(v)
      total += d.angleZ;
      vPrev = v;
    }
    return -total;
  };

  /* -------------------------------------------------------- four-vectors */
  P.mdot = (a, b) => a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3];
  P.fourVelocity = v => { const g = P.gammaVec(v); return [g, g * v[0], g * v[1], g * v[2]]; };
  P.fourMomentum = (m, v) => P.fourVelocity(v).map(c => c * m);
  P.sum4 = list => list.reduce((s, a) => [s[0] + a[0], s[1] + a[1], s[2] + a[2], s[3] + a[3]], [0, 0, 0, 0]);
  /** invariant mass; negative return value means spacelike total (tachyonic, |m| imaginary) */
  P.mass4 = p => { const m2 = P.mdot(p, p); return m2 >= 0 ? Math.sqrt(m2) : -Math.sqrt(-m2); };
  P.boost4 = (V, A) => m4.vec(P.boostMatrix(V), A);
  /** 1D energy-momentum helpers */
  P.Ep = {
    boost: (V, E, p) => { const g = P.gamma(V); return [g * (E - V * p), g * (p - V * E)]; },
    fromMassMomentum: (m2sign, m, p) => {    // m2sign = +1 ordinary, 0 photon, -1 tachyon
      if (m2sign < 0) return [Math.sign(p || 1) * Math.sqrt(Math.max(0, p * p - m * m)), p];
      return [Math.sqrt(p * p + (m2sign > 0 ? m * m : 0)), p];
    }
  };
  /** kinematics of a massive particle from any one known quantity */
  P.kinematics = (m, known) => {
    let g;
    if (known.v !== undefined) g = P.gamma(known.v);
    else if (known.gamma !== undefined) g = known.gamma;
    else if (known.K !== undefined) g = 1 + known.K / m;
    else if (known.E !== undefined) g = known.E / m;
    else if (known.p !== undefined) g = Math.sqrt(1 + (known.p / m) * (known.p / m));
    const v = Math.sqrt(Math.max(0, 1 - 1 / (g * g)));
    return { gamma: g, v, E: g * m, p: g * m * v, K: (g - 1) * m, rapidity: Math.acosh(g) };
  };
  /** two-body decay at rest: M -> m1 + m2 */
  P.decay2 = (M, m1, m2) => {
    if (M < m1 + m2 - 1e-12) return null;
    const p = Math.sqrt(Math.max(0, (M * M - (m1 + m2) * (m1 + m2)) * (M * M - (m1 - m2) * (m1 - m2)))) / (2 * M);
    const E1 = (M * M + m1 * m1 - m2 * m2) / (2 * M), E2 = (M * M + m2 * m2 - m1 * m1) / (2 * M);
    return { p, E1, E2, K1: E1 - m1, K2: E2 - m2, v1: p / E1, v2: p / E2 };
  };
  /** threshold for beam (mBeam) on fixed target (mTarget) producing particles with total rest mass S */
  P.thresholdFixedTarget = (mBeam, mTarget, S) => {
    const E = (S * S - mBeam * mBeam - mTarget * mTarget) / (2 * mTarget);
    return { E, K: E - mBeam, p: Math.sqrt(Math.max(0, E * E - mBeam * mBeam)) };
  };
  /** 1D elastic collision (solved in the CM frame, where velocities just reverse) */
  P.elastic1D = (m1, u1, m2, u2) => {
    const E = m1 * P.gamma(u1) + m2 * P.gamma(u2), p = m1 * P.gamma(u1) * u1 + m2 * P.gamma(u2) * u2;
    const Vcm = p / E;
    const c1 = P.transformVelocity(u1, Vcm), c2 = P.transformVelocity(u2, Vcm);
    return { Vcm, w1: P.addVelocities(-c1, Vcm), w2: P.addVelocities(-c2, Vcm) };
  };
  /** 1D perfectly inelastic collision: the lump's mass and velocity */
  P.merge1D = (m1, u1, m2, u2) => {
    const E = m1 * P.gamma(u1) + m2 * P.gamma(u2), p = m1 * P.gamma(u1) * u1 + m2 * P.gamma(u2) * u2;
    return { M: Math.sqrt(E * E - p * p), V: p / E, E, p };
  };
  /** Compton: photon energy E on a particle of mass m at rest, scattered by theta */
  P.compton = (E, m, theta) => E / (1 + (E / m) * (1 - Math.cos(theta)));
  /** acceleration produced by force F on a particle of mass m moving with v (dp/dt = F) */
  P.accelerationFromForce = (F, v, m) => {
    const g = P.gammaVec(v);
    return v3.scale(v3.sub(F, v3.scale(v, v3.dot(F, v))), 1 / (g * m));
  };

  /** Cable paradox (sec. 2.5). Ions at rest in the lab (proper spacing 1), electrons drifting
   *  with V (lab spacing 1, so neutral in the lab), test electron moving with the electrons.
   *  Everything evaluated in a frame moving with Vv. Units: charge density e/a, force
   *  e^2/(2 pi eps0 r a), c = 1. Returns densities, current and outward force on the test electron. */
  P.cableForce = (V, Vv) => {
    const gV = P.gamma(V), gVv = P.gamma(Vv);
    const u = P.transformVelocity(V, Vv), gu = P.gamma(u);
    const lamPlus = gVv, lamMinus = gu / gV, vIon = -Vv;
    const I = lamPlus * vIon - lamMinus * u;               // current (positive charges along +x)
    const Felec = -(lamPlus - lamMinus);                     // outward electric force on charge -e
    const Fmag = u * I;                                      // outward magnetic force on charge -e moving with u
    return { u, lamPlus, lamMinus, net: lamPlus - lamMinus, I, Felec, Fmag, Fout: Felec + Fmag };
  };

  /* -------------------------------------------------------------- optics */
  /** f_obs / f_src for a source moving with speed beta; theta = angle (observer frame,
   *  at emission) between the source velocity and the direction from source to observer. eq. (6.1) */
  P.dopplerFactor = (beta, cosTheta) => 1 / (P.gamma(beta) * (1 - beta * cosTheta));
  P.dopplerLongitudinal = beta => Math.sqrt((1 + beta) / (1 - beta));   // approaching source
  /** star direction s (unit vector observer->star) seen by an observer moving with beta along +x;
   *  returns new direction and the Doppler factor of the starlight. */
  P.aberrateStar = (s, beta) => {
    const g = P.gamma(beta), d = 1 + beta * s[0];
    return { s: [(s[0] + beta) / d, s[1] / (g * d), s[2] / (g * d)], D: g * d };
  };
  /** photon propagation direction k' in the rest frame of a body moving with +v (x) -> lab */
  P.lightDirToLab = (k, v) => {
    const g = P.gamma(v), d = 1 + v * k[0];
    return { k: [(k[0] + v) / d, k[1] / (g * d), k[2] / (g * d)], D: g * d };
  };

  /* ------------------------------------------- uniform acceleration (Ch. 8) */
  P.hyper = {   // proper acceleration a, start from rest at the origin at t = 0
    x: (t, a) => (Math.sqrt(1 + a * a * t * t) - 1) / a,
    v: (t, a) => a * t / Math.sqrt(1 + a * a * t * t),
    tau: (t, a) => Math.asinh(a * t) / a,
    tOfTau: (tau, a) => Math.sinh(a * tau) / a,
    xOfTau: (tau, a) => (Math.cosh(a * tau) - 1) / a,
    vOfTau: (tau, a) => Math.tanh(a * tau)
  };
  P.rindler = {
    toMinkowski: (eta, xi) => [xi * Math.sinh(eta), xi * Math.cosh(eta)],   // [t, x]
    fromMinkowski: (t, x) => (x > Math.abs(t)) ? { eta: Math.atanh(t / x), xi: Math.sqrt(x * x - t * t) } : null
  };

  /* ----------------------------------------------------- small utilities */
  P.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  P.EPS = EPS;

  root.SR = root.SR || {};
  root.SR.phys = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
