import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../lib/shared/theme";
import { Card, PrimaryButton, SecondaryButton, Subtitle, Title } from "../components/ui";
import { deleteAllLocalData } from "../lib/scanStorage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "DeleteData">;

export function DeleteDataScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    Alert.alert(
      "Delete My Local Data?",
      "This removes Career Scans, welcome preferences, and any early access info saved on this device. This app does not use an account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteAllLocalData();
              Alert.alert("Local data deleted", "All data stored on this device has been cleared.", [
                { text: "OK", onPress: () => navigation.popToTop() },
              ]);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>Delete My Local Data</Title>
        <Subtitle>
          Clears scan history and preferences stored on this device. Future Trace MVP does not sync scans to the cloud
          and does not require a login.
        </Subtitle>

        <Card>
          <Text style={styles.cardBody}>
            If you joined Early Access, your submission may still exist on our server. Contact support to request
            removal.
          </Text>
        </Card>

        <PrimaryButton label="Delete My Local Data" onPress={onDelete} loading={loading} />
        <SecondaryButton label="Cancel" onPress={() => navigation.goBack()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
});
