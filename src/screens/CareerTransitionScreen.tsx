import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import {
  buildDisruptionRadarPageModel,
  normalizeCareerRecommendations,
  AI_DISCLAIMER,
  type DisruptionRadarStatus,
  type StoredScan,
} from "../../lib/shared";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { EarlyAccessSignupCard } from "../components/EarlyAccessSignupCard";
import { getLatestScan } from "../lib/scanStorage";
import { useAppNavigation } from "../navigation/hooks";

const DEFAULT_PATH = {
  currentRole: "Salesforce Administrator",
  futureRole: "Salesforce AI Administrator",
  currentStatus: "Evolving" as DisruptionRadarStatus,
  futureStatus: "Stable" as DisruptionRadarStatus,
  transferability: 92,
  exampleRoles: ["Salesforce AI Administrator", "Agentforce Specialist", "Salesforce Automation Consultant"],
  defaultCurrentRole: "Salesforce Administrator",
  defaultTargetRole: "Salesforce AI Administrator",
};

type TransitionPath = typeof DEFAULT_PATH;

const WHAT_IS_ITEMS = [
  { icon: "target" as const, color: colors.accentPurple, text: "Find future roles that fit your experience" },
  { icon: "cycle" as const, color: colors.success, text: "See which skills transfer and which gaps to close" },
  { icon: "brain" as const, color: colors.warning, text: "Discover opportunities created by AI and emerging technologies" },
  { icon: "chart" as const, color: colors.accent, text: "Navigate your career change with clarity and confidence" },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    color: colors.accentPurple,
    title: "Identify Your Best Future Roles",
    body: "We analyze your current role, skills, industry experience, and goals to recommend the best-fit future roles.",
  },
  {
    step: 2,
    color: colors.success,
    title: "Understand Skill Gaps",
    body: "Discover skills you already have, skills becoming more important, and areas to strengthen.",
  },
  {
    step: 3,
    color: colors.accent,
    title: "Build an AI-Era Career Plan",
    body: "Get a personalized plan to prioritize learning, track progress, and adapt as technology changes.",
  },
];

function statusTone(status: DisruptionRadarStatus): string {
  if (status === "Stable") return colors.success;
  if (status === "At Risk") return colors.danger;
  return colors.warning;
}

function buildPathFromScan(scan: StoredScan): TransitionPath {
  const page = buildDisruptionRadarPageModel(scan.result);
  const recommendations = normalizeCareerRecommendations(scan.result.initialRoleRecommendations);
  const top = recommendations[0];
  const exampleRoles = recommendations.slice(0, 3).map((item) => item.role);

  return {
    currentRole: page.currentRole.title,
    futureRole: page.targetRole.title,
    currentStatus: page.currentRole.status,
    futureStatus: page.targetRole.status,
    transferability: top?.transferabilityScore ?? 85,
    exampleRoles: exampleRoles.length > 0 ? exampleRoles : DEFAULT_PATH.exampleRoles,
    defaultCurrentRole: scan.result.identifiedCareerProfile ?? scan.result.currentRole,
    defaultTargetRole: scan.result.targetRole,
  };
}

function BetaBadge() {
  return (
    <View style={styles.betaBadge}>
      <Text style={styles.betaText}>BETA</Text>
    </View>
  );
}

