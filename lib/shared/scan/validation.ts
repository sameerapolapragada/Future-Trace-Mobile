import type { ScanFormInput } from "../types";
import {
  isLikelyNonsenseJobTitle,
  validateCertifications,
  validateJobTitle,
  validateResponsibilities,
} from "./inputValidation";
import {
  isOtherRoleSelection,
  isTechnologyCurrentRole,
  matchRole,
  resolveScanFormRoleInput,
} from "./roleMatch";
import { isSupportedIndustry } from "./technologyDomain";

export type ScanValidationError = {
  field: keyof ScanFormInput | "form";
  message: string;
};

/** Step 2 — current role picker / Other title. */
export function validateScanForm(input: ScanFormInput): ScanValidationError | null {
  if (!input.currentRole.trim()) {
    return { field: "currentRole", message: "Current role is required." };
  }

  if (isOtherRoleSelection(input.currentRole)) {
    const other = resolveScanFormRoleInput(input);
    const titleError = validateJobTitle(other);
    if (titleError) {
      return { field: "otherRoleName", message: titleError };
    }
    if (isLikelyNonsenseJobTitle(other)) {
      return {
        field: "otherRoleName",
        message: "Enter a real technology job title, or choose a role from the suggested list.",
      };
    }
    const match = matchRole({ originalRoleInput: other });
    if (match.matchStatus === "no_match" || match.outOfTechnologyDomain) {
      return {
        field: "otherRoleName",
        message:
          "We couldn't match that to a technology role. Choose a suggested role, or enter a clearer tech job title.",
      };
    }
  } else if (!isTechnologyCurrentRole(input.currentRole)) {
    return {
      field: "currentRole",
      message: "Please choose a role from the suggested technology roles, or select Other.",
    };
  }

  return null;
}

/** Step 3 — work context before generating paths. */
export function validateScanContext(input: ScanFormInput): ScanValidationError | null {
  const roleError = validateScanForm(input);
  if (roleError) return roleError;

  const responsibilitiesError = validateResponsibilities(input.skills);
  if (responsibilitiesError) {
    return { field: "skills", message: responsibilitiesError };
  }

  if (!input.industry.trim()) {
    return { field: "industry", message: "Select an industry from the suggested list." };
  }
  if (!isSupportedIndustry(input.industry)) {
    return { field: "industry", message: "Select an industry from the suggested list." };
  }

  if (!input.yearsExperience.trim()) {
    return { field: "yearsExperience", message: "Select your years of experience." };
  }
  const years = parseInt(input.yearsExperience, 10);
  if (Number.isNaN(years) || years < 0 || years > 60) {
    return { field: "yearsExperience", message: "Years of experience must be between 0 and 60." };
  }

  const certsError = validateCertifications(input.tools);
  if (certsError) {
    return { field: "tools", message: certsError };
  }

  return null;
}
