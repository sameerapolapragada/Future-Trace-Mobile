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

export type NormalizedScanInput = {
  currentRole: string;
  targetRole: string;
  industry: string;
  yearsExperience: number;
  skills: string;
  tools: string;
  careerGoal: string;
  workPreference: WorkPreferenceNormalized;
};

export type RoleScanProfile = {
  resilienceScore: number;
  aiExposureLevel: AIExposureLevel;
  aiExposureLabel: string;
  strengths: string[];
  vulnerabilities: string[];
  opportunityZones: string[];
};

export type FreeScanResult = {
  currentRole: string;
  targetRole: string;
  currentRoleProfile: RoleScanProfile;
  targetRoleProfile: RoleScanProfile;
  summary: string;
  initialRoleRecommendations: string[];
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
  source: "rule_based_v1";
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
