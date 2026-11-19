/* spaceview.js - a horizontal strip showing "space right now" in the view frame of a
   Minkowski diagram. It shares the diagram's horizontal mapping, so objects sit exactly
   under their worldlines. Objects are drawn in lanes (rows). */
(function () {
  'use strict';
  const SR = window.SR;

  class SpaceView {
    constructor(canvas, diagram, opts) {
      opts = opts || {};
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.D = diagram;
      this.lanes = opts.lanes || 3;
      this.onRender = null;
      this.W = 10; this.H = 10; this.dpr = 1;
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(canvas.parentElement);
      this.resize();
    }
    resize() {
      const r = this.canvas.parentElement.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      this.dpr = window.devicePixelRatio || 1;
      this.W = r.width; this.H = r.height;
      this.canvas.width = Math.round(r.width * this.dpr); this.canvas.height = Math.round(r.height * this.dpr);
      this.canvas.style.width = r.width + 'px'; this.canvas.style.height = r.height + 'px';
      this.draw();
    }
    sx(x) { return this.D.sx(x); }
    laneY(i) { const top = 22, h = (this.H - top - 6) / this.lanes; return top + h * (i + 0.5); }
    laneH() { return (this.H - 28) / this.lanes; }
    draw() {
      const c = this.ctx;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, this.W, this.H);
      if (this.onRender) { c.save(); try { this.onRender(c, this); } catch (e) { console.error(e); } c.restore(); }
    }
    requestDraw() { if (this._q) return; this._q = true; requestAnimationFrame(() => { this._q = false; this.draw(); }); }
    /* ----- primitives ----- */
    title(txt) {
      const c = this.ctx;
      c.font = '12px system-ui, sans-serif'; c.fillStyle = '#4b5563'; c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText(txt, 8, 4);
    }
    axis(o) {   // x axis with ticks at the bottom
      o = o || {};
      const c = this.ctx, D = this.D, b = D.bounds();
      const step = SR.View2D.niceStep(b.xmax - b.xmin, Math.max(3, this.W / 70));
      c.strokeStyle = '#c3cad4'; c.lineWidth = 1; c.setLineDash([]);
      c.beginPath(); c.moveTo(0, this.H - 14); c.lineTo(this.W, this.H - 14); c.stroke();
      c.fillStyle = '#6b7280'; c.font = '10px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top';
      for (let x = Math.ceil(b.xmin / step) * step; x <= b.xmax; x += step) {
        const X = this.sx(x);
        c.beginPath(); c.moveTo(X, this.H - 17); c.lineTo(X, this.H - 11); c.stroke();
        c.fillText((+x.toPrecision(6)).toString().replace('-', '−'), X, this.H - 11);
      }
      if (o.label) { c.textAlign = 'right'; c.fillText(o.label, this.W - 4, this.H - 26); }
    }
    bar(x1, x2, lane, color, label, o) {
      o = o || {};
      const c = this.ctx, y = this.laneY(lane), h = o.h || Math.min(18, this.laneH() * 0.55);
      let X1 = this.sx(Math.min(x1, x2)), X2 = this.sx(Math.max(x1, x2));
      c.globalAlpha = o.alpha || 0.85;
      c.fillStyle = color;
      c.fillRect(X1, y - h / 2, Math.max(1.5, X2 - X1), h);
      c.globalAlpha = 1;
      if (o.outline) { c.strokeStyle = o.outline; c.lineWidth = 1.5; c.strokeRect(X1, y - h / 2, Math.max(1.5, X2 - X1), h); }
      if (label) {
        c.font = '11px system-ui, sans-serif'; c.fillStyle = o.labelColor || '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
        const w = c.measureText(label).width;
        if (w < X2 - X1 - 4) c.fillText(label, (X1 + X2) / 2, y);
        else { c.fillStyle = color; c.fillText(label, (X1 + X2) / 2, y - h / 2 - 7); }
      }
    }
    /** outline of a region (e.g. tunnel/barn) */
    frameBox(x1, x2, lane, color, label) {
      const c = this.ctx, y = this.laneY(lane), h = Math.min(30, this.laneH() * 0.9);
      const X1 = this.sx(Math.min(x1, x2)), X2 = this.sx(Math.max(x1, x2));
      c.strokeStyle = color; c.lineWidth = 2; c.setLineDash([]);
      c.beginPath(); c.moveTo(X1, y + h / 2); c.lineTo(X1, y - h / 2); c.lineTo(X2, y - h / 2); c.lineTo(X2, y + h / 2); c.stroke();
      c.fillStyle = color; c.globalAlpha = 0.07; c.fillRect(X1, y - h / 2, X2 - X1, h); c.globalAlpha = 1;
      if (label) { c.font = '11px system-ui, sans-serif'; c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText(label, (X1 + X2) / 2, y - h / 2 - 1); }
    }
    clock(x, lane, reading, color, label, o) {
      o = o || {};
      const c = this.ctx, X = this.sx(x), y = this.laneY(lane), r = o.r || Math.min(11, this.laneH() * 0.32);
      c.setLineDash([]);
      c.beginPath(); c.arc(X, y, r, 0, 2 * Math.PI); c.fillStyle = '#fff'; c.fill();
      c.strokeStyle = color; c.lineWidth = 2; c.stroke();
      const period = o.period || 4, a = 2 * Math.PI * reading / period;
      c.beginPath(); c.moveTo(X, y); c.lineTo(X + Math.sin(a) * r * 0.82, y - Math.cos(a) * r * 0.82); c.lineWidth = 1.6; c.stroke();
      c.font = '10.5px system-ui, sans-serif'; c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText(SR.ui.fmt(reading, o.digits === undefined ? 2 : o.digits), X, y + r + 1);
      if (label) { c.textBaseline = 'bottom'; c.fillText(label, X, y - r - 1); }
    }
    glyph(x, lane, kind, color, label, o) {
      o = o || {};
      const c = this.ctx, X = this.sx(x);
      let y = this.laneY(lane) + (o.dy || 0);
      c.setLineDash([]);
      c.fillStyle = color; c.strokeStyle = color;
      if (kind === 'dot') { c.beginPath(); c.arc(X, y, o.r || 5, 0, 2 * Math.PI); c.fill(); }
      else if (kind === 'ring') { c.beginPath(); c.arc(X, y, o.r || 6, 0, 2 * Math.PI); c.lineWidth = 2; c.stroke(); }
      else if (kind === 'plus' || kind === 'minus') {
        c.beginPath(); c.arc(X, y, o.r || 7, 0, 2 * Math.PI); c.globalAlpha = 0.15; c.fill(); c.globalAlpha = 1;
        c.lineWidth = 2; c.beginPath(); c.moveTo(X - 4, y); c.lineTo(X + 4, y);
        if (kind === 'plus') { c.moveTo(X, y - 4); c.lineTo(X, y + 4); }
        c.stroke();
      } else if (kind === 'wall') { c.lineWidth = o.w || 4; c.beginPath(); c.moveTo(X, y - (o.h || 16)); c.lineTo(X, y + (o.h || 16)); c.stroke(); }
      else if (kind === 'flag') { c.lineWidth = 2; c.beginPath(); c.moveTo(X, y + 10); c.lineTo(X, y - 12); c.stroke(); c.beginPath(); c.moveTo(X, y - 12); c.lineTo(X + 10, y - 8); c.lineTo(X, y - 4); c.fill(); }
      else if (kind === 'person') {
        c.lineWidth = 2; c.beginPath(); c.arc(X, y - 9, 4, 0, 2 * Math.PI); c.stroke();
        c.beginPath(); c.moveTo(X, y - 5); c.lineTo(X, y + 5); c.moveTo(X - 5, y - 1); c.lineTo(X + 5, y - 1); c.moveTo(X, y + 5); c.lineTo(X - 4, y + 12); c.moveTo(X, y + 5); c.lineTo(X + 4, y + 12); c.stroke();
      } else if (kind === 'foot') { c.beginPath(); c.ellipse(X, y, 7, 4, 0, 0, 2 * Math.PI); c.fill(); }
      else if (kind === 'tri') { c.beginPath(); c.moveTo(X, y - 7); c.lineTo(X + 7, y + 6); c.lineTo(X - 7, y + 6); c.closePath(); c.fill(); }
      if (label) {
        c.font = o.font || '10.5px system-ui, sans-serif'; c.fillStyle = o.labelColor || color; c.textAlign = 'center';
        c.textBaseline = o.labelBelow ? 'top' : 'bottom';
        c.fillText(label, X, o.labelBelow ? y + (o.r || 8) + 2 : y - (o.r || 8) - 4);
      }
    }
    banner(txt, color) {
      const c = this.ctx;
      c.font = 'bold 12px system-ui, sans-serif';
      const w = c.measureText(txt).width;
      c.fillStyle = color || '#cf222e'; c.globalAlpha = 0.12; c.fillRect(this.W - w - 18, 3, w + 12, 18); c.globalAlpha = 1;
      c.fillStyle = color || '#cf222e'; c.textAlign = 'right'; c.textBaseline = 'top'; c.fillText(txt, this.W - 12, 5);
    }
  }
  SR.SpaceView = SpaceView;
})();
