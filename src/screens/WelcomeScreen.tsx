import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LogoMark from "../../components/LogoMark";
import { AI_DISCLAIMER } from "../../lib/shared/legal/content";
import { colors, spacing } from "../../lib/shared/theme";
import { Card, Disclaimer, PrimaryButton, Subtitle, Title } from "../components/ui";
import { markWelcomeSeen } from "../lib/scanStorage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  async function continueToApp() {
    await markWelcomeSeen();
    navigation.replace("MainTabs");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <LogoMark size={72} />
        <Title>Future Trace</Title>
        <Subtitle>Navigate your career through the AI era with informational scans and disruption insights.</Subtitle>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Find my next roles</Text>
        <Text style={styles.cardBody}>
          Enter your current role and get top next-step careers on your device — with salary estimates, transferable
          skills, and transition time. No login required.
        </Text>
      </Card>

      <PrimaryButton label="Get started" onPress={continueToApp} />
      <Disclaimer text={AI_DISCLAIMER} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  hero: { alignItems: "center", marginTop: spacing.xxl, gap: spacing.md },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
});
