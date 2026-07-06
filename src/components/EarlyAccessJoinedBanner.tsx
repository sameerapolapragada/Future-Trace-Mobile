import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { EARLY_ACCESS_JOINED_MESSAGE } from "../lib/scanStorage";
import { colors, radius, spacing } from "../../lib/shared/theme";

function CheckIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5 10 17.5 19 7.5"
        stroke={colors.success}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EarlyAccessJoinedBanner({ email }: { email?: string | null }) {
  return (
    <View style={styles.banner} accessibilityRole="text">
      <View style={styles.iconWrap}>
        <CheckIcon />
      </View>
      <Text style={styles.title}>You're on the Early Access list</Text>
      <Text style={styles.message}>{EARLY_ACCESS_JOINED_MESSAGE}</Text>
      {email ? <Text style={styles.email}>{email}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: `${colors.success}18`,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: `${colors.success}88`,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    shadowColor: colors.success,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.success}28`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.success,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  message: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    fontWeight: "600",
  },
  email: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
