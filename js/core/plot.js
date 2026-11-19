/* plot.js - simple function plotter with axes (non-locked aspect). */
(function () {
  'use strict';
  const SR = window.SR;

  class Plot extends SR.View2D {
    constructor(canvas, opts) {
      opts = opts || {};
      super(canvas, Object.assign({ lockAspect: false, margin: { l: 48, r: 12, t: 14, b: 32 } }, opts));
      this.xlabel = opts.xlabel || 'x';
      this.ylabel = opts.ylabel || 'y';
      this.title = opts.title || '';
    }
    axes(o) {
      o = o || {};
      const c = this.ctx, b = this.bounds(), m = this.margin;
      const sxStep = o.xstep || SR.View2D.niceStep(b.xmax - b.xmin, Math.max(3, (this.W - m.l - m.r) / 80));
      const syStep = o.ystep || SR.View2D.niceStep(b.ymax - b.ymin, Math.max(3, (this.H - m.t - m.b) / 45));
      c.save();
      c.beginPath(); c.rect(m.l, m.t, this.W - m.l - m.r, this.H - m.t - m.b); c.clip();
      // grid
      for (let x = Math.ceil(b.xmin / sxStep) * sxStep; x <= b.xmax; x += sxStep) this.line(x, b.ymin, x, b.ymax, { color: '#eceff3' });
      for (let y = Math.ceil(b.ymin / syStep) * syStep; y <= b.ymax; y += syStep) this.line(b.xmin, y, b.xmax, y, { color: '#eceff3' });
      if (b.ymin < 0 && b.ymax > 0) this.line(b.xmin, 0, b.xmax, 0, { color: '#9aa3ae' });
      if (b.xmin < 0 && b.xmax > 0) this.line(0, b.ymin, 0, b.ymax, { color: '#9aa3ae' });
      c.restore();
      // frame and labels
      c.strokeStyle = '#b8c0cb'; c.lineWidth = 1; c.setLineDash([]);
      c.strokeRect(m.l, m.t, this.W - m.l - m.r, this.H - m.t - m.b);
      c.fillStyle = '#4b5563'; c.font = '10.5px system-ui, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'top';
      const fmt = v => { const s = Math.abs(v) < 1e-10 ? '0' : (+v.toPrecision(6)).toString(); return s.replace('-', '−'); };
      for (let x = Math.ceil(b.xmin / sxStep) * sxStep; x <= b.xmax + 1e-12; x += sxStep) c.fillText(fmt(x), this.sx(x), this.H - m.b + 3);
      c.textAlign = 'right'; c.textBaseline = 'middle';
      for (let y = Math.ceil(b.ymin / syStep) * syStep; y <= b.ymax + 1e-12; y += syStep) c.fillText(fmt(y), m.l - 4, this.sy(y));
      c.font = '12px system-ui, sans-serif'; c.fillStyle = '#222';
      c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText(o.xlabel || this.xlabel, m.l + (this.W - m.l - m.r) / 2, this.H - 1);
      c.save(); c.translate(11, m.t + (this.H - m.t - m.b) / 2); c.rotate(-Math.PI / 2);
      c.textBaseline = 'middle'; c.fillText(o.ylabel || this.ylabel, 0, 0); c.restore();
      if (this.title || o.title) { c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = '#4b5563'; c.fillText(o.title || this.title, m.l + 6, m.t + 3); }
    }
    /** clip drawing to plot area while fn runs */
    clipped(fn) {
      const c = this.ctx, m = this.margin;
      c.save(); c.beginPath(); c.rect(m.l, m.t, this.W - m.l - m.r, this.H - m.t - m.b); c.clip();
      try { fn(); } finally { c.restore(); }
    }
    /** plot y = f(x); breaks the curve at non-finite values or big jumps (asymptotes) */
    fn(f, st, x0, x1, n) {
      const b = this.bounds();
      x0 = x0 === undefined ? b.xmin : x0; x1 = x1 === undefined ? b.xmax : x1; n = n || 400;
      const span = (b.ymax - b.ymin);
      let pts = [];
      const flush = () => { if (pts.length > 1) this.poly(pts, st); pts = []; };
      let prev = null;
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * i / n, y = f(x);
        if (!isFinite(y)) { flush(); prev = null; continue; }
        if (prev !== null && Math.abs(y - prev) > 4 * span && Math.sign(y) !== Math.sign(prev)) { flush(); }
        const yc = Math.max(b.ymin - 10 * span, Math.min(b.ymax + 10 * span, y));
        pts.push([x, yc]); prev = y;
      }
      flush();
    }
    vline(x, st, label) {
      const b = this.bounds();
      this.line(x, b.ymin, x, b.ymax, st);
      if (label) this.text(x, b.ymax, label, { dx: 4, dy: 10, color: (st && st.color) || '#333' });
    }
    hline(y, st, label) {
      const b = this.bounds();
      this.line(b.xmin, y, b.xmax, y, st);
      if (label) this.text(b.xmax, y, label, { dx: -4, dy: -8, align: 'right', color: (st && st.color) || '#333' });
    }
  }
  SR.Plot = Plot;
})();
