import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { computeWorktreePorts } from "./lib/worktree.js";

export function writeWorktreeRuntimeArtifact(repoRoot: string = process.cwd()): { appPort: number; obsPort: number } {
  const ports = computeWorktreePorts(repoRoot);
  const artifactPath = path.join(repoRoot, "artifacts", "worktree-runtime.json");

  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(
    artifactPath,
    JSON.stringify(
      {
        appPort: ports.appPort,
        obsPort: ports.obsPort,
        hash: ports.hash,
        worktreePath: ports.worktreePath,
        generatedAt: new Date().toISOString()
      },
      null,
      2
    )
  );

  return {
    appPort: ports.appPort,
    obsPort: ports.obsPort
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const portsOnly = process.argv.includes("--ports-only");
  const repoRoot = process.cwd();
  const ports = writeWorktreeRuntimeArtifact(repoRoot);

  if (portsOnly) {
    console.log(JSON.stringify(ports, null, 2));
    process.exit(0);
  }

  console.log(`worktree-dev: starting app on port ${ports.appPort}`);
  const child = spawn("pnpm", ["--dir", "app", "dev", "--host", "127.0.0.1", "--port", String(ports.appPort)], {
    stdio: "inherit",
    env: {
      ...process.env,
      HARNESS_OBS_PORT: String(ports.obsPort)
    }
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}
