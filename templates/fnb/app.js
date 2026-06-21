/* ============================================================
   Tiong Bahru Bakehouse — shared JS · SGSitefy F&B template
   ============================================================ */
var LANG = localStorage.getItem('tbb-lang') || 'en';

/* ── Language toggle ── */
function applyLang(l) {
  LANG = l;
  localStorage.setItem('tbb-lang', l);
  document.querySelectorAll('[data-en]').forEach(function (n) {
    if (n.hasAttribute('data-rich')) return;
    n.textContent = (l === 'zh' && n.getAttribute('data-zh'))
      ? n.getAttribute('data-zh')
      : n.getAttribute('data-en');
  });
  /* rich-html nodes (hero h1 etc.) */
  document.querySelectorAll('[data-rich]').forEach(function (h) {
    h.innerHTML = (l === 'zh' && h.getAttribute('data-zh'))
      ? h.getAttribute('data-zh')
      : h.getAttribute('data-en');
  });
  document.documentElement.lang = (l === 'zh') ? 'zh' : 'en';
  document.querySelectorAll('.lang').forEach(function (b) {
    b.textContent = (l === 'zh') ? 'EN' : '中文';
  });
}
function toggleLang() { applyLang(LANG === 'en' ? 'zh' : 'en'); }

document.addEventListener('DOMContentLoaded', function () {
  applyLang(LANG);

  /* ── Burger / mobile nav ── */
  var burger = document.querySelector('.burger');
  var nav    = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () { nav.classList.toggle('open'); });
  }

  /* ── Hero slider ── */
  var hero = document.querySelector('.hero');
  if (hero) {
    var slides  = Array.prototype.slice.call(hero.querySelectorAll('.slide'));
    var dotsWrap = document.getElementById('dots');
    var cur = 0, timer = null;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (dotsWrap) {
      slides.forEach(function (_, k) {
        var d = document.createElement('button');
        d.setAttribute('aria-label', 'Slide ' + (k + 1));
        if (k === 0) d.className = 'on';
        d.onclick = function () { goSlide(k); resetTimer(); };
        dotsWrap.appendChild(d);
      });
    }
    var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.children) : [];

    function goSlide(n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === cur); });
      dots.forEach(function (d, k)   { d.classList.toggle('on', k === cur); });
    }
    function resetTimer() {
      clearInterval(timer);
      if (!reduce) timer = setInterval(function () { goSlide(cur + 1); }, 5000);
    }
    resetTimer();
    hero.addEventListener('mouseenter', function () { clearInterval(timer); });
    hero.addEventListener('mouseleave', resetTimer);
  }

  /* ── Scroll reveal ── */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.10 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ── Back-to-top ── */
  var topBtn = document.getElementById('toTop');
  if (topBtn) {
    window.addEventListener('scroll', function () {
      topBtn.classList.toggle('show', window.scrollY > 480);
    }, { passive: true });
  }

  /* ── Menu tab switcher (menu.html only) ── */
  var tabBtns = document.querySelectorAll('.tab-btn');
  if (tabBtns.length) {
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-tab');
        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        document.querySelectorAll('.menu-section').forEach(function (sec) {
          sec.classList.toggle('show', sec.id === target);
        });
      });
    });
    /* activate first tab */
    if (tabBtns[0]) tabBtns[0].click();
  }
});
