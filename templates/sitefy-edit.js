/* ============================================================================
 * SitefyAI inline page editor — drop-in for any generated SGSitefy page.
 * Usage: add  <script src="../sitefy-edit.js"></script>  before </body>
 * on EVERY page of the template (index + about, services, contact, etc.) so
 * the Edit button is available throughout the multi-page site.
 *
 * Gives the site owner direct, in-place editing of their published page:
 *   • Text     — click any heading / paragraph / list item and type.
 *   • Images   — a "🖼 Replace" badge on every photo (works even when the
 *                image sits behind a text overlay, and for CSS backgrounds).
 *   • Sections — hide / show whole sections.
 * Changes persist in localStorage (keyed per page) and restore on load.
 * In production these diffs are what the SitefyAI editor agent turns into a
 * SiteSpec patch via Antigravity — here they persist client-side for the demo.
 * ========================================================================== */
(function () {
  "use strict";
  var KEY = "sitefy_edits::" + location.pathname;
  var editing = false;

  /* ---- TEXT targets -------------------------------------------------------- */
  var TEXT_SEL = "h1,h2,h3,h4,h5,p,li,figcaption,blockquote,.eyebrow,.lead,.kicker";
  function isEditableText(el) {
    if (!el.matches(TEXT_SEL)) return false;
    if (el.closest("nav,.nav,.burger,button,a.btn,.lang")) return false;
    if (el.querySelector(TEXT_SEL)) return false;
    return el.textContent.trim().length > 0;
  }
  function textNodes() {
    return Array.prototype.filter.call(document.querySelectorAll(TEXT_SEL), isEditableText);
  }
  function sections() { return Array.prototype.slice.call(document.querySelectorAll("section")); }

  /* ---- IMAGE targets ------------------------------------------------------- */
  /* <img> tags (skip logos/nav) */
  function imgEls() {
    return Array.prototype.filter.call(document.querySelectorAll("img"), function (im) {
      return !im.closest("nav,.nav") && !im.closest("header .brand,.brand");
    });
  }
  /* elements whose inline style carries a url() background (hero backgrounds etc.) */
  function bgEls() {
    return Array.prototype.filter.call(document.querySelectorAll('[style*="url("]'), function (el) {
      return !el.closest("nav,.nav");
    });
  }

  /* ---- persistence --------------------------------------------------------- */
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function save() {
    var data = { text: {}, hidden: [], img: {}, bg: {} };
    textNodes().forEach(function (el, i) { data.text[i] = el.innerHTML; });
    sections().forEach(function (s, i) { if (s.classList.contains("sfy-hidden")) data.hidden.push(i); });
    imgEls().forEach(function (im, i) { if (im.dataset.sfyEdited) data.img[i] = im.getAttribute("src"); });
    bgEls().forEach(function (el, i) { if (el.dataset.sfyEditedBg) data.bg[i] = el.style.backgroundImage; });
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { if (typeof toast === "function") toast("Edits are large — uploaded image may not be saved locally"); }
  }
  function restore() {
    var data = load(); if (!data) return;
    var tn = textNodes();
    if (data.text) Object.keys(data.text).forEach(function (i) { if (tn[i]) { tn[i].innerHTML = data.text[i]; syncLang(tn[i]); } });
    var sec = sections();
    (data.hidden || []).forEach(function (i) { if (sec[i]) sec[i].classList.add("sfy-hidden"); });
    var ims = imgEls();
    if (data.img) Object.keys(data.img).forEach(function (i) { if (ims[i]) { ims[i].setAttribute("src", data.img[i]); ims[i].dataset.sfyEdited = "1"; } });
    var bgs = bgEls();
    if (data.bg) Object.keys(data.bg).forEach(function (i) { if (bgs[i]) { bgs[i].style.backgroundImage = data.bg[i]; bgs[i].dataset.sfyEditedBg = "1"; } });
  }

  /* keep bilingual attribute in step with the edit, for the current language */
  function syncLang(el) {
    var lang = document.documentElement.getAttribute("lang") || "en";
    var attr = lang.indexOf("zh") === 0 ? "data-zh" : "data-en";
    if (el.hasAttribute(attr) || el.hasAttribute("data-en")) el.setAttribute(attr, el.innerHTML);
  }

  /* ---- styling ------------------------------------------------------------- */
  var css = document.createElement("style");
  css.textContent =
    ".sfy-fab{position:fixed;left:18px;bottom:18px;z-index:99998;display:flex;gap:8px;align-items:center}" +
    ".sfy-btn{font-family:inherit;font-weight:700;font-size:.82rem;border:none;border-radius:999px;padding:11px 18px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.22);display:inline-flex;align-items:center;gap:7px}" +
    ".sfy-btn-go{background:#4f46e5;color:#fff}.sfy-btn-go:hover{background:#3730a3}" +
    ".sfy-btn-ghost{background:#fff;color:#27272a;box-shadow:0 6px 18px rgba(0,0,0,.16)}.sfy-btn-ghost:hover{color:#4f46e5}" +
    ".sfy-editing [contenteditable=true]{outline:2px dashed rgba(79,70,229,.5);outline-offset:3px;border-radius:3px;cursor:text;transition:outline-color .15s}" +
    ".sfy-editing [contenteditable=true]:hover{outline-color:#4f46e5;background:rgba(79,70,229,.04)}" +
    ".sfy-editing [contenteditable=true]:focus{outline:2px solid #4f46e5;background:rgba(79,70,229,.06)}" +
    ".sfy-editing section{position:relative}.sfy-editing section:hover{box-shadow:inset 0 0 0 2px rgba(79,70,229,.25)}" +
    ".sfy-sec-ctl{position:absolute;top:8px;right:8px;z-index:60;background:#4f46e5;color:#fff;border:none;border-radius:7px;font-size:.7rem;font-weight:700;padding:5px 10px;cursor:pointer;opacity:0;transition:opacity .15s;box-shadow:0 4px 12px rgba(0,0,0,.2)}" +
    ".sfy-editing section:hover .sfy-sec-ctl{opacity:1}" +
    ".sfy-hidden{display:none!important}" +
    ".sfy-editing .sfy-hidden{display:block!important;opacity:.35;filter:grayscale(.6)}" +
    /* floating image-replace layer (always on top, even over hero overlays) */
    "#sfy-img-layer{position:fixed;inset:0;z-index:99996;pointer-events:none}" +
    ".sfy-img-badge{position:absolute;pointer-events:auto;background:rgba(79,70,229,.97);color:#fff;border:none;border-radius:7px;font-family:inherit;font-size:.72rem;font-weight:700;padding:6px 10px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35);display:inline-flex;align-items:center;gap:5px}" +
    ".sfy-img-badge:hover{background:#3730a3}" +
    ".sfy-toast{position:fixed;left:50%;bottom:74px;transform:translateX(-50%);background:#18181b;color:#fff;font-size:.8rem;font-weight:600;padding:9px 16px;border-radius:999px;z-index:99999;opacity:0;transition:opacity .2s;pointer-events:none}" +
    ".sfy-toast.show{opacity:1}" +
    /* image source picker modal */
    ".sfy-mback{position:fixed;inset:0;background:rgba(15,15,20,.55);backdrop-filter:blur(2px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".sfy-modal{background:#fff;color:#18181b;width:min(440px,100%);border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.4);overflow:hidden;font-family:inherit}" +
    ".sfy-modal-h{display:flex;align-items:center;gap:10px;padding:18px 20px 0}" +
    ".sfy-modal-h .ic{width:30px;height:30px;border-radius:8px;background:#eef2ff;display:grid;place-items:center;font-size:1rem}" +
    ".sfy-modal-h h3{margin:0;font-size:1.05rem;font-weight:800;flex:1}" +
    ".sfy-modal-h .x{background:none;border:none;font-size:1.1rem;color:#71717a;cursor:pointer;padding:4px;border-radius:6px}" +
    ".sfy-modal-h .x:hover{background:#f0f0f2;color:#18181b}" +
    ".sfy-modal-b{padding:16px 20px 20px}" +
    ".sfy-up{width:100%;border:2px dashed #c7cbe6;background:#f7f8ff;border-radius:12px;padding:20px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s;color:#3730a3;font-weight:700;font-size:.88rem}" +
    ".sfy-up:hover{border-color:#4f46e5;background:#eef2ff}" +
    ".sfy-up small{display:block;margin-top:4px;font-weight:400;color:#71717a;font-size:.74rem}" +
    ".sfy-or{display:flex;align-items:center;gap:10px;margin:16px 0;color:#a1a1aa;font-size:.74rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em}" +
    ".sfy-or::before,.sfy-or::after{content:'';flex:1;height:1px;background:#e4e4e7}" +
    ".sfy-url-row{display:flex;gap:8px}" +
    ".sfy-url-row input{flex:1;border:1.5px solid #e4e4e7;border-radius:9px;padding:10px 12px;font-family:inherit;font-size:.84rem;outline:none}" +
    ".sfy-url-row input:focus{border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.12)}" +
    ".sfy-url-row button{background:#4f46e5;color:#fff;border:none;border-radius:9px;padding:0 16px;font-family:inherit;font-weight:700;font-size:.82rem;cursor:pointer}" +
    ".sfy-url-row button:hover{background:#3730a3}" +
    ".sfy-prev{margin-top:14px;display:none;align-items:center;gap:10px;background:#f7f8ff;border-radius:10px;padding:8px}" +
    ".sfy-prev img{width:54px;height:54px;object-fit:cover;border-radius:7px;flex-shrink:0}" +
    ".sfy-prev .nm{font-size:.78rem;color:#3f3f4a;font-weight:600;word-break:break-all}";
  document.head.appendChild(css);

  function toast(msg) {
    var t = document.querySelector(".sfy-toast");
    if (!t) { t = document.createElement("div"); t.className = "sfy-toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 1700);
  }

  /* ---- section controls ---------------------------------------------------- */
  function addSectionControls() {
    sections().forEach(function (s) {
      if (s.querySelector(":scope > .sfy-sec-ctl")) return;
      var b = document.createElement("button");
      b.className = "sfy-sec-ctl"; b.type = "button";
      function lbl() { b.textContent = s.classList.contains("sfy-hidden") ? "＋ Show section" : "✕ Hide section"; }
      lbl();
      b.addEventListener("click", function (e) {
        e.stopPropagation(); e.preventDefault();
        s.classList.toggle("sfy-hidden"); lbl(); save();
      });
      s.appendChild(b);
    });
  }

  /* ---- image replace: single floating badge layer -------------------------- */
  /* Badges live in a fixed overlay so they always paint above the page —
     including hero images that sit behind a text-overlay card. */
  var imgLayer = null;
  var imgPairs = [];   /* { target, kind, badge } */

  function applyImage(target, kind, url) {
    if (kind === "img") { target.setAttribute("src", url); target.dataset.sfyEdited = "1"; }
    else { target.style.backgroundImage = 'url("' + url + '")'; target.dataset.sfyEditedBg = "1"; }
    save(); positionBadges(); toast("Image updated");
  }
  function makeBadge(target, kind) {
    var b = document.createElement("button");
    b.className = "sfy-img-badge"; b.type = "button"; b.innerHTML = "🖼 Replace";
    b.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      var cur = kind === "img"
        ? (target.getAttribute("src") || "")
        : (target.style.backgroundImage.replace(/^url\(["']?/, "").replace(/["']?\)$/, ""));
      openImagePicker(cur, function (url) { applyImage(target, kind, url); });
    });
    return b;
  }

  /* ---- image source picker (URL or upload from computer) ------------------- */
  function openImagePicker(current, onPick) {
    var back = document.createElement("div");
    back.className = "sfy-mback";
    back.innerHTML =
      '<div class="sfy-modal" role="dialog" aria-modal="true" aria-label="Replace image">' +
        '<div class="sfy-modal-h"><span class="ic">🖼</span><h3>Replace image</h3><button class="x" type="button" aria-label="Close">✕</button></div>' +
        '<div class="sfy-modal-b">' +
          '<button type="button" class="sfy-up">⬆ Upload from your computer<small>JPG, PNG, GIF or WebP — opens your files</small></button>' +
          '<input type="file" accept="image/*" hidden>' +
          '<div class="sfy-prev"><img alt=""><span class="nm"></span></div>' +
          '<div class="sfy-or">or paste a link</div>' +
          '<div class="sfy-url-row"><input type="url" placeholder="https://…" value=""><button type="button">Use URL</button></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(back);
    var fileInput = back.querySelector('input[type=file]');
    var urlInput = back.querySelector('.sfy-url-row input');
    var prev = back.querySelector('.sfy-prev');
    var prevImg = prev.querySelector('img');
    var prevNm = prev.querySelector('.nm');
    /* prefill URL field only if current is a real URL (not a data URI) */
    if (current && current.indexOf("data:") !== 0) urlInput.value = current;

    function close() { back.remove(); document.removeEventListener("keydown", onKey, true); }
    function onKey(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    document.addEventListener("keydown", onKey, true);
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
    back.querySelector(".x").addEventListener("click", close);

    back.querySelector(".sfy-up").addEventListener("click", function () { fileInput.click(); });
    fileInput.addEventListener("change", function () {
      var f = fileInput.files && fileInput.files[0];
      if (!f) return;
      if (f.size > 4 * 1024 * 1024) { toast("Image over 4 MB — try a smaller file"); }
      var rd = new FileReader();
      rd.onload = function () {
        prevImg.src = rd.result; prevNm.textContent = f.name; prev.style.display = "flex";
        onPick(rd.result); close();
      };
      rd.readAsDataURL(f);
    });
    function useUrl() {
      var u = (urlInput.value || "").trim();
      if (!u) { urlInput.focus(); return; }
      onPick(u); close();
    }
    back.querySelector(".sfy-url-row button").addEventListener("click", useUrl);
    urlInput.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); useUrl(); } });
  }
  function positionBadges() {
    var vh = window.innerHeight, vw = window.innerWidth;
    imgPairs.forEach(function (p) {
      var r = p.target.getBoundingClientRect();
      var offscreen = r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw || r.width < 8 || r.height < 8;
      if (offscreen) { p.badge.style.display = "none"; return; }
      p.badge.style.display = "";
      var top = Math.max(8, Math.min(r.top + 8, vh - 36));   /* keep visible on tall heroes */
      p.badge.style.left = Math.max(8, r.left + 8) + "px";
      p.badge.style.top = top + "px";
    });
  }
  function addImageControls() {
    imgLayer = document.createElement("div");
    imgLayer.id = "sfy-img-layer";
    document.body.appendChild(imgLayer);
    imgPairs = [];
    imgEls().forEach(function (im) { var b = makeBadge(im, "img"); imgLayer.appendChild(b); imgPairs.push({ target: im, kind: "img", badge: b }); });
    bgEls().forEach(function (el) { var b = makeBadge(el, "bg"); imgLayer.appendChild(b); imgPairs.push({ target: el, kind: "bg", badge: b }); });
    positionBadges();
    window.addEventListener("scroll", positionBadges, true);
    window.addEventListener("resize", positionBadges);
  }
  function removeImageControls() {
    window.removeEventListener("scroll", positionBadges, true);
    window.removeEventListener("resize", positionBadges);
    if (imgLayer) { imgLayer.remove(); imgLayer = null; }
    imgPairs = [];
  }
  function removeSectionControls() {
    document.querySelectorAll(".sfy-sec-ctl").forEach(function (b) { b.remove(); });
  }

  /* ---- toggle edit mode ---------------------------------------------------- */
  function onBlur(e) { syncLang(e.currentTarget); save(); }
  function enable() {
    editing = true;
    document.body.classList.add("sfy-editing");
    textNodes().forEach(function (el) { el.setAttribute("contenteditable", "true"); el.addEventListener("blur", onBlur); });
    addImageControls();
    addSectionControls();
    goBtn.textContent = "✓ Done editing";
    resetBtn.style.display = "";
    toast("Editing — text, 🖼 images & sections");
  }
  function disable() {
    editing = false;
    document.body.classList.remove("sfy-editing");
    textNodes().forEach(function (el) { el.removeAttribute("contenteditable"); el.removeEventListener("blur", onBlur); });
    removeImageControls();
    removeSectionControls();
    goBtn.textContent = "✎ Edit page";
    resetBtn.style.display = "none";
    save();
    toast("Saved");
  }

  /* ---- floating toolbar ---------------------------------------------------- */
  var bar = document.createElement("div");
  bar.className = "sfy-fab";
  var resetBtn = document.createElement("button");
  resetBtn.className = "sfy-btn sfy-btn-ghost"; resetBtn.type = "button";
  resetBtn.textContent = "↺ Reset"; resetBtn.style.display = "none";
  resetBtn.addEventListener("click", function () {
    if (confirm("Discard all your edits on this page?")) { localStorage.removeItem(KEY); location.reload(); }
  });
  var goBtn = document.createElement("button");
  goBtn.className = "sfy-btn sfy-btn-go"; goBtn.type = "button";
  goBtn.textContent = "✎ Edit page";
  goBtn.addEventListener("click", function () { editing ? disable() : enable(); });
  bar.appendChild(resetBtn); bar.appendChild(goBtn);

  /* Inside the SGSitefy editor (an iframe) the live-site contact FABs (WhatsApp,
     back-to-top) sit bottom-right and the editor's SitefyAI panel sits bottom-left,
     so we move this Edit toolbar to the bottom-RIGHT and hide the contact FABs to
     keep all controls clear of each other. On the standalone published page the
     toolbar stays bottom-LEFT (opposite the contact FABs). */
  var framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }

  /* boot */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  function boot() {
    if (framed) {
      bar.style.left = "auto";
      bar.style.right = "18px";
      var hide = document.createElement("style");
      hide.textContent = ".fab{display:none!important}";
      document.head.appendChild(hide);
    }
    document.body.appendChild(bar);
    restore();
  }
})();
