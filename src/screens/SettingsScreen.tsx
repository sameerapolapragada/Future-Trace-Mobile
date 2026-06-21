import { Linking, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PRIVACY_POLICY_HTML, TERMS_HTML } from "../../lib/shared/legal/content";
import { colors, spacing } from "../../lib/shared/theme";
import { Card, SecondaryButton, Subtitle, Title } from "../components/ui";
import { supportMailtoUrl } from "../lib/support";
import { useAppNavigation } from "../navigation/hooks";

export function SettingsScreen() {
  const navigation = useAppNavigation();

  async function openContactSupport() {
    const url = supportMailtoUrl();
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>Settings</Title>
        <Subtitle>Free Career Scan · No login required · No in-app purchases</Subtitle>

        <Card>
          <Text style={styles.cardTitle}>Career X-Ray — Early Access</Text>
          <Text style={styles.cardBody}>
            Personalized transition analysis is coming soon. Join Early Access to hear when it launches.
          </Text>
          <SecondaryButton label="Join Early Access" onPress={() => navigation.navigate("Waitlist")} />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Scan History</Text>
          <Text style={styles.cardBody}>View Career Scans saved on this device.</Text>
          <SecondaryButton label="Open Scan History" onPress={() => navigation.navigate("ScanHistory")} />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Support & Legal</Text>
          <SecondaryButton label="Contact Support" onPress={() => void openContactSupport()} />
          <SecondaryButton
            label="Privacy Policy"
            onPress={() => navigation.navigate("LegalWebView", { title: "Privacy Policy", html: PRIVACY_POLICY_HTML })}
          />
          <SecondaryButton
            label="Terms of Service"
            onPress={() => navigation.navigate("LegalWebView", { title: "Terms", html: TERMS_HTML })}
          />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Data on this device</Text>
          <Text style={styles.cardBody}>
            Scans and preferences are stored locally on your iPhone. No account or email is required for Career Scan.
            Email is collected only if you join Career X-Ray Early Access.
          </Text>
          <SecondaryButton label="Delete Local Data" onPress={() => navigation.navigate("DeleteData")} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.sm, marginBottom: spacing.sm },
});
