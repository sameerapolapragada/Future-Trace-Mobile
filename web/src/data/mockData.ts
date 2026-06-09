import type {
  CareerOpportunitiesReport,
  CareerScan,
  HomeDashboard,
  Product,
  RadarDashboard,
  RadarInsights,
  RadarSignal,
  RoleIntelligenceReport,
  RoleSkillDifficulty,
  TransitionRadarPreview,
  UserProfile,
  XRayCompleteReport,
  XRayInsight,
  XRayTransitionRole,
} from "../types";

export const userProfile: UserProfile = {
  name: "Sameera",
  email: "sameera@email.com",
  title: "Salesforce Administrator",
  industry: "Healthcare",
  yearsExperience: 8,
  currentSkills: [
    "Salesforce",
    "Flow Builder",
    "Stakeholder Management",
    "Reporting",
    "Process Automation",
  ],
  focusArea: "AI Operations",
};

export const products: Record<"freeScan" | "xray" | "radar", Product> = {
  freeScan: {
    id: "free-scan",
    name: "Career Resilience Scan",
    description: "Free snapshot of your AI-era career resilience, exposure, and risk level.",
    price: "Free",
    priceSuffix: "",
    features: [
      "Career Resilience Index score",
      "AI exposure assessment",
      "Strengths & vulnerability map",
      "Transition role recommendations",
    ],
  },
  xray: {
    id: "xray",
    name: "Career X-Ray Only",
    description: "One-time deep career scan",
    price: "$1.99",
    priceSuffix: " one-time",
    features: [
      "Full Career X-Ray report",
      "5 transition role recommendations",
      "Skill gap analysis",
      "AI-exposed task breakdown",
      "Role compatibility scoring",
      "One-time snapshot only",
      "No monthly market updates",
    ],
  },
  radar: {
    id: "radar",
    name: "AI Career Radar",
    description: "Career X-Ray plus ongoing live intelligence",
    price: "$9.99",
    priceSuffix: "/month",
    features: [
      "Everything in Career X-Ray",
      "Full Career X-Ray report included",
      "5 transition role recommendations",
      "Monthly skill gap movement",
      "Live AI market signals",
      "Role demand changes",
      "Personalized career alerts",
      "Career trajectory updates",
      "Recommended action each month",
    ],
  },
};

export const transitionRadarPreview: TransitionRadarPreview = {
  matchStrength: 92,
  matchLabel: "HIGH ALIGNMENT",
  marketMomentum: "STRONG",
  opportunityScore: 92,
  paths: [
    {
      rank: 1,
      colorClass: "from-orange-500/20 to-orange-600/5",
      numberClass: "bg-orange-500 text-white",
      salary: "$115k – $140k",
      salaryClass: "text-orange-400",
    },
    {
      rank: 2,
      colorClass: "from-accent/20 to-accent/5",
      numberClass: "bg-accent text-white",
      salary: "$130k – $165k",
      salaryClass: "text-accent-soft",
    },
    {
      rank: 3,
      colorClass: "from-teal-500/20 to-teal-600/5",
      numberClass: "bg-teal-500 text-white",
      salary: "$145k – $180k",
      salaryClass: "text-teal-400",
    },
    {
      rank: 4,
      colorClass: "from-accent-purple/20 to-accent-purple/5",
      numberClass: "bg-accent-purple text-white",
      salary: "$95k – $120k",
      salaryClass: "text-accent-gold",
    },
    {
      rank: 5,
      colorClass: "from-amber-400/20 to-amber-500/5",
      numberClass: "bg-amber-400 text-navy",
      salary: "$125k – $155k",
      salaryClass: "text-amber-400",
    },
  ],
};

export const careerScans: CareerScan[] = [
  {
    id: "scan-1",
    title: "Career Resilience Report",
    role: "Salesforce Administrator",
    industry: "Healthcare",
    date: "2026-06-05",
    resilienceScore: 78,
    aiExposureLevel: "medium",
    aiExposure: 58,
    riskLevel: "medium",
    summary:
      "Strong CRM and process expertise provide a solid foundation, but manual reporting and repetitive admin work face growing automation pressure. Opportunity lies in AI operations, governance, and cross-functional strategy roles.",
    currentSkills: userProfile.currentSkills,
    strengths: [
      "Salesforce",
      "Stakeholder Management",
      "Process Optimization",
    ],
    vulnerabilities: [
      "Manual Reporting",
      "Repetitive Administration",
      "Rule-Based Workflows",
    ],
    opportunityZones: [
      "AI Operations",
      "Data Governance",
      "Product Strategy",
    ],
    transitionRoles: [
      "Model Trust Auditor",
      "AI Risk Manager",
      "AI Compliance Lead",
      "Prompt Operations Analyst",
      "AI Implementation Partner",
    ],
  },
];

