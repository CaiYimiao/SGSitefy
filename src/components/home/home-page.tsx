"use client";

import * as React from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";

const ALLOW_DEV_LOGIN =
  process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true" || process.env.NODE_ENV !== "production";

/** SGSitefy lion mark (Singapore merlion-crown nod). */
function LionMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <polygon points="8,0.5 9.7,5.5 6.3,5.5" />
      <polygon points="3.5,2.5 6.2,6.5 3,7.5" />
      <polygon points="12.5,2.5 9.8,6.5 13,7.5" />
      <circle cx="8" cy="11.5" r="4.5" />
      <circle cx="6.3" cy="11" r="0.7" fill="#EF3340" />
      <circle cx="9.7" cy="11" r="0.7" fill="#EF3340" />
      <circle cx="8" cy="12.8" r="0.5" fill="#EF3340" />
    </svg>
  );
}

const SLIDES = [
  {
    pill: "For Singapore SMEs & startups · EN / 中文",
    h1: (
      <>Your business website,<br />built in <span className="accent-word">minutes</span>.</>
    ),
    sub: "Enter your UEN, add a few photos, describe what you do. SGSitefy pulls public registry data and builds a live, bilingual landing page — no designer needed.",
    primary: "Build my site →",
    secondary: "See an example",
    tags: ["✓ No code", "✓ Bilingual EN / 中文", "✓ Live in minutes"],
  },
  {
    pill: "Step 1 of 3 · Registry lookup",
    h1: (
      <>Just enter your <span className="accent-amber">UEN</span>.<br />We handle the rest.</>
    ),
    sub: "We look up your legal name, registered address, and industry from the Singapore business registry — so you start with real data, not a blank page.",
    primary: "Try it now →",
    secondary: null,
    tags: ["✓ ACRA registry data", "✓ Pre-filled details", "✓ Edit anything"],
  },
  {
    pill: "Step 2 of 3 · AI writing",
    h1: (
      <>SitefyAI writes<br />your <span className="accent-word">copy</span> for you.</>
    ),
    sub: "One sentence about your business. SitefyAI writes the full page copy in English and 中文 — professional, specific to your industry, and fully editable.",
    primary: "See how →",
    secondary: null,
    tags: ["✓ SitefyAI-powered", "✓ Bilingual copy", "✓ Industry-tuned"],
  },
  {
    pill: "Step 3 of 3 · Publish",
    h1: (
      <>Live on your<br />own <span className="accent-amber">domain</span>.</>
    ),
    sub: "Publish to yourname.sgsitefy.com in one click, or register your own domain right inside SGSitefy. Works on mobile, passes Core Web Vitals out of the box.",
    primary: "Start building →",
    secondary: "See the output",
    tags: ["✓ Custom domain", "✓ Mobile-ready", "✓ Fast & accessible"],
  },
];

const STEPS = [
  { icon: "▤", num: "Step 01", h: "Enter your UEN", p: "We prefill your legal name, registered address, and industry from the public ACRA registry. You confirm and tweak anything." },
  { icon: "✨", num: "Step 02", h: "Add photos + one sentence", p: "SitefyAI writes your full page copy in English and 中文, tuned to your industry. Layout and brand colours are applied automatically." },
  { icon: "◉", num: "Step 03", h: "Get a domain & publish", p: "Search and register your own .com.sg or .sg domain right inside SGSitefy — choose Cloudflare, Namecheap, or GoDaddy. Go live in one click." },
];

const TEMPLATES = [
  { tag: "Industrial", name: "Precision Works", seed: "factory", blurb: "Engineering & fabrication" },
  { tag: "F&B", name: "Hawker Hub", seed: "hawker", blurb: "Food & beverage" },
  { tag: "Retail", name: "Shopfront", seed: "boutique", blurb: "Retail & trading" },
  { tag: "Wellness", name: "Carepoint", seed: "clinic", blurb: "Clinic & wellness" },
  { tag: "Services", name: "Pinnacle", seed: "office", blurb: "Professional services" },
  { tag: "F&B", name: "Bento", seed: "cafe", blurb: "Cafés & restaurants" },
];

