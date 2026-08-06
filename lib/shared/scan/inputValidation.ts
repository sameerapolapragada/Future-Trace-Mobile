/**
 * Strict free-text validators for Career Scan inputs.
 * Blocks lifestyle / gibberish titles and responsibilities (e.g. "eat and sleep").
 */

const JOB_TITLE_MIN = 3;
const JOB_TITLE_MAX = 80;
const RESPONSIBILITIES_MIN = 24;
const RESPONSIBILITIES_MAX = 500;
const CERTS_MAX = 160;

/** Words that alone do not describe a job title or work responsibilities. */
const LIFESTYLE_BLOCKLIST = new Set([
  "eat",
  "eating",
  "sleep",
  "sleeping",
  "slept",
  "food",
  "meal",
  "meals",
  "cook",
  "cooking",
  "nap",
  "napping",
  "rest",
  "resting",
  "play",
  "playing",
  "game",
  "games",
  "gaming",
  "watch",
  "watching",
  "tv",
  "netflix",
  "youtube",
  "fun",
  "love",
  "life",
  "living",
  "hobby",
  "hobbies",
  "party",
  "parties",
  "drink",
  "drinking",
  "nothing",
  "anything",
  "everything",
  "stuff",
  "things",
  "blah",
  "bla",
  "asdf",
  "qwerty",
  "test",
  "testing",
  "tester",
  "demo",
  "sample",
  "lorem",
  "ipsum",
  "foo",
  "bar",
  "baz",
  "hello",
  "hi",
  "hey",
  "world",
  "abc",
  "xyz",
  "none",
  "n/a",
  "na",
  "idk",
  "unknown",
  "tbd",
  "todo",
  "null",
  "undefined",
]);

/** Strong signals that text describes professional work. */
const WORK_SIGNAL_WORDS = [
  "manage",
  "management",
  "manager",
  "lead",
  "leader",
  "leadership",
  "develop",
  "developer",
  "development",
  "design",
  "designer",
  "analyze",
  "analysis",
  "analyst",
  "build",
  "building",
  "support",
  "supporting",
  "customer",
  "client",
  "clients",
  "code",
  "coding",
  "software",
  "data",
  "database",
  "project",
  "product",
  "sales",
  "marketing",
  "engineer",
  "engineering",
  "admin",
  "administrator",
  "administration",
  "architect",
  "architecture",
  "consult",
  "consultant",
  "consulting",
  "coordinate",
  "coordinator",
  "operate",
  "operations",
  "ops",
  "process",
  "processes",
  "system",
  "systems",
  "platform",
  "platforms",
  "cloud",
  "security",
  "network",
  "api",
  "apis",
  "report",
  "reporting",
  "dashboard",
  "dashboards",
  "automate",
  "automation",
  "implement",
  "implementation",
  "configure",
  "configuration",
  "deploy",
  "deployment",
  "test",
  "testing",
  "qa",
  "quality",
  "stakeholder",
  "stakeholders",
  "requirement",
  "requirements",
  "workflow",
  "workflows",
  "pipeline",
  "pipelines",
  "crm",
  "erp",
  "saas",
  "ai",
  "ml",
  "machine",
  "learning",
  "research",
  "strategy",
  "strategic",
  "budget",
  "finance",
  "financial",
  "compliance",
  "governance",
  "training",
  "mentor",
  "mentoring",
  "hire",
  "hiring",
  "team",
  "teams",
  "deliver",
  "delivery",
  "service",
  "services",
  "ticket",
  "tickets",
  "incident",
  "incidents",
  "monitor",
  "monitoring",
  "optimize",
  "optimization",
  "document",
  "documentation",
  "meeting",
  "meetings",
  "presentation",
  "presentations",
  "salesforce",
  "aws",
  "azure",
  "google",
  "hubspot",
  "jira",
  "sql",
  "python",
  "java",
  "javascript",
  "typescript",
  "react",
  "node",
  "devops",
  "sre",
  "ux",
  "ui",
  "frontend",
  "backend",
  "fullstack",
  "full-stack",
  "mobile",
  "ios",
  "android",
  "web",
  "application",
  "applications",
  "business",
  "technical",
  "technology",
  "tech",
  "digital",
  "information",
  "it",
  "role",
  "job",
  "work",
  "working",
  "responsibility",
  "responsibilities",
  "duty",
  "duties",
  "task",
  "tasks",
  "daily",
  "day-to-day",
  "professional",
];

