import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import SplashScreen from "./components/SplashScreen";
import { colors } from "./lib/shared/theme";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { hasSeenWelcome } from "./src/lib/scanStorage";

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

export default function App() {
  const [booting, setBooting] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const [seenWelcome] = await Promise.all([
        hasSeenWelcome(),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ]);
      if (!mounted) return;
      setShowWelcome(!seenWelcome);
      setBooting(false);
    }

    boot();
    return () => {
      mounted = false;
    };
  }, []);

  if (booting) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <SplashScreen />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <RootNavigator showWelcome={showWelcome} />
    </NavigationContainer>
  );
}
