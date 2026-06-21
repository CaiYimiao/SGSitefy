/* SGSitefy wellness template — shared behaviour across pages */
var LANG = localStorage.getItem('sw-lang') || 'en';

function applyLang(l) {
  LANG = l;
  localStorage.setItem('sw-lang', l);
  document.querySelectorAll('[data-en]').forEach(function (n) {
    if (n.hasAttribute('data-rich')) return;
    n.textContent = (l === 'zh' && n.getAttribute('data-zh')) ? n.getAttribute('data-zh') : n.getAttribute('data-en');
  });
  document.querySelectorAll('[data-rich]').forEach(function (h) {
    h.innerHTML = (l === 'zh' && h.getAttribute('data-zh')) ? h.getAttribute('data-zh') : h.getAttribute('data-en');
  });
  document.documentElement.lang = (l === 'zh') ? 'zh' : 'en';
  document.querySelectorAll('.lang').forEach(function (b) { b.textContent = (l === 'zh') ? 'EN' : '中文'; });
}
function toggleLang() { applyLang(LANG === 'en' ? 'zh' : 'en'); }

document.addEventListener('DOMContentLoaded', function () {
  applyLang(LANG);

  /* burger */
  var burger = document.querySelector('.burger'), nav = document.getElementById('nav');
  if (burger && nav) burger.addEventListener('click', function () { nav.classList.toggle('open'); });

  /* hero slider */
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
    function rest() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(i + 1); }, 5500); }
    rest();
    hero.addEventListener('mouseenter', function () { clearInterval(timer); });
    hero.addEventListener('mouseleave', rest);
  }

  /* scroll reveal */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .10 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* back to top */
  var top = document.getElementById('toTop');
  if (top) window.addEventListener('scroll', function () { top.classList.toggle('show', window.scrollY > 500); }, { passive: true });
});
