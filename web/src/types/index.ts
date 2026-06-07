export type RiskLevel = "low" | "medium" | "high";
export type AIExposureLevel = "low" | "medium" | "high";
export type RadarSignalLabel = "High Growth" | "Stable" | "Declining" | "Emerging";

export type CareerScan = {
  id: string;
  title: string;
  role: string;
  industry: string;
  date: string;
  resilienceScore: number;
  aiExposureLevel: AIExposureLevel;
  aiExposure: number;
  riskLevel: RiskLevel;
  summary: string;
  currentSkills: string[];
  strengths: string[];
  vulnerabilities: string[];
  opportunityZones: string[];
  transitionRoles: string[];
};

export type RadarMarketTrajectory = "Improving" | "Stable" | "Declining";

export type RadarSignalItem = {
  title: string;
  summary: string;
  category: RadarSignalLabel;
  impact: RiskLevel;
  trend: "up" | "down" | "flat";
};

export type RadarInsights = {
  marketTrajectory: {
    role: string;
    status: RadarMarketTrajectory;
    summary: string;
  };
  skillGapChanges: RadarSignalItem[];
  emergingSkills: RadarSignalItem[];
  roleDemandSignals: RadarSignalItem[];
  personalizedAlerts: RadarSignalItem[];
};

export type RadarMatchLevel = "High" | "Medium" | "Low";

export type RadarDashboard = {
  readinessScore: number;
  readinessLabel: string;
  peerPercentile: string;
  scoreTrend: string;
  subMetrics: { label: string; value: number; barClass: string }[];
  strengths: string[];
  weaknesses: string[];
  careerPaths: {
    title: string;
    description: string;
    match: RadarMatchLevel;
    salary: string;
  }[];
  marketDemand: {
    title: string;
    openings: string;
    salary: string;
    demandTag: string;
  }[];
  skillGaps: { name: string; current: number; target: number }[];
  learningPath: {
    title: string;
    description: string;
    progress: number;
    duration: string;
    points: string;
  };
  careerXRay: {
    currentRole: string;
    targetRole: string;
    matchScore: number;
  };
};

export type RadarSignal = {
  id: string;
  title: string;
  category: RadarSignalLabel;
  impact: RiskLevel;
  trend: "up" | "down" | "flat";
  summary: string;
  date: string;
};

export type UserProfile = {
  name: string;
  email: string;
  title: string;
  industry: string;
  yearsExperience: number;
  currentSkills: string[];
  focusArea: string;
};

export type ProductId = "free-scan" | "xray" | "radar";

export type Product = {
  id: ProductId;
  name: string;
  description: string;
  price: string;
  priceSuffix: string;
  features: string[];
};

export type XRayTransitionRole = {
  title: string;
  matchScore: number;
  difficulty: "Low" | "Moderate" | "High";
  transitionTime: string;
  missingSkills: string[];
  whyItFits: string;
  trend: "rising" | "stable" | "declining";
  salary: string;
};

export type RoleSkillDifficulty = "Easy" | "Medium" | "Hard";

export type RoleIntelligenceReport = {
  slug: string;
  roleTitle: string;
  matchScore: number;
  matchLabel: string;
  longevity: string;
  longevityLabel: string;
  resilienceScore: number;
  resilienceLabel: string;
  whyItFits: string;
  transferableSkills: string[];
  missingSkills: { name: string; difficulty: RoleSkillDifficulty }[];
  missingSkillsTimeEstimate: string;
  emergingSkills: { name: string; momentum: "High" | "Medium" }[];
  salary: {
    range: string;
    entry: string;
    senior: string;
    localMatchNote: string;
  };
  demand: {
    label: string;
    description: string;
    cagr: string;
  };
  marketSignals: string[];
  adjacentRoles: string[];
};

export type XRayInsight = {
  roleSummary: string;
  aiExposureLevel: AIExposureLevel;
  resilienceScore: number;
  strengths: string[];
  vulnerabilities: string[];
  opportunityZones: string[];
  skillGaps: { name: string; current: number; target: number }[];
  transitionRoles: XRayTransitionRole[];
};

export type HomeDashboardCareerPath = {
  title: string;
  salary: string;
  match: number;
  growth: string;
  barColor: string;
  badgeBg: string;
};

export type HomeDashboardRadarItem = {
  label: string;
  growth: string;
  dotColor: string;
};

export type HomeDashboard = {
  resilienceScore: number;
  resilienceTrend: string;
  aiExposureLabel: string;
  careerPaths: HomeDashboardCareerPath[];
  radarItems: HomeDashboardRadarItem[];
  newSignalsCount: number;
};

export type XRayGapLevel = "Small Gap" | "Moderate Gap" | "Large Gap";
export type XRayImpactLevel = "Medium Impact" | "High Impact";

export type XRayCompleteSkillGap = {
  skill: string;
  gap: XRayGapLevel;
  impact: XRayImpactLevel;
  benefit: string;
};

export type XRayCompleteReport = {
  currentRole: string;
  futureReadinessScore: number;
  marketOutlook: string;
  topCareerOpportunity: string;
  topRoleSlug: string;
  strongestOpportunity: { role: string; matchScore: number; whyLines: [string, string] };
  biggestSkillGap: {
    skill: string;
    gapLabel: XRayGapLevel;
    impactLabel: XRayImpactLevel;
  };
  recommendedAction: { action: string; expectedImpact: string };
  skillGapAnalysis: XRayCompleteSkillGap[];
  skillGapFooterNote: string;
};

export type Entitlements = {
  freeScansRemaining: number;
  hasCareerXRay: boolean;
  hasRadar: boolean;
  hasCompletedScan: boolean;
};

export type TransitionRadarPath = {
  rank: number;
  colorClass: string;
  numberClass: string;
  salary: string;
  salaryClass: string;
};

export type TransitionRadarPreview = {
  matchStrength: number;
  matchLabel: string;
  marketMomentum: string;
  opportunityScore: number;
  paths: TransitionRadarPath[];
};
