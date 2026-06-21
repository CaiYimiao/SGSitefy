"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyProfile } from "@/types/company-profile";
import { ArrowRight, ArrowLeft, Loader2, Plus, X, Check } from "lucide-react";

const STEPS = ["UEN", "Details", "Photos", "Describe", "Generate", "Done"];

export function OnboardingWizard() {
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
  const progressRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const set = (patch: Partial<CompanyProfile>) => setProfile((p) => ({ ...p, ...patch }));

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

      // Fake progress — eases from 0 → 90 over ~35s, slows near the top
      progressRef.current = setInterval(() => {
        setBuildProgress((prev) => {
          if (prev >= 90) return prev;
          const remaining = 90 - prev;
          const step = Math.max(0.3, remaining * 0.04);
          const next = Math.min(90, prev + step);
          setBuildStage(stageFor(next));
          return next;
        });
      }, 500);

      // Poll build status every 3s
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/builds/${buildId}`);
          const d = await r.json() as { status: string; previewUrl?: string };
          if (d.status === "DONE") {
            clearTimers();
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
      <Stepper step={step} />
      {error && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Step 0 — UEN */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Let&apos;s find your business</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="uen">UEN (Unique Entity Number)</Label>
              <Input id="uen" placeholder="e.g. 200708024D" value={uen} onChange={(e) => setUen(e.target.value)} />
              <p className="text-xs text-muted-foreground">We prefill your details from the public registry. You can edit everything next.</p>
            </div>
            <Button onClick={lookup} disabled={busy || !uen.trim()}>
              {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />} Look up
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1 — Details */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Confirm your details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
              <Label>Import from a link <span className="font-normal text-muted-foreground">(your website, Google or Facebook)</span></Label>
              <div className="flex gap-2">
                <Input placeholder="https://your-business.com" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} />
                <Button variant="outline" onClick={importFromLink} disabled={importing || !importUrl.trim()}>
                  {importing ? <Loader2 className="animate-spin" /> : null} Import
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Pulls your name, contact and photos from public page data. Use links you own.</p>
            </div>
            <Field label="Company name (EN)" value={profile.nameEn ?? ""} onChange={(v) => set({ nameEn: v })} />
            <Field label="公司名称 (中文)" value={profile.nameZh ?? ""} onChange={(v) => set({ nameZh: v })} />
            <Field label="Industry" value={profile.ssic ?? ""} onChange={(v) => set({ ssic: v })} />
            <Field label="Address" value={profile.address ?? ""} onChange={(v) => set({ address: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" value={profile.phone ?? ""} onChange={(v) => set({ phone: v })} />
              <Field label="Email" value={profile.email ?? ""} onChange={(v) => set({ email: v })} />
            </div>
            <Nav onBack={() => setStep(0)} onNext={() => setStep(2)} nextLabel="Photos" />
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Photos */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Add your photos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Paste image URLs for now (uploads + Google/Facebook import come next). Only use photos you own.
            </p>
            <div className="flex gap-2">
              <Input placeholder="https://…/photo.jpg" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
              <Button variant="outline" onClick={addPhoto}><Plus /> Add</Button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.currentTarget.value = ""; }}
                className="text-sm file:mr-3 file:rounded-md file:border file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
              />
              <span className="text-xs text-muted-foreground">or upload a file (needs Vercel Blob)</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((p) => (
                <div key={p.id} className="group relative aspect-video overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.id} className="h-full w-full object-cover" />
                  <button
                    onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))}
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 group-hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
            <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Describe" />
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Describe */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Describe what you do</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="desc">One or two sentences is enough</Label>
              <Textarea
                id="desc"
                rows={4}
                placeholder="e.g. We're a metal fabrication workshop in Yishun — laser cutting, bending and stainless steel work for any order size."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Nav onBack={() => setStep(2)} onNext={generate} nextLabel="Generate site" nextDisabled={!description.trim()} />
          </CardContent>
        </Card>
      )}

      {/* Step 4 — Building (progress bar) */}
      {step === 4 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-16 text-center">
            <div className="w-full max-w-sm space-y-3">
              <p className="text-sm font-medium text-muted-foreground">{buildStage}</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${buildProgress}%` }}
                />
              </div>
              <p className="text-xs tabular-nums text-muted-foreground">{Math.round(buildProgress)}%</p>
            </div>
            <p className="max-w-xs text-xs text-muted-foreground">
              SitefyAI is picking your layout, writing bilingual copy, and generating images. Usually done in 30–60 seconds.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 5 — Site ready */}
      {step === 5 && siteUrl && (
        <Card>
          <CardContent className="flex flex-col items-center gap-5 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Check className="size-7 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">Your site is live</p>
              <p className="text-sm text-muted-foreground">
                Open it below, or head to your dashboard to manage it.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <a href={siteUrl} target="_blank" rel="noopener">
                  View site <ArrowRight className="ml-1 size-4" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/dashboard">Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function Stepper({ step }: { step: number }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ${
              i < step ? "bg-primary text-primary-foreground" : i === step ? "border-2 border-primary text-primary" : "border text-muted-foreground"
            }`}
          >
            {i < step ? <Check className="size-3.5" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && <div className={`h-px w-6 ${i < step ? "bg-primary" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Nav({ onBack, onNext, nextLabel, nextDisabled }: { onBack: () => void; onNext: () => void; nextLabel: string; nextDisabled?: boolean }) {
  return (
    <div className="flex justify-between pt-2">
      <Button variant="ghost" onClick={onBack}><ArrowLeft /> Back</Button>
      <Button onClick={onNext} disabled={nextDisabled}>{nextLabel} <ArrowRight /></Button>
    </div>
  );
}

