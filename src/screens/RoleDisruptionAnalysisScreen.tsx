import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import {
  buildRoleDisruptionAnalysis,
  ROLE_DISRUPTION_ANALYSIS_FOOTER,
  SCAN_RESULTS_NOTE,
  type DisruptionRadarStatus,
  type RoleDisruptionAnalysis,
  type RoleDisruptionAnalysisSection,
} from "../../lib/shared";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { getScan } from "../lib/scanStorage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "RoleDisruptionAnalysis">;

function radarTone(status: DisruptionRadarStatus): string {
  if (status === "Stable") return colors.success;
  if (status === "At Risk") return colors.danger;
  return colors.warning;
}

function DisruptionRing({ score, color }: { score: number; color: string }) {
  const size = 64;
  const stroke = 5;
  const radiusPx = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radiusPx;
  const clamped = Math.min(100, Math.max(0, score));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radiusPx}
        stroke={colors.border}
        strokeWidth={stroke}
        fill="none"
      />
      <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusPx}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

function BriefcaseIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={7} width={18} height={13} rx={2} stroke={color} strokeWidth={2} />
      <Path d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function StarIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5 14.6 9l6 .5-4.6 3.8 1.4 6.2L12 16.8 6.6 19.5 8 13.3 3.4 9.5l6-.5L12 3.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CardIcon({ variant }: { variant: "shield" | "spark" | "skills" | "trophy" | "outlook" }) {
  const tone =
    variant === "shield"
      ? colors.accent
      : variant === "spark"
        ? colors.warning
        : variant === "skills"
          ? colors.accentPurple
          : variant === "trophy"
            ? colors.success
            : colors.accent;

  if (variant === "shield") {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3 20 7v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" stroke={tone} strokeWidth={2} strokeLinejoin="round" />
      </Svg>
    );
  }
  if (variant === "spark") {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke={tone} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }
  if (variant === "skills") {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3 14 9h7l-5.5 4.2 2.1 6.8L12 16.8 6.4 20l2.1-6.8L3 9h7l2-6z" stroke={tone} strokeWidth={1.8} strokeLinejoin="round" />
      </Svg>
    );
  }
  if (variant === "trophy") {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M8 4h8v3a4 4 0 0 1-8 0V4zM6 4H4v2a3 3 0 0 0 3 3M18 4h2v2a3 3 0 0 1-3 3M12 11v3M9 20h6" stroke={tone} strokeWidth={1.8} strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 18V6M4 18h16M8 14l3-3 3 2 5-6" stroke={tone} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5 10 17.5 19 7.5" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AnalysisCard({
  icon,
  section,
  bulletColor,
}: {
  icon: "shield" | "spark" | "skills" | "trophy" | "outlook";
  section: RoleDisruptionAnalysisSection | { title: string; text: string };
  bulletColor?: string;
}) {
  const isOutlook = "text" in section;

  return (
    <View style={styles.analysisCard}>
      <View style={styles.analysisCardHeader}>
        <CardIcon variant={icon} />
        <Text style={styles.analysisCardTitle}>{section.title}</Text>
      </View>
      {!isOutlook && section.intro ? <Text style={styles.analysisCardIntro}>{section.intro}</Text> : null}
      {isOutlook ? (
        <Text style={styles.outlookText}>{section.text}</Text>
      ) : (
        section.bullets.map((bullet, index) => (
          <View key={`${section.title}-${index}`} style={styles.bulletRow}>
            <CheckIcon color={bulletColor ?? colors.accent} />
            <Text style={styles.bulletText}>{bullet}</Text>
          </View>
        ))
      )}
    </View>
  );
}

export function RoleDisruptionAnalysisScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { scanId, focus } = route.params;
  const [analysis, setAnalysis] = useState<RoleDisruptionAnalysis | null>(null);

  useEffect(() => {
    getScan(scanId).then((scan) => {
      if (!scan) {
        setAnalysis(null);
        return;
      }
      setAnalysis(buildRoleDisruptionAnalysis(scan.result, focus));
    });
  }, [focus, scanId]);

  if (!analysis) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading analysis…</Text>
        </View>
      </View>
    );
  }

  const tone = radarTone(analysis.status);
  const roleAccent = focus === "target" ? colors.success : colors.accent;

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
        <Text style={styles.navTitle}>AI Disruption Analysis</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.roleBadge, { backgroundColor: `${roleAccent}22`, borderColor: `${roleAccent}55` }]}>
          <Text style={[styles.roleBadgeText, { color: roleAccent }]}>{analysis.roleLabel.toUpperCase()}</Text>
        </View>

        <View style={styles.roleHeader}>
          <View style={styles.roleIconWrap}>
            {focus === "target" ? <StarIcon color={roleAccent} /> : <BriefcaseIcon color={roleAccent} />}
          </View>
          <Text style={styles.roleTitle}>{analysis.roleTitle}</Text>
        </View>

        <View style={styles.levelCard}>
          <Text style={styles.levelLabel}>Disruption Level</Text>
          <View style={styles.levelRow}>
            <DisruptionRing score={analysis.resilienceScore} color={tone} />
            <View style={styles.levelTextWrap}>
              <Text style={[styles.levelStatus, { color: tone }]}>{analysis.status}</Text>
              <Text style={styles.levelSummary}>{analysis.statusSummary}</Text>
            </View>
          </View>
        </View>

        <AnalysisCard icon="shield" section={analysis.whyThisStatus} bulletColor={tone} />
        <AnalysisCard icon="spark" section={analysis.durableValue} bulletColor={roleAccent} />
        <AnalysisCard icon="skills" section={analysis.skillsBecomingImportant} bulletColor={colors.accentPurple} />
        <AnalysisCard icon="trophy" section={analysis.keyOpportunity} bulletColor={colors.success} />
        <AnalysisCard
          icon="outlook"
          section={{ title: "Outlook", text: analysis.outlook }}
        />

        <Text style={styles.footerSource}>{ROLE_DISRUPTION_ANALYSIS_FOOTER}</Text>
        <Text style={styles.footerNote}>{SCAN_RESULTS_NOTE}</Text>
      </ScrollView>
    </View>
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
  backBtn: { minWidth: 72 },
  backText: { color: colors.accent, fontSize: 16, fontWeight: "600" },
  navTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  topBarSpacer: { minWidth: 72 },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.muted, fontSize: 14 },
  pressed: { opacity: 0.85 },

  roleBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: spacing.xs,
  },
  roleBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  roleHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.md },
  roleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTitle: { flex: 1, color: colors.text, fontSize: 24, fontWeight: "800", lineHeight: 30 },

  levelCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  levelLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  levelRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginTop: spacing.md },
  levelTextWrap: { flex: 1 },
  levelStatus: { fontSize: 28, fontWeight: "800" },
  levelSummary: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 4 },

  analysisCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  analysisCardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  analysisCardTitle: { color: colors.text, fontSize: 16, fontWeight: "700", flex: 1 },
  analysisCardIntro: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginTop: spacing.md },
  bulletText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 21 },
  outlookText: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: spacing.sm },

  footerSource: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: spacing.sm },
  footerNote: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
});