export const xrayInsights: XRayInsight = {
  roleSummary: careerScans[0].summary,
  aiExposureLevel: careerScans[0].aiExposureLevel,
  resilienceScore: careerScans[0].resilienceScore,
  strengths: careerScans[0].strengths,
  vulnerabilities: careerScans[0].vulnerabilities,
  opportunityZones: careerScans[0].opportunityZones,
  skillGaps: [
    { name: "AI Workflow Design", current: 35, target: 72 },
    { name: "Data Governance", current: 40, target: 78 },
    { name: "Prompt Evaluation", current: 28, target: 65 },
    { name: "Product Strategy", current: 52, target: 80 },
  ],
  transitionRoles: [
    {
      title: "AI Operations Analyst",
      matchScore: 92,
      difficulty: "Moderate",
      transitionTime: "3–6 Months",
      missingSkills: ["AI Tools", "Prompt Engineering", "Workflow Automation"],
      whyItFits:
        "Your Salesforce workflow optimization skills translate directly to AI operations. You already bridge technical systems with business processes.",
      trend: "rising",
      salary: "$100K – $130K",
    },
    {
      title: "Model Trust Auditor",
      matchScore: 88,
      difficulty: "Moderate",
      transitionTime: "3–6 Months",
      missingSkills: ["Model Validation", "Bias Detection", "Audit Frameworks"],
      whyItFits:
        "Your attention to process quality and compliance-minded work maps directly to verifying AI model trustworthiness.",
      trend: "rising",
      salary: "$105K – $140K",
    },
    {
      title: "Salesforce Architect",
      matchScore: 85,
      difficulty: "Low",
      transitionTime: "2–4 Months",
      missingSkills: ["Solution Architecture", "Integration Design"],
      whyItFits:
        "Your deep Salesforce expertise positions you to architect AI-enabled CRM solutions without a full career pivot.",
      trend: "stable",
      salary: "$115K – $150K",
    },
    {
      title: "AI Governance Analyst",
      matchScore: 82,
      difficulty: "Moderate",
      transitionTime: "3–6 Months",
      missingSkills: ["AI Policy", "Compliance Auditing"],
      whyItFits:
        "Your industry knowledge and detail orientation align with emerging AI governance roles as regulations accelerate.",
      trend: "rising",
      salary: "$95K – $125K",
    },
    {
      title: "Product Operations Manager",
      matchScore: 78,
      difficulty: "Low",
      transitionTime: "2–4 Months",
      missingSkills: ["Product Analytics", "Roadmap Planning"],
      whyItFits:
        "Your stakeholder management and process optimization experience fit product ops roles that bridge business and AI product teams.",
      trend: "stable",
      salary: "$110K – $140K",
    },
  ],
};

export function roleTitleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Highest-match transition role from the latest career scan results. */
export function getStrongestTransitionMatch(): XRayTransitionRole {
  const scanRoleOrder = new Map(
    careerScans[0].transitionRoles.map((title, index) => [title, index])
  );
  const candidates = xrayInsights.transitionRoles.filter((role) =>
    scanRoleOrder.has(role.title)
  );
  const pool = candidates.length > 0 ? candidates : xrayInsights.transitionRoles;

  return [...pool].sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return (scanRoleOrder.get(a.title) ?? 99) - (scanRoleOrder.get(b.title) ?? 99);
  })[0];
}

