function toggleMenu(b){const m=document.getElementById('menu');const o=m.classList.toggle('open');b.setAttribute('aria-expanded',o)}
function toggleLang(){
  const zh=document.documentElement.lang!=='zh';
  document.documentElement.lang=zh?'zh':'en';
  document.querySelectorAll('[data-en]').forEach(el=>{const t=zh?el.dataset.zh:el.dataset.en;if(t!=null)el.textContent=t});
  document.querySelectorAll('[data-en-alt]').forEach(el=>{el.alt=zh?el.dataset.zhAlt:el.dataset.enAlt});
  try{localStorage.setItem('lang',document.documentElement.lang)}catch(e){}
}
(function(){try{if(localStorage.getItem('lang')==='zh')toggleLang()}catch(e){}})();
