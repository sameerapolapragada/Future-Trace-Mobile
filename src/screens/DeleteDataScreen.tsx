import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLayoutEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../lib/shared/theme";
import { Card, PrimaryButton, SecondaryButton, Subtitle, Title } from "../components/ui";
import { deleteAllLocalData, deleteLocalScans } from "../lib/scanStorage";
import { navigateBackToTab } from "../navigation/navigateBackToTab";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "DeleteData">;

export function DeleteDataScreen({ navigation, route }: Props) {
  const returnTab = route.params?.returnTab;
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          onPress={() => navigateBackToTab(navigation, returnTab)}
          hitSlop={12}
          style={({ pressed }) => [headerStyles.backBtn, pressed && headerStyles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={headerStyles.backText}>← Back</Text>
        </Pressable>
      ),
    });
  }, [navigation, returnTab]);

  async function onDeleteScansOnly() {
    Alert.alert(
      "Delete local scan history?",
      "This removes all Career Scans saved on this device. Your Early Access info and app preferences are kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete scans",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteLocalScans();
              Alert.alert("Scan history deleted", "Local Career Scans have been removed from this device.", [
                { text: "OK", onPress: () => navigateBackToTab(navigation, returnTab) },
              ]);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  async function onDeleteAll() {
    Alert.alert(
      "Delete My Local Data?",
      "This removes Career Scans, welcome preferences, and any Early Access info saved on this device. No account is used in this app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete all",
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
            Career Scans never leave your device unless you voluntarily join Early Access (email only). If you joined
            Early Access, that submission may still exist on our server — contact support to request removal.
          </Text>
        </Card>

        <PrimaryButton label="Delete Local Scan History" onPress={onDeleteScansOnly} loading={loading} />
        <SecondaryButton label="Delete All Local Data" onPress={onDeleteAll} />
        <SecondaryButton label="Cancel" onPress={() => navigateBackToTab(navigation, returnTab)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
});

const headerStyles = StyleSheet.create({
  backBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  backText: { color: colors.accent, fontSize: 17, fontWeight: "600" },
  pressed: { opacity: 0.75 },
});