export const xrayCompleteReport: XRayCompleteReport = {
  xrayId: "XR-87521",
  currentRole: "Salesforce Business Analyst",
  targetRole: "AI/ML Engineer",
  futureReadinessScore: 78,
  transitionFit: "Strong",
  transitionDifficulty: "High",
  estimatedTransitionTime: "6–12 months",
  currentSalaryRange: "$95K – $115K",
  targetSalaryRange: "$125K – $160K",
  salaryUpside: "+$30K – $45K",
  transferableStrengths: [
    {
      name: "Business process analysis",
      whyItMatters: "Helps translate business problems into AI use cases.",
    },
    {
      name: "Salesforce ecosystem knowledge",
      whyItMatters: "Useful for building AI workflows inside CRM environments.",
    },
    {
      name: "Stakeholder communication",
      whyItMatters: "Important for working across product, data, and engineering teams.",
    },
  ],
  skillGaps: [
    {
      skill: "AI/ML Fundamentals",
      gap: "Large Gap",
      impact: "High Impact",
      whyItMatters:
        "Required to understand model behavior, training concepts, and AI system limitations.",
    },
    {
      skill: "Python Programming",
      gap: "Large Gap",
      impact: "High Impact",
      whyItMatters:
        "Core language for building, testing, and deploying machine learning models in production.",
    },
    {
      skill: "Model Evaluation",
      gap: "Moderate Gap",
      impact: "High Impact",
      whyItMatters:
        "Critical for measuring model performance and ensuring reliable AI outputs.",
    },
    {
      skill: "Data Engineering",
      gap: "Moderate Gap",
      impact: "Medium Impact",
      whyItMatters:
        "Important for preparing and processing data pipelines that feed ML models.",
    },
    {
      skill: "Deep Learning",
      gap: "Small Gap",
      impact: "Medium Impact",
      whyItMatters: "Helpful for advanced roles requiring neural network expertise.",
    },
  ],
  recommendedAction: {
    primaryAction: "Build AI/ML foundation before applying to AI/ML Engineer roles.",
    why: "Your business analysis experience is useful, but the target role requires stronger technical ML skills.",
    next30Days: [
      "Learn ML fundamentals",
      "Complete one Python ML mini-project",
      "Study model evaluation concepts",
      "Build one AI workflow connected to your current domain",
    ],
    expectedImpact: "+12 Future Readiness Points",
  },
  transitionSnapshot: {
    transitionTime: "6–12 months",
    difficulty: "High",
    readiness: 78,
    salaryUpside: "+$30k – $45k",
    marketDemand: "High",
  },
};

function transitionRoleToOpportunity(role: XRayTransitionRole) {
  return {
    title: role.title,
    matchScore: role.matchScore,
    difficulty: (role.difficulty === "Moderate" ? "Medium" : role.difficulty) as
      | "Low"
      | "Medium"
      | "High",
    transitionTime: role.transitionTime,
    salaryRange: role.salary,
    whyFits: role.whyItFits,
    missingSkills: role.missingSkills,
  };
}

export const careerOpportunities: CareerOpportunitiesReport = {
  recommendedRoles: xrayInsights.transitionRoles.map(transitionRoleToOpportunity),
};

export function getCareerXRaySnapshot() {
  return {
    currentRole: xrayCompleteReport.currentRole,
    targetRole: xrayCompleteReport.targetRole,
    matchScore: xrayCompleteReport.futureReadinessScore,
  };
}

export const radarDashboard: RadarDashboard = {
  readinessScore: 78,
  readinessLabel: "AI READY",
  peerPercentile: "Top 12% of your peer group",
  scoreTrend: "+2 points since last month",
  subMetrics: [
    { label: "Knowledge", value: 62, barClass: "bg-accent" },
    { label: "Exposure", value: 81, barClass: "bg-success" },
    { label: "Market Demand", value: 76, barClass: "bg-accent" },
    { label: "Personalized Score", value: 85, barClass: "bg-accent-purple" },
  ],
  strengths: [
    "Strong foundation in AI concepts",
    "High level of interest in AI technology",
    "Active engagement with AI communities",
  ],
  weaknesses: [
    "Limited practical experience with AI tools",
    "Lack of formal certification in AI fields",
    "Difficulty keeping up with rapid AI advancements",
  ],
  careerPaths: [
    {
      title: "AI Business Analyst",
      description: "Analyze business processes and identify opportunities for AI integration.",
      match: "High",
      salary: "$110K – $160K",
    },
    {
      title: "AI Product Manager",
      description: "Define product vision and roadmap for AI-powered products.",
      match: "Medium",
      salary: "$130K – $180K",
    },
    {
      title: "Data Science Consultant",
      description: "Help organizations leverage data and AI to solve complex business problems.",
      match: "High",
      salary: "$120K – $170K",
    },
  ],
  marketDemand: [
    {
      title: "AI Business Analyst",
      openings: "12K+ Job Openings",
      salary: "$110K – $160K",
      demandTag: "Very High",
    },
    {
      title: "AI Product Manager",
      openings: "8K+ Job Openings",
      salary: "$130K – $180K",
      demandTag: "High",
    },
    {
      title: "Data Science Consultant",
      openings: "15K+ Job Openings",
      salary: "$120K – $170K",
      demandTag: "Very High",
    },
  ],
  skillGaps: [
    { name: "AI Fundamentals", current: 72, target: 90 },
    { name: "Machine Learning", current: 48, target: 80 },
    { name: "Natural Language Processing", current: 35, target: 75 },
    { name: "Computer Vision", current: 22, target: 65 },
  ],
  learningPath: {
    title: "Level 1: AI Readiness Fundamentals",
    description: "This course covers the basics of AI and its applications in business.",
    progress: 42,
    duration: "4 hours",
    points: "+10 points",
  },
  careerXRay: getCareerXRaySnapshot(),
};