const FAQS = [
  { q: "Do I need any technical skills?", a: "None at all. If you can fill in a form and upload a photo, you can build a site with SGSitefy. The wizard walks you through every step and SitefyAI writes the copy for you." },
  { q: "What if I already have a website?", a: "No problem — paste your existing URL in the “Import from a link” field. SGSitefy pulls your name, contact details, and photos automatically, so you're not starting from scratch." },
  { q: "Can I edit the site after it's published?", a: "Yes. Every field — copy, photos, colours, certifications — is editable from your SGSitefy dashboard. Changes go live in seconds, no re-publishing needed." },
  { q: "Does it work for .sg and .com.sg domains?", a: "Yes. SGSitefy integrates with Cloudflare, Namecheap, and GoDaddy so you can register a .com.sg, .sg, or .com domain right inside the wizard and have it connected automatically." },
  { q: "Is the site bilingual from day one?", a: "Yes — every page is generated in English and Mandarin Chinese simultaneously. SitefyAI writes both versions at once, tuned to your industry's tone in each language." },
  { q: "How does SGSitefy verify my certifications?", a: "It doesn't — and that's intentional. You declare your certifications (BizSAFE, ISO, Halal, etc.) and they appear on your site. You are responsible for the accuracy of what you display." },
  { q: "Is my business data safe?", a: "Your UEN and contact details are used only to build your site. We don't sell your data. SGSitefy is PDPA-compliant — see our Privacy Policy for the full picture." },
  { q: "What industries are supported?", a: "Industrial & Engineering, Food & Beverage, Retail / Trading, Clinic / Wellness, and Professional Services. Each has a hand-crafted template — more industries are added regularly." },
];

