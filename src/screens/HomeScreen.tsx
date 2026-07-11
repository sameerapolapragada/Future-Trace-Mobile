import { LinearGradient } from "expo-linear-gradient";
import { useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import LogoMark from "../../components/LogoMark";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { useAppNavigation } from "../navigation/hooks";

const UNLOCK_ITEMS = [
  {
    id: "scan",
    title: "Find my next roles",
    desc: "See realistic next roles from where you are today.",
    price: "Free",
    priceBg: `${colors.accentPurple}33`,
    priceColor: colors.accentPurple,
    iconColor: colors.accentPurple,
    icon: "scan" as const,
  },
  {
    id: "transition",
    title: "AI Career Transition",
    desc: "Get a weekly roadmap to reach your next role.",
    price: "Coming Soon",
    priceBg: `${colors.accent}33`,
    priceColor: colors.accent,
    iconColor: colors.accent,
    icon: "flag" as const,
  },
];

const TRUST_ITEMS = [
  {
    id: "privacy",
    title: "Privacy First",
    subtitle: "Your data stays on your device.",
    icon: "shield" as const,
  },
  {
    id: "free",
    title: "100% Free",
    subtitle: "No sign up. No credit card.",
    icon: "lock" as const,
  },
  {
    id: "ai",
    title: "AI-Powered",
    subtitle: "Smart. Fast. Actionable.",
    icon: "bolt" as const,
  },
];

export function HomeScreen() {
  const navigation = useAppNavigation();

  const startScan = useCallback(() => navigation.navigate("NextRolesIntro"), [navigation]);

  const onUnlockPress = useCallback(
    (id: string) => {
      if (id === "scan") navigation.navigate("NextRolesIntro");
      else navigation.navigate("Waitlist");
    },
    [navigation]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LogoMark size={56} />
          <View style={styles.headerText}>
            <Text style={styles.brandName}>Future Trace</Text>
            <Text style={styles.brandTagline}>Your AI Career Intelligence</Text>
          </View>
        </View>

        <FreeScanCard onPress={startScan} />

        <Text style={styles.sectionLabel}>What you'll unlock</Text>
        <View style={styles.unlockRow}>
          {UNLOCK_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onUnlockPress(item.id)}
              style={({ pressed }) => [styles.unlockCard, pressed && styles.pressed]}
            >
              <View style={[styles.unlockIcon, { backgroundColor: `${item.iconColor}22` }]}>
                <UnlockIcon type={item.icon} color={item.iconColor} />
              </View>
              <Text style={styles.unlockTitle}>{item.title}</Text>
              <Text style={styles.unlockDesc}>{item.desc}</Text>
              <Text style={[styles.unlockPrice, { backgroundColor: item.priceBg, color: item.priceColor }]}>
                {item.price}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={startScan}
          style={({ pressed }) => [styles.motivationBanner, pressed && styles.pressed]}
        >
          <View style={styles.motivationIcon}>
            <StarIcon />
          </View>
          <Text style={styles.motivationText}>
            Your future is built one smart step at a time. Find your next roles and unlock your possibilities.
          </Text>
          <ChevronIcon />
        </Pressable>

        <View style={styles.trustBar}>
          {TRUST_ITEMS.map((item, index) => (
            <View key={item.id} style={[styles.trustItem, index > 0 && styles.trustItemDivider]}>
              <TrustIcon type={item.icon} />
              <Text style={styles.trustTitle}>{item.title}</Text>
              <Text style={styles.trustSubtitle}>{item.subtitle}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FreeScanCard({ onPress }: { onPress: () => void }) {
  const features = [
    { icon: <ShieldIcon />, label: "AI Exposure Score" },
    { icon: <ChartIcon />, label: "Career Resilience" },
    { icon: <RocketIcon />, label: "Future Opportunities" },
  ];

  return (
    <LinearGradient
      colors={[`${colors.accentPurple}1F`, colors.card, colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.freeScanCard}
    >
      <View style={styles.freeScanRow}>
        <View style={styles.freeScanCopy}>
          <Text style={styles.freeBadge}>Free</Text>
          <Text style={styles.freeScanTitle}>Find my next roles</Text>
          <Text style={styles.freeScanBody}>
            Enter your current role and get top next-step careers with salary estimates, transferable skills, and
            transition time.
          </Text>

          <View style={styles.featureList}>
            {features.map((feature) => (
              <View key={feature.label} style={styles.featureRow}>
                <View style={styles.featureIcon}>{feature.icon}</View>
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.clockRow}>
            <ClockIcon />
            <Text style={styles.clockText}>Takes 2 minutes</Text>
          </View>
        </View>

        <Pressable onPress={onPress} style={({ pressed }) => [styles.scanButtonCol, pressed && styles.pressed]}>
          <View style={styles.scanButtonGlow} />
          <LinearGradient
            colors={[colors.accentPurple, colors.accentGold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scanButton}
          >
            <ScanFrameIcon />
          </LinearGradient>
          <Text style={styles.scanButtonLabel}>Find roles</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function UnlockIcon({ type, color }: { type: "scan" | "target" | "flag"; color: string }) {
  if (type === "scan") {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
        <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.8} />
      </Svg>
    );
  }
  if (type === "target") {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
        <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.8} />
        <Circle cx={12} cy={12} r={1.5} fill={color} />
      </Svg>
    );
  }
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M5 4v16M5 4h12l-3 4 3 4H5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrustIcon({ type }: { type: "shield" | "lock" | "bolt" }) {
  const color = colors.muted;
  if (type === "shield") {
    return (
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3l8 4v6c0 4.5-3.5 7.5-8 8-4.5-.5-8-3.5-8-8V7l8-4z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (type === "lock") {
    return (
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M7 11h10v9H7z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        <Path d="M9 11V8a3 3 0 0 1 6 0v3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2 4 14h7l-1 8 10-14h-7l1-6z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ScanFrameIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x={7} y={7} width={10} height={10} rx={1} stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1.8} />
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3l8 4v6c0 4.5-3.5 7.5-8 8-4.5-.5-8-3.5-8-8V7l8-4z" stroke={colors.accentPurple} strokeWidth={2} />
    </Svg>
  );
}

function ChartIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 14l4-4 4 4 8-10"
        stroke={colors.accentPurple}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RocketIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2c0 4-2 6-4 8v4l4 2 4-2v-4c-2-2-4-4-4-8z"
        stroke={colors.accentPurple}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={colors.muted} strokeWidth={2} />
      <Path d="M12 7v5l3 2" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function StarIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill={colors.accentPurple}>
      <Path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6L12 2z" />
    </Svg>
  );
}

function ChevronIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={colors.muted}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  headerText: { flex: 1, minWidth: 0 },
  brandName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  brandTagline: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  freeScanCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.accentPurple}4D`,
    padding: spacing.lg,
    marginTop: spacing.xs,
  },
  freeScanRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  freeScanCopy: { flex: 1, minWidth: 0 },
  freeBadge: {
    alignSelf: "flex-start",
    backgroundColor: `${colors.accent}33`,
    color: colors.accent,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  freeScanTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  freeScanBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  featureList: { marginTop: spacing.md, gap: 6 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  featureIcon: { width: 14, alignItems: "center" },
  featureLabel: { color: colors.muted, fontSize: 11 },
  clockRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md },
  clockText: { color: colors.muted, fontSize: 10 },
  scanButtonCol: { alignItems: "center", gap: 6, paddingTop: 4 },
  scanButtonGlow: {
    position: "absolute",
    top: 8,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${colors.accentPurple}33`,
  },
  scanButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accentPurple,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  scanButtonLabel: {
    color: colors.accentPurple,
    fontSize: 10,
    fontWeight: "600",
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  unlockRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  unlockCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    minHeight: 148,
  },
  unlockIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  unlockTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  unlockDesc: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 5,
    flex: 1,
  },
  unlockPrice: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    overflow: "hidden",
  },
  motivationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: `${colors.accentPurple}14`,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.accentPurple}33`,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  motivationIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: `${colors.accentPurple}26`,
    alignItems: "center",
    justifyContent: "center",
  },
  motivationText: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  trustBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  trustItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
    gap: 4,
  },
  trustItemDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  trustTitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  trustSubtitle: {
    color: `${colors.muted}B3`,
    fontSize: 9,
    lineHeight: 12,
    textAlign: "center",
  },
  pressed: { opacity: 0.85 },
});
