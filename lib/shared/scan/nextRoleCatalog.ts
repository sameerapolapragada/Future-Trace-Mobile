/**
 * Destination roles for next-step recommendations.
 * Families align with ROLE_CATALOG in roleMatch.ts — scored dynamically, not hard-wired per source.
 */

export type RecFamily =
  | "salesforce"
  | "business_strategy"
  | "data_analytics"
  | "quality"
  | "program_pm"
  | "product"
  | "software_engineering"
  | "revenue_ops"
  | "customer_success"
  | "security"
  | "it_operations"
  | "design"
  | "marketing"
  | "finance"
  | "healthcare"
  | "operations";

export type NextRoleDestination = {
  role: string;
  family: RecFamily;
  /** Tokens used for overlap scoring against user skills/tools/role. */
  keywords: string;
  /** Candidate transferable skill labels (picked dynamically by overlap). */
  skillTags: string[];
  salaryMin: number;
  salaryMax: number;
  /** Exclude / heavily penalize unless the profile shows coding signals. */
  requiresCoding?: boolean;
  /** Exclude unless the profile shows ML / advanced analytics signals. */
  requiresMl?: boolean;
};

/** Map ROLE_CATALOG family labels → recommendation families. */
export const CATALOG_FAMILY_TO_REC: Record<string, RecFamily> = {
  Salesforce: "salesforce",
  "Business & Strategy": "business_strategy",
  "Data & Analytics": "data_analytics",
  "Quality & Testing": "quality",
  "Program & Project Management": "program_pm",
  Product: "product",
  "Software Engineering": "software_engineering",
  "Revenue Operations": "revenue_ops",
  "Customer Success": "customer_success",
  Security: "security",
  "IT Operations": "it_operations",
  Design: "design",
  Marketing: "marketing",
  Finance: "finance",
  Healthcare: "healthcare",
};

/**
 * How related two families are (0–1). Same family = 1.
 * Used as a soft prior — skill overlap can still outrank a weak adjacent family.
 */
export const FAMILY_AFFINITY: Record<RecFamily, Partial<Record<RecFamily, number>>> = {
  salesforce: {
    salesforce: 1,
    revenue_ops: 0.75,
    business_strategy: 0.7,
    customer_success: 0.55,
    product: 0.45,
    data_analytics: 0.4,
    program_pm: 0.35,
    software_engineering: 0.25,
    quality: 0.2,
    operations: 0.35,
  },
  business_strategy: {
    business_strategy: 1,
    product: 0.75,
    program_pm: 0.65,
    data_analytics: 0.55,
    salesforce: 0.5,
    revenue_ops: 0.5,
    operations: 0.55,
    quality: 0.35,
    customer_success: 0.4,
    software_engineering: 0.2,
  },
  data_analytics: {
    data_analytics: 1,
    product: 0.5,
    business_strategy: 0.55,
    software_engineering: 0.35,
    revenue_ops: 0.4,
    operations: 0.45,
    quality: 0.3,
    security: 0.25,
  },
  quality: {
    quality: 1,
    software_engineering: 0.45,
    product: 0.4,
    business_strategy: 0.35,
    program_pm: 0.35,
    data_analytics: 0.3,
    operations: 0.4,
  },
  program_pm: {
    program_pm: 1,
    product: 0.7,
    business_strategy: 0.65,
    operations: 0.55,
    customer_success: 0.4,
    quality: 0.35,
    salesforce: 0.35,
    software_engineering: 0.25,
  },
  product: {
    product: 1,
    business_strategy: 0.7,
    program_pm: 0.65,
    data_analytics: 0.5,
    design: 0.55,
    quality: 0.4,
    customer_success: 0.4,
    software_engineering: 0.3,
  },
  software_engineering: {
    software_engineering: 1,
    it_operations: 0.55,
    data_analytics: 0.4,
    quality: 0.45,
    product: 0.35,
    security: 0.35,
    salesforce: 0.25,
  },
  revenue_ops: {
    revenue_ops: 1,
    salesforce: 0.75,
    data_analytics: 0.55,
    business_strategy: 0.55,
    customer_success: 0.5,
    product: 0.4,
    operations: 0.4,
  },
  customer_success: {
    customer_success: 1,
    salesforce: 0.5,
    product: 0.45,
    business_strategy: 0.4,
    revenue_ops: 0.45,
    operations: 0.4,
    program_pm: 0.35,
  },
  security: {
    security: 1,
    it_operations: 0.75,
    software_engineering: 0.3,
    data_analytics: 0.35,
    business_strategy: 0.3,
    program_pm: 0.25,
    quality: 0.35,
    operations: 0.4,
  },
  it_operations: {
    it_operations: 1,
    security: 0.7,
    software_engineering: 0.5,
    quality: 0.35,
    data_analytics: 0.3,
    operations: 0.45,
    customer_success: 0.3,
  },
  design: {
    design: 1,
    product: 0.65,
    marketing: 0.45,
    business_strategy: 0.3,
    software_engineering: 0.25,
  },
  marketing: {
    marketing: 1,
    product: 0.5,
    design: 0.45,
    data_analytics: 0.4,
    customer_success: 0.35,
    revenue_ops: 0.35,
  },
  finance: {
    finance: 1,
    data_analytics: 0.5,
    business_strategy: 0.45,
    operations: 0.4,
    revenue_ops: 0.35,
  },
  healthcare: {
    healthcare: 1,
    operations: 0.45,
    business_strategy: 0.35,
    data_analytics: 0.3,
    program_pm: 0.3,
  },
  operations: {
    operations: 1,
    business_strategy: 0.55,
    program_pm: 0.5,
    data_analytics: 0.4,
    customer_success: 0.4,
    quality: 0.35,
    it_operations: 0.35,
  },
};