export const radarInsights: RadarInsights = {
  marketTrajectory: {
    role: userProfile.title,
    status: "Stable",
    summary:
      "Salesforce Administrator demand in healthcare remains steady. Core CRM skills hold value while manual admin tasks face gradual automation pressure.",
  },
  skillGapChanges: [
    {
      title: "AI Workflow Automation",
      summary: "Gap decreased by 12% — your Flow Builder experience is closing the distance to orchestration roles.",
      category: "High Growth",
      impact: "high",
      trend: "up",
    },
    {
      title: "AI Governance",
      summary: "Gap increased by 8% — demand is rising faster than your current skill depth in this area.",
      category: "Emerging",
      impact: "medium",
      trend: "up",
    },
    {
      title: "Manual Reporting",
      summary: "Relevance declined by 21% as AI copilots and automated dashboards replace routine report work.",
      category: "Declining",
      impact: "high",
      trend: "down",
    },
  ],
  emergingSkills: [
    {
      title: "Agentic AI Tools",
      summary: "Multi-step AI agents entering enterprise stacks — early adopters gain a significant career edge.",
      category: "Emerging",
      impact: "medium",
      trend: "up",
    },
    {
      title: "Prompt Evaluation",
      summary: "Evaluating AI outputs for accuracy and compliance is becoming core in ops and governance roles.",
      category: "Emerging",
      impact: "medium",
      trend: "up",
    },
    {
      title: "AI Governance",
      summary: "Regulated industries are hiring for AI policy, compliance, and model oversight.",
      category: "Emerging",
      impact: "high",
      trend: "up",
    },
    {
      title: "CRM AI Operations",
      summary: "Salesforce-centric AI ops roles emerging as Einstein and agent tools expand inside CRM workflows.",
      category: "Emerging",
      impact: "high",
      trend: "up",
    },
  ],
  roleDemandSignals: [
    {
      title: "AI Operations Analyst",
      summary: "Healthcare orgs scaling AI inside CRM workflows — hiring velocity up across your industry.",
      category: "High Growth",
      impact: "high",
      trend: "up",
    },
    {
      title: "Salesforce Architect",
      summary: "Enterprise CRM architecture roles remain in steady demand with consistent salary bands.",
      category: "Stable",
      impact: "medium",
      trend: "flat",
    },
    {
      title: "Manual Reporting Analyst",
      summary: "Standalone reporting analyst roles shrinking as automation absorbs routine dashboard work.",
      category: "Declining",
      impact: "high",
      trend: "down",
    },
  ],
  personalizedAlerts: [
    {
      title: "AI Governance in target roles",
      summary: "AI Governance is appearing more often in your target roles.",
      category: "Emerging",
      impact: "high",
      trend: "up",
    },
    {
      title: "CRM AI Operations path strengthening",
      summary: "CRM AI Operations is becoming a stronger transition path.",
      category: "High Growth",
      impact: "high",
      trend: "up",
    },
    {
      title: "Manual reporting automation",
      summary: "Manual reporting tasks are becoming more automated.",
      category: "Declining",
      impact: "high",
      trend: "down",
    },
  ],
};

