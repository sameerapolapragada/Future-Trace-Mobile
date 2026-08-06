import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing } from "../../lib/shared/theme";

export function Screen({ children, padded = true }: { children: React.ReactNode; padded?: boolean }) {
  return <View style={[styles.screen, padded && styles.padded]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  compact,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryBtnWrap,
        compact && styles.primaryBtnWrapCompact,
        (disabled || loading) && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}
    >
      <LinearGradient
        colors={[colors.accentPurple, colors.accentGold]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.primaryBtn}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.primaryBtnText}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}>
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  maxLength,
  autoCorrect,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "email-address";
  maxLength?: number;
  autoCorrect?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCorrect={autoCorrect}
        autoCapitalize={multiline ? "sentences" : "words"}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

export function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function Disclaimer({ text }: { text: string }) {
  return <Text style={styles.disclaimer}>{text}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { color: colors.text, fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  primaryBtnWrap: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    overflow: "hidden",
    shadowColor: colors.accentPurple,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryBtnWrapCompact: {
    marginTop: spacing.md,
  },
  primaryBtn: {
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.md,
  },
  secondaryBtnText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  btnDisabled: { opacity: 0.45 },
  btnPressed: { opacity: 0.85 },
  field: { marginTop: spacing.md },
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
  inputMultiline: { minHeight: 72, textAlignVertical: "top" },
  metricPill: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
  },
  metricValue: { color: colors.text, fontSize: 28, fontWeight: "700" },
  metricLabel: { color: colors.muted, fontSize: 10, marginTop: 4, textAlign: "center" },
  disclaimer: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing.lg, textAlign: "center" },
});
