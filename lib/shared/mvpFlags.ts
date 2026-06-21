/**
 * iOS MVP launch feature flags.
 * Flip individual flags to true when monetization is approved (EAD).
 * Code for disabled features stays in place — only runtime access is gated.
 */
export const MVP_FEATURE_FLAGS = {
  /** Core product — keep enabled for MVP launch */
  careerScanEnabled: true,
  onboardingEnabled: true,
  authenticationEnabled: true,
  profileEnabled: true,
  dashboardEnabled: true,
  careerGoalSelectionEnabled: true,

  /** Monetization — disabled until EAD */
  paymentsEnabled: false,
  subscriptionsEnabled: false,
  careerXrayPurchaseEnabled: false,
  aiCareerTransitionPurchaseEnabled: false,
  recurringBillingEnabled: false,

  /** Premium capabilities — disabled for MVP */
  premiumMilestoneUnlockingEnabled: false,
  dynamicLaborMarketUpdatesEnabled: false,
  advancedAiCoachingEnabled: false,
} as const;

export type MvpFeatureFlags = typeof MVP_FEATURE_FLAGS;

export const MVP_COMING_SOON_LABEL = "Coming Soon";

export const MVP_COMING_SOON_MESSAGE =
  "This feature is coming soon. Career Scan and your dashboard remain fully available.";

export function isMvpPaymentsEnabled(): boolean {
  return MVP_FEATURE_FLAGS.paymentsEnabled;
}

export function isMvpSubscriptionsEnabled(): boolean {
  return MVP_FEATURE_FLAGS.subscriptionsEnabled;
}

export function isMvpCareerXrayPurchaseEnabled(): boolean {
  return MVP_FEATURE_FLAGS.careerXrayPurchaseEnabled;
}

export function isMvpAiCareerTransitionPurchaseEnabled(): boolean {
  return MVP_FEATURE_FLAGS.aiCareerTransitionPurchaseEnabled;
}

export function isMvpRecurringBillingEnabled(): boolean {
  return MVP_FEATURE_FLAGS.recurringBillingEnabled;
}

export function isMvpPremiumMilestoneUnlockingEnabled(): boolean {
  return MVP_FEATURE_FLAGS.premiumMilestoneUnlockingEnabled;
}

export function isMvpDynamicLaborMarketUpdatesEnabled(): boolean {
  return MVP_FEATURE_FLAGS.dynamicLaborMarketUpdatesEnabled;
}

export function isMvpAdvancedAiCoachingEnabled(): boolean {
  return MVP_FEATURE_FLAGS.advancedAiCoachingEnabled;
}

/** Any checkout or in-app purchase surface. */
export function isMvpCheckoutEnabled(): boolean {
  return (
    MVP_FEATURE_FLAGS.paymentsEnabled &&
    (MVP_FEATURE_FLAGS.careerXrayPurchaseEnabled ||
      MVP_FEATURE_FLAGS.aiCareerTransitionPurchaseEnabled ||
      MVP_FEATURE_FLAGS.subscriptionsEnabled)
  );
}
