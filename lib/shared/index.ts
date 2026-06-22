export * from "./types";
export * from "./theme";
export { inferTargetRole, formatRoleLabel } from "./scan/inferTargetRole";
export { normalizeScanInput, normalizeWorkPreference, clampYearsExperience } from "./scan/normalize";
export { validateScanForm, type ScanValidationError } from "./scan/validation";
export { generateRuleBasedScan } from "./scan/ruleBasedScan";
export { generateHybridScan, type HybridScanConfig } from "./scan/hybridScan";
export { resolveOccupation } from "./onet/client";
export { calculateExposureScore, scoreToExposureLevel, fallbackExposureFromArchetype } from "./exposure/scoringEngine";
export { matchLocalOccupation } from "./onet/matchOccupation";
export { createOnetCacheAdapter, InMemoryOnetCache, onetCacheKey } from "./onet/cache";
export {
  createBundledOccupationProvider,
  createSupabaseOccupationProvider,
  type OccupationDataProvider,
} from "./onet/provider";
export type { OnetOccupation, OnetMatchResult, OnetCache } from "./onet/types";
export type { ExposureScoreResult, ExposureExplanation } from "./exposure/types";
export { buildDisruptionRadarFromScan } from "./radar/disruptionRadar";
export { buildDisruptionRadarBrief, type DisruptionRadarBrief, type DisruptionRadarStatus } from "./radar/disruptionStatus";
export {
  FREE_SCANS_PER_WEEK,
  FREE_SCAN_WINDOW_MS,
  PHASE2_TRANSITION_SCANS_PER_MONTH,
  PHASE2_XRAY_PRICE_USD,
} from "./scan/limits";
export { AI_DISCLAIMER, PRIVACY_POLICY_HTML, TERMS_HTML } from "./legal/content";
import { MVP_FEATURE_FLAGS } from "./mvpFlags";
export {
  MVP_FEATURE_FLAGS,
  MVP_COMING_SOON_LABEL,
  MVP_COMING_SOON_MESSAGE,
  isMvpCheckoutEnabled,
  isMvpPaymentsEnabled,
  isMvpSubscriptionsEnabled,
  isMvpCareerXrayPurchaseEnabled,
  isMvpAiCareerTransitionPurchaseEnabled,
  isMvpPremiumMilestoneUnlockingEnabled,
  isMvpDynamicLaborMarketUpdatesEnabled,
  isMvpAdvancedAiCoachingEnabled,
} from "./mvpFlags";

/** Mobile Phase 1 alias — kept in sync with MVP_FEATURE_FLAGS. */
export const PHASE1_MODE = {
  paymentsEnabled: MVP_FEATURE_FLAGS.paymentsEnabled,
  subscriptionsEnabled: MVP_FEATURE_FLAGS.subscriptionsEnabled,
  llmScanEnabled: false,
  careerXrayEnabled: MVP_FEATURE_FLAGS.careerXrayPurchaseEnabled,
} as const;
