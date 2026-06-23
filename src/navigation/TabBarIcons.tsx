import Svg, { Circle, Path, Rect } from "react-native-svg";
import { colors } from "../../lib/shared/theme";

type TabIconProps = {
  active: boolean;
  color: string;
};

export function HomeTabIcon({ active, color }: TabIconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
        fill={active ? color : "none"}
        stroke={color}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

export function ScanTabIcon({ active, color }: TabIconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.8} />
      {active ? <Circle cx={12} cy={12} r={1.5} fill={color} /> : null}
    </Svg>
  );
}

export function TransitionTabIcon({ active, color }: TabIconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M13 6l6 6-6 6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {active ? <Circle cx={12} cy={12} r={9} fill={color} opacity={0.18} /> : null}
    </Svg>
  );
}

export function ProfileTabIcon({ active, color }: TabIconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} fill={active ? color : "none"} stroke={color} strokeWidth={1.8} />
      <Path d="M5 20c0-4 3.5-6 7-6s7 2 7 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function tabIconColor(active: boolean): string {
  return active ? colors.accent : colors.muted;
}
