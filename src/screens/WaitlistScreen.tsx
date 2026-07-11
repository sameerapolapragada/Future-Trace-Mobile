import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AI_DISCLAIMER } from "../../lib/shared/legal/content";
import { colors, spacing } from "../../lib/shared/theme";
import { EarlyAccessJoinedBanner } from "../components/EarlyAccessJoinedBanner";
import { Card, Disclaimer, Field, PrimaryButton, Subtitle, Title } from "../components/ui";
import {
  getLatestScan,
  getWaitlistDraft,
  getWaitlistEmail,
  hasJoinedEarlyAccess,
  markEarlyAccessJoined,
  setWaitlistDraft,
  setWaitlistEmail,
} from "../lib/scanStorage";
import { submitWaitlistEntrySafe } from "../lib/waitlistService";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Waitlist">;

export function WaitlistScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinedEmail, setJoinedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hasJoinedEarlyAccess().then((isJoined) => {
      setJoined(isJoined);
      if (isJoined) {
        getWaitlistEmail().then(setJoinedEmail);
        return;
      }

      getWaitlistDraft().then((draft) => {
        if (draft) {
          setEmail(draft.email);
          setCurrentRole(draft.currentRole);
          setTargetRole(draft.targetRole);
          return;
        }
        getWaitlistEmail().then((saved) => {
          if (saved) setEmail(saved);
        });
      });
      getLatestScan().then((scan) => {
        if (!scan) return;
        setCurrentRole((prev) => prev || scan.result.identifiedCareerProfile || scan.result.currentRole);
        setTargetRole((prev) => prev || scan.result.targetRole);
      });
    });
  }, []);

  async function persistDraft(next?: { email?: string; currentRole?: string; targetRole?: string }) {
    const draft = {
      email: next?.email ?? email,
      currentRole: next?.currentRole ?? currentRole,
      targetRole: next?.targetRole ?? targetRole,
    };
    await setWaitlistDraft(draft);
  }

  async function onSubmit() {
    setLoading(true);
    setError(null);

    const draft = { email, currentRole, targetRole };
    await setWaitlistDraft(draft);

    const result = await submitWaitlistEntrySafe({
      email,
      currentRole,
      targetRole,
      source: "ios_app",
    });

    if (result.ok) {
      await setWaitlistEmail(email);
      await markEarlyAccessJoined();
      setJoinedEmail(email.trim().toLowerCase());
      setJoined(true);
    } else {
      setError(result.message);
    }

    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backLabel}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Title>AI Career Transition — Early Access</Title>
        <Subtitle>
          Coming soon — a weekly roadmap to move into your next role. No charge today. Join Early Access to get
          notified at launch.
        </Subtitle>

        {joined ? (
          <EarlyAccessJoinedBanner email={joinedEmail} />
        ) : (
          <>
            <Card>
              <Text style={styles.cardBody}>
                Share your email and roles so we can notify you when AI Career Transition is ready.
              </Text>
              <Field
                label="Email *"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  void persistDraft({ email: v });
                }}
                placeholder="you@company.com"
                keyboardType="email-address"
              />
              <Field
                label="Current role *"
                value={currentRole}
                onChangeText={(v) => {
                  setCurrentRole(v);
                  void persistDraft({ currentRole: v });
                }}
                placeholder="e.g. Salesforce Administrator"
              />
              <Field
                label="Next role of interest *"
                value={targetRole}
                onChangeText={(v) => {
                  setTargetRole(v);
                  void persistDraft({ targetRole: v });
                }}
                placeholder="e.g. Salesforce AI Administrator"
              />
            </Card>

            <PrimaryButton label="Join Early Access" onPress={onSubmit} loading={loading} />

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        )}

        <Disclaimer text={AI_DISCLAIMER} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  backButton: { alignSelf: "flex-start" },
  backLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "500",
  },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: spacing.sm },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: spacing.md },
  pressed: { opacity: 0.75 },
});
