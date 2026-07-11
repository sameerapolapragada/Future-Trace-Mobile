import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isTechnologyDomain } from "../scan/technologyDomain";
import { validateScanForm } from "../scan/validation";

describe("technologyDomain", () => {
  it("accepts technology industries", () => {
    for (const industry of ["Technology", "SaaS", "IT", "Software", "Fintech", "Cloud"]) {
      assert.equal(isTechnologyDomain(industry), true, industry);
    }
  });

  it("rejects non-technology industries", () => {
    for (const industry of ["", "Healthcare", "Nursing", "Legal", "Government", "Retail"]) {
      assert.equal(isTechnologyDomain(industry), false, industry);
    }
  });

  it("does not require industry on the scan form", () => {
    const invalidRole = validateScanForm({
      currentRole: "Registered Nurse",
      industry: "",
      yearsExperience: "",
      skills: "",
      tools: "",
    });
    assert.equal(
      invalidRole?.message,
      "Please choose a role from the suggested technology roles, or select Other."
    );

    const otherMissingName = validateScanForm({
      currentRole: "Other",
      otherRoleName: "",
      industry: "",
      yearsExperience: "",
      skills: "",
      tools: "",
    });
    assert.equal(otherMissingName?.message, "Enter your role name.");

    const otherOk = validateScanForm({
      currentRole: "Other",
      otherRoleName: "Platform Product Analyst",
      industry: "",
      yearsExperience: "",
      skills: "",
      tools: "",
    });
    assert.equal(otherOk, null);

    const okWithoutIndustry = validateScanForm({
      currentRole: "Salesforce Administrator",
      industry: "",
      yearsExperience: "",
      skills: "",
      tools: "",
    });
    assert.equal(okWithoutIndustry, null);
  });
});
