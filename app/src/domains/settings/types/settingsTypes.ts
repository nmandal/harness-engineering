export type ReliabilityTier = "healthy" | "degraded";

export interface QualitySignal {
  label: string;
  value: string;
}

export interface SettingsSnapshot {
  serviceName: string;
  startupBudgetMs: number;
  observedStartupMs: number;
  reliabilityTier: ReliabilityTier;
  qualitySignals: QualitySignal[];
}
