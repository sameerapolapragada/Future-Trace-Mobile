import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { ScanFlowProgress } from "../components/ScanFlowProgress";
import { PrimaryButton, SecondaryButton } from "../components/ui";
import { getScanCount } from "../lib/scanStorage";
import { useAppNavigation } from "../navigation/hooks";

const WHAT_YOU_GET = [
  {
    id: "roles",
    title: "Top 5 Immediate Next Roles",
    description: "Best career paths you can transition into next.",
    icon: "target" as const,
  },
  {
    id: "salary",
    title: "Average Salary",
    description: "Know the earning potential for each role.",
    icon: "salary" as const,
  },
  {
    id: "time",
    title: "Time to Transition",
    description: "How soon you can realistically make the move.",
    icon: "clock" as const,
  },
  {
    id: "skills",
    title: "Transferable Skills",
    description: "See the skills you already have that make you a great fit.",
    icon: "people" as const,
  },
];

const AI_ANALYZES = [
  "Skill overlap & transferability",
  "AI disruption risk",
  "Job market demand",
  "Salary & growth trends",
  "Transition effort & time",
];

function FeatureIcon({ type }: { type: (typeof WHAT_YOU_GET)[number]["icon"] }) {
  if (type === "target") {
    return (
      <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
        <Circle cx="13" cy="15" r="9" stroke={colors.danger} strokeWidth="2" />
        <Circle cx="13" cy="15" r="5" stroke={colors.danger} strokeWidth="2" />
        <Circle cx="13" cy="15" r="2" fill={colors.danger} />
        <Path d="M18 6l5-3v5l-5-2z" fill={colors.accent} />
        <Path d="M18 6l-4 8" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  if (type === "salary") {
    return (
      <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
        <Circle cx="14" cy="14" r="11" fill={colors.success} />
        <Path
          d="M14 8v12M11 11.5c0-1.2 1.3-2 3-2s3 .8 3 2-1.3 2-3 2-3 .8-3 2 1.3 2 3 2 3-.8 3-2"
          stroke={colors.text}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  if (type === "clock") {
    return (
      <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
        <Circle cx="14" cy="15" r="9" stroke={colors.accent} strokeWidth="2" />
        <Path d="M14 11v4l3 2" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
        <Rect x="11" y="4" width="6" height="3" rx="1" fill={colors.accent} />
      </Svg>
    );
  }
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Circle cx="10" cy="10" r="4" fill={colors.accent} />
      <Path d="M3 22c0-3.5 3-6 7-6s7 2.5 7 6" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="19" cy="11" r="3.5" fill={colors.success} />
      <Path d="M15 22c.5-2.5 2.8-4.5 5.5-4.5S26 19.5 26 22" stroke={colors.success} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="10" r="10" fill={colors.success} />
      <Path d="M5.5 10.2l3 3 6-6.5" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function NextRolesIntroScreen() {
  const navigation = useAppNavigation();
  const [scanCount, setScanCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getScanCount().then(setScanCount);
    }, [])
  );

  function continueToForm() {
    navigation.navigate("ScanCurrentRole");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.progressWrap}>
        <ScanFlowProgress step={1} />
      </View>
      <LinearGradient
        colors={[colors.accentPurple, `${colors.accentPurple}CC`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerText}>RESULTS – TOP 5 IMMEDIATE NEXT ROLES</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>WHAT YOU GET</Text>
          {WHAT_YOU_GET.map((item) => (
            <View key={item.id} style={styles.featureRow}>
              <View style={styles.iconWrap}>
                <FeatureIcon type={item.icon} />
              </View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDesc}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>OUR AI ANALYZES</Text>
          {AI_ANALYZES.map((item) => (
            <View key={item} style={styles.checkRow}>
              <CheckIcon />
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton label="Continue" onPress={continueToForm} />
        {scanCount > 0 ? (
          <SecondaryButton label="Scan history" onPress={() => navigation.navigate("ScanHistory")} />
        ) : null}
        <SecondaryButton
          label="Back to home"
          onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  progressWrap: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    alignItems: "center",
  },
  header: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  headerText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    textAlign: "center",
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.accentPurple,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: { flex: 1 },
  featureTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  featureDesc: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  checkText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
});
