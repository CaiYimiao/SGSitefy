"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

/**
 * Consent-gated analytics. Reads the cookie-consent choice from localStorage
 * and only sends events if the visitor allowed the "performance" category.
 * Must be a client component because beforeSend is a function.
 */
export function Analytics() {
  return (
    <VercelAnalytics
      beforeSend={(event) => {
        try {
          const consent = JSON.parse(
            localStorage.getItem("sgsitefy_cookie_consent") ?? "null"
          );
          return consent?.performance ? event : null;
        } catch {
          return null;
        }
      }}
    />
  );
}
