import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, radius, spacing } from "../../lib/shared/theme";
import { Field, PrimaryButton } from "./ui";
import { EarlyAccessJoinedBanner } from "./EarlyAccessJoinedBanner";
import {
  getWaitlistDraft,
  getWaitlistEmail,
  hasJoinedEarlyAccess,
  markEarlyAccessJoined,
  setWaitlistDraft,
  setWaitlistEmail,
} from "../lib/scanStorage";
import { submitWaitlistEntrySafe } from "../lib/waitlistService";

function RocketIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 14c3-2 5-5 5-9-4 0-7 2-9 5 1 3 2 5 4 4z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M9 15 6 18M15 15l3 3M10 10l-2 4 4-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11h14v10H5z" stroke={color} strokeWidth={2} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function EarlyAccessSignupCard({
  title,
  body,
  source,
  defaultCurrentRole = "",
  defaultTargetRole = "",
}: {
  title: string;
  body: string;
  source: string;
  defaultCurrentRole?: string;
  defaultTargetRole?: string;
}) {
  const [email, setEmail] = useState("");
  const [currentRole, setCurrentRole] = useState(defaultCurrentRole);
  const [targetRole, setTargetRole] = useState(defaultTargetRole);
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinedEmail, setJoinedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setCurrentRole((prev) => prev || defaultCurrentRole);
      setTargetRole((prev) => prev || defaultTargetRole);

      hasJoinedEarlyAccess().then((isJoined) => {
        setJoined(isJoined);
        if (isJoined) {
          getWaitlistEmail().then(setJoinedEmail);
          return;
        }

        getWaitlistDraft().then((draft) => {
          if (draft) {
            if (draft.email) setEmail(draft.email);
            if (draft.currentRole) setCurrentRole(draft.currentRole);
            if (draft.targetRole) setTargetRole(draft.targetRole);
            return;
          }
          getWaitlistEmail().then((saved) => {
            if (saved) setEmail(saved);
          });
        });
      });
    }, [defaultCurrentRole, defaultTargetRole])
  );

  async function persistDraft(next?: { email?: string; currentRole?: string; targetRole?: string }) {
    await setWaitlistDraft({
      email: next?.email ?? email,
      currentRole: next?.currentRole ?? currentRole,
      targetRole: next?.targetRole ?? targetRole,
    });
  }

  async function onJoin() {
    setLoading(true);
    setError(null);

    await setWaitlistDraft({ email, currentRole, targetRole });

    const result = await submitWaitlistEntrySafe({
      email,
      currentRole,
      targetRole,
      source,
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
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <RocketIcon color={colors.accentPurple} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>
      </View>

      {joined ? (
        <EarlyAccessJoinedBanner email={joinedEmail} />
      ) : (
        <>
          <Field
            label="Email *"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              void persistDraft({ email: value });
            }}
            placeholder="Enter your email"
            keyboardType="email-address"
          />
          <Field
            label="Current role *"
            value={currentRole}
            onChangeText={(value) => {
              setCurrentRole(value);
              void persistDraft({ currentRole: value });
            }}
            placeholder="e.g. Salesforce Administrator"
          />
          <Field
            label="Target role *"
            value={targetRole}
            onChangeText={(value) => {
              setTargetRole(value);
              void persistDraft({ targetRole: value });
            }}
            placeholder="e.g. Salesforce AI Administrator"
          />

          <PrimaryButton label="Join Early Access" onPress={onJoin} loading={loading} compact />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.footer}>
            <LockIcon color={colors.muted} />
            <Text style={styles.footerText}>No spam. Unsubscribe anytime.</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: `${colors.accentPurple}14`,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.accentPurple}44`,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.accentPurple}22`,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  body: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  error: { color: colors.danger, fontSize: 12, lineHeight: 18, textAlign: "center" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  footerText: { color: colors.muted, fontSize: 11 },
});
