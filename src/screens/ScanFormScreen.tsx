import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  formatWorkPreferenceHelpAlert,
  normalizeScanInput,
  type ScanFormInput,
  type WorkPreference,
  validateScanForm,
} from "../../lib/shared";
import { AI_DISCLAIMER } from "../../lib/shared/legal/content";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { Card, Disclaimer, Field, PrimaryButton, SecondaryButton, Subtitle, Title } from "../components/ui";
import { getScanCount } from "../lib/scanStorage";
import { setPendingScanInput } from "../lib/scanSession";
import { useAppNavigation } from "../navigation/hooks";

const WORK_PREFS: WorkPreference[] = ["Technical", "Business", "Hybrid"];

const EMPTY: ScanFormInput = {
  currentRole: "",
  targetRole: "",
  industry: "",
  yearsExperience: "",
  skills: "",
  tools: "",
  careerGoal: "",
  workPreference: "Hybrid",
};

export function ScanFormScreen() {
  const navigation = useAppNavigation();
  const [form, setForm] = useState<ScanFormInput>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getScanCount().then(setScanCount);
    }, [])
  );

  const setField = useCallback(<K extends keyof ScanFormInput>(key: K, value: ScanFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function onSubmit() {
    const error = validateScanForm(form);
    if (error) {
      Alert.alert("Check your form", error.message);
      return;
    }

    setSubmitting(true);
    const normalized = normalizeScanInput(form);
    setPendingScanInput(normalized);
    setSubmitting(false);
    navigation.navigate("ScanLoading");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Title>Career Scan</Title>
        <Subtitle>
          Tell us about your role today and where you want to go. Analysis runs on your device — no login or email
          required.
        </Subtitle>

        <Card>
          <Field label="Current role *" value={form.currentRole} onChangeText={(v) => setField("currentRole", v)} placeholder="e.g. Salesforce Administrator" />
          <Field label="Target role *" value={form.targetRole} onChangeText={(v) => setField("targetRole", v)} placeholder="e.g. RevOps Analyst" />
          <Field label="Industry" value={form.industry} onChangeText={(v) => setField("industry", v)} placeholder="e.g. SaaS" />
          <Field
            label="Years of experience"
            value={form.yearsExperience}
            onChangeText={(v) => setField("yearsExperience", v)}
            placeholder="5"
            keyboardType="numeric"
          />
          <Field label="Key skills" value={form.skills} onChangeText={(v) => setField("skills", v)} placeholder="Comma-separated" multiline />
          <Field label="Tools & platforms" value={form.tools} onChangeText={(v) => setField("tools", v)} placeholder="Salesforce, HubSpot…" multiline />
          <Field label="Career goal" value={form.careerGoal} onChangeText={(v) => setField("careerGoal", v)} placeholder="Optional — e.g. transition into AI/ML leadership" multiline />

          <View style={styles.labelRow}>
            <Text style={styles.inlineLabel}>Work preference</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="What is work preference and how does it affect your scan?"
              hitSlop={8}
              onPress={() => {
                const { title, message } = formatWorkPreferenceHelpAlert();
                Alert.alert(title, message);
              }}
              style={styles.helpBtn}
            >
              <Text style={styles.helpBtnText}>?</Text>
            </Pressable>
          </View>
          <View style={styles.chips}>
            {WORK_PREFS.map((pref) => {
              const active = form.workPreference === pref;
              return (
                <Pressable
                  key={pref}
                  onPress={() => setField("workPreference", pref)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{pref}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <PrimaryButton label="Run Career Scan" onPress={onSubmit} loading={submitting} />
        {scanCount > 0 ? (
          <SecondaryButton label="Scan history" onPress={() => navigation.navigate("ScanHistory")} />
        ) : null}
        <Disclaimer text={AI_DISCLAIMER} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: "600", marginTop: spacing.md, marginBottom: 6 },
  inlineLabel: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: 6,
  },
  helpBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.elevated,
  },
  helpBtnText: { color: colors.muted, fontSize: 11, fontWeight: "700", lineHeight: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.elevated,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: "rgba(0,180,255,0.12)" },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: colors.accent },
});
