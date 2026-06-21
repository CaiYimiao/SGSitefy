import { inngest } from "./client";
import { db } from "@/lib/db";
import { finalizeSite } from "@/lib/site-store";
import { extractBrand } from "@/agents/brand-extractor";
import { fillCopy } from "@/agents/copy-fill";
import { generateImages } from "@/agents/image-gen";
import { generateBespokeRegions } from "@/agents/bespoke-gen";
import { purchaseDomain, setNameservers, pollDomainStatus, PLATFORM_NAMESERVERS, PLATFORM_CNAME } from "@/agents/domain-setup";
import { pickLibraryTemplate } from "@/lib/pick-library-template";
import { extractSlots, extractBespokeRegions, categorizeSlots, fillChromeSlots, fillFactualSlots, fillImageSlots } from "@/lib/slot-utils";
import { SiteSpecSchema } from "@/lib/site-spec";
import type { CompanyProfile } from "@/types/company-profile";
import type { Registrar } from "@/agents/domain-setup";
import fs from "fs";

// ---------------------------------------------------------------------------
// generate-site workflow
// brand-extractor → pickTemplate → parallel [copy-fill ‖ image-gen] → merge → done
// ---------------------------------------------------------------------------

interface BuildRequested {
  buildId: string;
  siteId: string;
  profile: Partial<CompanyProfile>;
  description: string;
  photos: { id: string; url: string }[];
}

export const buildSite = inngest.createFunction(
  { id: "build-site", triggers: [{ event: "site/build.requested" }] },
  async ({ event, step }) => {
    const { buildId, siteId, profile, description, photos } = event.data as BuildRequested;
    const photoUrls = photos.map((p) => p.url);

    await step.run("mark-running", () =>
      db.build.update({ where: { id: buildId }, data: { status: "RUNNING" } })
    );

    // Step 1: brand-extractor
    const brand = await step.run("brand-extractor", () =>
      extractBrand(profile, description, photos.length)
    );

    // Step 2: pick a library template based on industry
    const { template, htmlPath } = await step.run("pick-template", () => {
      const industry = brand.industryVibe.split(" ")[0].toLowerCase();
      const industryMap: Record<string, string> = {
        wok: "fnb", halal: "fnb", zi: "fnb", cafe: "fnb", bakery: "fnb", catering: "fnb",
        precision: "industrial", laser: "industrial", welding: "industrial", fabricat: "industrial",
        engineering: "industrial", metal: "industrial", manufactur: "industrial",
        retail: "retail", trading: "retail", wholesale: "retail", distributor: "retail",
        tcm: "wellness", dental: "wellness", clinic: "wellness", spa: "wellness", aesthetic: "wellness",
        law: "services", accounting: "services", consult: "services", agency: "services",
      };
      // Try to match industry from the industryVibe phrase
      const vibe = brand.industryVibe.toLowerCase();
      const matched = Object.entries(industryMap).find(([k]) => vibe.includes(k));
      const industry_id = matched?.[1] ?? "services";
      return Promise.resolve(pickLibraryTemplate(industry_id));
    });

    // Step 3: extract + categorize slots from the chosen template
    const { copySlots } = await step.run("extract-slots", () => {
      const html = fs.readFileSync(htmlPath, "utf-8");
      const allSlots = extractSlots(html);
      const buckets = categorizeSlots(allSlots);
      return Promise.resolve({ allSlots, copySlots: buckets.copy });
    });

    // Re-read for use in later steps (Inngest serializes step return values)
    const allSlotsForMerge = await step.run("read-all-slots", () => {
      const html = fs.readFileSync(htmlPath, "utf-8");
      return Promise.resolve(extractSlots(html));
    });

    // Detect bespoke regions the template opts into (AI-generated custom HTML)
    const bespokeRegions = await step.run("extract-bespoke", () => {
      const html = fs.readFileSync(htmlPath, "utf-8");
      return Promise.resolve(extractBespokeRegions(html));
    });

    // Step 4: copy-fill, image-gen, and bespoke-gen run in parallel
    const [copyResult, images, bespoke] = await Promise.all([
      step.run("copy-fill", () =>
        fillCopy(profile, description, brand, copySlots, template.sections)
      ),
      step.run("image-gen", () =>
        generateImages(profile.nameEn ?? "Company", brand)
      ),
      step.run("bespoke-gen", () =>
        generateBespokeRegions(profile, description, brand, bespokeRegions, photoUrls)
      ),
    ]);

    // Step 5: merge all slot buckets
    const spec = await step.run("assemble-spec", async () => {
      const html = fs.readFileSync(htmlPath, "utf-8");
      const allSlots = extractSlots(html);
      const buckets = categorizeSlots(allSlots);

      const enrichedPhotoUrls = [
        images.heroUrl ?? photoUrls[0] ?? "",
        images.logoUrl ?? photoUrls[1] ?? "",
        ...images.serviceIconUrls,
        ...photoUrls.slice(2),
      ].filter(Boolean);

      const slots = {
        ...fillChromeSlots(buckets.chrome),
        ...fillFactualSlots(buckets.factual, profile),
        ...fillImageSlots(buckets.image, enrichedPhotoUrls),
        ...copyResult,
        // Meta slots always filled from profile
        "brand.name": profile.nameEn ?? "",
        "brand": profile.nameEn ?? "",
        "footer.name": profile.nameEn ?? "",
        "meta.title": `${profile.nameEn ?? "Company"} — Singapore`,
      };

      const assembled = {
        meta: {
          companyNameEn: profile.nameEn ?? "Company",
          companyNameZh: profile.nameZh,
          template: template.industry,
          templateId: template.id,
          bilingual: true,
        },
        theme: {
          primary: brand.primary,
          accent: brand.accent,
          neutral: brand.neutral,
        },
        seo: {
          title: (copyResult["seoTitle"] as string | undefined) ?? `${profile.nameEn ?? "Company"} — Singapore`,
          description: (copyResult["seoDescription"] as string | undefined) ?? "",
        },
        sections: [],
        slots,
        bespoke,
      };

      const valid = SiteSpecSchema.safeParse(assembled);
      if (!valid.success) throw new Error("Assembled spec invalid: " + valid.error.message);
      return valid.data;
    });

    // Step 6: persist + finalize
    await step.run("finalize", async () => {
      const site = await finalizeSite(siteId, spec, photos);
      await db.build.update({
        where: { id: buildId },
        data: { status: "DONE", previewUrl: `/s/${site.slug}` },
      });
      return { slug: site.slug };
    });
  }
);

