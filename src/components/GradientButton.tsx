import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, radius, spacing } from "../../lib/shared/theme";

type GradientButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  compact?: boolean;
};

export function GradientButton({
  label,
  onPress,
  disabled,
  loading,
  style,
  compact,
}: GradientButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.wrap,
        compact && styles.wrapCompact,
        style,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={[colors.accentPurple, colors.accentGold]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.gradient, compact && styles.gradientCompact]}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    overflow: "hidden",
    shadowColor: colors.accentPurple,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  wrapCompact: { marginTop: 0 },
  gradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientCompact: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  labelCompact: {
    fontSize: 15,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.88 },
});
