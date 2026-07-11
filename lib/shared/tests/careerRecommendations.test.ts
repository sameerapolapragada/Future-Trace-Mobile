import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildRecommendations, NEXT_ROLES_COUNT } from "../scan/careerRecommendations";
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

    assert.equal(recs.length, NEXT_ROLES_COUNT);
    assert.equal(recs[0]?.role, "Salesforce AI Administrator");
    assert.equal(recs[1]?.role, "Agentforce Specialist");
    assert.equal(recs[2]?.role, "Salesforce Automation Consultant");
    assert.ok(recs[0]!.transferabilityScore >= 88);
    assert.ok(recs[0]!.why.length > 20);
    assert.ok(recs[0]!.salaryLabel);
    assert.equal(recs[0]!.transferableSkills?.length, 3);
    assert.ok(recs[0]!.transitionLabel);
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

    assert.equal(recs[0]?.role, "AI Business Analyst");
    assert.equal(recs[1]?.role, "Product Operations Analyst");
    assert.equal(recs[2]?.role, "Process Automation Analyst");
    assert.equal(recs.length, NEXT_ROLES_COUNT);
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

    assert.equal(recs[0]?.role, "AI Data Analyst");
    assert.equal(recs[1]?.role, "Analytics Engineer");
    assert.equal(recs[2]?.role, "BI Automation Analyst");
    assert.equal(recs.length, NEXT_ROLES_COUNT);
  });

  it("returns QA analyst next-step roles", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "QA Analyst",
        skills: "Test Cases, Defect Tracking, Regression Testing",
        tools: "Jira, Selenium",
      })
    );

    assert.equal(recs[0]?.role, "AI QA Analyst");
    assert.equal(recs[1]?.role, "Test Automation Analyst");
    assert.equal(recs[2]?.role, "AI Evaluation Specialist");
    assert.equal(recs.length, NEXT_ROLES_COUNT);
  });

  it("returns project manager next-step roles", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "Project Manager",
        skills: "Planning, Stakeholder Communication, Delivery",
        tools: "Jira, MS Project, Smartsheet",
      })
    );

    assert.equal(recs[0]?.role, "AI Project Manager");
    assert.equal(recs[1]?.role, "Technical Program Analyst");
    assert.equal(recs[2]?.role, "AI Program Coordinator");
    assert.equal(recs.length, NEXT_ROLES_COUNT);
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
    assert.equal(recs.length, NEXT_ROLES_COUNT);
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
