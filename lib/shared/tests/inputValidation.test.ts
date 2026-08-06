import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isLikelyNonsenseJobTitle,
  validateCertifications,
  validateJobTitle,
  validateResponsibilities,
} from "../scan/inputValidation";
import { matchRole } from "../scan/roleMatch";
import { validateScanContext, validateScanForm } from "../scan/validation";

describe("inputValidation", () => {
  it("rejects lifestyle job titles like eat and sleep", () => {
    assert.ok(validateJobTitle("eat and sleep"));
    assert.equal(isLikelyNonsenseJobTitle("eat and sleep"), true);
    assert.equal(matchRole({ originalRoleInput: "eat and sleep" }).matchStatus, "no_match");
  });

  it("accepts real technology job titles", () => {
    assert.equal(validateJobTitle("Software Developer"), null);
    assert.equal(validateJobTitle("Revenue Operations Manager"), null);
    assert.equal(validateJobTitle("Salesforce Administrator"), null);
  });

  it("rejects lifestyle responsibilities", () => {
    assert.ok(validateResponsibilities("eat and sleep"));
    assert.ok(validateResponsibilities("I sleep all day and eat food"));
  });

  it("accepts professional responsibilities", () => {
    assert.equal(
      validateResponsibilities("Configure Salesforce workflows, support users, and build CRM reports"),
      null
    );
  });

  it("rejects nonsense certifications", () => {
    assert.ok(validateCertifications("eat sleep nap"));
    assert.equal(validateCertifications("Salesforce Admin, AWS"), null);
  });

  it("blocks Other + eat and sleep on role step", () => {
    const error = validateScanForm({
      currentRole: "Other",
      otherRoleName: "eat and sleep",
      industry: "",
      yearsExperience: "",
      skills: "",
      tools: "",
    });
    assert.ok(error);
    assert.equal(error?.field, "otherRoleName");
  });

  it("requires responsibilities, industry, and years on context step", () => {
    const lifestyleSkills = validateScanContext({
      currentRole: "Salesforce Administrator",
      industry: "Technology",
      yearsExperience: "5",
      skills: "I mostly eat sleep rest play games and watch tv every day",
      tools: "",
    });
    assert.ok(lifestyleSkills);
    assert.match(lifestyleSkills!.message.toLowerCase(), /professional|everyday|responsibilities/);

    const missingIndustry = validateScanContext({
      currentRole: "Salesforce Administrator",
      industry: "",
      yearsExperience: "5",
      skills: "Configure Salesforce workflows and support sales users daily",
      tools: "",
    });
    assert.equal(missingIndustry?.field, "industry");

    const ok = validateScanContext({
      currentRole: "Salesforce Administrator",
      industry: "Technology",
      yearsExperience: "5",
      skills: "Configure Salesforce workflows and support sales users daily",
      tools: "Salesforce Admin",
    });
    assert.equal(ok, null);
  });
});
