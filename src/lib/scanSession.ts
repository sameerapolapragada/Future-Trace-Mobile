import type { NormalizedScanInput, RoleMatchSnapshot } from "../../lib/shared";

let pendingForm: import("../../lib/shared").ScanFormInput | null = null;
let pendingRoleMatch: RoleMatchSnapshot | null = null;
let pendingScanInput: NormalizedScanInput | null = null;

export function setPendingScanForm(form: import("../../lib/shared").ScanFormInput): void {
  pendingForm = form;
}

export function getPendingScanForm(): import("../../lib/shared").ScanFormInput | null {
  return pendingForm;
}

export function takePendingScanForm(): import("../../lib/shared").ScanFormInput | null {
  const value = pendingForm;
  pendingForm = null;
  return value;
}

export function setPendingRoleMatch(match: RoleMatchSnapshot): void {
  pendingRoleMatch = match;
}

export function getPendingRoleMatch(): RoleMatchSnapshot | null {
  return pendingRoleMatch;
}

export function clearPendingRoleMatch(): void {
  pendingRoleMatch = null;
}

export function setPendingScanInput(input: NormalizedScanInput): void {
  pendingScanInput = input;
}

export function takePendingScanInput(): NormalizedScanInput | null {
  const value = pendingScanInput;
  pendingScanInput = null;
  return value;
}

export function clearScanSession(): void {
  pendingForm = null;
  pendingRoleMatch = null;
  pendingScanInput = null;
}
