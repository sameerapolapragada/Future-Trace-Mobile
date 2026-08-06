import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  filterTechnologyCurrentRoles,
  isOtherRoleSelection,
  isTechnologyCurrentRole,
  OTHER_ROLE_OPTION,
  SCAN_INPUT_LIMITS,
  TECHNOLOGY_CURRENT_ROLES,
  type ScanFormInput,
  validateScanForm,
} from "../../lib/shared";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { ScanFlowProgress } from "../components/ScanFlowProgress";
import { Field, PrimaryButton } from "../components/ui";
import { getPendingScanForm, setPendingScanForm } from "../lib/scanSession";
import { fetchTechnologyJobRoles } from "../lib/technologyRolesService";
import { useAppNavigation } from "../navigation/hooks";

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
  const suggestions = useMemo(() => filterTechnologyCurrentRoles(value, roles), [value, roles]);
  const showSuggestions =
    focused && !isTechnologyCurrentRole(value, roles) && !isOtherRoleSelection(value);

  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="e.g. Salesforce Administrator"
        placeholderTextColor={colors.muted}
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={SCAN_INPUT_LIMITS.jobTitleMax}
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
                style={[styles.suggestionText, isOtherRoleSelection(role) && styles.suggestionOther]}
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

export function ScanCurrentRoleScreen() {
  const navigation = useAppNavigation();
  const existing = getPendingScanForm();
  const [currentRole, setCurrentRole] = useState(existing?.currentRole ?? "");
  const [otherRoleName, setOtherRoleName] = useState(existing?.otherRoleName ?? "");
  const [roleOptions, setRoleOptions] = useState<string[]>([...TECHNOLOGY_CURRENT_ROLES]);
  const otherSelected = isOtherRoleSelection(currentRole);

  useFocusEffect(
    useCallback(() => {
      void fetchTechnologyJobRoles().then(setRoleOptions);
    }, [])
  );

  function onContinue() {
    const draft: ScanFormInput = {
      currentRole,
      otherRoleName: otherSelected ? otherRoleName : "",
      industry: existing?.industry ?? "",
      yearsExperience: existing?.yearsExperience ?? "",
      skills: existing?.skills ?? "",
      tools: existing?.tools ?? "",
    };
    const error = validateScanForm(draft);
    if (error) {
      Alert.alert("Check your role", error.message);
      return;
    }
    setPendingScanForm(draft);
    navigation.navigate("ScanContext");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <ScanFlowProgress step={2} />
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>What is your current role?</Text>
        <RoleAutocomplete
          value={currentRole}
          roles={roleOptions}
          onChange={(role) => {
            setCurrentRole(role);
            if (!isOtherRoleSelection(role)) setOtherRoleName("");
          }}
        />
        <Text style={styles.hint}>
          Start typing and pick a technology role{otherSelected ? "" : `, or choose ${OTHER_ROLE_OPTION}`}.
        </Text>

        {otherSelected ? (
          <Field
            label="Role name *"
            value={otherRoleName}
            onChangeText={setOtherRoleName}
            placeholder="e.g. Revenue Operations Manager"
            maxLength={SCAN_INPUT_LIMITS.jobTitleMax}
            autoCorrect={false}
          />
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Continue" onPress={onContinue} />
      </View>
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
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    fontSize: 16,
  },
  hint: { color: colors.muted, fontSize: 13, marginTop: spacing.sm, fontStyle: "italic" },
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
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
});
