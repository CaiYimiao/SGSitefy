/**
 * CompanyProfile — the merged, enriched view of an SME, assembled from the
 * registry (ACRA), Google Places, Facebook and the owner's own inputs.
 * This is the single object handed to Claude to plan the site.
 */
export interface CompanyPhoto {
  id: string;
  url: string;
  source?: "upload" | "google" | "facebook";
  caption?: string;
}

export interface CompanyProfile {
  uen?: string;
  nameEn?: string;
  nameZh?: string;
  ssic?: string; // industry (SSIC code or description)
  address?: string;
  incorporationDate?: string;
  status?: string;
  phone?: string;
  email?: string;
  website?: string;
  lat?: number;
  lng?: number;
  hours?: string;
  photos?: CompanyPhoto[];
  source?: "acra" | "google" | "facebook" | "manual";
}
