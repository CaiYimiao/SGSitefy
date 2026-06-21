function toggleLang(){
  var html=document.documentElement;
  var to=html.lang==='en'?'zh':'en';
  html.lang=to;
  document.querySelectorAll('[data-en]').forEach(function(el){
    var v=el.getAttribute('data-'+to); if(v===null)return;
    if(el.hasAttribute('data-rich')){el.innerHTML=v;}else{el.textContent=v;}
  });
  document.querySelectorAll('[data-en-alt]').forEach(function(el){
    var v=el.getAttribute('data-'+to+'-alt'); if(v)el.alt=v;
  });
  document.querySelectorAll('.lang').forEach(function(b){b.textContent=to==='en'?'中文':'EN';});
}
function toggleMenu(){var m=document.getElementById('menu');if(m)m.classList.toggle('open');}
