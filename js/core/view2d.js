/* view2d.js - a pan/zoom canvas with world coordinates, drawing helpers and draggable handles.
   World y points up. Used by the Minkowski diagram, plots and all 2D scenes. */
(function () {
  'use strict';
  const SR = window.SR;

  class View2D {
    constructor(canvas, opts) {
      opts = opts || {};
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.lockAspect = opts.lockAspect !== false;
      this.pannable = opts.pan !== false;
      this.zoomable = opts.zoom !== false;
      this.margin = Object.assign({ l: 0, r: 0, t: 0, b: 0 }, opts.margin || {});
      this.box = { xmin: -5, xmax: 5, ymin: -5, ymax: 5 };
      this.draggables = [];
      this.onRender = null; this.onClick = null; this.onHover = null; this.onViewChange = null; this.onDblClick = null;
      this.W = 10; this.H = 10; this.dpr = 1; this.kx = 1; this.ky = 1; this.ox = 0; this.oy = 0;
      this.mouse = null;
      this._drag = null; this._queued = false;
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(canvas.parentElement);
      this._bind();
      this.resize();
    }
    setBox(xmin, xmax, ymin, ymax) { this.box = { xmin, xmax, ymin, ymax }; this._fit(); this.requestDraw(); }
    _fit() {
      const b = this.box, m = this.margin;
      const w = Math.max(10, this.W - m.l - m.r), h = Math.max(10, this.H - m.t - m.b);
      let kx = w / (b.xmax - b.xmin), ky = h / (b.ymax - b.ymin);
      if (this.lockAspect) kx = ky = Math.min(kx, ky);
      this.kx = kx; this.ky = ky;
      const cx = (b.xmin + b.xmax) / 2, cy = (b.ymin + b.ymax) / 2;
      this.ox = m.l + w / 2 - cx * kx;
      this.oy = m.t + h / 2 + cy * ky;
    }
    resize() {
      const r = this.canvas.parentElement.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      const dpr = window.devicePixelRatio || 1;
      this.W = r.width; this.H = r.height; this.dpr = dpr;
      this.canvas.width = Math.round(r.width * dpr);
      this.canvas.height = Math.round(r.height * dpr);
      this.canvas.style.width = r.width + 'px';
      this.canvas.style.height = r.height + 'px';
      this._fit();
      this.draw();
      if (this.onResize) this.onResize();
    }
    sx(x) { return this.ox + x * this.kx; }
    sy(y) { return this.oy - y * this.ky; }
    wx(sx) { return (sx - this.ox) / this.kx; }
    wy(sy) { return (this.oy - sy) / this.ky; }
    bounds() {
      const m = this.margin;
      return { xmin: this.wx(m.l), xmax: this.wx(this.W - m.r), ymin: this.wy(this.H - m.b), ymax: this.wy(m.t) };
    }
    requestDraw() {
      if (this._queued) return;
      this._queued = true;
      requestAnimationFrame(() => { this._queued = false; this.draw(); });
    }
    draw() {
      const c = this.ctx;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, this.W, this.H);
      if (this.onRender) {
        c.save();
        try { this.onRender(c, this); } catch (e) { console.error(e); }
        c.restore();
      }
    }
    /* ------------------------------------------------------- interaction */
    _bind() {
      const cv = this.canvas;
      const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      const pick = (sx, sy) => {
        let best = null, bestD = 11;
        for (let i = this.draggables.length - 1; i >= 0; i--) {
          const d = this.draggables[i];
          if (d.enabled === false || (typeof d.enabled === 'function' && !d.enabled())) continue;
          const dist = d.hit(sx, sy, this);
          if (dist < bestD) { bestD = dist; best = d; }
        }
        return best;
      };
      cv.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        const [sx, sy] = pos(e);
        cv.setPointerCapture(e.pointerId);
        const it = pick(sx, sy);
        if (it) { this._drag = { kind: 'item', item: it, sx, sy, moved: false }; it.start && it.start(this.wx(sx), this.wy(sy), e); }
        else if (this.pannable) this._drag = { kind: 'pan', sx, sy, box: Object.assign({}, this.box), moved: false };
        else this._drag = { kind: 'none', sx, sy, moved: false };
      });
      cv.addEventListener('pointermove', e => {
        const [sx, sy] = pos(e);
        this.mouse = { sx, sy, wx: this.wx(sx), wy: this.wy(sy) };
        const d = this._drag;
        if (d) {
          if (Math.hypot(sx - d.sx, sy - d.sy) > 3) d.moved = true;
          if (d.kind === 'item' && d.moved) { d.item.drag(this.wx(sx), this.wy(sy), e); this.requestDraw(); }
          else if (d.kind === 'pan' && d.moved) {
            const dx = (sx - d.sx) / this.kx, dy = (sy - d.sy) / this.ky;
            this.box = { xmin: d.box.xmin - dx, xmax: d.box.xmax - dx, ymin: d.box.ymin + dy, ymax: d.box.ymax + dy };
            this._fit(); this.requestDraw();
            this.onViewChange && this.onViewChange();
          }
        } else {
          const it = pick(sx, sy);
          cv.style.cursor = it ? (it.cursor || 'grab') : (this.pannable ? 'move' : 'default');
          if (this.onHover) this.onHover(this.mouse);
        }
      });
      cv.addEventListener('pointerup', e => {
        const d = this._drag; this._drag = null;
        if (!d) return;
        if (d.kind === 'item' && d.item.end) d.item.end();
        if (!d.moved && this.onClick) { const [sx, sy] = pos(e); this.onClick(this.wx(sx), this.wy(sy), e, d.kind === 'item' ? d.item : null); }
        this.requestDraw();
      });
      cv.addEventListener('pointerleave', () => { if (!this._drag) { this.mouse = null; this.onHover && this.onHover(null); this.requestDraw(); } });
      cv.addEventListener('dblclick', e => { if (this.onDblClick) { const [sx, sy] = pos(e); this.onDblClick(this.wx(sx), this.wy(sy), e); } });
      cv.addEventListener('wheel', e => {
        if (!this.zoomable) return;
        e.preventDefault();
        const [sx, sy] = pos(e);
        const f = Math.exp(Math.max(-0.5, Math.min(0.5, e.deltaY * 0.0015)));
        const wx = this.wx(sx), wy = this.wy(sy), b = this.box;
        this.box = { xmin: wx + (b.xmin - wx) * f, xmax: wx + (b.xmax - wx) * f, ymin: wy + (b.ymin - wy) * f, ymax: wy + (b.ymax - wy) * f };
        this._fit(); this.requestDraw();
        this.onViewChange && this.onViewChange();
      }, { passive: false });
    }
    /** a draggable point handle. getW() -> [wx, wy] ; setW(wx, wy) */
    addHandle(getW, setW, opts) {
      opts = opts || {};
      const h = {
        hit: (sx, sy) => { const p = getW(); if (!p) return Infinity; return Math.hypot(this.sx(p[0]) - sx, this.sy(p[1]) - sy); },
        drag: (wx, wy, e) => setW(wx, wy, e),
        start: opts.start, end: opts.end, cursor: opts.cursor || 'grab', enabled: opts.enabled
      };
      this.draggables.push(h);
      return h;
    }
    /* ---------------------------------------------------------- drawing */
    /** Liang-Barsky clipping of p + s*d, s in [smin, smax], against the viewport. */
    clip(px, py, dx, dy, smin, smax) {
      const b = this.bounds(), pad = 3 / this.kx, padY = 3 / this.ky;
      let t0 = smin === undefined ? -Infinity : smin, t1 = smax === undefined ? Infinity : smax;
      const p = [-dx, dx, -dy, dy], q = [px - (b.xmin - pad), (b.xmax + pad) - px, py - (b.ymin - padY), (b.ymax + padY) - py];
      for (let i = 0; i < 4; i++) {
        if (Math.abs(p[i]) < 1e-300) { if (q[i] < 0) return null; }
        else {
          const t = q[i] / p[i];
          if (p[i] < 0) { if (t > t1) return null; if (t > t0) t0 = t; }
          else { if (t < t0) return null; if (t < t1) t1 = t; }
        }
      }
      if (!isFinite(t0) || !isFinite(t1) || t0 > t1) return null;
      return [px + t0 * dx, py + t0 * dy, px + t1 * dx, py + t1 * dy, t0, t1];
    }
    stroke(st) {
      const c = this.ctx;
      st = st || {};
      c.strokeStyle = st.color || '#000';
      c.lineWidth = st.width || 1;
      c.setLineDash(st.dash || []);
      c.globalAlpha = st.alpha === undefined ? 1 : st.alpha;
    }
    line(x1, y1, x2, y2, st) {
      const c = this.ctx;
      this.stroke(st);
      c.beginPath(); c.moveTo(this.sx(x1), this.sy(y1)); c.lineTo(this.sx(x2), this.sy(y2)); c.stroke();
      c.globalAlpha = 1;
    }
    /** segment clipped to the viewport (safe for huge coordinates) */
    seg(x1, y1, x2, y2, st) {
      const s = this.clip(x1, y1, x2 - x1, y2 - y1, 0, 1);
      if (s) this.line(s[0], s[1], s[2], s[3], st);
      return s;
    }
    infLine(px, py, dx, dy, st) { const s = this.clip(px, py, dx, dy); if (s) this.line(s[0], s[1], s[2], s[3], st); return s; }
    ray(px, py, dx, dy, st) { const s = this.clip(px, py, dx, dy, 0, Infinity); if (s) this.line(s[0], s[1], s[2], s[3], st); return s; }
    poly(pts, st, close, fill) {
      if (!pts || pts.length < 2) return;
      const c = this.ctx;
      this.stroke(st);
      c.beginPath();
      c.moveTo(this.sx(pts[0][0]), this.sy(pts[0][1]));
      for (let i = 1; i < pts.length; i++) c.lineTo(this.sx(pts[i][0]), this.sy(pts[i][1]));
      if (close) c.closePath();
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (!st || st.color !== 'none') c.stroke();
      c.globalAlpha = 1;
    }
    dot(x, y, r, fill, stroke) {
      const c = this.ctx;
      c.setLineDash([]); c.globalAlpha = 1;
      c.beginPath(); c.arc(this.sx(x), this.sy(y), r || 4, 0, 2 * Math.PI);
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); }
    }
    text(x, y, str, o) {
      o = o || {};
      const c = this.ctx;
      c.globalAlpha = 1;
      c.font = o.font || '12px system-ui, sans-serif';
      c.textAlign = o.align || 'left';
      c.textBaseline = o.base || 'middle';
      const X = this.sx(x) + (o.dx || 0), Y = this.sy(y) + (o.dy || 0);
      if (o.bg) {
        const w = c.measureText(str).width, h = 14;
        let bx = X - (c.textAlign === 'center' ? w / 2 : c.textAlign === 'right' ? w : 0);
        const by = Y - (c.textBaseline === 'middle' ? h / 2 : c.textBaseline === 'bottom' ? h : 0);
        c.fillStyle = o.bg; c.fillRect(bx - 2, by, w + 4, h);
      }
      c.fillStyle = o.color || '#222';
      c.fillText(str, X, Y);
    }
    /** text at screen coordinates */
    stext(X, Y, str, o) {
      o = o || {};
      const c = this.ctx;
      c.font = o.font || '12px system-ui, sans-serif';
      c.textAlign = o.align || 'left';
      c.textBaseline = o.base || 'top';
      if (o.bg) {
        const lines = String(str).split('\n');
        const w = Math.max.apply(null, lines.map(l => c.measureText(l).width)), lh = o.lh || 15;
        const bx = X - (c.textAlign === 'center' ? w / 2 : c.textAlign === 'right' ? w : 0);
        c.fillStyle = o.bg; c.fillRect(bx - 4, Y - 2, w + 8, lh * lines.length + 4);
        c.fillStyle = o.color || '#222';
        lines.forEach((l, i) => c.fillText(l, X, Y + i * lh));
        return;
      }
      c.fillStyle = o.color || '#222';
      c.fillText(str, X, Y);
    }
    arrow(x1, y1, x2, y2, st, head) {
      const c = this.ctx;
      head = head || 9;
      const X1 = this.sx(x1), Y1 = this.sy(y1), X2 = this.sx(x2), Y2 = this.sy(y2);
      const L = Math.hypot(X2 - X1, Y2 - Y1);
      this.stroke(st);
      c.beginPath(); c.moveTo(X1, Y1); c.lineTo(X2, Y2); c.stroke();
      if (L > 2) {
        const ux = (X2 - X1) / L, uy = (Y2 - Y1) / L, h = Math.min(head, L * 0.6);
        c.setLineDash([]);
        c.beginPath();
        c.moveTo(X2, Y2);
        c.lineTo(X2 - h * ux + h * 0.45 * uy, Y2 - h * uy - h * 0.45 * ux);
        c.lineTo(X2 - h * ux - h * 0.45 * uy, Y2 - h * uy + h * 0.45 * ux);
        c.closePath();
        c.fillStyle = (st && st.color) || '#000';
        c.fill();
      }
      c.globalAlpha = 1;
    }
  }
  /** "nice" tick step for a span covered by about n ticks */
  View2D.niceStep = function (span, n) {
    const raw = span / Math.max(1, n), mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
    return (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
  };
  SR.View2D = View2D;
})();
