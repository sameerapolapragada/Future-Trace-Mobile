import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { normalizeScanInput, type ScanFormInput } from "../../lib/shared";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { Card, PrimaryButton, SecondaryButton, Subtitle, Title } from "../components/ui";
import { updateRoleMatchUserAction } from "../lib/roleMatchService";
import {
  getPendingRoleMatch,
  getPendingScanForm,
  setPendingRoleMatch,
  setPendingScanInput,
} from "../lib/scanSession";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ScanRoleConfirm">;

function buildScanInput(form: ScanFormInput, currentRole: string) {
  const normalized = normalizeScanInput({ ...form, currentRole });
  const match = getPendingRoleMatch();
  return {
    ...normalized,
    currentRole,
    identifiedCareerProfile: currentRole,
    originalCurrentRole: match?.originalRoleInput ?? form.currentRole.trim(),
    roleMatch: match ? { ...match, userSelectedRole: currentRole, userAction: "confirmed" as const } : undefined,
  };
}

export function ScanRoleConfirmScreen({ navigation }: Props) {
  const match = getPendingRoleMatch();
  const form = getPendingScanForm();
  const defaultRole = match?.normalizedRole ?? match?.suggestedRoles[0]?.role ?? "";
  const [selectedRole, setSelectedRole] = useState(defaultRole);

  if (!match || !form) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Session expired. Please enter your role again.</Text>
        <SecondaryButton label="Back to scan form" onPress={() => navigation.navigate("MainTabs")} />
      </SafeAreaView>
    );
  }

  const options = [
    ...(match.normalizedRole ? [{ role: match.normalizedRole, confidence: match.confidenceScore }] : []),
    ...match.suggestedRoles.filter((s) => s.role !== match.normalizedRole),
  ];

  async function onConfirm() {
    if (!selectedRole) return;
    const isCorrected = selectedRole !== match!.normalizedRole;
    const action = isCorrected ? "corrected" : "confirmed";
    if (match!.roleMatchEventId) {
      await updateRoleMatchUserAction(match!.roleMatchEventId, action, { userSelectedRole: selectedRole });
    }
    setPendingRoleMatch({ ...match!, userSelectedRole: selectedRole, userAction: action });
    setPendingScanInput(buildScanInput(form!, selectedRole));
    navigation.replace("ScanLoading");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>Confirm your role</Title>
        <Subtitle>
          Your title looks like a specialized version of a supported role. Please confirm the closest match before we
          generate your scan.
        </Subtitle>

        <Card>
          <Text style={styles.label}>Your input</Text>
          <Text style={styles.inputValue}>{match.originalRoleInput}</Text>
          <Text style={styles.hint}>We analyzed the closest confirmed role.</Text>
        </Card>

        <Text style={styles.sectionLabel}>Suggested roles</Text>
        {options.map((option) => {
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

        <PrimaryButton label="Confirm and continue" onPress={onConfirm} disabled={!selectedRole} />
        <SecondaryButton label="Edit role" onPress={() => navigation.goBack()} />
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
  hint: { color: colors.warning, fontSize: 13, marginTop: spacing.sm, fontStyle: "italic" },
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
});
