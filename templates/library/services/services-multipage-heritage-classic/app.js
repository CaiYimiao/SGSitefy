/* services-multipage-heritage-classic — shared shell behaviour */
(function () {
  var KEY = 'sfy-lang';
  function apply(lang) {
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh' : 'en');
    var a = lang === 'zh' ? 'data-zh' : 'data-en';
    document.querySelectorAll('[data-en]').forEach(function (el) {
      var v = el.getAttribute(a);
      if (v == null) return;
      if (el.hasAttribute('data-rich')) el.innerHTML = v; else el.textContent = v;
    });
    document.querySelectorAll('[data-en-ph]').forEach(function (el) {
      el.setAttribute('placeholder', el.getAttribute(lang === 'zh' ? 'data-zh-ph' : 'data-en-ph') || '');
    });
  }
  window.toggleLang = function () {
    var next = document.documentElement.getAttribute('lang') === 'zh' ? 'en' : 'zh';
    try { localStorage.setItem(KEY, next); } catch (e) {}
    apply(next);
  };
  window.toggleMenu = function () {
    var m = document.getElementById('menu');
    if (m) m.classList.toggle('open');
  };
  var saved;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === 'zh') apply('zh');
})();
