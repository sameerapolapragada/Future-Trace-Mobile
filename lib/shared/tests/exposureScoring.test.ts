import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchLocalOccupation } from "../onet/matchOccupation";
import { resolveOccupation } from "../onet/client";
import { InMemoryOnetCache } from "../onet/cache";
import { calculateExposureScore, fallbackExposureFromArchetype, scoreToExposureLevel } from "../exposure/scoringEngine";
import { templateExplanation } from "../exposure/explanationService";
import { generateHybridScan } from "../scan/hybridScan";
import type { NormalizedScanInput } from "../types";

const sampleInput: NormalizedScanInput = {
  currentRole: "Salesforce Administrator",
  targetRole: "RevOps Analyst",
  identifiedCareerProfile: "Salesforce Administrator",
  industry: "Technology",
  yearsExperience: 5,
  skills: "Salesforce, Flow, Reports",
  tools: "Salesforce, Excel",
  careerGoal: "Move into revenue operations",
  workPreference: "hybrid",
};

describe("O*NET matching", () => {
  it("matches a known role to local O*NET occupation", () => {
    const match = matchLocalOccupation("Salesforce Administrator");
    assert.ok(match);
    assert.match(match!.occupation.title, /Computer Systems Analysts/i);
    assert.ok(match!.matchScore >= 0.35);
  });

  it("matches cybersecurity analyst to information security occupation", () => {
    const match = matchLocalOccupation("Cybersecurity Analyst");
    assert.ok(match);
    assert.match(match!.occupation.title, /Information Security/i);
  });

  it("returns null for unrecognized role without crashing", () => {
    const match = matchLocalOccupation("xyzzy unknown role 99999");
    assert.equal(match, null);
  });

  it("uses cache on second resolveOccupation call", async () => {
    const cache = new InMemoryOnetCache();
    const first = await resolveOccupation("Software Developer", { cache });
    const second = await resolveOccupation("Software Developer", { cache });
    assert.equal(first?.matchedVia, "local_index");
    assert.equal(second?.matchedVia, "cache");
  });
});

describe("Exposure scoring engine", () => {
  it("returns score between 0 and 100", () => {
    const match = matchLocalOccupation("Customer Support Specialist");
    assert.ok(match);
    const score = calculateExposureScore({
      currentRole: "Customer Support Specialist",
      industry: "General",
      yearsExperience: 2,
      skills: "Communication",
      tools: "Zendesk",
      occupationTitle: match!.occupation.title,
      tasks: match!.occupation.tasks,
      onetSkills: match!.occupation.skills,
      workActivities: match!.occupation.workActivities,
    });
    assert.ok(score.aiExposureScore >= 0 && score.aiExposureScore <= 100);
  });

  it("maps exposure level to score range", () => {
    assert.equal(scoreToExposureLevel(25), "Low");
    assert.equal(scoreToExposureLevel(55), "Moderate");
    assert.equal(scoreToExposureLevel(80), "High");
  });

  it("handles empty tasks without crashing", () => {
    const score = calculateExposureScore({
      currentRole: "Unknown",
      industry: "General",
      yearsExperience: 4,
      skills: "",
      tools: "",
      tasks: [],
      onetSkills: [],
      workActivities: [],
    });
    assert.ok(score.aiExposureScore >= 0 && score.aiExposureScore <= 100);
    assert.ok(["Low", "Moderate", "High"].includes(score.exposureLevel));
  });

  it("fallback archetype stays in valid range", () => {
    const score = fallbackExposureFromArchetype("high");
    assert.ok(score.aiExposureScore >= 70 && score.aiExposureScore <= 100);
    assert.equal(score.exposureLevel, "High");
  });
});

describe("OpenAI explanation fallback", () => {
  it("uses template when API key is absent", async () => {
    const match = matchLocalOccupation("Software Developer");
    assert.ok(match);
    const exposure = calculateExposureScore({
      currentRole: "Software Developer",
      industry: "Technology",
      yearsExperience: 6,
      skills: "Python, React",
      tools: "GitHub Copilot",
      occupationTitle: match!.occupation.title,
      tasks: match!.occupation.tasks,
      onetSkills: match!.occupation.skills,
      workActivities: match!.occupation.workActivities,
    });

    const explanation = templateExplanation(
      {
        currentRole: "Software Developer",
        industry: "Technology",
        yearsExperience: 6,
        skills: "Python, React",
        tools: "GitHub Copilot",
        tasks: match!.occupation.tasks,
        onetSkills: match!.occupation.skills,
        workActivities: match!.occupation.workActivities,
      },
      exposure
    );

    assert.ok(explanation.explanation.includes(String(exposure.aiExposureScore)));
    assert.ok(explanation.skillsToStrengthen.length > 0);
  });
});

describe("generateHybridScan", () => {
  it("produces hybrid result with O*NET match", async () => {
    const result = await generateHybridScan(sampleInput, {
      onet: { cache: new InMemoryOnetCache() },
      explanation: {},
    });

    assert.equal(result.currentRole, "Salesforce Administrator");
    assert.ok(result.currentRoleProfile.aiExposureScore != null);
    assert.ok(result.currentRoleProfile.aiExposureScore! >= 0);
    assert.ok(result.exposureMeta?.onetOccupationCode);
    assert.ok((result.exposureMeta?.matchConfidence ?? 0) >= 0.35);
    assert.ok(result.summary.length > 40);
  });

  it("falls back gracefully when role has no O*NET match", async () => {
    const result = await generateHybridScan(
      { ...sampleInput, currentRole: "xyzzy unknown role 99999", targetRole: "Another unknown 888" },
      { onet: { cache: new InMemoryOnetCache() }, explanation: {} }
    );

    assert.ok(result.currentRoleProfile.aiExposureScore != null);
    assert.equal(result.exposureMeta?.matchedVia, "fallback_archetype");
  });
});
