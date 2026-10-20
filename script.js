  /* rAF-throttled scroll/resize dispatcher (shared by all scroll handlers) */
  var scrollFns = [], scrollQueued = false;
  function onScroll(fn) { scrollFns.push(fn); }
  function runScroll() { scrollQueued = false; for (var i = 0; i < scrollFns.length; i++) scrollFns[i](); }
  addEventListener('scroll', function () { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(runScroll); } }, { passive: true });
  addEventListener('resize', function () { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(runScroll); } }, { passive: true });

  /* stop all ambient CSS motion while the tab is not visible */
  document.addEventListener('visibilitychange', function () {
    document.documentElement.classList.toggle('pause-anim', document.hidden);
  });

  /* pause the marquee when it scrolls out of view */
  (function () {
    var marquee = document.querySelector('.marquee');
    var track = marquee && marquee.querySelector('.track');
    if (!track || !window.IntersectionObserver) return;
    new IntersectionObserver(function (e) {
      track.style.animationPlayState = e[0].isIntersecting ? 'running' : 'paused';
    }, { threshold: 0 }).observe(marquee);
  })();

  const header = document.getElementById('header');
  onScroll(function () { header.classList.toggle('scrolled', scrollY > 20); });

  const burger = document.getElementById('burger');
  const mobile = document.getElementById('mobile');
  burger.addEventListener('click', () => mobile.classList.toggle('open'));
  mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobile.classList.remove('open')));

  /* content streaming: create on enter, destroy on leave */
  (function () {
    if (!window.IntersectionObserver) return;
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-stream]'));
    if (!items.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { items.forEach(function (el) { el.classList.add('cs-in'); }); return; }

    var seq = {};
    function group(el) { var n = el.parentElement; while (n && n.nodeType === 1) { if (n.id) return n.id; n = n.parentElement; } return 'page'; }
    function order(el) { var g = group(el); if (!(g in seq)) seq[g] = 0; return seq[g]++; }
    function reveal(el) { el.classList.remove('cs-hide'); el.classList.add('cs-in'); }
    function hide(el) { el.classList.remove('cs-in'); el.classList.add('cs-hide'); }

    items.forEach(function (el) { el.classList.add('cs-item'); el.style.setProperty('--d', order(el) * 70 + 'ms'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) reveal(e.target); else hide(e.target); });
    }, { threshold: 0, rootMargin: '0px' });

    var vh = window.innerHeight;
    items.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) reveal(el); else hide(el);
      io.observe(el);
    });
  })();

  /* testimonial deck slideshow */
  (function () {
    var quotes = Array.prototype.slice.call(document.querySelectorAll('#reviews .quote'));
    if (!quotes.length) return;
    var dots = document.getElementById('reviewDots');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cur = 0, timer = null;

    var hover = window.matchMedia && window.matchMedia('(hover:hover)').matches;
    quotes.forEach(function (q, i) {
      q.setAttribute('tabindex', '0');
      q.setAttribute('role', 'button');
      q.setAttribute('aria-label', 'Testimonial ' + (i + 1) + ' of ' + quotes.length);
      q.addEventListener('click', function () { go(i); restart(); });
      q.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(i); restart(); } });
      if (hover) q.addEventListener('mouseenter', function () { go(i); });
      if (dots) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
        b.addEventListener('click', function () { go(i); restart(); });
        dots.appendChild(b);
      }
    });

    function go(i) {
      cur = (i + quotes.length) % quotes.length;
      quotes.forEach(function (q, k) {
        q.classList.toggle('is-active', k === cur);
        if (dots && dots.children[k]) dots.children[k].classList.toggle('on', k === cur);
      });
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    function start() { if (reduce) return; stop(); timer = setInterval(function () { go(cur + 1); }, 5000); }
    function restart() { start(); }

    go(0); start();
    var box = document.getElementById('reviews');
    if (box) { box.addEventListener('mouseenter', stop); box.addEventListener('mouseleave', start); }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  })();

  /* nav active tint on scroll */
  (function () {
    var ids = ['features', 'about', 'creators', 'contact'];
    var secs = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"], .mobile a[href^="#"]'));
    if (!secs.length || !links.length) return;
    function update() {
      var curId = '';
      secs.forEach(function (s) { if (s.getBoundingClientRect().top <= 140) curId = s.id; });
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) curId = 'contact';
      links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + curId); });
    }
    onScroll(update);
    update();
  })();

  const track = document.getElementById('track');
  track.innerHTML += track.innerHTML;

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- theme toggle ---------- */
  (function () {
    var THEME_BG = { kupp: '#08080d', light: '#f5f5fa', dark: '#0b0c0f', alte: '#f7feff', gold: '#050506' };
    var btn = document.getElementById('themeBtn');
    var menu = document.getElementById('themeMenu');
    if (!btn || !menu) return;
    var meta = document.querySelector('meta[name="theme-color"]');

    function apply(t) {
      if (!THEME_BG[t]) t = 'kupp';
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem('kupp-theme', t); } catch (e) {}
      if (meta) meta.setAttribute('content', THEME_BG[t]);
      menu.querySelectorAll('.theme-opt').forEach(function (o) {
        o.classList.toggle('active', o.dataset.theme === t);
        o.setAttribute('aria-checked', o.dataset.theme === t ? 'true' : 'false');
      });
    }
    function close() { menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }

    var saved = 'kupp';
    try { saved = localStorage.getItem('kupp-theme') || 'kupp'; } catch (e) {}
    apply(saved);

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) {
      var opt = e.target.closest('.theme-opt');
      if (!opt) return;
      apply(opt.dataset.theme);
      close();
    });
    document.addEventListener('click', function (e) { if (!menu.contains(e.target) && e.target !== btn) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  })();
