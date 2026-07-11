import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Alert,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AIExposureLevel, CareerDirectionRecommendation, RoleScanProfile, StoredScan } from "../../lib/shared";
import {
  CAREER_ANALYSIS_SOURCE,
  formatExposureLevelDisplay,
  formatExposureHelpAlert,
  formatResilienceHelpAlert,
  normalizeCareerRecommendations,
  AI_DISCLAIMER,
  TOP_CAREER_DIRECTIONS_INTRO,
} from "../../lib/shared";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { FadeInView } from "../components/FadeInView";
import { PrimaryButton, SecondaryButton } from "../components/ui";
import { getScan } from "../lib/scanStorage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ScanResults">;

function exposureTone(level: AIExposureLevel): string {
  if (level === "low") return colors.success;
  if (level === "high") return colors.danger;
  return colors.warning;
}

function AnimatedScore({ value, delay = 0, style }: { value: number; delay?: number; style?: object }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    setDisplay(0);
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, {
      toValue: value,
      duration: 900,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [anim, delay, value]);

  return <Text style={style}>{display}</Text>;
}

function ResultsHero({
  currentRole,
  originalRoleInput,
  normalizedCurrentRole,
  analysisQualityLabel,
  roleMatchStatus,
  roleMatchUserAction,
}: {
  currentRole: string;
  originalRoleInput?: string;
  normalizedCurrentRole?: string;
  analysisQualityLabel?: string;
  roleMatchStatus?: string;
  roleMatchUserAction?: string;
}) {
  const matched = normalizedCurrentRole ?? currentRole;
  const showInputDiff =
    originalRoleInput && matched && originalRoleInput.trim() !== matched.trim();

  return (
    <FadeInView delay={0} duration={520}>
      <LinearGradient
        colors={[`${colors.accentPurple}22`, `${colors.accentGold}12`, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroEyebrow}>Your next roles</Text>
        <Text style={styles.heroHeadline}>Based on your role as</Text>
        <Text style={styles.heroRole}>{matched}</Text>
        {showInputDiff ? (
          <Text style={styles.inputEcho}>From your input: {originalRoleInput}</Text>
        ) : null}
        {analysisQualityLabel ? (
          <Text style={styles.qualityValue}>{analysisQualityLabel}</Text>
        ) : null}
        {roleMatchStatus === "partial_match" ? (
          <Text style={styles.roleMatchNote}>We used the closest confirmed current role.</Text>
        ) : null}
        {roleMatchStatus === "unsupported" && roleMatchUserAction === "approximate_continue" ? (
          <Text style={styles.roleMatchWarning}>
            This analysis is based on an approximate current role match and may be less precise.
          </Text>
        ) : null}
      </LinearGradient>
    </FadeInView>
  );
}

function MetricHelpButton({
  accessibilityLabel,
  getAlert,
}: {
  accessibilityLabel: string;
  getAlert: () => { title: string; message: string };
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={() => {
        const { title, message } = getAlert();
        Alert.alert(title, message);
      }}
      style={styles.helpBtn}
    >
      <Text style={styles.helpBtnText}>?</Text>
    </Pressable>
  );
}

function ScoreCard({
  label,
  profile,
  tone,
  scoreDelay,
}: {
  label: string;
  profile: RoleScanProfile;
  tone: "current" | "target";
  scoreDelay: number;
}) {
  const accent = tone === "current" ? colors.accent : colors.success;
  const border = tone === "current" ? `${colors.accent}40` : `${colors.success}40`;

  return (
    <View style={[styles.scoreCard, { borderColor: border }]}>
      <Text style={[styles.scoreCardLabel, { color: accent }]}>{label}</Text>
      <Text style={styles.scoreCardRole} numberOfLines={1}>
        {label === "Current role" ? "Today" : "Goal"}
      </Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricBox}>
          <View style={styles.metricValueRow}>
            <AnimatedScore value={profile.resilienceScore} delay={scoreDelay} style={styles.metricNumber} />
            <Text style={styles.metricSuffix}>/100</Text>
          </View>
          <View style={styles.metricCaptionRow}>
            <Text style={styles.metricCaption}>Resilience</Text>
            <MetricHelpButton
              accessibilityLabel="What is career resilience?"
              getAlert={formatResilienceHelpAlert}
            />
          </View>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricBox}>
          <Text style={[styles.exposureBadge, { color: exposureTone(profile.aiExposureLevel) }]}>
            {formatExposureLevelDisplay(profile.aiExposureLevel)}
          </Text>
          <View style={styles.metricCaptionRow}>
            <Text style={styles.metricCaption}>AI Exposure</Text>
            <MetricHelpButton
              accessibilityLabel="What is AI exposure level?"
              getAlert={formatExposureHelpAlert}
            />
          </View>
          {profile.aiExposureScore != null ? (
            <Text style={styles.exposureScore}>{profile.aiExposureScore}/100</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function InsightPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "strength" | "watch" | "opportunity";
}) {
  const toneStyles = {
    strength: { border: `${colors.success}55`, title: colors.success, dot: colors.success },
    watch: { border: `${colors.danger}55`, title: colors.danger, dot: colors.danger },
    opportunity: { border: `${colors.accent}55`, title: colors.accent, dot: colors.accent },
  }[tone];

  return (
    <View style={[styles.insightPanel, { borderColor: toneStyles.border }]}>
      <Text style={[styles.insightTitle, { color: toneStyles.title }]}>{title}</Text>
      {items.map((item, i) => (
        <View key={`${title}-${i}`} style={styles.insightRow}>
          <View style={[styles.insightDot, { backgroundColor: toneStyles.dot }]} />
          <Text style={styles.insightText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function NextRolesCard({ items }: { items: CareerDirectionRecommendation[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Top 5 immediate next roles</Text>
      <Text style={styles.recIntro}>{TOP_CAREER_DIRECTIONS_INTRO}</Text>
      {items.map((item, i) => (
        <View key={`${item.role}-${i}`} style={[styles.recBlock, i > 0 && styles.recBlockDivider]}>
          <View style={styles.recRow}>
            <LinearGradient
              colors={[colors.accentPurple, colors.accentGold]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.recBadge}
            >
              <Text style={styles.recBadgeText}>{i + 1}</Text>
            </LinearGradient>
            <View style={styles.recTitleCol}>
              <Text style={styles.recTitle}>{item.role}</Text>
              <Text style={styles.recTransferability}>{item.transferabilityScore}% fit</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipLabel}>Avg national salary</Text>
              <Text style={styles.metaChipValue}>{item.salaryLabel ?? "—"}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipLabel}>Transition time</Text>
              <Text style={styles.metaChipValue}>{item.transitionLabel ?? "—"}</Text>
            </View>
          </View>

          <Text style={styles.recWhyLabel}>Transferable skills</Text>
          <View style={styles.skillRow}>
            {(item.transferableSkills ?? []).slice(0, 3).map((skill) => (
              <View key={skill} style={styles.skillChip}>
                <Text style={styles.skillChipText}>{skill}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.recWhyLabel}>Why this fits</Text>
          <Text style={styles.recWhyText}>{item.why}</Text>
        </View>
      ))}
      <Text style={styles.salaryNote}>
        Salary ranges are curated national estimates for planning — not live market quotes or guarantees.
      </Text>
    </View>
  );
}

function ComingSoonCard({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={[styles.card, styles.comingSoonCard]}>
      <Text style={styles.comingSoonTitle}>{title}</Text>
      <Text style={styles.bodyText}>{body}</Text>
      {actionLabel && onAction ? <SecondaryButton label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function ScanResultsScreen({ route, navigation }: Props) {
  const [scan, setScan] = useState<StoredScan | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    getScan(route.params.scanId).then(setScan);
  }, [route.params.scanId]);

  if (!scan) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.loadingWrap}>
          <View style={styles.loadingDot} />
          <Text style={styles.loadingText}>Loading your results…</Text>
        </View>
      </View>
    );
  }

  const { result } = scan;
  const current = result.currentRoleProfile;
  const recommendations = normalizeCareerRecommendations(result.initialRoleRecommendations);

  return (
    <View style={styles.safe}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <ResultsHero
          currentRole={result.currentRole}
          originalRoleInput={result.originalRoleInput ?? scan.input.originalCurrentRole}
          normalizedCurrentRole={result.normalizedCurrentRole ?? result.currentRole}
          analysisQualityLabel={result.analysisQualityLabel}
          roleMatchStatus={result.roleMatchStatus ?? scan.input.roleMatch?.matchStatus}
          roleMatchUserAction={result.roleMatchUserAction ?? scan.input.roleMatch?.userAction}
        />

        {recommendations.length > 0 ? (
          <FadeInView delay={80}>
            <NextRolesCard items={recommendations} />
          </FadeInView>
        ) : null}

        <FadeInView delay={160}>
          <ScoreCard label="Your current role" profile={current} tone="current" scoreDelay={180} />
        </FadeInView>

        <FadeInView delay={220}>
          <InsightPanel title="Strengths" items={current.strengths} tone="strength" />
        </FadeInView>

        <FadeInView delay={280}>
          <InsightPanel title="Risks" items={current.vulnerabilities} tone="watch" />
        </FadeInView>

        {current.opportunityZones.length > 0 ? (
          <FadeInView delay={340}>
            <InsightPanel title="Opportunities" items={current.opportunityZones} tone="opportunity" />
          </FadeInView>
        ) : null}

        <FadeInView delay={400}>
          <PrimaryButton
            label="Open AI Disruption Radar"
            onPress={() => navigation.navigate("MainTabs", { screen: "Radar" })}
          />
          <SecondaryButton label="Scan history" onPress={() => navigation.navigate("ScanHistory")} />
        </FadeInView>

        <FadeInView delay={460}>
          <ComingSoonCard
            title="Career X-Ray — Early Access"
            body="Deep skill-gap analysis and personalized roadmaps are coming soon. Join Early Access to get notified at launch."
            actionLabel="Join Early Access"
            onAction={() => navigation.navigate("Waitlist")}
          />
        </FadeInView>

        <FadeInView delay={520}>
          <Text style={styles.footerDisclaimer}>{CAREER_ANALYSIS_SOURCE}</Text>
          <Text style={styles.footerNote}>Results saved on this device.</Text>
          <Text style={styles.footerNote}>{AI_DISCLAIMER}</Text>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  backBtn: { alignSelf: "flex-start" },
  backText: { color: colors.accent, fontSize: 16, fontWeight: "600" },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accentPurple,
  },
  loadingText: { color: colors.muted, fontSize: 14 },

  hero: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xs,
  },
  heroEyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  heroHeadline: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
  },
  heroRole: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 28,
  },
  identifiedProfileBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.elevated,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  identifiedLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  identifiedValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  inputEcho: { color: colors.muted, fontSize: 13, marginTop: spacing.sm, textAlign: "center" },
  qualityValue: { color: colors.accent, fontSize: 13, fontWeight: "600", marginTop: spacing.sm, textAlign: "center" },
  roleMatchNote: { color: colors.muted, fontSize: 12, marginTop: spacing.sm, fontStyle: "italic", textAlign: "center" },
  roleMatchWarning: { color: colors.warning, fontSize: 12, marginTop: spacing.sm, fontStyle: "italic", textAlign: "center" },
  transitionRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  roleBlock: { flex: 1 },
  roleLabel: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  roleLabelTarget: { color: colors.success },
  roleName: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 4, lineHeight: 20 },
  arrowWrap: { paddingHorizontal: 2 },
  arrowBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { color: colors.text, fontSize: 18, fontWeight: "700" },

  scoreCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  scoreCardLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  scoreCardRole: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: spacing.md },
  metricsGrid: { flexDirection: "row", alignItems: "center" },
  metricBox: { flex: 1, alignItems: "center" },
  metricDivider: { width: 1, height: 48, backgroundColor: colors.border },
  metricValueRow: { flexDirection: "row", alignItems: "baseline" },
  metricNumber: { color: colors.text, fontSize: 36, fontWeight: "700", fontVariant: ["tabular-nums"] },
  metricSuffix: { color: colors.muted, fontSize: 14, marginLeft: 2 },
  metricCaption: { color: colors.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  metricCaptionRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 4 },
  helpBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.elevated,
  },
  helpBtnText: { color: colors.muted, fontSize: 10, fontWeight: "700", lineHeight: 12 },
  exposureBadge: { fontSize: 22, fontWeight: "700" },
  exposureScore: { color: colors.muted, fontSize: 11, marginTop: 2 },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  bodyText: { color: colors.text, fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  pressed: { opacity: 0.85 },

  insightPanel: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  insightTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginTop: 8 },
  insightDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  insightText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 21 },

  recIntro: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  recBlock: { marginTop: spacing.lg },
  recBlockDivider: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  recBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  recBadgeText: { color: colors.text, fontSize: 12, fontWeight: "700" },
  recTitleCol: { flex: 1 },
  recTitle: { color: colors.text, fontSize: 16, fontWeight: "700", lineHeight: 22 },
  recTransferability: { color: colors.accentGold, fontSize: 13, fontWeight: "700", marginTop: 4 },
  metaRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  metaChip: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.elevated,
    padding: spacing.sm,
  },
  metaChipLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metaChipValue: { color: colors.text, fontSize: 14, fontWeight: "700", marginTop: 4 },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  skillChip: {
    borderRadius: radius.pill,
    backgroundColor: `${colors.accent}18`,
    borderWidth: 1,
    borderColor: `${colors.accent}44`,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  skillChipText: { color: colors.accent, fontSize: 12, fontWeight: "600" },
  recWhyLabel: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: spacing.sm },
  recWhyText: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 4 },
  salaryNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing.lg, fontStyle: "italic" },

  comingSoonCard: { borderColor: `${colors.accentPurple}44` },
  comingSoonTitle: { color: colors.accentPurple, fontSize: 16, fontWeight: "700" },

  footerDisclaimer: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: spacing.sm },
  footerNote: { color: colors.muted, fontSize: 10, textAlign: "center", marginTop: spacing.md, opacity: 0.7 },
});
