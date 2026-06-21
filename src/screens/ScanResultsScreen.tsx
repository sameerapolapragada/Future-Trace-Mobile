import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AIExposureLevel, DisruptionRadarStatus, RoleScanProfile, StoredScan } from "../../lib/shared";
import { buildDisruptionRadarBrief } from "../../lib/shared";
import { AI_DISCLAIMER } from "../../lib/shared/legal/content";
import { colors, spacing } from "../../lib/shared/theme";
import { Card, MetricPill, PrimaryButton, SecondaryButton, Subtitle, Title } from "../components/ui";
import { getScan } from "../lib/scanStorage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ScanResults">;

function exposureColor(level: AIExposureLevel): string {
  if (level === "high") return colors.danger;
  if (level === "medium") return colors.warning;
  return colors.success;
}

function RoleProfileCard({ title, profile }: { title: string; profile: RoleScanProfile }) {
  return (
    <Card>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.metricsRow}>
        <MetricPill label="Resilience" value={`${profile.resilienceScore}`} />
        <MetricPill label="AI exposure" value={profile.aiExposureLevel.toUpperCase()} />
      </View>
      <Text style={[styles.exposureLabel, { color: exposureColor(profile.aiExposureLevel) }]}>{profile.aiExposureLabel}</Text>

      <Text style={styles.sectionLabel}>Strengths</Text>
      {profile.strengths.map((item) => (
        <Text key={item} style={styles.bullet}>
          • {item}
        </Text>
      ))}

      <Text style={styles.sectionLabel}>Watch areas</Text>
      {profile.vulnerabilities.map((item) => (
        <Text key={item} style={styles.bullet}>
          • {item}
        </Text>
      ))}

      <Text style={styles.sectionLabel}>Opportunity zones</Text>
      {profile.opportunityZones.map((item) => (
        <Text key={item} style={styles.bullet}>
          • {item}
        </Text>
      ))}
    </Card>
  );
}

function DisruptionRadarCard({ result }: { result: StoredScan["result"] }) {
  const radar = buildDisruptionRadarBrief(result);
  const toneColor = (status: DisruptionRadarStatus) => {
    if (status === "Stable") return colors.success;
    if (status === "At Risk") return colors.danger;
    return colors.warning;
  };

  return (
    <Card>
      <View style={styles.radarHeader}>
        <Text style={styles.cardTitle}>AI Disruption Radar</Text>
        <Text style={[styles.radarStatus, { color: toneColor(radar.status) }]}>{radar.status}</Text>
      </View>
      <Text style={styles.summary}>{radar.explanation}</Text>
      <View style={styles.nextActionBox}>
        <Text style={styles.sectionLabel}>Suggested next action</Text>
        <Text style={styles.bullet}>{radar.nextAction}</Text>
      </View>
    </Card>
  );
}

export function ScanResultsScreen({ route, navigation }: Props) {
  const [scan, setScan] = useState<StoredScan | null>(null);

  useEffect(() => {
    getScan(route.params.scanId).then(setScan);
  }, [route.params.scanId]);

  if (!scan) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>Loading results…</Text>
      </SafeAreaView>
    );
  }

  const { result } = scan;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>{result.currentRole}</Title>
        <Subtitle>
          Target path: {result.targetRole} · Rule-based scan · Stored on device
        </Subtitle>

        <Card>
          <Text style={styles.disclaimerTitle}>Informational guidance only</Text>
          <Text style={styles.disclaimerBody}>{AI_DISCLAIMER}</Text>
        </Card>

        <Card>
          <Text style={styles.summary}>{result.summary}</Text>
        </Card>

        <DisruptionRadarCard result={result} />

        <RoleProfileCard title="Current role profile" profile={result.currentRoleProfile} />
        <RoleProfileCard title="Target role profile" profile={result.targetRoleProfile} />

        {result.initialRoleRecommendations.length > 0 ? (
          <Card>
            <Text style={styles.cardTitle}>Adjacent roles to explore</Text>
            {result.initialRoleRecommendations.map((role) => (
              <Text key={role} style={styles.bullet}>
                • {role}
              </Text>
            ))}
          </Card>
        ) : null}

        <PrimaryButton label="Open AI Disruption Radar" onPress={() => navigation.navigate("MainTabs", { screen: "Radar" })} />

        <Card>
          <Text style={[styles.cardTitle, { color: colors.accentPurple }]}>Career X-Ray — Early Access</Text>
          <Text style={styles.summary}>
            Deep skill-gap analysis and transition roles are coming soon. Join Early Access to get notified at launch.
          </Text>
          <SecondaryButton label="Join Early Access" onPress={() => navigation.navigate("Waitlist")} />
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: colors.accentPurple }]}>AI Career Roadmap — Coming Soon</Text>
          <Text style={styles.summary}>
            Learn what skills to build, understand transition pathways, and track progress toward future roles.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loading: { color: colors.muted, textAlign: "center", marginTop: spacing.xxl },
  summary: { color: colors.text, fontSize: 15, lineHeight: 22 },
  disclaimerTitle: { color: colors.muted, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  disclaimerBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  metricsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  exposureLabel: { fontSize: 13, fontWeight: "600", marginTop: spacing.md },
  sectionLabel: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: spacing.md, textTransform: "uppercase" },
  bullet: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 4 },
  radarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  radarStatus: { fontSize: 13, fontWeight: "700" },
  nextActionBox: {
    marginTop: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.elevated,
    padding: spacing.md,
  },
});
