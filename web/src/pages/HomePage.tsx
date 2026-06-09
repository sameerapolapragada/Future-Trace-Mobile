import { useAuth } from "../auth/useAuth";
import { useEntitlements } from "../lib/entitlements";
import { getNewScanPath } from "../lib/entitlementsService";
import { useHomeDashboard } from "../lib/useHomeDashboard";
import { getDisplayName } from "../lib/userDisplay";
import { ActiveGoalHomeView } from "./ActiveGoalHomeView";
import { ExistingUserHomeView } from "./ExistingUserHomeView";
import { NewUserHomeView } from "./NewUserHomeView";
import { ScansOnlyHomeView } from "./ScansOnlyHomeView";

export default function HomePage() {
  const { user } = useAuth();
  const { entitlements, loading: entitlementsLoading } = useEntitlements();
  const {
    profile,
    scans,
    generatedXrays,
    latestSnapshot,
    activeGoal,
    explorationXrays,
    milestones,
    currentMilestone,
    showActiveGoalHome,
    showRichHome,
    showScansOnlyHome,
    transitionCtaTo,
    loading: dashboardLoading,
  } = useHomeDashboard();

  const scanTo = getNewScanPath(entitlements);
  const displayName = getDisplayName(user, profile);

  if (entitlementsLoading || dashboardLoading) {
    return (
      <div className="flex min-h-[40svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (showActiveGoalHome && activeGoal) {
    return (
      <ActiveGoalHomeView
        displayName={displayName}
        goal={activeGoal}
        milestones={milestones}
        currentMilestone={currentMilestone}
        scanTo={scanTo}
        isPro={entitlements.hasRadar}
        latestScanId={scans[0]?.id}
        explorationXrays={explorationXrays}
      />
    );
  }

  if (showRichHome) {
    return (
      <ExistingUserHomeView
        displayName={displayName}
        scans={scans}
        generatedXrays={generatedXrays}
        latestSnapshot={latestSnapshot}
        transitionCtaTo={transitionCtaTo}
      />
    );
  }

  if (showScansOnlyHome) {
    return (
      <ScansOnlyHomeView
        displayName={displayName}
        scans={scans}
        latestSnapshot={latestSnapshot}
        scanTo={scanTo}
        transitionCtaTo={transitionCtaTo}
      />
    );
  }

  return <NewUserHomeView displayName={displayName} scanTo={scanTo} />;
}
