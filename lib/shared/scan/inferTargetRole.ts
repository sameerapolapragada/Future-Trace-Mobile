/** Extract a display-friendly target role from free-text career goal input. */
export function inferTargetRole(careerGoal: string, fallback = "—"): string {
  const trimmed = careerGoal.trim();
  if (!trimmed) return fallback;

  const roleMatch = trimmed.match(/(?:into|to|as|become|transition.*?to)\s+(?:an?\s+)?(.+)/i);
  if (roleMatch?.[1]) {
    return formatRoleLabel(roleMatch[1].replace(/\.$/, "").trim());
  }

  return trimmed.length > 80 ? fallback : formatRoleLabel(trimmed);
}

const PRESERVE_ACRONYMS = new Set([
  "ai",
  "api",
  "ba",
  "bi",
  "cpa",
  "crm",
  "hr",
  "it",
  "ml",
  "pm",
  "qa",
  "rn",
  "sf",
  "sfdc",
  "sre",
  "ui",
  "ux",
]);

const SPECIAL_WORDS: Record<string, string> = {
  salesforce: "Salesforce",
  agentforce: "Agentforce",
  hubspot: "HubSpot",
  revops: "RevOps",
  devops: "DevOps",
  ios: "iOS",
  macos: "macOS",
};

function formatWord(word: string): string {
  if (!word) return word;

  const lower = word.toLowerCase();
  if (SPECIAL_WORDS[lower]) return SPECIAL_WORDS[lower]!;
  if (PRESERVE_ACRONYMS.has(lower)) return lower.toUpperCase();

  if (/^[A-Z0-9/+.-]{2,}$/.test(word)) return word;

  return word
    .split("/")
    .map((part) => {
      if (!part) return part;
      const partLower = part.toLowerCase();
      if (SPECIAL_WORDS[partLower]) return SPECIAL_WORDS[partLower]!;
      if (PRESERVE_ACRONYMS.has(partLower)) return partLower.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("/");
}

/** Consistent display formatting for role titles entered by users. */
export function formatRoleLabel(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(/\s+/)
    .map(formatWord)
    .join(" ");
}
