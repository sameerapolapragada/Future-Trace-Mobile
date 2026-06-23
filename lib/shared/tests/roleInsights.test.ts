import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateHybridScan } from "../scan/hybridScan";
import { buildRoleInsights } from "../scan/roleInsights";
import { InMemoryOnetCache } from "../onet/cache";
import type { NormalizedScanInput } from "../types";

const salesforceInput: NormalizedScanInput = {
  currentRole: "Salesforce Administrator",
  targetRole: "RevOps Analyst",
  identifiedCareerProfile: "Salesforce Administrator",
  industry: "Technology",
  yearsExperience: 5,
  skills: "Salesforce, Flow, Reports, User Support",
  tools: "Salesforce, Service Cloud",
  careerGoal: "",
  workPreference: "hybrid",
};

describe("buildRoleInsights", () => {
  it("uses Salesforce-relevant strengths instead of generic O*NET skills", () => {
    const insights = buildRoleInsights(salesforceInput, salesforceInput.currentRole, false);

    assert.ok(insights.strengths.some((item) => /flow|salesforce/i.test(item)));
    assert.ok(!insights.strengths.some((item) => /active listening|writing \(onet/i.test(item)));
    assert.ok(insights.vulnerabilities.some((item) => /automation|copilot|commodity/i.test(item)));
    assert.ok(insights.opportunityZones.some((item) => /agentforce|automation|revops/i.test(item)));
  });
});

describe("generateHybridScan insights", () => {
  it("does not surface generic O*NET skill labels in strengths", async () => {
    const result = await generateHybridScan(salesforceInput, {
      onet: { cache: new InMemoryOnetCache() },
      explanation: {},
    });

    const joined = result.currentRoleProfile.strengths.join(" ").toLowerCase();
    assert.ok(!joined.includes("active listening"));
    assert.ok(!joined.includes("onet skill"));
    assert.ok(joined.includes("flow") || joined.includes("salesforce"));
  });
});
