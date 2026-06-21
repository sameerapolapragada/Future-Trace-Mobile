import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AI_DISCLAIMER } from "../../lib/shared/legal/content";
import { colors, spacing } from "../../lib/shared/theme";
import { Card, Disclaimer, Field, PrimaryButton, Subtitle, Title } from "../components/ui";
import { getLatestScan, getWaitlistDraft, getWaitlistEmail, setWaitlistDraft, setWaitlistEmail } from "../lib/scanStorage";
import { submitWaitlistEntrySafe } from "../lib/waitlistService";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Waitlist">;

export function WaitlistScreen(_props: Props) {
  const [email, setEmail] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
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
      setCurrentRole((prev) => prev || scan.result.currentRole);
      setTargetRole((prev) => prev || scan.result.targetRole);
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
    setNotice(null);

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
      setSubmitted(true);
      setNotice("You're on the Early Access list. We'll notify you when Career X-Ray launches.");
    } else {
      await setWaitlistEmail(email);
      setNotice(result.message);
    }

    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Title>Career X-Ray — Early Access</Title>
        <Subtitle>
          Coming soon — deep transition analysis for your career path. No charge today. Join Early Access to get
          notified at launch.
        </Subtitle>

        <Card>
          <Text style={styles.cardBody}>
            Share your email and roles so we can notify you when Career X-Ray is ready.
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
            label="Current role"
            value={currentRole}
            onChangeText={(v) => {
              setCurrentRole(v);
              void persistDraft({ currentRole: v });
            }}
            placeholder="Optional"
          />
          <Field
            label="Target role"
            value={targetRole}
            onChangeText={(v) => {
              setTargetRole(v);
              void persistDraft({ targetRole: v });
            }}
            placeholder="Optional"
          />
        </Card>

        <PrimaryButton label={submitted ? "Update Early Access" : "Join Early Access"} onPress={onSubmit} loading={loading} />

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <Disclaimer text={AI_DISCLAIMER} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: spacing.sm },
  notice: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: spacing.md },
});