function PathCard({
  currentRole,
  futureRole,
  currentStatus,
  futureStatus,
  transferability,
}: {
  currentRole: string;
  futureRole: string;
  currentStatus: DisruptionRadarStatus;
  futureStatus: DisruptionRadarStatus;
  transferability: number;
}) {
  return (
    <View style={styles.pathCard}>
      <View style={styles.pathRow}>
        <View style={styles.pathSide}>
          <View style={[styles.pathIcon, { backgroundColor: `${colors.accent}22` }]}>
            <BriefcaseIcon color={colors.accent} />
          </View>
          <Text style={[styles.pathLabel, { color: colors.accent }]}>Current Role</Text>
          <Text style={styles.pathRole} numberOfLines={2}>
            {currentRole}
          </Text>
          <Text style={[styles.pathStatus, { color: statusTone(currentStatus) }]}>{currentStatus}</Text>
        </View>

        <LinearGradient
          colors={[colors.accentPurple, colors.accentGold]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.pathArrow}
        >
          <Text style={styles.pathArrowText}>→</Text>
        </LinearGradient>

        <View style={styles.pathSide}>
          <View style={[styles.pathIcon, { backgroundColor: `${colors.success}22` }]}>
            <StarIcon color={colors.success} />
          </View>
          <Text style={[styles.pathLabel, { color: colors.success }]}>Potential Future Role</Text>
          <Text style={styles.pathRole} numberOfLines={2}>
            {futureRole}
          </Text>
          <Text style={[styles.pathStatus, { color: statusTone(futureStatus) }]}>{futureStatus}</Text>
          <Text style={styles.transferability}>Transferability: {transferability}%</Text>
        </View>
      </View>
      <Text style={styles.pathFooter}>Future Trace helps identify realistic career pathways in the AI era.</Text>
    </View>
  );
}

