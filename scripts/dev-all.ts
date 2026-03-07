import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";

export interface DevTarget {
  name: string;
  dir: string;
  port: number;
}

interface DevAllArgs {
  basePort: number;
  dryRun: boolean;
}

function hasDevScript(packageJsonPath: string): boolean {
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as { scripts?: Record<string, string> };
    return Boolean(pkg.scripts?.dev);
  } catch {
    return false;
  }
}

function discoverAppDirs(repoRoot: string): string[] {
  const dirs: string[] = [];
  const rootApp = path.join(repoRoot, "app");
  if (hasDevScript(path.join(rootApp, "package.json"))) {
    dirs.push(rootApp);
  }

  const appsDir = path.join(repoRoot, "apps");
  if (!fs.existsSync(appsDir)) {
    return dirs;
  }

  const entries = fs.readdirSync(appsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const appDir = path.join(appsDir, entry.name);
    if (hasDevScript(path.join(appDir, "package.json"))) {
      dirs.push(appDir);
    }
  }

  return dirs.sort();
}

export function discoverDevTargets(repoRoot: string, basePort: number = 3000): DevTarget[] {
  const dirs = discoverAppDirs(repoRoot);
  return dirs.map((dir, index) => ({
    name: path.relative(repoRoot, dir),
    dir,
    port: basePort + index
  }));
}

export function parseDevAllArgs(argv: string[]): DevAllArgs {
  let basePort = Number(process.env.DEV_ALL_BASE_PORT ?? 3000);
  let dryRun = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--base-port") {
      const nextValue = Number(argv[i + 1] ?? basePort);
      if (Number.isFinite(nextValue)) {
        basePort = nextValue;
      }
      i += 1;
      continue;
    }

    if (token === "--dry-run") {
      dryRun = true;
      continue;
    }
  }

  return { basePort, dryRun };
}

function shutdownChildren(children: ChildProcess[]): void {
  for (const child of children) {
    if (child.exitCode !== null || child.signalCode !== null) {
      continue;
    }

    try {
      child.kill("SIGTERM");
    } catch {
      // ignore
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (child.exitCode !== null || child.signalCode !== null) {
        continue;
      }

      try {
        child.kill("SIGKILL");
      } catch {
        // ignore
      }
    }
  }, 1500).unref();
}

export async function runDevAll(repoRoot: string, args: DevAllArgs): Promise<number> {
  const targets = discoverDevTargets(repoRoot, args.basePort);
  if (targets.length === 0) {
    console.log("dev:all: no app targets found under app/ or apps/*");
    return 0;
  }

  console.log("dev:all target plan:");
  for (const target of targets) {
    console.log(`- ${target.name}: http://127.0.0.1:${target.port}`);
  }

  if (args.dryRun) {
    return 0;
  }

  const children: ChildProcess[] = [];
  for (const target of targets) {
    const child = spawn("pnpm", ["--dir", target.dir, "dev", "--", "--port", String(target.port)], {
      stdio: "inherit",
      env: {
        ...process.env,
        PORT: String(target.port)
      }
    });
    children.push(child);
  }

  let exiting = false;
  const handleExit = () => {
    if (exiting) {
      return;
    }
    exiting = true;
    shutdownChildren(children);
  };

  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);

  return await new Promise<number>((resolve) => {
    let finished = 0;

    for (const child of children) {
      child.on("exit", (code) => {
        finished += 1;
        if (code && code !== 0) {
          handleExit();
        }
        if (finished === children.length) {
          resolve(0);
        }
      });
    }
  });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const args = parseDevAllArgs(process.argv.slice(2));
  runDevAll(process.cwd(), args)
    .then((code) => process.exit(code))
    .catch((error: unknown) => {
      console.error(`dev:all: FAIL: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    });
}
