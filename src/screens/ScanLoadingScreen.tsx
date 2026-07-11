import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { generateHybridScan, canGenerateScan, formatRoleMatchQualityLabel } from "../../lib/shared";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { getHybridScanConfig } from "../lib/hybridScanConfig";
import { takePendingScanInput } from "../lib/scanSession";
import { saveScan } from "../lib/scanStorage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ScanLoading">;

const CHECKLIST = [
  "Understanding your experience",
  "Analyzing skill match",
  "Finding career paths",
  "Calculating insights",
];

/** Staged progress so the UI feels like analysis is happening even when compute is fast. */
const PROGRESS_STAGES = [
  { to: 28, durationMs: 1100, checklistCount: 1 },
  { to: 52, durationMs: 1200, checklistCount: 2 },
  { to: 74, durationMs: 1300, checklistCount: 3 },
  { to: 90, durationMs: 1100, checklistCount: 4 },
] as const;

const MIN_ANALYSIS_MS = PROGRESS_STAGES.reduce((sum, stage) => sum + stage.durationMs, 0);
const FINISH_DURATION_MS = 700;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ProgressRing({ progress }: { progress: number }) {
  const size = 168;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, progress)) / 100);

  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`${colors.accentPurple}44`}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.accentPurple}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeLinecap="round"
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.ringPercent}>{Math.round(progress)}%</Text>
    </View>
  );
}

function animateTo(
  anim: Animated.Value,
  toValue: number,
  duration: number
): Promise<void> {
  return new Promise((resolve) => {
    Animated.timing(anim, {
      toValue,
      duration,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) resolve();
      else resolve();
    });
  });
}

export function ScanLoadingScreen({ navigation }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(6);
  const [completedCount, setCompletedCount] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const anim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    const id = anim.addListener(({ value }) => setProgress(value));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const input = takePendingScanInput();
      if (!input) {
        if (!cancelled) setError("No scan data found. Please fill out the form again.");
        return;
      }

      const roleMatch = input.roleMatch;
      if (roleMatch && !canGenerateScan(roleMatch, roleMatch.userAction)) {
        if (!cancelled) {
          setError("This role cannot be scanned yet. Please confirm or edit your role.");
        }
        return;
      }

      const startedAt = Date.now();

      const scanPromise = (async () => {
        const result = await generateHybridScan(input, getHybridScanConfig());
        const enrichedResult = {
          ...result,
          originalRoleInput: input.originalCurrentRole ?? roleMatch?.originalRoleInput ?? input.currentRole,
          normalizedCurrentRole: input.currentRole,
          roleMatchStatus: roleMatch?.matchStatus,
          roleMatchUserAction: roleMatch?.userAction,
          analysisQualityLabel: roleMatch
            ? formatRoleMatchQualityLabel(roleMatch.matchStatus, roleMatch.userAction)
            : undefined,
        };
        return saveScan(
          { ...input, targetRole: result.targetRole },
          enrichedResult,
          roleMatch?.roleMatchEventId
        );
      })();

      try {
        for (const stage of PROGRESS_STAGES) {
          if (cancelled) return;
          setActiveStep(stage.checklistCount - 1);
          await animateTo(anim, stage.to, stage.durationMs);
          if (cancelled) return;
          setCompletedCount(stage.checklistCount);
          await sleep(180);
        }

        const remaining = Math.max(0, MIN_ANALYSIS_MS - (Date.now() - startedAt));
        if (remaining > 0) await sleep(remaining);

        const stored = await scanPromise;
        if (cancelled) return;

        setCompletedCount(CHECKLIST.length);
        setActiveStep(CHECKLIST.length - 1);
        await animateTo(anim, 100, FINISH_DURATION_MS);
        if (cancelled) return;

        await sleep(250);
        if (!cancelled) {
          navigation.replace("ScanResults", { scanId: stored.id });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Scan failed.");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
      anim.stopAnimation();
    };
  }, [anim, navigation]);

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>Analyzing your profile...</Text>
        <Text style={styles.subtitle}>Our AI is finding your best career opportunities</Text>

        <ProgressRing progress={progress} />

        <View style={styles.checklist}>
          {CHECKLIST.map((item, index) => {
            const done = index < completedCount;
            const active = index === activeStep && !done;
            return (
              <View key={item} style={styles.checkRow}>
                <View style={[styles.checkDot, done && styles.checkDotDone, active && styles.checkDotActive]}>
                  <Text style={styles.checkMark}>{done ? "✓" : active ? "…" : ""}</Text>
                </View>
                <Text
                  style={[
                    styles.checkText,
                    done && styles.checkTextDone,
                    active && styles.checkTextActive,
                  ]}
                >
                  {item}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  backBtn: {
    width: 36,
    height: 36,
    marginLeft: spacing.lg,
    marginTop: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: colors.accent, fontSize: 22, fontWeight: "600" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", textAlign: "center" },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  ringWrap: { width: 168, height: 168, alignItems: "center", justifyContent: "center" },
  ringPercent: {
    position: "absolute",
    color: colors.text,
    fontSize: 36,
    fontWeight: "800",
  },
  checklist: {
    width: "100%",
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  checkDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.elevated,
  },
  checkDotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkDotActive: {
    borderColor: colors.accentPurple,
    backgroundColor: `${colors.accentPurple}33`,
  },
  checkMark: { color: colors.text, fontSize: 12, fontWeight: "800" },
  checkText: { color: colors.muted, fontSize: 14, fontWeight: "600", flex: 1 },
  checkTextDone: { color: colors.text },
  checkTextActive: { color: colors.accent },
  errorTitle: { color: colors.text, fontSize: 18, fontWeight: "700", textAlign: "center" },
  errorBody: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  link: { color: colors.accent, marginTop: spacing.lg, fontWeight: "600", textAlign: "center" },
});
