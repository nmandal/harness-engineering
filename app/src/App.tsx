import type { ReactElement } from "react";
import { SettingsDashboard } from "./domains/settings/ui/SettingsDashboard";

export function App(): ReactElement {
  return (
    <main className="stage">
      <aside className="intro">
        <p className="eyebrow">Codex Harness</p>
        <h1>Agent Legibility Control Surface</h1>
        <p>
          This demo app is intentionally small, but wired for worktree-aware runtime checks, UI evidence capture,
          and observability assertions.
        </p>
      </aside>

      <SettingsDashboard />
    </main>
  );
}
