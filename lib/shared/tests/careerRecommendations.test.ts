import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildRecommendations,
  NEXT_ROLES_COUNT,
  resolveSourceFamily,
} from "../scan/careerRecommendations";
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
  it("resolves Cybersecurity Analyst to the security family", () => {
    assert.equal(resolveSourceFamily(baseInput({ currentRole: "Cybersecurity Analyst" })), "security");
  });

  it("does not recommend coding software roles for Cybersecurity Analyst without coding skills", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "Cybersecurity Analyst",
        skills: "Threat monitoring, Incident response, Risk assessment, SIEM",
        tools: "Splunk, CrowdStrike, Okta",
      })
    );

    assert.equal(recs.length, NEXT_ROLES_COUNT);
    assert.ok(
      recs.every((item) => !/software developer|integration developer|sdet/i.test(item.role)),
      `unexpected coding roles: ${recs.map((r) => r.role).join(", ")}`
    );
    assert.ok(
      recs.some((item) => /security|grc|identity|soc|cyber/i.test(item.role)),
      `expected security-adjacent roles, got: ${recs.map((r) => r.role).join(", ")}`
    );
    assert.ok(
      !recs[0]!.transferableSkills?.some((s) => /debugging|version control|software development/i.test(s)),
      `unexpected coding transferable skills: ${recs[0]!.transferableSkills?.join(", ")}`
    );
    // O*NET-backed transferable skills should surface when occupations share a profile.
    assert.ok(
      recs[0]!.transferableSkills?.some((s) =>
        /Critical Thinking|Complex Problem Solving|Systems Analysis|Threat|Incident|Security|Risk/i.test(s)
      ),
      `expected evidence-based skills, got: ${recs[0]!.transferableSkills?.join(", ")}`
    );
  });

  it("returns Salesforce-adjacent next roles for Salesforce Administrator", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "Salesforce Administrator",
        skills: "Salesforce, Flow, Reports, User Support",
        tools: "Salesforce, Service Cloud",
      })
    );

    assert.equal(recs.length, NEXT_ROLES_COUNT);
    assert.ok(/salesforce|agentforce|revops|revenue/i.test(recs[0]!.role));
    assert.ok(recs[0]!.transferabilityScore >= 80);
    assert.ok(recs[0]!.why.length > 20);
    assert.ok(recs[0]!.salaryLabel);
    assert.equal(recs[0]!.transferableSkills?.length, 3);
    assert.ok(recs[0]!.transitionLabel);
    assert.ok(!recs.some((item) => /machine learning engineer|ai product manager/i.test(item.role)));
  });

  it("returns business analyst–adjacent next roles", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "Business Analyst",
        skills: "Requirements, Stakeholder Management, Process Analysis",
        tools: "Jira, Confluence, Excel",
      })
    );

    assert.equal(recs.length, NEXT_ROLES_COUNT);
    assert.ok(/analyst|operations|automation|product/i.test(recs[0]!.role));
    assert.ok(recs[0]!.transferabilityScore >= 75);
  });

  it("returns data analyst–adjacent next roles", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "Data Analyst",
        skills: "SQL, Reporting, Dashboards",
        tools: "Excel, Tableau, SQL",
      })
    );

    assert.equal(recs.length, NEXT_ROLES_COUNT);
    assert.ok(/data|analytics|bi|intelligence/i.test(recs[0]!.role));
  });

  it("returns QA analyst–adjacent next roles", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "QA Analyst",
        skills: "Test Cases, Defect Tracking, Regression Testing",
        tools: "Jira, Selenium",
      })
    );

    assert.equal(recs.length, NEXT_ROLES_COUNT);
    assert.ok(/qa|test|quality|evaluation/i.test(recs[0]!.role));
  });

  it("returns project manager–adjacent next roles", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "Project Manager",
        skills: "Planning, Stakeholder Communication, Delivery",
        tools: "Jira, MS Project, Smartsheet",
      })
    );

    assert.equal(recs.length, NEXT_ROLES_COUNT);
    assert.ok(/project|program|scrum|implementation|agile/i.test(recs[0]!.role));
  });

  it("does not recommend distant roles for a generic profile without overlap", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "Office Coordinator",
        skills: "Scheduling, Documentation",
        tools: "Microsoft Office",
      })
    );

    assert.ok(!recs.some((item) => /machine learning|ai product manager|ai governance/i.test(item.role)));
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

  it("can recommend coding roles when the profile has coding signals", () => {
    const recs = buildRecommendations(
      baseInput({
        currentRole: "Software Developer",
        skills: "Python, Debugging, APIs, Git",
        tools: "GitHub, VS Code, Docker",
      })
    );

    assert.equal(recs.length, NEXT_ROLES_COUNT);
    assert.ok(recs.some((item) => /developer|engineer|devops|automation/i.test(item.role)));
  });
});
