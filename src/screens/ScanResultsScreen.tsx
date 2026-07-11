import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CareerDirectionRecommendation, StoredScan } from "../../lib/shared";
import {
  AI_DISCLAIMER,
  CAREER_ANALYSIS_SOURCE,
  formatExposureHelpAlert,
  formatExposureLevelDisplay,
  formatResilienceHelpAlert,
  normalizeCareerRecommendations,
  TOP_CAREER_DIRECTIONS_INTRO,
} from "../../lib/shared";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { PrimaryButton, SecondaryButton } from "../components/ui";
import { getScan } from "../lib/scanStorage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ScanResults">;

function stabilityLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 55) return "Moderate";
  return "Developing";
}

function formatCompactSalary(item: CareerDirectionRecommendation): string {
  if (item.avgNationalSalaryUsd != null) {
    const k = Math.round(item.avgNationalSalaryUsd / 1000);
    return `$${k}K`;
  }
  if (item.salaryRangeUsd) {
    const mid = Math.round((item.salaryRangeUsd.min + item.salaryRangeUsd.max) / 2 / 1000);
    return `$${mid}K`;
  }
  const label = item.salaryLabel ?? "—";
  const match = label.match(/\$?([\d.]+)\s*k/i);
  if (match) return `$${Math.round(Number(match[1]))}K`;
  return label;
}

function InfoButton({
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
      style={styles.infoBtn}
    >
      <Text style={styles.infoBtnText}>i</Text>
    </Pressable>
  );
}

function SnapshotCard({
  title,
  score,
  caption,
  tone,
}: {
  title: string;
  score: number;
  caption: string;
  tone: "exposure" | "stability";
}) {
  const accent = tone === "exposure" ? colors.accentPurple : colors.success;
  const bg = tone === "exposure" ? `${colors.accentPurple}22` : `${colors.success}22`;

  return (
    <View style={[styles.snapshotCard, { backgroundColor: bg, borderColor: `${accent}44` }]}>
      <Text style={styles.snapshotTitle}>{title}</Text>
      <View style={styles.snapshotScoreRow}>
        <Text style={[styles.snapshotScore, { color: accent }]}>{score}</Text>
        <Text style={styles.snapshotSuffix}>/100</Text>
      </View>
      <Text style={[styles.snapshotCaption, { color: accent }]}>{caption}</Text>
    </View>
  );
}

