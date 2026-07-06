import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { SecondaryButton, Subtitle, Title } from "../components/ui";
import { listLocalUnknownRoles } from "../lib/roleMatchService";
import { useEffect, useState } from "react";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "AdminUnknownRoles">;

type UnknownRoleRow = Awaited<ReturnType<typeof listLocalUnknownRoles>>[number];

export function AdminUnknownRolesScreen({ navigation }: Props) {
  const [rows, setRows] = useState<UnknownRoleRow[]>([]);

  useEffect(() => {
    listLocalUnknownRoles().then(setRows);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>Unknown Role Requests</Title>
        <Subtitle>
          Internal product intelligence view. Shows locally tracked unsupported roles from this device. Synced server
          data requires admin access via Supabase.
        </Subtitle>

        {rows.length === 0 ? (
          <Text style={styles.empty}>No unknown role requests tracked yet.</Text>
        ) : (
          rows.map((row) => (
            <View key={row.normalized_role_input ?? row.role_input} style={styles.row}>
              <Text style={styles.roleInput}>{row.role_input}</Text>
              <Text style={styles.meta}>Requested {row.times_requested}× · {row.match_status}</Text>
              {row.suggested_family ? <Text style={styles.meta}>Family: {row.suggested_family}</Text> : null}
              <Text style={styles.meta}>
                First: {new Date(row.first_seen).toLocaleDateString()} · Last:{" "}
                {new Date(row.last_seen).toLocaleDateString()} · {row.status}
              </Text>
            </View>
          ))
        )}

        <SecondaryButton label="Close" onPress={() => navigation.goBack()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: { color: colors.muted, marginVertical: spacing.lg },
  row: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.elevated,
  },
  roleInput: { color: colors.text, fontSize: 16, fontWeight: "600" },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
});
