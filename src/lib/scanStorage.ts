import AsyncStorage from "@react-native-async-storage/async-storage";
import { type NormalizedScanInput, type StoredScan } from "../../lib/shared";

const SCANS_KEY = "ft_scans_v1";
const MAX_STORED_SCANS = 20;
const WELCOME_KEY = "ft_welcome_seen_v1";
const WAITLIST_EMAIL_KEY = "ft_waitlist_email_v1";
const WAITLIST_DRAFT_KEY = "ft_waitlist_draft_v1";
const WAITLIST_JOINED_KEY = "ft_waitlist_joined_v1";

export const EARLY_ACCESS_JOINED_MESSAGE =
  "You're on the Early Access list. We'll notify you when AI Career Transition launches.";

export type WaitlistDraft = {
  email: string;
  currentRole: string;
  targetRole: string;
};

function newId(): string {
  return `scan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function hasSeenWelcome(): Promise<boolean> {
  return (await AsyncStorage.getItem(WELCOME_KEY)) === "1";
}

export async function markWelcomeSeen(): Promise<void> {
  await AsyncStorage.setItem(WELCOME_KEY, "1");
}

export async function listScans(): Promise<StoredScan[]> {
  const raw = await AsyncStorage.getItem(SCANS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredScan[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
  } catch {
    return [];
  }
}

export async function getScan(id: string): Promise<StoredScan | null> {
  const scans = await listScans();
  return scans.find((s) => s.id === id) ?? null;
}

export async function saveScan(
  input: NormalizedScanInput,
  result: StoredScan["result"],
  roleMatchEventId?: string,
  source: StoredScan["source"] = "hybrid_v1"
): Promise<StoredScan> {
  const scan: StoredScan = {
    id: newId(),
    createdAt: new Date().toISOString(),
    input,
    result,
    source,
    roleMatchEventId,
  };
  const scans = await listScans();
  scans.unshift(scan);
  await AsyncStorage.setItem(SCANS_KEY, JSON.stringify(scans.slice(0, MAX_STORED_SCANS)));
  return scan;
}

/** Number of scans saved on this device. */
export async function getScanCount(): Promise<number> {
  const scans = await listScans();
  return scans.length;
}

/** Remove all locally saved Career Scan history. */
export async function deleteLocalScans(): Promise<void> {
  await AsyncStorage.removeItem(SCANS_KEY);
}

export async function getLatestScan(): Promise<StoredScan | null> {
  const scans = await listScans();
  return scans[0] ?? null;
}

export async function setWaitlistEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(WAITLIST_EMAIL_KEY, email.trim().toLowerCase());
}

export async function getWaitlistEmail(): Promise<string | null> {
  return AsyncStorage.getItem(WAITLIST_EMAIL_KEY);
}

export async function hasJoinedEarlyAccess(): Promise<boolean> {
  return (await AsyncStorage.getItem(WAITLIST_JOINED_KEY)) === "1";
}

export async function markEarlyAccessJoined(): Promise<void> {
  await AsyncStorage.setItem(WAITLIST_JOINED_KEY, "1");
}

export async function getWaitlistDraft(): Promise<WaitlistDraft | null> {
  const raw = await AsyncStorage.getItem(WAITLIST_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WaitlistDraft;
  } catch {
    return null;
  }
}

export async function setWaitlistDraft(draft: WaitlistDraft): Promise<void> {
  await AsyncStorage.setItem(WAITLIST_DRAFT_KEY, JSON.stringify(draft));
}

export async function deleteAllLocalData(): Promise<void> {
  await deleteLocalScans();
  await AsyncStorage.multiRemove([WELCOME_KEY, WAITLIST_EMAIL_KEY, WAITLIST_DRAFT_KEY, WAITLIST_JOINED_KEY]);
}
