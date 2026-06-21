import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ResumeDraftBanner } from "@/components/resume-draft-banner";
import { BreathingOrbs } from "@/components/breathing-orbs";
import { Plus, ExternalLink, Loader2, CheckCircle2, AlertCircle, Globe } from "lucide-react";

type Status = { label: string; cls: string; icon: React.ReactNode; pulse?: boolean };

function statusOf(raw: string): Status {
  const s = raw.toUpperCase();
  if (["BUILDING", "RUNNING", "QUEUED", "PENDING"].includes(s))
    return { label: "Building", cls: "bg-amber-100 text-amber-700", icon: <Loader2 className="size-3 animate-spin" /> };
  if (["LIVE", "PUBLISHED"].includes(s))
    return { label: s === "LIVE" ? "Live" : "Published", cls: "bg-emerald-100 text-emerald-700", icon: <Globe className="size-3" /> };
  if (["DONE", "READY"].includes(s))
    return { label: "Ready", cls: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="size-3" /> };
  if (s === "FAILED")
    return { label: "Failed", cls: "bg-red-100 text-red-700", icon: <AlertCircle className="size-3" /> };
  return { label: "Draft", cls: "bg-secondary text-muted-foreground", icon: null };
}

export default async function DashboardPage() {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) redirect("/signin");

  const memberships = await db.membership.findMany({
    where: { userId: uid },
    include: { org: { include: { sites: { orderBy: { createdAt: "desc" } } } } },
  });
  const sites = memberships.flatMap((m) => m.org.sites);

  return (
    <main className="container relative z-10 max-w-5xl py-12">
      <BreathingOrbs />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your sites</h1>
          <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/new"><Plus className="size-4" /> New site</Link>
          </Button>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button variant="outline" type="submit">Sign out</Button>
          </form>
        </div>
      </div>

      <ResumeDraftBanner />

      {sites.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Plus className="size-6" />
          </div>
          <p className="mb-1 font-medium">No sites yet</p>
          <p className="mb-5 text-sm text-muted-foreground">Build your first bilingual business site in minutes.</p>
          <Button asChild><Link href="/new">Build your first site <ExternalLink className="size-4" /></Link></Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((s) => {
            const st = statusOf(s.status);
            const building = st.label === "Building";
            return (
              <div key={s.id} className="flex flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="truncate font-semibold" title={s.slug}>
                    {s.customDomain ?? s.slug}
                  </span>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>
                    {st.icon}{st.label}
                  </span>
                </div>
                <p className="mb-4 truncate text-xs text-muted-foreground">/s/{s.slug}</p>
                <div className="mt-auto flex gap-2">
                  <Button asChild size="sm" variant={building ? "outline" : "default"} className="flex-1">
                    <a href={`/s/${s.slug}`} target="_blank" rel="noopener">
                      {building ? "Preview" : "View site"} <ExternalLink className="size-3" />
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/new`}>Edit</Link>
                  </Button>
                </div>
                {building && (
                  <p className="mt-3 text-xs text-amber-600">Still building — refresh in a moment.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
