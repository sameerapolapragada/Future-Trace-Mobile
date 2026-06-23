import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateHybridScan } from "../scan/hybridScan";
import { normalizeScanInput } from "../scan/normalize";
import {
  resolveCanonicalRole,
  roleStringSimilarity,
  ROLE_MATCH_CONFIDENCE_THRESHOLD,
} from "../scan/roleCanonicalization";
import { InMemoryOnetCache } from "../onet/cache";
import type { ScanFormInput } from "../types";

describe("resolveCanonicalRole", () => {
  it("maps Salesforce role variants to Salesforce Administrator", () => {
    const variants = [
      "Salesforce Administrator",
      "Salesforce Administrtor",
      "Salesforce Admin",
      "salesforce administrator",
      "Sales force administrator",
      "SF Admin",
    ];

    for (const role of variants) {
      const resolved = resolveCanonicalRole(role);
      assert.equal(resolved.canonical, "Salesforce Administrator");
      assert.ok(resolved.matchConfidence >= ROLE_MATCH_CONFIDENCE_THRESHOLD);
    }
  });

  it("maps minor business analyst typos to Business Analyst", () => {
    const resolved = resolveCanonicalRole("Busines Analyst");
    assert.equal(resolved.canonical, "Business Analyst");
    assert.ok(resolved.matchConfidence >= ROLE_MATCH_CONFIDENCE_THRESHOLD);
  });

  it("maps O*NET-backed roles with spelling and capitalization variants", () => {
    const cases: Array<[string, string]> = [
      ["software developer", "Software Developer"],
      ["Software Develper", "Software Developer"],
      ["marketing manager", "Marketing Manager"],
      ["Markting Manager", "Marketing Manager"],
      ["registered nurse", "Registered Nurse"],
      ["RN", "Registered Nurse"],
      ["customer service representative", "Customer Service Representative"],
      ["devops engineer", "DevOps Engineer"],
      ["graphic designer", "Graphic Designer"],
      ["Grahic Designer", "Graphic Designer"],
    ];

    for (const [input, expected] of cases) {
      const resolved = resolveCanonicalRole(input);
      assert.equal(resolved.canonical, expected, `failed for input: ${input}`);
    }
  });

  it("applies consistent formatting when no catalog match is found", () => {
    const resolved = resolveCanonicalRole("  chief  happiness  officer  ");
    assert.equal(resolved.canonical, "Chief Happiness Officer");
  });
});

describe("normalizeScanInput role canonicalization", () => {
  function form(currentRole: string, targetRole = "RevOps Analyst"): ScanFormInput {
    return {
      currentRole,
      targetRole,
      industry: "Technology",
      yearsExperience: "5",
      skills: "Salesforce, Flow, Reports",
      tools: "Salesforce, Service Cloud",
      careerGoal: "",
      workPreference: "Hybrid",
    };
  }

  it("canonicalizes current role before scan input is stored", () => {
    const normalized = normalizeScanInput(form("Salesforce Administrtor"));
    assert.equal(normalized.currentRole, "Salesforce Administrator");
    assert.equal(normalized.identifiedCareerProfile, "Salesforce Administrator");
  });
});

describe("generateHybridScan role consistency", () => {
  async function runScan(currentRole: string) {
    const input = normalizeScanInput({
      currentRole,
      targetRole: "RevOps Analyst",
      industry: "Technology",
      yearsExperience: "5",
      skills: "Salesforce, Flow, Reports",
      tools: "Salesforce, Service Cloud",
      careerGoal: "",
      workPreference: "Hybrid",
    });

    return generateHybridScan(input, {
      onet: { cache: new InMemoryOnetCache() },
      explanation: {},
    });
  }

  it("produces identical scores for Salesforce role spelling variants", async () => {
    const baseline = await runScan("Salesforce Administrator");
    const typo = await runScan("Salesforce Administrtor");
    const shortForm = await runScan("Salesforce Admin");

    assert.equal(typo.identifiedCareerProfile, "Salesforce Administrator");
    assert.equal(shortForm.identifiedCareerProfile, "Salesforce Administrator");

    assert.equal(
      typo.currentRoleProfile.resilienceScore,
      baseline.currentRoleProfile.resilienceScore
    );
    assert.equal(
      typo.currentRoleProfile.aiExposureScore,
      baseline.currentRoleProfile.aiExposureScore
    );
    assert.equal(
      shortForm.currentRoleProfile.aiExposureScore,
      baseline.currentRoleProfile.aiExposureScore
    );

    assert.deepEqual(
      typo.initialRoleRecommendations.map((item) => item.role),
      baseline.initialRoleRecommendations.map((item) => item.role)
    );
    assert.deepEqual(
      shortForm.initialRoleRecommendations.map((item) => item.transferabilityScore),
      baseline.initialRoleRecommendations.map((item) => item.transferabilityScore)
    );
  });

  it("keeps fuzzy matches above the confidence threshold for common typos", () => {
    assert.ok(
      roleStringSimilarity("Salesforce Administrtor", "Salesforce Administrator") >=
        ROLE_MATCH_CONFIDENCE_THRESHOLD
    );
  });
});
