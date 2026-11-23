/* A Little Universe Called Fara — behaviour. All content comes from config.js. */
(() => {
  'use strict';
  const C = window.FARA_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const PHOTO_DIR = 'assets/fara/photos/';

  /* ---------- tiny DOM helper ---------- */
  function h(tag, props = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'style') Object.assign(n.style, v);
      else if (k === 'dataset') Object.assign(n.dataset, v);
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) n.append(kid.nodeType ? kid : document.createTextNode(kid));
    return n;
  }

  /* ---------- photos ---------- */
  function photoSrc(key, size = 'sm') {
    const p = C.photos[key];
    return p ? `${PHOTO_DIR}${p.file}-${size}.jpg` : '';
  }
  function img(key, { sizes = '100vw', eager = false } = {}) {
    const p = C.photos[key];
    if (!p) { console.warn(`[fara] Unknown photo key "${key}" — check config.js`); return h('span', { class: 'ph--missing' }); }
    const smW = Math.round(p.w * Math.min(1, 900 / Math.max(p.w, p.h)));
    const base = PHOTO_DIR + p.file;
    return h('img', {
      src: `${base}-sm.jpg`,
      srcset: `${base}-sm.jpg ${smW}w, ${base}-lg.jpg ${p.w}w`,
      sizes, width: p.w, height: p.h, alt: p.alt || '',
      loading: eager ? 'eager' : 'lazy', decoding: 'async',
      style: { objectPosition: p.pos || '50% 50%' },
    });
  }

  /* viewer groups: name -> [{key, caption}] */
  const groups = {};
  function viewable(node, group, key, caption = '') {
    (groups[group] ||= []).push({ key, caption });
    const idx = groups[group].length - 1;
    node.classList.add('ph--view');
    node.tabIndex = 0;
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', `View photo: ${C.photos[key]?.alt || 'photo'}`);
    const open = (e) => { if (node.closest('.is-dragging') || node.dataset.dragged === '1') return; openViewer(group, idx); };
    node.addEventListener('click', open);
    node.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    return node;
  }
  const frame = (key, opts, cls = '') => h('div', { class: `ph ${cls}` }, img(key, opts));

  const head = (eyebrow, title, id, lede, dark) =>
    h('div', { class: `section-head${dark ? ' on-dark' : ''}` },
      h('p', { class: 'eyebrow', 'data-reveal': '' }, eyebrow),
      h('h2', { class: 'display', id, 'data-reveal': '', style: { '--d': '.12s' } }, title),
      lede ? h('p', { class: 'lede', 'data-reveal': '', style: { '--d': '.24s' } }, lede) : null);

  /* ==========================================================================
     STARFIELD (intro, constellation, nightfall)
     ========================================================================== */
  class Sky {
    constructor(canvas, opts = {}) {
      this.c = canvas; this.ctx = canvas.getContext('2d');
      this.o = Object.assign({ mode: 'twinkle', density: 0.00018, max: 420, shooting: false }, opts);
      this.t0 = performance.now(); this.running = false; this.speed = 0; this.target = 0;
      this.reveal = this.o.mode === 'intro' ? 0 : 1; this.hero = 0; this.warping = false;
      this.resize(); this.loop = this.loop.bind(this);
      new ResizeObserver(() => this.resize()).observe(canvas);
      this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this.visible ? this.start() : this.stop(); });
      this.io.observe(canvas);
      document.addEventListener('visibilitychange', () => document.hidden ? this.stop() : this.visible && this.start());
    }
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = this.c.clientWidth, hgt = this.c.clientHeight;
      if (!w || !hgt) return;
      this.w = w; this.h = hgt; this.c.width = w * dpr; this.c.height = hgt * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(this.o.max, Math.round(w * hgt * this.o.density));
      const R = Math.random;
      if (this.o.mode === 'intro') {
        this.stars = Array.from({ length: n }, () => ({ x: (R() * 2 - 1), y: (R() * 2 - 1), z: R() * .95 + .05, tw: R() * 6.28, hue: R() }));
      } else {
        this.stars = Array.from({ length: n }, () => ({ x: R() * w, y: R() * hgt, r: R() * 1.1 + .25, ph: R() * 6.28, sp: R() * 1.4 + .4, hue: R() }));
      }
      this.shots = []; this.nextShot = performance.now() + 2500;
      if (!this.running) this.draw(performance.now());
    }
    start() { if (this.running || reduced && this.o.mode !== 'intro' && this.drawnOnce) return; this.running = true; this.last = performance.now(); requestAnimationFrame(this.loop); }
    stop() { this.running = false; }
    loop(t) { if (!this.running) return; this.draw(t); if (reduced) { this.running = false; this.drawnOnce = true; return; } requestAnimationFrame(this.loop); }
    color(hue, a) {
      // warm ivory / soft lavender / champagne
      return hue < .6 ? `rgba(255,248,235,${a})` : hue < .85 ? `rgba(205,198,240,${a})` : `rgba(240,214,165,${a})`;
    }
    draw(t) {
      const { ctx, w, h: H } = this; if (!w) return;
      const dt = Math.min(64, t - (this.last || t)); this.last = t;
      ctx.clearRect(0, 0, w, H);
      if (this.o.mode === 'intro') return this.drawIntro(t, dt);
      const time = (t - this.t0) / 1000;
      const drift = time * 2.2;
      for (const s of this.stars) {
        const a = .35 + .55 * (.5 + .5 * Math.sin(time * s.sp + s.ph));
        let x = (s.x + drift * s.r * .6) % w;
        ctx.fillStyle = this.color(s.hue, a);
        ctx.beginPath(); ctx.arc(x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      if (this.o.shooting && !reduced) this.drawShots(t);
    }
    drawShots(t) {
      const { ctx, w, h: H } = this;
      if (t > this.nextShot) {
        this.shots.push({ x: Math.random() * w * .8 + w * .1, y: Math.random() * H * .4, vx: -(2.4 + Math.random() * 2), vy: 1 + Math.random(), life: 0 });
        this.nextShot = t + 3500 + Math.random() * 6000;
      }
      this.shots = this.shots.filter((s) => s.life < 1);
      for (const s of this.shots) {
        s.life += .012; s.x += s.vx * 2; s.y += s.vy * 2;
        const a = Math.sin(s.life * Math.PI) * .8;
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 28, s.y - s.vy * 28);
        g.addColorStop(0, `rgba(255,246,225,${a})`); g.addColorStop(1, 'rgba(255,246,225,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 28, s.y - s.vy * 28); ctx.stroke();
      }
    }
    drawIntro(t, dt) {
      const { ctx, w, h: H } = this;
      const cx = w / 2, cy = H / 2, fov = Math.max(w, H) * .55;
      this.speed += (this.target - this.speed) * (this.warping ? .04 : .02);
      const n = Math.floor(this.stars.length * this.reveal);
      for (let i = 0; i < n; i++) {
        const s = this.stars[i];
        const pz = s.z;
        s.z -= this.speed * dt;
        if (s.z <= .02) { s.z = 1; s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; continue; }
        const sx = cx + (s.x / s.z) * fov * .5, sy = cy + (s.y / s.z) * fov * .5;
        if (sx < -20 || sx > w + 20 || sy < -20 || sy > H + 20) { s.z = 1; continue; }
        const near = 1 - s.z;
        const a = clamp(near * 1.3 + .1) * (.75 + .25 * Math.sin(t / 700 + s.tw)) * clamp((i / n) < 1 ? (this.reveal * this.stars.length - i) / 20 : 1);
        const r = .3 + near * 1.7;
        if (this.speed > .0006) {
          const px = cx + (s.x / pz) * fov * .5, py = cy + (s.y / pz) * fov * .5;
          ctx.strokeStyle = this.color(s.hue, a); ctx.lineWidth = r;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
        } else {
          ctx.fillStyle = this.color(s.hue, a);
          ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.283); ctx.fill();
        }
      }
      // the first star
      if (this.hero > 0) {
        const hx = cx, hy = cy - Math.min(H * .26, 220);
        const pulse = 1 + .08 * Math.sin(t / 900);
        const rad = 26 * pulse;
        const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, rad);
        g.addColorStop(0, `rgba(255,250,238,${this.hero})`);
        g.addColorStop(.12, `rgba(255,240,210,${this.hero * .9})`);
        g.addColorStop(.4, `rgba(216,189,133,${this.hero * .25})`);
        g.addColorStop(1, 'rgba(216,189,133,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, rad, 0, 6.283); ctx.fill();
        ctx.strokeStyle = `rgba(255,245,225,${this.hero * .35})`; ctx.lineWidth = .6;
        ctx.beginPath(); ctx.moveTo(hx - rad * 1.3, hy); ctx.lineTo(hx + rad * 1.3, hy); ctx.moveTo(hx, hy - rad * 1.3); ctx.lineTo(hx, hy + rad * 1.3); ctx.stroke();
      }
    }
    tween(prop, to, ms) {
      const from = this[prop], t0 = performance.now();
      const step = (t) => { const k = clamp((t - t0) / ms); this[prop] = from + (to - from) * (1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
  }

  /* ==========================================================================
     INTRO
     ========================================================================== */
  const intro = $('#intro'), main = $('#main');
  main.inert = true;
  let introSky, timers = [], entered = false;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function setupIntro() {
    const [l0, l1] = $$('.intro__line', intro);
    l0.textContent = C.intro.lines[0] || ''; l1.textContent = C.intro.lines[1] || '';
    const rv = $('.intro__reveal', intro);
    // split "Happy Birthday, Fara." so the name can be styled
    const text = C.intro.reveal, name = C.name;
    const at = text.lastIndexOf(name);
    let i = 0;
    // chars grouped per word so a word never breaks mid-letter
    const chars = (str, parent) => str.split(/( )/).forEach((word) => {
      if (word === ' ') return parent.append(' ');
      if (!word) return;
      const wd = h('span', { class: 'wd' });
      for (const ch of word) wd.append(h('span', { class: 'ch', style: { '--i': i++ } }, ch));
      parent.append(wd);
    });
    rv.setAttribute('aria-label', text);
    const wrap = h('span', { 'aria-hidden': 'true' });
    if (at >= 0) {
      chars(text.slice(0, at), wrap);
      const nm = h('span', { class: 'name' }); chars(name, nm); wrap.append(nm);
      chars(text.slice(at + name.length), wrap);
    } else chars(text, wrap);
    rv.append(wrap);
    $('.intro__enter-label', intro).textContent = C.intro.button;

    introSky = new Sky($('.intro__sky', intro), { mode: 'intro', density: .0009, max: 900 });
    introSky.start();
    const btn = $('.intro__enter', intro);
    btn.addEventListener('click', enter);
    $('.intro__skip', intro).addEventListener('click', enter);

    if (reduced) {
      introSky.hero = .8; introSky.reveal = 1;
      rv.classList.add('show'); btn.classList.add('show');
      return;
    }
    later(() => introSky.tween('hero', 1, 1800), 300);
    later(() => introSky.tween('reveal', 1, 6000), 1400);
    later(() => { introSky.target = .00011; }, 1800);
    later(() => l0.classList.add('show'), 2800);
    later(() => { l0.classList.replace('show', 'hide'); }, 7800);
    later(() => l1.classList.add('show'), 9000);
    later(() => { l1.classList.replace('show', 'hide'); introSky.tween('hero', .55, 1500); }, 12800);
    later(() => rv.classList.add('show'), 14000);
    later(() => { btn.classList.add('show'); btn.focus({ preventScroll: true }); }, 15800);
  }

  function enter() {
    if (entered) return; entered = true;
    timers.forEach(clearTimeout);
    intro.classList.add('is-leaving');
    if (!reduced) { introSky.warping = true; introSky.reveal = 1; introSky.target = .0016; introSky.tween('hero', 0, 700); }
    setTimeout(() => {
      main.inert = false; main.removeAttribute('aria-hidden');
      document.documentElement.classList.remove('is-locked'); document.body.classList.remove('is-locked');
      window.scrollTo(0, 0);
      main.classList.add('is-visible');
      intro.classList.add('is-gone');
      $('#hero').classList.add('in');
      $('.hero__title').focus({ preventScroll: true });
    }, reduced ? 50 : 1100);
    setTimeout(() => { introSky.stop(); intro.hidden = true; }, reduced ? 400 : 3000);
  }
  document.documentElement.classList.add('is-locked');

  /* ==========================================================================
     SECTIONS
     ========================================================================== */
  function renderHero() {
    const c = C.hero;
    const name = C.name;
    $('#hero').append(
      h('div', { class: 'hero__media', 'data-parallax': '0.08' }, img(c.photo, { eager: true })),
      h('div', { class: 'hero__content' },
        h('h1', { class: 'hero__title', tabindex: '-1', 'aria-label': C.title },
          h('span', { class: 'row', 'aria-hidden': 'true' }, h('span', { style: { '--d': '.15s' } }, 'A Little Universe')),
          h('span', { class: 'row', 'aria-hidden': 'true' }, h('span', { style: { '--d': '.35s' } }, 'Called ', h('em', {}, name)))),
        h('div', { class: 'hero__meta' },
          h('p', { class: 'hero__line' }, c.line),
          h('p', { class: 'hero__cue', 'aria-hidden': 'true' }, h('i'), 'Scroll'))));
  }

  function renderGallery() {
    const g = C.gallery, root = $('#gallery');
    root.append(head(g.eyebrow, g.title, 'gallery-title'));

    // full-screen cinematic
    const cine = h('figure', { class: 'gallery__cine' },
      h('div', { class: 'ph', 'data-parallax': '0.12', style: { height: '124%' } }, img(g.cinematic.photo)),
      g.cinematic.caption ? h('figcaption', {}, g.cinematic.caption) : null);
    viewable(cine, 'gallery', g.cinematic.photo, g.cinematic.caption);
    cine.classList.remove('ph--view');
    root.append(cine);

    // overlapping trio + floating video
    const [a, b] = g.trio.photos;
    const grid = h('div', { class: 'trio__grid' },
      viewable(h('figure', { class: 'ph trio__a', 'data-reveal': 'mask' }, img(a.photo, { sizes: '(min-width:900px) 33vw, 75vw' })), 'gallery', a.photo, a.caption),
      viewable(h('figure', { class: 'ph trio__b', 'data-reveal': 'mask', style: { '--d': '.2s' } }, img(b.photo, { sizes: '(min-width:900px) 33vw, 66vw' })), 'gallery', b.photo, b.caption));
    if (C.video && C.video.src) {
      const v = h('video', { muted: true, loop: true, playsinline: true, preload: 'none', poster: C.video.poster, 'aria-label': C.video.alt, disablepictureinpicture: true });
      v.muted = true;
      v.append(h('source', { src: C.video.src, type: 'video/mp4' }));
      if (reduced) v.controls = true;
      const fig = h('figure', { class: 'ph trio__v float' }, v, g.trio.videoCaption ? h('figcaption', {}, g.trio.videoCaption) : null);
      grid.append(fig);
      if (!reduced) new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: .25 }).observe(fig);
    }
    root.append(h('div', { class: 'trio' }, h('p', { class: 'trio__line', 'data-reveal': '' }, g.trio.line), grid));

    // quiet composition
    root.append(h('div', { class: 'quiet' },
      viewable(h('figure', { class: 'ph', 'data-reveal': 'mask' }, img(g.quiet.photo, { sizes: '300px' })), 'gallery', g.quiet.photo, ''),
      h('p', { 'data-reveal': '', style: { '--d': '.3s' } }, g.quiet.line)));

    // polaroids
    const [first, ...rest] = g.polaroidsTitle.split(' ');
    root.append(h('div', { class: 'polaroids' },
      h('h3', { 'data-reveal': '' }, first + ' ', h('em', {}, rest.join(' '))),
      h('div', { class: 'polaroids__row' }, g.polaroids.map((p, i) =>
        viewable(h('figure', { class: 'polaroid', 'data-reveal': '', style: { '--d': `${i * .15}s` } },
          h('div', { class: 'ph' }, img(p.photo, { sizes: '300px' })), h('figcaption', {}, p.caption)), 'us', p.photo, p.caption)))));

    // film strip
    const track = h('div', { class: 'strip__track', tabindex: '0', 'aria-label': 'Film strip of photos, scroll sideways' },
      g.strip.map((k) => h('div', { class: 'strip__frame' }, viewable(frame(k, { sizes: '320px' }), 'strip', k, ''))));
    root.append(h('div', { class: 'strip' },
      h('div', { class: 'strip__head' }, h('h3', { 'data-reveal': '' }, g.stripTitle), h('span', { 'aria-hidden': 'true' }, 'Drag →')),
      h('div', { class: 'strip__film' }, track)));
    dragScroll(track);
  }

  function dragScroll(el) {
    let down = false, x0 = 0, s0 = 0, moved = false;
    el.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; x0 = e.clientX; s0 = el.scrollLeft; });
    window.addEventListener('pointermove', (e) => {
      if (!down) return; const dx = e.clientX - x0;
      if (Math.abs(dx) > 5) { moved = true; el.classList.add('is-dragging'); }
      el.scrollLeft = s0 - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return; down = false;
      if (moved) { $$('.ph--view', el).forEach((n) => (n.dataset.dragged = '1')); setTimeout(() => $$('.ph--view', el).forEach((n) => (n.dataset.dragged = '')), 50); }
      el.classList.remove('is-dragging');
    });
  }

  function renderTraits() {
    const t = C.traits, root = $('#traits');
    root.append(head(t.eyebrow, t.title, 'traits-title'));
    const stack = h('div', { class: 'traits__stack' });
    const counter = h('p', { class: 'traits__counter', 'aria-hidden': 'true' }, '');
    t.items.forEach((it, i) => { const im = img(it.photo, { sizes: '45vw' }); im.alt = ''; if (i === 0) im.classList.add('on'); stack.append(im); });
    stack.append(counter);
    const list = h('div', { class: 'traits__list' }, t.items.map((it, i) =>
      h('article', { class: 'trait', dataset: { i } },
        h('p', { class: 'trait__num', 'aria-hidden': 'true', 'data-reveal': '' }, String(i + 1).padStart(2, '0')),
        h('p', { class: 'trait__theme', 'data-reveal': '' }, it.theme),
        h('h3', { class: 'trait__title', 'data-reveal': '', style: { '--d': '.1s' } }, it.title),
        h('p', { class: 'trait__text', 'data-reveal': '', style: { '--d': '.2s' } }, it.body),
        h('div', { class: 'ph trait__ph', 'data-reveal': 'mask' }, img(it.photo, { sizes: '240px' })))));
    root.append(h('div', { class: 'traits__body' }, h('div', { class: 'traits__figure', 'aria-hidden': 'true' }, stack), list));

    const imgs = $$('img', stack), items = $$('.trait', list);
    counter.textContent = `01 / ${String(items.length).padStart(2, '0')}`;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = +e.target.dataset.i;
      items.forEach((n) => n.classList.toggle('on', n === e.target));
      imgs.forEach((im, j) => im.classList.toggle('on', j === i));
      counter.textContent = `${String(i + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    }), { rootMargin: '-45% 0px -45% 0px' });
    items.forEach((n) => io.observe(n));
    items[0].classList.add('on');
  }

  function renderTimeline() {
    const t = C.timeline, root = $('#timeline');
    root.append(head(t.eyebrow, t.title, 'timeline-title', t.intro, true));
    const list = h('ol', { class: 'timeline__list' }, t.entries.map((e, i) =>
      h('li', { class: 'tl' },
        h('p', { class: 'tl__date' }, e.date || ''),
        viewable(h('figure', { class: 'ph' }, img(e.photo, { sizes: '(min-width:900px) 24vw, 90vw' })), 'timeline', e.photo, [e.date, e.caption].filter(Boolean).join(' — ')),
        h('p', { class: 'tl__cap' }, e.caption),
        e.note ? h('p', { class: 'tl__note' }, e.note) : null)));
    const scroller = h('div', { class: 'timeline__scroller' }, h('div', { class: 'timeline__pin' }, list));
    root.append(scroller);

    const mq = window.matchMedia('(min-width: 900px)');
    const layout = () => {
      if (mq.matches) { list.style.width = 'max-content'; scroller.style.height = `${list.offsetWidth - innerWidth + innerHeight}px`; }
      else { list.style.width = ''; scroller.style.height = ''; list.style.transform = ''; }
      update();
    };
    const update = () => {
      if (!mq.matches) return;
      const r = scroller.getBoundingClientRect();
      const p = clamp(-r.top / (scroller.offsetHeight - innerHeight));
      list.style.transform = `translate3d(${-p * (list.offsetWidth - innerWidth)}px,0,0)`;
    };
    onScroll.push(update);
    window.addEventListener('resize', layout);
    mq.addEventListener('change', layout);
    requestAnimationFrame(layout);
    $$('.tl', list).forEach((n) => { if (!mq.matches) { n.setAttribute('data-reveal', ''); } });
  }

  function renderReveal() {
    const r = C.reveal, root = $('#reveal');
    root.append(head(r.eyebrow, r.title, 'reveal-title'));
    const star = () => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'reveal__star'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = '<path d="M12 1.5l2.4 8.1 8.1 2.4-8.1 2.4L12 22.5l-2.4-8.1L1.5 12l8.1-2.4z" fill="currentColor"/>'; return s; };
    root.append(h('div', { class: 'reveal__grid' }, r.cards.map((c, i) => {
      const card = h('button', { class: 'reveal__card', type: 'button', 'aria-pressed': 'false', 'aria-label': `${c.label}. Reveal photo.`, 'data-reveal': '', style: { '--d': `${i * .12}s` } },
        h('span', { class: 'reveal__inner' },
          h('span', { class: 'reveal__face reveal__front', 'aria-hidden': 'true' },
            h('span', { class: 'reveal__num' }, String(i + 1).padStart(2, '0')), star(), h('span', { class: 'reveal__label' }, c.label)),
          h('span', { class: 'reveal__face reveal__back' }, img(c.photo, { sizes: '(min-width:900px) 25vw, 50vw' }), c.caption ? h('span', {}, c.caption) : null)));
      card.addEventListener('click', () => {
        const on = card.getAttribute('aria-pressed') === 'true';
        card.setAttribute('aria-pressed', String(!on));
        card.setAttribute('aria-label', on ? `${c.label}. Reveal photo.` : `${C.photos[c.photo]?.alt}. ${c.caption}. Tap to turn back.`);
      });
      return card;
    })));
  }

  function renderConstellation() {
    const k = C.constellation, root = $('#constellation');
    root.append(head(k.eyebrow, k.title, 'constellation-title', null, true));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    const canvas = h('canvas', { 'aria-hidden': 'true' });
    const sky = h('div', { class: 'sky' }, canvas, svg);
    const msg = h('p', {}, k.hint);
    const count = h('p', { class: 'wish__count' }, `0 of ${k.wishes.length} wishes`);
    let last = null, found = 0;
    k.wishes.forEach((w, i) => {
      const b = h('button', { class: 'star', type: 'button', 'aria-label': `Wish ${i + 1} of ${k.wishes.length}`, style: { left: `${w.x}%`, top: `${w.y}%`, '--dl': `${(i * .37) % 3}s` } }, h('i'));
      b.addEventListener('click', () => {
        $$('.star', sky).forEach((s) => s.classList.remove('current'));
        b.classList.add('current');
        if (!b.classList.contains('lit')) {
          b.classList.add('lit'); found++;
          if (last) {
            const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            ln.setAttribute('x1', last.x); ln.setAttribute('y1', last.y); ln.setAttribute('x2', w.x); ln.setAttribute('y2', w.y);
            svg.append(ln);
          }
          last = w;
          count.textContent = found === k.wishes.length ? k.done : `${found} of ${k.wishes.length} wishes`;
        }
        msg.classList.add('out');
        setTimeout(() => { msg.textContent = w.text; msg.classList.remove('out'); }, reduced ? 0 : 450);
      });
      sky.append(b);
    });
    root.append(sky, h('div', { class: 'wish', 'aria-live': 'polite' }, msg), count);
    new Sky(canvas, { density: .00035, max: 380 });
  }

  function renderCake() {
    const k = C.cake, root = $('#cake');
    root.append(head(k.eyebrow, k.title, 'cake-title', null, true));
    const stage = h('div', { class: 'cake__stage' });
    stage.innerHTML = `
<svg viewBox="0 0 400 380" aria-hidden="true">
  <defs>
    <linearGradient id="tier" x1="0" x2="1"><stop offset="0" stop-color="#e9dfcc"/><stop offset=".35" stop-color="#fbf6ec"/><stop offset=".7" stop-color="#f4ecdd"/><stop offset="1" stop-color="#d9ccb3"/></linearGradient>
    <linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf7"/><stop offset="1" stop-color="#efe6d4"/></linearGradient>
    <linearGradient id="plate" x1="0" x2="1"><stop offset="0" stop-color="#9c8457"/><stop offset=".5" stop-color="#e3cd9c"/><stop offset="1" stop-color="#8c7448"/></linearGradient>
    <radialGradient id="shadow"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="200" cy="364" rx="190" ry="14" fill="url(#shadow)"/>
  <ellipse cx="200" cy="352" rx="176" ry="17" fill="url(#plate)"/>
  <ellipse cx="200" cy="349" rx="168" ry="13" fill="#d8c191" opacity=".6"/>
  <!-- bottom tier -->
  <path d="M68 222 V340 A132 15 0 0 0 332 340 V222 Z" fill="url(#tier)"/>
  <ellipse cx="200" cy="222" rx="132" ry="15" fill="url(#top)"/>
  <path d="M68 326 A132 15 0 0 0 332 326" fill="none" stroke="#c9a968" stroke-width="1.6"/>
  <path d="M68 332 A132 15 0 0 0 332 332" fill="none" stroke="#c9a968" stroke-width=".6" opacity=".7"/>
  <!-- pressed sprig -->
  <g fill="none" stroke="#a87c80" stroke-width="1.1" stroke-linecap="round" opacity=".85">
    <path d="M118 318 C124 296 136 280 156 266"/>
    <path d="M128 296 C122 290 120 284 121 278 M128 296 C134 292 140 292 144 294 M140 278 C136 272 136 266 138 262 M140 278 C146 276 151 278 154 281"/>
  </g>
  <g fill="#b9b2d8"><circle cx="157" cy="265" r="2.6"/><circle cx="121" cy="276" r="2"/><circle cx="138" cy="261" r="1.8"/></g>
  <g fill="#c99a9a"><circle cx="146" cy="294" r="2.1"/><circle cx="155" cy="281" r="1.6"/></g>
  <!-- top tier -->
  <path d="M116 124 V214 A84 10 0 0 0 284 214 V124 Z" fill="url(#tier)"/>
  <ellipse cx="200" cy="124" rx="84" ry="10" fill="url(#top)"/>
  <path d="M116 204 A84 10 0 0 0 284 204" fill="none" stroke="#c9a968" stroke-width="1.4"/>
  <path d="M256 190 c4-10 10-16 18-19" fill="none" stroke="#a87c80" stroke-width="1" stroke-linecap="round"/>
  <circle cx="274" cy="170" r="2" fill="#b9b2d8"/><circle cx="262" cy="178" r="1.5" fill="#c99a9a"/>
</svg>`;
    const n = Math.max(1, k.candles | 0), candles = [];
    for (let i = 0; i < n; i++) {
      const x = n === 1 ? 200 : 146 + i * (108 / (n - 1));
      const c = h('button', { class: 'candle', type: 'button', 'aria-label': `Blow out candle ${i + 1}`, style: { left: `${x / 4}%`, '--dl': `${(i * .43) % 2}s` } },
        h('span', { class: 'candle__body' }), h('span', { class: 'flame', 'aria-hidden': 'true' }));
      c.insertAdjacentHTML('beforeend', '<svg class="smoke" viewBox="0 0 30 70" aria-hidden="true"><path d="M15 68 C8 56 22 48 14 36 C7 26 21 18 15 4"/></svg>');
      c.addEventListener('click', () => {
        if (c.classList.contains('out')) return;
        c.classList.add('out'); c.setAttribute('aria-label', `Candle ${i + 1} is out`); c.disabled = true;
        update();
      });
      candles.push(c); stage.append(c);
    }
    const done = h('div', { class: 'cake__done', 'aria-live': 'polite' }, h('p', {}, ''), h('button', { type: 'button' }, 'Light them again'));
    const update = () => {
      const lit = candles.filter((c) => !c.classList.contains('out')).length;
      root.style.setProperty('--glow', Math.max(.12, lit / n).toFixed(2));
      if (lit === 0) { root.classList.add('is-done'); $('p', done).textContent = k.done; }
    };
    $('button', done).addEventListener('click', () => {
      root.classList.remove('is-done'); $('p', done).textContent = '';
      candles.forEach((c, i) => { c.classList.remove('out'); c.disabled = false; c.setAttribute('aria-label', `Blow out candle ${i + 1}`); });
      update(); candles[0].focus();
    });
    root.append(stage, h('p', { class: 'cake__hint' }, k.hint), done);
  }

  function renderLetter() {
    const L = C.letter, root = $('#letter');
    const env = h('button', { class: 'envelope', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'letter-paper', 'aria-label': `A letter for ${C.name}. Open it.` },
      h('span', { class: 'env__back' }), h('span', { class: 'env__card' }, h('span', {}, C.name)),
      h('span', { class: 'env__front' }), h('span', { class: 'env__flap' }), h('span', { class: 'env__seal', 'aria-hidden': 'true' }, C.name[0]));
    const stage = h('div', { class: 'letter__stage' },
      h('p', { class: 'eyebrow', 'data-reveal': '' }, L.eyebrow),
      h('div', { 'data-reveal': '', style: { '--d': '.15s' } }, env),
      h('p', { class: 'letter__hint' }, L.envelopeHint));

    const words = (text) => { let i = 0; return text.split(/(\s+)/).map((w) => /^\s+$/.test(w) ? w : h('span', { class: 'w', style: { '--i': i++ } }, w)); };
    const paper = h('article', { class: 'letter__paper', id: 'letter-paper', tabindex: '-1', 'aria-label': `Letter to ${C.name}` },
      h('p', { class: 'letter__greet writing' }, L.greeting),
      L.paragraphs.map((p) => h('p', { class: 'letter__p writing' }, words(p))),
      h('p', { class: 'letter__sign writing' }, L.signoff));
    const wrap = h('div', { class: 'letter__wrap' }, paper);
    root.append(stage, wrap);

    env.addEventListener('click', () => {
      if (env.classList.contains('is-open')) return;
      env.classList.add('is-open'); stage.classList.add('is-open');
      env.setAttribute('aria-expanded', 'true'); env.setAttribute('aria-label', 'The letter is open');
      setTimeout(() => {
        wrap.classList.add('is-shown');
        const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
        $$('.writing', paper).forEach((n) => io.observe(n));
        paper.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        paper.focus({ preventScroll: true });
      }, reduced ? 100 : 1900);
    });
  }

  function renderFinale() {
    const f = C.finale, root = $('#finale');
    const [l1, l2] = f.lines;
    const at = (l2 || '').lastIndexOf(C.name);
    const l2node = at >= 0 ? [l2.slice(0, at), h('em', {}, C.name), l2.slice(at + C.name.length)] : [l2];
    root.append(h('div', { class: 'ph' }, img(f.photo)),
      h('div', { class: 'finale__text' }, h('p', { class: 'finale__l1' }, l1), h('h2', { class: 'finale__l2' }, ...l2node)));
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { root.classList.add('in'); o.disconnect(); } }, { threshold: .45 }).observe(root);

    const canvas = h('canvas', { 'aria-hidden': 'true' });
    const top = h('button', { class: 'nightfall__top', type: 'button' }, '↑ Back to the beginning');
    top.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); $('.hero__title').focus({ preventScroll: true }); });
    $('#nightfall').append(canvas, h('div', { class: 'nightfall__text' },
      h('p', { class: 'nightfall__made', 'data-reveal': '' }, f.madeWith),
      h('p', { class: 'nightfall__date', 'data-reveal': '', style: { '--d': '.3s' } }, C.birthday),
      top));
    new Sky(canvas, { density: .0004, max: 500, shooting: true });
  }

  /* ==========================================================================
     VIEWER
     ========================================================================== */
  const viewer = $('#viewer'), vImg = $('.viewer__img', viewer), vCap = $('.viewer__caption', viewer), vCount = $('.viewer__count', viewer);
  let vGroup = [], vIdx = 0;
  function showView(i) {
    vIdx = (i + vGroup.length) % vGroup.length;
    const it = vGroup[vIdx], p = C.photos[it.key];
    vImg.classList.remove('swap'); void vImg.offsetWidth; vImg.classList.add('swap');
    vImg.src = photoSrc(it.key, 'sm');
    const big = new Image(); big.onload = () => { if (vGroup[vIdx] === it) vImg.src = big.src; }; big.src = photoSrc(it.key, 'lg');
    vImg.alt = p.alt || ''; vImg.width = p.w; vImg.height = p.h;
    vCap.textContent = it.caption || '';
    vCount.textContent = `${vIdx + 1} / ${vGroup.length}`;
  }
  function openViewer(group, i) {
    vGroup = groups[group]; viewer.classList.toggle('single', vGroup.length < 2);
    showView(i);
    viewer.showModal(); document.body.style.overflow = 'hidden';
  }
  viewer.addEventListener('close', () => { document.body.style.overflow = ''; });
  $('.viewer__close', viewer).addEventListener('click', () => viewer.close());
  $('.viewer__prev', viewer).addEventListener('click', () => showView(vIdx - 1));
  $('.viewer__next', viewer).addEventListener('click', () => showView(vIdx + 1));
  viewer.addEventListener('click', (e) => { if (e.target === viewer || e.target.classList.contains('viewer__figure')) viewer.close(); });
  viewer.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') showView(vIdx - 1); if (e.key === 'ArrowRight') showView(vIdx + 1); });
  let sx = null;
  viewer.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  viewer.addEventListener('pointerup', (e) => { if (sx == null || vGroup.length < 2) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) showView(vIdx + (dx < 0 ? 1 : -1)); });

  /* ==========================================================================
     MUSIC (optional, never autoplays)
     ========================================================================== */
  function setupMusic() {
    const m = C.music; if (!m || !m.enabled || !m.src) return;
    const btn = $('.music'); btn.hidden = false; let audio;
    btn.addEventListener('click', () => {
      if (!audio) { audio = new Audio(m.src); audio.loop = true; audio.volume = m.volume ?? .5; }
      const play = audio.paused;
      play ? audio.play().catch(() => {}) : audio.pause();
      btn.setAttribute('aria-pressed', String(play));
      btn.setAttribute('aria-label', play ? 'Pause music' : `Play music${m.title ? `: ${m.title}` : ''}`);
    });
  }

  /* ==========================================================================
     SCROLL: reveal, parallax, progress
     ========================================================================== */
  const onScroll = [];
  function setupScroll() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('[data-reveal]').forEach((n) => io.observe(n));

    const par = reduced ? [] : $$('[data-parallax]');
    const bar = $('.progress span');
    let ticking = false;
    const run = () => {
      ticking = false;
      const vh = innerHeight;
      for (const el of par) {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -vh * .2 || r.top > vh * 1.2) continue;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = `translate3d(0,${(-p * +el.dataset.parallax * vh).toFixed(1)}px,0)`;
      }
      const max = document.documentElement.scrollHeight - vh;
      bar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max) : 0})`;
      onScroll.forEach((fn) => fn());
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    run();
  }

  /* ---------- go ---------- */
  document.title = C.title;
  renderHero(); renderGallery(); renderTraits(); renderTimeline(); renderReveal();
  renderConstellation(); renderCake(); renderLetter(); renderFinale();
  setupMusic(); setupScroll(); setupIntro();
})();
