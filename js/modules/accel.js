/* Tab 8 - accelerated frames (Dragan ch. 8). Units with g = 1 by default: lengths c²/g, times c/g
   (for 1 g ≈ 9.81 m/s²: c/g ≈ 0.97 yr, c²/g ≈ 0.97 ly). */
(function () {
  'use strict';
  const SR = window.SR, P = SR.phys, ui = SR.ui, C = SR.COLORS, f = ui.fmt;
  const ROCK = '#1f6feb', HOR = '#cf222e', FREE = '#8250df';

  /** polyline for a hyperbola worldline centred at (0, xc): x = xc + cosh(a tau)/a, t = sinh(a tau)/a */
  function hyperWL(a, xc, tau0, tau1, n) {
    const pts = [], taus = [];
    n = n || 400;
    for (let i = 0; i <= n; i++) { const tau = tau0 + (tau1 - tau0) * i / n; pts.push([Math.sinh(a * tau) / a, xc + Math.cosh(a * tau) / a]); taus.push(tau); }
    return new P.Worldline(pts, { tau: taus });
  }
  function bisect(fn, a, b) { let fa = fn(a); for (let i = 0; i < 100; i++) { const m = (a + b) / 2, fm = fn(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }

  SR.modules.push({
    id: 'accel', order: 8, title: '8 · Accelerated frames', tip: 'Hyperbolic motion, horizons, Rindler, Bell paradox, gravitational time dilation (ch. 8)',
    init(panel) {
      const L = ui.layout(panel);
      const row = L.row();
      const cM = L.canvas({ parent: row });
      const cR = L.canvas({ parent: row });
      const D = new SR.MinkowskiDiagram(cM);
      const R = new SR.Plot(cR, { xlabel: '', ylabel: '' });
      R.pannable = R.zoomable = false;
      const st = { mode: 'hyper', g: 1, tau: 1.2, Lb: 1, rigid: false, h: 1, tdrop: 0, tres: 0.4, xi2: 2, };

      const s0 = ui.section(L.side, 'Experiment');
      ui.segmented(s0, {
        value: st.mode,
        options: [{ value: 'hyper', label: 'hyperbolic motion' }, { value: 'rindler', label: 'Rindler view' }, { value: 'bell', label: "Bell's spaceships" },
          { value: 'gtd', label: 'clocks in a rocket' }, { value: 'sausage', label: 'hungry astronaut' }],
        onChange: v => { st.mode = v; build(); }
      });
      const desc = ui.note(s0, '', 'scen-desc');
      const sP = ui.section(L.side, 'Parameters');
      const sR = ui.section(L.side, 'Readouts');
      const ro = ui.readout(sR);
      const sQ = ui.el('div'); L.side.append(sQ);
      ui.note(L.side, 'Units: c = 1 and lengths in c²/g₀, times in c/g₀. For g₀ = 9.81 m/s²: c/g₀ ≈ 0.97 years, c²/g₀ ≈ 0.97 light years.', 'small');

      function slider(label, key, min, max, step) { return ui.slider(sP, { label, min, max, step, value: st[key], onInput: v => { st[key] = v; draw(); } }); }
      function build() {
        sP.innerHTML = '<h3>Parameters</h3>'; sQ.innerHTML = '';
        D.viewV = 0; D.tName = 'ct'; D.xName = 'x';
        const Q = [];
        if (st.mode === 'hyper') {
          desc.innerHTML = 'Constant proper acceleration g (what an accelerometer on board reads) from rest at the origin. The worldline is a hyperbola; velocity tends to c; a light ray sent after t = c/g from the start never catches up: there is a <b>horizon</b> behind the rocket. <span class="pill">Dragan 8.2</span>';
          slider('proper acceleration g', 'g', 0.2, 3, 0.01);
          slider("rocket's proper time τ", 'tau', 0, 4, 0.01);
          D.setBox(-2.5, 5, -1, 5);
          Q.push(['Can a light ray fired from the start point after some delay always catch the rocket?', 'Only if fired before t = c/g. Later rays run parallel-ish to the asymptote x = ct − c²/g and never reach it (8.12).'],
            ['According to the rocket, what time does the Earth clock show as τ → ∞?', 'Its lines of simultaneity all pass through the event (t = 0, x = −c²/g), so the Earth clock "freezes" at t = c/g. The Earth falls behind the horizon in the rocket\'s description (right plot).'],
            ['What force produces uniform (proper) acceleration?', 'A constant force F = mg in the instantaneous rest frame, which is also constant in the lab because longitudinal force does not change under boosts. Then dp/dt = F gives p = Ft (tab 6).']);
        } else if (st.mode === 'rindler') {
          desc.innerHTML = 'The accelerated observers form the Rindler frame: each hyperbola ξ = const is an observer at rest in the rocket; the lines through the origin are their common "now" (η = const). Right: the same events in Rindler coordinates (ξ, τ = η/g). A dropped object falls and <b>never reaches</b> the horizon ξ = 0. <span class="pill">Dragan 8.4, 8.6, 8.7</span>';
          slider('drop height ξ₀ (c²/g)', 'xi2', 0.3, 3, 0.01);
          D.setBox(-1, 4, -2.2, 3.2);
          Q.push(['What is the coordinate velocity of light at height ξ?', 'dξ/dτ = gξ/c (for the clock at ξ = c²/g it is c). Near the horizon light "slows down" in these coordinates, but any local observer still measures c (local vs coordinate velocity, 8.12).'],
            ['Can the coordinate velocity of a massive body exceed c?', 'Yes, high up (ξ > c²/g) coordinate speeds can exceed c, because the coordinate clocks there tick faster. It is not a local measurement.']);
        } else if (st.mode === 'bell') {
          desc.innerHTML = 'Two rockets start together, joined by a string, and fire identical engines (same proper acceleration, same time in the lab). In the lab their distance stays L. Does the string survive? Toggle "Born rigid" to give the front rocket the right (smaller) acceleration. <span class="pill">Dragan 8.3</span>';
          slider('lab distance L', 'Lb', 0.2, 3, 0.01);
          slider("rear rocket's proper time τ", 'tau', 0, 3, 0.01);
          ui.checkbox(sP, { label: 'Born-rigid acceleration (front: g/(1 + gL/c²))', value: st.rigid, onChange: v => { st.rigid = v; draw(); } });
          D.setBox(-1, 6, -0.6, 5);
          Q.push(['Does the string break?', 'Yes. In the rockets\' instantaneous rest frame their distance grows like γL (they are not simultaneous there: the front one started earlier). The lab distance stays L only because the string should be contracted to L/γ.'],
            ['How must a rocket of finite length accelerate to stay rigid?', 'Each part must follow its own hyperbola about a common centre: the rear must accelerate harder (g_front = g/(1 + gL/c²)). That is the Born-rigid motion, and its parts have a common horizon.']);
        } else if (st.mode === 'gtd') {
          desc.innerHTML = 'Two clocks at the bottom (proper acceleration g) and top (height h) of a rigid rocket. Purple lines: the rocket\'s "now" (through the origin). Between the same two lines the top clock ticks more. Orange: pulses sent upward every bottom tick arrive further apart. <span class="pill">Dragan 8.5</span>';
          slider('height h of the top clock (c²/g)', 'h', 0.1, 3, 0.01);
          D.setBox(-0.5, 5, -0.4, 4.2);
          Q.push(['Which clock runs faster, and by how much?', 'The top one, by the factor 1 + gh/c² (exactly the ratio of their distances from the horizon). By the equivalence principle the same happens in a gravitational field: clocks higher up run faster.'],
            ['Is the redshift of the pulses a Doppler effect or a clock effect?', 'In the lab it is a Doppler effect (the receiver moves faster when the pulse arrives). In the rocket nothing moves and the same factor is read as the top clock ticking faster. Both descriptions give 1 + gh/c².']);
        } else {
          desc.innerHTML = 'An astronaut in a rocket with proper acceleration g drops a sausage at proper time τ_d. The sausage moves freely and crosses the horizon at some event. Until when can a rescue mission (at most at light speed) still reach it? <span class="pill">Dragan 8.8</span>';
          slider('drop time τ_d', 'tdrop', 0, 2, 0.01);
          slider('rescue launch time τ_r', 'tres', 0, 4, 0.01);
          D.setBox(-0.5, 7, -0.5, 6.5);
          Q.push(['How long after the drop can the astronaut still save the sausage?', 'A proper time (c/g)·ln 2 ≈ 0.69 c/g, independent of when it was dropped (the situation is boost-invariant). Later light signals reach it only after it has crossed the horizon.'],
            ['From the rocket\'s point of view, does the sausage ever cross the horizon?', 'No. On the rocket\'s lines of simultaneity it approaches the horizon forever, its light ever more redshifted. Yet after (c/g)ln 2 it is unreachable. "Which side is it on" has no operational meaning (8.8).']);
        }
        ui.questions(sQ, Q);
        draw();
      }
      function draw() { D.requestDraw(); R.requestDraw(); readouts(); }

      /* ------------------------------------------------ Minkowski side */
      D.onRender = () => {
        D.drawFrame(0, { color: '#c3cad4', grid: true, axes: false, gridAlpha: 0.45 });
        D.drawFrame(0, { color: '#57606a', ticks: true, width: 1 });
        const g = st.g;
        if (st.mode === 'hyper') {
          const wl = P.tripFromPhases([{ tau: 6, a: g }], { dtau: 0.01 });
          // horizon: light line x = t - 1/g
          D.infLine(-1 / g, 0, 1, 1, { color: HOR, width: 2, dash: [8, 4] });
          D.text(3.2, 3.2 + 1 / g, 'horizon x = ct − c²/g', { color: HOR, dx: -40, dy: -10, bg: 'rgba(255,255,255,.7)' });
          // lines of simultaneity at ticks: pass through (0, -1/g)
          for (let k = 1; k <= 8; k++) { const e = wl.atTau(k * 0.5); if (!e) continue; const p = D.pt(e.t, e.x), d = D.ptd(e.v, 1); D.infLine(p[0], p[1], d[0], d[1], { color: '#7c3aed', width: 0.8, alpha: 0.35 }); }
          D.drawWorldline(wl, { color: ROCK, width: 3 });
          D.drawTicks(wl, 0.5, { color: ROCK, labels: true });
          // light signals from the start point (x = 0)
          for (let k = 0; k <= 8; k++) {
            const t0 = 0.25 + k * 0.5 / g * 1, h = wl.intersect(1, -1, t0);   // t - x = t0
            if (h) D.seg(0, t0, h.x, h.t, { color: C.light, width: 1.2 });
            else D.ray(0, t0, 1, 1, { color: HOR, width: 1, alpha: 0.7, dash: [3, 3] });
          }
          D.drawWorldline(new P.Worldline([[-10, 0], [20, 0]]), { color: '#6e7781', width: 1.6 });
          const e = wl.atTau(st.tau);
          if (e) { const p = D.pt(e.t, e.x), d = D.ptd(e.v, 1); D.infLine(p[0], p[1], d[0], d[1], { color: '#7c3aed', width: 1.8, dash: [6, 4] }); D.drawEvent(e.t, e.x, { label: 'rocket τ=' + f(st.tau, 2), color: ROCK }); }
        } else if (st.mode === 'rindler' || st.mode === 'gtd' || st.mode === 'sausage') {
          // Rindler wedge grid
          for (let xi = 0.5; xi <= 4; xi += 0.5) D.drawWorldline(hyperWL(1 / xi, 0, -4 * xi, 4 * xi, 200), { color: '#9aa4b2', width: 0.7, alpha: 0.6 });
          for (let eta = -2; eta <= 2; eta += 0.5) { const d = D.ptd(Math.tanh(eta), 1); D.ray(0, 0, d[0], d[1], { color: '#9aa4b2', width: 0.7, alpha: 0.6 }); }
          D.infLine(0, 0, 1, 1, { color: HOR, width: 2, dash: [8, 4] }); D.infLine(0, 0, -1, 1, { color: HOR, width: 1, dash: [3, 5], alpha: 0.6 });
          D.text(2.8, 2.8, 'future horizon', { color: HOR, dx: 6, dy: 10 });
          if (st.mode === 'rindler') {
            const obs = hyperWL(g, 0, -3 / g, 3 / g);
            D.drawWorldline(obs, { color: ROCK, width: 3 }); D.drawTicks(obs, 0.5, { color: ROCK, labels: true });
            D.drawWorldline(new P.Worldline([[-10, 1 / g], [10, 1 / g]]), { color: FREE, width: 2 });
            D.text(1 / g, 2.6, 'dropped at τ = 0', { color: FREE, dx: 6 });
            const hi = hyperWL(1 / st.xi2, 0, -3 * st.xi2, 3 * st.xi2);
            D.drawWorldline(hi, { color: '#1a7f37', width: 1.8 });
            D.drawLightRay(0, 1 / g, -1, 1 / g, { color: C.light, width: 1.6 });
            D.drawLightRay(0, 1 / g, 1, undefined, { color: C.light, width: 1.6 });
          } else if (st.mode === 'gtd') {
            const x1 = 1 / g, x2 = 1 / g + st.h;
            const b = hyperWL(1 / x1, 0, 0, 3.5 * x1), t2 = hyperWL(1 / x2, 0, 0, 3.5 * x2);
            D.drawWorldline(b, { color: ROCK, width: 3 }); D.drawTicks(b, 0.25, { color: ROCK, labels: true, labelEvery: 2 });
            D.drawWorldline(t2, { color: '#1a7f37', width: 3 }); D.drawTicks(t2, 0.25, { color: '#1a7f37', labels: true, labelEvery: 2 });
            for (let k = 1; k <= 12; k++) {
              const eta = k * 0.25 / x1;                         // bottom tick k: tau1 = x1 * eta
              if (eta > 3.4) break;
              const d = D.ptd(Math.tanh(eta), 1); D.ray(0, 0, d[0], d[1], { color: '#7c3aed', width: 0.8, alpha: 0.45 });
              // upward pulse: in Rindler coordinates xi = x1 e^(eta - eta_e) -> arrives at eta_e + ln(x2/x1)
              const A1 = P.rindler.toMinkowski(eta, x1);   // upward light ray: x - t = const (a straight 45° line)
              const etr = eta + Math.log(x2 / x1), A2 = P.rindler.toMinkowski(etr, x2);
              D.seg(A1[1], A1[0], A2[1], A2[0], { color: C.light, width: 1.2 });
            }
          } else {
            const xr = 1 / g, rock = hyperWL(g, 0, -1, 6);
            D.drawWorldline(rock, { color: ROCK, width: 3 }); D.drawTicks(rock, 0.25, { color: ROCK, labels: true, labelEvery: 2 });
            const s = sausage();
            D.drawWorldline(new P.Worldline([[s.td, s.xd], [s.td + 20, s.xd + 20 * s.vd]]), { color: FREE, width: 2.2 });
            D.drawEvent(s.td, s.xd, { label: 'drop', color: FREE, r: 4 });
            D.drawEvent(s.tc, s.tc, { label: 'crosses horizon', color: HOR, r: 4 });
            const last = rock.atTau(s.tauLast);
            if (last) { const a = D.pt(last.t, last.x); D.drawEvent(last.t, last.x, { label: 'last chance (τ_d + ln2·c/g)', color: '#1a7f37', r: 4 }); D.seg(a[0], a[1], s.tc, s.tc, { color: '#1a7f37', width: 1.2, dash: [4, 3] }); }
            const re = st.tres >= st.tdrop ? rock.atTau(st.tres) : null;
            if (re) {
              const K = re.t + re.x;                 // light going towards -x: x + t = K
              const hit = (K - s.xd + s.vd * s.td) / (1 + s.vd);   // t where sausage meets the ray
              const xh = s.xd + s.vd * (hit - s.td);
              const ok = xh > hit;
              const a = D.pt(re.t, re.x);
              D.seg(a[0], a[1], xh, hit, { color: ok ? '#1a7f37' : HOR, width: 2 });
              D.drawEvent(re.t, re.x, { label: 'rescue launched', color: ok ? '#1a7f37' : HOR, r: 4 });
              D.drawEvent(hit, xh, { label: ok ? 'reached in time' : 'too late (behind horizon)', color: ok ? '#1a7f37' : HOR, r: 4 });
            }
            for (let k = 0; k <= 8; k++) { const eta = k * 0.5; const d = D.ptd(Math.tanh(eta), 1); D.ray(0, 0, d[0], d[1], { color: '#7c3aed', width: 0.8, alpha: 0.35 }); }
          }
        } else if (st.mode === 'bell') {
          const b = bell();
          D.drawWorldline(b.rear, { color: ROCK, width: 3 }); D.drawTicks(b.rear, 0.5, { color: ROCK, labels: true });
          D.drawWorldline(b.front, { color: '#1a7f37', width: 3 }); D.drawTicks(b.front, 0.5, { color: '#1a7f37', labels: true });
          const re = b.re, fe = b.fe;
          const stretch = b.dist / st.Lb;
          const col = stretch > 1.05 ? HOR : '#bf8700';
          D.seg(re.x, re.t, fe.x, fe.t, { color: col, width: 3.5 });
          D.text((re.x + fe.x) / 2, (re.t + fe.t) / 2, 'string ' + f(stretch, 3) + '×', { dy: -12, color: col, bg: 'rgba(255,255,255,.8)' });
          const p = D.pt(re.t, re.x), d = D.ptd(re.v, 1); D.infLine(p[0], p[1], d[0], d[1], { color: '#7c3aed', width: 1, dash: [6, 4] });
          D.drawEvent(re.t, re.x, { label: 'rear τ=' + f(st.tau, 2), color: ROCK, r: 4 });
        }
        D.drawCursorInfo([{ V: 0, name: 'lab', prime: '' }]);
      };

      /* ------------------------------------------------ helpers */
      function sausage() {
        const g = st.g, td = Math.sinh(g * st.tdrop) / g, xd = Math.cosh(g * st.tdrop) / g, vd = Math.tanh(g * st.tdrop);
        const tc = (xd - vd * td) / (1 - vd);
        return { td, xd, vd, tc, tauLast: st.tdrop + Math.log(2) / g };
      }
      function bell() {
        const g = st.g, Lb = st.Lb;
        let rear, front, fe;
        const tau = st.tau;
        if (!st.rigid) {
          rear = P.tripFromPhases([{ tau: 4, a: g }], { dtau: 0.01 });
          front = new P.Worldline(rear.pts.map(q => [q[0], q[1] + Lb]), { tau: rear.tau });
        } else {
          const gf = 1 / (1 / g + Lb);
          rear = hyperWL(g, -1 / g, 0, 4);
          front = hyperWL(gf, -1 / g, 0, 4 * g / gf);
        }
        const re = rear.atTau(tau) || { t: 0, x: 0, v: 0 };
        // front event on the rear's line of simultaneity: t - t_r = v (x - x_r)
        const fx = t => { const h = front.atLabTime(t); return h ? h.x : NaN; };
        const tEnd = front.pts[front.pts.length - 1][0];
        const tf = bisect(t => (t - re.t) - re.v * (fx(t) - re.x), re.t, Math.min(re.t + 40, tEnd));
        fe = front.atLabTime(tf) || { t: tf, x: fx(tf) };
        const dist = Math.sqrt(Math.max(0, (fe.x - re.x) ** 2 - (fe.t - re.t) ** 2));
        return { rear, front, re, fe, dist };
      }

      /* ------------------------------------------------ right panel */
      const toR = (t, x) => { const r = P.rindler.fromMinkowski(t, x); return r ? [r.xi, r.eta / st.g] : null; };   // [xi, tau of the clock at xi = 1/g]
      function rPoly(pts, style) {   // map Minkowski [t,x] list to Rindler and draw, breaking outside the wedge
        let seg = [];
        pts.forEach(([t, x]) => { const q = toR(t, x); if (q && isFinite(q[1])) seg.push(q); else { if (seg.length > 1) R.poly(seg, style); seg = []; } });
        if (seg.length > 1) R.poly(seg, style);
      }
      R.onRender = () => {
        const g = st.g;
        if (st.mode === 'hyper') {
          R.box = { xmin: 0, xmax: 4, ymin: 0, ymax: 1.25 / g }; R._fit();
          R.axes({ xlabel: "rocket's proper time τ (c/g units)", ylabel: 'Earth clock (t)' });
          R.clipped(() => {
            R.hline(1 / g, { color: HOR, dash: [6, 4] }, 'c/g: Earth "freezes"');
            R.fn(tau => Math.tanh(g * tau) / g, { color: '#7c3aed', width: 2.2 });
            R.fn(tau => { const t = Math.sinh(g * tau) / g, x = (Math.cosh(g * tau) - 1) / g; return t - x; }, { color: C.light, width: 2 });
            R.vline(st.tau, { color: '#57606a', dash: [2, 3] });
          });
          const c = R.ctx; c.font = '11.5px system-ui'; c.textAlign = 'left'; c.textBaseline = 'top';
          c.fillStyle = '#7c3aed'; c.fillText("Earth time on the rocket's line of simultaneity", R.margin.l + 8, R.margin.t + 18);
          c.fillStyle = '#b07600'; c.fillText('Earth time seen through a telescope', R.margin.l + 8, R.margin.t + 33);
        } else if (st.mode === 'bell') {
          const saved = st.tau, pts = [];
          for (let i = 0; i <= 120; i++) { st.tau = 3 * i / 120; pts.push([st.tau, bell().dist]); }
          st.tau = saved;
          R.box = { xmin: 0, xmax: 3, ymin: 0, ymax: Math.max(2 * st.Lb, ...pts.map(p => p[1])) * 1.08 }; R._fit();
          R.axes({ xlabel: "rear rocket's proper time τ", ylabel: 'distance in the rear rocket frame' });
          R.clipped(() => {
            R.poly(pts, { color: st.rigid ? '#1a7f37' : HOR, width: 2.2 });
            R.hline(st.Lb, { color: '#57606a', dash: [4, 4] }, 'L (lab distance)');
            R.vline(st.tau, { color: '#57606a', dash: [2, 3] });
          });
        } else {
          R.box = { xmin: 0, xmax: 4, ymin: -1.5, ymax: 4 }; R._fit();
          R.axes({ xlabel: 'ξ = distance from the horizon (c²/g)', ylabel: 'Rindler time τ = η/g' });
          R.clipped(() => {
            R.vline(0, { color: HOR, width: 2.5 }, 'horizon');
            if (st.mode === 'rindler') {
              R.vline(1 / g, { color: ROCK, width: 2.5 });
              R.vline(st.xi2, { color: '#1a7f37', width: 1.8 });
              const free = []; for (let i = 0; i <= 300; i++) { const t = -2 + 8 * i / 300; free.push([t, 1 / g]); }
              rPoly(free, { color: FREE, width: 2.2 });
              const up = [], down = []; for (let i = 0; i <= 300; i++) { const s = 6 * i / 300; up.push([s, 1 / g + s]); down.push([s, 1 / g - s]); }
              rPoly(up, { color: C.light, width: 1.8 }); rPoly(down, { color: C.light, width: 1.8 });
              R.text(1 / g, 3.8, 'rocket clock', { dx: 4, color: ROCK });
              R.text(0.15, -1, 'dropped object approaches ξ = 0 forever', { color: FREE });
            } else if (st.mode === 'gtd') {
              const x1 = 1 / g, x2 = x1 + st.h;
              R.vline(x1, { color: ROCK, width: 2.5 }, 'bottom'); R.vline(x2, { color: '#1a7f37', width: 2.5 }, 'top');
              for (let k = 1; k <= 14; k++) {
                const e = k * 0.25 / x1; if (e / g > 4) break;
                const curve = [];                          // light in Rindler coordinates: xi = x1 e^(eta' - eta)
                for (let i = 0; i <= 30; i++) { const de = Math.log(x2 / x1) * i / 30; curve.push([x1 * Math.exp(de), (e + de) / g]); }
                R.poly(curve, { color: C.light, width: 1.2 });
              }
            } else {
              const s = sausage();
              R.vline(1 / g, { color: ROCK, width: 2.5 }, 'rocket');
              const pts = []; for (let i = 0; i <= 400; i++) { const t = s.td + 12 * i / 400; pts.push([t, s.xd + s.vd * (t - s.td)]); }
              rPoly(pts, { color: FREE, width: 2.2 });
              R.hline(s.tauLast, { color: '#1a7f37', dash: [5, 3] }, 'last rescue');
            }
          });
        }
      };

      function readouts() {
        const g = st.g;
        if (st.mode === 'hyper') {
          const tau = st.tau, t = Math.sinh(g * tau) / g, x = (Math.cosh(g * tau) - 1) / g, v = Math.tanh(g * tau);
          ro.set([['lab time t = sinh(gτ)/g', f(t, 4)], ['position x = (cosh(gτ) − 1)/g', f(x, 4)], ['velocity v = tanh(gτ)', f(v, 5)], ['γ = cosh(gτ)', f(Math.cosh(g * tau), 4)],
            ['rapidity = gτ (grows linearly)', f(g * tau, 4)], ['distance to the horizon (rocket frame)', f(1 / g, 4) + ' (constant!)'], ['Earth time on rocket\'s "now"', f(Math.tanh(g * tau) / g, 4)],
            ['latest light ray that catches up: sent before t =', f(1 / g, 3)]]);
        } else if (st.mode === 'rindler') {
          ro.set([['observer at ξ: proper acceleration', 'c²/ξ'], ['clock rate at ξ relative to ξ = c²/g', 'gξ/c² (e.g. ξ₀ → ' + f(g * st.xi2, 3) + ')'],
            ['coordinate speed of light at ξ', 'gξ (here ' + f(g * st.xi2, 3) + ' at ξ₀)'], ['free fall from ξ = c²/g', 'ξ(τ) = (c²/g)/cosh(gτ/c) → 0, never reached']]);
        } else if (st.mode === 'bell') {
          const b = bell();
          ro.set([['rear velocity', f(b.re.v, 4)], ['γ of the rear', f(P.gamma(b.re.v), 4)], ['distance in the rear frame', f(b.dist, 4), 'hl'], ['lab distance', f(st.rigid ? b.fe.x - b.re.x : st.Lb, 4)],
            ['stretch factor', f(b.dist / st.Lb, 4), b.dist / st.Lb > 1.05 ? 'bad' : 'good'],
            st.rigid ? ['front acceleration g/(1 + gL)', f(g / (1 + g * st.Lb), 4)] : ['string', b.dist / st.Lb > 1.05 ? 'BROKEN (> 5% stretch)' : 'intact so far', b.dist / st.Lb > 1.05 ? 'bad' : '']]);
        } else if (st.mode === 'gtd') {
          const ratio = 1 + g * st.h;
          ro.set([['rate of top clock / bottom clock', f(ratio, 4) + ' = 1 + gh/c²', 'hl'], ['received pulse spacing / emitted', f(ratio, 4)],
            ['Pound–Rebka tower (h = 22.5 m, Earth g)', '1 + ' + (9.81 * 22.5 / 299792458 ** 2).toExponential(2)],
            ['GPS orbit vs ground (gravity part, approx.)', '+45 μs per day']]);
        } else {
          const s = sausage(), late = st.tres > s.tauLast, early = st.tres < st.tdrop;
          ro.set([['drop at lab (t, x)', f(s.td, 3) + ', ' + f(s.xd, 3)], ['sausage crosses horizon at t = x =', f(s.tc, 4)],
            ['last rescue launch τ_d + (c/g) ln 2', f(s.tauLast, 4), 'hl'],
            ['your rescue launched at τ_r', f(st.tres, 3) + (early ? ' (before the drop!)' : late ? ' (too late)' : ' (in time)'), early ? '' : late ? 'bad' : 'good'],
            ['window after the drop', f(Math.log(2) / g, 4) + ' = (c/g)·ln 2']]);
        }
      }
      build();
    }
  });
})();
