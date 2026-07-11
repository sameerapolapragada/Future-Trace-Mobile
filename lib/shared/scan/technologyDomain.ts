/** Supported industries for the MVP picklist (optional on the form). */

export const TECHNOLOGY_DOMAIN_MESSAGE = "Please choose an industry from the suggested list.";

/** Curated industries shown in the scan flow (A–Z). Includes Healthcare. Local fallback when Supabase is offline. */
export const SUPPORTED_INDUSTRY_OPTIONS = [
  "Consulting",
  "Education",
  "Financial Services",
  "Government",
  "Healthcare",
  "Manufacturing",
  "Media & Entertainment",
  "Retail & E-commerce",
  "SaaS",
  "Technology",
] as const;

export type SupportedIndustry = (typeof SUPPORTED_INDUSTRY_OPTIONS)[number];

/** @deprecated Use SUPPORTED_INDUSTRY_OPTIONS — kept for older imports. */
export const TECHNOLOGY_INDUSTRY_OPTIONS = SUPPORTED_INDUSTRY_OPTIONS;

export const DEFAULT_TECHNOLOGY_INDUSTRY = "Technology";

/** True when industry is empty (optional) or matches a supported picklist value. */
export function isSupportedIndustry(
  industry: string,
  options: readonly string[] = SUPPORTED_INDUSTRY_OPTIONS
): boolean {
  const trimmed = industry.trim();
  if (!trimmed) return true;
  return options.some((entry) => entry.toLowerCase() === trimmed.toLowerCase());
}

/** @deprecated Prefer isSupportedIndustry — Healthcare and other picklist industries are allowed. */
export function isTechnologyDomain(industry: string, options?: readonly string[]): boolean {
  return isSupportedIndustry(industry, options);
}

/** Filter industries by typed query; results stay alphabetical. */
export function filterSupportedIndustries(
  query: string,
  options: readonly string[] = SUPPORTED_INDUSTRY_OPTIONS,
  limit = 10
): string[] {
  const normalized = query.trim().toLowerCase();
  const source = [...options].sort((a, b) => a.localeCompare(b));
  if (!normalized) return source.slice(0, limit);
  return source.filter((industry) => industry.toLowerCase().includes(normalized)).slice(0, limit);
}
