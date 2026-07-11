import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { canGenerateScan, TECHNOLOGY_DOMAIN_MESSAGE } from "../../lib/shared";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { Card, Field, PrimaryButton, SecondaryButton, Subtitle, Title } from "../components/ui";
import { runRoleMatch, updateRoleMatchUserAction } from "../lib/roleMatchService";
import {
  buildPendingScanInput,
  getPendingRoleMatch,
  getPendingScanForm,
  setPendingRoleMatch,
  setPendingScanForm,
  setPendingScanInput,
} from "../lib/scanSession";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ScanRoleNeedsInfo">;

export function ScanRoleNeedsInfoScreen({ navigation }: Props) {
  const match = getPendingRoleMatch();
  const form = getPendingScanForm();
  const isNoMatch = match?.matchStatus === "no_match";

  const [responsibilities, setResponsibilities] = useState("");
  const [tools, setTools] = useState(form?.tools ?? "");
  const [selectedRole, setSelectedRole] = useState(match?.suggestedRoles[0]?.role ?? "");
  const [retrying, setRetrying] = useState(false);

  if (!match || !form) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Session expired. Please enter your role again.</Text>
        <SecondaryButton label="Back to scan form" onPress={() => navigation.navigate("MainTabs")} />
      </SafeAreaView>
    );
  }

  async function onRetryMatch() {
    setRetrying(true);
    const updatedForm = {
      ...form!,
      tools: tools.trim() || form!.tools,
      skills: responsibilities.trim() || form!.skills,
    };
    setPendingScanForm(updatedForm);

    const snapshot = await runRoleMatch({
      originalRoleInput: form!.currentRole.trim(),
      industry: form!.industry,
      yearsExperience: parseInt(form!.yearsExperience, 10) || 0,
      skills: updatedForm.skills,
      tools: updatedForm.tools,
      responsibilities: responsibilities.trim(),
    });

    if (match!.roleMatchEventId) {
      await updateRoleMatchUserAction(match!.roleMatchEventId, "needs_more_info", {
        addedResponsibilities: responsibilities.trim(),
        addedTools: tools.trim(),
      });
    }

    setPendingRoleMatch(snapshot);
    setRetrying(false);

    if (snapshot.outOfTechnologyDomain) {
      Alert.alert("Technology domain required", TECHNOLOGY_DOMAIN_MESSAGE);
      return;
    }

    if (snapshot.matchStatus === "matched") {
      navigation.replace("ScanReviewRole");
    } else if (snapshot.matchStatus === "partial_match") {
      navigation.replace("ScanRoleConfirm");
    } else if (snapshot.matchStatus === "unsupported") {
      Alert.alert("Still unsupported", "Try choosing a suggested role below or edit your job title.");
    } else {
      Alert.alert("Role not identified", "Please edit your job title or choose a common role.");
    }
  }

  async function onContinueWithSelected() {
    if (!selectedRole) {
      Alert.alert("Choose a role", "Select a supported role to continue.");
      return;
    }

    if (match!.roleMatchEventId) {
      await updateRoleMatchUserAction(match!.roleMatchEventId, "corrected", { userSelectedRole: selectedRole });
    }
    setPendingRoleMatch({ ...match!, userSelectedRole: selectedRole, userAction: "corrected" });
    setPendingScanInput(buildPendingScanInput(form!, selectedRole, { ...match!, userSelectedRole: selectedRole, userAction: "corrected" }, "corrected"));
    navigation.replace("ScanLoading");
  }

  async function onApproximateContinue() {
    const role = match!.normalizedRole ?? selectedRole;
    if (!role || !canGenerateScan(match!, "approximate_continue")) {
      Alert.alert("Cannot continue", "Add more information or choose a supported role.");
      return;
    }

    if (match!.roleMatchEventId) {
      await updateRoleMatchUserAction(match!.roleMatchEventId, "approximate_continue", { userSelectedRole: role });
    }
    setPendingRoleMatch({ ...match!, userSelectedRole: role, userAction: "approximate_continue" });
    setPendingScanInput(
      buildPendingScanInput(
        form!,
        role,
        { ...match!, userSelectedRole: role, userAction: "approximate_continue" },
        "approximate_continue"
      )
    );
    navigation.replace("ScanLoading");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Title>{isNoMatch ? "Current role not identified" : "Current role needs more info"}</Title>
        <Subtitle>
          {isNoMatch
            ? "We couldn't identify your current role. Please edit your job title or choose a common role."
            : "We don't fully support your current role yet. Help us understand it better or choose the closest supported role."}
        </Subtitle>

        <Card>
          <Text style={styles.label}>Your current role input</Text>
          <Text style={styles.inputValue}>{match.originalRoleInput}</Text>
        </Card>

        {!isNoMatch ? (
          <Card>
            <Field
              label="Key responsibilities"
              value={responsibilities}
              onChangeText={setResponsibilities}
              placeholder="What do you do day-to-day?"
              multiline
            />
            <Field
              label="Tools & platforms"
              value={tools}
              onChangeText={setTools}
              placeholder="Salesforce, HubSpot…"
              multiline
            />
            <PrimaryButton label="Retry role match" onPress={onRetryMatch} loading={retrying} />
          </Card>
        ) : null}

        {match.suggestedRoles.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Suggested supported current roles</Text>
            {match.suggestedRoles.map((option) => {
              const active = selectedRole === option.role;
              return (
                <Pressable
                  key={option.role}
                  onPress={() => setSelectedRole(option.role)}
                  style={[styles.option, active && styles.optionActive]}
                >
                  <Text style={[styles.optionRole, active && styles.optionRoleActive]}>{option.role}</Text>
                  <Text style={styles.optionConfidence}>{option.confidence}% match</Text>
                </Pressable>
              );
            })}
            <PrimaryButton label="Continue with selected role" onPress={onContinueWithSelected} disabled={!selectedRole} />
          </>
        ) : null}

        {!isNoMatch && match.normalizedRole && canGenerateScan(match, "approximate_continue") ? (
          <>
            <Text style={styles.warning}>
              This scan is based on an approximate role match and may be less precise.
            </Text>
            <SecondaryButton label="Continue with approximate match" onPress={onApproximateContinue} />
          </>
        ) : null}

        <SecondaryButton label="Edit current role" onPress={() => navigation.goBack()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  error: { color: colors.danger, padding: spacing.lg, textAlign: "center" },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  inputValue: { color: colors.text, fontSize: 17, fontWeight: "600", marginTop: 4 },
  targetHint: { color: colors.muted, fontSize: 13, marginTop: spacing.sm, fontStyle: "italic" },
  contextHint: { color: colors.muted, fontSize: 13, marginTop: spacing.sm, fontStyle: "italic" },
  sectionLabel: { color: colors.text, fontSize: 14, fontWeight: "700", marginTop: spacing.lg, marginBottom: spacing.sm },
  option: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.elevated,
  },
  optionActive: { borderColor: colors.accent, backgroundColor: "rgba(0,180,255,0.1)" },
  optionRole: { color: colors.text, fontSize: 16, fontWeight: "600" },
  optionRoleActive: { color: colors.accent },
  optionConfidence: { color: colors.muted, fontSize: 12, marginTop: 4 },
  warning: { color: colors.warning, fontSize: 13, marginTop: spacing.md, marginBottom: spacing.sm, fontStyle: "italic" },
});