function WhatIsGrid() {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>What is AI Career Transition?</Text>
      <View style={styles.whatGrid}>
        {WHAT_IS_ITEMS.map((item) => (
          <View key={item.text} style={styles.whatItem}>
            <WhatIsIcon type={item.icon} color={item.color} />
            <Text style={styles.whatText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function HowItWorksSection() {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>How It Will Work</Text>
      {HOW_IT_WORKS.map((step) => (
        <View key={step.step} style={styles.stepCard}>
          <View style={[styles.stepBadge, { backgroundColor: `${step.color}22`, borderColor: `${step.color}55` }]}>
            <Text style={[styles.stepNumber, { color: step.color }]}>{step.step}</Text>
          </View>
          <View style={styles.stepTextWrap}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepBody}>{step.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function ExampleSection({ currentRole, exampleRoles }: { currentRole: string; exampleRoles: string[] }) {
  return (
    <View style={styles.splitRow}>
      <View style={[styles.sectionCard, styles.splitCard]}>
        <Text style={styles.sectionTitle}>Example Transition</Text>
        <Text style={styles.exampleFrom}>{currentRole}</Text>
        <Text style={styles.exampleArrow}>↓</Text>
        <Text style={styles.exampleLabel}>Potential Future Roles</Text>
        {exampleRoles.map((role) => (
          <View key={role} style={styles.exampleRoleRow}>
            <View style={styles.exampleDot} />
            <Text style={styles.exampleRole}>{role}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.sectionCard, styles.splitCard, styles.whyCard]}>
        <View style={styles.whyHeader}>
          <BulbIcon color={colors.accentPurple} />
          <Text style={styles.sectionTitle}>Why It Matters</Text>
        </View>
        <Text style={styles.whyBody}>
          AI is changing how work gets done across industries. Future Trace helps you understand where your experience
          still matters, which skills to build next, and how to move toward roles with stronger long-term durability.
        </Text>
      </View>
    </View>
  );
}

function BriefcaseIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={7} width={18} height={13} rx={2} stroke={color} strokeWidth={2} />
      <Path d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function StarIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3.5 14.6 9l6 .5-4.6 3.8 1.4 6.2L12 16.8 6.6 19.5 8 13.3 3.4 9.5l6-.5L12 3.5z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

function BulbIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18h6M10 22h4M12 3a6 6 0 0 0-3 11v2h6v-2a6 6 0 0 0-3-11z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

function WhatIsIcon({ type, color }: { type: "target" | "cycle" | "brain" | "chart"; color: string }) {
  if (type === "target") {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={2} />
        <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
      </Svg>
    );
  }
  if (type === "cycle") {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M17 2v4h4M7 22v-4H3M20 12a8 8 0 0 0-14-5.3M4 12a8 8 0 0 0 14 5.3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }
  if (type === "brain") {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M8 6a3 3 0 0 0-3 3v1a2 2 0 0 0 0 4v1a3 3 0 0 0 3 3M16 6a3 3 0 0 1 3 3v1a2 2 0 0 1 0 4v1a3 3 0 0 1-3 3M12 5v14" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 18V6M4 18h16M8 14l3-3 3 2 5-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CareerTransitionScreen() {
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const [path, setPath] = useState<TransitionPath>(DEFAULT_PATH);

  useFocusEffect(
    useCallback(() => {
      getLatestScan().then((scan) => {
        setPath(scan ? buildPathFromScan(scan) : DEFAULT_PATH);
      });
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.topBar, { paddingTop: spacing.xs }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={({ pressed }) => [pressed && styles.pressed]}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <View style={styles.titleRow}>
          <Text style={styles.navTitle}>AI Career Transition</Text>
          <BetaBadge />
        </View>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>
            Move from where you are today to where you'll be{" "}
            <Text style={styles.heroAccent}>most valuable tomorrow.</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Future Trace will help you discover the best-fit future roles, understand skill gaps, and plan your
            transition with confidence.
          </Text>
        </View>

        <PathCard
          currentRole={path.currentRole}
          futureRole={path.futureRole}
          currentStatus={path.currentStatus}
          futureStatus={path.futureStatus}
          transferability={path.transferability}
        />

        <WhatIsGrid />
        <HowItWorksSection />
        <ExampleSection currentRole={path.currentRole} exampleRoles={path.exampleRoles} />

        <EarlyAccessSignupCard
          title="Join Early Access"
          body="Be among the first to access AI Career Transition when it launches."
          source="ios_app_transition"
          defaultCurrentRole={path.defaultCurrentRole}
          defaultTargetRole={path.defaultTargetRole}
        />

        <Text style={styles.footerNote}>{AI_DISCLAIMER}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backText: { color: colors.accent, fontSize: 16, fontWeight: "600", minWidth: 72 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  navTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  topBarSpacer: { minWidth: 72 },
  betaBadge: {
    backgroundColor: `${colors.accentPurple}33`,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: `${colors.accentPurple}66`,
  },
  betaText: { color: colors.accentPurple, fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  pressed: { opacity: 0.85 },

  heroCopy: { marginTop: spacing.xs },
  heroTitle: { color: colors.text, fontSize: 22, fontWeight: "800", lineHeight: 30 },
  heroAccent: { color: colors.accentPurple },
  heroSubtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.sm },

  pathCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  pathRow: { flexDirection: "row", alignItems: "stretch", gap: spacing.sm },
  pathSide: { flex: 1, alignItems: "center" },
  pathIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pathLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase", marginTop: spacing.sm },
  pathRole: { color: colors.text, fontSize: 12, fontWeight: "700", textAlign: "center", marginTop: 4, lineHeight: 16, minHeight: 32 },
  pathStatus: { fontSize: 11, fontWeight: "700", marginTop: 4 },
  transferability: { color: colors.success, fontSize: 10, fontWeight: "700", marginTop: 4, textAlign: "center" },
  pathArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  pathArrowText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  pathFooter: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },

  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  whatGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  whatItem: { width: "47%", gap: spacing.sm },
  whatText: { color: colors.muted, fontSize: 12, lineHeight: 17 },

  stepCard: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: { fontSize: 13, fontWeight: "800" },
  stepTextWrap: { flex: 1 },
  stepTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  stepBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },

  splitRow: { flexDirection: "row", gap: spacing.sm, alignItems: "stretch" },
  splitCard: { flex: 1 },
  whyCard: { backgroundColor: `${colors.accentPurple}12`, borderColor: `${colors.accentPurple}33` },
  whyHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  whyBody: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  exampleFrom: { color: colors.text, fontSize: 13, fontWeight: "700" },
  exampleArrow: { color: colors.muted, fontSize: 16, textAlign: "center", marginVertical: 4 },
  exampleLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  exampleRoleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginTop: 6 },
  exampleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginTop: 6 },
  exampleRole: { flex: 1, color: colors.success, fontSize: 12, lineHeight: 17, fontWeight: "600" },

  footerNote: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
});
