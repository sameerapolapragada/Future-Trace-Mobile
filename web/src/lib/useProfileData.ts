import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
  fetchSavedScans,
  fetchUserProfile,
  type SavedScanSummary,
  type UserProfileRecord,
} from "./profileService";

export function useProfileData() {
  const { user, userId, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [scans, setScans] = useState<SavedScanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setScans([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [profileRow, scanRows] = await Promise.all([
        fetchUserProfile(userId),
        fetchSavedScans(userId),
      ]);
      setProfile(profileRow);
      setScans(scanRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
      setProfile(null);
      setScans([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      setScans([]);
      setLoading(false);
      setError(null);
      return;
    }

    void refresh();
  }, [isAuthenticated, user, refresh]);

  return { profile, scans, loading, error, refresh };
}

export type { SavedScanSummary, UserProfileRecord };
