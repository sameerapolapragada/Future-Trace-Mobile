export * from "./types";
export * from "./theme";
export { inferTargetRole, formatRoleLabel } from "./scan/inferTargetRole";
export {
  buildRecommendations,
  firstCareerRecommendationRole,
  normalizeCareerRecommendations,
  TOP_CAREER_DIRECTIONS_INTRO,
  NEXT_ROLES_COUNT,
} from "./scan/careerRecommendations";
export { buildNextRoleDetailModel, type NextRoleDetailModel } from "./scan/nextRoleDetail";
export {
  resolveCanonicalRole,
  resolveCanonicalRoles,
  normalizeRoleText,
  roleStringSimilarity,
  ROLE_MATCH_CONFIDENCE_THRESHOLD,
} from "./scan/roleCanonicalization";
export {
  matchRole,
  canGenerateScan,
  formatRoleMatchQualityLabel,
  shouldTrackUnknownRole,
  normalizeRoleInputForTracking,
  confidenceLabelFromScore,
  TECHNOLOGY_CURRENT_ROLES,
  OTHER_ROLE_OPTION,
  filterTechnologyCurrentRoles,
  isTechnologyCurrentRole,
  isOtherRoleSelection,
  resolveScanFormRoleInput,
  type RoleMatchInput,
  type RoleMatchResult,
  type MatchStatus,
  type ConfidenceLabel,
  type AnalysisQuality,
  type SuggestedRole,
} from "./scan/roleMatch";
export { normalizeScanInput, normalizeWorkPreference, clampYearsExperience } from "./scan/normalize";
export {
  validateScanForm,
  validateScanContext,
  type ScanValidationError,
} from "./scan/validation";
export {
  validateJobTitle,
  validateResponsibilities,
  validateCertifications,
  isLikelyNonsenseJobTitle,
  SCAN_INPUT_LIMITS,
} from "./scan/inputValidation";
export {
  isTechnologyDomain,
  isSupportedIndustry,
  filterSupportedIndustries,
  TECHNOLOGY_DOMAIN_MESSAGE,
  TECHNOLOGY_INDUSTRY_OPTIONS,
  SUPPORTED_INDUSTRY_OPTIONS,
  DEFAULT_TECHNOLOGY_INDUSTRY,
} from "./scan/technologyDomain";
export {
  WORK_PREFERENCE_OPTIONS,
  WORK_PREFERENCE_SCAN_IMPACT,
  formatWorkPreferenceHelpAlert,
} from "./scan/workPreferenceHelp";
export {
  RESILIENCE_HELP_TITLE,
  RESILIENCE_HELP_SUMMARY,
  RESILIENCE_HELP_BODY,
  formatResilienceHelpAlert,
} from "./scan/resilienceHelp";
export {
  EXPOSURE_HELP_TITLE,
  EXPOSURE_HELP_SUMMARY,
  EXPOSURE_HELP_BODY,
  formatExposureHelpAlert,
} from "./scan/exposureHelp";
export {
  DISRUPTION_RADAR_HELP_TITLE,
  DISRUPTION_RADAR_HELP_SUMMARY,
  DISRUPTION_RADAR_HELP_BODY,
  formatDisruptionRadarHelpAlert,
} from "./scan/disruptionRadarHelp";
export { generateRuleBasedScan } from "./scan/ruleBasedScan";
export { generateHybridScan, type HybridScanConfig } from "./scan/hybridScan";
export {
  CAREER_ANALYSIS_SOURCE,
  formatAnalysisConfidence,
  formatBenchmarkRoleTitle,
  formatExposureLevelDisplay,
  aiExposureInsightCopy,
  type AnalysisConfidence,
  type ExposureLevelDisplay,
} from "./scan/analysisMeta";
export { resolveOccupation } from "./onet/client";
export { calculateExposureScore, scoreToExposureLevel, fallbackExposureFromArchetype } from "./exposure/scoringEngine";
export { matchLocalOccupation } from "./onet/matchOccupation";
export {
  occupationSimilarity,
  rankRelatedOccupations,
  sharedOccupationSkills,
  resolveLocalOccupation,
} from "./onet/skillDistance";
export { createOnetCacheAdapter, InMemoryOnetCache, onetCacheKey } from "./onet/cache";
export {
  createBundledOccupationProvider,
  createSupabaseOccupationProvider,
  type OccupationDataProvider,
} from "./onet/provider";
export type { OnetOccupation, OnetMatchResult, OnetCache } from "./onet/types";
export type { ExposureScoreResult, ExposureExplanation } from "./exposure/types";
export { buildDisruptionRadarFromScan } from "./radar/disruptionRadar";
export {
  buildDisruptionRadarBrief,
  resolveDisruptionStatus,
  type DisruptionRadarBrief,
  type DisruptionRadarStatus,
} from "./radar/disruptionStatus";
export {
  buildDisruptionRadarPageModel,
  DISRUPTION_LEVEL_LEGEND,
  type DisruptionRadarPageModel,
  type DisruptionRadarRoleCard,
} from "./radar/disruptionRadarPage";
export {
  buildRoleDisruptionAnalysis,
  ROLE_DISRUPTION_ANALYSIS_FOOTER,
  type RoleDisruptionAnalysis,
  type RoleDisruptionAnalysisSection,
  type RoleDisruptionFocus,
} from "./radar/roleDisruptionAnalysis";
export {
  FREE_SCANS_PER_WEEK,
  FREE_SCAN_WINDOW_MS,
  PHASE2_TRANSITION_SCANS_PER_MONTH,
  PHASE2_XRAY_PRICE_USD,
} from "./scan/limits";
export {
  AI_DISCLAIMER,
  SCAN_RESULTS_NOTE,
  stripScanSummaryDisclaimer,
  PRIVACY_POLICY_HTML,
  TERMS_HTML,
} from "./legal/content";
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
