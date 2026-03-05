import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function observabilityPlugin(): Plugin {
  const serverStartedAt = Date.now();

  function readErrorCount(): number {
    const logFile = path.resolve(process.cwd(), "..", "artifacts", "runtime-errors.log");

    try {
      if (!fs.existsSync(logFile)) {
        return 0;
      }

      const contents = fs.readFileSync(logFile, "utf8").trim();
      if (contents.length === 0) {
        return 0;
      }

      return contents.split("\n").filter((line) => line.includes("ERROR")).length;
    } catch {
      return 0;
    }
  }

  function readUiSignal(): boolean {
    const sourceFile = path.resolve(process.cwd(), "src", "domains", "settings", "ui", "SettingsDashboard.tsx");

    try {
      if (!fs.existsSync(sourceFile)) {
        return false;
      }

      const source = fs.readFileSync(sourceFile, "utf8");
      return source.includes("Critical Workflow Ready");
    } catch {
      return false;
    }
  }

  return {
    name: "harness-observability",
    configureServer(server) {
      server.middlewares.use("/__obs", (req, res) => {
        const payload = {
          startupMs: Date.now() - serverStartedAt,
          errorCount: readErrorCount(),
          timestamp: new Date().toISOString()
        };

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(payload, null, 2));
      });

      server.middlewares.use("/__health", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true }, null, 2));
      });

      server.middlewares.use("/__dom", (_req, res) => {
        res.setHeader("Content-Type", "text/html");
        res.end(`<!doctype html><html><body><h1>Codex Harness DOM Snapshot</h1><p>Critical Workflow Ready</p></body></html>`);
      });

      server.middlewares.use("/__ui-check", (_req, res) => {
        const payload = {
          criticalWorkflowReady: readUiSignal(),
          timestamp: new Date().toISOString()
        };

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(payload, null, 2));
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), observabilityPlugin()]
});
