import { Dimensions, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";

const { width, height } = Dimensions.get("window");

const TRACES = [
  { d: "M -20 180 Q 80 120, 160 200 T 340 160", opacity: 0.55 },
  { d: "M 40 320 Q 140 260, 220 340 T 420 300", opacity: 0.47 },
  { d: "M -10 480 Q 120 420, 200 500 T 380 460", opacity: 0.39 },
  { d: "M 60 620 Q 180 560, 260 640 T 440 600", opacity: 0.31 },
];

const NODES = [
  { cx: 48, cy: 210, r: 2.2 },
  { cx: 132, cy: 178, r: 1.8 },
  { cx: 228, cy: 248, r: 2 },
  { cx: 312, cy: 198, r: 1.6 },
  { cx: 88, cy: 352, r: 1.8 },
  { cx: 196, cy: 318, r: 2.2 },
  { cx: 284, cy: 388, r: 1.6 },
  { cx: 372, cy: 332, r: 2 },
  { cx: 120, cy: 528, r: 1.8 },
  { cx: 248, cy: 492, r: 2.2 },
  { cx: 340, cy: 562, r: 1.6 },
];

export default function TraceBackground() {
  const viewW = width;
  const viewH = height;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width={viewW} height={viewH} viewBox={`0 0 ${390} ${844}`}>
        <Defs>
          <RadialGradient id="fade" cx="50%" cy="38%" r="65%">
            <Stop offset="0%" stopColor="#0B0D17" stopOpacity="0" />
            <Stop offset="100%" stopColor="#0B0D17" stopOpacity="0.9" />
          </RadialGradient>
        </Defs>

        {TRACES.map((trace) => (
          <Path
            key={trace.d}
            d={trace.d}
            stroke="rgba(91, 141, 239, 0.16)"
            strokeWidth={1.1}
            fill="none"
            strokeDasharray="2 10"
            opacity={trace.opacity}
          />
        ))}

        {NODES.map((node) => (
          <Circle
            key={`${node.cx}-${node.cy}`}
            cx={node.cx}
            cy={node.cy}
            r={node.r}
            fill="rgba(120, 170, 255, 0.2)"
          />
        ))}

        <Path d="M 0 0 H 390 V 844 H 0 Z" fill="url(#fade)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
  },
});
