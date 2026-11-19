/* Tab 3 - Twin paradox lab (Dragan 2.6, 2.7, 8.9). Units: years and light years (c = 1). */
(function () {
  'use strict';
  const SR = window.SR, P = SR.phys, ui = SR.ui, C = SR.COLORS, f = ui.fmt;
  const ALICE = '#cf222e', ROB = '#1f6feb';

  SR.modules.push({
    id: 'twins', order: 3, title: '3 · Twin paradox', tip: 'Proper time along any trip, lines of simultaneity, light signals (2.6, 2.7, 8.9)',
    init(panel) {
      const L = ui.layout(panel);
      const cv = L.canvas({ flex: '1 1 0' });
      const cp = L.canvas({ height: 210 });
      const D = new SR.MinkowskiDiagram(cv);
      D.tName = 't'; D.xName = 'x';
      const PL = new SR.Plot(cp, { xlabel: "Rob's proper time τ (years)", ylabel: "Alice's age (years)" });
      PL.pannable = false; PL.zoomable = false;

      const st = {
        mode: 'instant', beta: 0.8, Dist: 4, g: 1.03, bmax: 0.8, coast: 2,
        way: [[0, 0], [3.5, 2.6], [6.5, 3.2], [10, 0]], Lc: 4, tau: 0,
        fan: true, sigA: true, sigR: false, ticks: true, viewV: 0
      };
      let rob = null, info = {};

      function buildTrip() {
        info = {};
        if (st.mode === 'instant') {
          const tt = st.Dist / st.beta;
          rob = new P.Worldline([[0, 0], [tt, st.Dist], [2 * tt, 0]]);
          info.turn = rob.tau[1];
        } else if (st.mode === 'smooth') {
          const phi = P.rapidity(st.bmax), ta = phi / st.g;
          rob = P.tripFromPhases([
            { tau: ta, a: st.g, flag: 'acc' }, { tau: st.coast, a: 0, flag: 'coast' },
            { tau: 2 * ta, a: -st.g, flag: 'turn' }, { tau: st.coast, a: 0, flag: 'coast' }, { tau: ta, a: st.g, flag: 'acc' }
          ], { dtau: 0.01 });
        } else if (st.mode === 'way') {
          rob = new P.Worldline(st.way.map(q => q.slice()));
        } else {
          const tt = st.Lc / st.beta;
          rob = new P.Worldline([[0, 0], [tt, st.Lc]]);
        }
        info.T = rob.pts[rob.pts.length - 1][0];
        info.tauEnd = rob.tauEnd();
        st.tau = Math.min(st.tau, info.tauEnd);
      }
      /** velocity of Rob at proper time tau; side = -1 / +1 picks the left/right limit at corners */
      function robAt(tau, side) {
        const e = rob.atTau(Math.max(0, Math.min(info.tauEnd, tau + (side || 0) * 1e-7)));
        if (!e) { const p = rob.pts[rob.pts.length - 1]; return { t: p[0], x: p[1], v: 0, tau }; }
        return e;
      }
      const aliceBySim = e => e.t - e.v * e.x;               // Rob's line of simultaneity meets x = 0
      const aliceSeen = e => e.t - Math.abs(e.x);           // light from Alice (at x = 0) reaching Rob

      /* ------------------------------------------------------- side panel */
      const s0 = ui.section(L.side, 'Trip');
      ui.segmented(s0, {
        value: st.mode,
        options: [{ value: 'instant', label: 'instant turn' }, { value: 'smooth', label: 'smooth (const. g)' }, { value: 'way', label: 'drag your own' }, { value: 'loop', label: 'loopy universe' }],
        onChange: v => { st.mode = v; buildParams(); rebuild(true); }
      });
      const pBox = ui.el('div'); s0.append(pBox);
      const modeNote = ui.note(s0, '', 'small');
      const s1 = ui.section(L.side, "Rob's clock");
      const sTau = ui.slider(s1, { label: "Rob's proper time τ", min: 0, max: 10, step: 0.01, value: 0, onInput: v => { st.tau = v; update(); } });
      const player = ui.player(dt => { st.tau += dt * info.tauEnd / 10; if (st.tau > info.tauEnd) { st.tau = info.tauEnd; update(); return false; } update(); });
      player.onStop = () => { pbtn.byId.play.textContent = '▶ play trip'; };
      const pbtn = ui.buttons(s1, [
        { id: 'play', label: '▶ play trip', onClick: () => { if (st.tau >= info.tauEnd - 1e-9) st.tau = 0; const on = player.toggle(); pbtn.byId.play.textContent = on ? '❚❚ pause' : '▶ play trip'; } },
        { label: 'fit view', onClick: () => fit() }
      ]);
      const sv = ui.section(L.side, 'Draw from the frame of');
      const viewBtns = ui.el('div', { class: 'btns' }); sv.append(viewBtns);
      const s2 = ui.section(L.side, 'Display');
      const g2 = ui.el('div', { class: 'chkgrid' }); s2.append(g2);
      ui.checkbox(g2, { label: "Rob's simultaneity fan", value: st.fan, onChange: v => { st.fan = v; update(); } });
      ui.checkbox(g2, { label: 'yearly ticks', value: st.ticks, onChange: v => { st.ticks = v; update(); } });
      ui.checkbox(g2, { label: 'Alice → Rob flashes (yearly)', value: st.sigA, onChange: v => { st.sigA = v; update(); } });
      ui.checkbox(g2, { label: 'Rob → Alice flashes (yearly)', value: st.sigR, onChange: v => { st.sigR = v; update(); } });
      ui.legend(s2, [{ color: ALICE, label: 'Alice' }, { color: ROB, label: 'Rob' }, { color: '#7c3aed', label: "Rob's 'now'", dash: true }, { color: C.light, label: 'light flashes' }]);
      const s3 = ui.section(L.side, 'Readouts');
      const ro = ui.readout(s3);
      const s4 = ui.section(L.side, 'Predict, then reveal');
      [
        ['Instant turn, β = 0.8, D = 4 ly. On each leg Rob says Alice\'s clock runs at 0.6× his. How can she be older at the end?',
          'Outbound: Rob ages 3 yr, Alice (by his simultaneity) 1.8 yr. At the turn his line of simultaneity swings and Alice\'s clock jumps by 2βD = 6.4 yr. Inbound again 1.8 yr. Total 1.8 + 6.4 + 1.8 = 10 = Alice\'s own count. The jump happens because Rob changes frames; Alice never does.'],
        ['What does Rob actually <i>see</i> through a telescope on the way out and back?',
          'Light-travel effects (Doppler): outbound Alice\'s flashes arrive every √((1+β)/(1−β)) = 3 years, so he sees 1 year pass in his 3. Inbound he sees 9 years in his 3. Total 10. Nothing jumps in what he sees; the jump is only in what he calls "now".'],
        ['Smooth mode: when does Alice\'s clock run fast according to Rob?',
          'Only while Rob accelerates <i>towards</i> Alice. Then d(age)/dτ = (1/γ)(1 − a·x/γ); at the moment he is momentarily at rest it is exactly 1 + g·x/c², the gravitational time dilation of an accelerated frame (8.5, 8.9).'],
        ['Drag-your-own mode: can any trip from (0,0) back to Alice give Rob MORE proper time than Alice?',
          'No. Between two timelike-separated events the straight (inertial) worldline has the greatest proper time; every wiggle reduces it. Try it.'],
        ['Loopy universe: both twins are inertial and meet again. Who is younger?',
          'Rob. A periodic universe has a preferred frame (the one in which the identification x ~ x + L is simultaneous). Rob\'s "now" gives two copies of the same Alice different ages (see the readouts), and light sent around the universe returns to him at different times in the two directions. The principle of relativity fails (2.7).']
      ].forEach(q => ui.reveal(s4, q[0], q[1]));

      function buildParams() {
        pBox.innerHTML = '';
        if (st.mode === 'instant') {
          ui.slider(pBox, { label: 'speed β', min: 0.05, max: 0.995, step: 0.005, value: st.beta, onInput: v => { st.beta = v; rebuild(); } });
          ui.slider(pBox, { label: 'distance D (ly)', min: 0.5, max: 20, step: 0.1, value: st.Dist, onInput: v => { st.Dist = v; rebuild(); } });
          modeNote.innerHTML = 'Out at β, instant reversal at distance D, back at β (Fig. 2.7).';
        } else if (st.mode === 'smooth') {
          ui.slider(pBox, { label: 'proper accel. g (ly/yr²)', min: 0.2, max: 5, step: 0.01, value: st.g, onInput: v => { st.g = v; rebuild(); } });
          ui.slider(pBox, { label: 'cruise speed β', min: 0.1, max: 0.99, step: 0.005, value: st.bmax, onInput: v => { st.bmax = v; rebuild(); } });
          ui.slider(pBox, { label: 'cruise (proper yr)', min: 0, max: 10, step: 0.1, value: st.coast, onInput: v => { st.coast = v; rebuild(); } });
          modeNote.innerHTML = 'Accelerate, cruise, turn around (accelerating towards Alice), cruise, brake. 1 g ≈ 1.03 ly/yr².';
        } else if (st.mode === 'way') {
          modeNote.innerHTML = 'Drag Rob\'s waypoints (squares). The last one stays on Alice\'s worldline (drag it up/down). Segments are kept slower than light. ' +
            '<a class="tablink" id="tw-add">add waypoint</a> · <a class="tablink" id="tw-rm">remove waypoint</a>';
          setTimeout(() => {
            const a = document.getElementById('tw-add'), r = document.getElementById('tw-rm');
            if (a) a.onclick = () => { const n = st.way.length; const p = st.way[n - 2], q = st.way[n - 1]; st.way.splice(n - 1, 0, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]); rebuild(); };
            if (r) r.onclick = () => { if (st.way.length > 2) { st.way.splice(st.way.length - 2, 1); rebuild(); } };
          });
        } else {
          ui.slider(pBox, { label: 'circumference L (ly)', min: 1, max: 10, step: 0.1, value: st.Lc, onInput: v => { st.Lc = v; rebuild(); } });
          ui.slider(pBox, { label: "Rob's speed β", min: 0.1, max: 0.99, step: 0.01, value: st.beta, onInput: v => { st.beta = v; rebuild(); } });
          modeNote.innerHTML = 'Space is a circle: x and x + L are the same place (copies of Alice drawn at x = kL). Rob flies around the universe once and meets Alice again, without ever accelerating.';
        }
      }

      /* waypoint handles (index 0 is the fixed departure event) */
      for (let i = 1; i < 12; i++) {
        D.addHandle(() => (st.mode === 'way' && st.way[i]) ? D.pt(st.way[i][0], st.way[i][1]) : null, (X, Y) => {
          const w = st.way, n = w.length;
          if (!w[i]) return;
          let [t, x] = D.toLab(X, Y);
          x = Math.round(x * 20) / 20;
          if (i === n - 1) x = 0;                       // the reunion stays on Alice's worldline
          const prev = w[i - 1], next = w[i + 1];
          const lo = prev[0] + Math.abs(x - prev[1]) / 0.995;   // keep both segments slower than light
          const hi = next ? next[0] - Math.abs(next[1] - x) / 0.995 : Infinity;
          if (lo > hi) return;
          t = Math.max(lo, Math.min(hi, Math.round(t * 20) / 20));
          w[i] = [t, x];
          rebuild();
        }, { enabled: () => st.mode === 'way' && i < st.way.length, cursor: 'move' });
      }

      function frames() {
        const out = [{ name: 'Alice', V: 0 }];
        if (st.mode === 'instant') { out.push({ name: 'Rob outbound', V: st.beta }, { name: 'Rob inbound', V: -st.beta }); }
        else if (st.mode === 'smooth') { out.push({ name: 'Rob cruising out', V: st.bmax }, { name: 'Rob cruising back', V: -st.bmax }); }
        else if (st.mode === 'loop') { out.push({ name: 'Rob', V: st.beta }); }
        else { const p = rob.pts; out.push({ name: 'Rob, first leg', V: (p[1][1] - p[0][1]) / (p[1][0] - p[0][0]) }, { name: 'Rob, last leg', V: (p[p.length - 1][1] - p[p.length - 2][1]) / (p[p.length - 1][0] - p[p.length - 2][0]) }); }
        return out;
      }
      let cancel = null;
      function buildViewBtns() {
        viewBtns.innerHTML = '';
        frames().forEach(F => {
          const b = ui.el('button', { html: F.name + ' <span class="pill">' + f(F.V, 3) + '</span>' });
          b.onclick = () => { if (cancel) cancel(); cancel = ui.tweenVelocity(st.viewV, F.V, 650, v => { st.viewV = v; update(); }); };
          viewBtns.append(b);
        });
      }
      function fit() {
        st.viewV = 0;
        const T = info.T, X = Math.max(...rob.pts.map(p => Math.abs(p[1])), st.mode === 'loop' ? st.Lc : 1);
        D.setBox(-0.35 * X - 1, X * 1.35 + 1, -0.6, T + 0.8);
      }
      function rebuild(refit) {
        buildTrip();
        sTau.setRange(0, info.tauEnd.toFixed(3));
        if (refit) { st.tau = info.tauEnd * 0.3; fit(); }
        sTau.set(st.tau);
        buildViewBtns();
        update();
      }

      /* -------------------------------------------------------- drawing */
      D.onRender = () => {
        if (!rob) return;
        D.viewV = st.viewV;
        D.drawFrame(0, { color: '#c3cad4', grid: true, axes: false, gridAlpha: 0.5 });
        D.drawLightCone(0, 0, { color: C.light, width: 1, dash: [6, 5], alpha: 0.5 }, false);
        D.drawFrame(0, { color: '#57606a', ticks: true, width: 1 });
        const T = info.T;
        const alice = new P.Worldline([[0, 0], [T, 0]]);
        const copies = st.mode === 'loop' ? [-1, 0, 1, 2] : [0];
        copies.forEach(k => {
          const w = new P.Worldline([[-0.5, k * st.Lc], [T + 0.5, k * st.Lc]], { tau0: -0.5 });
          D.drawWorldline(w, { color: ALICE, width: k === 0 ? 3 : 2, alpha: k === 0 ? 1 : 0.55, dash: k === 0 ? null : [8, 4] });
          if (st.ticks) D.drawTicks(w, 1, { color: ALICE, labels: true, side: -1, labelEvery: 1, fmt: v => v.toFixed(0) });
        });
        // simultaneity fan
        const nowE = robAt(st.tau, 0);
        if (st.fan) {
          const n = 40;
          for (let i = 0; i <= n; i++) {
            const e = robAt(info.tauEnd * i / n, 0);
            const pt = D.pt(e.t, e.x), dir = D.ptd(e.v, 1);   // line t - t_R = v (x - x_R)
            D.infLine(pt[0], pt[1], dir[0], dir[1], { color: ROB, width: 0.7, alpha: 0.18 });
          }
        }
        // light flashes
        if (st.sigA) {
          for (let k = 1; k <= Math.floor(T); k++) {
            let h = rob.intersect(1, -1, k);
            if (!h || h.x < -1e-9) h = rob.intersect(1, 1, k);
            if (!h) continue;
            const a = D.pt(k, 0), b = D.pt(h.t, h.x);
            D.seg(a[0], a[1], b[0], b[1], { color: C.light, width: 1, alpha: 0.9 });
          }
        }
        if (st.sigR) {
          rob.ticks(1).forEach(e => {
            if (e.tau < 1e-9) return;
            const a = D.pt(e.t, e.x), b = D.pt(e.t + Math.abs(e.x), 0);
            D.seg(a[0], a[1], b[0], b[1], { color: '#bf8700', width: 1, dash: [3, 3] });
          });
        }
        // Rob
        if (st.mode === 'smooth') D.drawWorldline(rob, { color: ROB, width: 3 }, { acc: { color: '#0a3069', width: 3.4 }, turn: { color: '#8250df', width: 3.4 }, coast: { color: ROB, width: 3 } });
        else D.drawWorldline(rob, { color: ROB, width: 3 });
        if (st.ticks) D.drawTicks(rob, 1, { color: ROB, labels: true, side: 1, fmt: v => v.toFixed(0) });
        if (st.mode === 'loop') {   // Rob's image one circumference to the left (same person)
          D.drawWorldline(new P.Worldline(rob.pts.map(p => [p[0], p[1] - st.Lc])), { color: ROB, width: 2, dash: [8, 4], alpha: 0.5 });
        }
        if (st.mode === 'way') st.way.forEach((w, i) => { if (i > 0) { const p = D.pt(w[0], w[1]); D.ctx.fillStyle = ROB; D.ctx.fillRect(D.sx(p[0]) - 5, D.sy(p[1]) - 5, 10, 10); } });
        // Rob's current "now"
        const pt = D.pt(nowE.t, nowE.x), dir = D.ptd(nowE.v, 1);
        D.infLine(pt[0], pt[1], dir[0], dir[1], { color: '#7c3aed', width: 1.8, dash: [7, 4] });
        D.drawEvent(nowE.t, nowE.x, { label: 'Rob τ=' + f(st.tau, 2), color: ROB });
        copies.forEach(k => {
          const tA = nowE.t + nowE.v * (k * st.Lc - nowE.x);
          if (tA >= 0 && tA <= T) D.drawEvent(tA, k * st.Lc, { label: "Alice " + f(tA, 2), color: ALICE, r: 4 });
        });
        D.drawCursorInfo([{ V: 0, name: 'Alice', prime: '' }]);
      };

      PL.onRender = () => {
        if (!rob) return;
        const N = 500, seenPts = [];
        const ymax = Math.max(info.T, info.tauEnd) * 1.05 + 0.2;
        PL.box = { xmin: 0, xmax: info.tauEnd || 1, ymin: -0.02 * ymax, ymax };
        PL._fit();
        PL.axes();
        PL.clipped(() => {
          PL.line(0, 0, info.tauEnd, info.tauEnd, { color: '#9aa3ae', dash: [4, 4] });
          PL.text(info.tauEnd * 0.98, info.tauEnd * 0.98, 'Rob\'s own age', { align: 'right', dy: -8, color: '#6e7781', font: '10.5px system-ui' });
          if (st.mode === 'loop') return;
          // sample uniformly plus exactly at the corners of Rob's worldline (where his frame jumps)
          const taus = [];
          for (let i = 0; i <= N; i++) taus.push(info.tauEnd * i / N);
          for (let i = 1; i < rob.pts.length - 1; i++) if (st.mode !== 'smooth') taus.push(rob.tau[i]);
          taus.sort((a, b) => a - b);
          const solid = { color: '#7c3aed', width: 2.2 }, jump = { color: '#7c3aed', width: 1.5, dash: [3, 3] };
          let seg = [];
          taus.forEach(tau => {
            const yL = aliceBySim(robAt(tau, -1)), yR = aliceBySim(robAt(tau, 1));
            seg.push([tau, yL]);
            if (Math.abs(yR - yL) > 1e-6 * ymax) { PL.poly(seg, solid); PL.line(tau, yL, tau, yR, jump); seg = [[tau, yR]]; }
            seenPts.push([tau, aliceSeen(robAt(tau, 0))]);
          });
          PL.poly(seg, solid);
          PL.poly(seenPts, { color: C.light, width: 2 });
          const e = robAt(st.tau, 0);
          PL.vline(st.tau, { color: '#57606a', dash: [2, 3] });
          PL.dot(st.tau, aliceBySim(e), 4.5, '#7c3aed');
          PL.dot(st.tau, aliceSeen(e), 4.5, C.light);
        });
        const c = PL.ctx; c.font = '11.5px system-ui'; c.textAlign = 'left'; c.textBaseline = 'top';
        c.fillStyle = '#7c3aed'; c.fillText("— Alice's age on Rob's line of simultaneity", PL.margin.l + 8, PL.margin.t + 4);
        c.fillStyle = '#b07600'; c.fillText('— Alice\'s age Rob sees through a telescope (light)', PL.margin.l + 8, PL.margin.t + 19);
      };

      function update() {
        if (!rob) return;
        sTau.set(st.tau);
        D.requestDraw(); PL.requestDraw();
        const e = robAt(st.tau, 0), g = P.gamma(e.v);
        const rows = ["totals", ['Alice\'s time at reunion T', f(info.T, 3) + ' yr'], ["Rob's proper time τ", f(info.tauEnd, 3) + ' yr'], ['difference', f(info.T - info.tauEnd, 3) + ' yr', 'hl']];
        rows.push('at Rob\'s τ = ' + f(st.tau, 2));
        rows.push(['Rob: t, x, v', f(e.t, 2) + ', ' + f(e.x, 2) + ', ' + f(e.v, 3)]);
        if (st.mode !== 'loop') {
          rows.push(["Alice's age on Rob's 'now'", f(aliceBySim(e), 3), 'hl']);
          rows.push(["Alice's age Rob sees (light)", f(aliceSeen(e), 3)]);
          // rate of Alice's age per Rob's proper time. The smooth trip is stored as short straight
          // pieces, so differentiate across several of them (or use the exact formula below).
          const h = st.mode === 'smooth' ? 0.03 : 1e-4;
          const ta = Math.max(0, st.tau - h), tb = Math.min(info.tauEnd, st.tau + h);
          const rate = (aliceBySim(robAt(tb, 0)) - aliceBySim(robAt(ta, 0))) / (tb - ta);
          rows.push(["rate d(Alice's age)/dτ (simultaneity)", f(rate, 3) + (Math.abs(rate - 1 / g) < 2e-3 ? ' = 1/γ (inertial)' : '')]);
          if (st.mode === 'smooth') {
            const a = e.flag === 'turn' ? -st.g : e.flag === 'acc' ? st.g : 0;
            rows.push(['exact: (1/γ)(1 − a·x/γ), a = ' + f(a, 2), f((1 / g) * (1 - a * e.x / g), 3), a < 0 ? 'hl' : '']);
          }
        }
        if (st.mode === 'instant') rows.push(['jump at the turn 2βD', f(2 * st.beta * st.Dist, 3) + ' yr']);
        if (st.mode === 'smooth') rows.push(['at a turn point (v = 0) the rate is 1 + g·x/c²', 'gravitational time dilation (8.9)']);
        if (st.mode === 'loop') {
          const a0 = e.t + e.v * (0 - e.x), a1 = e.t + e.v * (st.Lc - e.x);
          rows.push(["Rob's 'now': age of Alice copy at x=0", f(a0, 3)]);
          rows.push(["Rob's 'now': age of Alice copy at x=L", f(a1, 3), 'bad']);
          rows.push(['same person, different "now" ages, differ by βL', f(st.beta * st.Lc, 3)]);
          const gb = P.gamma(st.beta);
          rows.push(['light sent around the universe returns after (Rob\'s clock): forward / backward', f(gb * st.Lc * (1 + st.beta), 3) + ' / ' + f(gb * st.Lc * (1 - st.beta), 3)]);
          rows.push(['…for Alice (preferred frame): both directions', f(st.Lc, 3)]);
        }
        if (st.sigA && st.mode !== 'loop') rows.push(['Alice flashes received by Rob during trip', Math.floor(info.T + 1e-9) + ' (one per Alice year)']);
        ro.set(rows);
      }
      D.onViewChange = () => {};
      D.onHover = () => D.requestDraw();
      buildParams();
      rebuild(true);
    }
  });
})();
