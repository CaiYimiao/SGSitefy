"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteSiteButton({ siteId, name }: { siteId: string; name: string }) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(false);
  const router = useRouter();

  async function del() {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/sites/${siteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setOpen(false);
      router.refresh();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} aria-label={`Delete ${name}`} title="Delete site">
        <Trash2 className="size-3.5" />
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !busy) setOpen(false); }}
        >
          <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-xl">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 className="size-5" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">Delete this site?</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{name}</span> and its generated content will be permanently removed. This can&apos;t be undone.
            </p>
            {error && <p className="mb-3 text-sm text-red-600">Couldn&apos;t delete — please try again.</p>}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              <Button
                size="sm"
                onClick={del}
                disabled={busy}
                className="bg-red-600 text-white shadow hover:bg-red-700"
              >
                {busy ? <><Loader2 className="size-3.5 animate-spin" /> Deleting…</> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