export const radarSignals: RadarSignal[] = [
  {
    id: "r1",
    title: "AI Workflow Automation",
    category: "High Growth",
    impact: "high",
    trend: "up",
    summary:
      "Healthcare orgs are automating admin workflows with AI — Flow Builder skills translate well to orchestration roles.",
    date: "2026-06-05",
  },
  {
    id: "r2",
    title: "Manual Report Generation",
    category: "Declining",
    impact: "high",
    trend: "down",
    summary:
      "Dashboard and report-building tasks are rapidly being replaced by AI copilots and automated analytics.",
    date: "2026-06-04",
  },
  {
    id: "r3",
    title: "AI Governance",
    category: "High Growth",
    impact: "high",
    trend: "up",
    summary:
      "Regulated industries like healthcare are hiring for AI policy, compliance, and model oversight roles.",
    date: "2026-06-04",
  },
  {
    id: "r4",
    title: "CRM AI Operations",
    category: "High Growth",
    impact: "high",
    trend: "up",
    summary:
      "Salesforce-centric AI ops roles are emerging as Einstein and agent tools expand inside CRM workflows.",
    date: "2026-06-03",
  },
  {
    id: "r5",
    title: "Basic Data Entry",
    category: "Declining",
    impact: "medium",
    trend: "down",
    summary:
      "Routine data entry and record updates are among the first tasks automated in CRM environments.",
    date: "2026-06-02",
  },
  {
    id: "r6",
    title: "Agentic AI Tools",
    category: "Emerging",
    impact: "medium",
    trend: "up",
    summary:
      "Multi-step AI agents are entering enterprise stacks — early adopters gain a significant career edge.",
    date: "2026-06-01",
  },
  {
    id: "r7",
    title: "Prompt Evaluation",
    category: "Emerging",
    impact: "medium",
    trend: "up",
    summary:
      "Evaluating AI outputs for accuracy and compliance is becoming a core skill in ops and governance roles.",
    date: "2026-05-30",
  },
];

export const homeDashboard: HomeDashboard = {
  resilienceScore: careerScans[0].resilienceScore,
  resilienceTrend: "+5",
  aiExposureLabel: "Medium",
  careerPaths: [
    {
      title: "AI Product Manager",
      salary: "$145K – $185K",
      match: 92,
      growth: "+28%",
      barColor: "bg-gradient-to-r from-accent to-accent-soft",
      badgeBg: "bg-accent/20 text-accent-soft",
    },
    {
      title: "ML Engineering Lead",
      salary: "$160K – $200K",
      match: 88,
      growth: "+24%",
      barColor: "bg-gradient-to-r from-accent-purple to-accent-gold",
      badgeBg: "bg-accent-purple/20 text-accent-gold",
    },
    {
      title: "Data Strategy Director",
      salary: "$150K – $190K",
      match: 85,
      growth: "+31%",
      barColor: "bg-gradient-to-r from-teal-400 to-cyan-400",
      badgeBg: "bg-teal-500/15 text-teal-300",
    },
  ],
  radarItems: [
    { label: "Prompt Engineering", growth: "+45%", dotColor: "bg-red-400" },
    { label: "AI Ethics & Governance", growth: "+38%", dotColor: "bg-amber-400" },
    { label: "ML Model Deployment", growth: "+29%", dotColor: "bg-orange-400" },
  ],
  newSignalsCount: 12,
};

export const onboardingSlides = [
  {
    title: "AI is reshaping every career.",
    body: "Understand how your current role may change and discover your next best career move.",
    variant: "career-paths" as const,
  },
  {
    title: "Measure your Career Resilience.",
    body: "Get a personalized view of your strengths, vulnerabilities, and opportunity zones in the AI economy.",
    variant: "resilience-score" as const,
  },
  {
    title: "Stay ahead of AI market changes.",
    body: "Track emerging skills, changing role demand, and evolving career opportunities personalized to your profile.",
    variant: "market-radar" as const,
  },
];

export function getScanById(id: string): CareerScan | undefined {
  return careerScans.find((s) => s.id === id);
}

export function getProduct(id: Product["id"]) {
  return Object.values(products).find((p) => p.id === id);
}

