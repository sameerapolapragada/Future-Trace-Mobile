import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import {
  buildDisruptionRadarPageModel,
  CAREER_ANALYSIS_SOURCE,
  DISRUPTION_LEVEL_LEGEND,
  formatDisruptionRadarHelpAlert,
  SCAN_RESULTS_NOTE,
  type DisruptionRadarPageModel,
  type DisruptionRadarRoleCard,
  type DisruptionRadarStatus,
  type StoredScan,
} from "../../lib/shared";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { Field, PrimaryButton, Subtitle, Title } from "../components/ui";
import { getLatestScan, getWaitlistDraft, getWaitlistEmail, setWaitlistDraft, setWaitlistEmail } from "../lib/scanStorage";
import { submitWaitlistEntrySafe } from "../lib/waitlistService";
import { useAppNavigation } from "../navigation/hooks";

function radarTone(status: DisruptionRadarStatus): string {
  if (status === "Stable") return colors.success;
  if (status === "At Risk") return colors.danger;
  return colors.warning;
}

function InfoHelpButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="What is AI Disruption Radar?"
      hitSlop={8}
      onPress={() => {
        const { title, message } = formatDisruptionRadarHelpAlert();
        Alert.alert(title, message);
      }}
      style={styles.infoBtn}
    >
      <Text style={styles.infoBtnText}>i</Text>
    </Pressable>
  );
}

function StatusHelpButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="What do disruption levels mean?"
      hitSlop={6}
      onPress={() => {
        Alert.alert(
          "Disruption levels",
          DISRUPTION_LEVEL_LEGEND.map((item) => `${item.status}: ${item.description}`).join("\n\n")
        );
      }}
      style={styles.statusHelpBtn}
    >
      <Text style={styles.statusHelpBtnText}>?</Text>
    </Pressable>
  );
}

function LevelIcon({ status, color }: { status: DisruptionRadarStatus; color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={2} />
      {status === "Evolving" ? (
        <Path d="M12 8v4l2.5 2.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      ) : (
        <Circle cx={12} cy={12} r={2.5} fill={color} />
      )}
    </Svg>
  );
}

function BriefcaseIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={7} width={18} height={13} rx={2} stroke={color} strokeWidth={2} />
      <Path d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function StarIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5 14.6 9l6 .5-4.6 3.8 1.4 6.2L12 16.8 6.6 19.5 8 13.3 3.4 9.5l6-.5L12 3.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SparkIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3 20 7v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

function TrendIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M4 18V6M4 18h16M8 14l3-3 3 2 5-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrophyIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M8 4h8v3a4 4 0 0 1-8 0V4zM6 4H4v2a3 3 0 0 0 3 3M18 4h2v2a3 3 0 0 1-3 3M12 11v3M9 20h6M10 14h4v3a2 2 0 0 1-4 0v-3z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

function RocketIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 14c3-2 5-5 5-9-4 0-7 2-9 5 1 3 2 5 4 4z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M9 15 6 18M15 15l3 3M10 10l-2 4 4-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke={color} strokeWidth={2} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function LegendCard() {
  return (
    <View style={styles.legendCard}>
      <Text style={styles.legendTitle}>What do the disruption levels mean?</Text>
      {DISRUPTION_LEVEL_LEGEND.map((item) => (
        <View key={item.status} style={styles.legendRow}>
          <LevelIcon status={item.status} color={radarTone(item.status)} />
          <View style={styles.legendTextWrap}>
            <Text style={[styles.legendStatus, { color: radarTone(item.status) }]}>{item.status}</Text>
            <Text style={styles.legendDescription}>{item.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function StatusBadge({ status }: { status: DisruptionRadarStatus }) {
  const tone = radarTone(status);
  return (
    <View style={styles.statusRow}>
      <LevelIcon status={status} color={tone} />
      <Text style={[styles.statusLabel, { color: tone }]}>{status}</Text>
      <StatusHelpButton />
    </View>
  );
}

function RoleCard({
  variant,
  card,
  onViewAnalysis,
}: {
  variant: "current" | "target";
  card: DisruptionRadarRoleCard;
  onViewAnalysis: () => void;
}) {
  const isCurrent = variant === "current";
  const accent = isCurrent ? colors.accent : colors.success;
  const badgeLabel = isCurrent ? "CURRENT ROLE" : "TARGET ROLE";
  const linkColor = isCurrent ? colors.accent : colors.success;
  const primaryIconColor = isCurrent ? colors.warning : colors.success;
  const secondaryIconColor = isCurrent ? colors.accent : colors.success;

  return (
    <View style={[styles.roleCard, isCurrent ? styles.roleCardCurrent : styles.roleCardFuture]}>
      <View style={[styles.roleBadge, { backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}>
        <Text style={[styles.roleBadgeText, { color: accent }]}>{badgeLabel}</Text>
      </View>

      <View style={styles.roleIconWrap}>
        {isCurrent ? <BriefcaseIcon color={accent} /> : <StarIcon color={accent} />}
      </View>

      <Text style={styles.roleTitle} numberOfLines={3}>
        {card.title}
      </Text>

      <StatusBadge status={card.status} />
      <Text style={styles.roleSummary}>{card.summary}</Text>

      <View style={styles.detailBlock}>
        <View style={styles.detailRow}>
          {isCurrent ? <SparkIcon color={primaryIconColor} /> : <TrendIcon color={primaryIconColor} />}
          <View style={styles.detailTextWrap}>
            <Text style={styles.detailLabel}>{card.detailPrimaryLabel}</Text>
            <Text style={styles.detailText}>{card.detailPrimary}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          {isCurrent ? <ShieldIcon color={secondaryIconColor} /> : <TrophyIcon color={secondaryIconColor} />}
          <View style={styles.detailTextWrap}>
            <Text style={styles.detailLabel}>{card.detailSecondaryLabel}</Text>
            <Text style={styles.detailText}>{card.detailSecondary}</Text>
          </View>
        </View>
      </View>

      <Pressable onPress={onViewAnalysis} hitSlop={8} style={({ pressed }) => [styles.viewLinkWrap, pressed && styles.pressed]}>
        <Text style={[styles.viewLink, { color: linkColor }]}>View full analysis ›</Text>
      </Pressable>
    </View>
  );
}

function EarlyAccessCard({ scan }: { scan: StoredScan }) {
  const [email, setEmail] = useState("");
  const [currentRole, setCurrentRole] = useState(
    scan.result.identifiedCareerProfile ?? scan.result.currentRole
  );
  const [targetRole, setTargetRole] = useState(scan.result.targetRole);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getWaitlistDraft().then((draft) => {
        if (draft) {
          if (draft.email) setEmail(draft.email);
          if (draft.currentRole) setCurrentRole(draft.currentRole);
          if (draft.targetRole) setTargetRole(draft.targetRole);
          return;
        }
        getWaitlistEmail().then((saved) => {
          if (saved) setEmail(saved);
        });
      });
    }, [])
  );

  async function persistDraft(next?: { email?: string; currentRole?: string; targetRole?: string }) {
    await setWaitlistDraft({
      email: next?.email ?? email,
      currentRole: next?.currentRole ?? currentRole,
      targetRole: next?.targetRole ?? targetRole,
    });
  }

  async function onJoin() {
    setLoading(true);
    setNotice(null);

    const draft = { email, currentRole, targetRole };
    await setWaitlistDraft(draft);

    const result = await submitWaitlistEntrySafe({
      email,
      currentRole,
      targetRole,
      source: "ios_app_radar",
    });

    if (result.ok) {
      await setWaitlistEmail(email);
      setNotice("You're on the Early Access list. We'll notify you when Career X-Ray launches.");
    } else {
      if (email) await setWaitlistEmail(email);
      setNotice(result.message);
    }

    setLoading(false);
  }

  return (
    <View style={styles.earlyAccessCard}>
      <View style={styles.earlyAccessHeader}>
        <View style={styles.earlyAccessIconWrap}>
          <RocketIcon color={colors.accentPurple} />
        </View>
        <View style={styles.earlyAccessHeaderText}>
          <Text style={styles.earlyAccessTitle}>Join Career X-Ray Early Access</Text>
          <Text style={styles.earlyAccessBody}>
            Get notified when deeper career insights, skills gap analysis, and personalized roadmaps become available.
          </Text>
        </View>
      </View>

      <Field
        label="Email *"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          void persistDraft({ email: value });
        }}
        placeholder="Enter your email"
        keyboardType="email-address"
      />
      <Field
        label="Current role *"
        value={currentRole}
        onChangeText={(value) => {
          setCurrentRole(value);
          void persistDraft({ currentRole: value });
        }}
        placeholder="e.g. Salesforce Administrator"
      />
      <Field
        label="Target role *"
        value={targetRole}
        onChangeText={(value) => {
          setTargetRole(value);
          void persistDraft({ targetRole: value });
        }}
        placeholder="e.g. Salesforce AI Administrator"
      />

      <PrimaryButton label="Join Early Access" onPress={onJoin} loading={loading} compact />

      {notice ? <Text style={styles.earlyAccessNotice}>{notice}</Text> : null}

      <View style={styles.earlyAccessFooter}>
        <LockIcon color={colors.muted} />
        <Text style={styles.earlyAccessFooterText}>No spam. Unsubscribe anytime.</Text>
      </View>
    </View>
  );
}

export function DisruptionRadarScreen() {
  const navigation = useAppNavigation();
  const [scan, setScan] = useState<StoredScan | null>(null);
  const [page, setPage] = useState<DisruptionRadarPageModel | null>(null);

  useFocusEffect(
    useCallback(() => {
      getLatestScan().then((latest) => {
        if (!latest) {
          setScan(null);
          setPage(null);
          return;
        }
        setScan(latest);
        setPage(buildDisruptionRadarPageModel(latest.result));
      });
    }, [])
  );

  if (!scan || !page) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.emptyWrap}>
          <Title>AI Disruption Radar</Title>
          <Subtitle>Run a Career Scan first to generate an informational disruption snapshot.</Subtitle>
          <PrimaryButton label="Start Career Scan" onPress={() => navigation.navigate("Scan")} />
        </View>
      </SafeAreaView>
    );
  }

  function openFullAnalysis(focus: "current" | "target") {
    navigation.navigate("RoleDisruptionAnalysis", { scanId: scan.id, focus });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.pageTitle}>AI Disruption Radar</Text>
            <Text style={styles.pageSubtitle}>
              Understand how AI may impact your current role and the target role you entered.
            </Text>
          </View>
          <InfoHelpButton />
        </View>

        <LegendCard />

        <View style={styles.compareWrap}>
          <View style={styles.compareRow}>
            <RoleCard variant="current" card={page.currentRole} onViewAnalysis={() => openFullAnalysis("current")} />
            <RoleCard variant="target" card={page.targetRole} onViewAnalysis={() => openFullAnalysis("target")} />
          </View>
          <View style={styles.vsBadge}>
            <LinearGradient
              colors={[colors.accentPurple, colors.accentGold]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.vsBadgeInner}
            >
              <Text style={styles.vsBadgeText}>VS</Text>
            </LinearGradient>
          </View>
        </View>

        <EarlyAccessCard scan={scan} />

        <Text style={styles.footerSource}>{CAREER_ANALYSIS_SOURCE}</Text>
        <Text style={styles.footerNote}>{SCAN_RESULTS_NOTE}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  emptyWrap: { flex: 1, padding: spacing.lg, justifyContent: "center" },
  pressed: { opacity: 0.85 },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerTextWrap: { flex: 1 },
  pageTitle: { color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.3 },
  pageSubtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  infoBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${colors.accentPurple}66`,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.accentPurple}18`,
  },
  infoBtnText: { color: colors.accentPurple, fontSize: 13, fontWeight: "800", fontStyle: "italic" },

  legendCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  legendTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  legendRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  legendTextWrap: { flex: 1 },
  legendStatus: { fontSize: 13, fontWeight: "700" },
  legendDescription: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 2 },

  compareWrap: { position: "relative" },
  compareRow: { flexDirection: "row", gap: spacing.sm, alignItems: "stretch" },
  vsBadge: {
    position: "absolute",
    top: "42%",
    left: "50%",
    marginLeft: -18,
    zIndex: 2,
  },
  vsBadgeInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  vsBadgeText: { color: colors.text, fontSize: 11, fontWeight: "800" },

  roleCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 420,
  },
  roleCardCurrent: { borderColor: `${colors.accent}44` },
  roleCardFuture: { borderColor: `${colors.success}44` },
  roleBadge: {
    alignSelf: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  roleIconWrap: {
    alignSelf: "center",
    marginTop: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 19,
    minHeight: 57,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: spacing.sm,
  },
  statusLabel: { fontSize: 12, fontWeight: "700" },
  statusHelpBtn: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  statusHelpBtnText: { color: colors.muted, fontSize: 9, fontWeight: "700", lineHeight: 11 },
  roleSummary: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: spacing.sm,
    minHeight: 48,
  },
  detailBlock: { marginTop: spacing.md, gap: spacing.md, flex: 1 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  detailTextWrap: { flex: 1 },
  detailLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  detailText: { color: colors.text, fontSize: 11, lineHeight: 16, marginTop: 3 },
  viewLinkWrap: { alignSelf: "center", marginTop: spacing.md },
  viewLink: { fontSize: 12, fontWeight: "700" },

  earlyAccessCard: {
    backgroundColor: `${colors.accentPurple}14`,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.accentPurple}44`,
    padding: spacing.lg,
    gap: spacing.md,
  },
  earlyAccessHeader: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  earlyAccessIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.accentPurple}22`,
    alignItems: "center",
    justifyContent: "center",
  },
  earlyAccessHeaderText: { flex: 1 },
  earlyAccessTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  earlyAccessBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  earlyAccessNotice: { color: colors.success, fontSize: 12, lineHeight: 18 },
  earlyAccessFooter: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  earlyAccessFooterText: { color: colors.muted, fontSize: 11 },

  footerSource: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
  footerNote: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
});
