import { useEffect, useState } from "react";
import { loadSettingsSnapshot } from "../service/settingsService";
import type { SettingsSnapshot } from "../types/settingsTypes";

interface SettingsRuntime {
  snapshot: SettingsSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
}

export function useSettingsRuntime(): SettingsRuntime {
  const [snapshot, setSnapshot] = useState<SettingsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const next = await loadSettingsSnapshot();
      setSnapshot(next);
    } catch {
      setError("Unable to load settings snapshot.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return {
    snapshot,
    loading,
    error,
    refresh
  };
}
