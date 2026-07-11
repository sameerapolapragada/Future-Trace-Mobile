import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  buildNextRoleDetailModel,
  normalizeCareerRecommendations,
  type CareerDirectionRecommendation,
} from "../../lib/shared";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { PrimaryButton, SecondaryButton } from "../components/ui";
import { getScan } from "../lib/scanStorage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "NextRoleDetail">;

export function NextRoleDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<CareerDirectionRecommendation | null>(null);
  const [rank, setRank] = useState(route.params.roleIndex + 1);

  useEffect(() => {
    getScan(route.params.scanId).then((scan) => {
      if (!scan) return;
      const list = normalizeCareerRecommendations(scan.result.initialRoleRecommendations);
      const role = list[route.params.roleIndex];
      if (role) {
        setItem(role);
        setRank(route.params.roleIndex + 1);
      }
    });
  }, [route.params.roleIndex, route.params.scanId]);

  const detail = useMemo(() => (item ? buildNextRoleDetailModel(item) : null), [item]);

  if (!item || !detail) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <Text style={styles.missing}>Role details unavailable.</Text>
        <SecondaryButton label="Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <LinearGradient
            colors={[colors.accentPurple, colors.accentGold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rankBadge}
          >
            <Text style={styles.rankText}>{rank}</Text>
          </LinearGradient>
          <Text style={styles.title}>{item.role}</Text>
        </View>

        <View style={styles.matchRow}>
          <View style={styles.matchPill}>
            <Text style={styles.matchPillText}>{item.transferabilityScore}% Match</Text>
          </View>
          <Text style={styles.fitLabel}>{detail.fitLabel}</Text>
        </View>

        <View style={styles.metricsCard}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{detail.salaryDisplay}</Text>
            <Text style={styles.metricLabel}>{detail.salaryCaption}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{item.transitionLabel ?? "—"}</Text>
            <Text style={styles.metricLabel}>Est. Transition</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Why You&apos;re a Great Fit</Text>
          {detail.whyFit.map((reason) => (
            <View key={reason} style={styles.listRow}>
              <View style={styles.checkIcon}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
              <Text style={styles.listText}>{reason}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Skills You May Need</Text>
          {detail.skillsNeeded.map((skill) => (
            <View key={skill} style={styles.listRow}>
              <View style={styles.needIcon}>
                <Text style={styles.needArrow}>›</Text>
              </View>
              <Text style={styles.listText}>{skill}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fastest Path to Transition</Text>
          {detail.transitionSteps.map((step, index) => (
            <View key={step.title} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDuration}>{step.duration}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton
          label="Explore AI Career Transition"
          onPress={() => navigation.navigate("Waitlist")}
        />
        <SecondaryButton
          label="Open AI Disruption Radar"
          onPress={() => navigation.navigate("MainTabs", { screen: "Radar" })}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  backText: { color: colors.accent, fontSize: 16, fontWeight: "600" },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
  missing: { color: colors.muted, textAlign: "center", marginVertical: spacing.xl },

  headerRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  rankText: { color: colors.text, fontSize: 16, fontWeight: "800" },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", lineHeight: 32, flex: 1 },

  matchRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  matchPill: {
    backgroundColor: `${colors.success}22`,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchPillText: { color: colors.success, fontSize: 12, fontWeight: "700" },
  fitLabel: { color: colors.text, fontSize: 14, fontWeight: "700" },

  metricsCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  metricBox: { flex: 1 },
  metricDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  metricValue: { color: colors.text, fontSize: 20, fontWeight: "800" },
  metricLabel: { color: colors.muted, fontSize: 12, marginTop: 4 },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "800", marginBottom: spacing.xs },
  listRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginTop: 4 },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkMark: { color: colors.text, fontSize: 12, fontWeight: "800" },
  needIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.warning,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  needArrow: { color: colors.warning, fontSize: 14, fontWeight: "800", marginTop: -1 },
  listText: { color: colors.text, fontSize: 14, lineHeight: 21, flex: 1 },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: 4,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accentPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: { color: colors.text, fontSize: 12, fontWeight: "800" },
  stepTitle: { color: colors.text, fontSize: 14, fontWeight: "600", flex: 1 },
  stepDuration: { color: colors.muted, fontSize: 12, fontWeight: "600" },
});
