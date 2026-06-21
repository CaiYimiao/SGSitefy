# Certification logos

The wizard (`preview.html` → industry step) shows **industry-specific** certifications
and renders each one's official mark from `images/certs/<slug>.png`. Until a PNG is
present, a clean monogram placeholder shows instead (never a broken image).

Drop the official logo files here using these exact filenames (PNG, transparent,
~64–128px square). These marks are owned by their respective bodies — display them
only for businesses that actually hold the certification.

| File | Certification | Industries | Official source |
|---|---|---|---|
| `bizsafe-star.png` | bizSAFE Star | industrial, (all) | WSH Council — tal.sg / wshc |
| `bizsafe-3.png` | bizSAFE Level 3 | all | WSH Council — tal.sg / wshc |
| `iso-9001.png` | ISO 9001 (Quality) | industrial, retail, services | Your SAC-accredited certification body |
| `iso-14001.png` | ISO 14001 (Environmental) | industrial | Your certification body |
| `iso-45001.png` | ISO 45001 (OHS) | industrial | Your certification body |
| `halal-muis.png` | Halal (MUIS) | **fnb only** | muis.gov.sg / warees.sg |
| `sfa.png` | SFA Licensed | fnb | sfa.gov.sg |
| `iso-22000.png` | ISO 22000 (Food Safety) | fnb | Your certification body |
| `healthier-choice.png` | Healthier Choice Symbol | fnb | hpb.gov.sg |
| `casetrust.png` | CaseTrust | retail | case.org.sg |
| `casetrust-spa.png` | CaseTrust (Spa & Wellness) | wellness | case.org.sg |
| `sqc.png` | Singapore Quality Class | retail | enterprisesg.gov.sg |
| `moh.png` | MOH Licensed | wellness | moh.gov.sg |
| `tcm.png` | TCM Practitioners Board | wellness | healthprofessionals.gov.sg |
| `iso-27001.png` | ISO 27001 (Infosec) | services | Your certification body |
| `isca.png` | ISCA Accredited | services | isca.org.sg |

> The certification list per industry is defined in `preview.html` → `var CERTS`.
> Add/remove entries there; add a matching `<slug>.png` here.
