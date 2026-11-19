/* Tab 7 - optical effects (Dragan ch. 6): what a camera actually photographs (light-travel time +
   Lorentz contraction), the moving sphere, Doppler shift vs angle, aberration of starlight. c = 1. */
(function () {
  'use strict';
  const SR = window.SR, P = SR.phys, ui = SR.ui, C = SR.COLORS, f = ui.fmt, v3 = P.v3;

  /* -------- shapes in their rest frame: arrays of polylines of [x', y'] (plane z' = 0) */
  function circle(cx, cy, r, n) { const pts = []; for (let i = 0; i <= n; i++) { const a = 2 * Math.PI * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return pts; }
  function lineP(a, b, n) { const pts = []; for (let i = 0; i <= n; i++) pts.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); return pts; }
  const SHAPES = {
    circle: () => [circle(0, 0, 1, 240)],
    grid: () => {
      const out = [];
      for (let k = -4; k <= 4; k++) { out.push(lineP([-1, k / 4], [1, k / 4], 80)); out.push(lineP([k / 4, -1], [k / 4, 1], 80)); }
      return out;
    },
    bicycle: () => {
      const out = [circle(-0.85, -0.5, 0.5, 120), circle(0.85, -0.5, 0.5, 120)];
      for (let k = 0; k < 8; k++) { const a = Math.PI * k / 4; out.push(lineP([-0.85, -0.5], [-0.85 + 0.5 * Math.cos(a), -0.5 + 0.5 * Math.sin(a)], 20)); out.push(lineP([0.85, -0.5], [0.85 + 0.5 * Math.cos(a), -0.5 + 0.5 * Math.sin(a)], 20)); }
      const seat = [-0.3, 0.35], bar = [0.6, 0.45], crank = [0, -0.5];
      [[[-0.85, -0.5], crank], [crank, seat], [seat, [-0.85, -0.5]], [seat, [0.55, 0.15]], [crank, [0.55, 0.15]], [[0.55, 0.15], [0.85, -0.5]], [[0.55, 0.15], bar], [[-0.45, 0.35], [-0.15, 0.35]]]
        .forEach(([a, b]) => out.push(lineP(a, b, 40)));
      return out;
    }
  };

  /** light from a rest-frame point P' (relative to the body's centre, which moves with v along x and
   *  passes x = 0 at t = 0 at height z = d) reaching the camera at the origin at lab time to. */
  function emission(Pp, v, d, to) {
    const g = P.gamma(v);
    const Cp = [-g * v * to, 0, -d];                // camera position in the body frame at reception
    const tC = g * to;                              // reception time in the body frame
    const dist = Math.hypot(Cp[0] - Pp[0], Cp[1] - Pp[1], Cp[2] - Pp[2]);
    const te = tC - dist;                           // body at rest: light just needs the distance
    const t = g * (te + v * Pp[0]), x = g * (Pp[0] + v * te), y = Pp[1], z = d + Pp[2];
    const L = Math.hypot(x, y, z), nx = -x / L;     // unit vector source -> camera, x component
    return { t, x, y, z, D: 1 / (g * (1 - v * nx)), Cp };
  }
  function dopplerColor(D) {
    const s = Math.max(-1, Math.min(1, Math.log(D) / Math.log(3)));
    if (s >= 0) return `rgb(${Math.round(120 - 100 * s)},${Math.round(120 - 40 * s)},${Math.round(130 + 120 * s)})`;
    return `rgb(${Math.round(130 + 120 * -s)},${Math.round(120 - 60 * -s)},${Math.round(120 - 90 * -s)})`;
  }

  SR.modules.push({
    id: 'optics', order: 7, title: '7 · Optics', tip: 'What fast objects look like, Doppler effect, aberration (ch. 6)',
    init(panel) {
      const L = ui.layout(panel);
      const cA = L.canvas({ flex: '1.4 1 0', title: 'Camera at the origin looking at the plane of motion (distance d). Solid: photograph. Dashed: the actual (Lorentz-contracted) shape at the same lab time.' });
      const r2 = L.row({ flex: '1 1 0' });
      const cD = L.canvas({ parent: r2, title: 'Doppler factor f/f₀ vs direction (source moving →). Circle: no shift.' });
      const cS = L.canvas({ parent: r2, title: 'The whole sky seen from a moving ship (centre = straight ahead, rim = behind)' });
      const st = { shape: 'circle', v: 0.9, d: 0.5, to: 0.3, dopp: true, actual: true, rest: false, beta: 0.6, th: 60, sb: 0.6, nStars: 600 };

      /* ------------------------------------------------ camera view */
      const A = new SR.View2D(cA, { lockAspect: true });
      A.setBox(-4.5, 4.5, -2, 2);
      let sphereInfo = null;
      A.onRender = () => {
        const g = A, b = g.bounds();
        g.line(b.xmin, 0, b.xmax, 0, { color: '#f0f2f5' }); g.line(0, b.ymin, 0, b.ymax, { color: '#f0f2f5' });
        g.dot(0, 0, 3, '#57606a');
        g.text(0, 0, 'camera axis', { dx: 6, dy: 10, color: '#8c959f', font: '10.5px system-ui' });
        if (st.shape === 'sphere') { renderSphere(g); return; }
        const gm = P.gamma(st.v);
        SHAPES[st.shape]().forEach(poly => {
          // apparent image
          const pts = poly.map(q => { const e = emission([q[0], q[1], 0], st.v, st.d, st.to); return { p: [e.x, e.y], D: e.D }; });
          if (st.dopp) for (let i = 1; i < pts.length; i++) g.line(pts[i - 1].p[0], pts[i - 1].p[1], pts[i].p[0], pts[i].p[1], { color: dopplerColor(pts[i].D), width: 2.6 });
          else g.poly(pts.map(q => q.p), { color: '#1f6feb', width: 2.4 });
          if (st.actual) g.poly(poly.map(q => [q[0] / gm + st.v * st.to, q[1]]), { color: '#57606a', width: 1.2, dash: [5, 4] });
          if (st.rest) g.poly(poly.map(q => [q[0] + st.v * st.to, q[1]]), { color: '#bf8700', width: 1, dash: [2, 3] });
        });
        g.stext(8, 22, 'camera time t₀ = ' + f(st.to, 2) + '   (the centre of the object is actually at x = ' + f(st.v * st.to, 2) + ')' + (st.dopp ? '   colour: blue = blueshift, red = redshift' : ''), { bg: 'rgba(255,255,255,.85)', font: '11.5px system-ui' });
      };
      function renderSphere(g) {
        // sphere of radius 1, centre at height d (at least 1.6)
        const d = Math.max(st.d, 1.6), v = st.v, gm = P.gamma(v), to = st.to;
        // silhouette: tangent cone from the camera position in the sphere frame
        const Cp = [-gm * v * to, 0, -d], Cn = Math.hypot(Cp[0], Cp[1], Cp[2]);
        const c = v3.scale(Cp, 1 / Cn), cosA = 1 / Cn;     // tangent points: P'·c = R²/|C| (R = 1)
        const e1 = v3.unit(Math.abs(c[1]) < 0.9 ? v3.cross(c, [0, 1, 0]) : v3.cross(c, [1, 0, 0])), e2 = v3.cross(c, e1);
        const sinA = Math.sqrt(1 - cosA * cosA);
        const sil = [];
        for (let i = 0; i <= 180; i++) {
          const a = 2 * Math.PI * i / 180;
          sil.push(v3.add(v3.scale(c, cosA), v3.add(v3.scale(e1, sinA * Math.cos(a)), v3.scale(e2, sinA * Math.sin(a)))));
        }
        const dirOf = Pp => { const e = emission(Pp, v, d, to); const n = Math.hypot(e.x, e.y, e.z); return { n: [e.x / n, e.y / n, e.z / n], D: e.D }; };
        const silDirs = sil.map(q => dirOf(q).n);
        // axis of the apparent outline: normal of the plane through three silhouette directions.
        // If the outline is a circle on the sky, every other silhouette direction lies in that plane too.
        let axis = v3.unit(v3.cross(v3.sub(silDirs[60], silDirs[0]), v3.sub(silDirs[120], silDirs[0])));
        if (v3.dot(axis, silDirs[0]) < 0) axis = v3.neg(axis);
        // projection centred on the apparent outline (gnomonic, scaled to be comparable with the plane picture)
        const u1 = v3.unit(v3.cross([0, 1, 0], axis)), u2 = v3.cross(axis, u1);
        const proj = n => { const k = v3.dot(n, axis); return [d * v3.dot(n, u1) / k, d * v3.dot(n, u2) / k]; };
        const radii = silDirs.map(n => Math.acos(Math.max(-1, Math.min(1, v3.dot(n, axis)))));
        const mean = radii.reduce((a, b) => a + b, 0) / radii.length;
        const spread = Math.sqrt(radii.reduce((a, b) => a + (b - mean) * (b - mean), 0) / radii.length) / mean;
        sphereInfo = { spread, radius: mean, axisAngle: Math.atan2(axis[0], axis[2]) };
        // grid lines (latitude/longitude in the sphere frame, pole along y)
        const visible = Pp => v3.dot(v3.sub(Cp, Pp), Pp) > 0;
        const drawCurve = curve => {
          let seg = [];
          const flush = () => { if (seg.length > 1) { for (let i = 1; i < seg.length; i++) g.line(seg[i - 1].p[0], seg[i - 1].p[1], seg[i].p[0], seg[i].p[1], { color: st.dopp ? dopplerColor(seg[i].D) : '#1f6feb', width: 1.6 }); } seg = []; };
          curve.forEach(Pp => { if (visible(Pp)) { const r = dirOf(Pp); seg.push({ p: proj(r.n), D: r.D }); } else flush(); });
          flush();
        };
        for (let lat = -75; lat <= 75; lat += 15) {
          const c1 = []; for (let i = 0; i <= 120; i++) { const a = 2 * Math.PI * i / 120, ph = lat * Math.PI / 180; c1.push([Math.cos(ph) * Math.cos(a), Math.sin(ph), Math.cos(ph) * Math.sin(a)]); }
          drawCurve(c1);
        }
        for (let lon = 0; lon < 180; lon += 15) {
          const c2 = []; for (let i = 0; i <= 120; i++) { const a = 2 * Math.PI * i / 120, l = lon * Math.PI / 180; c2.push([Math.cos(a) * Math.cos(l), Math.sin(a), Math.cos(a) * Math.sin(l)]); }
          drawCurve(c2);
        }
        g.poly(silDirs.map(proj), { color: '#222', width: 2 }, true);
        if (st.actual) {   // contracted sphere at lab time to, seen without light delay (outline only)
          const out = []; for (let i = 0; i <= 120; i++) { const a = 2 * Math.PI * i / 120; const x = Math.cos(a) / gm + v * to, y = Math.sin(a), z = d; const n = Math.hypot(x, y, z); out.push(proj([x / n, y / n, z / n])); }
          g.poly(out, { color: '#57606a', width: 1.2, dash: [5, 4] });
        }
        g.stext(8, 22, 'camera time t₀ = ' + f(to, 2) + '   sphere radius 1 at distance ' + f(d, 2) + '.   Outline: angular radius ' + f(mean * 180 / Math.PI, 3) + '°, relative deviation from a circle ' + spread.toExponential(1),
          { bg: 'rgba(255,255,255,.85)', font: '11.5px system-ui' });
      }

      /* ------------------------------------------------ Doppler polar */
      const Dp = new SR.View2D(cD, { lockAspect: true });
      Dp.pannable = false;
      Dp.setBox(-2.2, 3.4, -2.2, 2.2);
      Dp.onRender = () => {
        const g = Dp, b = st.beta;
        const ref = []; for (let i = 0; i <= 120; i++) { const a = 2 * Math.PI * i / 120; ref.push([Math.cos(a), Math.sin(a)]); }
        g.poly(ref, { color: '#c9d1d9', width: 1.2, dash: [4, 4] });
        const pts = []; for (let i = 0; i <= 360; i++) { const a = 2 * Math.PI * i / 360, r = P.dopplerFactor(b, Math.cos(a)); pts.push([r * Math.cos(a), r * Math.sin(a)]); }
        g.poly(pts, { color: '#8250df', width: 2.2 });
        g.arrow(-0.3, 0, 0.5, 0, { color: '#222', width: 2.5 }, 9);
        g.text(0.1, 0, 'source', { dy: 12, align: 'center' });
        const a = st.th * Math.PI / 180, r = P.dopplerFactor(b, Math.cos(a));
        g.line(0, 0, 3.5 * Math.cos(a), 3.5 * Math.sin(a), { color: '#1f6feb', width: 1, dash: [3, 3] });
        g.dot(r * Math.cos(a), r * Math.sin(a), 5, '#1f6feb');
        const c0 = (1 - 1 / P.gamma(b)) / b;
        if (Math.abs(c0) <= 1) { const a0 = Math.acos(c0); [a0, -a0].forEach(q => g.dot(Math.cos(q), Math.sin(q), 4, '#1a7f37')); }
        g.stext(8, 22, 'distance from centre = f/f₀ in that direction; green: no shift', { bg: 'rgba(255,255,255,.85)', font: '11px system-ui' });
      };

      /* ------------------------------------------------ starfield */
      const Sk = new SR.View2D(cS, { lockAspect: true });
      Sk.pannable = false;
      Sk.setBox(-1.15, 1.15, -1.1, 1.1);
      const stars = (() => {   // deterministic random directions
        let s = 7; const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
        const out = [];
        for (let i = 0; i < 900; i++) { const z = 2 * rnd() - 1, ph = 2 * Math.PI * rnd(), r = Math.sqrt(1 - z * z); out.push({ s: [z, r * Math.cos(ph), r * Math.sin(ph)], m: 0.6 + 1.6 * rnd() * rnd() }); }
        return out;
      })();
      let fwdFrac = 0.5;
      Sk.onRender = () => {
        const g = Sk;
        g.poly(circle(0, 0, 1, 120), { color: '#30363d', width: 1 }, true, '#0d1117');
        g.poly(circle(0, 0, 0.5, 120), { color: '#3d4450', width: 1, dash: [3, 4] });
        let fwd = 0;
        stars.forEach(o => {
          const q = P.aberrateStar(o.s, st.sb);
          const th = Math.acos(Math.max(-1, Math.min(1, q.s[0]))), az = Math.atan2(q.s[2], q.s[1]);
          if (q.s[0] > 0) fwd++;
          const rho = th / Math.PI;
          const D = q.D, col = dopplerColor(D);
          g.dot(rho * Math.cos(az), rho * Math.sin(az), Math.max(0.6, Math.min(4, o.m * Math.sqrt(D))), col);
        });
        fwdFrac = fwd / stars.length;
        g.text(0, 0.5, '90°', { dy: -8, align: 'center', color: '#8c959f', font: '10px system-ui' });
        g.text(0, 0, '+', { align: 'center', color: '#fff' });
      };

      /* ------------------------------------------------ side panel */
      const s1 = ui.section(L.side, 'Photographing a fast object (6.3, 6.4)');
      ui.segmented(s1, { value: st.shape, options: [{ value: 'circle', label: 'circle' }, { value: 'grid', label: 'grid' }, { value: 'bicycle', label: 'bicycle' }, { value: 'sphere', label: 'sphere' }], onChange: v => { st.shape = v; upd(); } });
      ui.slider(s1, { label: 'speed v', min: 0, max: 0.99, step: 0.01, value: st.v, onInput: v => { st.v = v; upd(); } });
      ui.slider(s1, { label: 'distance d of the plane', min: 0.2, max: 4, step: 0.05, value: st.d, onInput: v => { st.d = v; upd(); } });
      const sTo = ui.slider(s1, { label: 'camera time t₀', min: -4, max: 6, step: 0.01, value: st.to, onInput: v => { st.to = v; upd(); } });
      const player = ui.player(dt => { st.to += dt * 0.8; if (st.to > 6) st.to = -4; sTo.set(st.to); upd(); });
      ui.buttons(s1, [{ label: '▶/❚❚ fly past', onClick: () => player.toggle() }, { label: "Dragan's Fig. 6.1 (v = 0.9, d = 0.5)", onClick: () => { st.shape = 'circle'; st.v = 0.9; st.d = 0.5; panel.querySelectorAll('.seg button')[0].click(); syncSliders(); upd(); } }]);
      const g1 = ui.el('div', { class: 'chkgrid' }); s1.append(g1);
      ui.checkbox(g1, { label: 'Doppler colours', value: st.dopp, onChange: v => { st.dopp = v; upd(); } });
      ui.checkbox(g1, { label: 'actual (contracted) shape', value: st.actual, onChange: v => { st.actual = v; upd(); } });
      ui.checkbox(g1, { label: 'uncontracted shape', value: st.rest, onChange: v => { st.rest = v; upd(); } });
      const roA = ui.readout(s1);

      const s2 = ui.section(L.side, 'Doppler effect (6.1)');
      ui.slider(s2, { label: 'source speed β', min: 0, max: 0.99, step: 0.01, value: st.beta, onInput: v => { st.beta = v; upd(); } });
      ui.slider(s2, { label: 'direction θ (°)', min: 0, max: 180, step: 1, value: st.th, onInput: v => { st.th = v; upd(); } });
      const roD = ui.readout(s2);
      const tl = ui.el('div'); s2.append(tl);
      const lam1 = ui.slider(tl, { label: 'emitted λ (nm)', min: 380, max: 780, step: 1, value: 650, onInput: () => upd() });
      const lam2 = ui.slider(tl, { label: 'observed λ (nm)', min: 380, max: 780, step: 1, value: 530, onInput: () => upd() });
      const roT = ui.readout(tl);

      const s3 = ui.section(L.side, 'Aberration of starlight');
      ui.slider(s3, { label: 'ship speed β', min: 0, max: 0.995, step: 0.005, value: st.sb, onInput: v => { st.sb = v; upd(); } });
      const roS = ui.readout(s3);

      const s4 = ui.section(L.side, 'Predict, then reveal');
      [
        ['A fast circle passes the camera. Does the photo show a flattened ellipse?', 'No. Light from different parts left at different times. Approaching, the circle looks stretched; receding, it looks like a squashed "sausage" (Fig. 6.1). The Lorentz-contracted ellipse (dashed) is what you would <i>measure</i>, not what you <i>see</i>.'],
        ['What does a fast sphere look like?', 'Still a sphere: its outline is exactly circular (the readout shows the deviation, ~10⁻¹⁵), only rotated and resized (Terrell–Penrose rotation). The light rays grazing it form a cone in its rest frame, and aberration maps cones to cones (6.4).'],
        ['Is light from an approaching source always blueshifted?', 'No. f/f₀ = 1/(γ(1 − β cos θ)). At θ = 90° (moving across the line of sight) it is redshifted by 1/γ (transverse Doppler, pure time dilation). Between the green dots there is redshift even while the distance shrinks.'],
        ['Can a driver claim a red light looked green?', 'Approaching head-on: λ_obs/λ = √((1−β)/(1+β)). Red 650 nm → green 530 nm needs β ≈ 0.20c. Below a 0.5c speed limit, so no speeding ticket, only one for running the red light (exercise 6.6).'],
        ['Why do stars crowd towards the front at high speed?', 'Aberration: cos θ′ = (cos θ + β)/(1 + β cos θ). The fraction of stars ahead (θ′ < 90°) rises from 50% to (1 + β)/2, and they are blueshifted and brighter.']
      ].forEach(q => ui.reveal(s4, q[0], q[1]));

      function syncSliders() {
        const r = s1.querySelectorAll('input[type=range]'), n = s1.querySelectorAll('input[type=number]');
        r[0].value = st.v; n[0].value = st.v.toFixed(2); r[1].value = st.d; n[1].value = st.d.toFixed(2);
      }
      function upd() {
        A.requestDraw(); Dp.requestDraw(); Sk.requestDraw();
        const gm = P.gamma(st.v);
        const rowsA = [['γ', f(gm, 4)], ['Lorentz-contracted length factor 1/γ', f(1 / gm, 4)]];
        if (st.shape === 'sphere') {
          const show = () => roA.set(rowsA.concat([['outline: relative deviation from a circle', sphereInfo ? sphereInfo.spread.toExponential(2) : '…', 'good'],
            ['apparent angular radius', sphereInfo ? f(sphereInfo.radius * 180 / Math.PI, 3) + '°' : '…'], ['(at rest it would be)', f(Math.asin(1 / Math.max(st.d, 1.6)) * 180 / Math.PI, 3) + '° at closest approach']]));
          A.draw(); show();      // draw synchronously so the outline statistics are fresh
        }
        else {
          const e = emission([0, 0, 0], st.v, st.d, st.to);
          rowsA.push(['centre: actual x at t₀', f(st.v * st.to, 3)], ['centre: apparent x (light left at t = ' + f(e.t, 2) + ')', f(e.x, 3)], ['Doppler factor of the centre', f(e.D, 3)]);
          roA.set(rowsA);
        }
        const b = st.beta, gb = P.gamma(b), a = st.th * Math.PI / 180, r = P.dopplerFactor(b, Math.cos(a));
        const c0 = (1 - 1 / gb) / b;
        roD.set([['f/f₀ = 1/(γ(1 − β cos θ))', f(r, 4), 'hl'], ['λ/λ₀ = γ(1 + v_r/c)', f(1 / r, 4)], ['head-on approach √((1+β)/(1−β))', f(P.dopplerLongitudinal(b), 4)],
          ['transverse (θ = 90°) 1/γ', f(1 / gb, 4)], ['no-shift direction', Math.abs(c0) <= 1 ? ui.deg(Math.acos(c0)) : '—']]);
        const rr = lam2.get() / lam1.get(), bt = (1 - rr * rr) / (1 + rr * rr);
        roT.set([['head-on speed needed: β = (1 − r²)/(1 + r²)', f(bt, 4) + (bt >= 0 ? ' (approaching)' : ' (receding)'), 'hl']]);
        Sk.draw();
        roS.set([['stars in the forward hemisphere', f(fwdFrac * 100, 1) + '%'], ['prediction (1 + β)/2', f((1 + st.sb) / 2 * 100, 1) + '%'], ['a star at 90° appears at', ui.deg(Math.acos(st.sb)) + ' from the front']]);
      }
      upd();
    }
  });
})();
