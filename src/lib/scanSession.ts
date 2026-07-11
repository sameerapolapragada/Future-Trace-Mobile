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

/** Build scan input after current-role match — no user-entered target role. */
export function buildPendingScanInput(
  form: ScanFormInput,
  matchedCurrentRole: string,
  match?: RoleMatchSnapshot | null,
  userAction?: RoleMatchUserAction
): NormalizedScanInput {
  const normalized = normalizeScanInput({
    ...form,
    currentRole: matchedCurrentRole,
    targetRole: "",
  });

  const resolvedAction = userAction ?? match?.userAction;

  return {
    ...normalized,
    currentRole: matchedCurrentRole,
    identifiedCareerProfile: matchedCurrentRole,
    originalCurrentRole: match?.originalRoleInput ?? form.currentRole.trim(),
    roleMatch: match
      ? {
          ...match,
          userSelectedRole: matchedCurrentRole,
          ...(resolvedAction ? { userAction: resolvedAction } : {}),
        }
      : undefined,
  };
}
