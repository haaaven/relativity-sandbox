/* Tab 2 - Paradox lab: guided scenarios on a Minkowski diagram + "space right now" strip.
   Each scenario describes worldlines in lab coordinates; the engine draws them in any frame,
   slices them with the current line of simultaneity and shows the result as a snapshot of space. */
(function () {
  'use strict';
  const SR = window.SR, P = SR.phys, ui = SR.ui, C = SR.COLORS, f = ui.fmt;
  const BIG = 1e4;

  /* ---------------------------------------------------------- helpers */
  const rest = (x, tau0) => new P.Worldline([[-BIG, x], [BIG, x]], { tau0: tau0 === undefined ? -BIG : tau0 });
  /** at rest at x, with flags that change at the given lab times */
  const steps = (x, times, flags) => {
    const pts = [[-BIG, x]];
    times.forEach(t => pts.push([t, x]));
    pts.push([BIG, x]);
    return new P.Worldline(pts, { tau0: -BIG, flags });
  };
  const unif = (x0, v, opt) => P.uniform(x0, v, Object.assign({ tmin: -BIG, tmax: BIG }, opt || {}));

  const SC = [];

  /* ======================================================= 1 stomping feet */
  SC.push({
    id: 'feet', title: 'Relativity of simultaneity: stomping feet', ref: '2.1',
    desc: 'You stand still (frame S) and stomp both feet at the same moment; the feet are d apart. ' +
      'An observer moving past you with velocity V uses different lines of simultaneity. Drag the view velocity or use the frame buttons.',
    params: [{ id: 'd', label: 'distance d between feet', min: 0.5, max: 8, step: 0.1, value: 4 }],
    view: () => [-6, 6, -3.5, 5],
    frames: () => [{ name: 'you (S)', V: 0 }, { name: 'passer-by → (V = +0.6)', V: 0.6 }, { name: 'passer-by ← (V = −0.6)', V: -0.6 }],
    build: p => {
      const fs = { up: { color: '#8c959f', width: 2 }, down: { color: '#cf222e', width: 3.5 } };
      return {
        wls: [
          { id: 'C', wl: rest(0), color: '#c0c6cf', dash: [2, 3] },
          { id: 'L', wl: steps(-p.d / 2, [0], ['up', 'down']), flagStyles: fs },
          { id: 'R', wl: steps(p.d / 2, [0], ['up', 'down']), flagStyles: fs }
        ],
        events: [{ t: 0, x: -p.d / 2, label: 'left stomp' }, { t: 0, x: p.d / 2, label: 'right stomp' }],
        lanes: 2,
        space: [
          { type: 'glyph', wl: 'C', lane: 0, glyph: 'person', color: '#333', label: 'you' },
          { type: 'glyph', wl: 'L', lane: 1, glyph: 'foot', flagColor: { up: '#8c959f', down: '#cf222e' }, flagDy: { up: -9, down: 2 }, flagLabel: { up: 'L (up)', down: 'L stomped' } },
          { type: 'glyph', wl: 'R', lane: 1, glyph: 'foot', flagColor: { up: '#8c959f', down: '#cf222e' }, flagDy: { up: -9, down: 2 }, flagLabel: { up: 'R (up)', down: 'R stomped' } }
        ]
      };
    },
    readouts: (p, c) => {
      const V = c.viewV, g = P.gamma(V), dtp = -g * V * p.d;
      return [['view-frame velocity V', f(V, 3)],
        ["Δt' = t'_R − t'_L = −γVd/c² (eq. 2.1)", f(dtp, 3)],
        ['first stomp in this frame', Math.abs(dtp) < 1e-9 ? 'both at once' : dtp < 0 ? 'RIGHT foot' : 'LEFT foot', 'hl']];
    },
    questions: [
      ['A passer-by moves to the right (V > 0). Which foot stomps first for them?',
        'The right one: Δt′ = −γVd < 0. For an observer moving towards an event, its time coordinate is smaller (the x′ axis tilts up towards the light cone, so events on the right fall below the S′ "now").'],
      ['With d = 4, is there an observer for whom the left stomp happens 10 units of time before the right one?',
        'Yes. |Δt′| = γ|V|d grows without bound as |V| → c. You need γV = −2.5, i.e. V ≈ −0.928 (moving to the left). For spacelike events both the order and the size of the time gap depend on the frame, but no signal can ever connect them.'],
      ['Could one stomp have caused the other?', 'No: they are spacelike separated (Δx > cΔt), so no signal slower than light connects them, in any frame.']
    ]
  });

  /* ================================================== 2 clocks & dilation */
  SC.push({
    id: 'clocks', title: 'Time dilation and desynchronised clocks', ref: '2.2',
    desc: 'Black clocks are at rest in S and synchronised in S. Blue clocks are at rest in S′ (velocity V) and synchronised in S′. ' +
      'Slide the "now" line and switch frames: each set of clocks runs slow and is out of sync in the <i>other</i> frame.',
    params: [{ id: 'V', label: 'S′ velocity V', min: -0.95, max: 0.95, step: 0.01, value: 0.6 }],
    view: () => [-9, 9, -2, 8],
    frames: p => [{ name: 'S (black clocks)', V: 0 }, { name: 'S′ (blue clocks)', V: p.V }],
    build: p => {
      const g = P.gamma(p.V), wls = [], space = [];
      for (let x = -8; x <= 8; x += 2) {
        wls.push({ id: 's' + x, wl: rest(x), color: '#9aa1aa', width: x === 0 ? 1.6 : 0.8, ticks: x === 0 ? 1 : 0 });
        space.push({ type: 'clock', wl: 's' + x, lane: 0, color: '#333', label: x === 0 ? 'S' : '' });
        wls.push({ id: 'p' + x, wl: unif(x / g, p.V), color: C.S1, width: x === 0 ? 1.8 : 0.8, ticks: x === 0 ? 1 : 0, alpha: 0.8 });
        space.push({ type: 'clock', wl: 'p' + x, lane: 1, color: C.S1, label: x === 0 ? 'S′' : '' });
      }
      return { wls, space, lanes: 2, events: [] };
    },
    readouts: (p, c) => {
      const a0 = c.at('s0'), a2 = c.at('s2'), b0 = c.at('p0'), b2 = c.at('p2');
      const g = P.gamma(p.V);
      const rows = [['γ', f(g, 4)]];
      if (a0 && a2) rows.push(['black neighbours (2 apart): reading x=2 minus x=0', f(a2.tau - a0.tau, 3)]);
      if (b0 && b2) rows.push(["blue neighbours (2 apart): reading x'=2 minus x'=0", f(b2.tau - b0.tau, 3)]);
      const uS = -c.viewV, uP = P.transformVelocity(p.V, c.viewV);
      rows.push(['black clocks tick at (per unit view time)', f(Math.sqrt(1 - uS * uS), 3)]);
      rows.push(['blue clocks tick at (per unit view time)', f(Math.sqrt(1 - uP * uP), 3)]);
      rows.push(['predicted lag of a moving clock pair', 'V·(proper distance) = ' + f(Math.abs(p.V) * 2, 3)]);
      return rows;
    },
    questions: [
      ['V = 0.6, in S at t = 5: what does the blue clock that is currently at x = 0 read? And the blue clock at x′ = 0?',
        'The blue clock passing x = 0 reads t′ = γ(t − Vx) = 1.25·5 = 6.25, which is <i>more</i> than 5. The blue clock at x′ = 0 (now at x = Vt = 3) reads t/γ = 4. "Moving clocks run slow" compares <b>one</b> moving clock with the <b>row</b> of synchronised clocks it passes; the other blue clocks are out of sync in S.'],
      ['Both frames say the other clocks are slow. Why is that not a contradiction?',
        'Each comparison uses that frame\'s own lines of simultaneity, so they compare different pairs of events. Switch the view and watch which clocks lie on the "now" line: the clocks the moving frame calls "at the same time" are exactly the ones that are out of sync for the other frame.'],
      ['Which blue clocks lag in S: the ones in front (in the direction of motion) or behind?',
        'The leading ones. Seen from S, the front clock of a pair at proper distance L′ reads V·L′/c² less than the rear one ("leading clocks lag").']
    ]
  });

  /* =============================================== 3 length measurement */
  SC.push({
    id: 'length', title: 'Measuring a moving broom: why Δt = 0 matters', ref: '2.2',
    desc: 'A broom of rest length L₀ is at rest in S′. To measure its length in S you must mark both ends <b>at the same S-time</b>. ' +
      'Marking them simultaneously in S′ instead gives a "length extension". This is the classic mistake (eq. 2.3).',
    params: [{ id: 'V', label: 'broom velocity V', min: -0.95, max: 0.95, step: 0.01, value: 0.6 },
      { id: 'L', label: 'rest length L₀', min: 1, max: 6, step: 0.1, value: 4 }],
    view: p => [-2, 9, -2, 7],
    frames: p => [{ name: 'S (lab)', V: 0 }, { name: 'S′ (broom)', V: p.V }],
    build: p => {
      const g = P.gamma(p.V);
      const ef2 = P.unboost(p.V, 0, p.L);
      return {
        wls: [
          { id: 'r', wl: unif(0, p.V), color: '#8250df', width: 2.2, label: 'rear' },
          { id: 'f', wl: unif(p.L / g, p.V), color: '#8250df', width: 2.2, label: 'front' }
        ],
        events: [
          { t: 0, x: 0, label: 'rear, t = 0', color: '#1a7f37' },
          { t: 0, x: p.L / g, label: 'front, t = 0', color: '#1a7f37' },
          { t: ef2[0], x: ef2[1], label: "front, t' = 0", color: '#cf222e' }
        ],
        segs: [
          { a: [0, 0], b: [0, p.L / g], color: '#1a7f37', width: 3, label: 'Δt = 0: L₀/γ' },
          { a: [0, 0], b: ef2, color: '#cf222e', width: 2, dash: [6, 3], label: "Δt' = 0" }
        ],
        lanes: 1,
        space: [{ type: 'body', rear: 'r', front: 'f', lane: 0, color: '#8250df', label: 'broom' }]
      };
    },
    readouts: (p, c) => {
      const g = P.gamma(p.V), r = c.at('r'), fr = c.at('f');
      const rows = [['γ', f(g, 4)], ['correct (Δt = 0): L = L₀/γ', f(p.L / g, 4), 'good'],
        ["wrong (Δt' = 0 events, Δx in S): γL₀", f(g * p.L, 4), 'bad']];
      if (r && fr) rows.push(['length measured now in the view frame', f(c.D.L2V(fr.t, fr.x)[1] - c.D.L2V(r.t, r.x)[1], 4), 'hl']);
      return rows;
    },
    questions: [
      ['Why can\'t we use the two red/green events "front at t\' = 0" and "rear at t = 0" to get the length in S?',
        'They are not simultaneous in S: the broom moves between them. A length in S is the distance between the ends at one S-time; "simultaneous" is frame dependent, so the two procedures are genuinely different measurements.'],
      ['In the broom frame, is the lab ruler contracted?', 'Yes, by the same γ. Use the frame button and look at the axis ticks: the symmetry is perfect.']
    ]
  });

  /* ======================================================= 4 two castles */
  SC.push({
    id: 'castles', title: 'Witch between two castles: dilation ⇔ contraction', ref: '2.2',
    desc: 'Castles A and B, distance L apart, have synchronised clocks (dwarf frame). The Witch flies from A to B at V. ' +
      'The dwarfs explain her young watch by time dilation; she explains it by the castles being Lorentz contracted.',
    params: [{ id: 'L', label: 'castle distance L', min: 2, max: 12, step: 0.5, value: 8 },
      { id: 'V', label: 'Witch velocity V', min: 0.1, max: 0.98, step: 0.01, value: 0.8 }],
    view: p => [-2, p.L + 2, -2, p.L / p.V + 2],
    frames: p => [{ name: 'dwarfs / castles', V: 0 }, { name: 'Witch', V: p.V }],
    build: p => ({
      wls: [
        { id: 'A', wl: rest(0), color: '#6e7781', width: 1.5, ticks: 1 },
        { id: 'B', wl: rest(p.L), color: '#6e7781', width: 1.5, ticks: 1 },
        { id: 'W', wl: unif(0, p.V), color: '#8250df', width: 2.2, ticks: 1 }
      ],
      events: [{ t: 0, x: 0, label: 'depart A' }, { t: p.L / p.V, x: p.L, label: 'arrive B' }],
      lanes: 2,
      space: [
        { type: 'clock', wl: 'A', lane: 0, color: '#444', label: 'castle A' },
        { type: 'clock', wl: 'B', lane: 0, color: '#444', label: 'castle B' },
        { type: 'clock', wl: 'W', lane: 1, color: '#8250df', label: 'Witch' }
      ]
    }),
    readouts: (p, c) => {
      const g = P.gamma(p.V), a = c.at('A'), b = c.at('B');
      const rows = ['dwarf frame', ['trip time L/V', f(p.L / p.V, 3)], ["Witch's watch at B: L/(γV)", f(p.L / (g * p.V), 3), 'hl'],
        'Witch frame', ['castle distance L/γ', f(p.L / g, 3)], ['castles approach at V → time', f(p.L / g / p.V, 3), 'hl']];
      if (a && b) rows.push(['castle distance now (view frame)', f(c.D.L2V(b.t, b.x)[1] - c.D.L2V(a.t, a.x)[1], 3)]);
      rows.push(["castle B clock at departure, Witch's 'now'", f(p.V * p.L, 3) + ' (not 0!)']);
      return rows;
    },
    questions: [
      ['In the Witch\'s frame the castle clocks run slow, yet B\'s clock shows L/V on arrival, more than her watch. How?',
        'In her frame castle B\'s clock was already ahead by VL/c² when she departed (relativity of simultaneity). Slow ticking plus that head start gives exactly L/V. Check the "now" line through the departure event in her frame.']
    ]
  });

  /* ======================================================= 5 truck & tunnel */
  SC.push({
    id: 'tunnel', title: 'Truck in a tunnel (ladder paradox)', ref: '2.3',
    desc: 'Truck and tunnel have the same rest length L. In the tunnel frame the fast truck is contracted and fits; in the truck frame the tunnel is contracted and the truck sticks out. ' +
      '"Fits" means both ends inside <b>at the same time</b>, and that is frame dependent.',
    params: [{ id: 'V', label: 'truck velocity V', min: 0.1, max: 0.98, step: 0.005, value: 0.866 },
      { id: 'L', label: 'rest length L', min: 2, max: 12, step: 0.5, value: 8 }],
    view: p => [-p.L - 2, p.L * 2 + 2, -2, (p.L + p.L / P.gamma(p.V)) / p.V + 2],
    frames: p => [{ name: 'tunnel (policeman)', V: 0 }, { name: 'truck (driver)', V: p.V }],
    build: p => {
      const g = P.gamma(p.V);
      return {
        wls: [
          { id: 'en', wl: rest(0), color: '#6e7781', width: 2 },
          { id: 'ex', wl: rest(p.L), color: '#6e7781', width: 2 },
          { id: 'fr', wl: unif(0, p.V), color: '#cf222e', width: 2 },
          { id: 're', wl: unif(-p.L / g, p.V), color: '#cf222e', width: 2 }
        ],
        events: [{ t: p.L / (g * p.V), x: 0, label: 'rear enters (R_in)' }, { t: p.L / p.V, x: p.L, label: 'front exits (F_out)' }],
        lanes: 1,
        space: [
          { type: 'box', a: 'en', b: 'ex', lane: 0, color: '#444', label: 'tunnel' },
          { type: 'body', rear: 're', front: 'fr', lane: 0, color: '#cf222e', label: 'truck' }
        ],
        banner: c => {
          const e = c.at('en'), x = c.at('ex'), r = c.at('re'), fr = c.at('fr');
          if (!e || !x || !r || !fr) return null;
          const X = q => c.D.L2V(q.t, q.x)[1];
          return (X(r) >= X(e) - 1e-9 && X(fr) <= X(x) + 1e-9) ? ['TRUCK ENTIRELY INSIDE (in this frame)', '#1a7f37'] : null;
        }
      };
    },
    readouts: (p, c) => {
      const g = P.gamma(p.V);
      const tRin = c.D.L2V(p.L / (g * p.V), 0)[0], tFout = c.D.L2V(p.L / p.V, p.L)[0];
      return [['γ', f(g, 4)], ['contracted truck (tunnel frame) L/γ', f(p.L / g, 3)], ['contracted tunnel (truck frame) L/γ', f(p.L / g, 3)],
        'in the current view frame', ['t(rear enters)', f(tRin, 3)], ['t(front exits)', f(tFout, 3)],
        ['entirely inside for', f(Math.max(0, tFout - tRin), 3) + (tFout > tRin ? ' (fits)' : ' (never fits)'), tFout > tRin ? 'good' : 'bad'],
        ['R_in → F_out interval', 'spacelike: order is frame dependent']];
    },
    questions: [
      ['Who is right, the policeman (fits) or the driver (sticks out)?',
        'Both. "Fits" = rear inside and front inside simultaneously. The events "rear enters" and "front exits" are spacelike separated, so their order differs between the frames. There is no frame-independent fact about "fitting" for a moving object.'],
      ['At what speed does the truck fit with room to spare equal to half the tunnel?', 'When L/γ = L/2, i.e. γ = 2, V = √3/2 ≈ 0.866c (the default).']
    ]
  });

  /* ======================================================= 6 pole & barn */
  SC.push({
    id: 'barn', title: 'Pole vaulter in a barn with a closing door', ref: '5.2',
    desc: 'The barn (length B) has a back wall and a front door that slams shut just after the rear of the pole (rest length P) is in. ' +
      'The front of the pole hits the wall; that news travels back along the pole no faster than the signal speed. In the pole frame the barn is short, so how can the pole end up inside?',
    params: [{ id: 'V', label: 'pole velocity V', min: 0.3, max: 0.98, step: 0.005, value: 0.866 },
      { id: 'P', label: 'pole rest length P', min: 2, max: 16, step: 0.5, value: 10 },
      { id: 'B', label: 'barn length B', min: 2, max: 12, step: 0.5, value: 6 },
      { id: 's', label: 'signal speed (≤ c)', min: 0.05, max: 1, step: 0.01, value: 1 },
      { id: 'dl', label: 'door closes after rear in by', min: 0, max: 4, step: 0.05, value: 0.3 }],
    view: p => [-p.P / P.gamma(p.V) - 2, p.B + 3, -3, p.B / p.V + 6],
    frames: p => [{ name: 'barn', V: 0 }, { name: 'pole (before the crash)', V: p.V }],
    build: p => {
      const g = P.gamma(p.V), V = p.V, tH = p.B / V, tRin = p.P / (g * V), tClose = tRin + p.dl;
      const point = sig => {
        const xs = t => V * t - (p.P - sig) / g;
        const tm = (p.B + (p.P - sig) / g + p.s * tH) / (V + p.s), xm = xs(tm);
        return { wl: new P.Worldline([[-BIG, xs(-BIG)], [tm, xm], [BIG, xm]], { flags: ['moving', 'stopped'] }), tm, xm };
      };
      const rear = point(0), front = point(p.P);
      const wls = [
        { id: 'door', wl: steps(0, [tClose], ['open', 'closed']), flagStyles: { open: { color: '#8c959f', width: 1.5, dash: [4, 4] }, closed: { color: '#6e3e00', width: 3 } } },
        { id: 'wall', wl: rest(p.B), color: '#6e3e00', width: 3 },
        { id: 'rear', wl: rear.wl, flagStyles: { moving: { color: '#1f6feb', width: 2.2 }, stopped: { color: '#cf222e', width: 2.2 } } },
        { id: 'front', wl: front.wl, flagStyles: { moving: { color: '#1f6feb', width: 2.2 }, stopped: { color: '#cf222e', width: 2.2 } } }
      ];
      const space = [{ type: 'box', a: 'door', b: 'wall', lane: 0, color: '#6e3e00', label: 'barn' },
        { type: 'body', rear: 'rear', front: 'front', lane: 0, color: '#1f6feb', label: 'pole', alpha: 0.55 }];
      for (let k = 1; k < 8; k++) {
        const q = point(p.P * k / 8);
        wls.push({ id: 'q' + k, wl: q.wl, flagStyles: { moving: { color: '#1f6feb', width: 0.7, alpha: 0.5 }, stopped: { color: '#cf222e', width: 0.7, alpha: 0.6 } } });
        space.push({ type: 'glyph', wl: 'q' + k, lane: 0, glyph: 'dot', flagColor: { moving: '#1f6feb', stopped: '#cf222e' }, r: 3 });
      }
      space.push({ type: 'glyph', wl: 'rear', lane: 0, glyph: 'dot', flagColor: { moving: '#1f6feb', stopped: '#cf222e' }, r: 4 });
      space.push({ type: 'glyph', wl: 'front', lane: 0, glyph: 'dot', flagColor: { moving: '#1f6feb', stopped: '#cf222e' }, r: 4 });
      space.push({ type: 'glyph', wl: 'door', lane: 0, glyph: 'wall', flagColor: { open: '#c0c6cf', closed: '#6e3e00' }, flagLabel: { open: 'door open', closed: 'door SHUT' }, h: 18 });
      space.push({ type: 'glyph', wl: 'wall', lane: 0, glyph: 'wall', color: '#6e3e00', h: 18 });
      return {
        wls, space, lanes: 1,
        events: [{ t: tRin, x: 0, label: 'rear passes door' }, { t: tH, x: p.B, label: 'front hits wall' },
          { t: tClose, x: 0, label: 'door shuts', color: '#6e3e00' }, { t: rear.tm, x: rear.xm, label: 'news reaches rear', color: '#1f6feb' }],
        segs: [{ a: [tH, p.B], b: [rear.tm, rear.xm], color: C.light, width: 2, label: 'stop signal' }],
        info: { tH, tRin, tClose, rear }
      };
    },
    readouts: (p, c) => {
      const s = c.scene.info, g = P.gamma(p.V), T = (t, x) => c.D.L2V(t, x)[0];
      const fits = p.P / g < p.B;
      const tRin = T(s.tRin, 0), tH = T(s.tH, p.B), tCl = T(s.tClose, 0), tSr = T(s.rear.tm, s.rear.xm);
      return [['contracted pole P/γ (barn frame)', f(p.P / g, 3) + (fits ? ' < B: fits' : ' ≥ B: does not fit'), fits ? 'good' : 'bad'],
        'event times in the current view frame', ['rear passes door', f(tRin, 3)], ['front hits wall', f(tH, 3)], ['door shuts', f(tCl, 3)], ['news of crash reaches rear', f(tSr, 3)],
        null,
        ['front hits wall while rear still outside?', tH < tRin ? 'YES (in this frame)' : 'no', tH < tRin ? 'hl' : ''],
        ['rear stops at x (barn frame)', f(s.rear.xm, 3) + (s.rear.xm > 0 ? ' (inside)' : ' (outside!)'), s.rear.xm > 0 ? 'good' : 'bad'],
        ['door passes the rear before the news arrives', s.tRin < s.rear.tm ? 'yes, always (eq. 5.2)' : 'no', 'good']];
    },
    questions: [
      ['In the pole frame the barn is only B/γ long. How does the whole pole get inside?',
        'The front hits the wall first, but the rear keeps moving (relative to the barn) until news of the crash reaches it. Even at signal speed c the news needs time P/c, longer than the time for the door to pass the rear end (eq. 5.2). The pole is compressed; in the end it fits in the barn in every frame.'],
      ['Set the signal speed to 1 and make B smaller than P/γ. What changes?', 'Now the pole does not fit even in the barn frame. The rear stops outside and the door shuts on it: an actual collision, agreed on by everyone.'],
      ['Why is a perfectly rigid pole impossible in relativity?', 'Rigidity means every part reacts instantly, i.e. an infinitely fast signal. A signal faster than c could be sent back in time in some frame (ch. 1.4).']
    ]
  });

  /* ======================================================= 7 Elvis lives */
  SC.push({
    id: 'elvis', title: 'Elvis lives! (far-away simultaneity)', ref: '2.8',
    desc: 'A: Elvis dies in Graceland (1977). B: today, 44 years later, same place. C: a distant observer (distance D, simultaneous with B for us) moving away from Earth with V. ' +
      'Units: years and light years. In C\'s frame, which Graceland event is "now"?',
    params: [{ id: 'D', label: 'distance D (ly)', min: 10, max: 300, step: 1, value: 100 },
      { id: 'V', label: "C's velocity V (away)", min: -0.99, max: 0.99, step: 0.01, value: 0.6 },
      { id: 'w', label: 'your walking speed (m/s)', min: 0.5, max: 3, step: 0.1, value: 1.4 }],
    view: p => [-0.12 * p.D, 1.12 * p.D, Math.min(-50, 44 - Math.abs(p.V) * p.D - 10), Math.max(60, 44 + Math.abs(p.V) * p.D * 0.3)],
    frames: p => [{ name: 'Earth', V: 0 }, { name: 'observer C', V: p.V }],
    T0: (p, D) => D.L2V(44, p.D)[0],
    build: p => ({
      wls: [
        { id: 'E', wl: steps(0, [-42, 0], ['unborn', 'alive', 'dead']), flagStyles: { unborn: { color: '#c0c6cf', width: 1, dash: [3, 4] }, alive: { color: '#1a7f37', width: 3 }, dead: { color: '#6e7781', width: 1.5 } } },
        { id: 'C', wl: unif(p.D - p.V * 44, p.V), color: C.S1, width: 2 }
      ],
      events: [{ t: 0, x: 0, label: 'A: death 1977' }, { t: 44, x: 0, label: 'B: 2021' }, { t: 44, x: p.D, label: 'C (2021 for us)', color: C.S1 },
        { t: 44 - p.V * p.D, x: 0, label: "C's 'now' here", color: '#8250df' }],
      segs: [{ a: [44, p.D], b: [44 - p.V * p.D, 0], color: '#8250df', width: 1.5, dash: [6, 4], label: "C's simultaneity" }],
      lanes: 1,
      space: [
        { type: 'glyph', wl: 'E', lane: 0, glyph: 'person', flagColor: { unborn: '#d0d7de', alive: '#1a7f37', dead: '#6e7781' }, flagGlyph: { dead: 'tri', unborn: 'ring' }, flagLabel: { unborn: 'not born', alive: 'Elvis alive', dead: 'grave' } },
        { type: 'glyph', wl: 'C', lane: 0, glyph: 'person', color: C.S1, label: 'C' }
      ]
    }),
    readouts: (p, c) => {
      const tStar = 44 - p.V * p.D, year = 1977 + tStar;
      const status = tStar < -42 ? 'not yet born' : tStar < 0 ? 'ALIVE (age ' + f(tStar + 42, 1) + ')' : 'dead';
      const beta = p.w / 299792458, shiftYr = beta * p.D, shiftS = shiftYr * 3.15576e7;
      return [["Graceland event simultaneous with C, in C's frame", 'year ' + f(year, 1)],
        ['Elvis at that moment', status, tStar < 0 && tStar > -42 ? 'good' : ''],
        ['condition for "alive": V·D > 44 years', f(p.V * p.D, 1) + ' yr'],
        'walking back and forth', ['shift of "now" at distance D: (w/c)·D', f(shiftS, 1) + ' s'],
        ['…at Andromeda (2.5 million ly)', f(beta * 2.5e6 * 365.25, 2) + ' days']];
    },
    questions: [
      ['Does this mean C could warn Elvis?', 'No. The events at Graceland that C calls "now" are spacelike separated from C. C can only send a signal along their future light cone, which reaches Graceland long after 2021. Simultaneity has no causal meaning (Dragan 2.8).'],
      ['Which observer would say you have already finished reading this book?', 'A distant observer moving towards us (V < 0 here): their line of simultaneity tilts the other way and passes through our future.']
    ]
  });

  /* ======================================================= 8 speed walker */
  SC.push({
    id: 'walker', title: 'The speed walker paradox', ref: '2.9',
    desc: 'Speed-walking rules: one foot must always touch the ground. The walker swaps feet <b>simultaneously in their own frame</b> (centre of mass at rest, ground moving at −V). ' +
      'Planted foot moves with the ground, swinging foot at +V. What do the judges (ground frame) see?',
    params: [{ id: 'V', label: 'walking speed V', min: 0.1, max: 0.95, step: 0.01, value: 0.6 },
      { id: 'd', label: 'half step d', min: 0.3, max: 2, step: 0.05, value: 1 }],
    view: p => [-4, 10, -2, 10],
    frames: p => [{ name: 'judges (ground)', V: 0 }, { name: 'walker', V: p.V }],
    build: p => {
      const V = p.V, d = p.d, Tp = 2 * d / V;
      const foot = phase => {
        const pts = [], flags = [];
        for (let k = -4; k <= 8; k++) {
          const t0 = k * Tp, planted = ((k + phase) % 2 + 2) % 2 === 0;
          if (!pts.length) pts.push([t0, planted ? d : -d]);
          pts.push([t0 + Tp, planted ? -d : d]);
          flags.push(planted ? 'ground' : 'air');
        }
        return new P.Worldline(P.fromFrame(V, pts), { flags });
      };
      const fs = { ground: { color: '#1a7f37', width: 2.4 }, air: { color: '#cf222e', width: 1.4, dash: [4, 3] } };
      const eL = P.unboost(V, 0, -d), eR = P.unboost(V, 0, d);
      return {
        wls: [{ id: 'C', wl: unif(0, V), color: '#6e7781', width: 1, dash: [2, 3] }, { id: 'R', wl: foot(0), flagStyles: fs }, { id: 'L', wl: foot(1), flagStyles: fs }],
        events: [{ t: eL[0], x: eL[1], label: 'L lifted' }, { t: eR[0], x: eR[1], label: 'R planted' }],
        lanes: 2,
        space: [
          { type: 'glyph', wl: 'C', lane: 0, glyph: 'person', color: '#333', label: 'walker' },
          { type: 'glyph', wl: 'L', lane: 1, glyph: 'foot', flagColor: { ground: '#1a7f37', air: '#cf222e' }, flagDy: { ground: 6, air: -10 }, label: 'L' },
          { type: 'glyph', wl: 'R', lane: 1, glyph: 'foot', flagColor: { ground: '#1a7f37', air: '#cf222e' }, flagDy: { ground: 6, air: -10 }, label: 'R' }
        ],
        banner: c => { const l = c.at('L'), r = c.at('R'); return (l && r && l.flag === 'air' && r.flag === 'air') ? ['BOTH FEET IN THE AIR: disqualified!', '#cf222e'] : null; }
      };
    },
    readouts: (p, c) => {
      const g = P.gamma(p.V);
      return [['γ', f(g, 4)], ['flight time per step (judges) 2γVd/c² (eq. 2.12)', f(2 * g * p.V * p.d, 3), 'hl'],
        ['footprint distance (judges) 2γd', f(2 * g * p.d, 3)], ['flight time in the walker frame', '0 (switch is simultaneous)'],
        ['swinging foot speed in judges frame', f(P.addVelocities(p.V, p.V), 4)]];
    },
    questions: [
      ['Do the walker\'s feet slow down at high speed because of time dilation?', 'No. Time dilation by γ applies to things at rest in the moving frame. The feet move relative to the walker, so you must transform their worldlines, which is what this diagram does.'],
      ['Who is right, judges or walker?', 'Both describe the same events. "Left foot lifted" and "right foot planted" are spacelike separated, so their order depends on the frame. The rule "always one foot on the ground" is not Lorentz invariant!']
    ]
  });

  /* ======================================================= 9 Mexican wave */
  SC.push({
    id: 'wave', title: 'Superluminal Mexican wave of dwarfs', ref: '1.3, 2.10',
    desc: 'Dwarfs 1 apart jump at pre-agreed times (synchronised watches in Snow White\'s frame). The "wave" can move with any speed u, even faster than light: nothing travels from dwarf to dwarf. ' +
      'Watch the jumping order as seen by a Witch flying at V.',
    params: [{ id: 'u', label: 'wave speed u (in S)', min: 0.2, max: 6, step: 0.05, value: 2 }],
    view: () => [-8, 8, -5, 7],
    frames: p => {
      const fr = [{ name: 'Snow White', V: 0 }, { name: 'Witch V = 0.3', V: 0.3 }];
      if (p.u > 1) fr.push({ name: 'V = 1/u (all at once)', V: 1 / p.u });
      fr.push({ name: 'Witch V = 0.9', V: 0.9 });
      return fr;
    },
    build: p => {
      const wls = [], space = [], events = [];
      for (let k = -7; k <= 7; k++) {
        const t = k / p.u;
        wls.push({ id: 'd' + k, wl: steps(k, [t, t + 0.6], ['ground', 'air', 'ground']), flagStyles: { ground: { color: '#9aa1aa', width: 1 }, air: { color: '#cf222e', width: 3.5 } } });
        space.push({ type: 'glyph', wl: 'd' + k, lane: 0, glyph: 'person', flagColor: { ground: '#57606a', air: '#cf222e' }, flagDy: { ground: 4, air: -12 } });
        if (k === -7 || k === 7) events.push({ t, x: k, label: 'jump ' + (k + 8) });
      }
      return { wls, space, events, lanes: 1, segs: [{ a: [-7 / p.u, -7], b: [7 / p.u, 7], color: '#cf222e', width: 1, dash: [3, 3], label: 'wave' }] };
    },
    readouts: (p, c) => {
      const vp = P.transformVelocity(p.u, c.viewV);
      return [['wave speed in S', f(p.u, 3) + (p.u > 1 ? ' (superluminal)' : '')], ['wave speed in view frame (u−V)/(1−uV)', f(vp, 3), 'hl'],
        ['jump order in this frame', !isFinite(vp) || Math.abs(vp) > 1e6 ? 'all at once' : vp > 0 ? 'left → right' : 'right → left'],
        ['critical frame V = c²/u', p.u > 1 ? f(1 / p.u, 3) : 'none (subluminal wave: order is absolute)']];
    },
    questions: [
      ['Chase the superluminal wave (increase V). Does it get slower like a normal object (Fig. 2.10)?', 'No, it runs away faster and faster, becomes infinitely fast at V = c²/u, and then reverses direction (Fig. 2.12). For subluminal u the chase behaves normally.'],
      ['Why is this no paradox for causality?', 'No dwarf\'s jump causes the next one; each follows their own watch. The jump events are spacelike separated, so their order may differ between frames. If the dwarfs waited to see their neighbour jump, u could never exceed c.']
    ]
  });

  /* ======================================================= 10 cable paradox */
  SC.push({
    id: 'cable', title: 'The paradox that started it all: a current-carrying cable', ref: '2.5',
    desc: 'Positive ions at rest (lab), electrons drifting with V (equal lab spacing, so the wire is neutral), and an outside test electron moving along with them. ' +
      'Lab: neutral wire, magnetic attraction. Electron frame: no magnetic force on a charge at rest, but the ions are Lorentz contracted, so the wire is <b>positively charged</b>.',
    params: [{ id: 'V', label: 'drift velocity V (exaggerated)', min: 0.05, max: 0.95, step: 0.01, value: 0.5 }],
    view: () => [-10, 10, -3, 6],
    frames: p => [{ name: 'lab (ions)', V: 0 }, { name: 'electrons', V: p.V }],
    build: p => {
      const wls = [], space = [];
      for (let k = -24; k <= 24; k++) {
        wls.push({ id: 'i' + k, wl: rest(k), color: '#cf222e', width: 0.6, alpha: 0.45 });
        space.push({ type: 'glyph', wl: 'i' + k, lane: 0, glyph: 'plus', color: '#cf222e', r: 6 });
        wls.push({ id: 'e' + k, wl: unif(k + 0.5, p.V), color: C.S1, width: 0.6, alpha: 0.45 });
        space.push({ type: 'glyph', wl: 'e' + k, lane: 1, glyph: 'minus', color: C.S1, r: 6 });
      }
      wls.push({ id: 'test', wl: unif(0, p.V), color: '#8250df', width: 2.5 });
      space.push({ type: 'glyph', wl: 'test', lane: 2, glyph: 'minus', color: '#8250df', r: 7, label: 'test electron' });
      return { wls, space, lanes: 3, events: [] };
    },
    readouts: (p, c) => {
      const q = P.cableForce(p.V, c.viewV), g = P.gamma(p.V);
      return ['densities in the view frame (units e/a)', ['ions λ₊', f(q.lamPlus, 4)], ['electrons λ₋', f(q.lamMinus, 4)], ['net charge λ₊ − λ₋', f(q.net, 4), Math.abs(q.net) > 1e-6 ? 'hl' : ''],
        'force on the test electron (units e²/2πε₀ra, + = away)', ['electric', f(q.Felec, 4)], ['magnetic', f(q.Fmag, 4)], ['total', f(q.Fout, 4), 'hl'],
        ['lab: magnetic V² (eq. 2.4)', f(-p.V * p.V, 4)], ['electron frame: electric γV² (eq. 2.9)', f(-g * p.V * p.V, 4)],
        ['F·γ(test) (same in every frame)', f(q.Fout * P.gamma(q.u), 4), 'good']];
    },
    questions: [
      ['The forces differ by γ between the frames. Isn\'t that a contradiction?', 'No. What must agree is the momentum the test electron picks up. Its proper time runs slower in the lab by γ, so FΔt = F′Δt′ with Δt = γΔt′, hence F = F′/γ, exactly the ratio of (2.4) and (2.9).'],
      ['Real drift speeds are ~mm/s. Why is the effect still huge?', 'The net charge density γV²λ is tiny, but λ for the electrons in a metal is enormous (~10²³ per cm³). Magnetism is a relativistic effect of everyday size.']
    ]
  });

  /* ======================================================= 11 trains */
  SC.push({
    id: 'trains', title: 'Two trains at ±0.9c: is 1.8c allowed?', ref: '1.3',
    desc: 'Two trains approach each other at ±v as seen by an observer on the track. The distance between them shrinks at rate 2v, which may exceed c. ' +
      'But the speed of one train measured from the other is (2v)/(1+v²) < c.',
    params: [{ id: 'v', label: 'train speed v', min: 0.1, max: 0.99, step: 0.01, value: 0.9 }, { id: 'L', label: 'initial half-distance', min: 3, max: 12, step: 0.5, value: 8 }],
    view: p => [-p.L - 2, p.L + 2, -1, p.L / p.v + 2],
    frames: p => [{ name: 'track', V: 0 }, { name: 'left train', V: p.v }, { name: 'right train', V: -p.v }],
    build: p => {
      const g = P.gamma(p.v), len = 1.5 / g;
      return {
        wls: [
          { id: 'af', wl: unif(-p.L, p.v), color: '#1f6feb', width: 2 }, { id: 'ar', wl: unif(-p.L - len, p.v), color: '#1f6feb', width: 1 },
          { id: 'bf', wl: unif(p.L, -p.v), color: '#bf3989', width: 2 }, { id: 'br', wl: unif(p.L + len, -p.v), color: '#bf3989', width: 1 },
          { id: 'o', wl: rest(0), color: '#6e7781', width: 1, dash: [3, 3] }
        ],
        events: [{ t: p.L / p.v, x: 0, label: 'crash' }],
        lanes: 1,
        space: [{ type: 'body', rear: 'ar', front: 'af', lane: 0, color: '#1f6feb', label: 'A' }, { type: 'body', rear: 'br', front: 'bf', lane: 0, color: '#bf3989', label: 'B' },
          { type: 'glyph', wl: 'o', lane: 0, glyph: 'person', color: '#333', label: 'observer', dy: 14 }]
      };
    },
    readouts: (p, c) => {
      const va = P.transformVelocity(p.v, c.viewV), vb = P.transformVelocity(-p.v, c.viewV);
      return [['closing rate in the view frame (v_A − v_B)', f(va - vb, 4), Math.abs(va - vb) > 1 ? 'hl' : ''],
        ['velocity of B measured by A: (−v−v)/(1+v²)', f(P.transformVelocity(-p.v, p.v), 4), 'good'],
        ['velocity of A in view frame', f(va, 4)], ['velocity of B in view frame', f(vb, 4)]];
    },
    questions: [['Does a closing rate of 1.8c violate relativity?', 'No. It is not the velocity of any object relative to any observer, so nothing carries information faster than light. Each train is subluminal in every frame.']]
  });

  /* =============================================================== UI */
  SR.modules.push({
    id: 'paradox', order: 2, title: '2 · Paradox lab', tip: 'Guided scenarios: simultaneity, dilation, tunnel, barn, Elvis, speed walker, cable (ch. 2, 5)',
    init(panel) {
      const L = ui.layout(panel);
      const cv = L.canvas({ flex: '1 1 0' });
      const sc2 = L.canvas({ height: 150 });
      const D = new SR.MinkowskiDiagram(cv);
      const SV = new SR.SpaceView(sc2, D);
      const S = { cur: null, p: {}, viewV: 0, T: 0, scene: null, ticks: true, frameAxes: true, cone: true, speed: 1, byId: {} };

      /* -------- side panel skeleton */
      const top = ui.section(L.side, 'Scenario');
      const pick = ui.select(top, { label: '', options: SC.map(s => ({ value: s.id, label: s.ref + ' · ' + s.title })), value: SC[0].id, onChange: id => load(SC.find(s => s.id === id)) });
      pick.el.style.gridTemplateColumns = '0 1fr';
      const desc = ui.note(top, '', 'scen-desc');
      const secP = ui.section(L.side, 'Parameters');
      const secF = ui.section(L.side, 'Observer (frame of the drawing)');
      const frameBtns = ui.el('div', { class: 'btns' }); secF.append(frameBtns);
      const sView = ui.slider(secF, { label: 'view velocity', min: -0.99, max: 0.99, step: 0.001, value: 0, onInput: v => { S.viewV = v; redraw(); } });
      const sT = ui.slider(secF, { label: '"now" in this frame', min: -10, max: 10, step: 0.01, value: 0, onInput: v => { S.T = v; redraw(); } });
      const player = ui.player(dt => { S.T += dt * S.speed; const b = D.bounds(); if (S.T > b.ymax) S.T = b.ymin; sT.set(S.T); redraw(); });
      const pb = ui.buttons(secF, [
        { id: 'play', label: '▶ play', onClick: () => { const on = player.toggle(); pb.byId.play.textContent = on ? '❚❚ pause' : '▶ play'; } },
        { label: 'fit view', onClick: () => fit() }
      ]);
      const opt = ui.el('div', { class: 'chkgrid' }); secF.append(opt);
      ui.checkbox(opt, { label: 'proper-time ticks', value: true, onChange: v => { S.ticks = v; redraw(); } });
      ui.checkbox(opt, { label: 'frame axes', value: true, onChange: v => { S.frameAxes = v; redraw(); } });
      ui.checkbox(opt, { label: 'light cone (origin)', value: true, onChange: v => { S.cone = v; redraw(); } });
      const secR = ui.section(L.side, 'Readouts');
      const ro = ui.readout(secR);
      const secQ = ui.el('div'); L.side.append(secQ);
      let cancelTween = null;

      function load(sc) {
        player.stop(); pb.byId.play.textContent = '▶ play';
        S.cur = sc; S.p = {};
        sc.params.forEach(q => { S.p[q.id] = q.value; });
        desc.innerHTML = sc.desc + ' <span class="pill">Dragan ' + sc.ref + '</span>';
        secP.innerHTML = '<h3>Parameters</h3>';
        sc.params.forEach(q => ui.slider(secP, { label: q.label, min: q.min, max: q.max, step: q.step, value: q.value, onInput: v => { S.p[q.id] = v; rebuild(); } }));
        secQ.innerHTML = '';
        ui.questions(secQ, sc.questions);
        S.viewV = 0; sView.set(0);
        rebuild();
        fit();
        S.T = sc.T0 ? sc.T0(S.p, D) : 0; sT.set(S.T);
        redraw();
      }
      function rebuild() {
        S.scene = S.cur.build(S.p);
        S.byId = {};
        S.scene.wls.forEach(w => { S.byId[w.id] = w; });
        frameBtns.innerHTML = '';
        S.cur.frames(S.p).forEach(F => {
          const b = ui.el('button', { html: F.name + ' <span class="pill">' + f(F.V, 3) + '</span>' });
          b.addEventListener('click', () => {
            if (cancelTween) cancelTween();
            const keep = D.V2L(S.T, 0);        // keep the event at x_view=0 on the "now" line
            cancelTween = ui.tweenVelocity(S.viewV, F.V, 650, v => { S.viewV = v; sView.set(v); D.viewV = v; S.T = D.L2V(keep[0], keep[1])[0]; sT.set(S.T); redraw(); });
          });
          frameBtns.append(b);
        });
        redraw();
      }
      function fit() {
        const v = S.cur.view(S.p);
        D.viewV = S.viewV;
        D.setBox(v[0], v[1], v[2], v[3]);
        const b = D.bounds();
        sT.setRange(b.ymin.toFixed(2), b.ymax.toFixed(2));
        S.speed = (b.ymax - b.ymin) / 14;
      }
      D.onViewChange = () => { const b = D.bounds(); sT.setRange(b.ymin.toFixed(2), b.ymax.toFixed(2)); S.speed = (b.ymax - b.ymin) / 14; SV.requestDraw(); };
      D.onResize = () => SV.requestDraw();
      D.onHover = () => D.requestDraw();

      function ctx() {
        const row = D.nowRow(), cache = {};
        return {
          p: S.p, viewV: S.viewV, T: S.T, scene: S.scene, D,
          at: id => {
            if (id in cache) return cache[id];
            const w = S.byId[id];
            cache[id] = w ? w.wl.intersect(row[0], row[1], S.T) : null;
            return cache[id];
          }
        };
      }
      function redraw() {
        D.viewV = S.viewV;
        D.requestDraw(); SV.requestDraw();
        if (S.cur) ro.set(S.cur.readouts(S.p, ctx()));
      }

      /* -------- diagram */
      D.onRender = () => {
        if (!S.scene) return;
        const sc = S.scene;
        D.drawFrame(0, { color: '#c3cad4', grid: true, axes: false, gridAlpha: 0.5 });
        if (S.cone) D.drawLightCone(0, 0, { color: C.light, width: 1, dash: [6, 5], alpha: 0.6 });
        if (S.frameAxes) S.cur.frames(S.p).forEach((F, i) => D.drawFrame(F.V, { color: i === 0 ? '#57606a' : ['#1f6feb', '#bf3989', '#1a9a48'][(i - 1) % 3], prime: i === 0 ? '' : "'".repeat(1), ticks: i === 0, width: 1, labels: true }));
        sc.wls.forEach(w => {
          if (w.flagStyles) D.drawWorldline(w.wl, { color: w.color || '#333', width: w.width || 1.5 }, w.flagStyles);
          else D.drawWorldline(w.wl, { color: w.color || '#333', width: w.width || 1.5, dash: w.dash, alpha: w.alpha });
          if (S.ticks && w.ticks) D.drawTicks(w.wl, w.ticks, { color: w.color || '#333', labels: true });
        });
        (sc.segs || []).forEach(s => {
          const a = D.pt(s.a[0], s.a[1]), b = D.pt(s.b[0], s.b[1]);
          D.seg(a[0], a[1], b[0], b[1], { color: s.color, width: s.width || 1.5, dash: s.dash });
          if (s.label) D.text((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, s.label, { dx: 6, dy: -8, color: s.color, bg: 'rgba(255,255,255,.75)', font: '11px system-ui' });
        });
        (sc.events || []).forEach(e => D.drawEvent(e.t, e.x, { label: e.label, color: e.color || C.event, r: 4.5 }));
        D.drawNowLine(S.T, { text: 'now (' + f(S.viewV, 3) + ' frame): ct = ' + f(S.T, 2) });
        const c = ctx();
        sc.wls.forEach(w => {
          const h = c.at(w.id);
          if (h && S.byId[w.id] && (w.ticks || w.flagStyles || (w.width || 0) >= 2)) { const p = D.pt(h.t, h.x); D.dot(p[0], p[1], 3, '#7c3aed'); }
        });
        D.drawCursorInfo(S.cur.frames(S.p).map((F, i) => ({ V: F.V, name: F.name, prime: i ? "'" : '' })));
      };

      /* -------- space strip */
      SV.onRender = () => {
        if (!S.scene) return;
        const sc = S.scene, c = ctx();
        SV.lanes = sc.lanes || 1;
        SV.title('space at ct = ' + f(S.T, 2) + ' in the frame with V = ' + f(S.viewV, 3) + '   (positions in that frame)');
        SV.axis();
        const X = h => D.L2V(h.t, h.x)[1];
        (sc.space || []).forEach(it => {
          if (it.type === 'box') { const a = c.at(it.a), b = c.at(it.b); if (a && b) SV.frameBox(X(a), X(b), it.lane, it.color, it.label); }
        });
        (sc.space || []).forEach(it => {
          if (it.type === 'body') { const a = c.at(it.rear), b = c.at(it.front); if (a && b) SV.bar(X(a), X(b), it.lane, it.color, it.label, { alpha: it.alpha }); }
          else if (it.type === 'clock') { const a = c.at(it.wl); if (a) SV.clock(X(a), it.lane, a.tau, it.color, it.label); }
          else if (it.type === 'glyph') {
            const a = c.at(it.wl); if (!a) return;
            const fl = a.flag;
            const color = it.flagColor && fl in it.flagColor ? it.flagColor[fl] : it.color || '#333';
            const glyph = it.flagGlyph && fl in it.flagGlyph ? it.flagGlyph[fl] : it.glyph;
            const label = it.flagLabel && fl in it.flagLabel ? it.flagLabel[fl] : it.label;
            SV.glyph(X(a), it.lane, glyph, color, label, { dy: (it.flagDy && fl in it.flagDy ? it.flagDy[fl] : 0) + (it.dy || 0), r: it.r, h: it.h });
          }
        });
        if (sc.banner) { const b = sc.banner(c); if (b) SV.banner(b[0], b[1]); }
      };

      load(SC[0]);
      this._load = id => { const sc = SC.find(s => s.id === id); if (sc) { pick.set(id); load(sc); } };
    },
    show(arg) { if (arg && this._load) this._load(arg); }
  });
})();
