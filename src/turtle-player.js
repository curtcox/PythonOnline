(() => {
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const n = value => Number.isFinite(Number(value)) ? Math.max(-1e7, Math.min(1e7, Number(value))) : 0;
function commandSVG(c) {
  const color = escape(c.color || 'black');
  switch (c.op) {
    case 'line': return `<path d="M${n(c.x1)} ${-n(c.y1)}L${n(c.x2)} ${-n(c.y2)}" fill="none" stroke="${color}" stroke-width="${n(c.width)}" stroke-linecap="round"/>`;
    case 'fill': return `<polygon points="${(c.points || []).map(p => n(p[0])+','+-n(p[1])).join(' ')}" fill="${color}"/>`;
    case 'dot': return `<circle cx="${n(c.x)}" cy="${-n(c.y)}" r="${n(c.size)/2}" fill="${color}"/>`;
    case 'text': return `<text x="${n(c.x)}" y="${-n(c.y)}" fill="${color}" font-family="${escape(c.font?.[0] || 'sans-serif')}" font-size="${n(c.font?.[1] || 12)}" font-weight="${String(c.font?.[2]).includes('bold') ? 'bold' : 'normal'}" text-anchor="${({left:'start',center:'middle',right:'end'})[c.align] || 'start'}">${escape(c.text)}</text>`;
    case 'stamp': {
      const shape = c.shape === 'circle' ? '<circle r="7"/>' : c.shape === 'square' ? '<rect x="-7" y="-7" width="14" height="14"/>' : c.shape === 'turtle' ? '<ellipse rx="9" ry="6"/><circle cx="11" r="3"/>' : '<path d="M10 0L-7 -6L-3 0L-7 6Z"/>';
      return `<g transform="translate(${n(c.x)} ${-n(c.y)}) rotate(${-n(c.heading)})" fill="${color}" stroke="${escape(c.stroke || 'black')}">${shape}</g>`;
    }
    default: return '';
  }
}
function toSVG(commands, width = 800, height = 600) {
  width = Math.max(1, n(width)); height = Math.max(1, n(height));
  const bg = [...commands].reverse().find(c => c.op === 'bg')?.color || 'white';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${-width/2} ${-height/2} ${width} ${height}"><rect x="${-width/2}" y="${-height/2}" width="${width}" height="${height}" fill="${escape(bg)}"/>${commands.map(commandSVG).join('')}</svg>`;
}
class TurtlePlayer {
  constructor(container, item) {
    this.container = container; this.item = item; this.cancelled = false;
    this.controls = document.createElement('div'); this.controls.className = 'output-controls';
    const skip = document.createElement('button'); skip.textContent = 'Skip animation'; skip.onclick = () => this.finish();
    const replay = document.createElement('button'); replay.textContent = 'Replay'; replay.onclick = () => this.play();
    this.controls.append(skip, replay); container.append(this.controls);
    this.canvas = document.createElement('div'); this.canvas.className = 'turtle-canvas'; container.append(this.canvas);
    this.observer = new ResizeObserver(() => { if (this.zoom) { this.zoom.resize(); this.zoom.fit(); this.zoom.center(); } }); this.observer.observe(this.canvas);
    this.play();
  }
  play() {
    cancelAnimationFrame(this.frame); this.zoom?.destroy(); this.cancelled = false;
    this.canvas.innerHTML = toSVG([], this.item.width, this.item.height);
    this.svg = this.canvas.querySelector('svg'); this.index = 0; this.speed = 6; this.last = performance.now();
    const step = now => {
      if (this.cancelled) return;
      let budget = Math.max(1, Math.floor((now - this.last) * Math.max(1, this.speed) / 20));
      const commands = this.item.commands;
      const fragment = [];
      while (this.index < commands.length && budget-- > 0) {
        const c = commands[this.index++];
        if (c.op === 'speed') this.speed = n(c.value);
        if (c.op === 'bg') this.svg.querySelector('rect').setAttribute('fill', c.color);
        if (c.speed === 0 || this.speed === 0) budget = Math.max(budget, 3000);
        fragment.push(commandSVG(c));
      }
      this.svg.insertAdjacentHTML('beforeend', fragment.join('')); this.last = now;
      if (this.index < commands.length) this.frame = requestAnimationFrame(step);
      else this.enableZoom();
    };
    this.frame = requestAnimationFrame(step);
  }
  enableZoom() { if (globalThis.svgPanZoom) this.zoom = svgPanZoom(this.svg, { controlIconsEnabled: true, fit: true, center: true }); }
  finish() {
    cancelAnimationFrame(this.frame); this.zoom?.destroy(); this.cancelled = true;
    this.canvas.innerHTML = toSVG(this.item.commands, this.item.width, this.item.height);
    this.svg = this.canvas.querySelector('svg'); this.enableZoom();
  }
  dispose() { this.observer.disconnect(); this.cancelled = true; cancelAnimationFrame(this.frame); this.zoom?.destroy(); }
}
const api = { toSVG, commandSVG, escape, TurtlePlayer };
if (typeof module !== 'undefined') module.exports = api; else globalThis.TurtleGraphics = api;
})();
