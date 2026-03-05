import type { ReactElement } from "react";
import { useSettingsRuntime } from "../runtime/useSettingsRuntime";

export function SettingsDashboard(): ReactElement {
  const runtime = useSettingsRuntime();

  if (runtime.loading) {
    return <p className="status-banner">Loading harness pulse...</p>;
  }

  if (runtime.error || !runtime.snapshot) {
    return (
      <section className="panel panel-warning">
        <h2>Harness Signal Missing</h2>
        <p>{runtime.error ?? "No snapshot available."}</p>
        <button onClick={() => void runtime.refresh()}>Retry</button>
      </section>
    );
  }

  const { snapshot } = runtime;

  return (
    <section className={`panel ${snapshot.reliabilityTier === "healthy" ? "panel-good" : "panel-warning"}`}>
      <header>
        <h2>Critical Workflow Ready</h2>
        <p>{snapshot.serviceName}</p>
      </header>

      <div className="metric-grid">
        <article>
          <h3>Observed Startup</h3>
          <p>{snapshot.observedStartupMs} ms</p>
        </article>
        <article>
          <h3>Budget</h3>
          <p>{snapshot.startupBudgetMs} ms</p>
        </article>
        <article>
          <h3>Reliability Tier</h3>
          <p>{snapshot.reliabilityTier.toUpperCase()}</p>
        </article>
      </div>

      <ul>
        {snapshot.qualitySignals.map((signal) => (
          <li key={signal.label}>
            <strong>{signal.label}</strong>: {signal.value}
          </li>
        ))}
      </ul>

      <button onClick={() => void runtime.refresh()}>Refresh Signals</button>
    </section>
  );
}