const JOB_TITLE_ROLE_TOKENS = [
  "analyst",
  "engineer",
  "developer",
  "manager",
  "administrator",
  "admin",
  "architect",
  "consultant",
  "specialist",
  "scientist",
  "designer",
  "director",
  "lead",
  "officer",
  "coordinator",
  "associate",
  "intern",
  "technician",
  "strategist",
  "owner",
  "evangelist",
  "researcher",
  "programmer",
  "sre",
  "devops",
  "qa",
  "tester",
  "pm",
  "po",
  "scrum",
  "master",
  "coach",
  "trainer",
  "support",
  "operations",
  "ops",
  "security",
  "network",
  "systems",
  "system",
  "data",
  "product",
  "project",
  "program",
  "business",
  "solutions",
  "solution",
  "platform",
  "cloud",
  "mobile",
  "frontend",
  "backend",
  "fullstack",
  "full-stack",
  "software",
  "application",
  "applications",
  "it",
  "technology",
  "technical",
  "ai",
  "ml",
  "machine",
  "learning",
  "crm",
  "erp",
  "salesforce",
  "hubspot",
  "aws",
  "azure",
  "google",
  "cto",
  "ceo",
  "cio",
  "ciso",
  "cpo",
  "coo",
  "cfo",
  "vp",
  "svp",
  "evp",
  "head",
  "founder",
  "cofounder",
  "co-founder",
];

function tokenize(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9+/#.\-\s]/g, " ")
    .split(/[\s/|,;·•]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function letterCount(raw: string): number {
  return (raw.match(/[a-zA-Z]/g) ?? []).length;
}

function looksLikeKeyboardSmash(normalized: string): boolean {
  const compact = normalized.replace(/\s+/g, "");
  if (compact.length < 4) return false;
  if (/([a-z])\1{3,}/i.test(compact)) return true;
  if (/^(asdf|qwer|zxcv|hjkl|aaaa|bbbb|test)+$/i.test(compact)) return true;
  const vowels = (compact.match(/[aeiou]/gi) ?? []).length;
  return vowels / compact.length < 0.12;
}

function mostlyLifestyle(tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const lifestyleHits = tokens.filter((t) => LIFESTYLE_BLOCKLIST.has(t)).length;
  return lifestyleHits / tokens.length >= 0.5;
}

function hasWorkSignal(tokens: string[]): boolean {
  return tokens.some((t) => WORK_SIGNAL_WORDS.includes(t) || JOB_TITLE_ROLE_TOKENS.includes(t));
}

function hasJobTitleRoleToken(tokens: string[]): boolean {
  return tokens.some((t) => JOB_TITLE_ROLE_TOKENS.includes(t));
}

export function isLikelyNonsenseJobTitle(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return true;
  if (letterCount(trimmed) < 3) return true;
  if (looksLikeKeyboardSmash(trimmed)) return true;
  if (mostlyLifestyle(tokens)) return true;
  if (!hasJobTitleRoleToken(tokens) && !hasWorkSignal(tokens) && tokens.length <= 4) return true;
  return false;
}

export function validateJobTitle(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Enter a job title.";
  if (trimmed.length < JOB_TITLE_MIN) return `Job title must be at least ${JOB_TITLE_MIN} characters.`;
  if (trimmed.length > JOB_TITLE_MAX) return `Job title must be ${JOB_TITLE_MAX} characters or fewer.`;
  if (letterCount(trimmed) < 3) return "Job title must include letters.";
  if (!/^[a-zA-Z0-9][a-zA-Z0-9+/#.\-\s',&()]*$/.test(trimmed)) {
    return "Job title contains invalid characters.";
  }
  if (looksLikeKeyboardSmash(trimmed)) return "Enter a real job title, not random characters.";
  const tokens = tokenize(trimmed);
  if (mostlyLifestyle(tokens)) {
    return "Enter a professional job title (for example, Software Developer), not everyday activities.";
  }
  if (!hasJobTitleRoleToken(tokens)) {
    return "Use a technology job title that includes a role word such as Analyst, Engineer, Developer, Manager, or Administrator.";
  }
  if (isLikelyNonsenseJobTitle(trimmed)) {
    return "We couldn't recognize that as a technology job title. Choose a suggested role or enter a clearer title.";
  }
  return null;
}

export function validateResponsibilities(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return "Describe what you do day-to-day (your key work responsibilities).";
  }
  if (trimmed.length < RESPONSIBILITIES_MIN) {
    return `Please add a bit more detail (at least ${RESPONSIBILITIES_MIN} characters).`;
  }
  if (trimmed.length > RESPONSIBILITIES_MAX) {
    return `Keep responsibilities under ${RESPONSIBILITIES_MAX} characters.`;
  }
  const tokens = tokenize(trimmed);
  if (tokens.length < 4) {
    return "Please describe your work in at least a few words (tasks, tools, or outcomes).";
  }
  if (looksLikeKeyboardSmash(trimmed)) {
    return "Enter a real description of your work responsibilities.";
  }
  if (mostlyLifestyle(tokens) || !hasWorkSignal(tokens)) {
    return "Describe professional work responsibilities (tools, tasks, or outcomes) — not everyday activities like eating or sleeping.";
  }
  return null;
}

export function validateCertifications(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > CERTS_MAX) return `Keep certifications under ${CERTS_MAX} characters.`;
  if (looksLikeKeyboardSmash(trimmed) || mostlyLifestyle(tokenize(trimmed))) {
    return "Enter real certification names (for example, Salesforce Admin, AWS, PMP).";
  }
  return null;
}

export const SCAN_INPUT_LIMITS = {
  jobTitleMax: JOB_TITLE_MAX,
  responsibilitiesMax: RESPONSIBILITIES_MAX,
  certificationsMax: CERTS_MAX,
} as const;
