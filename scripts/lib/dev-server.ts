import { spawn, type ChildProcess } from "node:child_process";

export function startAppServer(port: number): ChildProcess {
  return spawn(
    "pnpm",
    ["--dir", "app", "dev", "--host", "127.0.0.1", "--port", String(port)],
    {
      stdio: "pipe",
      env: {
        ...process.env,
        FORCE_COLOR: "0"
      }
    }
  );
}

export async function waitForUrl(url: string, timeoutMs: number = 30000): Promise<void> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
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

export async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.killed) {
    return;
  }

  child.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 150));

  if (!child.killed) {
    child.kill("SIGKILL");
  }
}