// ---------------------------------------------------------------------------
// go-live workflow
// purchase domain → set nameservers → poll DNS (durable) → confirm SSL
// ---------------------------------------------------------------------------

interface GoLiveRequested {
  siteId: string;
  domain: string;
  registrar: Registrar;
  userId: string;
}

const DNS_MAX_POLLS = 20;
const DNS_POLL_DELAY = 60_000;

export const goLive = inngest.createFunction(
  { id: "go-live", triggers: [{ event: "site/go-live.requested" }] },
  async ({ event, step }) => {
    const { siteId, domain, registrar, userId } = event.data as GoLiveRequested;

    const { orderId } = await step.run("purchase-domain", () =>
      purchaseDomain({ domain, registrar, siteId })
    );

    await step.run("set-nameservers", () =>
      setNameservers(domain, registrar, PLATFORM_NAMESERVERS.vercel as unknown as string[])
    );

    await db.site.update({
      where: { id: siteId },
      data: { customDomain: domain, domainStatus: "PENDING" },
    }).catch(() => {});

    let dnsResolved = false;
    let sslProvisioned = false;

    for (let i = 0; i < DNS_MAX_POLLS; i++) {
      await step.sleep(`dns-poll-wait-${i}`, DNS_POLL_DELAY);
      const status = await step.run(`dns-poll-${i}`, () =>
        pollDomainStatus(domain, PLATFORM_CNAME)
      );
      dnsResolved = status.dnsResolved;
      sslProvisioned = status.sslProvisioned;
      if (dnsResolved && sslProvisioned) break;
    }

    await step.run("finalize-golive", async () => {
      const liveStatus = dnsResolved && sslProvisioned ? "LIVE" : "DNS_TIMEOUT";
      await db.site.update({
        where: { id: siteId },
        data: { domainStatus: liveStatus },
      }).catch(() => {});

      await inngest.send({
        name: "site/go-live.completed",
        data: { siteId, domain, liveUrl: `https://${domain}`, orderId, dnsResolved, sslProvisioned },
      });
      return { domain, live: liveStatus === "LIVE" };
    });
  }
);
