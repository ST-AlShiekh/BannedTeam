/* ═══ Scary Town — Bans System ═══ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── Smooth scroll ── */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (href === '#') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      var t = $(href);
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  /* ── Reveal ── */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -30px 0px' });
  $$('.reveal').forEach(function (el) { io.observe(el); });

  /* ── Counters ── */
  $$('.counter').forEach(function (el) {
    var obs = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      obs.disconnect();
      var t = parseFloat(el.dataset.target), dur = 1800, s = performance.now();
      var ease = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
      (function step(n) {
        var p = Math.min((n - s) / dur, 1);
        el.textContent = Math.round(t * ease(p));
        if (p < 1) requestAnimationFrame(step);
      })(s);
    }, { threshold: .5 });
    obs.observe(el);
  });

  /* ── Nav + side panels ── */
  var nav = $('#topNav');
  var navLinks = $$('.nav-links a');
  var sections = $$('section[id]');
  var leftDots = $$('.side-panel.left .side-dot');
  var rightDots = $$('.side-panel.right .side-dot');
  var leftTrack = $('#leftTrack'), rightTrack = $('#rightTrack'), pctEl = $('#scrollPct');

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    var y = window.scrollY + window.innerHeight * .4;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var pct = Math.round(Math.min(window.scrollY / max, 1) * 100);
    var id = '', idx = 0;
    sections.forEach(function (s, i) { if (y >= s.offsetTop) { id = s.id; idx = i; } });
    navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + id); });
    if (leftTrack) leftTrack.style.height = pct + '%';
    if (rightTrack) rightTrack.style.height = pct + '%';
    if (pctEl) pctEl.textContent = String(pct).padStart(2, '0');
    leftDots.forEach(function (d, i) { d.classList.toggle('active', i === Math.min(idx, leftDots.length - 1)); });
    rightDots.forEach(function (d, i) { d.classList.toggle('active', i === Math.min(idx, rightDots.length - 1)); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Mobile menu ── */
  var toggle = $('#navToggle'), menu = $('#mobileMenu'), open = false;
  function setMenu(v) {
    open = v;
    toggle.classList.toggle('active', v);
    toggle.setAttribute('aria-expanded', v);
    menu.classList.toggle('open', v);
    document.body.classList.toggle('menu-open', v);
  }
  toggle.addEventListener('click', function () { setMenu(!open); });
  $$('.mobile-menu-link').forEach(function (l) { l.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 1100 && open) setMenu(false); });

  /* ── FAQ ── */
  var faqItems = $$('.faq-item'), faqAll = $('#faqToggleAll'), allOpen = false;
  $$('.faq-question').forEach(function (b) {
    b.addEventListener('click', function () { b.parentElement.classList.toggle('open'); syncFaq(); });
  });
  function syncFaq() {
    var n = $$('.faq-item.open').length;
    allOpen = n === faqItems.length;
    if (faqAll) faqAll.textContent = allOpen ? 'Collapse All' : 'Expand All';
  }
  if (faqAll) faqAll.addEventListener('click', function () {
    var target = !allOpen;
    faqItems.forEach(function (it, i) {
      setTimeout(function () { it.classList.toggle('open', target); syncFaq(); }, i * 120);
    });
  });

  /* ═══ جدول العقوبات: بحث + فلترة ═══ */
  var input = $('#smartSearch'), clearBtn = $('#clearSearch'), info = $('#searchInfo');
  var box = $('.search-box'), empty = $('#noResults');
  var rows = $$('.v-row'), heads = $$('.group-row'), chips = $$('.chip');
  var filter = 'all';

  /* تطبيع عربي: يتجاهل التشكيل والهمزات والتاء المربوطة */
  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ئ/g, 'ي')
      .replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/\s+/g, ' ').trim();
  }
  function lev1(a, b) { /* هل المسافة بين الكلمتين <= 1 */
    if (Math.abs(a.length - b.length) > 1) return false;
    var i = 0, j = 0, d = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++d > 1) return false;
      if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++; }
    }
    return d + (a.length - i) + (b.length - j) <= 1;
  }
  rows.forEach(function (r) {
    r._n = norm(r.dataset.search);
    r._w = r._n.split(' ').reduce(function (a, w) { a.push(w); if (w.indexOf('ال') === 0 && w.length > 4) a.push(w.slice(2)); return a; }, []);
    r._t = $$('.t', r).map(function (el) { return { el: el, orig: el.textContent }; });
  });
  heads.forEach(function (h) {
    h._rows = rows.filter(function (r) { return r.dataset.group === h.dataset.group; });
    h._cnt = $('.grp-count', h);
  });

  function tokenMatch(r, tok) {
    if (r._n.indexOf(tok) !== -1) return true;
    if (tok.length < 4) return false;
    return r._w.some(function (w) { return w.length >= 3 && lev1(tok, w); });
  }
  var amap = { 'ا': '[اأإآٱ]', 'ي': '[يىئ]', 'ه': '[هة]', 'و': '[وؤ]' };
  function rxFor(tok) {
    return Array.prototype.map.call(tok, function (c) {
      return (amap[c] || c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) + '[\\u064B-\\u065F\\u0670]*';
    }).join('');
  }
  function paint(r, toks) {
    var re = toks.length ? new RegExp('(' + toks.map(rxFor).join('|') + ')', 'gi') : null;
    r._t.forEach(function (o) {
      o.el.textContent = '';
      if (!re) { o.el.textContent = o.orig; return; }
      o.orig.split(re).forEach(function (part, i) {
        if (i % 2) { var m = document.createElement('mark'); m.textContent = part; o.el.appendChild(m); }
        else if (part) o.el.appendChild(document.createTextNode(part));
      });
    });
  }

  function run() {
    var q = norm(input.value), toks = q ? q.split(' ') : [];
    var shown = 0;
    box.classList.toggle('has-value', !!input.value);
    rows.forEach(function (r) {
      var ok = (filter === 'all' || r.dataset.tier === filter) && toks.every(function (t) { return tokenMatch(r, t); });
      r.style.display = ok ? '' : 'none';
      r._ok = ok;
      if (ok) shown++;
      paint(r, ok ? toks : []);
    });
    heads.forEach(function (h) {
      var n = h._rows.filter(function (r) { return r._ok; }).length;
      h.style.display = n ? '' : 'none';
      h._cnt.textContent = n; h._cnt.dataset.n = n;
    });
    info.innerHTML = (q || filter !== 'all') ? 'عدد النتائج: <b>' + shown + '</b>' : '';
    empty.classList.toggle('show', shown === 0);
  }

  input.addEventListener('input', run);
  clearBtn.addEventListener('click', function () { input.value = ''; run(); input.focus(); });
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      filter = c.dataset.filter;
      chips.forEach(function (x) { x.classList.toggle('active', x === c); });
      run();
    });
  });
  document.addEventListener('keydown', function (e) {
    var typing = /input|textarea/i.test((document.activeElement || {}).tagName || '');
    if (e.key === '/' && !typing) { e.preventDefault(); input.focus(); input.select(); }
    else if (e.key === 'Escape' && document.activeElement === input) { input.value = ''; run(); input.blur(); }
  });


  /* ═══ التعاميم الإدارية (نافذة) ═══ */
  (function () {
    var modal = $('#circModal'), openBtn = $('#circOpen'), countEl = $('#circCount');
    if (!modal || !openBtn) return;
    var items = $$('.circ-item', modal);
    items.forEach(function (it, i) {
      var n = $('.circ-num', it); if (n) n.textContent = String(i + 1).padStart(2, '0');
      it.style.transitionDelay = (0.08 + i * 0.07) + 's';
    });
    if (countEl) countEl.textContent = items.length;
    var last = null;
    function setModal(v) {
      modal.classList.toggle('open', v);
      modal.setAttribute('aria-hidden', !v);
      document.body.classList.toggle('modal-open', v);
      if (v) { last = document.activeElement; var c = $('.circ-close', modal); if (c) c.focus(); }
      else if (last) last.focus();
    }
    openBtn.addEventListener('click', function () { setModal(true); });
    $$('[data-close]', modal).forEach(function (el) { el.addEventListener('click', function () { setModal(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) setModal(false); });
  })();

  /* إحصائيات */
  var sTotal = $('#statTotal'); if (sTotal) sTotal.textContent = rows.length;
  run();
})();
