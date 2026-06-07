import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import SplashScreen from "./components/SplashScreen";

export default function App() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {visible ? (
        <SplashScreen />
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0D17",
  },
  placeholder: {
    flex: 1,
    backgroundColor: "#0B0D17",
  },
});
