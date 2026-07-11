import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { Linking, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import {
  buildDisruptionRadarBrief,
  formatExposureLevelDisplay,
  formatExposureHelpAlert,
  formatDisruptionRadarHelpAlert,
  formatResilienceHelpAlert,
  type DisruptionRadarStatus,
  type StoredScan,
} from "../../lib/shared";
import { PRIVACY_POLICY_HTML, TERMS_HTML } from "../../lib/shared/legal/content";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { Subtitle, Title } from "../components/ui";
import { getLatestScan, getScanCount } from "../lib/scanStorage";
import { supportMailtoUrl } from "../lib/support";
import { useAppNavigation } from "../navigation/hooks";

function formatScanDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function resilienceLabel(score: number): { text: string; tone: string } {
  if (score >= 70) return { text: "Strong", tone: colors.success };
  if (score >= 55) return { text: "Steady", tone: colors.accent };
  return { text: "Building", tone: colors.warning };
}

function radarSubtitle(status: DisruptionRadarStatus): string {
  if (status === "Stable") return "Lower pressure";
  if (status === "At Risk") return "Elevated exposure";
  return "Some parts changing";
}

function radarTone(status: DisruptionRadarStatus): string {
  if (status === "Stable") return colors.success;
  if (status === "At Risk") return colors.danger;
  return colors.warning;
}

function exposureSubtitle(level: string): string {
  if (level === "Low") return "Lower automation pressure";
  if (level === "High") return "Higher automation pressure";
  return "Balanced impact";
}

function exposureTone(level: string): string {
  if (level === "Low") return colors.success;
  if (level === "High") return colors.danger;
  return colors.accent;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>{icon}</View>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${clamped}%`, backgroundColor: color }]} />
    </View>
  );
}

function SegmentedBar({ filled, total, color }: { filled: number; total: number; color: string }) {
  return (
    <View style={styles.segmentRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.segment, { backgroundColor: i < filled ? color : colors.border }]}
        />
      ))}
    </View>
  );
}

function ListRow({
  icon,
  label,
  value,
  subtitle,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const content = (
    <>
      <View style={[styles.listIconWrap, danger && styles.listIconWrapDanger]}>{icon}</View>
      <View style={styles.listTextWrap}>
        <Text style={[styles.listLabel, danger && styles.listLabelDanger]}>{label}</Text>
        {subtitle ? <Text style={styles.listSubtitle}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.listValue}>{value}</Text> : null}
      {onPress ? <Text style={styles.listChevron}>›</Text> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.listRow}>{content}</View>;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

function ChartIcon({ color = colors.accentPurple }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 19V5M4 19h16M8 16V11M12 16V8M16 16V13" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function BriefcaseIcon({ color = colors.accentPurple }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={7} width={18} height={13} rx={2} stroke={color} strokeWidth={2} />
      <Path d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function CalendarIcon({ color = colors.accentPurple }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={16} rx={2} stroke={color} strokeWidth={2} />
      <Path d="M8 3v4M16 3v4M3 10h18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ShieldIcon({ color = colors.success }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3 20 7v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RadarIcon({ color = colors.warning }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path d="M12 12 18 8M12 12V19" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ExposureIcon({ color = colors.accent }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v18M3 8h18M3 16h18" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={8} cy={8} r={2} fill={color} />
      <Circle cx={16} cy={16} r={2} fill={color} />
    </Svg>
  );
}

function ClockIcon({ color = colors.accentPurple }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function RocketIcon({ color = colors.accentPurple }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3c3 4 4 8 4 12a4 4 0 0 1-8 0c0-4 1-8 4-12z" stroke={color} strokeWidth={2} />
      <Circle cx={12} cy={11} r={2} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function LegalIcon({ color = colors.accentPurple }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v18M7 7h10M7 12h10M7 17h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function SupportIcon({ color = colors.accentPurple }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 14a8 8 0 1 1 16 0v2a2 2 0 0 1-2 2h-1v-4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Rect x={5} y={16} width={4} height={4} rx={1} stroke={color} strokeWidth={2} />
      <Rect x={15} y={16} width={4} height={4} rx={1} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function DatabaseIcon({ color = colors.accentPurple }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Ellipse cx={12} cy={6} rx={8} ry={3} stroke={color} strokeWidth={2} />
      <Path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" stroke={color} strokeWidth={2} />
      <Path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function TrashIcon({ color = colors.danger }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function MailIcon({ color = colors.accentPurple }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={2} stroke={color} strokeWidth={2} />
      <Path d="m3 7 9 6 9-6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function DocumentIcon({ color = colors.accentPurple }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M8 3h8l4 4v14H8V3z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M16 3v4h4M10 12h6M10 16h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ResilienceHelpButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="What is Career Resilience Score?"
      hitSlop={8}
      onPress={() => {
        const { title, message } = formatResilienceHelpAlert();
        Alert.alert(title, message);
      }}
      style={styles.helpBtn}
    >
      <Text style={styles.helpBtnText}>?</Text>
    </Pressable>
  );
}

function ExposureHelpButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="What is AI Exposure Level?"
      hitSlop={8}
      onPress={() => {
        const { title, message } = formatExposureHelpAlert();
        Alert.alert(title, message);
      }}
      style={styles.helpBtn}
    >
      <Text style={styles.helpBtnText}>?</Text>
    </Pressable>
  );
}

function DisruptionRadarHelpButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="What is AI Disruption Radar?"
      hitSlop={8}
      onPress={() => {
        const { title, message } = formatDisruptionRadarHelpAlert();
        Alert.alert(title, message);
      }}
      style={styles.helpBtn}
    >
      <Text style={styles.helpBtnText}>?</Text>
    </Pressable>
  );
}

function CareerSnapshotCard({ scan }: { scan: StoredScan | null }) {
  if (!scan) {
    return (
      <SectionCard>
        <SectionHeader
          icon={<ChartIcon />}
          title="Your Career Snapshot"
          subtitle="Quick overview from your latest scan"
        />
        <Text style={styles.emptySnapshot}>Find your next roles to see your snapshot here.</Text>
      </SectionCard>
    );
  }

  const profile = scan.result.currentRoleProfile;
  const resilience = profile.resilienceScore;
  const resilienceMeta = resilienceLabel(resilience);
  const exposure = formatExposureLevelDisplay(profile.aiExposureLevel);
  const exposureColor = exposureTone(exposure);
  const radar = buildDisruptionRadarBrief(scan.result);
  const radarColor = radarTone(radar.status);
  const radarSegments = radar.status === "Stable" ? 5 : radar.status === "Evolving" ? 3 : 1;

  return (
    <SectionCard>
      <SectionHeader
        icon={<ChartIcon />}
        title="Your Career Snapshot"
        subtitle="Quick overview from your latest scan"
      />

      <View style={styles.snapshotMetaRow}>
        <View style={styles.snapshotMetaItem}>
          <BriefcaseIcon />
          <View style={styles.snapshotMetaText}>
            <Text style={styles.snapshotMetaLabel}>Current Role</Text>
            <Text style={styles.snapshotMetaValue} numberOfLines={2}>
              {scan.result.identifiedCareerProfile ?? scan.result.currentRole}
            </Text>
          </View>
        </View>
        <View style={styles.snapshotMetaItem}>
          <CalendarIcon color={colors.accent} />
          <View style={styles.snapshotMetaText}>
            <Text style={styles.snapshotMetaLabel}>Last Scan Date</Text>
            <Text style={styles.snapshotMetaValue}>{formatScanDate(scan.createdAt)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <ShieldIcon color={resilienceMeta.tone} />
          <View style={styles.metricLabelRow}>
            <Text style={styles.metricCardLabel}>Career Resilience Score</Text>
            <ResilienceHelpButton />
          </View>
          <Text style={styles.metricCardValue}>
            {resilience}
            <Text style={styles.metricCardSuffix}> / 100</Text>
          </Text>
          <Text style={[styles.metricCardStatus, { color: resilienceMeta.tone }]}>{resilienceMeta.text}</Text>
          <ProgressBar value={resilience} color={resilienceMeta.tone} />
        </View>

        <View style={styles.metricCard}>
          <RadarIcon color={radarColor} />
          <View style={styles.metricLabelRow}>
            <Text style={styles.metricCardLabel}>AI Disruption Radar</Text>
            <DisruptionRadarHelpButton />
          </View>
          <Text style={[styles.metricCardValue, { color: radarColor }]}>{radar.status}</Text>
          <Text style={styles.metricCardHint}>{radarSubtitle(radar.status)}</Text>
          <SegmentedBar filled={radarSegments} total={5} color={radarColor} />
        </View>

        <View style={styles.metricCard}>
          <ExposureIcon color={exposureColor} />
          <View style={styles.metricLabelRow}>
            <Text style={styles.metricCardLabel}>AI Exposure Level</Text>
            <ExposureHelpButton />
          </View>
          <Text style={[styles.metricCardValue, { color: exposureColor }]}>{exposure}</Text>
          <Text style={styles.metricCardHint}>{exposureSubtitle(exposure)}</Text>
          <ProgressBar
            value={profile.aiExposureScore ?? (exposure === "High" ? 76 : exposure === "Low" ? 32 : 55)}
            color={exposureColor}
          />
        </View>
      </View>
    </SectionCard>
  );
}

export function SettingsScreen() {
  const navigation = useAppNavigation();
  const [latestScan, setLatestScan] = useState<StoredScan | null>(null);
  const [scanCount, setScanCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getLatestScan().then(setLatestScan);
      getScanCount().then(setScanCount);
    }, [])
  );

  async function openContactSupport() {
    const url = supportMailtoUrl();
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    }
  }

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Title>Settings</Title>
        <Subtitle>Manage your app preferences and account settings</Subtitle>

        <CareerSnapshotCard scan={latestScan} />

        <SectionCard>
          <SectionHeader icon={<ClockIcon />} title="Your Activity" />
          <ListRow
            icon={<ChartIcon color={colors.accentPurple} />}
            label="Total Career Scans"
            value={String(scanCount)}
            onPress={() => navigation.navigate("ScanHistory")}
          />
          <View style={styles.listDivider} />
          <ListRow
            icon={<CalendarIcon color={colors.accent} />}
            label="Last Scan"
            value={latestScan ? latestScan.result.currentRole : "—"}
            onPress={
              latestScan
                ? () => navigation.navigate("ScanResults", { scanId: latestScan.id })
                : undefined
            }
          />
          <View style={styles.listDivider} />
          <ListRow
            icon={<CalendarIcon color={colors.success} />}
            label="Last Scan Date"
            value={latestScan ? formatScanDate(latestScan.createdAt) : "—"}
            onPress={() => navigation.navigate("ScanHistory")}
          />
        </SectionCard>

        <SectionCard>
          <SectionHeader icon={<RocketIcon />} title="Early Access" />
          <View style={styles.earlyAccessRow}>
            <View style={styles.earlyAccessCopy}>
              <Text style={styles.earlyAccessTitle}>Join Future Trace Early Access</Text>
              <Text style={styles.earlyAccessSubtitle}>
                Be the first to access new features and insights.
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate("Waitlist")}
              style={({ pressed }) => [styles.joinBtnWrap, pressed && styles.pressed]}
            >
              <LinearGradient
                colors={[colors.accentPurple, colors.accentGold]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.joinBtn}
              >
                <Text style={styles.joinBtnText}>Join Now</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </SectionCard>

        <SectionCard>
          <SectionHeader icon={<LegalIcon />} title="Legal" />
          <ListRow
            icon={<ShieldIcon color={colors.accentPurple} />}
            label="Privacy Policy"
            onPress={() =>
              navigation.navigate("LegalWebView", {
                title: "Privacy Policy",
                html: PRIVACY_POLICY_HTML,
                returnTab: "Settings",
              })
            }
          />
          <View style={styles.listDivider} />
          <ListRow
            icon={<DocumentIcon />}
            label="Terms of Use"
            onPress={() =>
              navigation.navigate("LegalWebView", {
                title: "Terms of Service",
                html: TERMS_HTML,
                returnTab: "Settings",
              })
            }
          />
        </SectionCard>

        <SectionCard>
          <SectionHeader icon={<SupportIcon />} title="Support" />
          <ListRow
            icon={<MailIcon />}
            label="Contact Support"
            subtitle="We're here to help"
            onPress={() => void openContactSupport()}
          />
        </SectionCard>

        <SectionCard>
          <SectionHeader icon={<DatabaseIcon />} title="Data" />
          <ListRow
            icon={<TrashIcon />}
            label="Delete Local Data"
            subtitle="Remove all scan history and local data from this device"
            onPress={() => navigation.navigate("DeleteData", { returnTab: "Settings" })}
            danger
          />
        </SectionCard>

        <View style={styles.footer}>
          <Text style={styles.footerVersion}>Future Trace v{appVersion}</Text>
          <Text style={styles.footerTagline}>Building clarity for your career future.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  pressed: { opacity: 0.85 },

  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.accentPurple}22`,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2, lineHeight: 17 },

  emptySnapshot: { color: colors.muted, fontSize: 14, lineHeight: 21 },

  snapshotMetaRow: { gap: spacing.md, marginBottom: spacing.md },
  snapshotMetaItem: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  snapshotMetaText: { flex: 1 },
  snapshotMetaLabel: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  snapshotMetaValue: { color: colors.text, fontSize: 14, fontWeight: "600", marginTop: 2 },

  metricsGrid: { gap: spacing.sm },
  metricCard: {
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  metricCardLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.sm,
  },
  helpBtn: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.elevated,
  },
  helpBtnText: { color: colors.muted, fontSize: 9, fontWeight: "700", lineHeight: 11 },
  metricCardValue: { color: colors.text, fontSize: 22, fontWeight: "700", marginTop: 4 },
  metricCardSuffix: { color: colors.muted, fontSize: 14, fontWeight: "400" },
  metricCardStatus: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  metricCardHint: { color: colors.muted, fontSize: 11, marginTop: 2, marginBottom: spacing.sm },

  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: "hidden",
    marginTop: spacing.xs,
  },
  progressFill: { height: "100%", borderRadius: 2 },
  segmentRow: { flexDirection: "row", gap: 4, marginTop: spacing.xs },
  segment: { flex: 1, height: 4, borderRadius: 2 },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  listDivider: { height: 1, backgroundColor: colors.border },
  listIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.accentPurple}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  listIconWrapDanger: { backgroundColor: `${colors.danger}18` },
  listTextWrap: { flex: 1 },
  listLabel: { color: colors.text, fontSize: 14, fontWeight: "600" },
  listLabelDanger: { color: colors.danger },
  listSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  listValue: { color: colors.muted, fontSize: 13, fontWeight: "600", maxWidth: "38%", textAlign: "right" },
  listChevron: { color: colors.muted, fontSize: 22, lineHeight: 22, fontWeight: "300" },

  earlyAccessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  earlyAccessCopy: { flex: 1 },
  earlyAccessTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  earlyAccessSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  joinBtnWrap: { borderRadius: radius.pill, overflow: "hidden" },
  joinBtn: { paddingHorizontal: spacing.lg, paddingVertical: 10 },
  joinBtnText: { color: colors.text, fontSize: 13, fontWeight: "700" },

  footer: { alignItems: "center", paddingTop: spacing.md, paddingBottom: spacing.sm },
  footerVersion: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  footerTagline: { color: colors.muted, fontSize: 11, marginTop: 4, textAlign: "center" },
});