export function HomePage({ user }: { user: { name: string | null; email: string | null } | null }) {
  const [slide, setSlide] = React.useState(0);
  const [login, setLogin] = React.useState<{ open: boolean; mode: "login" | "signup" }>({ open: false, mode: "login" });
  const openLogin = (mode: "login" | "signup") => setLogin({ open: true, mode });
  const closeLogin = () => setLogin((l) => ({ ...l, open: false }));

  // Auto-advance the hero carousel
  React.useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  // Scroll-reveal for step items + wizard band
  React.useEffect(() => {
    const els = document.querySelectorAll(".step-item, .reveal, .wizard");
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("visible"));
      return;
    }
    const io = new IntersectionObserver(
      (ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); } }),
      { threshold: 0.15 }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const initials = (user?.name ?? user?.email ?? "?").trim().charAt(0).toUpperCase();

  return (
    <div className="sgsitefy-home">
      {/* ── NAV ── */}
      <div className="pvbar">
        <div className="pvbar-brand">
          <div className="logo-mark"><LionMark /></div>
          <span className="logo-text"><em>SG</em>Sitefy</span>
        </div>
        <nav>
          <a href="#product">Product</a>
          <a href="#builder">Builder</a>
          <a href="#templates">Templates</a>
          <Link href="/terms" target="_blank" rel="noopener">Terms</Link>
        </nav>
        <div className="pv-auth">
          {user ? (
            <span className="pv-user">
              <span className="pv-avatar">{initials}</span>
              <span className="pv-uname">{user.name ?? user.email}</span>
              <Link className="pv-logout" href="/dashboard">Dashboard</Link>
              <button className="pv-logout" onClick={() => signOut({ callbackUrl: "/" })}>Log out</button>
            </span>
          ) : (
            <>
              <button className="pv-btn pv-signup" onClick={() => openLogin("signup")}>Sign up</button>
              <button className="pv-btn pv-login" onClick={() => openLogin("login")}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14a4 4 0 1 1 3.87-5h9.13a1 1 0 0 1 .7.29l1.5 1.5a1 1 0 0 1 0 1.42l-2.5 2.5a1 1 0 0 1-1.4 0l-1.1-1.1-1.1 1.1a1 1 0 0 1-1.42 0L13 14H10.87A4 4 0 0 1 7 14Zm-1-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /></svg>
                Login
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── HERO ── */}
      <section id="product" className="hero-section" aria-label="Product hero">
        <div className="hero-inner wrap">
          <div className="hero-layout">
            <div>
              <div className="slides-stack" role="region" aria-label="Hero slideshow" aria-live="polite">
                <div className="slides-spacer" aria-hidden="true" />
                {SLIDES.map((s, i) => (
                  <div key={i} className={`slide-content${i === slide ? " active" : ""}`} aria-hidden={i !== slide}>
                    <div className="hero-pill"><span className="dot-live" aria-hidden="true" />{s.pill}</div>
                    <h1 className="hero-h1">{s.h1}</h1>
                    <p className="hero-sub">{s.sub}</p>
                    <div className="hero-ctas">
                      <Link href="/new" className="btn btn-primary">{s.primary}</Link>
                      {s.secondary && (
                        <a href="#templates" className="btn btn-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,.22)", background: "rgba(255,255,255,.08)" }}>{s.secondary}</a>
                      )}
                    </div>
                    <div className="hero-tags">
                      {s.tags.map((t) => <span key={t} className="hero-tag">{t}</span>)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="hero-dots" role="tablist" aria-label="Slide navigation">
                {SLIDES.map((_, i) => (
                  <button key={i} className={`hero-dot${i === slide ? " active" : ""}`} role="tab" aria-label={`Slide ${i + 1}`} aria-selected={i === slide} onClick={() => setSlide(i)} />
                ))}
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-mockup">
                <div className="hero-mockup-bar">
                  <span style={{ background: "#ff5f57" }} /><span style={{ background: "#febc2e" }} /><span style={{ background: "#28c840" }} />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://picsum.photos/seed/shopfront/800/550" alt="" />
                <div className="hero-mockup-label">sengineng.com.sg<span className="badge">● Live</span></div>
              </div>
              <div className="stat-chip stat-chip-1" aria-hidden="true">
                <div><div className="num">3 min</div><div className="lbl">avg. build time</div></div>
              </div>
              <div className="stat-chip stat-chip-2" aria-hidden="true">
                <div><div className="num">EN/中文</div><div className="lbl">bilingual, instant</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-section" aria-labelledby="how-title">
        <div className="how-decor-dots" aria-hidden="true" />
        <div className="how-decor-teal" aria-hidden="true" />
        <div className="wrap how-inner">
          <div className="how-grid">
            <div className="how-left">
              <div className="how-label-block"><p className="sec-eyebrow">How it works</p></div>
              <p className="how-main-copy">Three steps from nothing to a live site.</p>
              <p className="how-sub-copy">No designer, no developer, no waiting. SGSitefy stitches together public data, your photos, and SitefyAI's writing into a polished bilingual page — then helps you register a domain, all in one place.</p>
            </div>
            <div className="steps-stack" role="list">
              {STEPS.map((s) => (
                <div key={s.num} className="step-item" role="listitem">
                  <div className="step-icon-wrap" aria-hidden="true">{s.icon}</div>
                  <div className="step-body">
                    <p className="step-num">{s.num}</p>
                    <h3 className="step-h">{s.h}</h3>
                    <p className="step-p">{s.p}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BUILDER CTA BAND (→ real wizard) ── */}
      <section id="builder" className="band">
        <div className="wrap">
          <div className="band-header reveal" style={{ textAlign: "center" }}>
            <p className="sec-eyebrow" style={{ justifyContent: "center" }}>The builder</p>
            <h2 className="sec-title">From UEN to a live site</h2>
            <p className="sec-sub" style={{ margin: "0 auto 28px" }}>A 6-step wizard — registry lookup, photos, a sentence, and publish. Usually done in minutes.</p>
            <Link href="/new" className="btn btn-primary" style={{ fontSize: "1rem", padding: "14px 28px" }}>Start the builder →</Link>
          </div>
        </div>
      </section>

      {/* ── TEMPLATES ── */}
      <section id="templates" className="wrap" style={{ padding: "64px 0 84px" }}>
        <p className="sec-eyebrow">Templates</p>
        <h2 className="sec-title">A hand-crafted design for every trade</h2>
        <p className="sec-sub">Five industries, each with its own typography, palette, and layout. SitefyAI picks the right one and themes it to your brand.</p>
        <div className="tmpl-grid">
          {TEMPLATES.map((t) => (
            <Link key={t.name} href="/new" className="tmpl-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://picsum.photos/seed/${t.seed}/600/400`} alt={`${t.name} template preview`} />
              <div className="tmpl-meta">
                <span className="tmpl-tag">{t.tag}</span>
                <div className="tmpl-name">{t.name}</div>
                <div className="tmpl-blurb">{t.blurb}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "100px 0", background: "var(--bg)" }}>
        <div className="wrap">
          <p className="sec-eyebrow">FAQ</p>
          <h2 className="sec-title">Common questions</h2>
          <p className="sec-sub">Everything you need to know before you start.</p>
          <div className="faq-grid">
            {FAQS.map((f) => (
              <details key={f.q} className="faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="site-footer">
        <div className="wrap">
          <div className="footer-top">
            <div>
              <div className="footer-brand">
                <div className="footer-logo"><LionMark /></div>
                <div>
                  <div className="footer-brand-name"><em>SG</em>Sitefy</div>
                  <div className="footer-tagline">Built for Singapore SMEs & startups</div>
                </div>
              </div>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <span className="footer-col-title">Product</span>
                <a href="#product">How it works</a>
                <a href="#builder">Builder</a>
                <a href="#templates">Templates</a>
                <a href="#faq">FAQ</a>
              </div>
              <div className="footer-col">
                <span className="footer-col-title">Legal</span>
                <Link href="/terms">Terms of Service</Link>
                <Link href="/terms">Privacy Policy</Link>
              </div>
              <div className="footer-col">
                <span className="footer-col-title">Contact</span>
                <a href="mailto:hello@sgsitefy.com">hello@sgsitefy.com</a>
                <a href="mailto:dpo@sgsitefy.com">DPO (PDPA)</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 SGSitefy. All rights reserved.</span>
            <p className="footer-disclaimer">Certification badges are displayed as declared by the business owner. SGSitefy does not independently verify certification status. Governing law: Singapore.</p>
          </div>
        </div>
      </footer>

      {/* ── LOGIN MODAL ── */}
      <LoginModal open={login.open} mode={login.mode} onClose={closeLogin} onSwap={(m) => setLogin({ open: true, mode: m })} />
    </div>
  );
}

function LoginModal({ open, mode, onClose, onSwap }: {
  open: boolean;
  mode: "login" | "signup";
  onClose: () => void;
  onSwap: (m: "login" | "signup") => void;
}) {
  const [email, setEmail] = React.useState("");
  const isSignup = mode === "signup";

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const doEmail = () => {
    if (!email.trim()) return;
    signIn("credentials", { email: email.trim(), callbackUrl: "/dashboard" });
  };

  return (
    <div className={`lg-back${open ? " show" : ""}`} role="dialog" aria-modal="true" aria-labelledby="lg-title" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lg-card">
        <div className="lg-head">
          <button className="lg-x" onClick={onClose} aria-label="Close">✕</button>
          <div className="lg-mark" aria-hidden="true"><LionMark /></div>
          <div className="lg-title" id="lg-title">{isSignup ? "Create your SGSitefy account" : "Log in to SGSitefy"}</div>
          <div className="lg-sub">{isSignup ? "Build your bilingual business site in minutes." : "Save your site and pick up where you left off."}</div>
        </div>
        <div className="lg-body">
          <button className="lg-oauth" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
            <svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 1 0 24 44c11 0 20-8 20-20 0-1.3-.1-2.3-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 0 0 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39.9 35.6 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5z" /></svg>
            Continue with Google
          </button>
          <button className="lg-oauth" onClick={() => signIn("facebook", { callbackUrl: "/dashboard" })}>
            <svg viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.2h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
            Continue with Facebook
          </button>
          {ALLOW_DEV_LOGIN && (
            <>
              <div className="lg-or">or</div>
              <div className="lg-field">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" aria-label="Email" onKeyDown={(e) => { if (e.key === "Enter") doEmail(); }} />
              </div>
              <button className="lg-primary" onClick={doEmail}>Continue with email</button>
            </>
          )}
          <p className="lg-toggle">
            <span>{isSignup ? "Already have an account?" : "New to SGSitefy?"}</span>{" "}
            <button onClick={() => onSwap(isSignup ? "login" : "signup")}>{isSignup ? "Log in" : "Sign up"}</button>
          </p>
          <p className="lg-note">Sign in with Google or Facebook — no password stored. By continuing you agree to our <Link href="/terms" target="_blank" rel="noopener">Terms</Link>.</p>
        </div>
      </div>
    </div>
  );
}
