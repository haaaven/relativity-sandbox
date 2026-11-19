/* diagram.js - Minkowski diagram. Everything is stored in lab-frame coordinates (t, x) and drawn
   in the coordinates of the "view frame" (velocity viewV relative to the lab). Changing viewV
   hyperbolically rotates the whole picture, exactly like changing the observer.
   World coordinates on screen: X = x_view, Y = (c)t_view. */
(function () {
  'use strict';
  const SR = window.SR, P = SR.phys;

  const COLORS = { S: '#2b2b2b', S1: '#1f6feb', S2: '#1a9a48', light: '#e39b12', event: '#d1242f', grid: '#e8ebf0' };

  class MinkowskiDiagram extends SR.View2D {
    constructor(canvas, opts) {
      super(canvas, Object.assign({ lockAspect: true }, opts || {}));
      this.viewV = 0;
      this.kind = 'lorentz';
      this.tName = 'ct'; this.xName = 'x';
      this.cursorFrames = null;    // [{V, name}] for the cursor readout
    }
    get Mv() { return P.frameMatrix(this.viewV, this.kind); }
    /** lab event -> view coords [td, xd] */
    L2V(t, x) { const M = this.Mv; return [M[0][0] * t + M[0][1] * x, M[1][0] * t + M[1][1] * x]; }
    /** view coords -> lab [t, x] */
    V2L(td, xd) { return P.apply2(P.inv2(this.Mv), td, xd); }
    /** lab event -> world point [X, Y] used by the drawing helpers */
    pt(t, x) { const v = this.L2V(t, x); return [v[1], v[0]]; }
    /** lab direction (dt, dx) -> world direction */
    ptd(dt, dx) { return this.pt(dt, dx); }
    /** world point -> lab event */
    toLab(X, Y) { return this.V2L(Y, X); }
    /** matrix frame coords [t', x'] -> view coords [td, xd] */
    frameToView(V) { return P.mul2(this.Mv, P.inv2(P.frameMatrix(V, this.kind))); }
    /** frame coordinates of a lab event */
    inFrame(V, t, x) { return P.apply2(P.frameMatrix(V, this.kind), t, x); }
    /** time coordinate (row of the view matrix) used for "now" intersections */
    nowRow() { const M = this.Mv; return [M[0][0], M[0][1]]; }

    autoStep(dirW, minPx) {
      const unitPx = Math.hypot(dirW[0] * this.kx, dirW[1] * this.ky);
      const steps = [0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
      for (const s of steps) if (s * unitPx >= (minPx || 34)) return s;
      return steps[steps.length - 1];
    }
    frameRanges(A) {   // range of t', x' visible in viewport for frame->view matrix A
      const Ai = P.inv2(A), b = this.bounds();
      let tmin = Infinity, tmax = -Infinity, xmin = Infinity, xmax = -Infinity;
      for (const [X, Y] of [[b.xmin, b.ymin], [b.xmin, b.ymax], [b.xmax, b.ymin], [b.xmax, b.ymax]]) {
        const f = P.apply2(Ai, Y, X);
        tmin = Math.min(tmin, f[0]); tmax = Math.max(tmax, f[0]); xmin = Math.min(xmin, f[1]); xmax = Math.max(xmax, f[1]);
      }
      return { tmin, tmax, xmin, xmax };
    }
    /** draw axes (and optionally grid/ticks) of the frame moving with V.
     *  o: {color, prime, grid, ticks, labels, width, gridAlpha, step, tName, xName, axes} */
    drawFrame(V, o) {
      o = o || {};
      const A = this.frameToView(V);
      const tdir = [A[1][0], A[0][0]], xdir = [A[1][1], A[0][1]];
      const color = o.color || COLORS.S, prime = o.prime || '';
      const stepT = o.step || this.autoStep(tdir), stepX = o.step || this.autoStep(xdir);
      const step = Math.max(stepT, stepX);
      const R = this.frameRanges(A);
      if (o.grid) {
        const st = { color, width: 1, alpha: o.gridAlpha || 0.16 };
        const gs = o.gridStep || step;
        if ((R.tmax - R.tmin) / gs < 400 && (R.xmax - R.xmin) / gs < 400) {
          for (let k = Math.ceil(R.tmin / gs); k <= Math.floor(R.tmax / gs); k++) {
            if (k === 0) continue;
            this.infLine(A[1][0] * k * gs, A[0][0] * k * gs, xdir[0], xdir[1], st);
          }
          for (let k = Math.ceil(R.xmin / gs); k <= Math.floor(R.xmax / gs); k++) {
            if (k === 0) continue;
            this.infLine(A[1][1] * k * gs, A[0][1] * k * gs, tdir[0], tdir[1], st);
          }
        }
      }
      if (o.axes !== false) {
        const st = { color, width: o.width || 1.6 };
        const sT = this.infLine(0, 0, tdir[0], tdir[1], st);
        const sX = this.infLine(0, 0, xdir[0], xdir[1], st);
        if (o.labels !== false) {
          const lab = (seg, name) => {
            if (!seg) return;
            const X = this.sx(seg[2]), Y = this.sy(seg[3]);
            const X0 = this.sx(seg[0]), Y0 = this.sy(seg[1]);
            const L = Math.hypot(X - X0, Y - Y0) || 1;
            const ux = (X - X0) / L, uy = (Y - Y0) / L;
            const c = this.ctx;
            c.font = 'bold 13px system-ui, sans-serif'; c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle';
            c.globalAlpha = 1;
            c.fillText(name, X - ux * 16 - uy * 12, Y - uy * 16 + ux * 12);
          };
          lab(sT, (o.tName || this.tName) + prime);
          lab(sX, (o.xName || this.xName) + prime);
        }
      }
      if (o.ticks) {
        const c = this.ctx;
        c.font = '10.5px system-ui, sans-serif'; c.fillStyle = color; c.strokeStyle = color; c.lineWidth = 1; c.setLineDash([]);
        const doTicks = (dir, other, kmin, kmax, isT) => {
          const L = Math.hypot(dir[0] * this.kx, dir[1] * this.ky) || 1;
          const px = -dir[1] * this.ky / L, py = -dir[0] * this.kx / L;   // screen-perpendicular
          for (let k = Math.ceil(kmin / step); k <= Math.floor(kmax / step); k++) {
            if (k === 0 || Math.abs(k) > 400) continue;
            const v = k * step, X = this.sx(dir[0] * v), Y = this.sy(dir[1] * v);
            c.beginPath(); c.moveTo(X - px * 4, Y - py * 4); c.lineTo(X + px * 4, Y + py * 4); c.stroke();
            c.textAlign = 'center'; c.textBaseline = 'middle';
            const off = isT ? 12 : -12;
            const txt = Math.abs(v) < 1e-9 ? '0' : (+v.toFixed(3)).toString().replace('-', '−');
            c.fillText(txt, X + px * off * (isT ? 1 : 1.1), Y + py * off * (isT ? 1 : 1.1));
          }
        };
        doTicks(tdir, xdir, R.tmin, R.tmax, true);
        doTicks(xdir, tdir, R.xmin, R.xmax, false);
      }
    }
    /** invariant hyperbolas  t^2 - x^2 = +-k^2 (drawn in lab coords then mapped, so the
     *  Galilean / Euclidean comparison modes show that they are NOT invariant there) */
    drawHyperbolas(ks, st) {
      const b = this.bounds(), E = Math.max(Math.abs(b.xmin), Math.abs(b.xmax), Math.abs(b.ymin), Math.abs(b.ymax)) * 1.5 + 1;
      st = st || { color: '#9aa4b2', width: 1, dash: [3, 4], alpha: 0.7 };
      for (const k of ks) {
        const U = Math.asinh(E / k) + 0.3, n = 140;
        for (const br of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const pts = [];
          for (let i = 0; i <= n; i++) {
            const u = -U + 2 * U * i / n, ch = k * Math.cosh(u), sh = k * Math.sinh(u);
            const t = br[0] ? br[0] * ch : sh, x = br[0] ? sh : br[1] * ch;
            pts.push(this.pt(t, x));
          }
          this.poly(pts, st);
        }
      }
    }
    drawLightCone(t0, x0, st, past) {
      st = st || { color: COLORS.light, width: 1.2, dash: [6, 4] };
      const p = this.pt(t0, x0);
      for (const s of [1, -1]) {
        const d = this.ptd(1, s);
        if (past === false) this.ray(p[0], p[1], d[0], d[1], st);
        else this.infLine(p[0], p[1], d[0], d[1], st);
      }
    }
    /** light ray from a lab event in direction dir (+1 / -1), optionally until lab time tEnd */
    drawLightRay(t0, x0, dir, tEnd, st) {
      st = st || { color: COLORS.light, width: 1.2 };
      const a = this.pt(t0, x0);
      if (tEnd === undefined) { const d = this.ptd(1, dir); this.ray(a[0], a[1], d[0], d[1], st); return; }
      const b = this.pt(tEnd, x0 + dir * (tEnd - t0));
      this.seg(a[0], a[1], b[0], b[1], st);
    }
    /** line of simultaneity of frame V through a lab event */
    drawSimLine(t, x, V, st) {
      const A = this.frameToView(V), p = this.pt(t, x);
      this.infLine(p[0], p[1], A[1][1], A[0][1], st || { color: COLORS.S1, width: 1, dash: [5, 4] });
    }
    /** line x' = const of frame V through a lab event (a worldline at rest in V) */
    drawRestLine(t, x, V, st) {
      const A = this.frameToView(V), p = this.pt(t, x);
      this.infLine(p[0], p[1], A[1][0], A[0][0], st || { color: COLORS.S1, width: 1, dash: [5, 4] });
    }
    /** worldline with optional per-flag styles {flag: style} */
    drawWorldline(wl, st, flagStyles) {
      const p = wl.pts;
      if (!flagStyles) {
        // merge into one clipped path
        const c = this.ctx;
        this.stroke(st);
        c.beginPath();
        let open = false;
        for (let i = 1; i < p.length; i++) {
          const a = this.pt(p[i - 1][0], p[i - 1][1]), b = this.pt(p[i][0], p[i][1]);
          const s = this.clip(a[0], a[1], b[0] - a[0], b[1] - a[1], 0, 1);
          if (!s) { open = false; continue; }
          if (!open) { c.moveTo(this.sx(s[0]), this.sy(s[1])); open = true; }
          c.lineTo(this.sx(s[2]), this.sy(s[3]));
          if (s[5] < 1) open = false;
        }
        c.stroke(); c.globalAlpha = 1;
        return;
      }
      for (let i = 1; i < p.length; i++) {
        const f = wl.flags ? wl.flags[i - 1] : null;
        const s2 = (f !== null && flagStyles[f]) ? flagStyles[f] : st;
        if (!s2 || s2.hidden) continue;
        const a = this.pt(p[i - 1][0], p[i - 1][1]), b = this.pt(p[i][0], p[i][1]);
        this.seg(a[0], a[1], b[0], b[1], s2);
      }
    }
    /** proper-time ticks along the visible part of a worldline */
    drawTicks(wl, dtau, o) {
      o = o || {};
      const c = this.ctx, p = wl.pts, color = o.color || '#333';
      c.strokeStyle = color; c.fillStyle = color; c.lineWidth = o.width || 1.3; c.setLineDash([]); c.globalAlpha = 1;
      c.font = o.font || '10px system-ui, sans-serif';
      let count = 0;
      const labelEvery = o.labelEvery || 1;
      for (let i = 1; i < p.length && count < 3000; i++) {
        const ta = wl.tau[i - 1], tb = wl.tau[i];
        if (tb - ta < 1e-12) continue;
        const a = this.pt(p[i - 1][0], p[i - 1][1]), b = this.pt(p[i][0], p[i][1]);
        const s = this.clip(a[0], a[1], b[0] - a[0], b[1] - a[1], 0, 1);
        if (!s) continue;
        const tau0 = ta + s[4] * (tb - ta), tau1 = ta + s[5] * (tb - ta);
        const L = Math.hypot((b[0] - a[0]) * this.kx, (b[1] - a[1]) * this.ky) || 1;
        const px = -(b[1] - a[1]) * this.ky / L, py = -(b[0] - a[0]) * this.kx / L;
        for (let k = Math.ceil(tau0 / dtau - 1e-9); k <= Math.floor(tau1 / dtau + 1e-9); k++) {
          const tau = k * dtau, f = (tau - ta) / (tb - ta);
          const X = this.sx(a[0] + f * (b[0] - a[0])), Y = this.sy(a[1] + f * (b[1] - a[1]));
          const len = (k % labelEvery === 0) ? 5 : 3;
          c.beginPath(); c.moveTo(X - px * len, Y - py * len); c.lineTo(X + px * len, Y + py * len); c.stroke();
          if (o.labels && k % labelEvery === 0) {
            c.textAlign = 'left'; c.textBaseline = 'middle';
            const txt = (o.fmt ? o.fmt(tau) : (+tau.toFixed(2)).toString());
            c.fillText(txt, X + (o.side || 1) * 8, Y);
          }
          count++;
        }
      }
    }
    drawEvent(t, x, o) {
      o = o || {};
      const p = this.pt(t, x);
      const r = o.r || 5;
      if (o.selected) this.dot(p[0], p[1], r + 4, 'rgba(31,111,235,.18)');
      this.dot(p[0], p[1], r, o.color || COLORS.event, o.ring || '#fff');
      if (o.label) this.text(p[0], p[1], o.label, { dx: 8, dy: -9, color: o.labelColor || o.color || COLORS.event, font: 'bold 12px system-ui, sans-serif', bg: 'rgba(255,255,255,.75)' });
    }
    drawNowLine(T, o) {
      o = o || {};
      this.infLine(0, T, 1, 0, { color: o.color || '#7c3aed', width: o.width || 1.5, alpha: o.alpha || 0.85 });
      if (o.label !== false) {
        const b = this.bounds();
        this.text(b.xmin, T, o.text || ('now: ' + this.tName + ' = ' + SR.ui.fmt(T, 2)), { dx: 6, dy: -9, color: o.color || '#7c3aed', bg: 'rgba(255,255,255,.8)' });
      }
    }
    /** cursor coordinates in the given frames (drawn top-right) */
    drawCursorInfo(frames) {
      if (!this.mouse || this._drag) return;
      const [t, x] = this.toLab(this.mouse.wx, this.mouse.wy);
      const lines = (frames || [{ V: 0, name: 'S', prime: '' }]).map(f => {
        const q = this.inFrame(f.V, t, x);
        return f.name + ': ' + this.tName + (f.prime || '') + ' = ' + SR.ui.fmt(q[0], 2) + ',  ' + this.xName + (f.prime || '') + ' = ' + SR.ui.fmt(q[1], 2);
      });
      this.stext(this.W - 8, 6, lines.join('\n'), { align: 'right', bg: 'rgba(255,255,255,.88)', color: '#333' });
    }
    /** standard background: light cone, hyperbolas, lab axes */
    drawBackground(o) {
      o = o || {};
      if (o.hyperbolas) this.drawHyperbolas(o.hyperbolas === true ? [1, 2, 3, 4, 5, 6] : o.hyperbolas);
      if (o.lightCone !== false) this.drawLightCone(0, 0, { color: COLORS.light, width: 1.3, dash: [7, 5], alpha: 0.9 });
    }
  }
  MinkowskiDiagram.COLORS = COLORS;
  SR.MinkowskiDiagram = MinkowskiDiagram;
  SR.COLORS = COLORS;
})();
