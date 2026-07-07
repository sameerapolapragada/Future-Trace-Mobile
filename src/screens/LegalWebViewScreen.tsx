import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLayoutEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { colors, spacing } from "../../lib/shared/theme";
import { navigateBackToTab } from "../navigation/navigateBackToTab";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "LegalWebView">;

export function LegalWebViewScreen({ route, navigation }: Props) {
  const returnTab = route.params.returnTab;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          onPress={() => navigateBackToTab(navigation, returnTab)}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      ),
    });
  }, [navigation, returnTab]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.webWrap}>
        <WebView originWhitelist={["*"]} source={{ html: route.params.html }} style={styles.web} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  webWrap: { flex: 1 },
  web: { flex: 1, backgroundColor: colors.background },
  backBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  backText: { color: colors.accent, fontSize: 17, fontWeight: "600" },
  pressed: { opacity: 0.75 },
});
