import type { AIExposureLevel } from "../types";

export type ExposureCategory =
  | "repetitive_admin"
  | "documentation_reporting"
  | "data_processing"
  | "customer_support"
  | "analytical"
  | "strategic_stakeholder"
  | "creative"
  | "compliance_judgment"
  | "physical_in_person";

export type ExposureLevelLabel = "Low" | "Moderate" | "High";

export type ExposureScoreResult = {
  aiExposureScore: number;
  exposureLevel: ExposureLevelLabel;
  aiExposureLevel: AIExposureLevel;
  aiExposureLabel: string;
  keyExposureDrivers: string[];
  protectedStrengths: string[];
  affectedTasks: string[];
  categoryBreakdown: Partial<Record<ExposureCategory, number>>;
};

export type ExposureExplanation = {
  explanation: string;
  whyThisLevel: string;
  tasksAffectedSummary: string[];
  skillsToStrengthen: string[];
};

export type ScoringInput = {
  currentRole: string;
  industry: string;
  yearsExperience: number;
  skills: string;
  tools: string;
  occupationTitle?: string;
  tasks: string[];
  onetSkills: string[];
  workActivities: string[];
};
