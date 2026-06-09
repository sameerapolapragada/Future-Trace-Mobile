export type CareerGoalStatus = "active" | "paused" | "completed" | "archived";
export type WeeklyMilestoneStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "missed"
  | "skipped"
  | "locked";
export type MilestoneTaskType =
  | "learn"
  | "build"
  | "reflect"
  | "research"
  | "update_profile"
  | "apply";
export type MilestoneTaskStatus = "pending" | "completed" | "skipped";
export type TransitionNotificationType =
  | "weekly_start"
  | "midweek_reminder"
  | "deadline_reminder"
  | "completion_celebration"
  | "missed_milestone"
  | "plan_update_available";
export type TransitionNotificationStatus = "scheduled" | "sent" | "failed" | "cancelled";

export type CareerGoal = {
  id: string;
  userId: string;
  currentRole: string;
  targetRole: string;
  sourceScanId: string | null;
  sourceXrayId: string | null;
  status: CareerGoalStatus;
  readinessScore: number;
  transitionDifficulty: string | null;
  estimatedTransitionTime: string | null;
  salaryUpside: string | null;
  marketDemand: string | null;
  topStrengths: string[];
  biggestSkillGaps: string[];
  recommendedNextAction: string | null;
  planLengthWeeks: 8 | 12;
  startedAt: string;
  pausedAt: string | null;
  completedAt: string | null;
  targetCompletionDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyMilestone = {
  id: string;
  goalId: string;
  userId: string;
  weekNumber: number;
  title: string;
  description: string;
  expectedOutcome: string;
  estimatedHours: number;
  startDate: string;
  dueDate: string;
  status: WeeklyMilestoneStatus;
  completionPercentage: number;
  unlockMonthNumber: number;
  unlockDate: string | null;
  isUnlocked: boolean;
  lockedPreviewTitle: string | null;
  lockedPreviewDescription: string | null;
  fullContentRevealedAt: string | null;
  lastAdaptiveUpdateAt: string | null;
  adaptiveUpdateNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MilestoneTask = {
  id: string;
  milestoneId: string;
  userId: string;
  title: string;
  description: string | null;
  taskType: MilestoneTaskType;
  estimatedMinutes: number;
  status: MilestoneTaskStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanUpdateStatus = "pending" | "applied" | "dismissed" | "expired";
export type PlanUpdateType = "add_task" | "replace_task" | "add_milestone" | "adjust_priority";

export type ProposedTaskChange = {
  title: string;
  description?: string;
  estimated_minutes?: number;
  task_type?: MilestoneTaskType;
};

export type ProposedChanges = {
  add_tasks?: ProposedTaskChange[];
};

export type PlanUpdateRecommendation = {
  id: string;
  userId: string;
  goalId: string;
  signalId: string | null;
  recommendationType: PlanUpdateType;
  title: string;
  summary: string;
  whyItMatters: string;
  expectedImpact: string | null;
  targetMilestoneId: string | null;
  proposedChanges: ProposedChanges;
  status: PlanUpdateStatus;
  createdAt: string;
  appliedAt: string | null;
  dismissedAt: string | null;
  signalSkillName?: string | null;
  signalSummary?: string | null;
  targetWeekNumber?: number | null;
  targetMonthNumber?: number | null;
  targetPreviewTitle?: string | null;
  targetIsUnlocked?: boolean;
};

export type MilestoneVersion = {
  id: string;
  milestoneId: string;
  goalId: string;
  versionNumber: number;
  previousContent: Record<string, unknown>;
  newContent: Record<string, unknown>;
  changeReason: string;
  createdAt: string;
};

export type TransitionNotification = {
  id: string;
  userId: string;
  goalId: string | null;
  milestoneId: string | null;
  planUpdateId: string | null;
  notificationType: TransitionNotificationType;
  title: string;
  message: string;
  scheduledFor: string;
  sentAt: string | null;
  readAt: string | null;
  status: TransitionNotificationStatus;
  createdAt: string;
};

export type WeeklyMilestoneWithTasks = WeeklyMilestone & { tasks: MilestoneTask[] };

export type GenerateMilestonesInput = {
  userId: string;
  goalId: string;
  currentRole: string;
  targetRole: string;
  planLengthWeeks?: 8 | 12;
  xrayResultJson?: unknown;
  transitionRolesJson?: unknown;
  startDate?: Date;
};
