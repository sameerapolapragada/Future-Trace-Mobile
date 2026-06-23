export const DISRUPTION_RADAR_HELP_TITLE = "AI Disruption Radar";

export const DISRUPTION_RADAR_HELP_SUMMARY =
  "How much will this role fundamentally change because of AI?";

export const DISRUPTION_RADAR_HELP_BODY =
  "Rated Stable, Evolving, or At Risk based on your role's resilience, AI exposure, and how work in the field is shifting.\n\nStable means fewer fundamental changes expected. Evolving means the role is adapting as AI tools change typical workflows. At Risk means higher automation pressure or lower durability in this scan.\n\nThis is guidance to support your thinking, not real-time labor market data.";

export function formatDisruptionRadarHelpAlert(): { title: string; message: string } {
  return {
    title: DISRUPTION_RADAR_HELP_TITLE,
    message: `${DISRUPTION_RADAR_HELP_SUMMARY}\n\n${DISRUPTION_RADAR_HELP_BODY}`,
  };
}
