/**
 * Provenance shown in the product. shifto does not display any salary,
 * employment-growth or automation-probability figures: we could not verify
 * them against a dated source inside this build, so they are omitted rather
 * than estimated.
 */
export const CATALOG_VERSION = "v1";
export const CATALOG_DATE = "2026-11-14";

export const PROVENANCE = {
  catalog: {
    label: "shifto curated catalog",
    version: CATALOG_VERSION,
    asOf: CATALOG_DATE,
    description:
      "Roles, tasks, skill requirements, task categories and planning-hour estimates are editorial judgments written for this MVP. They are not a labor-market dataset, not an official occupational standard, and not a prediction of job loss.",
  },
  furtherReading: [
    {
      label: "O*NET OnLine: Customer Service Representatives (43-4051.00)",
      url: "https://www.onetonline.org/link/summary/43-4051.00",
      note: "Official US task and skill descriptions for the occupation. Linked for reference only; no figures are imported into the app.",
    },
    {
      label: "U.S. Bureau of Labor Statistics: Occupational Outlook Handbook, Customer Service Representatives",
      url: "https://www.bls.gov/ooh/office-and-administrative-support/customer-service-representatives.htm",
      note: "Official pay and outlook data. Linked for reference only; check the page for current figures.",
    },
  ],
} as const;
