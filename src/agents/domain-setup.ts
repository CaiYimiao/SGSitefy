/**
 * Domain-setup agent — register domain + poll DNS propagation + confirm SSL.
 * This is the "Go Live" flow. No LLM needed here; pure API orchestration.
 * The polling is handled by Inngest step.sleep / step.run loops (durable).
 */

export type Registrar = "cloudflare" | "namecheap" | "godaddy";

export interface DomainOrder {
  domain: string;
  registrar: Registrar;
  siteId: string;
  /** Years to register. Default 1. */
  years?: number;
}

export interface DomainStatus {
  registered: boolean;
  nameserversSet: boolean;
  dnsResolved: boolean;
  sslProvisioned: boolean;
  liveUrl?: string;
}

/** Stubbed registrar purchase — replace with real registrar API calls. */
export async function purchaseDomain(order: DomainOrder): Promise<{ orderId: string }> {
  // TODO: Integrate real Cloudflare / Namecheap / GoDaddy domain purchase APIs.
  // For now returns a stub so the Inngest workflow can proceed to polling.
  console.log(`[domain-setup] Purchasing ${order.domain} via ${order.registrar}`);
  return { orderId: `stub-${Date.now()}` };
}

/** Point the domain's nameservers to the platform (Vercel / Cloudflare Pages). */
export async function setNameservers(
  domain: string,
  registrar: Registrar,
  nameservers: string[]
): Promise<void> {
  // TODO: Call registrar API to update NS records.
  console.log(`[domain-setup] Setting NS for ${domain} via ${registrar}:`, nameservers);
}

/** Check if the domain resolves to the expected IP/CNAME. */
export async function checkDnsResolved(domain: string, expectedCname: string): Promise<boolean> {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`);
    if (!res.ok) return false;
    const data = await res.json();
    const answers: { data: string }[] = data?.Answer ?? [];
    return answers.some((a) => a.data.includes(expectedCname));
  } catch {
    return false;
  }
}

/** Check if the domain has a valid TLS certificate (via HTTPS HEAD). */
export async function checkSslProvisioned(domain: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${domain}`, { method: "HEAD" });
    return res.ok || res.status < 400;
  } catch {
    return false;
  }
}

/**
 * Build a polling status snapshot.
 * Called by the Inngest go-live workflow on each iteration.
 */
export async function pollDomainStatus(
  domain: string,
  expectedCname: string
): Promise<Pick<DomainStatus, "dnsResolved" | "sslProvisioned">> {
  const [dnsResolved, sslProvisioned] = await Promise.all([
    checkDnsResolved(domain, expectedCname),
    checkSslProvisioned(domain),
  ]);
  return { dnsResolved, sslProvisioned };
}

/** Platform nameservers — update these to match your hosting provider. */
export const PLATFORM_NAMESERVERS = {
  vercel: ["ns1.vercel-dns.com", "ns2.vercel-dns.com"],
  cloudflarePages: ["atticus.ns.cloudflare.com", "bree.ns.cloudflare.com"],
} as const;

export const PLATFORM_CNAME = "cname.vercel-dns.com"; // adjust to your deploy target
