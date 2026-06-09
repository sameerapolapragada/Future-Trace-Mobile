import type { MilestoneTaskType, PlanUpdateType, ProposedChanges } from "../../types/transition";

export type CareerMarketSignal = {
  id: string;
  role: string;
  industry: string | null;
  signalType: string;
  skillName: string;
  signalSummary: string;
  relevanceScore: number;
};

export type PlanUpdateRecommendationDraft = {
  recommendationType: PlanUpdateType;
  title: string;
  summary: string;
  whyItMatters: string;
  expectedImpact: string;
  targetMilestoneId: string;
  proposedChanges: ProposedChanges;
};

export type ProposedTaskPreview = {
  title: string;
  estimated_minutes?: number;
  task_type?: MilestoneTaskType;
};
