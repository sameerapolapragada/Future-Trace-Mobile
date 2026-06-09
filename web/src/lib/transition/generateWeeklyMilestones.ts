import type {
  GenerateMilestonesInput,
  MilestoneTaskType,
  WeeklyMilestoneWithTasks,
} from "../../types/transition";
import {
  lockedPreviewDescription,
  lockedPreviewTitle,
  unlockDateForMonth,
  unlockMonthForWeek,
} from "./milestoneAccess";

type TaskTemplate = {
  title: string;
  description: string;
  taskType: MilestoneTaskType;
  estimatedMinutes: number;
};

type WeekTemplate = {
  title: string;
  description: string;
  expectedOutcome: string;
  estimatedHours: number;
  tasks: TaskTemplate[];
};

function weekTemplates(currentRole: string, targetRole: string): WeekTemplate[] {
  const domain = currentRole.split(" ")[0] ?? "your";
  return [
    {
      title: "Foundation & Orientation",
      description: `Map your transition from ${currentRole} to ${targetRole}. Clarify gaps, set weekly rhythm, and define success metrics.`,
      expectedOutcome: "You have a written transition map, calendar blocks, and a prioritized skill gap list.",
      estimatedHours: 3,
      tasks: [
        {
          title: "Write your 90-day transition thesis",
          description: "One page: why this move, what success looks like, and your top 3 risks.",
          taskType: "reflect",
          estimatedMinutes: 45,
        },
        {
          title: "Audit your last 12 months of work",
          description: `List 5 deliverables from ${currentRole} that transfer to ${targetRole}.`,
          taskType: "research",
          estimatedMinutes: 40,
        },
        {
          title: "Block 2 weekly learning sessions",
          description: "Add recurring 45-minute calendar holds for milestone work.",
          taskType: "reflect",
          estimatedMinutes: 15,
        },
        {
          title: "Identify 3 practitioners in your target role",
          description: "Find LinkedIn profiles or portfolios to study this week.",
          taskType: "research",
          estimatedMinutes: 30,
        },
      ],
    },
    {
      title: "Target Role Fundamentals",
      description: `Learn the vocabulary, tools, and workflows used in ${targetRole}.`,
      expectedOutcome: "You can explain how your target role creates value in a 5-minute summary.",
      estimatedHours: 4,
      tasks: [
        {
          title: "Complete one beginner prompt evaluation exercise",
          description: "Run 3 prompts on the same task; score outputs against a simple rubric.",
          taskType: "learn",
          estimatedMinutes: 50,
        },
        {
          title: `Research ${targetRole} day-in-the-life`,
          description: "Capture 8 recurring responsibilities from 3 job postings.",
          taskType: "research",
          estimatedMinutes: 35,
        },
        {
          title: "Map 5 target-role tools to your current stack",
          description: `Note which ${domain} tools have closest equivalents.`,
          taskType: "learn",
          estimatedMinutes: 40,
        },
      ],
    },
    {
      title: "Core Skill Building I",
      description: "Close the highest-impact knowledge gap identified in your X-Ray.",
      expectedOutcome: "One structured learning artifact (notes, quiz results, or mini-demo) is complete.",
      estimatedHours: 4.5,
      tasks: [
        {
          title: "Finish one focused tutorial (45–60 min)",
          description: "Pick a single skill from your X-Ray gap list — not a broad 'learn AI' goal.",
          taskType: "learn",
          estimatedMinutes: 60,
        },
        {
          title: "Summarize 3 takeaways in your own words",
          description: "Write how each takeaway applies to your current domain.",
          taskType: "reflect",
          estimatedMinutes: 25,
        },
        {
          title: "Build one AI workflow related to your current domain",
          description: "Example: automate a report, triage inbox items, or draft a requirements doc.",
          taskType: "build",
          estimatedMinutes: 75,
        },
      ],
    },
    {
      title: "Core Skill Building II",
      description: "Practice applying new skills on realistic scenarios from your current role.",
      expectedOutcome: "A small practice deliverable you could show in a portfolio conversation.",
      estimatedHours: 5,
      tasks: [
        {
          title: "Redo one recent work task with new methods",
          description: "Compare old vs new approach; note time/quality differences.",
          taskType: "build",
          estimatedMinutes: 90,
        },
        {
          title: "Peer-review your practice output",
          description: "Ask a colleague or mentor for 3 specific improvement notes.",
          taskType: "reflect",
          estimatedMinutes: 30,
        },
        {
          title: "Document lessons in a transition journal",
          description: "What worked, what blocked you, what to try next week.",
          taskType: "reflect",
          estimatedMinutes: 20,
        },
      ],
    },
    {
      title: "Applied Project Week",
      description: `Ship a small end-to-end project that mirrors ${targetRole} responsibilities.`,
      expectedOutcome: "One portfolio-ready project with problem, approach, and outcome documented.",
      estimatedHours: 6,
      tasks: [
        {
          title: "Define a 1-week scoped project",
          description: "Must be finishable in ~6 hours and relevant to your target role.",
          taskType: "build",
          estimatedMinutes: 30,
        },
        {
          title: "Build the project MVP",
          description: "Prioritize a clear outcome over polish.",
          taskType: "build",
          estimatedMinutes: 180,
        },
        {
          title: "Write a 200-word project summary",
          description: "Include metrics or qualitative impact where possible.",
          taskType: "update_profile",
          estimatedMinutes: 35,
        },
      ],
    },
    {
      title: "Portfolio & Profile Update",
      description: "Translate your progress into outward-facing career assets.",
      expectedOutcome: "Updated resume bullets, LinkedIn headline, and one portfolio entry.",
      estimatedHours: 4,
      tasks: [
        {
          title: "Add 3 resume bullets for target-role skills",
          description: "Use action + method + outcome format.",
          taskType: "update_profile",
          estimatedMinutes: 50,
        },
        {
          title: "Refresh LinkedIn headline and About section",
          description: `Bridge narrative: ${currentRole} → ${targetRole}.`,
          taskType: "update_profile",
          estimatedMinutes: 45,
        },
        {
          title: "Publish or stage your project write-up",
          description: "GitHub README, Notion page, or portfolio site section.",
          taskType: "update_profile",
          estimatedMinutes: 60,
        },
      ],
    },
    {
      title: "Interview & Narrative Readiness",
      description: "Prepare stories, answers, and artifacts for conversations with hiring managers.",
      expectedOutcome: "A practiced 2-minute transition story and answers to 5 likely questions.",
      estimatedHours: 4,
      tasks: [
        {
          title: "Draft your transition story (2 minutes)",
          description: "Why now, why this role, proof of capability, what you need to grow.",
          taskType: "reflect",
          estimatedMinutes: 40,
        },
        {
          title: "Practice 5 behavioral answers aloud",
          description: "Record yourself; note clarity and jargon level.",
          taskType: "learn",
          estimatedMinutes: 50,
        },
        {
          title: "Prepare 3 questions for target-role interviews",
          description: "Show strategic thinking about the team and product.",
          taskType: "research",
          estimatedMinutes: 25,
        },
      ],
    },
    {
      title: "Transition Execution",
      description: "Take outward steps: networking, applications, or internal mobility conversations.",
      expectedOutcome: "At least 3 outreach actions logged with next steps scheduled.",
      estimatedHours: 4,
      tasks: [
        {
          title: "Send 3 targeted outreach messages",
          description: "Hiring managers, recruiters, or internal sponsors — personalized, not bulk.",
          taskType: "apply",
          estimatedMinutes: 60,
        },
        {
          title: "Apply to 2 well-matched roles or internal postings",
          description: "Quality over quantity; tailor resume snippet per role.",
          taskType: "apply",
          estimatedMinutes: 90,
        },
        {
          title: "Schedule a retrospective for your 8-week plan",
          description: "Decide: extend timeline, pivot target, or accelerate applications.",
          taskType: "reflect",
          estimatedMinutes: 30,
        },
      ],
    },
    {
      title: "Advanced Skill Deepening",
      description: "Go deeper on a specialty skill that differentiates you for your target role.",
      expectedOutcome: "Advanced technique documented with one applied example.",
      estimatedHours: 5,
      tasks: [
        {
          title: "Complete an intermediate module or certification lesson",
          description: "Choose content aligned to your top remaining skill gap.",
          taskType: "learn",
          estimatedMinutes: 90,
        },
        {
          title: "Build an advanced variant of your portfolio project",
          description: "Add evaluation, monitoring, or stakeholder-ready output.",
          taskType: "build",
          estimatedMinutes: 120,
        },
      ],
    },
    {
      title: "Stakeholder & Market Validation",
      description: "Test your narrative with real feedback from people in your target market.",
      expectedOutcome: "Feedback summary with 3 concrete adjustments to your approach.",
      estimatedHours: 4,
      tasks: [
        {
          title: "Run 2 informational conversations",
          description: "15-minute chats with practitioners; ask about hiring signals.",
          taskType: "research",
          estimatedMinutes: 60,
        },
        {
          title: "Synthesize feedback into action items",
          description: "Update profile bullets or project scope based on input.",
          taskType: "reflect",
          estimatedMinutes: 35,
        },
      ],
    },
    {
      title: "Scale Your Pipeline",
      description: "Systematize applications, follow-ups, and networking for the next 30 days.",
      expectedOutcome: "A tracked pipeline with at least 8 opportunities in various stages.",
      estimatedHours: 4.5,
      tasks: [
        {
          title: "Build a 30-day opportunity tracker",
          description: "Columns: company, role, contact, status, next action, due date.",
          taskType: "apply",
          estimatedMinutes: 40,
        },
        {
          title: "Submit 4 additional tailored applications",
          description: "Use your best project story in each cover note.",
          taskType: "apply",
          estimatedMinutes: 120,
        },
      ],
    },
    {
      title: "Launch & Sustain Momentum",
      description: "Finalize your transition operating system for ongoing weekly progress.",
      expectedOutcome: "Repeatable weekly cadence and metrics for the next quarter.",
      estimatedHours: 3.5,
      tasks: [
        {
          title: "Define your weekly transition KPIs",
          description: "e.g. learning hours, outreach sent, interviews, portfolio updates.",
          taskType: "reflect",
          estimatedMinutes: 30,
        },
        {
          title: "Book recurring monthly career reviews",
          description: "Calendar reminders to reassess target role and milestones.",
          taskType: "reflect",
          estimatedMinutes: 15,
        },
        {
          title: "Celebrate progress and set next 12-week goal",
          description: "Write what you accomplished and the next role milestone.",
          taskType: "reflect",
          estimatedMinutes: 25,
        },
      ],
    },
  ];
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Client-side milestone plan generator (templates). Persist via transitionService. */
export function generateWeeklyMilestones(input: GenerateMilestonesInput): WeeklyMilestoneWithTasks[] {
  const planLength = input.planLengthWeeks ?? 8;
  const templates = weekTemplates(input.currentRole, input.targetRole).slice(0, planLength);
  const start = input.startDate ?? new Date();

  return templates.map((week, index) => {
    const weekNumber = index + 1;
    const startDate = addDays(start, index * 7);
    const dueDate = addDays(startDate, 6);

    const unlockMonth = unlockMonthForWeek(weekNumber);
    const startedAt = start.toISOString();

    return {
      id: `temp-${weekNumber}`,
      goalId: input.goalId,
      userId: input.userId,
      weekNumber,
      title: week.title,
      description: week.description,
      expectedOutcome: week.expectedOutcome,
      estimatedHours: week.estimatedHours,
      startDate: toDateString(startDate),
      dueDate: toDateString(dueDate),
      status: weekNumber === 1 ? "in_progress" : "not_started",
      completionPercentage: 0,
      unlockMonthNumber: unlockMonth,
      unlockDate: unlockDateForMonth(startedAt, unlockMonth),
      isUnlocked: unlockMonth === 1,
      lockedPreviewTitle: lockedPreviewTitle(week.title),
      lockedPreviewDescription: lockedPreviewDescription(unlockMonth),
      fullContentRevealedAt: unlockMonth === 1 ? new Date().toISOString() : null,
      lastAdaptiveUpdateAt: null,
      adaptiveUpdateNote: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: week.tasks.map((task, taskIndex) => ({
        id: `temp-task-${weekNumber}-${taskIndex}`,
        milestoneId: `temp-${weekNumber}`,
        userId: input.userId,
        title: task.title,
        description: task.description,
        taskType: task.taskType,
        estimatedMinutes: task.estimatedMinutes,
        status: "pending" as const,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    };
  });
}
