function toggleLang(){
  const zh = document.documentElement.lang !== "zh";
  document.documentElement.lang = zh ? "zh" : "en";
  document.querySelectorAll("[data-en]").forEach(el=>{
    const v = zh ? el.getAttribute("data-zh") : el.getAttribute("data-en");
    if(v==null) return;
    if(el.hasAttribute("data-rich")) el.innerHTML = v; else el.textContent = v;
  });
  document.querySelectorAll("[data-en-alt]").forEach(el=>{
    el.alt = zh ? el.getAttribute("data-zh-alt") : el.getAttribute("data-en-alt");
  });
  try{ localStorage.setItem("sitefy-lang", zh ? "zh" : "en"); }catch(e){}
}
function toggleNav(btn){
  const l=document.getElementById("navlinks");
  const o=l.classList.toggle("open");
  btn.setAttribute("aria-expanded",o);
}
document.addEventListener("DOMContentLoaded",()=>{
  try{ if(localStorage.getItem("sitefy-lang")==="zh") toggleLang(); }catch(e){}
});
