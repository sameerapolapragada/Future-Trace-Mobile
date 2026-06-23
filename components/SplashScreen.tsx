import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/shared/theme";
import LoadingDots from "./LoadingDots";
import LogoMark from "./LogoMark";
import TraceBackground from "./TraceBackground";

export default function SplashScreen() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.86)).current;
  const logoTranslateY = useRef(new Animated.Value(12)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.92)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(10)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const logoEnter = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.back(1.35)),
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const titleEnter = Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const taglineEnter = Animated.timing(taglineOpacity, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -5,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const glowLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowScale, {
            toValue: 1.08,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 0.92,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.75,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.4,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    logoEnter.start();
    glowLoop.start();

    const titleTimer = setTimeout(() => titleEnter.start(), 350);
    const taglineTimer = setTimeout(() => taglineEnter.start(), 550);
    const floatTimer = setTimeout(() => floatLoop.start(), 750);

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(taglineTimer);
      clearTimeout(floatTimer);
      floatLoop.stop();
      glowLoop.stop();
    };
  }, [
    floatY,
    glowOpacity,
    glowScale,
    logoOpacity,
    logoScale,
    logoTranslateY,
    taglineOpacity,
    titleOpacity,
    titleTranslateY,
  ]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, "#0a0a0a", colors.background]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
        pointerEvents="none"
      />

      <TraceBackground />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { translateY: Animated.add(logoTranslateY, floatY) }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.logoGlowOuter,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.logoGlowInner,
              {
                opacity: glowOpacity,
                transform: [{ scale: Animated.multiply(glowScale, 0.92) }],
              },
            ]}
          />
          <LogoMark size={96} />
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          Future Trace
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Your AI Career Intelligence
        </Animated.Text>

        <LoadingDots />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(255, 85, 0, 0.14)",
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
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255, 85, 0, 0.14)",
  },
  logoGlowInner: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(0, 180, 255, 0.12)",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.text,
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
