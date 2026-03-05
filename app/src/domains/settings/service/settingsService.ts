import { getSettingsConfig } from "../config/settingsConfig";
import { createTimeProvider } from "../providers/timeProvider";
import { loadSettingsRepoRecord } from "../repo/settingsRepo";
import type { ReliabilityTier, SettingsSnapshot } from "../types/settingsTypes";

export async function loadSettingsSnapshot(): Promise<SettingsSnapshot> {
  const config = getSettingsConfig();
  const time = createTimeProvider();
  const start = time.now();
  const repo = await loadSettingsRepoRecord();
  const elapsed = time.now() - start;
  const observedStartupMs = Math.max(repo.observedStartupMs, elapsed);

  const reliabilityTier: ReliabilityTier =
    observedStartupMs <= config.startupBudgetMs ? "healthy" : "degraded";

  return {
    serviceName: config.serviceName,
    startupBudgetMs: config.startupBudgetMs,
    observedStartupMs,
    reliabilityTier,
    qualitySignals: repo.qualitySignals
  };
}