const aiOperationsAnalystReport: RoleIntelligenceReport = {
  slug: "ai-operations-analyst",
  roleTitle: "AI Operations Analyst",
  matchScore: 92,
  matchLabel: "Very High",
  longevity: "High",
  longevityLabel: "Stable growth",
  resilienceScore: 92,
  resilienceLabel: "Future-proof",
  whyItFits:
    "Your Salesforce workflow optimization skills translate directly to AI operations. You already bridge technical systems with business processes — the core function of this role. Your stakeholder management experience is critical for coordinating between data science, engineering, and business teams.",
  transferableSkills: [
    "Process Optimization",
    "Stakeholder Management",
    "Cross-functional Collaboration",
    "Data Analysis",
    "Workflow Automation",
  ],
  missingSkills: [
    { name: "Python Programming", difficulty: "Hard" },
    { name: "ML Model Monitoring", difficulty: "Hard" },
    { name: "API Integration", difficulty: "Medium" },
    { name: "AI Prompt Engineering", difficulty: "Easy" },
    { name: "AI Compliance Management", difficulty: "Easy" },
  ],
  missingSkillsTimeEstimate: "6–12 months with focused effort",
  emergingSkills: [
    { name: "AI Agent Orchestration", momentum: "High" },
    { name: "LLM Fine-tuning", momentum: "High" },
    { name: "Responsible AI Practices", momentum: "High" },
  ],
  salary: {
    range: "$95K – $135K",
    entry: "$85K – $110K",
    senior: "$140K – $175K",
    localMatchNote: "Salary matching for 87% of your local market",
  },
  demand: {
    label: "High Demand",
    description:
      "Demand for AI Operations roles is expected to remain strong through 2027 as organizations scale AI adoption across business units.",
    cagr: "8.2% CAGR",
  },
  marketSignals: [
    "Demand increased 14% this quarter",
    "AI compliance becoming critical",
    "Workflow automation rapidly growing",
  ],
  adjacentRoles: ["AI Product Manager", "ML Operations Engineer", "AI Governance Analyst"],
};

function defaultDifficulty(index: number): RoleSkillDifficulty {
  if (index < 2) return "Hard";
  if (index === 2) return "Medium";
  return "Easy";
}

function buildReportFromTransitionRole(role: XRayTransitionRole): RoleIntelligenceReport {
  const slug = roleTitleToSlug(role.title);

  return {
    slug,
    roleTitle: role.title,
    matchScore: role.matchScore,
    matchLabel: role.matchScore >= 90 ? "Very High" : role.matchScore >= 80 ? "High" : "Moderate",
    longevity: role.trend === "rising" ? "High" : "Medium",
    longevityLabel: role.trend === "rising" ? "Stable growth" : "Steady demand",
    resilienceScore: Math.min(95, role.matchScore + 4),
    resilienceLabel: role.matchScore >= 85 ? "Future-proof" : "Promising path",
    whyItFits: role.whyItFits,
    transferableSkills: [
      "Process Optimization",
      "Stakeholder Management",
      "Cross-functional Collaboration",
      "Data Analysis",
      "Workflow Automation",
    ],
    missingSkills: role.missingSkills.map((name, index) => ({
      name,
      difficulty: defaultDifficulty(index),
    })),
    missingSkillsTimeEstimate: `${role.transitionTime} with focused effort`,
    emergingSkills: [
      { name: "AI Agent Orchestration", momentum: "High" },
      { name: "LLM Fine-tuning", momentum: "High" },
      { name: "Responsible AI Practices", momentum: "Medium" },
    ],
    salary: {
      range: role.salary,
      entry: "Varies by market",
      senior: "Varies by market",
      localMatchNote: "Salary matching for 82% of your local market",
    },
    demand: {
      label: role.trend === "rising" ? "High Demand" : "Stable Demand",
      description:
        "Market demand for this role is projected to grow as organizations invest in AI infrastructure and operational excellence.",
      cagr: role.trend === "rising" ? "7.5% CAGR" : "4.1% CAGR",
    },
    marketSignals: [
      "Demand increased 12% this quarter",
      "AI compliance becoming critical",
      "Workflow automation rapidly growing",
    ],
    adjacentRoles: xrayInsights.transitionRoles
      .filter((r) => r.title !== role.title)
      .slice(0, 3)
      .map((r) => r.title),
  };
}

const roleIntelligenceBySlug = Object.fromEntries(
  xrayInsights.transitionRoles.map((role) => {
    const slug = roleTitleToSlug(role.title);
    const report =
      slug === "ai-operations-analyst"
        ? aiOperationsAnalystReport
        : buildReportFromTransitionRole(role);
    return [slug, report];
  })
) as Record<string, RoleIntelligenceReport>;

export function getRoleIntelligenceReport(slug: string): RoleIntelligenceReport | undefined {
  return roleIntelligenceBySlug[slug];
}
