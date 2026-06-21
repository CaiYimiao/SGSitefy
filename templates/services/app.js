/* SGSitefy — Professional Services template · shared behaviour */
var LANG = localStorage.getItem('ap-lang') || 'en';

function applyLang(l) {
  LANG = l;
  localStorage.setItem('ap-lang', l);
  document.querySelectorAll('[data-en]').forEach(function (n) {
    if (n.hasAttribute('data-rich')) return;
    n.textContent = (l === 'zh' && n.getAttribute('data-zh')) ? n.getAttribute('data-zh') : n.getAttribute('data-en');
  });
  // rich HTML nodes (e.g. hero h1 with inner spans)
  document.querySelectorAll('[data-rich]').forEach(function (n) {
    n.innerHTML = (l === 'zh' && n.getAttribute('data-zh')) ? n.getAttribute('data-zh') : n.getAttribute('data-en');
  });
  document.documentElement.lang = (l === 'zh') ? 'zh' : 'en';
  document.querySelectorAll('.lang').forEach(function (b) {
    b.textContent = (l === 'zh') ? 'EN' : '中文';
  });
}
function toggleLang() { applyLang(LANG === 'en' ? 'zh' : 'en'); }

document.addEventListener('DOMContentLoaded', function () {
  applyLang(LANG);

  // mobile burger
  var burger = document.querySelector('.burger'), nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () { nav.classList.toggle('open'); });
    document.addEventListener('click', function (e) {
      if (!burger.contains(e.target) && !nav.contains(e.target)) nav.classList.remove('open');
    });
  }

  // hero slider
  var hero = document.querySelector('.hero');
  if (hero) {
    var slides = [].slice.call(hero.querySelectorAll('.slide'));
    var dotsWrap = document.getElementById('dots');
    var i = 0, timer = null;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (dotsWrap) {
      slides.forEach(function (_, k) {
        var d = document.createElement('button');
        if (k === 0) d.className = 'on';
        d.setAttribute('aria-label', 'Slide ' + (k + 1));
        d.onclick = function () { go(k); rest(); };
        dotsWrap.appendChild(d);
      });
    }
    var dots = dotsWrap ? [].slice.call(dotsWrap.children) : [];
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    }
    function rest() {
      clearInterval(timer);
      if (!reduce) timer = setInterval(function () { go(i + 1); }, 5500);
    }
    rest();
    hero.addEventListener('mouseenter', function () { clearInterval(timer); });
    hero.addEventListener('mouseleave', rest);
  }

  // scroll-reveal via IntersectionObserver
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // back-to-top
  var top = document.getElementById('toTop');
  if (top) {
    window.addEventListener('scroll', function () {
      top.classList.toggle('show', window.scrollY > 500);
    }, { passive: true });
  }

  // animated counters in stats strip
  var counted = false;
  function runCounters() {
    if (counted) return;
    document.querySelectorAll('.strip .n[data-target]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target'));
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals')) : 0;
      var start = 0, dur = 1600, step = 16;
      var inc = target / (dur / step);
      var t = setInterval(function () {
        start = Math.min(start + inc, target);
        el.textContent = prefix + start.toFixed(decimals) + suffix;
        if (start >= target) clearInterval(t);
      }, step);
    });
    counted = true;
  }
  var strip = document.querySelector('.strip');
  if (strip && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { runCounters(); so.disconnect(); }
    }, { threshold: .3 });
    so.observe(strip);
  }
});
