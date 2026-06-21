import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { StoredScan } from "../../lib/shared";
import { colors, spacing } from "../../lib/shared/theme";
import { Card, Disclaimer, PrimaryButton, SecondaryButton, Subtitle, Title } from "../components/ui";
import { getLatestScan } from "../lib/scanStorage";
import { useAppNavigation } from "../navigation/hooks";

export function HomeScreen() {
  const navigation = useAppNavigation();
  const [latest, setLatest] = useState<StoredScan | null>(null);

  useFocusEffect(
    useCallback(() => {
      getLatestScan().then(setLatest);
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>Future Trace</Title>
        <Subtitle>Free Career Scan · AI Disruption Radar · Early Access</Subtitle>

        <Card>
          <Text style={styles.cardTitle}>Career Scan</Text>
          <Text style={styles.cardBody}>
            Compare your current role and target path with rule-based resilience and automation exposure scores.
          </Text>
          <PrimaryButton label="Start Career Scan" onPress={() => navigation.navigate("Scan")} />
        </Card>

        {latest ? (
          <Card>
            <Text style={styles.cardTitle}>Latest scan</Text>
            <Text style={styles.cardBody}>
              {latest.result.currentRole} → {latest.result.targetRole}
            </Text>
            <SecondaryButton label="View results" onPress={() => navigation.navigate("ScanResults", { scanId: latest.id })} />
            <SecondaryButton label="Open Disruption Radar" onPress={() => navigation.navigate("Radar")} />
            <SecondaryButton label="Scan History" onPress={() => navigation.navigate("ScanHistory")} />
          </Card>
        ) : null}

        <Card>
          <Text style={styles.cardTitle}>Career X-Ray — Early Access</Text>
          <Text style={styles.cardBody}>
            Personalized transition analysis is coming soon. Join Early Access to get notified at launch.
          </Text>
          <SecondaryButton label="Join Early Access" onPress={() => navigation.navigate("Waitlist")} />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>AI Career Roadmap — Coming Soon</Text>
          <Text style={styles.cardBody}>
            Guided milestones and progress tracking toward your target role will arrive in a future release.
          </Text>
        </Card>

        <Disclaimer text="Informational guidance only. Not career, legal, or financial advice." />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
});
