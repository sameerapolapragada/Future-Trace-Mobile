import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PrimaryButton } from "../design-system";
import { canGenerateScan } from "../../../lib/shared";
import type { RoleMatchSnapshot } from "../lib/roleMatchService";
import { runRoleMatch, updateRoleMatchUserAction } from "../lib/roleMatchService";
import type { ScanFormInput } from "../lib/scanService";
import { useAuth } from "../auth/useAuth";
import { cn } from "../lib/cn";

type LocationState = {
  form?: ScanFormInput;
  roleMatch?: RoleMatchSnapshot;
};

export default function ScanRoleNeedsInfoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useLocation() as { state: LocationState | null };
  const form = state?.form;
  const match = state?.roleMatch;
  const isNoMatch = match?.matchStatus === "no_match";

  const [responsibilities, setResponsibilities] = useState("");
  const [tools, setTools] = useState(form?.tools ?? "");
  const [selectedRole, setSelectedRole] = useState(match?.suggestedRoles[0]?.role ?? "");
  const [retrying, setRetrying] = useState(false);

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

  async function onRetry() {
    setRetrying(true);
    const snapshot = await runRoleMatch(user?.id, {
      originalRoleInput: form!.currentRole,
      industry: form!.industry,
      yearsExperience: parseInt(form!.yearsExperience, 10) || 0,
      skills: responsibilities || form!.skills,
      tools: tools || form!.tools,
      responsibilities,
    });
    if (match!.roleMatchEventId) {
      await updateRoleMatchUserAction(match!.roleMatchEventId, "needs_more_info", {
        addedResponsibilities: responsibilities,
        addedTools: tools,
      });
    }
    setRetrying(false);

    if (snapshot.matchStatus === "matched") {
      navigate("/scan/review-role", { state: { form, roleMatch: snapshot }, replace: true });
    } else if (snapshot.matchStatus === "partial_match") {
      navigate("/scan/role-confirm", { state: { form, roleMatch: snapshot }, replace: true });
    }
  }

  async function onContinueSelected() {
    if (!selectedRole) return;
    if (match!.roleMatchEventId) {
      await updateRoleMatchUserAction(match!.roleMatchEventId, "corrected", { userSelectedRole: selectedRole });
    }
    navigate("/scan-loading", {
      replace: true,
      state: {
        pendingInput: { ...form!, currentRole: selectedRole },
        roleMatch: { ...match!, userSelectedRole: selectedRole, userAction: "corrected" },
      },
    });
  }

  async function onApproximate() {
    const role = match!.normalizedRole ?? selectedRole;
    if (!role || !canGenerateScan(match!, "approximate_continue")) return;
    if (match!.roleMatchEventId) {
      await updateRoleMatchUserAction(match!.roleMatchEventId, "approximate_continue", { userSelectedRole: role });
    }
    navigate("/scan-loading", {
      replace: true,
      state: {
        pendingInput: { ...form!, currentRole: role },
        roleMatch: { ...match!, userSelectedRole: role, userAction: "approximate_continue" },
      },
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-6">
      <h1 className="text-xl font-bold text-white">{isNoMatch ? "Role not identified" : "Role needs more info"}</h1>
      <p className="text-sm text-muted">
        {isNoMatch
          ? "We couldn't identify this role. Please edit your job title or choose a common role."
          : "We don't fully support this role yet. Help us understand it or choose the closest supported role."}
      </p>

      <div className="rounded-2xl border border-white/8 bg-navy-elevated p-4">
        <p className="text-xs font-semibold uppercase text-muted">Your input</p>
        <p className="font-semibold text-white">{match.originalRoleInput}</p>
      </div>

      {!isNoMatch ? (
        <div className="space-y-3 rounded-2xl border border-white/8 bg-navy-elevated p-4">
          <label className="block text-xs font-medium text-muted">
            Key responsibilities
            <textarea
              className="mt-1 w-full rounded-xl border border-white/8 bg-navy px-3 py-2 text-sm text-white"
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              rows={3}
            />
          </label>
          <label className="block text-xs font-medium text-muted">
            Tools & platforms
            <textarea
              className="mt-1 w-full rounded-xl border border-white/8 bg-navy px-3 py-2 text-sm text-white"
              value={tools}
              onChange={(e) => setTools(e.target.value)}
              rows={2}
            />
          </label>
          <PrimaryButton fullWidth loading={retrying} onClick={() => void onRetry()}>
            Retry role match
          </PrimaryButton>
        </div>
      ) : null}

      {match.suggestedRoles.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">Suggested supported roles</p>
          {match.suggestedRoles.map((option) => (
            <button
              key={option.role}
              type="button"
              onClick={() => setSelectedRole(option.role)}
              className={cn(
                "w-full rounded-2xl border p-4 text-left",
                selectedRole === option.role ? "border-accent bg-accent/10" : "border-white/8 bg-navy-elevated"
              )}
            >
              <p className="font-semibold text-white">{option.role}</p>
              <p className="text-xs text-muted">{option.confidence}% match</p>
            </button>
          ))}
          <PrimaryButton fullWidth disabled={!selectedRole} onClick={() => void onContinueSelected()}>
            Continue with selected role
          </PrimaryButton>
        </div>
      ) : null}

      {!isNoMatch && match.normalizedRole && canGenerateScan(match, "approximate_continue") ? (
        <>
          <p className="text-xs italic text-amber-300/90">
            This scan is based on an approximate role match and may be less precise.
          </p>
          <button type="button" className="text-sm text-accent" onClick={() => void onApproximate()}>
            Continue with approximate match
          </button>
        </>
      ) : null}

      <button type="button" className="text-sm text-muted" onClick={() => navigate("/scan")}>
        Edit job title
      </button>
    </div>
  );
}
