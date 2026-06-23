import { Image, StyleSheet } from "react-native";

type LogoMarkProps = {
  size?: number;
};

export default function LogoMark({ size = 36 }: LogoMarkProps) {
  return (
    <Image
      source={require("../assets/logo.png")}
      accessibilityLabel="Future Trace"
      style={[styles.logo, { height: size, width: size * 1.05 }]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    resizeMode: "contain",
  },
});
