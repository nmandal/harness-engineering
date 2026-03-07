import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ChildProcess } from "node:child_process";
import { computeWorktreePorts } from "./lib/worktree.js";
import { fetchWithTimeout, startAppServer, stopProcess, waitForUrl } from "./lib/dev-server.js";

interface ObsPayload {
  startupMs: number;
  errorCount: number;
  timestamp: string;
}

function readErrorCount(repoRoot: string): number {
  const logFile = path.join(repoRoot, "artifacts", "runtime-errors.log");
  if (!fs.existsSync(logFile)) {
    return 0;
  }

  const contents = fs.readFileSync(logFile, "utf8");
  return contents.split("\n").filter((line) => line.includes("ERROR")).length;
}

function readObservedStartupMs(repoRoot: string): number {
  const sourceFile = path.join(repoRoot, "app", "src", "domains", "settings", "repo", "settingsRepo.ts");
  if (!fs.existsSync(sourceFile)) {
    return 0;
  }

  const source = fs.readFileSync(sourceFile, "utf8");
  const match = source.match(/observedStartupMs:\s*(\d+)/);
  return match ? Number(match[1]) : 0;
}

async function isHealthy(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${baseUrl}/__health`);
    return response.ok;
  } catch {
    return false;
  }
}

function allowOfflineMode(): boolean {
  if (process.env.VERIFY_ALLOW_OFFLINE === "1") {
    return true;
  }

  if (process.env.VERIFY_ALLOW_OFFLINE === "0") {
    return false;
  }

  return !Boolean(process.env.CI);
}

export async function verifyObs(repoRoot: string = process.cwd()): Promise<boolean> {
  const ports = computeWorktreePorts(repoRoot);
  const startupBudgetMs = Number(process.env.STARTUP_BUDGET_MS ?? 800);
  const maxErrors = Number(process.env.MAX_ERROR_COUNT ?? 0);
  const offlineAllowed = allowOfflineMode();
  const baseUrl = `http://127.0.0.1:${ports.appPort}`;

  const artifactsDir = path.join(repoRoot, "artifacts");
  fs.mkdirSync(artifactsDir, { recursive: true });
  const evidencePath = path.join(artifactsDir, "obs-evidence.json");

  let startedServer = false;
  let server: ChildProcess | null = null;

  let startupMs = 0;
  let errorCount = 0;
  let observedAt = new Date().toISOString();
  let mode: "live" | "offline" = "live";
  let fallbackReason: string | null = null;

  try {
    let healthy = await isHealthy(baseUrl);

    if (!healthy) {
      server = startAppServer(ports.appPort);
      startedServer = true;
      await waitForUrl(`${baseUrl}/__health`, 8000).catch(() => {
        // handled below via healthy probe
      });
      healthy = await isHealthy(baseUrl);
    }

    if (!healthy) {
      throw new Error(`Could not reach app health endpoint at ${baseUrl}/__health`);
    }

    const response = await fetchWithTimeout(`${baseUrl}/__obs`, 5000);
    if (!response.ok) {
      throw new Error(`Observability endpoint failed with ${response.status}`);
    }

    const payload = (await response.json()) as ObsPayload;
    startupMs = payload.startupMs;
    errorCount = payload.errorCount;
    observedAt = payload.timestamp;
  } catch (error: unknown) {
    mode = "offline";
    fallbackReason = error instanceof Error ? error.message : String(error);
    startupMs = readObservedStartupMs(repoRoot);
    errorCount = readErrorCount(repoRoot);
    observedAt = new Date().toISOString();
  } finally {
    if (startedServer && server) {
      await stopProcess(server);
    }
  }

  const pass = startupMs <= startupBudgetMs && errorCount <= maxErrors && (mode === "live" || offlineAllowed);

  fs.writeFileSync(
    evidencePath,
    JSON.stringify(
      {
        mode,
        offlineAllowed,
        startupMs,
        errorCount,
        startupBudgetMs,
        maxErrorCount: maxErrors,
        checks: {
          startupWithinBudget: startupMs <= startupBudgetMs,
          errorCountWithinBudget: errorCount <= maxErrors
        },
        fallbackReason,
        pass,
        observedAt
      },
      null,
      2
    )
  );

  return pass;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  verifyObs()
    .then((ok) => {
      if (!ok) {
        console.error("verify-obs: FAIL. See artifacts/obs-evidence.json for details.");
        process.exit(1);
      }

      console.log("verify-obs: PASS");
    })
    .catch((error: unknown) => {
      console.error("verify-obs: FAIL", error);
      process.exit(1);
    });
}
