import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  filterSupportedIndustries,
  isOtherRoleSelection,
  isSupportedIndustry,
  resolveScanFormRoleInput,
  SCAN_INPUT_LIMITS,
  SUPPORTED_INDUSTRY_OPTIONS,
  TECHNOLOGY_DOMAIN_MESSAGE,
  type ScanFormInput,
  validateScanContext,
} from "../../lib/shared";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { ScanFlowProgress } from "../components/ScanFlowProgress";
import { Field, PrimaryButton } from "../components/ui";
import { runRoleMatch } from "../lib/roleMatchService";
import {
  buildPendingScanInput,
  getPendingScanForm,
  setPendingRoleMatch,
  setPendingScanForm,
  setPendingScanInput,
} from "../lib/scanSession";
import {
  fetchTechnologyIndustries,
  recordTechnologyIndustrySelection,
} from "../lib/technologyIndustriesService";
import { recordTechnologyJobRoleSelection } from "../lib/technologyRolesService";
import { useAppNavigation } from "../navigation/hooks";

const YEARS_OPTIONS = [
  { label: "0–1 years", value: "1" },
  { label: "1–3 years", value: "3" },
  { label: "3–5 years", value: "5" },
  { label: "5–10 years", value: "8" },
  { label: "10+ years", value: "12" },
] as const;

function IndustryAutocomplete({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (next: string) => void;
  options: readonly string[];
}) {
  const [focused, setFocused] = useState(false);
  const suggestions = useMemo(() => filterSupportedIndustries(value, options), [value, options]);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>Industry</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Start typing an industry"
        placeholderTextColor={colors.muted}
        autoCapitalize="words"
        autoCorrect={false}
        style={styles.input}
      />
      {focused ? (
        <View style={styles.suggestionList}>
          {suggestions.length > 0 ? (
            suggestions.map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  onChange(option);
                  setFocused(false);
                }}
                style={styles.suggestionRow}
              >
                <Text style={styles.suggestionText}>{option}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.noMatch}>No matching industries. Pick from the suggested list.</Text>
          )}
        </View>
      ) : null}
      <Text style={styles.hint}>Required — choose from the suggested list.</Text>
    </View>
  );
}

