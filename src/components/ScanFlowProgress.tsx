import { StyleSheet, View } from "react-native";
import { colors } from "../../lib/shared/theme";

/** 4-step flow: 1 Intro · 2 Role · 3 Context · 4 Analyzing */
export function ScanFlowProgress({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <View style={styles.row} accessibilityRole="progressbar">
      {[1, 2, 3, 4].map((n, index) => {
        const active = n <= step;
        return (
          <View key={n} style={styles.segment}>
            {index > 0 ? <View style={[styles.line, active && styles.lineActive]} /> : null}
            <View style={[styles.dot, active && styles.dotActive]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  segment: {
    flexDirection: "row",
    alignItems: "center",
  },
  line: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginHorizontal: 2,
  },
  lineActive: {
    backgroundColor: colors.accentPurple,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accentPurple,
  },
});
