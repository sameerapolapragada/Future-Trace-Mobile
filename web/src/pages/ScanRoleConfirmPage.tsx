import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PrimaryButton } from "../design-system";
import type { RoleMatchSnapshot } from "../lib/roleMatchService";
import { updateRoleMatchUserAction } from "../lib/roleMatchService";
import type { ScanFormInput } from "../lib/scanService";
import { cn } from "../lib/cn";

type LocationState = {
  form?: ScanFormInput;
  roleMatch?: RoleMatchSnapshot;
};

export default function ScanRoleConfirmPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState | null };
  const form = state?.form;
  const match = state?.roleMatch;
  const defaultRole = match?.normalizedRole ?? match?.suggestedRoles[0]?.role ?? "";
  const [selectedRole, setSelectedRole] = useState(defaultRole);

  if (!form || !match) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-muted">Session expired.</p>
        <button type="button" className="mt-4 text-accent" onClick={() => navigate("/scan")}>
          Back to scan
        </button>
      </div>
    );
  }

  const options = [
    ...(match.normalizedRole ? [{ role: match.normalizedRole, confidence: match.confidenceScore }] : []),
    ...match.suggestedRoles.filter((s) => s.role !== match.normalizedRole),
  ];

  async function onConfirm() {
    const isCorrected = selectedRole !== match!.normalizedRole;
    const action = isCorrected ? "corrected" : "confirmed";
    if (match!.roleMatchEventId) {
      await updateRoleMatchUserAction(match!.roleMatchEventId, action, { userSelectedRole: selectedRole });
    }
    navigate("/scan-loading", {
      replace: true,
      state: {
        pendingInput: { ...form!, targetRole: selectedRole },
        roleMatch: { ...match!, userSelectedRole: selectedRole, userAction: action },
      },
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-6">
      <h1 className="text-xl font-bold text-white">Confirm your target role</h1>
      <p className="text-sm text-muted">
        Your target role title looks specialized. Confirm the closest supported role before we generate your scan.
      </p>
      <div className="rounded-2xl border border-white/8 bg-navy-elevated p-4">
        <p className="text-xs font-semibold uppercase text-muted">Your target role input</p>
        <p className="font-semibold text-white">{match.originalRoleInput}</p>
        <p className="mt-2 text-xs italic text-amber-300/90">We analyzed the closest confirmed target role.</p>
      </div>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.role}
            type="button"
            onClick={() => setSelectedRole(option.role)}
            className={cn(
              "w-full rounded-2xl border p-4 text-left transition",
              selectedRole === option.role ? "border-accent bg-accent/10" : "border-white/8 bg-navy-elevated"
            )}
          >
            <p className="font-semibold text-white">{option.role}</p>
            <p className="text-xs text-muted">{option.confidence}% match</p>
          </button>
        ))}
      </div>
      <PrimaryButton fullWidth disabled={!selectedRole} onClick={() => void onConfirm()}>
        Confirm and continue
      </PrimaryButton>
    </div>
  );
}
