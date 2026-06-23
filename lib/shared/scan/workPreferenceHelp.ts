export const WORK_PREFERENCE_OPTIONS = [
  {
    option: "Technical",
    description: "Hands-on work — building, coding, data, engineering, or deep technical tool use.",
  },
  {
    option: "Business",
    description: "Strategy and people-facing work — analysis, operations, consulting, product, or management.",
  },
  {
    option: "Hybrid",
    description: "A mix of both — you regularly work across technical delivery and business responsibilities.",
  },
] as const;

export const WORK_PREFERENCE_SCAN_IMPACT =
  "Your choice lightly adjusts the Career Resilience Score when it aligns with your role titles (for example, Technical + an engineering role). It does not change AI exposure scores, recommendations, or most results copy.";

export function formatWorkPreferenceHelpAlert(): { title: string; message: string } {
  const options = WORK_PREFERENCE_OPTIONS.map(
    ({ option, description }) => `${option}\n${description}`
  ).join("\n\n");

  return {
    title: "Work preference",
    message: `${options}\n\nHow it affects your scan\n${WORK_PREFERENCE_SCAN_IMPACT}`,
  };
}
