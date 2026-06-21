import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import type { CompanyProfile } from "@/types/company-profile";
import type { SiteSpec } from "@/lib/site-spec";

const json = (v: unknown) => JSON.parse(JSON.stringify(v));

export async function uniqueSlug(seed: string): Promise<string> {
  const base = slugify(seed);
  let slug = base;
  let n = 1;
  while (await db.site.findUnique({ where: { slug } })) {
    n++;
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Provision org (+ membership if logged in) + company + a Site shell. */
export async function createSite(opts: {
  profile: Partial<CompanyProfile>;
  userId?: string;
  nameEn: string;
  template?: string;
  status?: "DRAFT" | "BUILDING";
}): Promise<{ orgId: string; siteId: string; slug: string }> {
  const slug = await uniqueSlug(opts.nameEn || opts.profile.nameEn || "site");
  const org = await db.organization.create({
    data: {
      name: opts.nameEn,
      members: opts.userId ? { create: { userId: opts.userId } } : undefined,
      company: {
        create: {
          uen: opts.profile.uen,
          nameEn: opts.profile.nameEn,
          nameZh: opts.profile.nameZh,
          ssic: opts.profile.ssic,
          address: opts.profile.address,
          phone: opts.profile.phone,
          email: opts.profile.email,
          source: opts.profile.source,
        },
      },
      sites: { create: { slug, template: opts.template ?? "industrial", status: opts.status ?? "BUILDING" } },
    },
    include: { sites: true },
  });
  return { orgId: org.id, siteId: org.sites[0].id, slug };
}

/** Attach the generated spec + photos to a Site and publish it. */
export async function finalizeSite(
  siteId: string,
  spec: SiteSpec,
  photos: { id: string; url: string }[]
): Promise<{ id: string; slug: string }> {
  return db.site.update({
    where: { id: siteId },
    data: {
      spec: json(spec),
      themeTokens: json(spec.theme),
      status: "PUBLISHED",
      assets: { create: photos.map((p) => ({ url: p.url, slot: p.id, source: "upload" })) },
    },
    select: { id: true, slug: true },
  });
}
