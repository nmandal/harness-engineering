import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";

export function startAppServer(port: number): ChildProcess {
  const child = spawn(
    "pnpm",
    ["--dir", "app", "dev", "--host", "127.0.0.1", "--port", String(port)],
    {
      stdio: "ignore",
      detached: true,
      env: {
        ...process.env,
        FORCE_COLOR: "0"
      }
    }
  );

  child.unref();
  return child;
}

export async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 2500,
  init: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store"
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function waitForUrl(url: string, timeoutMs: number = 30000): Promise<void> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetchWithTimeout(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep retrying until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function hasExited(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null;
}

function killChild(child: ChildProcess, signal: NodeJS.Signals): void {
  if (!child.pid) {
    return;
  }

  // When detached=true the child becomes a process-group leader; kill the
  // group so pnpm/vite descendants do not survive and hang CI cleanup.
  try {
    process.kill(-child.pid, signal);
    return;
  } catch {
    // ignore and fallback below
  }

  try {
    child.kill(signal);
  } catch {
    // ignore
  }
}

async function waitForExit(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (hasExited(child)) {
    return true;
  }

  const exited = await Promise.race<boolean>([
    once(child, "exit").then(() => true),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs))
  ]);

  return exited || hasExited(child);
}

export async function stopProcess(child: ChildProcess): Promise<void> {
  if (hasExited(child)) {
    return;
  }

  killChild(child, "SIGTERM");

  if (await waitForExit(child, 3000)) {
    return;
  }

  killChild(child, "SIGKILL");

  if (await waitForExit(child, 3000)) {
    return;
  }

  // Avoid hanging forever when process exit cannot be observed in CI.
  // The process group has already received SIGKILL at this point.
}
