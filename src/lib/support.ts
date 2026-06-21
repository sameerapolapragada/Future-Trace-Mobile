export const SUPPORT_EMAIL = "support@futuretrace.ai";

export function supportMailtoUrl(subject = "Future Trace Support"): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