export function familyAffinity(from: RecFamily, to: RecFamily): number {
  if (from === to) return 1;
  return FAMILY_AFFINITY[from]?.[to] ?? FAMILY_AFFINITY[to]?.[from] ?? 0.15;
}

export const NEXT_ROLE_DESTINATIONS: NextRoleDestination[] = [
  // —— Salesforce ——
  {
    role: "Salesforce AI Administrator",
    family: "salesforce",
    keywords: "salesforce flow automation admin platform crm service cloud ai",
    skillTags: ["Salesforce configuration", "Process automation", "User enablement"],
    salaryMin: 95000,
    salaryMax: 125000,
  },
  {
    role: "Agentforce Specialist",
    family: "salesforce",
    keywords: "salesforce agentforce service automation ai crm",
    skillTags: ["CRM workflow design", "Service process knowledge", "AI-assisted tooling"],
    salaryMin: 100000,
    salaryMax: 135000,
  },
  {
    role: "Salesforce Automation Consultant",
    family: "salesforce",
    keywords: "salesforce flow automation consultant process",
    skillTags: ["Flow / automation design", "Requirements translation", "Stakeholder communication"],
    salaryMin: 105000,
    salaryMax: 140000,
  },
  {
    role: "Salesforce Business Analyst",
    family: "salesforce",
    keywords: "salesforce business analyst requirements process stakeholder",
    skillTags: ["Requirements gathering", "Salesforce domain knowledge", "Process mapping"],
    salaryMin: 90000,
    salaryMax: 120000,
  },
  {
    role: "Salesforce Developer",
    family: "salesforce",
    keywords: "salesforce apex lightning lwc coding developer",
    skillTags: ["Apex / Lightning", "Salesforce configuration", "Debugging"],
    salaryMin: 110000,
    salaryMax: 150000,
    requiresCoding: true,
  },

  // —— Business & Strategy ——
  {
    role: "AI Business Analyst",
    family: "business_strategy",
    keywords: "requirements stakeholder process analysis business ai",
    skillTags: ["Requirements analysis", "Stakeholder management", "Process documentation"],
    salaryMin: 95000,
    salaryMax: 130000,
  },
  {
    role: "Product Operations Analyst",
    family: "business_strategy",
    keywords: "operations workflow cross-functional product process",
    skillTags: ["Cross-functional coordination", "Workflow design", "Metrics tracking"],
    salaryMin: 90000,
    salaryMax: 120000,
  },
  {
    role: "Process Automation Analyst",
    family: "business_strategy",
    keywords: "process automation improvement workflow analysis",
    skillTags: ["Process mapping", "Automation opportunity spotting", "Change enablement"],
    salaryMin: 88000,
    salaryMax: 118000,
  },
  {
    role: "Systems Analyst",
    family: "business_strategy",
    keywords: "systems analyst requirements integration functional",
    skillTags: ["Functional analysis", "System documentation", "UAT coordination"],
    salaryMin: 85000,
    salaryMax: 115000,
  },
  {
    role: "Product Analyst",
    family: "product",
    keywords: "product analyst metrics discovery prioritization insights",
    skillTags: ["Business insights", "Prioritization", "User research synthesis"],
    salaryMin: 90000,
    salaryMax: 125000,
  },

  // —— Data & Analytics ——
  {
    role: "AI Data Analyst",
    family: "data_analytics",
    keywords: "data analysis sql reporting analytics dashboard ai",
    skillTags: ["SQL / querying", "Dashboarding", "Business storytelling with data"],
    salaryMin: 95000,
    salaryMax: 130000,
  },
  {
    role: "Analytics Engineer",
    family: "data_analytics",
    keywords: "sql pipeline modeling dbt analytics engineering",
    skillTags: ["Data modeling", "SQL fluency", "Pipeline reliability"],
    salaryMin: 110000,
    salaryMax: 150000,
  },
  {
    role: "BI Automation Analyst",
    family: "data_analytics",
    keywords: "bi dashboard reporting tableau power bi automation",
    skillTags: ["BI tooling", "Report automation", "KPI definition"],
    salaryMin: 90000,
    salaryMax: 120000,
  },
  {
    role: "Business Intelligence Analyst",
    family: "data_analytics",
    keywords: "business intelligence bi reporting insights stakeholders",
    skillTags: ["Insight generation", "Stakeholder reporting", "Data visualization"],
    salaryMin: 85000,
    salaryMax: 115000,
  },
  {
    role: "Operations Data Analyst",
    family: "data_analytics",
    keywords: "operations data analyst metrics efficiency process",
    skillTags: ["Operational metrics", "Root-cause analysis", "Process measurement"],
    salaryMin: 80000,
    salaryMax: 110000,
  },
  {
    role: "Data Scientist",
    family: "data_analytics",
    keywords: "data science machine learning ml python modeling statistics",
    skillTags: ["Statistical modeling", "Python", "Experiment design"],
    salaryMin: 120000,
    salaryMax: 170000,
    requiresMl: true,
  },

  // —— Quality & Testing ——
  {
    role: "AI QA Analyst",
    family: "quality",
    keywords: "qa testing quality defects test cases validation ai",
    skillTags: ["Test planning", "Defect analysis", "Quality standards"],
    salaryMin: 85000,
    salaryMax: 115000,
  },
  {
    role: "Test Automation Analyst",
    family: "quality",
    keywords: "test automation selenium cypress qa scripting",
    skillTags: ["Test case design", "Automation scripting", "Regression strategy"],
    salaryMin: 95000,
    salaryMax: 130000,
  },
  {
    role: "AI Evaluation Specialist",
    family: "quality",
    keywords: "evaluation validation quality testing ai outputs",
    skillTags: ["Output evaluation", "Edge-case thinking", "Quality rubrics"],
    salaryMin: 100000,
    salaryMax: 140000,
  },
  {
    role: "Quality Engineering Analyst",
    family: "quality",
    keywords: "quality engineering qe testing ci release",
    skillTags: ["Release validation", "Risk-based testing", "Team collaboration"],
    salaryMin: 90000,
    salaryMax: 125000,
  },
  {
    role: "SDET Associate",
    family: "quality",
    keywords: "sdet test development coding automation frameworks",
    skillTags: ["Automated testing", "Debugging mindset", "Framework usage"],
    salaryMin: 100000,
    salaryMax: 140000,
    requiresCoding: true,
  },

  // —— Program & Project Management ——
  {
    role: "AI Project Manager",
    family: "program_pm",
    keywords: "project planning delivery stakeholder timeline coordination ai",
    skillTags: ["Delivery planning", "Stakeholder management", "Risk tracking"],
    salaryMin: 105000,
    salaryMax: 145000,
  },
  {
    role: "Technical Program Analyst",
    family: "program_pm",
    keywords: "program technical dependencies cross-team coordination",
    skillTags: ["Dependency management", "Status communication", "Cross-team alignment"],
    salaryMin: 100000,
    salaryMax: 140000,
  },
  {
    role: "AI Program Coordinator",
    family: "program_pm",
    keywords: "program coordinator planning organization follow-through ai",
    skillTags: ["Program coordination", "Meeting cadence", "Follow-through"],
    salaryMin: 85000,
    salaryMax: 115000,
  },
  {
    role: "Implementation Project Manager",
    family: "program_pm",
    keywords: "implementation project manager rollout change management",
    skillTags: ["Implementation planning", "Change management", "Vendor coordination"],
    salaryMin: 95000,
    salaryMax: 130000,
  },
  {
    role: "Scrum Master / Agile Facilitator",
    family: "program_pm",
    keywords: "scrum master agile facilitation sprint ceremony coaching",
    skillTags: ["Agile ceremonies", "Team facilitation", "Impediment removal"],
    salaryMin: 90000,
    salaryMax: 125000,
  },

  // —— Product ——
  {
    role: "AI Product Manager",
    family: "product",
    keywords: "product manager product owner roadmap prioritization ai",
    skillTags: ["Roadmap ownership", "Stakeholder alignment", "User discovery"],
    salaryMin: 120000,
    salaryMax: 170000,
  },
  {
    role: "Technical Product Manager",
    family: "product",
    keywords: "technical product manager apis platform engineering collaboration",
    skillTags: ["Technical fluency", "Prioritization", "Cross-team delivery"],
    salaryMin: 125000,
    salaryMax: 175000,
  },
  {
    role: "Product Operations Manager",
    family: "product",
    keywords: "product operations processes tooling enablement metrics",
    skillTags: ["Process design", "Tooling enablement", "Metrics tracking"],
    salaryMin: 105000,
    salaryMax: 145000,
  },

  // —— Software Engineering ——
  {
    role: "AI-Assisted Software Developer",
    family: "software_engineering",
    keywords: "software development coding debugging git api programming",
    skillTags: ["Software development", "Debugging", "Version control"],
    salaryMin: 110000,
    salaryMax: 155000,
    requiresCoding: true,
  },
  {
    role: "Integration Developer",
    family: "software_engineering",
    keywords: "integration api middleware systems implementation coding",
    skillTags: ["API integration", "Systems thinking", "Implementation"],
    salaryMin: 105000,
    salaryMax: 145000,
    requiresCoding: true,
  },
  {
    role: "Platform Support Engineer",
    family: "software_engineering",
    keywords: "platform support troubleshooting deployment reliability",
    skillTags: ["Troubleshooting", "Platform operations", "Incident response"],
    salaryMin: 95000,
    salaryMax: 130000,
  },
  {
    role: "Automation Engineer",
    family: "software_engineering",
    keywords: "automation engineer scripting devops workflow bots coding",
    skillTags: ["Scripting", "Workflow automation", "Reliability focus"],
    salaryMin: 105000,
    salaryMax: 145000,
    requiresCoding: true,
  },
  {
    role: "Solutions Engineer",
    family: "software_engineering",
    keywords: "solutions engineer demo technical sales implementation",
    skillTags: ["Technical communication", "Solution design", "Customer demos"],
    salaryMin: 115000,
    salaryMax: 160000,
  },
  {
    role: "DevOps Engineer",
    family: "software_engineering",
    keywords: "devops ci cd kubernetes cloud infrastructure automation",
    skillTags: ["CI/CD", "Infrastructure automation", "Observability"],
    salaryMin: 115000,
    salaryMax: 160000,
    requiresCoding: true,
  },
  {
    role: "Cloud Engineer",
    family: "software_engineering",
    keywords: "cloud aws azure gcp infrastructure networking",
    skillTags: ["Cloud platforms", "Infrastructure design", "Reliability"],
    salaryMin: 115000,
    salaryMax: 160000,
  },

  // —— Revenue Operations ——
  {
    role: "Revenue Operations Analyst",
    family: "revenue_ops",
    keywords: "revops revenue operations crm reporting pipeline salesforce",
    skillTags: ["CRM reporting", "Pipeline hygiene", "Cross-team coordination"],
    salaryMin: 85000,
    salaryMax: 115000,
  },
  {
    role: "RevOps Systems Analyst",
    family: "revenue_ops",
    keywords: "revops systems crm automation forecasting sales process",
    skillTags: ["CRM systems", "Process automation", "Forecasting support"],
    salaryMin: 90000,
    salaryMax: 125000,
  },
  {
    role: "Sales Operations Analyst",
    family: "revenue_ops",
    keywords: "sales operations territory quota reporting enablement",
    skillTags: ["Sales reporting", "Process design", "Enablement support"],
    salaryMin: 80000,
    salaryMax: 110000,
  },

  // —— Customer Success ——
  {
    role: "Customer Success Manager",
    family: "customer_success",
    keywords: "customer success retention onboarding account management",
    skillTags: ["Customer relationship management", "Onboarding", "Retention"],
    salaryMin: 85000,
    salaryMax: 120000,
  },
  {
    role: "Technical Support Specialist",
    family: "customer_success",
    keywords: "technical support troubleshooting tickets customer help desk",
    skillTags: ["Troubleshooting", "Customer communication", "Ticket triage"],
    salaryMin: 65000,
    salaryMax: 90000,
  },
  {
    role: "Implementation Specialist",
    family: "customer_success",
    keywords: "implementation onboarding configuration customer rollout",
    skillTags: ["Configuration", "Customer onboarding", "Training"],
    salaryMin: 75000,
    salaryMax: 105000,
  },

  // —— Security ——
  {
    role: "Security Operations Analyst",
    family: "security",
    keywords: "security soc monitoring alerts incident response siem",
    skillTags: ["Threat monitoring", "Incident triage", "Security tooling"],
    salaryMin: 90000,
    salaryMax: 125000,
  },
  {
    role: "Cloud Security Analyst",
    family: "security",
    keywords: "cloud security aws azure identity access controls compliance",
    skillTags: ["Cloud security controls", "Identity & access", "Risk assessment"],
    salaryMin: 105000,
    salaryMax: 145000,
  },
  {
    role: "GRC / Compliance Analyst",
    family: "security",
    keywords: "grc governance risk compliance policy audit security",
    skillTags: ["Risk assessment", "Policy & controls", "Audit readiness"],
    salaryMin: 95000,
    salaryMax: 130000,
  },
  {
    role: "Identity & Access Analyst",
    family: "security",
    keywords: "identity access iam authentication authorization okta",
    skillTags: ["Access management", "Identity systems", "Least-privilege design"],
    salaryMin: 95000,
    salaryMax: 130000,
  },
  {
    role: "Application Security Analyst",
    family: "security",
    keywords: "application security secure sdlc vulnerability assessment",
    skillTags: ["Vulnerability assessment", "Secure design review", "Risk communication"],
    salaryMin: 105000,
    salaryMax: 145000,
  },
  {
    role: "Security Engineer",
    family: "security",
    keywords: "security engineer detection engineering automation tooling",
    skillTags: ["Detection engineering", "Security automation", "Systems hardening"],
    salaryMin: 120000,
    salaryMax: 165000,
    requiresCoding: true,
  },
  {
    role: "Cybersecurity Consultant",
    family: "security",
    keywords: "cybersecurity consultant advisory assessment controls clients",
    skillTags: ["Security assessments", "Stakeholder advising", "Control frameworks"],
    salaryMin: 110000,
    salaryMax: 155000,
  },

  // —— IT Operations ——
  {
    role: "Systems Administrator",
    family: "it_operations",
    keywords: "systems administrator servers networking patching infrastructure",
    skillTags: ["Systems administration", "Troubleshooting", "Infrastructure ops"],
    salaryMin: 75000,
    salaryMax: 105000,
  },
  {
    role: "IT Operations Analyst",
    family: "it_operations",
    keywords: "it operations monitoring incidents change management",
    skillTags: ["Incident response", "Change management", "Operational monitoring"],
    salaryMin: 70000,
    salaryMax: 100000,
  },
  {
    role: "Network Operations Analyst",
    family: "it_operations",
    keywords: "network operations connectivity firewall monitoring",
    skillTags: ["Network troubleshooting", "Monitoring", "Documentation"],
    salaryMin: 75000,
    salaryMax: 105000,
  },
  {
    role: "Cloud Operations Analyst",
    family: "it_operations",
    keywords: "cloud operations aws azure monitoring reliability",
    skillTags: ["Cloud operations", "Reliability monitoring", "Access controls"],
    salaryMin: 90000,
    salaryMax: 125000,
  },
  {
    role: "IT Support Lead",
    family: "it_operations",
    keywords: "it support help desk escalation desktop support leadership",
    skillTags: ["Support leadership", "Escalation handling", "User enablement"],
    salaryMin: 70000,
    salaryMax: 95000,
  },

  // —— Design ——
  {
    role: "Product Designer",
    family: "design",
    keywords: "product design ux ui research prototyping figma",
    skillTags: ["UX research", "Interface design", "Prototyping"],
    salaryMin: 95000,
    salaryMax: 140000,
  },
  {
    role: "UX Researcher",
    family: "design",
    keywords: "ux research interviews usability insights product",
    skillTags: ["User interviews", "Usability testing", "Insight synthesis"],
    salaryMin: 90000,
    salaryMax: 130000,
  },

  // —— Marketing ——
  {
    role: "Growth Marketing Analyst",
    family: "marketing",
    keywords: "growth marketing analytics campaigns funnel metrics",
    skillTags: ["Campaign analysis", "Funnel metrics", "Experimentation"],
    salaryMin: 80000,
    salaryMax: 115000,
  },
  {
    role: "Marketing Operations Specialist",
    family: "marketing",
    keywords: "marketing operations crm automation campaigns enablement",
    skillTags: ["Campaign ops", "Marketing automation", "Process coordination"],
    salaryMin: 75000,
    salaryMax: 105000,
  },

  // —— Finance ——
  {
    role: "Financial Analyst",
    family: "finance",
    keywords: "financial analysis reporting forecasting excel fp&a",
    skillTags: ["Financial reporting", "Forecasting", "Spreadsheet modeling"],
    salaryMin: 80000,
    salaryMax: 115000,
  },
  {
    role: "FP&A Analyst",
    family: "finance",
    keywords: "fp&a budgeting variance analysis planning finance",
    skillTags: ["Budgeting", "Variance analysis", "Business partnering"],
    salaryMin: 90000,
    salaryMax: 125000,
  },

  // —— Healthcare ——
  {
    role: "Clinical Informatics Analyst",
    family: "healthcare",
    keywords: "clinical informatics ehr healthcare data workflows",
    skillTags: ["Clinical workflows", "EHR familiarity", "Process improvement"],
    salaryMin: 85000,
    salaryMax: 120000,
  },
  {
    role: "Healthcare Operations Analyst",
    family: "healthcare",
    keywords: "healthcare operations quality patient process improvement",
    skillTags: ["Care operations", "Quality improvement", "Coordination"],
    salaryMin: 75000,
    salaryMax: 105000,
  },

  // —— Generic operations ——
  {
    role: "Operations Analyst",
    family: "operations",
    keywords: "operations workflow process analysis coordination",
    skillTags: ["Process familiarity", "Coordination", "Documentation"],
    salaryMin: 70000,
    salaryMax: 95000,
  },
  {
    role: "Process Improvement Specialist",
    family: "operations",
    keywords: "process improvement workflow efficiency documentation",
    skillTags: ["Process improvement", "Efficiency analysis", "Change support"],
    salaryMin: 75000,
    salaryMax: 105000,
  },
  {
    role: "AI Workflow Coordinator",
    family: "operations",
    keywords: "workflow coordination tools adoption enablement ai",
    skillTags: ["Tool adoption", "Workflow coordination", "Enablement"],
    salaryMin: 70000,
    salaryMax: 100000,
  },
  {
    role: "Business Operations Associate",
    family: "operations",
    keywords: "business operations associate support coordination admin",
    skillTags: ["Operational support", "Priority juggling", "Team communication"],
    salaryMin: 65000,
    salaryMax: 90000,
  },
  {
    role: "Digital Transformation Coordinator",
    family: "operations",
    keywords: "digital transformation coordinator change tools rollout",
    skillTags: ["Change coordination", "Tool rollout", "Stakeholder updates"],
    salaryMin: 75000,
    salaryMax: 105000,
  },
];
