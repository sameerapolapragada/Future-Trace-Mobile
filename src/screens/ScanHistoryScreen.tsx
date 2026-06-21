import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { StoredScan } from "../../lib/shared";
import { colors, spacing } from "../../lib/shared/theme";
import { Card, PrimaryButton, SecondaryButton, Subtitle, Title } from "../components/ui";
import { listScans } from "../lib/scanStorage";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ScanHistory">;

function formatScanDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ScanHistoryScreen({ navigation }: Props) {
  const [scans, setScans] = useState<StoredScan[]>([]);

  useFocusEffect(
    useCallback(() => {
      listScans().then(setScans);
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>Scan History</Title>
        <Subtitle>Career Scans stored on this device only.</Subtitle>

        {scans.length === 0 ? (
          <Card>
            <Text style={styles.empty}>No scans yet. Run a Career Scan to see results here.</Text>
            <PrimaryButton label="Start Career Scan" onPress={() => navigation.navigate("MainTabs", { screen: "Scan" })} />
          </Card>
        ) : (
          <View style={styles.list}>
            {scans.map((scan) => (
              <Card key={scan.id}>
                <Text style={styles.roleLine}>
                  {scan.result.currentRole} → {scan.result.targetRole}
                </Text>
                <Text style={styles.date}>{formatScanDate(scan.createdAt)}</Text>
                <SecondaryButton
                  label="View results"
                  onPress={() => navigation.navigate("ScanResults", { scanId: scan.id })}
                />
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  list: { gap: spacing.md, marginTop: spacing.lg },
  roleLine: { color: colors.text, fontSize: 15, fontWeight: "600" },
  date: { color: colors.muted, fontSize: 12, marginTop: spacing.xs, marginBottom: spacing.sm },
  empty: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: spacing.md },
});
