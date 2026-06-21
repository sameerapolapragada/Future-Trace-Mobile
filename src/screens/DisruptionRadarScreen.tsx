import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { buildDisruptionRadarFromScan } from "../../lib/shared";
import { AI_DISCLAIMER } from "../../lib/shared/legal/content";
import { colors, spacing } from "../../lib/shared/theme";
import { Card, Disclaimer, MetricPill, PrimaryButton, Subtitle, Title } from "../components/ui";
import { getLatestScan } from "../lib/scanStorage";
import { useAppNavigation } from "../navigation/hooks";

function toneColor(tone: "accent" | "gold" | "success" | "danger"): string {
  if (tone === "danger") return colors.danger;
  if (tone === "success") return colors.success;
  if (tone === "gold") return colors.accentGold;
  return colors.accent;
}

export function DisruptionRadarScreen() {
  const navigation = useAppNavigation();
  const [empty, setEmpty] = useState(true);
  const [radar, setRadar] = useState<ReturnType<typeof buildDisruptionRadarFromScan> | null>(null);

  useFocusEffect(
    useCallback(() => {
      getLatestScan().then((scan) => {
        if (!scan) {
          setEmpty(true);
          setRadar(null);
          return;
        }
        setEmpty(false);
        setRadar(buildDisruptionRadarFromScan(scan.result));
      });
    }, [])
  );

  if (empty || !radar) {
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>{radar.headline}</Title>
        <Subtitle>{radar.readinessLabel} · Readiness {radar.readinessScore}/100</Subtitle>

        <Card>
          <Text style={styles.summary}>{radar.summary}</Text>
        </Card>

        <View style={styles.metricsRow}>
          {radar.subMetrics.map((metric) => (
            <View key={metric.label} style={styles.metricWrap}>
              <MetricPill label={metric.label} value={`${metric.value}`} />
              <View style={[styles.toneBar, { backgroundColor: toneColor(metric.tone) }]} />
            </View>
          ))}
        </View>

        <Card>
          <Text style={styles.cardTitle}>Strengths to leverage</Text>
          {radar.strengths.map((item) => (
            <Text key={item} style={styles.bullet}>
              • {item}
            </Text>
          ))}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Watch areas</Text>
          {radar.watchAreas.map((item) => (
            <Text key={item} style={styles.bullet}>
              • {item}
            </Text>
          ))}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Signals</Text>
          {radar.signals.map((signal) => (
            <View key={signal.title} style={styles.signalRow}>
              <Text style={styles.signalTitle}>{signal.title}</Text>
              <Text style={styles.signalDetail}>{signal.detail}</Text>
            </View>
          ))}
        </Card>

        <Disclaimer text={AI_DISCLAIMER} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyWrap: { flex: 1, padding: spacing.lg, justifyContent: "center" },
  summary: { color: colors.text, fontSize: 14, lineHeight: 21 },
  metricsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  metricWrap: { flex: 1 },
  toneBar: { height: 3, borderRadius: 2, marginTop: spacing.sm },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  bullet: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 4 },
  signalRow: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  signalTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  signalDetail: { color: colors.muted, fontSize: 13, marginTop: 4 },
});