export function ScanContextScreen() {
  const navigation = useAppNavigation();
  const existing = getPendingScanForm();
  const [dailyWork, setDailyWork] = useState(existing?.skills ?? "");
  const [industry, setIndustry] = useState(existing?.industry ?? "");
  const [yearsExperience, setYearsExperience] = useState(existing?.yearsExperience ?? "");
  const [certifications, setCertifications] = useState(existing?.tools ?? "");
  const [yearsOpen, setYearsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [industryOptions, setIndustryOptions] = useState<string[]>([...SUPPORTED_INDUSTRY_OPTIONS]);

  useFocusEffect(
    useCallback(() => {
      void fetchTechnologyIndustries().then(setIndustryOptions);
    }, [])
  );

  const yearsLabel =
    YEARS_OPTIONS.find((option) => option.value === yearsExperience)?.label ?? "e.g. 3+ years";

  async function onGenerate() {
    if (!existing?.currentRole?.trim()) {
      Alert.alert("Missing role", "Go back and enter your current role.");
      return;
    }

    const picklistValue = existing.currentRole.trim();
    const roleInput = resolveScanFormRoleInput(existing);
    const form: ScanFormInput = {
      currentRole: picklistValue,
      otherRoleName: isOtherRoleSelection(picklistValue) ? existing.otherRoleName : "",
      skills: dailyWork.trim(),
      industry: industry.trim(),
      yearsExperience: yearsExperience.trim(),
      tools: certifications.trim(),
    };

    const validationError = validateScanContext(form);
    if (validationError) {
      Alert.alert("Check your details", validationError.message);
      return;
    }

    if (!isSupportedIndustry(industry, industryOptions)) {
      Alert.alert("Check industry", TECHNOLOGY_DOMAIN_MESSAGE);
      return;
    }

    setSubmitting(true);
    try {
      setPendingScanForm({
        ...form,
        currentRole: picklistValue,
        otherRoleName: existing.otherRoleName,
        skills: dailyWork.trim(),
        industry: industry.trim(),
        yearsExperience: yearsExperience.trim(),
        tools: certifications.trim(),
      });

      const matchForm: ScanFormInput = {
        ...form,
        currentRole: roleInput,
      };

      const snapshot = await runRoleMatch({
        originalRoleInput: roleInput,
        industry: form.industry || undefined,
        yearsExperience: parseInt(form.yearsExperience, 10) || 0,
        skills: form.skills || undefined,
        tools: form.tools || undefined,
      });
      setPendingRoleMatch(snapshot);

      void recordTechnologyJobRoleSelection({
        selectedPicklistValue: picklistValue,
        roleInputForMatch: roleInput,
        match: snapshot,
      });
      void recordTechnologyIndustrySelection(form.industry);

      if (snapshot.outOfTechnologyDomain || snapshot.matchStatus === "no_match") {
        Alert.alert(
          "Technology roles only",
          "Please choose a supported technology role from the list, or enter a clearer tech job title under Other."
        );
        return;
      }

      if (snapshot.matchStatus === "matched") {
        const matchedRole = snapshot.normalizedRole ?? roleInput;
        setPendingScanInput(buildPendingScanInput(matchForm, matchedRole, snapshot, "auto_accepted"));
        navigation.navigate("ScanLoading");
        return;
      }

      if (snapshot.matchStatus === "partial_match") {
        navigation.navigate("ScanRoleConfirm");
        return;
      }

      navigation.navigate("ScanRoleNeedsInfo");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <ScanFlowProgress step={3} />
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Tell us a little about your work</Text>
        <Text style={styles.subtitle}>This helps our AI understand your experience better.</Text>

        <Field
          label="What do you do on a daily basis? *"
          value={dailyWork}
          onChangeText={setDailyWork}
          placeholder="e.g. Configure Salesforce workflows, support users, and report on CRM adoption"
          multiline
          maxLength={SCAN_INPUT_LIMITS.responsibilitiesMax}
        />
        <Text style={styles.hint}>
          Required — describe professional tasks, tools, or outcomes (not everyday activities).
        </Text>

        <IndustryAutocomplete value={industry} onChange={setIndustry} options={industryOptions} />

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Years of Experience *</Text>
          <Pressable style={styles.select} onPress={() => setYearsOpen(true)}>
            <Text style={[styles.selectText, !yearsExperience && styles.selectPlaceholder]}>
              {yearsLabel}
            </Text>
            <Text style={styles.chevron}>▾</Text>
          </Pressable>
        </View>

        <Field
          label="Certifications (Optional)"
          value={certifications}
          onChangeText={setCertifications}
          placeholder="e.g. Salesforce Admin, AWS, PMP"
          maxLength={SCAN_INPUT_LIMITS.certificationsMax}
          autoCorrect={false}
        />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Generate My Paths" onPress={onGenerate} loading={submitting} />
      </View>

      <Modal visible={yearsOpen} transparent animationType="fade" onRequestClose={() => setYearsOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setYearsOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Years of experience</Text>
            {YEARS_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  setYearsExperience(option.value);
                  setYearsOpen(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backText: { color: colors.accent, fontSize: 22, fontWeight: "600" },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  fieldWrap: { marginTop: spacing.md },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
  },
  hint: { color: colors.muted, fontSize: 12, marginTop: spacing.xs, fontStyle: "italic" },
  suggestionList: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.elevated,
    overflow: "hidden",
  },
  suggestionRow: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  noMatch: { color: colors.muted, fontSize: 13, padding: spacing.md, fontStyle: "italic" },
  select: {
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  selectPlaceholder: { color: colors.muted, fontWeight: "500" },
  chevron: { color: colors.muted, fontSize: 16 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalTitle: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: spacing.md },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: { color: colors.text, fontSize: 15, fontWeight: "600" },
});
