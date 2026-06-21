/** User billing tier — maps to product entitlements in Supabase. */
export type UserPlan = "free" | "career_transition";

/** Ordered resolution sources (cheapest first). */
export type AiDataSource =
  | "static"
  | "cache"
  | "openrouter_free"
  | "gemini_flash"
  | "gemini_pro";

export type AiModelId =
  | "static"
  | "cache"
  | "openai/gpt-oss-120b:free"
  | "openai/gpt-oss-20b:free"
  | "openrouter/free"
  | "google/gemini-2.5-flash"
  | "google/gemini-2.5-pro";

export type AiFeature =
  | "career_profile_scan"
  | "current_role_analysis"
  | "career_readiness_score"
  | "skill_gap_summary"
  | "career_recommendations_limited"
  | "career_xray_preview"
  | "career_xray_report"
  | "top_target_roles"
  | "transferability_score"
  | "salary_analysis"
  | "skill_gap_analysis"
  | "career_risk_score"
  | "weekly_milestone_update"
  | "transition_chat"
  | "dynamic_recommendations"
  | "career_coaching"
  | "resume_suggestions"
  | "interview_guidance"
  | "market_radar_summary"
  | "premium_roadmap_refresh";

export type AiAccessContext = {
  plan: UserPlan;
  /** Active AI Career Transition subscription (`has_radar`). */
  hasTransitionSubscription: boolean;
  /** One-time Career X-Ray purchase for the relevant scan. */
  hasCareerXrayPurchase: boolean;
  /** Existing generated X-Ray result for scan — never regenerate. */
  hasExistingXrayResult: boolean;
  /** Existing completed scan for input hash — reuse instead of LLM. */
  hasExistingScanResult: boolean;
  /** Days since last Gemini Pro roadmap refresh (null = never). */
  daysSinceLastPremiumRefresh: number | null;
  scanId?: string;
  goalId?: string;
};

export type AiRouteDecision = {
  feature: AiFeature;
  allowed: boolean;
  /** When blocked, human-readable reason for UI or logs. */
  reason?: string;
  /** Where to load data from; null when blocked. */
  source: AiDataSource | "existing_record" | null;
  model: AiModelId | null;
  /** OpenRouter models to try in order when source is `openrouter_free`. */
  modelChain?: AiModelId[];
  /** Skip LLM entirely and return persisted output. */
  reuseExisting: boolean;
  /** Cache key when source is `cache`. */
  cacheKey?: string;
};

export type AiOrchestrationRequest = {
  feature: AiFeature;
  context: AiAccessContext;
  cacheKey?: string;
  /** Static DB answer available for this request. */
  hasStaticAnswer?: boolean;
  /** Valid unexpired cache hit. */
  hasCacheHit?: boolean;
};

export type AiOrchestrationResult = AiRouteDecision;

export type CareerXrayPersistedFields = {
  top_roles: unknown;
  transferability_score: unknown;
  salary_ranges: unknown;
  skill_gaps: unknown;
  generated_at: string;
};

export type CareerTransitionPersistedFields = {
  current_goal: unknown;
  roadmap: unknown;
  milestones: unknown;
  market_signals: unknown;
  last_refresh: string | null;
  last_premium_refresh: string | null;
};

/** Minimum days between Gemini Pro premium roadmap refreshes. */
export const PREMIUM_REFRESH_COOLDOWN_DAYS = 30;

/** Free-tier scan cadence. */
export const FREE_SCAN_COOLDOWN_DAYS = 7;
