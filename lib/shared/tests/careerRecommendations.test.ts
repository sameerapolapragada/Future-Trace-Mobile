import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildRecommendations } from "../scan/careerRecommendations";
import type { NormalizedScanInput } from "../types";

function baseInput(overrides: Partial<NormalizedScanInput>): NormalizedScanInput {
  const currentRole = overrides.currentRole ?? "Role";
  return {
    currentRole,
    targetRole: overrides.targetRole ?? "Target Role",
    identifiedCareerProfile: overrides.identifiedCareerProfile ?? currentRole,
    industry: "Technology",
    yearsExperience: 5,
    skills: "—",
    tools: "—",
    careerGoal: "Grow",
    workPreference: "hybrid",
    ...overrides,
    currentRole,
    identifiedCareerProfile: overrides.identifiedCareerProfile ?? currentRole,
  };
}

describe("buildRecommendations", () => {
  it("returns Salesforce administrator next-step roles with high transferability", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "Salesforce Administrator",
        skills: "Salesforce, Flow, Reports, User Support",
        tools: "Salesforce, Service Cloud",
      })
    );

    assert.equal(recs.length, 3);
    assert.equal(recs[0]?.role, "Salesforce AI Administrator");
    assert.equal(recs[1]?.role, "Agentforce Specialist");
    assert.equal(recs[2]?.role, "Salesforce Automation Consultant");
    assert.ok(recs[0]!.transferabilityScore >= 88);
    assert.ok(recs[0]!.why.length > 20);
    assert.ok(!recs.some((item) => /machine learning engineer|ai product manager/i.test(item.role)));
  });

  it("returns business analyst next-step roles", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "Business Analyst",
        skills: "Requirements, Stakeholder Management, Process Analysis",
        tools: "Jira, Confluence, Excel",
      })
    );

    assert.deepEqual(
      recs.map((item) => item.role),
      ["AI Business Analyst", "Product Operations Analyst", "Process Automation Analyst"]
    );
    assert.ok(recs[0]!.transferabilityScore >= 85);
  });

  it("returns data analyst next-step roles", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "Data Analyst",
        skills: "SQL, Reporting, Dashboards",
        tools: "Excel, Tableau, SQL",
      })
    );

    assert.deepEqual(
      recs.map((item) => item.role),
      ["AI Data Analyst", "Analytics Engineer", "BI Automation Analyst"]
    );
  });

  it("returns QA analyst next-step roles", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "QA Analyst",
        skills: "Test Cases, Defect Tracking, Regression Testing",
        tools: "Jira, Selenium",
      })
    );

    assert.deepEqual(
      recs.map((item) => item.role),
      ["AI QA Analyst", "Test Automation Analyst", "AI Evaluation Specialist"]
    );
  });

  it("returns project manager next-step roles", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "Project Manager",
        skills: "Planning, Stakeholder Communication, Delivery",
        tools: "Jira, MS Project, Smartsheet",
      })
    );

    assert.deepEqual(
      recs.map((item) => item.role),
      ["AI Project Manager", "Technical Program Analyst", "AI Program Coordinator"]
    );
  });

  it("does not recommend distant roles for a generic profile without overlap", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "Office Coordinator",
        skills: "Scheduling, Documentation",
        tools: "Microsoft Office",
      })
    );

    assert.ok(!recs.some((item) => /machine learning engineer|ai product manager|ai governance lead/i.test(item.role)));
    assert.equal(recs.length, 3);
  });

  it("sorts recommendations by transferability descending", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "Salesforce Administrator",
        skills: "Salesforce, Flow, Automation",
        tools: "Salesforce",
      })
    );

    assert.ok(recs[0]!.transferabilityScore >= recs[1]!.transferabilityScore);
    assert.ok(recs[1]!.transferabilityScore >= recs[2]!.transferabilityScore);
  });
});
