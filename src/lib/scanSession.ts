import type { NormalizedScanInput, RoleMatchSnapshot, RoleMatchUserAction, ScanFormInput } from "../../lib/shared";
import { normalizeScanInput } from "../../lib/shared";

let pendingForm: ScanFormInput | null = null;
let pendingRoleMatch: RoleMatchSnapshot | null = null;
let pendingScanInput: NormalizedScanInput | null = null;

export function setPendingScanForm(form: ScanFormInput): void {
  pendingForm = form;
}

export function getPendingScanForm(): ScanFormInput | null {
  return pendingForm;
}

export function takePendingScanForm(): ScanFormInput | null {
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

/** Build scan input after target role match — current role stays as entered. */
export function buildPendingScanInput(
  form: ScanFormInput,
  matchedTargetRole: string,
  match?: RoleMatchSnapshot | null,
  userAction?: RoleMatchUserAction
): NormalizedScanInput {
  const userCurrentRole = form.currentRole.trim();
  const normalized = normalizeScanInput({
    ...form,
    currentRole: userCurrentRole,
    targetRole: matchedTargetRole,
  });

  const resolvedAction = userAction ?? match?.userAction;

  return {
    ...normalized,
    currentRole: normalized.currentRole,
    targetRole: matchedTargetRole,
    identifiedCareerProfile: normalized.identifiedCareerProfile,
    originalCurrentRole: userCurrentRole,
    originalTargetRole: match?.originalRoleInput ?? form.targetRole.trim(),
    roleMatch: match
      ? {
          ...match,
          userSelectedRole: matchedTargetRole,
          ...(resolvedAction ? { userAction: resolvedAction } : {}),
        }
      : undefined,
  };
}
