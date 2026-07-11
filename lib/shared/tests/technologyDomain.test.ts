import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterSupportedIndustries,
  isSupportedIndustry,
  isTechnologyDomain,
  SUPPORTED_INDUSTRY_OPTIONS,
} from "../scan/technologyDomain";
import { validateScanForm } from "../scan/validation";

describe("technologyDomain", () => {
  it("exposes 10 supported industries including Healthcare", () => {
    assert.equal(SUPPORTED_INDUSTRY_OPTIONS.length, 10);
    assert.ok(SUPPORTED_INDUSTRY_OPTIONS.includes("Healthcare"));
    assert.ok(SUPPORTED_INDUSTRY_OPTIONS.includes("Technology"));
  });

  it("accepts picklist industries including Healthcare", () => {
    for (const industry of SUPPORTED_INDUSTRY_OPTIONS) {
      assert.equal(isSupportedIndustry(industry), true, industry);
      assert.equal(isTechnologyDomain(industry), true, industry);
    }
    assert.equal(isSupportedIndustry(""), true);
  });

  it("rejects industries outside the picklist", () => {
    for (const industry of ["Nursing", "Agriculture", "Real Estate", "Mining"]) {
      assert.equal(isSupportedIndustry(industry), false, industry);
    }
  });

  it("filters industries alphabetically as you type", () => {
    const matches = filterSupportedIndustries("health");
    assert.deepEqual(matches, ["Healthcare"]);
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

    const okWithHealthcare = validateScanForm({
      currentRole: "Salesforce Administrator",
      industry: "Healthcare",
      yearsExperience: "5",
      skills: "",
      tools: "",
    });
    assert.equal(okWithHealthcare, null);

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
