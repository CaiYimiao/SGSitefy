"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, FileEdit } from "lucide-react";

const STEP_LABELS = ["UEN", "Details", "Photos", "Describe"];

/** Shows a "continue where you left off" card if an unfinished wizard draft exists. */
export function ResumeDraftBanner() {
  const [draft, setDraft] = React.useState<{ step: number; name?: string } | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("sitefy_wizard_draft");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d && (d.uen || d.profile?.nameEn)) {
        setDraft({ step: typeof d.step === "number" ? d.step : 0, name: d.profile?.nameEn ?? d.uen });
      }
    } catch { /* ignore */ }
  }, []);

  if (!draft) return null;

  return (
    <Link
      href="/new"
      className="mb-6 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <FileEdit className="size-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">Continue your draft{draft.name ? ` — ${draft.name}` : ""}</p>
        <p className="text-xs text-muted-foreground">
          You left off at the {STEP_LABELS[draft.step] ?? "build"} step. Pick up where you stopped.
        </p>
      </div>
      <ArrowRight className="size-4 text-primary" />
    </Link>
  );
}
