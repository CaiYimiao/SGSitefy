import { createSite, finalizeSite } from "@/lib/site-store";
import type { SiteSpec } from "@/lib/site-spec";
import type { CompanyProfile } from "@/types/company-profile";

export interface BuildInput {
  spec: SiteSpec;
  profile: Partial<CompanyProfile>;
  photos: { id: string; url: string }[];
  userId?: string;
}

/**
 * Synchronous build: spec + template → a persisted, published Site at /s/{slug}.
 * The async path (Inngest) uses the same createSite + finalizeSite primitives.
 * The Antigravity agent layer plugs in for bespoke (non-template) layouts.
 */
export async function buildAndPersistSite(input: BuildInput): Promise<{ slug: string; url: string }> {
  const { spec, profile, photos, userId } = input;
  const { siteId, slug } = await createSite({
    profile,
    userId,
    nameEn: spec.meta.companyNameEn,
    template: spec.meta.template,
  });
  await finalizeSite(siteId, spec, photos);
  return { slug, url: `/s/${slug}` };
}
