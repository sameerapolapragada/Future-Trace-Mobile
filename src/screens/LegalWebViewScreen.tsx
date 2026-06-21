import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { colors } from "../../lib/shared/theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "LegalWebView">;

export function LegalWebViewScreen({ route }: Props) {
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
});
