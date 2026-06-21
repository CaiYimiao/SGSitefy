import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SGSitefy — your SME website, built in minutes",
  description:
    "Enter your UEN, add a few photos, describe what you do — SGSitefy auto-builds a live, bilingual landing page for your Singapore business.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics beforeSend={(event) => {
          try {
            const consent = JSON.parse(localStorage.getItem('sgsitefy_cookie_consent') ?? 'null');
            return consent?.performance ? event : null;
          } catch { return null; }
        }} />
      </body>
    </html>
  );
}
