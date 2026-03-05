export interface SettingsConfig {
  serviceName: string;
  startupBudgetMs: number;
}

export function getSettingsConfig(): SettingsConfig {
  return {
    serviceName: "codex-harness-demo",
    startupBudgetMs: 800
  };
}
