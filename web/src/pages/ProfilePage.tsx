import { Link, useNavigate } from "react-router-dom";
import { Badge, Card, GhostButton, SectionHeader } from "../design-system";
import { careerScans, products, userProfile } from "../data/mockData";
import { useEntitlements } from "../lib/entitlements";

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

function getSubscriptionLabel(hasXRay: boolean, hasRadar: boolean) {
  if (hasXRay && hasRadar) return "Full access";
  if (hasRadar) return "AI Career Radar";
  if (hasXRay) return "Career X-Ray Pass";
  return "Free";
}

function getSubscriptionTone(hasXRay: boolean, hasRadar: boolean) {
  if (hasXRay || hasRadar) return "success" as const;
  return "default" as const;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { entitlements } = useEntitlements();
  const latestScan = careerScans[0];
  const exposureLabel =
    latestScan.aiExposureLevel.charAt(0).toUpperCase() +
    latestScan.aiExposureLevel.slice(1);

  const xrayStatus = entitlements.hasCareerXRay ? "Unlocked" : "Not purchased";
  const radarStatus = entitlements.hasRadar ? "Active" : "Not subscribed";
  const savedScanCount = careerScans.length;

  function handleLogout() {
    sessionStorage.removeItem("ft-entitlements");
    navigate("/");
  }

  return (
    <div className="space-y-6 pb-2">
      <header className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ft-avatar-gradient">
          {userProfile.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-white">{userProfile.name}</h1>
          <p className="text-sm text-muted">{userProfile.title}</p>
          <p className="text-xs text-muted">{userProfile.email}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card padding="md">
          <p className="text-xs text-muted">Career Resilience Index</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">
            {latestScan.resilienceScore}
            <span className="text-sm font-normal text-muted">/100</span>
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">AI Exposure</p>
          <p className="mt-2 text-2xl font-bold text-white">{exposureLabel}</p>
          <p className="mt-0.5 text-xs tabular-nums text-muted">{latestScan.aiExposure}%</p>
        </Card>
      </div>

      <section>
        <SectionHeader title="Subscription" subtitle="Your plan and product access" />
        <Card className="divide-y divide-white/8 p-0" padding="none">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-muted">Subscription status</span>
            <Badge tone={getSubscriptionTone(entitlements.hasCareerXRay, entitlements.hasRadar)}>
              {getSubscriptionLabel(entitlements.hasCareerXRay, entitlements.hasRadar)}
            </Badge>
          </div>
          <Link
            to={entitlements.hasCareerXRay ? "/xray" : "/career-xray"}
            className="flex items-center justify-between px-4 py-3.5 transition hover:bg-white/[0.03]"
          >
            <span className="text-sm text-white">Career X-Ray access</span>
            <Badge tone={entitlements.hasCareerXRay ? "success" : "default"}>{xrayStatus}</Badge>
          </Link>
          <Link
            to={entitlements.hasRadar ? "/radar" : "/upgrade"}
            className="flex items-center justify-between px-4 py-3.5 transition hover:bg-white/[0.03]"
          >
            <span className="text-sm text-white">AI Career Radar</span>
            <Badge tone={entitlements.hasRadar ? "success" : "default"}>{radarStatus}</Badge>
          </Link>
        </Card>
      </section>

      <section>
        <SectionHeader
          title="Saved scans"
          subtitle={`${savedScanCount} ${savedScanCount === 1 ? "report" : "reports"}`}
        />
        <div className="space-y-2">
          {careerScans.map((scan) => (
            <Link key={scan.id} to="/canvas" state={{ scanId: scan.id }}>
              <Card className="flex items-center justify-between py-3 transition active:scale-[0.99]">
                <div>
                  <p className="text-sm font-medium text-white">{scan.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {scan.date} · {scan.role}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-white">
                    {scan.resilienceScore}/100
                  </p>
                  <p className="text-xs capitalize text-muted">{scan.aiExposureLevel} exposure</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        {entitlements.freeScansRemaining > 0 && (
          <Link
            to="/scan"
            className="mt-3 block text-center text-xs font-medium text-accent transition hover:text-accent-soft"
          >
            Run a new scan
          </Link>
        )}
      </section>

      <section>
        <SectionHeader title="Settings" />
        <Card className="divide-y divide-white/8 p-0" padding="none">
          <SettingsRow label="Notifications" value="On" onClick={() => {}} />
          <SettingsRow label="Privacy settings" onClick={() => {}} />
          <SettingsRow label="Help and support" onClick={() => {}} />
        </Card>
      </section>

      {!entitlements.hasCareerXRay || !entitlements.hasRadar ? (
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
