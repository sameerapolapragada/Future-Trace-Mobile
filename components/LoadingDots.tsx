import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const DOT_COUNT = 3;
const DOT_SIZE = 7;
const ACTIVE_COLOR = "#3498DB";

export default function LoadingDots() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: DOT_COUNT,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  return (
    <View style={styles.row}>
      {Array.from({ length: DOT_COUNT }).map((_, index) => {
        const opacity = progress.interpolate({
          inputRange: [index - 0.5, index, index + 0.5],
          outputRange: [0.35, 1, 0.35],
          extrapolate: "clamp",
        });

        const scale = progress.interpolate({
          inputRange: [index - 0.5, index, index + 0.5],
          outputRange: [0.85, 1.15, 0.85],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity,
                transform: [{ scale }],
                backgroundColor: ACTIVE_COLOR,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginHorizontal: 5,
  },
});
