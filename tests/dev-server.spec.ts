import { spawn, type ChildProcess } from "node:child_process";
import { describe, expect, it } from "vitest";
import { stopProcess } from "../scripts/lib/dev-server.js";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs))
  ]);
}

function spawnNode(script: string): ChildProcess {
  return spawn(process.execPath, ["-e", script], {
    stdio: "ignore"
  });
}

describe("dev-server stopProcess", () => {
  it("returns quickly when process already exited", async () => {
    const child = spawnNode("process.exit(0);");

    await withTimeout(
      new Promise<void>((resolve) => {
        child.on("exit", () => resolve());
      }),
      2000
    );

    await withTimeout(stopProcess(child), 2500);
  });

  it("terminates a long-running process without hanging", async () => {
    const child = spawnNode("setInterval(() => {}, 1000);");

    await withTimeout(stopProcess(child), 7000);
    expect(child.exitCode !== null || child.signalCode !== null).toBe(true);
  });
});

