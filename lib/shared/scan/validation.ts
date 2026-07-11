import type { ScanFormInput } from "../types";
import {
  isOtherRoleSelection,
  isTechnologyCurrentRole,
  resolveScanFormRoleInput,
} from "./roleMatch";

export type ScanValidationError = {
  field: keyof ScanFormInput | "form";
  message: string;
};

export function validateScanForm(input: ScanFormInput): ScanValidationError | null {
  // MVP: current technology role required — industry/domain is optional.
  if (!input.currentRole.trim()) {
    return { field: "currentRole", message: "Current role is required." };
  }

  if (isOtherRoleSelection(input.currentRole)) {
    if (!resolveScanFormRoleInput(input)) {
      return { field: "otherRoleName", message: "Enter your role name." };
    }
  } else if (!isTechnologyCurrentRole(input.currentRole)) {
    return {
      field: "currentRole",
      message: "Please choose a role from the suggested technology roles, or select Other.",
    };
  }

  const years = parseInt(input.yearsExperience, 10);
  if (input.yearsExperience.trim() && (Number.isNaN(years) || years < 0 || years > 60)) {
    return { field: "yearsExperience", message: "Years of experience must be between 0 and 60." };
  }

  return null;
}
