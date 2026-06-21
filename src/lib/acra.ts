import type { CompanyProfile } from "@/types/company-profile";

/**
 * ACRA company lookup via data.gov.sg's datastore API.
 *
 * COMPLIANCE: use the official data.gov.sg ACRA datasets (or your own ingested
 * copy). Do NOT scrape SGPBusiness / Companies.sg — their ToS prohibit it.
 *
 * ACRA publishes "Entities" data across several datasets; field names differ
 * between them. Configure ACRA_RESOURCE_ID for the dataset/table you query and
 * adjust the field mapping below to match its columns.
 */
const DATASTORE = "https://data.gov.sg/api/action/datastore_search";

export async function lookupUen(uen: string): Promise<Partial<CompanyProfile>> {
  const resourceId = process.env.ACRA_RESOURCE_ID;

  // No dataset wired yet → return a shell so the wizard still flows (user fills in).
  if (!resourceId) return { uen, source: "manual" };

  const url = `${DATASTORE}?resource_id=${encodeURIComponent(resourceId)}&q=${encodeURIComponent(uen)}&limit=1`;
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) return { uen, source: "manual" };

  const json = (await res.json()) as {
    result?: { records?: Record<string, string>[] };
  };
  const rec = json.result?.records?.[0];
  if (!rec) return { uen, source: "manual" };

  return {
    uen,
    nameEn: rec.entity_name ?? rec.company_name,
    address: [rec.block, rec.street_name, rec.building_name, rec.postal_code]
      .filter(Boolean)
      .join(", ") || undefined,
    ssic: rec.primary_ssic_description ?? rec.primary_ssic_code,
    incorporationDate: rec.registration_incorporation_date ?? rec.uen_issue_date,
    status: rec.entity_status_description ?? rec.entity_status,
    source: "acra",
  };
}
