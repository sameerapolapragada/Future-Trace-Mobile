import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import LoadingDots from "./LoadingDots";
import LogoMark from "./LogoMark";
import TraceBackground from "./TraceBackground";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0B0D17", "#121528", "#0B0D17"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.glow} pointerEvents="none" />

      <TraceBackground />

      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <View style={styles.logoGlowOuter} />
          <View style={styles.logoGlowInner} />
          <LogoMark size={88} />
        </View>

        <Text style={styles.title}>Future Trace</Text>
        <Text style={styles.tagline}>
          Navigate your career through the AI era
        </Text>

        <LoadingDots />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0D17",
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(77, 71, 194, 0.12)",
    top: "32%",
    alignSelf: "center",
    transform: [{ translateY: -80 }],
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
    zIndex: 2,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  logoGlowOuter: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(77, 71, 194, 0.14)",
  },
  logoGlowInner: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(52, 152, 219, 0.1)",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.6,
    marginBottom: 12,
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.78)",
    letterSpacing: 0.2,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: 40,
  },
});
