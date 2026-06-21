"use client";

import * as React from "react";
import Link from "next/link";

const KEY = "sgsitefy_cookie_consent";

type Consent = { necessary: true; performance: boolean; functionality: boolean; ts: number };

function read(): Consent | null {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
}
function write(c: Consent) {
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

export function CookieConsent() {
  const [open, setOpen] = React.useState(false);
  const [showReopen, setShowReopen] = React.useState(false);
  const [details, setDetails] = React.useState(false);
  const [tab, setTab] = React.useState<"decl" | "about">("decl");
  const [perf, setPerf] = React.useState(false);
  const [func, setFunc] = React.useState(false);

  // First visit → open after a beat; returning visitor → just show the reopen pill
  React.useEffect(() => {
    const saved = read();
    if (!saved) {
      const t = setTimeout(() => setOpen(true), 700);
      return () => clearTimeout(t);
    }
    setPerf(!!saved.performance);
    setFunc(!!saved.functionality);
    setShowReopen(true);
  }, []);

  const close = () => { setOpen(false); setShowReopen(true); };
  const acceptAll = () => { write({ necessary: true, performance: true, functionality: true, ts: Date.now() }); setPerf(true); setFunc(true); close(); };
  const rejectAll = () => { write({ necessary: true, performance: false, functionality: false, ts: Date.now() }); setPerf(false); setFunc(false); close(); };
  const save = () => { write({ necessary: true, performance: perf, functionality: func, ts: Date.now() }); close(); };
  const reopen = () => { const s = read(); setPerf(!!s?.performance); setFunc(!!s?.functionality); setOpen(true); };

  return (
    <>
      <div className={`ck-backdrop${open ? " show" : ""}`} onClick={close} />
      <div className={`ck-card${open ? " show" : ""}`} role="dialog" aria-modal="true" aria-labelledby="ck-title" aria-hidden={!open}>
        <div className="ck-pad">
          <div className="ck-top">
            <div className="ck-logo" aria-hidden="true">🍪</div>
            <div className="ck-title" id="ck-title">SGSitefy uses cookies</div>
            <button className="ck-x" onClick={close} aria-label="Close">✕</button>
          </div>
          <p className="ck-desc">We use cookies to run the builder, remember your progress, and understand how SGSitefy is used. You can accept all, or choose which categories to allow. See our <Link href="/terms" target="_blank" rel="noopener">Cookie &amp; Privacy Policy</Link>.</p>
          <div className="ck-btns">
            <button className="ck-btn ck-btn-primary" onClick={acceptAll}>Accept all</button>
            <button className="ck-btn ck-btn-outline" onClick={save}>Save &amp; close</button>
            <button className="ck-btn ck-btn-outline" onClick={rejectAll}>Reject non-essential</button>
          </div>
          <button className="ck-toggle-details" onClick={() => setDetails((d) => !d)} aria-expanded={details}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            <span>{details ? "Hide details" : "Customise"}</span>
          </button>
          <div className={`ck-details${details ? " show" : ""}`}>
            <div className="ck-cats">
              <div className="ck-cat">
                <label className="ck-sw"><input type="checkbox" checked disabled readOnly /><span className="track" /><span className="knob" /></label>
                <div className="ck-cat-name">Strictly necessary<small>Login session, build wizard state, and your cookie preference. Always on — the service cannot work without these.</small></div>
              </div>
              <div className="ck-cat">
                <label className="ck-sw"><input type="checkbox" checked={perf} onChange={(e) => setPerf(e.target.checked)} /><span className="track" /><span className="knob" /></label>
                <div className="ck-cat-name">Performance<small>Anonymous page-view counts and feature usage (Vercel Analytics) to improve the product. No personal data stored.</small></div>
              </div>
              <div className="ck-cat">
                <label className="ck-sw"><input type="checkbox" checked={func} onChange={(e) => setFunc(e.target.checked)} /><span className="track" /><span className="knob" /></label>
                <div className="ck-cat-name">Functionality<small>Remembers your language choice (EN / 中文) and editor drafts between sessions.</small></div>
              </div>
            </div>
            <div className="ck-decl">
              <div className="ck-tabs">
                <button className={`ck-tab${tab === "decl" ? " active" : ""}`} onClick={() => setTab("decl")}>Cookie declaration</button>
                <button className={`ck-tab${tab === "about" ? " active" : ""}`} onClick={() => setTab("about")}>About cookies</button>
              </div>
              <div className="ck-tabbody">
                {tab === "decl" ? (
                  <p>Strictly necessary cookies allow core SGSitefy functionality such as account login, the build wizard, and saving your draft. The service cannot work properly without them. All other categories are optional and off until you allow them.</p>
                ) : (
                  <p>Cookies are small text files placed on your device by the websites you visit. They help sites work, remember your settings, and understand usage. Cookies required for the site to operate are set automatically; all others need your consent before they are stored.</p>
                )}
              </div>
            </div>
            <p className="ck-footnote">PDPA-compliant · you can change this anytime</p>
          </div>
        </div>
      </div>
      <button className={`ck-reopen${showReopen && !open ? " show" : ""}`} onClick={reopen} aria-label="Cookie settings" title="Cookie settings">🍪</button>
    </>
  );
}
