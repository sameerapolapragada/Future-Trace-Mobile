import type { ScanFormInput } from "../types";

export type ScanValidationError = {
  field: keyof ScanFormInput | "form";
  message: string;
};

export function validateScanForm(input: ScanFormInput): ScanValidationError | null {
  if (!input.currentRole.trim()) {
    return { field: "currentRole", message: "Current role is required." };
  }

  const hasTarget = input.targetRole.trim().length > 0;
  const hasGoal = input.careerGoal.trim().length > 0;
  if (!hasTarget && !hasGoal) {
    return {
      field: "targetRole",
      message: "Add a target role or describe your career goal.",
    };
  }

  const years = parseInt(input.yearsExperience, 10);
  if (input.yearsExperience.trim() && (Number.isNaN(years) || years < 0 || years > 60)) {
    return { field: "yearsExperience", message: "Years of experience must be between 0 and 60." };
  }

  return null;
}
