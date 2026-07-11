import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  filterTechnologyCurrentRoles,
  isOtherRoleSelection,
  isTechnologyCurrentRole,
  OTHER_ROLE_OPTION,
  resolveScanFormRoleInput,
  TECHNOLOGY_DOMAIN_MESSAGE,
  TECHNOLOGY_CURRENT_ROLES,
  SUPPORTED_INDUSTRY_OPTIONS,
  type ScanFormInput,
  validateScanForm,
} from "../../lib/shared";
import { AI_DISCLAIMER } from "../../lib/shared/legal/content";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { Card, Disclaimer, Field, PrimaryButton, SecondaryButton, Subtitle, Title } from "../components/ui";
import { getScanCount } from "../lib/scanStorage";
import { runRoleMatch } from "../lib/roleMatchService";
import { setPendingScanForm, setPendingRoleMatch } from "../lib/scanSession";
import {
  fetchTechnologyIndustries,
  recordTechnologyIndustrySelection,
} from "../lib/technologyIndustriesService";
import {
  fetchTechnologyJobRoles,
  recordTechnologyJobRoleSelection,
} from "../lib/technologyRolesService";
import { useAppNavigation } from "../navigation/hooks";

const EMPTY: ScanFormInput = {
  currentRole: "",
  otherRoleName: "",
  industry: "",
  yearsExperience: "",
  skills: "",
  tools: "",
};

function IndustryPicker({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (next: string) => void;
  options: readonly string[];
}) {
  return (
    <View style={styles.picker}>
      <Text style={styles.pickerLabel}>Industry / domain (optional)</Text>
      <View style={styles.optionList}>
        {options.map((option) => {
          const active = value === option;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(active ? "" : option)}
              style={[styles.option, active && styles.optionActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function RoleAutocomplete({
  value,
  roles,
  onChange,
}: {
  value: string;
  roles: readonly string[];
  onChange: (next: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const suggestions = useMemo(
    () => filterTechnologyCurrentRoles(value, roles),
    [value, roles]
  );
  const showSuggestions =
    focused && !isTechnologyCurrentRole(value, roles) && !isOtherRoleSelection(value);

  return (
    <View style={styles.picker}>
      <Text style={styles.pickerLabel}>Current role *</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setTimeout(() => setFocused(false), 150);
        }}
        placeholder="Start typing a technology role"
        placeholderTextColor={colors.muted}
        autoCapitalize="words"
        autoCorrect={false}
        style={styles.input}
      />
      {showSuggestions ? (
        <View style={styles.suggestionList}>
          {suggestions.map((role) => (
            <Pressable
              key={role}
              onPress={() => {
                onChange(role);
                setFocused(false);
              }}
              style={styles.suggestionRow}
            >
              <Text
                style={[
                  styles.suggestionText,
                  isOtherRoleSelection(role) && styles.suggestionOther,
                ]}
              >
                {role}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ScanFormScreen() {
  const navigation = useAppNavigation();
  const [form, setForm] = useState<ScanFormInput>(EMPTY);
  const [roleOptions, setRoleOptions] = useState<string[]>([...TECHNOLOGY_CURRENT_ROLES]);
  const [industryOptions, setIndustryOptions] = useState<string[]>([...SUPPORTED_INDUSTRY_OPTIONS]);
  const [submitting, setSubmitting] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const otherSelected = isOtherRoleSelection(form.currentRole);

  useFocusEffect(
    useCallback(() => {
      getScanCount().then(setScanCount);
      void fetchTechnologyJobRoles().then(setRoleOptions);
      void fetchTechnologyIndustries().then(setIndustryOptions);
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

    const picklistValue = form.currentRole.trim();
    const roleInput = resolveScanFormRoleInput(form);
    const pendingForm: ScanFormInput = {
      ...form,
      currentRole: roleInput,
      otherRoleName: otherSelected ? form.otherRoleName : undefined,
    };

    setSubmitting(true);
    try {
      setPendingScanForm(pendingForm);
      const snapshot = await runRoleMatch({
        originalRoleInput: roleInput,
        industry: form.industry.trim() || undefined,
        yearsExperience: parseInt(form.yearsExperience, 10) || 0,
        skills: form.skills.trim() || undefined,
        tools: form.tools.trim() || undefined,
      });
      setPendingRoleMatch(snapshot);

      void recordTechnologyJobRoleSelection({
        selectedPicklistValue: picklistValue,
        roleInputForMatch: roleInput,
        match: snapshot,
      });
      void recordTechnologyIndustrySelection(form.industry);

      if (snapshot.outOfTechnologyDomain) {
        Alert.alert("Technology domain required", TECHNOLOGY_DOMAIN_MESSAGE);
        return;
      }

      if (snapshot.matchStatus === "matched") {
        navigation.navigate("ScanReviewRole");
      } else if (snapshot.matchStatus === "partial_match") {
        navigation.navigate("ScanRoleConfirm");
      } else {
        navigation.navigate("ScanRoleNeedsInfo");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Title>Find Your Next Roles</Title>
        <Subtitle>
          Start typing your current technology role and pick from the suggestions. Can&apos;t find it? Choose{" "}
          {OTHER_ROLE_OPTION} and enter your title — we&apos;ll try to match it.
        </Subtitle>

        <Card>
          <RoleAutocomplete
            value={form.currentRole}
            roles={roleOptions}
            onChange={(role) => {
              setForm((prev) => ({
                ...prev,
                currentRole: role,
                otherRoleName: isOtherRoleSelection(role) ? prev.otherRoleName ?? "" : "",
              }));
            }}
          />
          <Text style={styles.fieldHint}>Suggestions appear A–Z as you type. Pick one to continue.</Text>

          {otherSelected ? (
            <>
              <Field
                label="Role name *"
                value={form.otherRoleName ?? ""}
                onChangeText={(v) => setField("otherRoleName", v)}
                placeholder="e.g. Revenue Operations Manager"
              />
              <Text style={styles.fieldHint}>
                We&apos;ll match this against supported technology roles when possible.
              </Text>
            </>
          ) : null}

          <IndustryPicker
            value={form.industry}
            onChange={(industry) => setField("industry", industry)}
            options={industryOptions}
          />
          <Text style={styles.fieldHint}>Optional — helps tailor recommendations when provided.</Text>

          <Field
            label="Years of experience (optional)"
            value={form.yearsExperience}
            onChangeText={(v) => setField("yearsExperience", v)}
            placeholder="5"
            keyboardType="numeric"
          />
          <Field
            label="Key skills (optional)"
            value={form.skills}
            onChangeText={(v) => setField("skills", v)}
            placeholder="Comma-separated"
            multiline
          />
          <Field
            label="Tools & platforms (optional)"
            value={form.tools}
            onChangeText={(v) => setField("tools", v)}
            placeholder="Salesforce, HubSpot…"
            multiline
          />
        </Card>

        <PrimaryButton label="Find my next roles" onPress={onSubmit} loading={submitting} />
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
  fieldHint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    fontStyle: "italic",
  },
  picker: { marginTop: spacing.md },
  pickerLabel: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
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
  suggestionOther: { color: colors.accent, fontStyle: "italic" },
  optionList: { gap: spacing.sm },
  option: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.elevated,
  },
  optionActive: { borderColor: colors.accent, backgroundColor: "rgba(0,180,255,0.1)" },
  optionText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  optionTextActive: { color: colors.accent },
});
