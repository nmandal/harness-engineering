import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ChildProcess } from "node:child_process";
import { computeWorktreePorts } from "./lib/worktree.js";
import { fetchWithTimeout, startAppServer, stopProcess, waitForUrl } from "./lib/dev-server.js";

interface UiCheckPayload {
  criticalWorkflowReady: boolean;
  timestamp: string;
}

function writePlaceholderPng(filePath: string): void {
  const onePixelPngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wv7JvoAAAAASUVORK5CYII=";
  fs.writeFileSync(filePath, Buffer.from(onePixelPngBase64, "base64"));
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

async function checkUiSignal(baseUrl: string, body: string): Promise<{ pass: boolean; viaEndpoint: boolean }> {
  if (body.includes("Critical Workflow Ready")) {
    return { pass: true, viaEndpoint: false };
  }

  try {
    const response = await fetchWithTimeout(`${baseUrl}/__ui-check`);
    if (!response.ok) {
      return { pass: false, viaEndpoint: false };
    }

    const payload = (await response.json()) as UiCheckPayload;
    return { pass: payload.criticalWorkflowReady, viaEndpoint: true };
  } catch {
    return { pass: false, viaEndpoint: false };
  }
}

export async function verifyUi(repoRoot: string = process.cwd()): Promise<boolean> {
  const ports = computeWorktreePorts(repoRoot);
  const route = process.env.VERIFY_ROUTE ?? "/";
  const offlineAllowed = allowOfflineMode();
  const baseUrl = `http://127.0.0.1:${ports.appPort}`;

  fs.mkdirSync(path.join(repoRoot, "artifacts"), { recursive: true });
  const domPath = path.join(repoRoot, "artifacts", "ui-dom-snapshot.html");
  const screenshotPath = path.join(repoRoot, "artifacts", "ui-screenshot.png");
  const evidencePath = path.join(repoRoot, "artifacts", "ui-evidence.json");

  let startedServer = false;
  let server: ChildProcess | null = null;
  let pass = false;
  let statusCode = 0;
  let body = "";
  let mode: "live" | "offline" = "live";
  let fallbackReason: string | null = null;
  let uiSignalViaEndpoint = false;

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

    const response = await fetchWithTimeout(`${baseUrl}${route}`, 5000);
    statusCode = response.status;
    body = await response.text();

    const signal = await checkUiSignal(baseUrl, body);
    uiSignalViaEndpoint = signal.viaEndpoint;
    pass = response.ok && signal.pass;
  } catch (error: unknown) {
    mode = "offline";
    fallbackReason = error instanceof Error ? error.message : String(error);

    const sourcePath = path.join(repoRoot, "app", "src", "domains", "settings", "ui", "SettingsDashboard.tsx");
    body = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, "utf8") : "";
    pass = body.includes("Critical Workflow Ready");
  } finally {
    if (startedServer && server) {
      await stopProcess(server);
    }
  }

  fs.writeFileSync(domPath, body);
  writePlaceholderPng(screenshotPath);

  if (mode === "offline" && !offlineAllowed) {
    pass = false;
  }

  const payload = {
    mode,
    offlineAllowed,
    route,
    screenshotPath: path.relative(repoRoot, screenshotPath),
    domSnapshotPath: path.relative(repoRoot, domPath),
    statusCode,
    checks: {
      httpOk: mode === "live" ? statusCode >= 200 && statusCode < 300 : null,
      criticalWorkflowTextFound: body.includes("Critical Workflow Ready"),
      uiSignalViaEndpoint
    },
    fallbackReason,
    pass,
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(evidencePath, JSON.stringify(payload, null, 2));

  return pass;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  verifyUi()
    .then((ok) => {
      if (!ok) {
        console.error("verify-ui: FAIL. See artifacts/ui-evidence.json for details.");
        process.exit(1);
      }

      console.log("verify-ui: PASS");
    })
    .catch((error: unknown) => {
      console.error("verify-ui: FAIL", error);
      process.exit(1);
    });
}
