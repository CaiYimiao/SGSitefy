import Link from "next/link";
import { auth } from "@/auth";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import "../_marketing/homepage.css";

export default async function NewSitePage() {
  const session = await auth();
  return (
    <div className="sgsitefy-home" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* top bar with back link */}
      <div className="pvbar">
        <Link href="/" className="pvbar-brand" style={{ textDecoration: "none", gap: 10 }}>
          <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: 8, border: "1.5px solid var(--line)", color: "var(--ink)" }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
          </span>
          <span className="logo-text" style={{ fontSize: ".92rem", color: "var(--muted)", fontWeight: 600 }}>Back to <em style={{ color: "#EF3340", fontStyle: "normal" }}>SG</em><span style={{ color: "var(--ink)" }}>Sitefy</span></span>
        </Link>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </div>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "44px 24px 96px" }}>
        <div style={{ marginBottom: 28 }}>
          <p className="sec-eyebrow">Build your site</p>
          <h1 className="sec-title" style={{ fontSize: "2rem" }}>Let&apos;s get you online</h1>
        </div>
        <OnboardingWizard loggedIn={!!session?.user} />
      </main>
    </div>
  );
}
