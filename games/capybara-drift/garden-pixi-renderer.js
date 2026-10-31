/* Retained PixiJS illustration. Model coordinates and saves stay independent. */
(function () {
  'use strict';
  const P = window.PIXI, E = window.CapybaraGarden;
  const ATLAS = '../../assets/capybara-garden/illustrated-atlas.png';
  const FRAMES = {
    capybara: [0, 0, 384, 360], stone: [390, 0, 380, 360],
    bamboo: [775, 0, 377, 360], flowers: [1152, 0, 384, 360],
    light: [0, 365, 375, 325], wood: [380, 365, 440, 325],
    duck: [825, 365, 310, 325], frog: [1152, 365, 384, 325],
    turtle: [0, 700, 384, 324], otter: [395, 700, 410, 324],
    rabbit: [815, 690, 325, 334], butterfly: [1152, 700, 384, 324]
  };
  const xy = (q, r) => ({ x: (q + r * .5) * 1.72, y: r * .94 });
  // Tessellate curves at artwork resolution before scaling to model units.
  // Drawing a radius of 0.6 directly makes Pixi choose visibly coarse polygons.
  class FineGraphics extends P.Graphics {
    constructor() { super(); this.scale.set(.01); }
    ellipse(x,y,rx,ry) { return super.ellipse(x*100,y*100,rx*100,ry*100); }
    rect(x,y,w,h) { return super.rect(x*100,y*100,w*100,h*100); }
    moveTo(x,y) { return super.moveTo(x*100,y*100); }
    lineTo(x,y) { return super.lineTo(x*100,y*100); }
    stroke(style) { return super.stroke({ ...style, width: (style.width || .01)*100 }); }
  }
  const ellipse = (g, x, y, rx, ry, color, alpha = 1) => g.ellipse(x, y, rx, ry).fill({ color, alpha });
  const stroke = (g, points, color, width, alpha = 1) => {
    g.moveTo(...points[0]);
    for (const p of points.slice(1)) g.lineTo(...p);
    g.stroke({ color, width, alpha, cap: 'round', join: 'round' });
  };

  class GardenScene {
    constructor(textures) {
      this.textures = textures;
      this.root = new P.Container();
      this.ground = this.root.addChild(new FineGraphics());
      this.water = this.root.addChild(new FineGraphics());
      this.surface = this.root.addChild(new P.Container());
      this.waterTexture = this.surface.addChild(new P.TilingSprite({ texture: textures.water, width: 1, height: 1 }));
      this.waterTexture.tileScale.set(.006);
      this.shimmer = this.surface.addChild(new FineGraphics());
      this.waterMask = this.root.addChild(new FineGraphics());
      this.surface.mask = this.waterMask;
      this.objects = this.root.addChild(new P.Container());
      this.objects.sortableChildren = true;
      this.effects = this.root.addChild(new FineGraphics());
      this.cursor = this.root.addChild(new FineGraphics());
      this.signature = '';
    }
    sprite(name, width, x, y, parent = this.objects) {
      const s = new P.Sprite(this.textures[name]);
      s.anchor.set(.5, 1);
      s.scale.set(width / s.texture.width);
      s.position.set(x, y); s.zIndex = y;
      parent.addChild(s);
      return s;
    }
    build(profile) {
      const signature = JSON.stringify([profile.cells, profile.palette, profile.visitors, profile.equipped]);
      if (signature === this.signature) return;
      this.signature = signature; this.profile = profile;
      this.cells = E.features(profile);
      this.wet = this.cells.filter(c => c.type === 'water');
      this.wetMap = new Set(this.wet.map(c => c.q + ',' + c.r));
      for (const g of [this.ground, this.water, this.waterMask]) g.clear();
      for (const child of this.objects.removeChildren()) child.destroy({ children: true });
      this.streams = []; this.plants = []; this.visitors = [];
      const night = profile.palette === 'moonlight';
      const waterColor = night ? 0x4b969b : profile.palette === 'sunset' ? 0x7bc6bc : 0x78cfc6;
      const waterPoints = this.wet.length ? this.wet.map(c => xy(c.q, c.r)) : [{x:0,y:0}];
      const left = Math.min(...waterPoints.map(p => p.x)) - 1.1, top = Math.min(...waterPoints.map(p => p.y)) - .7;
      this.waterTexture.position.set(left, top);
      this.waterTexture.width = Math.max(...waterPoints.map(p => p.x)) + 1.1 - left;
      this.waterTexture.height = Math.max(...waterPoints.map(p => p.y)) + .7 - top;
      this.waterTexture.alpha = night ? .35 : .72;
      this.waterTexture.tint = night ? 0x8dbec2 : 0xffffff;
      for (const cell of this.cells) {
        const { x, y } = xy(cell.q, cell.r);
        ellipse(this.ground, x, y + .18, 1.22, .76, 0x4c6854, .12);
        ellipse(this.ground, x, y + .09, 1.17, .72, 0x9c9b72);
        ellipse(this.ground, x, y, 1.17, .71, cell.type === 'water' ? 0xc9c3a2 : 0xb2c48a);
        ellipse(this.ground, x - .08, y - .04, 1.05, .62, cell.type === 'water' ? 0xd9d0af : 0xc3cf96);
      }
      for (const cell of this.wet) {
        const { x, y } = xy(cell.q, cell.r);
        ellipse(this.water, x, y, 1.06, .63, waterColor);
        ellipse(this.waterMask, x, y, 1.06, .63, 0xffffff);
        for (const [q, r] of E.neighbors(cell.q, cell.r)) {
          if (this.wetMap.has(q + ',' + r)) continue;
          const n = xy(q, r), mx = (x + n.x) / 2, my = (y + n.y) / 2;
          const variation = Math.sin(cell.q*17 + cell.r*31 + q*11 + r*7);
          const rock = this.sprite('stone', .87 + variation*.12, mx + variation*.04, my + .16);
          rock.scale.x *= ((cell.q + cell.r + q) % 2 ? 1 : -1);
          rock.tint = night ? 0xc1d0d0 : 0xffffff;
        }
      }
      for (const cell of this.cells.filter(c => c.type !== 'water')) {
        const { x, y } = xy(cell.q, cell.r);
        const widths = { stone: 1.9, bamboo: 2.1, flowers: 1.9, light: 1.22, wood: 2.2 };
        const s = this.sprite(cell.type, widths[cell.type], x, y + .22);
        s.zIndex = y + .15; s.tint = night ? 0xbac9ce : 0xffffff;
        if (cell.type === 'bamboo' || cell.type === 'flowers') this.plants.push(s);
        const neighbor = E.neighbors(cell.q, cell.r).find(([q,r]) => this.wetMap.has(q+','+r));
        if (neighbor && cell.feature === 'spout') {
          const wet = xy(...neighbor), sign = wet.x < x ? -1 : 1;
          s.scale.x *= sign;
          this.streams.push({ x: x + sign*.88, y: y - .7, endX: x+(wet.x-x)*.78, end: y+(wet.y-y)*.78 });
        }
        if (neighbor && cell.feature === 'cascade') {
          const wet = xy(...neighbor);
          if(wet.y>=y)this.streams.push({ x, y:y-.1, endX:x+(wet.x-x)*.78, end:y+(wet.y-y)*.78 });
        }
      }
      this.swimmer = this.objects.addChild(new P.Container());
      const under = this.sprite('capybara', 1.42, 0, .12, this.swimmer);
      under.alpha = .23; under.tint = 0x458e87;
      const float = this.swimmer.addChild(new FineGraphics());
      const colors = { peach: 0xf1c6a4, mint: 0xc7e0af, citrus: 0xeac260, flower: 0xe7b8cc };
      float.ellipse(0, -.08, .67, .2).stroke({ color: colors[profile.equipped] || colors.peach, width: .075, alpha: .85 });
      const body = this.swimmer.addChild(new P.Container());
      this.capybara = this.sprite('capybara', 1.42, 0, .05, body);
      const mask = this.swimmer.addChild(new FineGraphics().rect(-1.1, -2, 2.2, 1.88).fill(0xffffff));
      body.mask = mask;
      this.fruit = this.objects.addChild(new FineGraphics());
      ellipse(this.fruit, 0, .04, .14, .05, 0xf0ffff, .65);
      ellipse(this.fruit, 0, 0, .12, .095, 0xf6c54b);
      ellipse(this.fruit, -.035, -.025, .05, .025, 0xffe589);
      ellipse(this.fruit, .035, -.105, .06, .018, 0x648c41);
      const habitat = { rabbit: 'flowers', butterfly: 'flowers', frog: 'stone', turtle: 'wood', otter: 'stone', firefly: 'light' };
      profile.visitors.forEach((name, i) => {
        const pool = this.cells.filter(c => c.type === habitat[name]);
        const anchor = (pool.length ? pool : this.wet)[(i * 3 + 2) % (pool.length || this.wet.length)] || { q: 0, r: 0 };
        const p = xy(anchor.q, anchor.r);
        let sprite;
        if (name === 'firefly') {
          sprite = this.objects.addChild(new FineGraphics());
          ellipse(sprite, 0, 0, .14, .14, 0xffe49b, .16);
          ellipse(sprite, 0, 0, .035, .035, 0xffedb3);
        } else sprite = this.sprite(name, name === 'butterfly' ? .44 : .67, p.x, p.y);
        this.visitors.push({ sprite, name, x: p.x, y: p.y, phase: i * 2.3 });
      });
    }
    animate(time, reduced, swimmer, fruit, ripples, cursor, tool) {
      const t = reduced ? 0 : time;
      this.waterTexture.tilePosition.set(t*.018, Math.sin(t*.12)*.08);
      const waves = this.shimmer.clear(), fx = this.effects.clear();
      for (const cell of this.wet) {
        const p = xy(cell.q, cell.r);
        for (let i = 0; i < 6; i++) {
          const phase = cell.q * 7 + cell.r * 3 + i * 2.4;
          const x = p.x + Math.sin(phase + t * .12) * .88;
          const y = p.y + Math.cos(phase * 1.3 + t * .19) * .52;
          stroke(waves, [[x - .18, y], [x - .06, y - .035], [x + .09, y + .025], [x + .2, y]], 0xedffe9, .012, .3 + .12 * Math.sin(t + phase));
        }
        if (this.profile.palette !== 'rain') {
          const drift = (t * .07 + (cell.q * .31 + cell.r * .23 + 20) % 1) % 1;
          ellipse(fx, p.x + Math.sin(t * .2 + cell.q) * .25, p.y - .3 - drift * .8, .21 + drift * .18, .055 + drift * .08, 0xffffff, Math.sin(drift * Math.PI) * .11);
        }
      }
      for (const stream of this.streams) {
        stroke(fx, [[stream.x, stream.y], [(stream.x+stream.endX)/2, stream.y+.18], [stream.endX, stream.end]], 0xe9fff3, .07, .7);
        fx.ellipse(stream.endX, stream.end, .19 + Math.sin(t * 3) * .025, .07).stroke({ color: 0xf5fff0, alpha: .5, width: .015 });
      }
      for (const plant of this.plants) plant.rotation = Math.sin(t * .8 + plant.x) * (reduced ? 0 : .008);
      const p = xy(swimmer.q, swimmer.r);
      this.swimmer.position.set(p.x, p.y); this.swimmer.zIndex = p.y;
      this.capybara.y = .05 + (reduced ? 0 : Math.sin(t * 1.4) * .012);
      fx.ellipse(p.x, p.y - .08, .73 + Math.sin(t * 1.3) * .03, .22).stroke({ color: 0xedfff1, alpha: .8, width: .018 });
      const f = xy(fruit.q, fruit.r);
      this.fruit.position.set(f.x, f.y + Math.sin(t * 1.8) * .018); this.fruit.zIndex = f.y + .1;
      for (const v of this.visitors) {
        const drift = reduced ? 0 : Math.sin(t * .7 + v.phase) * .12;
        v.sprite.position.set(v.x + drift, v.y - ((v.name === 'butterfly' || v.name === 'firefly') ? .42 + drift : 0));
        v.sprite.zIndex = v.sprite.y + .1;
      }
      for (const r of ripples) {
        const p = xy(r.q, r.r);
        fx.ellipse(p.x, p.y, .25 + r.age * .65, .12 + r.age * .3).stroke({ color: 0xf3fff0, alpha: Math.max(0, .55 - r.age * .28), width: .018 });
      }
      if (this.profile.palette === 'rain' && !reduced) {
        for (let i = 0; i < 30; i++) {
          const x = (i * 1.73) % 12 - 6, y = (i * 1.19 + t * 1.8) % 8 - 4;
          stroke(fx, [[x, y], [x - .04, y + .15]], 0xf2fff7, .012, .35);
        }
      }
      this.cursor.clear();
      if (tool && tool !== 'swim') {
        const p = xy(cursor.q, cursor.r);
        this.cursor.ellipse(p.x, p.y, 1.02, .6).fill({ color: tool === 'erase' ? 0xc66f50 : 0xfff4ce, alpha: .14 }).stroke({ color: tool === 'erase' ? 0xbc674e : 0xfff7df, width: .035, alpha: .9 });
      }
    }
    destroy() { this.root.destroy({ children: true }); }
  }

  class GardenRenderer {
    constructor(canvas) {
      this.canvas = canvas; this.zoom = 1; this.pan = {x:0,y:0}; this.ripples = [];
      this.swimmer = { q: 0, r: 0 }; this.target = { q: 0, r: 0 };
      this.fruit = { q: .6, r: .2 }; this.cursor = { q: 0, r: 0 };
      this.size = 1; this.ox = this.oy = 0; this.disposed = false;
      this.ready = this.initialize();
    }
    async initialize() {
      this.app = new P.Application();
      try {
        await this.app.init({ canvas: this.canvas, preference: 'webgl', autoStart: false,
          antialias: true, resolution: Math.min(devicePixelRatio || 1, 2), autoDensity: false,
          backgroundAlpha: 0, preserveDrawingBuffer: true });
        const [atlas, water] = await Promise.all([P.Assets.load(ATLAS), P.Assets.load('../../assets/capybara-garden/water.png')]);
        if (this.disposed) { this.app.destroy(false, { children: true }); return; }
        this.textures = { water };
        const image = atlas.source.resource;
        const scan = document.createElement('canvas');
        scan.width = image.width; scan.height = image.height;
        const ctx = scan.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        for (const [name, frame] of Object.entries(FRAMES)) {
          const [x, y, w, h] = frame, pixels = ctx.getImageData(x, y, w, h).data;
          let left = w, top = h, right = 0, bottom = 0;
          for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
            if (pixels[(yy * w + xx) * 4 + 3] < 32) continue;
            left = Math.min(left, xx); top = Math.min(top, yy); right = Math.max(right, xx); bottom = Math.max(bottom, yy);
          }
          this.textures[name] = new P.Texture({ source: atlas.source,
            frame: new P.Rectangle(x + left, y + top, right - left + 1, bottom - top + 1) });
        }
        this.scene = new GardenScene(this.textures);
        this.app.stage.addChild(this.scene.root); this.resize();
        this.canvas.dataset.renderer = 'pixi-webgl';
      } catch (error) {
        if (this.app.renderer) this.app.destroy(false, { children: true });
        this.app = null; throw error;
      }
    }
    resize() {
      const b = this.canvas.getBoundingClientRect();
      this.w = Math.max(1, b.width); this.h = Math.max(1, b.height);
      if (this.app?.renderer) this.app.renderer.resize(this.w, this.h);
    }
    layout(profile, width = this.w, height = this.h, compact = false) {
      const points = profile.cells.length ? profile.cells.map(c => xy(c.q, c.r)) : [{ x: 0, y: 0 }];
      const minX = Math.min(...points.map(p => p.x)) - 1.4, maxX = Math.max(...points.map(p => p.x)) + 1.4;
      const minY = Math.min(...points.map(p => p.y)) - 2, maxY = Math.max(...points.map(p => p.y)) + 1;
      const shortLandscape = !compact && height < 450 && width > 600;
      const top = compact ? 4 : shortLandscape ? 72 : 115;
      const bottom = compact ? 4 : shortLandscape ? 78 : width < 600 ? 205 : 172;
      const available = Math.max(55, height - top - bottom);
      const size = Math.max(3, Math.min((width - (compact ? 8 : shortLandscape ? 330 : 34)) / (maxX - minX), available / (maxY - minY), compact ? 100 : 112)) * (compact ? 1 : this.zoom);
      return { size, ox: width / 2 - (minX + maxX) * size / 2 + (compact ? 0 : this.pan.x), oy: top + available / 2 - (minY + maxY) * size / 2 + (compact ? 0 : this.pan.y) };
    }
    moveCamera(profile, dx, dy, zoom = this.zoom, anchor = {x:this.w/2,y:this.h/2}) {
      const before = this.layout(profile);
      this.zoom = Math.max(.5, Math.min(3, zoom));
      const after = this.layout(profile), ratio = after.size / before.size;
      this.pan.x += anchor.x + (before.ox-anchor.x)*ratio - after.ox + dx;
      this.pan.y += anchor.y + (before.oy-anchor.y)*ratio - after.oy + dy;
      Object.assign(this, this.layout(profile));
    }
    resetCamera() { this.zoom=1; this.pan={x:0,y:0}; }
    point(q, r) { const p = xy(q, r); return { x: this.ox + p.x * this.size, y: this.oy + p.y * this.size }; }
    input(x, y) {
      const r = (y - this.oy) / (this.size * .94), q = (x - this.ox) / (this.size * 1.72) - r * .5;
      let a = Math.round(q), b = Math.round(r), c = Math.round(-q - r);
      const dq = Math.abs(a - q), dr = Math.abs(b - r), dc = Math.abs(c + q + r);
      if (dq > dr && dq > dc) a = -b - c; else if (dr > dc) b = -a - c;
      return { q: a, r: b };
    }
    ripple(q, r) { this.ripples.push({ q, r, age: 0 }); this.ripples = this.ripples.slice(-18); }
    draw(profile, time, dt, active, reduced, selected) {
      if (!this.scene || this.disposed) return;
      Object.assign(this, this.layout(profile));
      this.scene.root.position.set(this.ox, this.oy); this.scene.root.scale.set(this.size);
      this.scene.build(profile);
      const water = this.scene.wet;
      if (water.length) {
        if (!water.some(c => c.q === this.target.q && c.r === this.target.r)) this.target = { ...water[0] };
        if (active) {
          const rate = Math.min(1, dt * 2.5);
          this.swimmer.q += (this.target.q - this.swimmer.q) * rate; this.swimmer.r += (this.target.r - this.swimmer.r) * rate;
          this.ripples.forEach(r => { r.age += dt; }); this.ripples = this.ripples.filter(r => r.age < 2);
          if (Math.hypot(this.swimmer.q - this.fruit.q, this.swimmer.r - this.fruit.r) < .6) {
            this.fruit.q += (this.fruit.q - this.swimmer.q) * dt; this.fruit.r += (this.fruit.r - this.swimmer.r) * dt;
          }
          if (!water.some(c => Math.hypot(c.q - this.fruit.q, c.r - this.fruit.r) < .8)) this.fruit = { q: water[0].q + .3, r: water[0].r };
        }
      }
      this.scene.animate(time, reduced, this.swimmer, this.fruit, reduced ? [] : this.ripples, this.cursor, selected);
      if (this.canvas.dataset.palette !== profile.palette) this.canvas.dataset.palette = profile.palette;
      this.app.render();
    }
    postcard(canvas, profile, width = 400, height = 240) {
      // Temporary scene, same GPU context; album cards are plain 2D canvases.
      if (!this.scene || this.disposed) return;
      const scene = new GardenScene(this.textures);
      const fit = this.layout(profile, width, height, true);
      scene.build(profile);
      const first = profile.cells.find(c => c.type === 'water') || { q: 0, r: 0 };
      scene.animate(0, true, first, { q: first.q + .5, r: first.r }, [], first, null);
      scene.root.position.set(fit.ox, fit.oy); scene.root.scale.set(fit.size);
      const target = P.RenderTexture.create({ width, height });
      try {
        this.app.renderer.render({ container: scene.root, target, clear: true });
        const result = this.app.renderer.extract.canvas({ target });
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#dce5c9'; ctx.fillRect(0, 0, width, height); ctx.drawImage(result, 0, 0);
      } finally { target.destroy(true); scene.destroy(); }
    }
    destroy() {
      if (this.disposed) return;
      this.disposed = true;
      if (this.scene) {
        this.app.destroy(false, { children: true });
        for (const texture of Object.values(this.textures)) texture.destroy(false);
      }
    }
  }
  window.GardenRenderer = GardenRenderer;
})();
