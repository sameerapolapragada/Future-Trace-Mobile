/** Extract a display-friendly target role from free-text career goal input. */
export function inferTargetRole(careerGoal: string, fallback = "—"): string {
  const trimmed = careerGoal.trim();
  if (!trimmed) return fallback;

  const roleMatch = trimmed.match(/(?:into|to|as|become|transition.*?to)\s+(?:an?\s+)?(.+)/i);
  if (roleMatch?.[1]) {
    return roleMatch[1].replace(/\.$/, "").trim();
  }

  return trimmed.length > 80 ? fallback : trimmed;
}

export function formatRoleLabel(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split("/")
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
        .join("/")
    )
    .join(" ");
}
