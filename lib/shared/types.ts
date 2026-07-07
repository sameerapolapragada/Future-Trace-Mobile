export type AIExposureLevel = "low" | "medium" | "high";
export type WorkPreference = "Technical" | "Business" | "Hybrid";
export type WorkPreferenceNormalized = "technical" | "business" | "hybrid";

export type ScanFormInput = {
  currentRole: string;
  targetRole: string;
  industry: string;
  yearsExperience: string;
  skills: string;
  tools: string;
  careerGoal: string;
  workPreference: WorkPreference;
};

export type RoleMatchStatus = "matched" | "partial_match" | "unsupported" | "no_match";
export type RoleMatchConfidenceLabel = "excellent" | "high" | "medium" | "low" | "none";
export type RoleMatchAnalysisQuality = "high" | "medium" | "low" | "none";
export type RoleMatchUserAction =
  | "auto_accepted"
  | "confirmed"
  | "corrected"
  | "rejected"
  | "needs_more_info"
  | "approximate_continue"
  | "abandoned";

export type RoleMatchSnapshot = {
  roleMatchEventId?: string;
  originalRoleInput: string;
  normalizedRole: string | null;
  roleFamily: string | null;
  matchStatus: RoleMatchStatus;
  confidenceScore: number;
  confidenceLabel: RoleMatchConfidenceLabel;
  suggestedRoles: { role: string; confidence: number }[];
  needsMoreInfo: boolean;
  analysisQuality: RoleMatchAnalysisQuality;
  genericResultFlag: boolean;
  userAction?: RoleMatchUserAction;
  userSelectedRole?: string;
};

export type NormalizedScanInput = {
  currentRole: string;
  targetRole: string;
  /** Canonical current-role profile used for scoring and recommendations. */
  identifiedCareerProfile: string;
  industry: string;
  yearsExperience: number;
  skills: string;
  tools: string;
  careerGoal: string;
  workPreference: WorkPreferenceNormalized;
  /** Role match metadata from smarter role matching flow. */
  roleMatch?: RoleMatchSnapshot;
  /** Raw user-entered current role before normalization. */
  originalCurrentRole?: string;
  /** Raw user-entered target role before normalization. */
  originalTargetRole?: string;
};

export type RoleScanProfile = {
  resilienceScore: number;
  /** Deterministic 0–100 AI exposure score from the scoring engine. */
  aiExposureScore?: number;
  aiExposureLevel: AIExposureLevel;
  aiExposureLabel: string;
  strengths: string[];
  vulnerabilities: string[];
  opportunityZones: string[];
};

export type ExposureMeta = {
  onetOccupationCode?: string;
  onetOccupationTitle?: string;
  /** 0–1 fuzzy match strength when an occupational benchmark was found. */
  matchConfidence?: number;
  matchedVia: "local_index" | "api" | "cache" | "fallback_archetype";
  keyExposureDrivers: string[];
  affectedTasks: string[];
  protectedStrengths: string[];
};

export type CareerDirectionRecommendation = {
  role: string;
  transferabilityScore: number;
  why: string;
};

export type FreeScanResult = {
  currentRole: string;
  targetRole: string;
  /** Canonical career profile identified from the user's current role input. */
  identifiedCareerProfile: string;
  /** Original user-entered current role for transparency. */
  originalRoleInput?: string;
  /** Original user-entered target role for transparency. */
  originalTargetRoleInput?: string;
  /** Normalized role used for analysis. */
  normalizedCurrentRole?: string;
  /** Matched target role used for analysis. */
  normalizedTargetRole?: string;
  roleMatchStatus?: RoleMatchStatus;
  roleMatchUserAction?: RoleMatchUserAction;
  analysisQualityLabel?: string;
  currentRoleProfile: RoleScanProfile;
  targetRoleProfile: RoleScanProfile;
  summary: string;
  initialRoleRecommendations: CareerDirectionRecommendation[];
  /** O*NET + scoring metadata — informational only. */
  exposureMeta?: ExposureMeta;
  /** Phase 2: paid Career X-Ray preview — omitted in Phase 1 mobile. */
  xrayPreview?: {
    readinessScore: number;
    transitionDifficulty: "low" | "medium" | "high";
    topRoleTeaser: string;
    unlockMessage: string;
  };
};

export type StoredScan = {
  id: string;
  createdAt: string;
  input: NormalizedScanInput;
  result: FreeScanResult;
  source: "rule_based_v1" | "hybrid_v1";
  roleMatchEventId?: string;
};

export type DisruptionRadarSnapshot = {
  headline: string;
  summary: string;
  readinessScore: number;
  readinessLabel: string;
  subMetrics: { label: string; value: number; tone: "accent" | "gold" | "success" | "danger" }[];
  strengths: string[];
  watchAreas: string[];
  signals: {
    title: string;
    detail: string;
    trend: "up" | "flat" | "down";
  }[];
};

export type WaitlistEntry = {
  email: string;
  currentRole?: string;
  targetRole?: string;
  source?: string;
};

/** Phase 2 extension points — not implemented in Phase 1. */
export type Phase2Capabilities = {
  careerXrayPurchase: false;
  aiCareerTransition: false;
  llmGeneration: false;
};
