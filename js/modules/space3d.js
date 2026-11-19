/* Tab 5 - "Hard life in 3D" (Dragan ch. 3, 2.4, 5.3): Thomas-Wigner rotation, the hardest problem,
   Thomas precession, the stick through a moving hole, colliding squares. All in the xy-plane. */
(function () {
  'use strict';
  const SR = window.SR, P = SR.phys, ui = SR.ui, C = SR.COLORS, f = ui.fmt, v3 = P.v3;
  const deg = Math.PI / 180;

  /** spatial directions (in A coordinates, at A-time 0) of the x and y axes of a frame F, L = matrix A -> F */
  function axesSeenFrom(L) {
    const Li = P.m4.lorentzInverse(L);
    const dir = k => [1, 2, 3].map(i => Li[i][k] - Li[i][0] * Li[0][k] / Li[0][0]);
    return { ex: dir(1), ey: dir(2) };
  }
  /** position at frame time tau, in frame with velocity Vf, of a point moving uniformly r(t) = r0 + w t (lab) */
  function placeIn(Vf, r0, w, tau) {
    const g = P.gammaVec(Vf);
    const t = (tau / g + v3.dot(Vf, r0)) / (1 - v3.dot(Vf, w));
    const ev = P.m4.vec(P.boostMatrix(Vf), [t, r0[0] + w[0] * t, r0[1] + w[1] * t, r0[2] + w[2] * t]);
    return [ev[1], ev[2]];
  }
  const vec2 = (m, a) => [m * Math.cos(a), m * Math.sin(a), 0];

  SR.modules.push({
    id: 'space3d', order: 5, title: '5 · 3D: Wigner & Thomas', tip: 'Thomas-Wigner rotation, hardest problem, Thomas precession, stick & hole, two squares (ch. 3, 2.4, 5.3)',
    init(panel) {
      const L = ui.layout(panel);
      const row = L.row();
      const cA = L.canvas({ parent: row });
      const cB = L.canvas({ parent: row });
      const A = new SR.View2D(cA, { lockAspect: true });
      const B = new SR.View2D(cB, { lockAspect: true });
      const PLT = null;
      const st = {
        mode: 'wigner',
        Vm: 0.8, Va: 0, vpm: 0.8, vpa: 90,                 // Bob w.r.t. Alice; Witch w.r.t. Bob
        beta: 0.6, orbit: 0, run: true,                    // Thomas
        sv: 0.8, su: 0.6, L0: 1.2, h: 1.0, frame: 'stick', naive: false, tau: -1.2,   // stick & hole
        qu: 0.6, qk: 0.5, qframe: 'left', qtau: -0.6       // squares
      };
      let thomasNum = null;

      /* ---------------------------------------------------- side panel */
      const s0 = ui.section(L.side, 'Experiment');
      ui.segmented(s0, {
        value: st.mode,
        options: [{ value: 'wigner', label: 'Wigner rotation' }, { value: 'thomas', label: 'Thomas precession' }, { value: 'stick', label: 'stick & hole (2.4)' }, { value: 'squares', label: 'two squares (5.3)' }],
        onChange: v => { st.mode = v; build(); }
      });
      const desc = ui.note(s0, '', 'scen-desc');
      const sP = ui.section(L.side, 'Parameters');
      const sR = ui.section(L.side, 'Readouts');
      const ro = ui.readout(sR);
      const sQ = ui.el('div'); L.side.append(sQ);
      const player = ui.player(dt => {
        if (st.mode === 'thomas') st.orbit += dt * 0.35;
        else if (st.mode === 'stick') { st.tau += dt * 0.6; if (st.tau > 1.6) st.tau = -1.6; if (tauSl) tauSl.set(st.tau); }
        else if (st.mode === 'squares') { st.qtau += dt * 0.5; if (st.qtau > 1.2) st.qtau = -1.4; if (tauSl) tauSl.set(st.qtau); }
        draw();
      });
      let tauSl = null;

      function build() {
        player.stop();
        sP.innerHTML = '<h3>Parameters</h3>';
        sQ.innerHTML = '';
        tauSl = null;
        cB.wrap.style.display = (st.mode === 'wigner' || st.mode === 'thomas') ? '' : 'none';
        A.draggables = []; B.draggables = [];
        B.lockAspect = true; B.margin = { l: 0, r: 0, t: 0, b: 0 };
        if (st.mode === 'wigner') buildWigner();
        else if (st.mode === 'thomas') buildThomas();
        else if (st.mode === 'stick') buildStick();
        else buildSquares();
        setTimeout(() => { A.resize(); B.resize(); draw(); }, 0);
      }
      function draw() { A.requestDraw(); B.requestDraw(); readouts(); }

      /* ================================================ Wigner rotation */
      function buildWigner() {
        desc.innerHTML = 'Alice → Bob is a boost with velocity <b>V</b> (measured by Alice). Bob → Witch is a boost with <b>v′</b> (measured by Bob). ' +
          'Composing two non-collinear boosts gives a boost <b>v</b> plus a <b>rotation</b> (eq. 3.9). Left: what Alice sees at her t = 0. Right: the Witch\'s rest space. <span class="pill">Dragan 3.2</span>';
        ui.slider(sP, { label: '|V| Bob w.r.t. Alice', min: 0, max: 0.99, step: 0.01, value: st.Vm, onInput: v => { st.Vm = v; draw(); } });
        ui.slider(sP, { label: 'direction of V (°)', min: -180, max: 180, step: 1, value: st.Va, onInput: v => { st.Va = v; draw(); } });
        ui.slider(sP, { label: "|v'| Witch w.r.t. Bob", min: 0, max: 0.99, step: 0.01, value: st.vpm, onInput: v => { st.vpm = v; draw(); } });
        ui.slider(sP, { label: "direction of v' (°)", min: -180, max: 180, step: 1, value: st.vpa, onInput: v => { st.vpa = v; draw(); } });
        ui.legend(sP, [{ color: '#222', label: 'Alice' }, { color: '#1f6feb', label: 'Bob (pure boost V)' }, { color: '#e36209', label: 'Witch via Bob' }, { color: '#8c959f', label: 'Witch, direct boost v', dash: true }]);
        ui.questions(sQ, [
          ['If Alice sees the Witch at v, does the Witch see Alice at −v?',
            'Not if the Witch\'s axes come from Bob\'s by a pure boost: she sees Alice at −R·v, rotated by the Wigner angle. That is exactly the hidden mistake of eq. (3.7), which assumes −v and −v′ at the same time.'],
          ['When is there no rotation?', 'When V and v′ are parallel or antiparallel (collinear boosts), or one of them is zero. The rotation always lies in the plane spanned by the two velocities.'],
          ['Why is the Witch\'s square in Alice\'s frame not symmetric about v?',
            'A pure boost contracts a square only along v (dashed grey: symmetric). The orange square is that contracted shape of a <i>rotated</i> square. With V along x and v′ along y, the Witch\'s axes make an obtuse angle in Alice\'s frame (Fig. 3.3).'],
          ['How big can the rotation get?', 'For two perpendicular boosts close to c it approaches 90°. For everyday speeds it is of order V·v′/2c².']
        ]);
        A.setBox(-1.4, 1.4, -1.3, 1.3); B.setBox(-1.4, 1.4, -1.3, 1.3);
      }
      function wigner() {
        const V = vec2(st.Vm, st.Va * deg), vp = vec2(st.vpm, st.vpa * deg);
        const d = P.composeBoosts(V, vp);
        return { V, vp, d, v: d.v, LB: P.boostMatrix(V), LW: d.L, LWs: P.boostMatrix(d.v) };
      }
      function drawSquare(g, ex, ey, st2, fill) {
        const s = 0.9;
        g.poly([[0, 0], [ex[0] * s, ex[1] * s], [(ex[0] + ey[0]) * s, (ex[1] + ey[1]) * s], [ey[0] * s, ey[1] * s]], st2, true, fill);
        g.arrow(0, 0, ex[0] * s, ex[1] * s, { color: st2.color, width: st2.width || 2 }, 8);
        g.arrow(0, 0, ey[0] * s, ey[1] * s, { color: st2.color, width: st2.width || 2 }, 8);
      }
      function renderWignerA() {
        const g = A, w = wigner();
        g.line(-3, 0, 3, 0, { color: '#eceff3' }); g.line(0, -3, 0, 3, { color: '#eceff3' });
        drawSquare(g, [1, 0], [0, 1], { color: '#222', width: 1.5 });
        const ab = axesSeenFrom(w.LB), aw = axesSeenFrom(w.LW), aws = axesSeenFrom(w.LWs);
        drawSquare(g, ab.ex, ab.ey, { color: '#1f6feb', width: 1.6 }, 'rgba(31,111,235,.06)');
        drawSquare(g, aws.ex, aws.ey, { color: '#8c959f', width: 1.4, dash: [5, 4] });
        drawSquare(g, aw.ex, aw.ey, { color: '#e36209', width: 2.2 }, 'rgba(227,98,9,.08)');
        g.arrow(0, 0, w.V[0], w.V[1], { color: '#1f6feb', width: 3, alpha: 0.6 }, 10);
        g.text(w.V[0], w.V[1], 'V (Bob)', { dx: 6, dy: 10, color: '#1f6feb' });
        g.arrow(0, 0, w.v[0], w.v[1], { color: '#e36209', width: 3, alpha: 0.6 }, 10);
        g.text(w.v[0], w.v[1], 'v (Witch)', { dx: 6, dy: -10, color: '#e36209' });
        const ang = (a, b) => Math.acos(v3.dot(a, b) / (v3.norm(a) * v3.norm(b))) / deg;
        g.stext(8, 6, "Alice's frame, t_A = 0: unit squares of each frame\nangle between the Witch's axes: " + f(ang(aw.ex, aw.ey), 2) + '° (direct boost: ' + f(ang(aws.ex, aws.ey), 2) + '°)', { bg: 'rgba(255,255,255,.85)', lh: 15 });
      }
      function renderWignerB() {
        const g = B, w = wigner();
        // coordinates of the direct-boost rest frame W*; Witch's actual axes are R^T e_k there
        const R = w.d.R;
        const ex = [R[0][0], R[0][1]], ey = [R[1][0], R[1][1]];
        g.line(-3, 0, 3, 0, { color: '#eceff3' }); g.line(0, -3, 0, 3, { color: '#eceff3' });
        drawSquare(g, [1, 0, 0], [0, 1, 0], { color: '#8c959f', width: 1.4, dash: [5, 4] });
        drawSquare(g, ex, ey, { color: '#e36209', width: 2.2 }, 'rgba(227,98,9,.08)');
        // Alice and Bob velocities as seen by the Witch (in W* coords)
        const va = v3.neg(w.v);
        const vbW = v3.neg(w.vp);                     // Bob in W coordinates
        const vb = [R[0][0] * vbW[0] + R[1][0] * vbW[1], R[0][1] * vbW[0] + R[1][1] * vbW[1]];  // R^T
        g.arrow(0, 0, va[0], va[1], { color: '#222', width: 2.5 }, 10);
        g.text(va[0], va[1], 'Alice', { dx: 6, dy: 10 });
        g.arrow(0, 0, vb[0], vb[1], { color: '#1f6feb', width: 2.5 }, 10);
        g.text(vb[0], vb[1], 'Bob', { dx: 6, dy: -10, color: '#1f6feb' });
        // angle arc
        const th = Math.atan2(ex[1], ex[0]);
        const arc = []; for (let i = 0; i <= 30; i++) arc.push([0.45 * Math.cos(th * i / 30), 0.45 * Math.sin(th * i / 30)]);
        g.poly(arc, { color: '#cf222e', width: 2 });
        g.stext(8, 6, "Witch's rest space. Dashed: axes from a direct boost A → W.\nOrange: axes from A → B → W. Rotation = " + f(th / deg, 3) + '°', { bg: 'rgba(255,255,255,.85)', lh: 15 });
      }

      /* ================================================ Thomas precession */
      function buildThomas() {
        desc.innerHTML = 'A gyroscope (no torque) on a circular orbit. Every instant its rest frame is a pure boost of the previous one, but those boosts are not collinear: ' +
          'the Wigner rotations add up. After each orbit the gyroscope has turned by 2π(γ − 1), <b>opposite</b> to the orbital motion (eq. 3.13, 3.14). <span class="pill">Dragan 3.3</span>';
        ui.slider(sP, { label: 'orbital speed β', min: 0.01, max: 0.95, step: 0.01, value: st.beta, onInput: v => { st.beta = v; thomasNum = null; draw(); } });
        ui.buttons(sP, [{ label: '▶/❚❚ animate', onClick: () => player.toggle() }, { label: 'reset', onClick: () => { st.orbit = 0; draw(); } }]);
        ui.questions(sQ, [
          ['How does Thomas precession not violate angular momentum conservation?',
            'No torque acts in the gyroscope\'s own frame: its spin is simply carried along (Fermi–Walker transport). The "rotation" is a mismatch between that and the lab-aligned axes reached by pure boosts. It is a property of how frames fit together (boosts do not commute), not a mechanical torque.'],
          ['For an electron in hydrogen (v ≈ c/137), how large is the effect?',
            'Per orbit 2π(γ − 1) ≈ πβ² ≈ 1.7·10⁻⁴ rad, but the electron orbits ~6.6·10¹⁵ times per second, so the spin precesses at ~1.1·10¹² rad/s (exercise 3.6). This "Thomas half" is needed to get the observed fine structure.']
        ]);
        A.setBox(-1.6, 1.6, -1.6, 1.6);
        player.start();
      }
      function renderThomasA() {
        const g = A, b = st.beta, gam = P.gamma(b);
        const circ = []; for (let i = 0; i <= 120; i++) { const a = 2 * Math.PI * i / 120; circ.push([Math.cos(a), Math.sin(a)]); }
        g.poly(circ, { color: '#c9d1d9', width: 2 });
        const phi = st.orbit * 2 * Math.PI;
        // ghosts every 1/8 orbit along the path travelled so far
        const n0 = Math.max(0, Math.floor(st.orbit * 8) - 16);
        for (let k = n0; k <= Math.floor(st.orbit * 8); k++) {
          const ph = k * Math.PI / 4, spin = -(gam - 1) * ph;
          const x = Math.cos(ph), y = Math.sin(ph);
          g.arrow(x, y, x + 0.25 * Math.cos(spin), y + 0.25 * Math.sin(spin), { color: '#8250df', width: 1.2, alpha: 0.35 }, 6);
        }
        const x = Math.cos(phi), y = Math.sin(phi), spin = -(gam - 1) * phi;
        g.arrow(x, y, x - 0.3 * Math.sin(phi), y + 0.3 * Math.cos(phi), { color: '#1a7f37', width: 2 }, 8);
        g.arrow(x, y, x + 0.42 * Math.cos(spin), y + 0.42 * Math.sin(spin), { color: '#8250df', width: 3 }, 11);
        g.dot(x, y, 6, '#222');
        g.stext(8, 6, 'purple: gyroscope axis (started pointing along +x)\ngreen: velocity · faded: earlier positions (every 1/8 orbit)\norbits: ' + f(st.orbit, 2) + '   gyroscope turned: ' + f(spin / deg, 1) + '°', { bg: 'rgba(255,255,255,.85)', lh: 15 });
      }
      function renderThomasB() {
        const g = B, b = st.beta, gam = P.gamma(b);
        if (!thomasNum) thomasNum = [1, 2, 3].map(n => P.thomasNumeric(b, 1500, n));
        const nmax = 3, ymin = Math.min(-360 * (gam - 1) * nmax * 1.1, -30);
        g.lockAspect = false;
        g.margin = { l: 50, r: 12, t: 40, b: 32 };
        g.box = { xmin: 0, xmax: nmax, ymin, ymax: 10 }; g._fit();
        SR.Plot.prototype.axes.call(g, { xlabel: 'orbits completed', ylabel: 'gyroscope angle (degrees)' });
        g.line(0, 0, nmax, -360 * (gam - 1) * nmax, { color: '#8250df', width: 2 });
        thomasNum.forEach((a, i) => g.dot(i + 1, a / deg, 5, '#cf222e', '#fff'));
        g.dot(st.orbit % nmax, -360 * (gam - 1) * (st.orbit % nmax), 4, '#8250df');
        g.stext(56, 6, 'line: 2π(γ−1) per orbit (eq. 3.14)   red dots: 1500 composed boosts per orbit, matrix algebra', { color: '#333', font: '11.5px system-ui' });
      }

      /* ================================================ stick & hole */
      function buildStick() {
        desc.innerHTML = 'A stick (rest length L₀) slides along x at v; a barrier with a hole of width h moves up at u. In the lab the contracted stick passes the hole. ' +
          'In the stick frame the hole is narrower… so is there a collision? Lorentz contraction acts along the <b>total</b> velocity, which tilts the barrier. <span class="pill">Dragan 2.4</span>';
        ui.slider(sP, { label: 'stick speed v (x)', min: 0.05, max: 0.95, step: 0.01, value: st.sv, onInput: v => { st.sv = v; draw(); } });
        ui.slider(sP, { label: 'barrier speed u (y)', min: 0.05, max: 0.95, step: 0.01, value: st.su, onInput: v => { st.su = v; draw(); } });
        ui.slider(sP, { label: 'stick rest length L₀', min: 0.3, max: 3, step: 0.05, value: st.L0, onInput: v => { st.L0 = v; draw(); } });
        ui.slider(sP, { label: 'hole width h (lab)', min: 0.3, max: 3, step: 0.05, value: st.h, onInput: v => { st.h = v; draw(); } });
        ui.segmented(sP, { label: 'frame of the picture', value: st.frame, options: [{ value: 'lab', label: 'lab' }, { value: 'stick', label: 'stick' }, { value: 'barrier', label: 'barrier' }], onChange: v => { st.frame = v; draw(); } });
        ui.checkbox(sP, { label: 'overlay the WRONG picture (Fig. 2.4: contract each velocity component separately)', value: st.naive, onChange: v => { st.naive = v; draw(); } });
        tauSl = ui.slider(sP, { label: 'time in this frame', min: -1.6, max: 1.6, step: 0.01, value: st.tau, onInput: v => { st.tau = v; draw(); } });
        ui.buttons(sP, [{ label: '▶/❚❚ play', onClick: () => player.toggle() }]);
        ui.questions(sQ, [
          ['In the stick frame the hole is contracted to less than L₀. Why no crash?', 'The barrier is tilted by arctan(γuv) in that frame. Its points cross the stick\'s line one after another: the crossing point sweeps along the stick at c²/v > c (superluminal, carries nothing). Each part of the stick is above the hole when the barrier reaches it.'],
          ['What is wrong with Fig. 2.4?', 'It contracts the x component and treats y separately. A boost along a diagonal is not a boost along x followed by a boost along y (those would also produce a Wigner rotation). Lorentz transformations do not compose component by component.']
        ]);
        A.setBox(-2.2, 2.2, -1.6, 1.6);
      }
      function stickFrameV() { return st.frame === 'stick' ? [st.sv, 0, 0] : st.frame === 'barrier' ? [0, st.su, 0] : [0, 0, 0]; }
      function renderStick() {
        const g = A, Vf = stickFrameV(), gv = P.gamma(st.sv);
        const tau = st.tau;
        const Wd = 2.6;
        g.line(-5, 0, 5, 0, { color: '#f0f2f5' }); g.line(0, -5, 0, 5, { color: '#f0f2f5' });
        // barrier pieces: points (x0, u t) for x0 outside the hole
        const bar = x0 => placeIn(Vf, [x0, 0, 0], [0, st.su, 0], tau);
        const pieces = [[-Wd, -st.h / 2], [st.h / 2, Wd]];
        pieces.forEach(([a, b]) => { const p = bar(a), q = bar(b); g.line(p[0], p[1], q[0], q[1], { color: '#6e3e00', width: 6 }); });
        const e1 = bar(-st.h / 2), e2 = bar(st.h / 2);
        g.dot(e1[0], e1[1], 4, '#cf222e'); g.dot(e2[0], e2[1], 4, '#cf222e');
        // stick points: rest-frame offsets s in [-L0/2, L0/2] -> lab (s/gamma + v t, 0)
        const stk = s => placeIn(Vf, [s / gv, 0, 0], [st.sv, 0, 0], tau);
        const s1 = stk(-st.L0 / 2), s2 = stk(st.L0 / 2);
        g.line(s1[0], s1[1], s2[0], s2[1], { color: '#1f6feb', width: 5 });
        // wrong picture (only meaningful in the stick frame)
        if (st.naive && st.frame === 'stick') {
          const uy = st.su / gv, hx = st.h / gv;     // naive: barrier moves (-v, u/gamma), hole contracted along x only, no tilt
          const y = uy * tau, xs = -st.sv * tau;
          g.line(xs - Wd, y, xs - hx / 2, y, { color: '#cf222e', width: 2, dash: [6, 4] });
          g.line(xs + hx / 2, y, xs + Wd, y, { color: '#cf222e', width: 2, dash: [6, 4] });
          g.text(xs + Wd * 0.6, y, 'wrong picture', { dy: -10, color: '#cf222e' });
        }
        const collide = st.L0 / gv > st.h;
        g.stext(8, 6, 'frame: ' + st.frame + '   time = ' + f(tau, 2) + '\nblue: stick   brown: barrier with hole (red dots = hole edges)\n' + (collide ? 'COLLISION (in every frame)' : 'no collision (in every frame)'),
          { bg: 'rgba(255,255,255,.88)', lh: 15, color: collide ? '#cf222e' : '#1a7f37' });
      }

      /* ================================================ two squares */
      function sq() {
        const u = st.qu, g = P.gamma(u), a = 1, dy = st.qk * a;
        const X = (2 * a - dy) / (2 * g);
        const lo = Math.max(-X, X - a / g), hi = Math.min(-X + a / g, X);
        const yOn = x => -dy / 2 + a - g * (x + X);
        return { u, g, a, dy, X, lo, hi, yOn };
      }
      function buildSquares() {
        desc.innerHTML = 'Two equal squares fly at each other along a diagonal (here: ±u in their centre-of-mass frame, vertically offset). In each square\'s frame the other one is a squashed rhombus, and the first contact seems to be a vertex of one hitting the edge of the other. Which vertex makes the dent? <span class="pill">Dragan 5.3</span>';
        ui.slider(sP, { label: 'speed u of each (CM frame)', min: 0.1, max: 0.95, step: 0.01, value: st.qu, onInput: v => { st.qu = v; draw(); } });
        ui.slider(sP, { label: 'vertical offset (× half-diagonal)', min: 0.1, max: 1.9, step: 0.05, value: st.qk, onInput: v => { st.qk = v; draw(); } });
        ui.segmented(sP, { label: 'frame of the picture', value: st.qframe, options: [{ value: 'cm', label: 'CM frame' }, { value: 'left', label: 'left square' }, { value: 'right', label: 'right square' }], onChange: v => { st.qframe = v; draw(); } });
        tauSl = ui.slider(sP, { label: 'time in this frame', min: -1.4, max: 1.2, step: 0.005, value: st.qtau, onInput: v => { st.qtau = v; draw(); } });
        ui.buttons(sP, [{ label: '▶/❚❚ play', onClick: () => player.toggle() }]);
        ui.questions(sQ, [
          ['Where is the dent: at the left square\'s vertex or the right square\'s vertex?', 'Neither. In the CM frame the two rhombuses meet edge to edge, with both vertices touching at the same moment. In any other frame the contact point runs along the edge faster than light, so no part of the edge can "know" its neighbour was hit, and no single point takes the impact.'],
          ['Exercise 5.7: how fast does the contact point move in a square\'s rest frame?', 'Here it is √2·c²/u, where u is each square\'s speed in the CM frame. It is always faster than c (see the readout, computed from the transformed contact events).']
        ]);
        A.setBox(-2.4, 2.4, -1.8, 1.8);
      }
      /** the two ends of the contact segment (CM time 0) seen in the current frame */
      function sqContact() {
        const s = sq(), Vf = sqFrameV(), M = P.boostMatrix(Vf);
        const e1 = P.m4.vec(M, [0, s.lo, s.yOn(s.lo), 0]), e2 = P.m4.vec(M, [0, s.hi, s.yOn(s.hi), 0]);
        const loName = (-s.X >= s.X - s.a / s.g) ? "left square's top vertex" : "right square's left vertex";
        const hiName = (-s.X + s.a / s.g <= s.X) ? "left square's right vertex" : "right square's bottom vertex";
        const dt = e2[0] - e1[0], dr = Math.hypot(e2[1] - e1[1], e2[2] - e1[2]);
        return {
          speed: Math.abs(dt) < 1e-12 ? Infinity : dr / Math.abs(dt),
          first: Math.abs(dt) < 1e-12 ? 'both vertices at the same moment' : (dt < 0 ? hiName : loName) + ' touches the other edge first'
        };
      }
      function sqFrameV() { const u = st.qu; return st.qframe === 'left' ? [u, 0, 0] : st.qframe === 'right' ? [-u, 0, 0] : [0, 0, 0]; }
      function renderSquares() {
        const g = A, s = sq(), Vf = sqFrameV(), tau = st.qtau;
        const diamond = [[s.a, 0], [0, s.a], [-s.a, 0], [0, -s.a]];
        const shape = (cx, cy, w) => diamond.map(([x, y]) => placeIn(Vf, [cx + x / s.g, cy + y, 0], w, tau));
        const left = shape(-s.X, -s.dy / 2, [s.u, 0, 0]), right = shape(s.X, s.dy / 2, [-s.u, 0, 0]);
        g.poly(left, { color: '#1f6feb', width: 2 }, true, 'rgba(31,111,235,.12)');
        g.poly(right, { color: '#bf3989', width: 2 }, true, 'rgba(191,57,137,.12)');
        // contact events: CM time 0 along the overlap segment
        const n = 40, done = [];
        let cur = null;
        for (let i = 0; i <= n; i++) {
          const x = s.lo + (s.hi - s.lo) * i / n, y = s.yOn(x);
          const ev = P.m4.vec(P.boostMatrix(Vf), [0, x, y, 0]);
          if (ev[0] <= tau) done.push([ev[1], ev[2]]);
          if (i === 0 || i === n) { const p = [ev[1], ev[2]]; g.dot(p[0], p[1], 3, '#6e7781'); }
        }
        if (done.length > 1) g.poly(done, { color: '#cf222e', width: 5 });
        else if (done.length === 1) g.dot(done[0][0], done[0][1], 5, '#cf222e');
        g.stext(8, 6, 'frame: ' + st.qframe + '   time = ' + f(tau, 3) + '\nred: part of the contact edge already touched (in this frame)', { bg: 'rgba(255,255,255,.88)', lh: 15 });
      }

      /* ---------------------------------------------------- dispatch */
      A.onRender = () => { if (st.mode === 'wigner') renderWignerA(); else if (st.mode === 'thomas') renderThomasA(); else if (st.mode === 'stick') renderStick(); else renderSquares(); };
      B.onRender = () => { if (st.mode === 'wigner') renderWignerB(); else if (st.mode === 'thomas') renderThomasB(); };

      function readouts() {
        if (st.mode === 'wigner') {
          const w = wigner(), formula = P.wignerAngleFormula(w.V, w.vp);
          const Vc = P.relativeVelocityCorrect(w.v, w.vp), Vn = P.relativeVelocityNaive(w.v, w.vp);
          const Vc2 = P.relativeVelocityCorrect(w.vp, w.v), Vn2 = P.relativeVelocityNaive(w.vp, w.v);
          const R = w.d.R, va = v3.neg([R[0][0] * w.v[0] + R[0][1] * w.v[1], R[1][0] * w.v[0] + R[1][1] * w.v[1], 0]);
          ro.set(['composition A → B → W',
            ['v = Witch w.r.t. Alice', ui.fmtv(w.v, 4) + '  |v| = ' + f(v3.norm(w.v), 4)],
            ["Witch's axes rotated by (matrix decomposition)", f(-w.d.angleZ / deg, 4) + '° (+ = counter-clockwise)', 'hl'],
            ['closed formula (unsigned)', f(formula / deg, 4) + '°'],
            ['Alice seen by the Witch: −R·v', ui.fmtv(va, 4)],
            ['naive expectation −v', ui.fmtv(v3.neg(w.v), 4), 'bad'],
            'hardest problem: Bob from (v, v′) alone',
            ['true V', ui.fmtv(w.V, 4)],
            ['one-line formula (7.11) / (3.18)', ui.fmtv(Vc, 4), 'good'],
            ['naive formula (3.7)', ui.fmtv(Vn, 4), 'bad'],
            ['correct, roles swapped (should be −V)', ui.fmtv(Vc2, 4)],
            ['naive, roles swapped vs −naive', ui.fmtv(Vn2, 3) + ' vs ' + ui.fmtv(v3.neg(Vn), 3)]]);
        } else if (st.mode === 'thomas') {
          const b = st.beta, g = P.gamma(b), num = thomasNum ? thomasNum[0] : P.thomasNumeric(b, 1500, 1);
          const alpha = 1 / 137.036, gH = P.gamma(alpha), vH = alpha * 299792458, rH = 5.29177e-11;
          ro.set([['γ', f(g, 5)], ['per orbit 2π(γ − 1)', f(360 * (g - 1), 3) + '° (retrograde)', 'hl'],
            ['numerical: 1500 composed boosts', f(num / deg, 3) + '°', 'good'], ['ω_Thomas / ω_orbit = γ − 1', f(g - 1, 5)],
            'hydrogen ground state (ex. 3.6)', ['per orbit', f(2 * Math.PI * (gH - 1), 3) + ' rad'], ['per second', f((gH - 1) * vH / rH, 3) + ' rad']]);
        } else if (st.mode === 'stick') {
          const gv = P.gamma(st.sv), tilt = Math.atan(gv * st.su * st.sv);
          ro.set([['contracted stick in lab L₀/γ', f(st.L0 / gv, 3) + (st.L0 / gv < st.h ? ' < h: passes' : ' > h: crash'), st.L0 / gv < st.h ? 'good' : 'bad'],
            ['barrier tilt in stick frame arctan(γuv)', f(tilt / deg, 2) + '°', 'hl'],
            ['hole size along the tilted barrier (stick frame)', f(st.h * Math.sqrt(1 / (gv * gv) + st.su * st.su * st.sv * st.sv), 3)],
            ["crossing point sweeps along the stick at c²/v", f(1 / st.sv, 3) + ' c'],
            ['wrong picture: hole h/γ vs stick L₀', f(st.h / gv, 3) + ' vs ' + f(st.L0, 3) + ' → would crash', 'bad']]);
        } else {
          const s = sq(), k = sqContact();
          ro.set([['γ(u) (CM frame)', f(s.g, 4)], ['relative speed of the squares', f(P.addVelocities(s.u, s.u), 4)],
            ['first contact in this frame', k.first, 'hl'],
            ['contact point speed (this frame)', isFinite(k.speed) ? f(k.speed, 4) + ' c' : '∞ (all at once)', 'hl'],
            ['prediction √2·c²/u (square frames)', f(Math.SQRT2 / s.u, 4) + ' c']]);
        }
      }
      build();
    }
  });
})();
