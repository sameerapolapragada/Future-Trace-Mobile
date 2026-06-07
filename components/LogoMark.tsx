import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Polygon,
  Stop,
} from "react-native-svg";

type LogoMarkProps = {
  size?: number;
};

export default function LogoMark({ size = 88 }: LogoMarkProps) {
  const strokeWidth = 2.2;

  return (
    <Svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      <Defs>
        <SvgGradient id="logoStroke" x1="12" y1="8" x2="76" y2="80">
          <Stop offset="0" stopColor="#5B8DEF" />
          <Stop offset="0.55" stopColor="#6B63E8" />
          <Stop offset="1" stopColor="#8B7CF6" />
        </SvgGradient>
        <SvgGradient id="arrowFill" x1="44" y1="28" x2="44" y2="58">
          <Stop offset="0" stopColor="#7EB8FF" />
          <Stop offset="1" stopColor="#5B7FE8" />
        </SvgGradient>
      </Defs>

      <Polygon
        points="44,10 72,26 72,62 44,78 16,62 16,26"
        stroke="url(#logoStroke)"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill="rgba(77, 71, 194, 0.06)"
      />

      <Path
        d="M44 30 L44 54 M44 30 L36 38 M44 30 L52 38"
        stroke="url(#arrowFill)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
