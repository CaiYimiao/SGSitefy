import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink } from "lucide-react";

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
    <main className="container max-w-4xl py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your sites</h1>
          <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/new"><Plus /> New site</Link>
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

      {sites.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          No sites yet. <Link href="/new" className="text-primary underline">Build your first one</Link>.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sites.map((s) => (
            <div key={s.id} className="rounded-xl border p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{s.slug}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{s.status}</span>
              </div>
              <a
                href={`/s/${s.slug}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-sm text-primary"
              >
                /s/{s.slug} <ExternalLink className="size-3" />
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
