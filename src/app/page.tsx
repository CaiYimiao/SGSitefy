import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ScanLine, Sparkles, Globe } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="container flex items-center justify-between py-5">
        <span className="text-lg font-bold text-primary">SGSitefy</span>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link href="/signin">Sign in</Link></Button>
          <Button asChild variant="outline"><Link href="/dashboard">Dashboard</Link></Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="container flex flex-col items-center gap-6 py-24 text-center">
        <span className="rounded-full border px-4 py-1 text-xs font-medium text-muted-foreground">
          For Singapore SMEs · EN / 中文
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Your business website, built in <span className="text-primary">minutes</span>.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Enter your UEN, add a few photos, and describe what you do. SGSitefy pulls the rest from
          public business data and builds you a live, bilingual landing page — no designer needed.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/new">
              Build my site <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#how">How it works</Link>
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container grid gap-6 pb-24 sm:grid-cols-3">
        {[
          { icon: ScanLine, title: "1 · Enter your UEN", body: "We prefill your legal name, address and industry from the registry." },
          { icon: Sparkles, title: "2 · Add photos + a sentence", body: "Claude writes your copy and lays out the page; agents build the UI." },
          { icon: Globe, title: "3 · Publish", body: "Go live on yourname.sgsitefy.com or your own domain — bilingual, instantly." },
        ].map((s) => (
          <div key={s.title} className="rounded-xl border p-6">
            <s.icon className="mb-3 text-primary" />
            <h3 className="mb-1 font-semibold">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
