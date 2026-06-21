"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import "../_marketing/homepage.css";

// Dev email login is available locally or when NEXT_PUBLIC_ALLOW_DEV_LOGIN=true.
const allowDev =
  process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true" ||
  process.env.NODE_ENV !== "production";

function LionMark() {
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polygon points="8,0.5 9.7,5.5 6.3,5.5" /><polygon points="3.5,2.5 6.2,6.5 3,7.5" /><polygon points="12.5,2.5 9.8,6.5 13,7.5" />
      <circle cx="8" cy="11.5" r="4.5" /><circle cx="6.3" cy="11" r="0.7" fill="#EF3340" /><circle cx="9.7" cy="11" r="0.7" fill="#EF3340" /><circle cx="8" cy="12.8" r="0.5" fill="#EF3340" />
    </svg>
  );
}

export default function SignInPage() {
  const [email, setEmail] = React.useState("");

  const doEmail = () => {
    if (!email.trim()) return;
    signIn("credentials", { email: email.trim(), callbackUrl: "/dashboard" });
  };

  return (
    <div className="sgsitefy-home" style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)", padding: 16 }}>
      <div className="lg-card" style={{ transform: "none" }}>
        <div className="lg-head">
          <div className="lg-mark" aria-hidden="true"><LionMark /></div>
          <div className="lg-title">Log in to SGSitefy</div>
          <div className="lg-sub">Save your site and pick up where you left off.</div>
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
          {allowDev && (
            <>
              <div className="lg-or">or dev sign-in</div>
              <div className="lg-field">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" aria-label="Email" onKeyDown={(e) => { if (e.key === "Enter") doEmail(); }} />
              </div>
              <button className="lg-primary" onClick={doEmail}>Continue with email (dev)</button>
            </>
          )}
          <p className="lg-note">Sign in with Google or Facebook — no password stored. By continuing you agree to our <Link href="/terms" target="_blank" rel="noopener">Terms</Link>.</p>
        </div>
      </div>
    </div>
  );
}
