"use client";

import * as React from "react";
import type { SiteSpec, Section } from "@/lib/site-spec";

type Lang = "en" | "zh";
type Loc = { en: string; zh?: string };

/**
 * The published "industrial" template. Renders a validated SiteSpec into a real,
 * bilingual landing page, themed by spec.theme. This is the deterministic build
 * output served at /s/{slug}.
 */
export function SiteRenderer({ spec, assets }: { spec: SiteSpec; assets: Record<string, string> }) {
  const [lang, setLang] = React.useState<Lang>("en");
  const t = (x?: Loc) => (x ? (lang === "zh" && x.zh ? x.zh : x.en) : "");
  const img = (ref?: string) => (ref ? assets[ref] : undefined);
  const primary = spec.theme.primary;
  const accent = spec.theme.accent;
  const name = lang === "zh" && spec.meta.companyNameZh ? spec.meta.companyNameZh : spec.meta.companyNameEn;

  return (
    <div
      className="min-h-screen bg-white text-zinc-900"
      style={{ "--brand": primary, "--accent": accent } as React.CSSProperties}
    >
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white/90 px-6 py-3 backdrop-blur">
        <span className="text-lg font-bold" style={{ color: primary }}>{name}</span>
        <div className="inline-flex overflow-hidden rounded-md border text-sm">
          {(["en", "zh"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="px-3 py-1"
              style={{ background: lang === l ? primary : "transparent", color: lang === l ? "#fff" : "#52525b" }}
            >
              {l === "en" ? "EN" : "中文"}
            </button>
          ))}
        </div>
      </header>

      {spec.sections.map((s, i) => (
        <SectionView key={i} s={s} t={t} img={img} primary={primary} accent={accent} />
      ))}

      <footer className="border-t px-6 py-8 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} {name}. Built with SGSitefy.
      </footer>
    </div>
  );
}

function SectionView({
  s,
  t,
  img,
  primary,
  accent,
}: {
  s: Section;
  t: (x?: Loc) => string;
  img: (ref?: string) => string | undefined;
  primary: string;
  accent: string;
}) {
  switch (s.type) {
    case "hero": {
      const bg = img(s.imageRef);
      return (
        <section className="relative overflow-hidden px-6 py-28 text-white" style={{ background: bg ? "#0a0a0a" : primary }}>
          {bg && <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />}
          <div className="relative mx-auto max-w-4xl">
            {s.eyebrow && <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em]" style={{ color: accent }}>{t(s.eyebrow)}</p>}
            <h1 className="text-4xl font-extrabold sm:text-5xl">{t(s.headline)}</h1>
            {s.sub && <p className="mt-4 max-w-2xl text-lg opacity-90">{t(s.sub)}</p>}
          </div>
        </section>
      );
    }
    case "about":
      return (
        <section className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-bold" style={{ color: primary }}>{t(s.heading)}</h2>
            {s.body.map((b, j) => <p key={j} className="mb-3 text-zinc-600">{t(b)}</p>)}
            {s.bullets && (
              <ul className="mt-2 space-y-2">
                {s.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
                    {t(b)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {img(s.imageRef) && <img src={img(s.imageRef)} alt="" className="h-72 w-full rounded-xl object-cover md:h-full" />}
        </section>
      );
    case "services":
      return (
        <section className="bg-zinc-50 px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center text-2xl font-bold" style={{ color: primary }}>{t(s.heading)}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {s.items.map((it, j) => (
                <div key={j} className="rounded-xl border bg-white p-5" style={{ borderTopWidth: 3, borderTopColor: accent }}>
                  <h3 className="font-semibold">{t(it.title)}</h3>
                  <p className="mt-1 text-sm text-zinc-600">{t(it.desc)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    case "gallery":
      return (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold" style={{ color: primary }}>{t(s.heading)}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {s.imageRefs.map((r, j) => {
              const u = img(r);
              return u ? <img key={j} src={u} alt="" className="aspect-video w-full rounded-lg object-cover" /> : null;
            })}
          </div>
        </section>
      );
    case "location":
      return (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-4 text-2xl font-bold" style={{ color: primary }}>{t(s.heading)}</h2>
          {s.address && <p className="mb-4 text-zinc-600">{s.address}</p>}
          {(s.lat != null && s.lng != null) || s.address ? (
            <iframe
              className="h-80 w-full rounded-xl border"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(s.address ?? `${s.lat},${s.lng}`)}&z=16&output=embed`}
              title="Map"
            />
          ) : null}
        </section>
      );
    case "contact":
      return (
        <section className="px-6 py-16 text-white" style={{ background: primary }}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-2xl font-bold">{t(s.heading)}</h2>
            <div className="space-y-1 opacity-90">
              {s.address && <p>{s.address}</p>}
              {s.phone && <p>{s.phone}</p>}
              {s.email && <p>{s.email}</p>}
            </div>
          </div>
        </section>
      );
    default:
      return null;
  }
}
