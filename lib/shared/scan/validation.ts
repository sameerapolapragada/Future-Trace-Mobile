import type { ScanFormInput } from "../types";

export type ScanValidationError = {
  field: keyof ScanFormInput | "form";
  message: string;
};

export function validateScanForm(input: ScanFormInput): ScanValidationError | null {
  if (!input.currentRole.trim()) {
    return { field: "currentRole", message: "Current role is required." };
  }

  if (!input.targetRole.trim()) {
    return { field: "targetRole", message: "Target role is required." };
  }

  const years = parseInt(input.yearsExperience, 10);
  if (input.yearsExperience.trim() && (Number.isNaN(years) || years < 0 || years > 60)) {
    return { field: "yearsExperience", message: "Years of experience must be between 0 and 60." };
  }

  return null;
}
