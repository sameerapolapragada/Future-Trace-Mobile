import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { generateRuleBasedScan } from "../../lib/shared";
import { colors, spacing } from "../../lib/shared/theme";
import { takePendingScanInput } from "../lib/scanSession";
import { saveScan } from "../lib/scanStorage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ScanLoading">;

export function ScanLoadingScreen({ navigation }: Props) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const input = takePendingScanInput();
      if (!input) {
        if (!cancelled) {
          setError("No scan data found. Please fill out the form again.");
        }
        return;
      }

      await new Promise((r) => setTimeout(r, 900));

      try {
        const result = generateRuleBasedScan(input);
        const stored = await saveScan(input, result);
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
    };
  }, [navigation]);

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <Text style={styles.link} onPress={() => navigation.goBack()}>
          Go back
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.title}>Analyzing your career path</Text>
      <Text style={styles.subtitle}>Running rule-based scoring on your device…</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  title: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: spacing.lg },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: spacing.sm, textAlign: "center" },
  errorTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  errorBody: { color: colors.muted, fontSize: 14, marginTop: spacing.sm, textAlign: "center" },
  link: { color: colors.accent, marginTop: spacing.lg, fontWeight: "600" },
});
