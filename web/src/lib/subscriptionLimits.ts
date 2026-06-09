export const FREE_SCANS_PER_WEEK = 1;

export const TRANSITION_PLAN_FEATURES = [
  "10 career scans/month",
  "10 Career X-Rays/month",
  "1 active transition goal",
  "3 goal switches/month",
  "Weekly milestones",
  "Progress tracking",
  "Smart reminders",
] as const;

export const UPGRADE_MONTHLY_SCANS_PATH = "/upgrade?product=transition&reason=monthly-scans";
export const UPGRADE_MONTHLY_XRAYS_PATH = "/upgrade?product=transition&reason=monthly-xrays";
export const UPGRADE_GOAL_SWITCHES_PATH = "/upgrade?product=transition&reason=goal-switches";
export const UPGRADE_WEEKLY_SCAN_PATH = "/upgrade?product=transition&reason=weekly-scan";
