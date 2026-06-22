import type { ExposureCategory } from "./types";

type CategoryRule = {
  category: ExposureCategory;
  patterns: RegExp[];
};

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "repetitive_admin",
    patterns: [
      /\bschedule\b/i,
      /\bappointments?\b/i,
      /\bfiling\b/i,
      /\bdata entry\b/i,
      /\broutine\b/i,
      /\badministrative\b/i,
      /\bclerical\b/i,
      /\bprocess (orders|requests|invoices)\b/i,
    ],
  },
  {
    category: "documentation_reporting",
    patterns: [
      /\bdocument\b/i,
      /\breport\b/i,
      /\brecord\b/i,
      /\bcorrespondence\b/i,
      /\bmanual\b/i,
      /\bprepare (reports|documentation|invoices|memos)\b/i,
      /\bcompile\b/i,
    ],
  },
  {
    category: "data_processing",
    patterns: [
      /\bdata\b/i,
      /\bspreadsheet\b/i,
      /\bdatabase\b/i,
      /\bprocess (large|numerical|financial)\b/i,
      /\breconcile\b/i,
      /\banalyze data\b/i,
      /\bcompute\b/i,
    ],
  },
  {
    category: "customer_support",
    patterns: [
      /\bcustomer\b/i,
      /\bclient\b/i,
      /\bsupport\b/i,
      /\banswer (questions|telephones|calls)\b/i,
      /\bticket\b/i,
      /\bscripted\b/i,
      /\brespond to (inquiries|routine)\b/i,
    ],
  },
  {
    category: "analytical",
    patterns: [
      /\banalyz/i,
      /\bresearch\b/i,
      /\bevaluat/i,
      /\bassess\b/i,
      /\bidentify trends\b/i,
      /\bmodel\b/i,
      /\bforecast\b/i,
    ],
  },
  {
    category: "strategic_stakeholder",
    patterns: [
      /\bstrateg/i,
      /\bstakeholder\b/i,
      /\bexecutive\b/i,
      /\bleadership\b/i,
      /\bnegotiat/i,
      /\broadmap\b/i,
      /\bdirect (daily|operations|activities)\b/i,
      /\bfacilitate meetings\b/i,
    ],
  },
  {
    category: "creative",
    patterns: [
      /\bdesign\b/i,
      /\bcreat/i,
      /\binnovat/i,
      /\bconcept\b/i,
      /\billustrat/i,
      /\bvisual\b/i,
      /\bdevelop creative\b/i,
    ],
  },
  {
    category: "compliance_judgment",
    patterns: [
      /\bcompliance\b/i,
      /\bregulat/i,
      /\blegal\b/i,
      /\bjudgment\b/i,
      /\bapprov/i,
      /\baudit\b/i,
      /\bphysician orders\b/i,
      /\bsecurity policies\b/i,
    ],
  },
  {
    category: "physical_in_person",
    patterns: [
      /\bphysical\b/i,
      /\bmanual\b/i,
      /\bonsite\b/i,
      /\bequipment\b/i,
      /\binspect\b/i,
      /\bpatient\b/i,
      /\badminister medications\b/i,
      /\bperform physical\b/i,
    ],
  },
];

/** Classify a single O*NET task string into its primary exposure category. */
export function classifyTask(task: string): ExposureCategory {
  let best: { category: ExposureCategory; score: number } | null = null;

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(task)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { category: rule.category, score };
    }
  }

  return best?.category ?? "analytical";
}

export function classifyTasks(tasks: string[]): ExposureCategory[] {
  return tasks.map(classifyTask);
}

export const EXPOSURE_INCREASE_CATEGORIES: ExposureCategory[] = [
  "repetitive_admin",
  "documentation_reporting",
  "data_processing",
  "customer_support",
];

export const EXPOSURE_DECREASE_CATEGORIES: ExposureCategory[] = [
  "strategic_stakeholder",
  "compliance_judgment",
  "creative",
  "physical_in_person",
];

export const CATEGORY_WEIGHTS: Record<ExposureCategory, number> = {
  repetitive_admin: 5,
  documentation_reporting: 4,
  data_processing: 4,
  customer_support: 3,
  analytical: -1,
  strategic_stakeholder: -6,
  compliance_judgment: -6,
  creative: -5,
  physical_in_person: -5,
};

export const CATEGORY_DRIVER_LABELS: Record<ExposureCategory, string> = {
  repetitive_admin: "Routine administrative work",
  documentation_reporting: "Documentation and reporting tasks",
  data_processing: "Data processing workflows",
  customer_support: "Routine customer or support interactions",
  analytical: "Analytical problem-solving",
  strategic_stakeholder: "Strategic and stakeholder-facing work",
  compliance_judgment: "Compliance and judgment-heavy decisions",
  creative: "Creative and design-oriented work",
  physical_in_person: "Physical or in-person responsibilities",
};
