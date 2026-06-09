import { Link, useNavigate } from "react-router-dom";
import { Badge, Card, GhostButton, SectionHeader } from "../design-system";
import { useAuth } from "../auth/useAuth";
import { products } from "../data/mockData";
import { useEntitlements } from "../lib/entitlements";
import { getCareerXRayPath, getNewScanPath } from "../lib/entitlementsService";
import { useScanHistory } from "../lib/useScanHistory";
import { useProfileData } from "../lib/useProfileData";
import { getDisplayName, formatLastLogin } from "../lib/userDisplay";

function SettingsRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="text-sm text-white">{label}</span>
      <span className="flex items-center gap-2 text-sm text-muted">
        {value}
        <span aria-hidden>→</span>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-white/[0.03]"
      >
        {inner}
      </button>
    );
  }

  return <div className="flex items-center justify-between px-4 py-3.5">{inner}</div>;
}

function getSubscriptionLabel(hasRadar: boolean) {
  if (hasRadar) return "AI Career Transition";
  return "Free";
}

function getSubscriptionTone(hasRadar: boolean) {
  if (hasRadar) return "success" as const;
  return "default" as const;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { entitlements, loading: entitlementsLoading } = useEntitlements();
  const { items: scanHistory, loading: historyLoading } = useScanHistory();
  const { profile, scans, loading: profileLoading, error } = useProfileData();

  const loading = entitlementsLoading || profileLoading || historyLoading;
  const generatedXrays = scanHistory.filter((s) => s.xray?.status === "generated");
  const xrayStatusLabel =
    generatedXrays.length > 0
      ? `${generatedXrays.length} X-Ray${generatedXrays.length === 1 ? "" : "s"}`
      : "Per scan purchase";
  const latestScan = scans[0];
  const displayName = getDisplayName(user, profile);
  const email = user?.email ?? profile?.email ?? "";
  const careerTitle = profile?.job_role ?? latestScan?.currentRole ?? "Complete a scan to add your role";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const xrayStatusLabelDisplay = xrayStatusLabel;
  const radarStatus = entitlements.hasRadar ? "Active" : "Not subscribed";
  const lastLogin = formatLastLogin(user?.last_sign_in_at);

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-[40svh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-2">
      <header className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ft-avatar-gradient">
          {avatarInitial}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-white">{displayName}</h1>
          <p className="text-sm text-muted">{careerTitle}</p>
          <p className="text-xs text-muted">{email}</p>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <section>
        <SectionHeader title="Subscription" subtitle="Your plan and product access" />
        <Card className="divide-y divide-white/8 p-0" padding="none">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-muted">Subscription status</span>
            <Badge tone={getSubscriptionTone(entitlements.hasRadar)}>
              {getSubscriptionLabel(entitlements.hasRadar)}
            </Badge>
          </div>
          <Link
            to={getCareerXRayPath(entitlements)}
            className="flex items-center justify-between px-4 py-3.5 transition hover:bg-white/[0.03]"
          >
            <span className="text-sm text-white">Career X-Ray access</span>
            <Badge tone={generatedXrays.length > 0 ? "success" : "default"}>{xrayStatusLabelDisplay}</Badge>
          </Link>
          <Link
            to={entitlements.hasRadar ? "/transition" : "/upgrade?product=transition"}
            className="flex items-center justify-between px-4 py-3.5 transition hover:bg-white/[0.03]"
          >
            <span className="text-sm text-white">AI Career Transition</span>
            <Badge tone={entitlements.hasRadar ? "success" : "default"}>{radarStatus}</Badge>
          </Link>
        </Card>
      </section>

      <section>
        <SectionHeader title="Scan History" subtitle="Free scans and X-Ray status" />
        {scanHistory.length === 0 ? (
          <Card padding="md">
            <p className="text-center text-sm text-muted">
              No saved scans yet. Run your first Career Scan to build your profile.
            </p>
            <Link
              to={getNewScanPath(entitlements)}
              className="mt-3 block text-center text-xs font-medium text-accent transition hover:text-accent-soft"
            >
              Start Career Scan →
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {scanHistory.map((scan) => (
              <Link key={scan.id} to={`/results/${scan.id}`}>
                <Card className="flex items-center justify-between py-3 transition active:scale-[0.99]">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {scan.currentRole} → {scan.targetRole}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">Free Scan Available</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-accent">{scan.xrayStatusLabel}</p>
                    <p className="mt-0.5 text-[10px] text-muted">X-Ray Status</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
        {scanHistory.length > 0 ? (
          <Link
            to={getNewScanPath(entitlements)}
            className="mt-3 block text-center text-xs font-medium text-accent transition hover:text-accent-soft"
          >
            Run a new scan
          </Link>
        ) : null}
      </section>

      <section>
        <SectionHeader title="Settings" />
        <Card className="divide-y divide-white/8 p-0" padding="none">
          <SettingsRow label="Last login" value={lastLogin ?? "—"} />
          <SettingsRow label="Notifications" value="On" onClick={() => {}} />
          <SettingsRow label="Privacy settings" onClick={() => {}} />
          <SettingsRow label="Help and support" onClick={() => {}} />
        </Card>
      </section>

      {!entitlements.hasRadar ? (
        <Card variant="elevated" padding="md">
          <p className="text-sm font-medium text-white">Upgrade your intelligence</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Get a one-time Career X-Ray for {products.xray.price}, or subscribe to{" "}
            {products.radar.name} ({products.radar.price}
            {products.radar.priceSuffix}) — includes X-Ray plus live market updates.
          </p>
          <Link
            to="/upgrade"
            className="mt-3 inline-block text-sm font-medium text-accent transition hover:text-accent-soft"
          >
            View upgrade options →
          </Link>
        </Card>
      ) : null}

      <GhostButton fullWidth onClick={handleLogout} className="text-danger hover:text-danger">
        Log out
      </GhostButton>
    </div>
  );
}
