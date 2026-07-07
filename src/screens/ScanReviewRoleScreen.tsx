import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatRoleMatchQualityLabel } from "../../lib/shared";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { Card, PrimaryButton, SecondaryButton, Subtitle, Title } from "../components/ui";
import { updateRoleMatchUserAction } from "../lib/roleMatchService";
import {
  buildPendingScanInput,
  getPendingRoleMatch,
  getPendingScanForm,
  setPendingScanInput,
} from "../lib/scanSession";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ScanReviewRole">;

export function ScanReviewRoleScreen({ navigation }: Props) {
  const match = getPendingRoleMatch();
  const form = getPendingScanForm();

  if (!match || !form) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Session expired. Please enter your role again.</Text>
        <SecondaryButton label="Back to scan form" onPress={() => navigation.navigate("MainTabs")} />
      </SafeAreaView>
    );
  }

  const qualityLabel = formatRoleMatchQualityLabel(match.matchStatus, "auto_accepted");
  const currentRole = form.currentRole.trim();

  async function onContinue() {
    const role = match!.normalizedRole ?? form!.targetRole.trim();
    if (match!.roleMatchEventId) {
      await updateRoleMatchUserAction(match!.roleMatchEventId, "auto_accepted");
    }
    setPendingScanInput(buildPendingScanInput(form!, role, match, "auto_accepted"));
    navigation.replace("ScanLoading");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.content}>
        <Title>Target role match found</Title>
        <Subtitle>
          We matched your target role. Your current role stays as entered for the transition scan.
        </Subtitle>

        <Card>
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>{qualityLabel}</Text>
          </View>
          <Text style={styles.label}>Target role match</Text>
          <Text style={styles.roleValue}>{match.normalizedRole}</Text>
          {match.originalRoleInput !== match.normalizedRole ? (
            <>
              <Text style={styles.label}>Based on your input</Text>
              <Text style={styles.inputValue}>{match.originalRoleInput}</Text>
            </>
          ) : null}
          {match.roleFamily ? (
            <>
              <Text style={styles.label}>Role family</Text>
              <Text style={styles.metaValue}>{match.roleFamily}</Text>
            </>
          ) : null}
          <Text style={styles.confidence}>
            Confidence: {match.confidenceScore}% ({match.confidenceLabel})
          </Text>
        </Card>

        <Card>
          <Text style={styles.label}>Your current role</Text>
          <Text style={styles.roleValue}>{currentRole}</Text>
          <Text style={styles.contextHint}>This is where you are today — not the match above.</Text>
        </Card>

        <PrimaryButton label="Continue to Career Scan" onPress={onContinue} />
        <SecondaryButton label="Edit roles" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg },
  error: { color: colors.danger, padding: spacing.lg, textAlign: "center" },
  matchBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,180,255,0.15)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: spacing.md,
  },
  matchBadgeText: { color: colors.accent, fontSize: 12, fontWeight: "700" },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginTop: spacing.sm },
  roleValue: { color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 4 },
  inputValue: { color: colors.muted, fontSize: 15, marginTop: 4 },
  metaValue: { color: colors.text, fontSize: 15, marginTop: 4 },
  confidence: { color: colors.muted, fontSize: 13, marginTop: spacing.md },
  contextHint: { color: colors.muted, fontSize: 13, marginTop: spacing.sm, fontStyle: "italic" },
});
