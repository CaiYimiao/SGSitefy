"use client";

import * as React from "react";
import type { CompanyProfile } from "@/types/company-profile";
import { ArrowRight, ArrowLeft, Loader2, Plus, X, Check } from "lucide-react";

const STEPS = ["UEN", "Details", "Photos", "Describe", "Generate", "Done"];
const DRAFT_KEY = "sitefy_wizard_draft";

export function OnboardingWizard({ loggedIn }: { loggedIn: boolean }) {
  const [step, setStep] = React.useState(0);
  const [uen, setUen] = React.useState("");
  const [profile, setProfile] = React.useState<Partial<CompanyProfile>>({});
  const [photos, setPhotos] = React.useState<{ id: string; url: string }[]>([]);
  const [photoUrl, setPhotoUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [importUrl, setImportUrl] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const [buildProgress, setBuildProgress] = React.useState(0);
  const [buildStage, setBuildStage] = React.useState("");
  const [siteUrl, setSiteUrl] = React.useState<string | null>(null);
  const [restored, setRestored] = React.useState(false);
  const progressRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const set = (patch: Partial<CompanyProfile>) => setProfile((p) => ({ ...p, ...patch }));

  // Restore an in-progress draft (e.g. after the login redirect, or if the
  // user closed the tab mid-wizard) so nothing is ever re-entered.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.uen) setUen(d.uen);
        if (d.profile) setProfile(d.profile);
        if (Array.isArray(d.photos)) setPhotos(d.photos);
        if (d.description) setDescription(d.description);
        if (typeof d.step === "number" && d.step >= 0 && d.step <= 3) setStep(d.step);
      }
    } catch { /* ignore */ }
    setRestored(true);
  }, []);

  // Persist the editable steps (0–3) so a refresh / login round-trip keeps state.
  React.useEffect(() => {
    if (!restored || step > 3) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, uen, profile, photos, description }));
    } catch { /* ignore */ }
  }, [restored, step, uen, profile, photos, description]);

  async function importFromLink() {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      const d = data.data as Partial<CompanyProfile> & { photos?: { id: string; url: string }[] };
      setProfile((p) => ({
        ...p,
        nameEn: p.nameEn || d.nameEn,
        address: p.address || d.address,
        phone: p.phone || d.phone,
        email: p.email || d.email,
        lat: p.lat ?? d.lat,
        lng: p.lng ?? d.lng,
      }));
      if (d.photos?.length) {
        setPhotos((ps) => [...ps, ...d.photos!.map((ph, i) => ({ id: `p${ps.length + i + 1}`, url: ph.url }))]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImporting(false);
    }
  }

  async function lookup() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/uen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uen }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lookup failed");
      setProfile({ ...data.profile });

      // Login gates here — after the UEN is entered and looked up, before we
      // save anything. Persist the draft so they return straight to step 1.
      if (!loggedIn) {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ step: 1, uen, profile: data.profile, photos, description }));
        } catch { /* ignore */ }
        window.location.href = `/signin?callbackUrl=${encodeURIComponent("/new")}`;
        return;
      }
      setStep(1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const STAGES: [number, string][] = [
    [0,  "Analysing your brand…"],
    [18, "Choosing your layout…"],
    [38, "Writing your copy…"],
    [62, "Generating images…"],
    [80, "Assembling your site…"],
    [93, "Almost there…"],
  ];

  function stageFor(pct: number) {
    return [...STAGES].reverse().find(([t]) => pct >= t)?.[1] ?? STAGES[0][1];
  }

  function clearTimers() {
    if (progressRef.current) clearInterval(progressRef.current);
    if (pollRef.current)    clearInterval(pollRef.current);
    progressRef.current = null;
    pollRef.current = null;
  }

  async function generate() {
    setBusy(true);
    setError(null);
    setBuildProgress(0);
    setBuildStage(STAGES[0][1]);
    setSiteUrl(null);
    setStep(4);
    clearTimers();

    try {
      const res = await fetch("/api/sites/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, description, photos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      const { buildId, slug } = data as { buildId: string; slug: string };

      progressRef.current = setInterval(() => {
        setBuildProgress((prev) => {
          if (prev >= 90) return prev;
          const remaining = 90 - prev;
          const inc = Math.max(0.3, remaining * 0.04);
          const next = Math.min(90, prev + inc);
          setBuildStage(stageFor(next));
          return next;
        });
      }, 500);

      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/builds/${buildId}`);
          const d = await r.json() as { status: string; previewUrl?: string };
          if (d.status === "DONE") {
            clearTimers();
            try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
            setBuildProgress(100);
            setBuildStage("Your site is ready!");
            setSiteUrl(`/s/${slug}`);
            setStep(5);
            setBusy(false);
          } else if (d.status === "FAILED") {
            clearTimers();
            throw new Error("Build failed — please try again.");
          }
        } catch (e) {
          clearTimers();
          setError((e as Error).message);
          setStep(3);
          setBusy(false);
        }
      }, 3000);

    } catch (e) {
      clearTimers();
      setError((e as Error).message);
      setStep(3);
      setBusy(false);
    }
  }

  function addPhoto() {
    const url = photoUrl.trim();
    if (!url) return;
    setPhotos((p) => [...p, { id: `p${p.length + 1}`, url }]);
    setPhotoUrl("");
  }

  async function uploadFile(file: File) {
    setError(null);
    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: "POST", body: file });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setPhotos((p) => [...p, { id: `p${p.length + 1}`, url: data.url }]);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`dot${i === step ? " active" : i < step ? " done" : ""}`} title={label}>
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`seg${i < step ? " done" : ""}`} />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div style={{ margin: "0 0 18px", padding: "12px 14px", borderRadius: "10px", background: "#fef2f2", color: "#dc2626", fontSize: ".88rem", border: "1px solid #fecaca", fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* Step 0 — UEN */}
      {step === 0 && (
        <div className="wizard visible">
          <h2 className="wzh">Let&apos;s find your business</h2>
          <div className="field">
            <label htmlFor="uen">UEN (Unique Entity Number)</label>
            <input id="uen" placeholder="e.g. 200708024D" value={uen} onChange={(e) => setUen(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && uen.trim()) lookup(); }} />
            <p className="hint">We prefill your details from the public registry. You&apos;ll confirm and can edit everything next.</p>
          </div>
          <button className="btn btn-primary" onClick={lookup} disabled={busy || !uen.trim()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />} Look up
          </button>
        </div>
      )}

      {/* Step 1 — Details */}
      {step === 1 && (
        <div className="wizard visible">
          <h2 className="wzh">Confirm your details</h2>
          <div className="importbox">
            <label style={{ fontSize: ".8rem", fontWeight: 600 }}>Import from a link <span style={{ fontWeight: 400, color: "var(--muted)" }}>(your website, Google or Facebook)</span></label>
            <div className="ir">
              <input placeholder="https://your-business.com" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} />
              <button className="btn btn-outline" onClick={importFromLink} disabled={importing || !importUrl.trim()}>
                {importing ? <Loader2 className="size-4 animate-spin" /> : null} Import
              </button>
            </div>
            <p className="hint">Pulls your name, contact and photos from public page data. Use links you own.</p>
          </div>
          <Field label="Company name (EN)" value={profile.nameEn ?? ""} onChange={(v) => set({ nameEn: v })} />
          <Field label="公司名称 (中文)" value={profile.nameZh ?? ""} onChange={(v) => set({ nameZh: v })} />
          <Field label="Industry" value={profile.ssic ?? ""} onChange={(v) => set({ ssic: v })} />
          <Field label="Address" value={profile.address ?? ""} onChange={(v) => set({ address: v })} />
          <div className="row2">
            <Field label="Phone" value={profile.phone ?? ""} onChange={(v) => set({ phone: v })} />
            <Field label="Email" value={profile.email ?? ""} onChange={(v) => set({ email: v })} />
          </div>
          <Nav onBack={() => setStep(0)} onNext={() => setStep(2)} nextLabel="Photos" />
        </div>
      )}

      {/* Step 2 — Photos */}
      {step === 2 && (
        <div className="wizard visible">
          <h2 className="wzh">Add your photos</h2>
          <p className="hint" style={{ marginBottom: 14 }}>Paste image URLs or upload files. Only use photos you own.</p>
          <div className="importbox">
            <div className="ir">
              <input placeholder="https://…/photo.jpg" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addPhoto(); }} />
              <button className="btn btn-outline" onClick={addPhoto}><Plus className="size-4" /> Add</button>
            </div>
            <label className="hint" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, cursor: "pointer" }}>
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.currentTarget.value = ""; }} style={{ fontSize: ".82rem" }} />
            </label>
          </div>
          {photos.length > 0 && (
            <div className="photos">
              {photos.map((p) => (
                <div key={p.id} className="ph filled" style={{ backgroundImage: `url(${p.url})` }}>
                  <button className="ph-x" onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))} aria-label="Remove photo"><X className="size-3" /></button>
                </div>
              ))}
            </div>
          )}
          <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Describe" />
        </div>
      )}

      {/* Step 3 — Describe */}
      {step === 3 && (
        <div className="wizard visible">
          <h2 className="wzh">Describe what you do</h2>
          <div className="field">
            <label htmlFor="desc">One or two sentences is enough</label>
            <textarea id="desc" rows={4} placeholder="e.g. We're a metal fabrication workshop in Yishun — laser cutting, bending and stainless steel work for any order size." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Nav onBack={() => setStep(2)} onNext={generate} nextLabel="Generate site" nextDisabled={!description.trim()} />
        </div>
      )}

      {/* Step 4 — Building */}
      {step === 4 && (
        <div className="wizard visible" style={{ textAlign: "center", padding: "48px 32px" }}>
          <div className="spinner" style={{ marginBottom: 20 }} />
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", marginBottom: 18 }}>{buildStage}</p>
          <div style={{ height: 8, width: "100%", maxWidth: 360, margin: "0 auto 8px", borderRadius: 999, background: "var(--bg-2)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 999, background: "var(--primary)", width: `${buildProgress}%`, transition: "width .5s ease" }} />
          </div>
          <p className="hint" style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(buildProgress)}%</p>
          <p className="hint" style={{ maxWidth: 320, margin: "16px auto 0" }}>SitefyAI is picking your layout, writing bilingual copy, and generating images. Usually done in 30–60 seconds.</p>
        </div>
      )}

      {/* Step 5 — Site ready */}
      {step === 5 && siteUrl && (
        <div className="wizard visible" style={{ textAlign: "center", padding: "48px 32px" }}>
          <div className="done-check" aria-hidden="true">✓</div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.3rem", marginBottom: 6 }}>Your site is live</p>
          <p className="hint" style={{ marginBottom: 22 }}>Open it below, or head to your dashboard to manage it.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a className="btn btn-primary" href={siteUrl} target="_blank" rel="noopener">View site <ArrowRight className="size-4" /></a>
            <a className="btn btn-outline" href="/dashboard">Dashboard</a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Nav({ onBack, onNext, nextLabel, nextDisabled }: { onBack: () => void; onNext: () => void; nextLabel: string; nextDisabled?: boolean }) {
  return (
    <div className="navbtns">
      <button className="btn btn-ghost" onClick={onBack}><ArrowLeft className="size-4" /> Back</button>
      <button className="btn btn-primary" onClick={onNext} disabled={nextDisabled}>{nextLabel} <ArrowRight className="size-4" /></button>
    </div>
  );
}
