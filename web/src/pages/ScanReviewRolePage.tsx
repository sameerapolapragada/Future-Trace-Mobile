import { useLocation, useNavigate } from "react-router-dom";
import { PrimaryButton } from "../design-system";
import { formatRoleMatchQualityLabel } from "../../../lib/shared";
import type { RoleMatchSnapshot } from "../lib/roleMatchService";
import { updateRoleMatchUserAction } from "../lib/roleMatchService";
import type { ScanFormInput } from "../lib/scanService";

type LocationState = {
  form?: ScanFormInput;
  roleMatch?: RoleMatchSnapshot;
};

export default function ScanReviewRolePage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState | null };
  const form = state?.form;
  const match = state?.roleMatch;

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

  async function onContinue() {
    const role = match!.normalizedRole ?? form!.targetRole;
    if (match!.roleMatchEventId) {
      await updateRoleMatchUserAction(match!.roleMatchEventId, "auto_accepted");
    }
    navigate("/scan-loading", {
      replace: true,
      state: {
        pendingInput: { ...form!, targetRole: role },
        roleMatch: { ...match!, userAction: "auto_accepted" as const },
      },
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-6">
      <h1 className="text-xl font-bold text-white">Target role match found</h1>
      <p className="text-sm text-muted">We identified a strong match for your target role.</p>
      <div className="rounded-2xl border border-white/8 bg-navy-elevated p-4">
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
          {formatRoleMatchQualityLabel(match.matchStatus, "auto_accepted")}
        </span>
        <p className="mt-3 text-xs font-semibold uppercase text-muted">Target role match</p>
        <p className="text-lg font-bold text-white">{match.normalizedRole}</p>
        {match.originalRoleInput !== match.normalizedRole ? (
          <>
            <p className="mt-3 text-xs font-semibold uppercase text-muted">Based on your input</p>
            <p className="text-sm text-muted">{match.originalRoleInput}</p>
          </>
        ) : null}
      </div>
      <PrimaryButton fullWidth onClick={() => void onContinue()}>
        Continue to Career Scan
      </PrimaryButton>
    </div>
  );
}
