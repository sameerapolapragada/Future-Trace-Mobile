import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canGenerateScan,
  filterTechnologyCurrentRoles,
  isOtherRoleSelection,
  matchRole,
  OTHER_ROLE_OPTION,
  resolveScanFormRoleInput,
  TECHNOLOGY_CURRENT_ROLES,
} from "../scan/roleMatch";

describe("matchRole", () => {
  it("matches Salesforce Administrator with high confidence", () => {
    const result = matchRole({ originalRoleInput: "Salesforce Administrator" });
    assert.equal(result.matchStatus, "matched");
    assert.equal(result.normalizedRole, "Salesforce Administrator");
    assert.equal(result.roleFamily, "Salesforce");
    assert.ok(result.confidenceScore >= 90);
    assert.equal(result.confidenceLabel, "excellent");
    assert.equal(result.needsMoreInfo, false);
  });

  it("partially matches niche Salesforce architect titles", () => {
    const result = matchRole({
      originalRoleInput: "Senior Salesforce Revenue Cloud Solution Architect",
    });
    assert.equal(result.matchStatus, "partial_match");
    assert.equal(result.normalizedRole, "Salesforce Solution Architect");
    assert.ok(result.confidenceScore >= 70 && result.confidenceScore < 90);
  });

  it("flags unsupported but real niche roles", () => {
    const result = matchRole({ originalRoleInput: "Agentforce Prompt Engineer" });
    assert.equal(result.matchStatus, "unsupported");
    assert.equal(result.needsMoreInfo, true);
    assert.ok(result.suggestedRoles.length > 0);
  });

  it("rejects nonsensical input as no_match", () => {
    const result = matchRole({ originalRoleInput: "asdfghjkl career ninja" });
    assert.equal(result.matchStatus, "no_match");
    assert.equal(result.normalizedRole, null);
    assert.equal(result.roleFamily, null);
    assert.ok(result.confidenceScore <= 30);
  });

  it("blocks scan generation for no_match", () => {
    const result = matchRole({ originalRoleInput: "asdfghjkl career ninja" });
    assert.equal(canGenerateScan(result), false);
  });

  it("requires confirmation for partial_match", () => {
    const result = matchRole({
      originalRoleInput: "Senior Salesforce Revenue Cloud Solution Architect",
    });
    assert.equal(canGenerateScan(result), false);
    assert.equal(canGenerateScan(result, "confirmed"), true);
  });

  it("allows approximate continue for unsupported with normalized role", () => {
    const result = matchRole({ originalRoleInput: "Agentforce Prompt Engineer" });
    assert.equal(canGenerateScan(result), false);
    if (result.normalizedRole) {
      assert.equal(canGenerateScan(result, "approximate_continue"), true);
    }
  });

  it("blocks non-technology roles like Registered Nurse", () => {
    const result = matchRole({
      originalRoleInput: "Registered Nurse",
      industry: "Technology",
    });
    assert.equal(result.outOfTechnologyDomain, true);
    assert.equal(result.matchStatus, "no_match");
    assert.equal(result.normalizedRole, null);
    assert.equal(canGenerateScan(result), false);
  });

  it("blocks short nurse titles even with a SaaS industry", () => {
    const result = matchRole({
      originalRoleInput: "nurse",
      industry: "SaaS",
    });
    assert.equal(result.outOfTechnologyDomain, true);
    assert.equal(result.matchStatus, "no_match");
    assert.equal(canGenerateScan(result), false);
  });

  it("blocks industries outside the supported picklist", () => {
    const result = matchRole({
      originalRoleInput: "Salesforce Administrator",
      industry: "Agriculture",
    });
    assert.equal(result.outOfTechnologyDomain, true);
    assert.equal(canGenerateScan(result), false);
  });

  it("allows Healthcare industry with a technology role", () => {
    const result = matchRole({
      originalRoleInput: "Salesforce Administrator",
      industry: "Healthcare",
    });
    assert.notEqual(result.outOfTechnologyDomain, true);
    assert.equal(result.matchStatus, "matched");
    assert.equal(canGenerateScan(result), true);
  });

  it("exposes curated technology roles for the form picker", () => {
    assert.equal(TECHNOLOGY_CURRENT_ROLES.length, 30);
    assert.ok(TECHNOLOGY_CURRENT_ROLES.includes("Salesforce Administrator"));
    assert.ok(TECHNOLOGY_CURRENT_ROLES.includes("Software Developer"));
    assert.equal(TECHNOLOGY_CURRENT_ROLES.includes("Registered Nurse"), false);
    assert.deepEqual(
      TECHNOLOGY_CURRENT_ROLES,
      [...TECHNOLOGY_CURRENT_ROLES].sort((a, b) => a.localeCompare(b))
    );
  });

  it("appends Other to role suggestions and resolves Other free-text", () => {
    const suggestions = filterTechnologyCurrentRoles("data");
    assert.ok(suggestions.includes("Data Analyst"));
    assert.equal(suggestions[suggestions.length - 1], OTHER_ROLE_OPTION);
    assert.equal(isOtherRoleSelection("Other"), true);
    assert.equal(
      resolveScanFormRoleInput({ currentRole: "Other", otherRoleName: "RevOps Lead" }),
      "RevOps Lead"
    );
  });
});
