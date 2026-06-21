function toggleLang(){
  const zh=document.documentElement.lang!=='zh';
  document.documentElement.lang=zh?'zh':'en';
  document.querySelectorAll('[data-en]').forEach(el=>{const v=zh?el.dataset.zh:el.dataset.en;if(el.hasAttribute('data-rich'))el.innerHTML=v;else el.textContent=v;});
  document.querySelectorAll('[data-en-alt]').forEach(el=>el.alt=zh?el.dataset.zhAlt:el.dataset.enAlt);
  try{localStorage.setItem('sl_lang',zh?'zh':'en');}catch(e){}
}
function toggleMenu(b){const m=document.getElementById('menu');const o=m.classList.toggle('open');b.setAttribute('aria-expanded',o);}
(function(){
  try{if(localStorage.getItem('sl_lang')==='zh')toggleLang();}catch(e){}
})();