function RoleResultCard({
  item,
  index,
  onPress,
}: {
  item: CareerDirectionRecommendation;
  index: number;
  onPress: () => void;
}) {
  const skills = (item.transferableSkills ?? []).slice(0, 4);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.roleCard, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.role}, ${item.transferabilityScore}% match`}
    >
      <View style={styles.roleTopRow}>
        <View style={styles.roleTitleRow}>
          <LinearGradient
            colors={[colors.accentPurple, colors.accentGold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rankBadge}
          >
            <Text style={styles.rankText}>{index + 1}</Text>
          </LinearGradient>
          <Text style={styles.roleTitle} numberOfLines={2}>
            {item.role}
          </Text>
        </View>
        <View style={styles.matchPill}>
          <Text style={styles.matchPillText}>{item.transferabilityScore}% Match</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCol}>
          <Text style={styles.metricValue}>{formatCompactSalary(item)}</Text>
          <Text style={styles.metricLabel}>Avg Salary</Text>
        </View>
        <View style={styles.metricCol}>
          <Text style={styles.metricValue}>{item.transitionLabel ?? "—"}</Text>
          <Text style={styles.metricLabel}>Est. Transition</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      {skills.length > 0 ? (
        <>
          <Text style={styles.skillsHeading}>Top Skills You Transfer</Text>
          <View style={styles.skillRow}>
            {skills.map((skill) => (
              <View key={skill} style={styles.skillChip}>
                <Text style={styles.skillChipText}>{skill}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </Pressable>
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
          <Text style={styles.loadingText}>Loading your results…</Text>
        </View>
      </View>
    );
  }

  const { result } = scan;
  const current = result.currentRoleProfile;
  const recommendations = normalizeCareerRecommendations(result.initialRoleRecommendations);
  const exposureScore = current.aiExposureScore ?? 0;
  const resilience = current.resilienceScore;

  return (
    <View style={styles.safe}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Your Career Snapshot</Text>
        <Text style={styles.pageSubtitle}>
          Based on your experience as {result.normalizedCurrentRole ?? result.currentRole}
        </Text>

        <View style={styles.snapshotRow}>
          <SnapshotCard
            title="AI Exposure Score"
            score={exposureScore}
            caption={formatExposureLevelDisplay(current.aiExposureLevel)}
            tone="exposure"
          />
          <SnapshotCard
            title="Career Stability Score"
            score={resilience}
            caption={stabilityLabel(resilience)}
            tone="stability"
          />
        </View>

        <View style={styles.helpRow}>
          <InfoButton accessibilityLabel="What is AI exposure?" getAlert={formatExposureHelpAlert} />
          <Text style={styles.helpHint}>AI exposure</Text>
          <InfoButton accessibilityLabel="What is career stability?" getAlert={formatResilienceHelpAlert} />
          <Text style={styles.helpHint}>Stability</Text>
        </View>

        <Text style={styles.sectionTitle}>Your Top 5 Immediate Next Roles</Text>
        <View style={styles.sectionSubRow}>
          <Text style={styles.sectionSubtitle}>Ranked by best fit, transition speed and opportunity</Text>
          <InfoButton
            accessibilityLabel="About next role recommendations"
            getAlert={() => ({
              title: "Top next roles",
              message: TOP_CAREER_DIRECTIONS_INTRO,
            })}
          />
        </View>

        {recommendations.map((item, index) => (
          <RoleResultCard
            key={`${item.role}-${index}`}
            item={item}
            index={index}
            onPress={() =>
              navigation.navigate("NextRoleDetail", {
                scanId: scan.id,
                roleIndex: index,
              })
            }
          />
        ))}

        <Text style={styles.salaryNote}>
          Salary figures are curated national estimates for planning — not live market quotes or guarantees.
        </Text>

        <PrimaryButton
          label="Open AI Disruption Radar"
          onPress={() => navigation.navigate("MainTabs", { screen: "Radar" })}
        />
        <SecondaryButton label="Scan history" onPress={() => navigation.navigate("ScanHistory")} />
        <SecondaryButton label="AI Career Transition Early Access" onPress={() => navigation.navigate("Waitlist")} />

        <Text style={styles.footerDisclaimer}>{CAREER_ANALYSIS_SOURCE}</Text>
        <Text style={styles.footerNote}>{AI_DISCLAIMER}</Text>
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
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.muted, fontSize: 14 },
  pressed: { opacity: 0.88 },

  pageTitle: { color: colors.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.4 },
  pageSubtitle: { color: colors.muted, fontSize: 14, marginTop: -4 },

  snapshotRow: { flexDirection: "row", gap: spacing.sm },
  snapshotCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  snapshotTitle: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  snapshotScoreRow: { flexDirection: "row", alignItems: "baseline", marginTop: spacing.sm },
  snapshotScore: { fontSize: 34, fontWeight: "800", fontVariant: ["tabular-nums"] },
  snapshotSuffix: { color: colors.muted, fontSize: 14, marginLeft: 2 },
  snapshotCaption: { fontSize: 13, fontWeight: "700", marginTop: 4 },

  helpRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: -4 },
  helpHint: { color: colors.muted, fontSize: 12, marginRight: spacing.sm },
  infoBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.elevated,
  },
  infoBtnText: { color: colors.muted, fontSize: 11, fontWeight: "700" },

  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: spacing.sm },
  sectionSubRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: -8 },
  sectionSubtitle: { color: colors.muted, fontSize: 13, flex: 1, lineHeight: 18 },

  roleCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  roleTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  roleTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, flex: 1 },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  rankText: { color: colors.text, fontSize: 13, fontWeight: "800" },
  roleTitle: { color: colors.text, fontSize: 16, fontWeight: "700", flex: 1, lineHeight: 22 },
  matchPill: {
    backgroundColor: `${colors.success}22`,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchPillText: { color: colors.success, fontSize: 12, fontWeight: "700" },

  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.md,
  },
  metricCol: { flex: 1 },
  metricValue: { color: colors.text, fontSize: 16, fontWeight: "800" },
  metricLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  chevron: { color: colors.muted, fontSize: 28, fontWeight: "300", paddingLeft: spacing.xs },

  skillsHeading: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.md,
    marginBottom: 6,
  },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  skillChip: {
    borderRadius: radius.pill,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  skillChipText: { color: colors.text, fontSize: 12, fontWeight: "600" },

  salaryNote: { color: colors.muted, fontSize: 11, lineHeight: 16, fontStyle: "italic" },
  footerDisclaimer: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
  footerNote: { color: colors.muted, fontSize: 10, textAlign: "center", opacity: 0.75 },
});
