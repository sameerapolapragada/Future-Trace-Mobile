/** MVP supports technology careers only. */

export const TECHNOLOGY_DOMAIN_MESSAGE = "Please select a technology domain.";

const TECHNOLOGY_INDUSTRY_PATTERN =
  /\b(technology|technologies|tech|software|saas|information technology|\bit\b|computer|cyber|cybersecurity|cloud|devops|fintech|edtech|artificial intelligence|\bai\b|data|analytics|digital|platform|startup|semiconductor|electronics)\b/i;

/** True when industry text clearly indicates a technology domain. */
export function isTechnologyDomain(industry: string): boolean {
  const trimmed = industry.trim();
  if (!trimmed) return false;
  return TECHNOLOGY_INDUSTRY_PATTERN.test(trimmed);
}
