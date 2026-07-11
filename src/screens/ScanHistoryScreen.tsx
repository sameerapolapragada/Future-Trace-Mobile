import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatExposureLevelDisplay } from "../../lib/shared";
import type { StoredScan } from "../../lib/shared";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { PrimaryButton, Subtitle, Title } from "../components/ui";
import { listScans } from "../lib/scanStorage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ScanHistory">;

function formatScanDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ScanHistoryCard({
  scan,
  onOpen,
}: {
  scan: StoredScan;
  onOpen: () => void;
}) {
  const profile = scan.result.identifiedCareerProfile ?? scan.result.currentRole;
  const resilience = scan.result.currentRoleProfile.resilienceScore;
  const exposure = formatExposureLevelDisplay(scan.result.currentRoleProfile.aiExposureLevel);

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.scanCard, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`View scan from ${formatScanDate(scan.createdAt)}`}
    >
      <View style={styles.cardTopRow}>
        <Text style={styles.cardDate}>{formatScanDate(scan.createdAt)}</Text>
        <Text style={styles.cardChevron}>›</Text>
      </View>

      <Text style={styles.cardProfile} numberOfLines={1}>
        {profile}
      </Text>

      <View style={styles.transitionRow}>
        <Text style={styles.roleText} numberOfLines={1}>
          {scan.result.currentRole}
        </Text>
        <LinearGradient
          colors={[colors.accentPurple, colors.accentGold]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.arrowBadge}
        >
          <Text style={styles.arrowText}>→</Text>
        </LinearGradient>
        <Text style={[styles.roleText, styles.roleTextTarget]} numberOfLines={1}>
          {scan.result.targetRole}
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricPill}>
          <Text style={styles.metricValue}>{resilience}</Text>
          <Text style={styles.metricLabel}>Resilience</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricPill}>
          <Text style={styles.metricValue}>{exposure}</Text>
          <Text style={styles.metricLabel}>AI Exposure</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function ScanHistoryScreen({ navigation }: Props) {
  const [scans, setScans] = useState<StoredScan[]>([]);
  const insets = useSafeAreaInsets();

  const goHome = useCallback(() => {
    navigation.navigate("MainTabs", { screen: "Home" });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      listScans().then(setScans);
    }, [])
  );

  return (
    <View style={styles.safe}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={goHome}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Title>Scan History</Title>
        <Subtitle>
          {scans.length > 0
            ? `${scans.length} Career Scan${scans.length === 1 ? "" : "s"} stored on this device only.`
            : "Career Scans stored on this device only."}
        </Subtitle>

        {scans.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.empty}>No scans yet. Find your next roles to see results here.</Text>
            <PrimaryButton
              label="Find my next roles"
              onPress={() => navigation.navigate("NextRolesIntro")}
            />
          </View>
        ) : (
          <View style={styles.list}>
            {scans.map((scan) => (
              <ScanHistoryCard
                key={scan.id}
                scan={scan}
                onOpen={() => navigation.navigate("ScanResults", { scanId: scan.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  backBtn: { alignSelf: "flex-start" },
  backText: { color: colors.accent, fontSize: 16, fontWeight: "600" },
  scroll: { paddingHorizontal: spacing.lg },
  list: { gap: spacing.md, marginTop: spacing.lg },
  pressed: { opacity: 0.85 },

  scanCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  cardDate: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  cardChevron: { color: colors.muted, fontSize: 22, lineHeight: 22, fontWeight: "300" },
  cardProfile: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  transitionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  roleText: { flex: 1, color: colors.muted, fontSize: 13, fontWeight: "600" },
  roleTextTarget: { color: colors.text },
  arrowBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { color: colors.text, fontSize: 14, fontWeight: "700" },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.elevated,
    overflow: "hidden",
  },
  metricPill: { flex: 1, alignItems: "center", paddingVertical: spacing.md },
  metricDivider: { width: 1, alignSelf: "stretch", backgroundColor: colors.border },
  metricValue: { color: colors.text, fontSize: 18, fontWeight: "700" },
  metricLabel: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  empty: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: spacing.md },
});
