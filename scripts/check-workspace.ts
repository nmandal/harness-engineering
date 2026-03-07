import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export interface WorkspacePackage {
  name: string;
  dir: string;
  scripts: string[];
}

interface CheckWorkspaceArgs {
  includeBuild: boolean;
}

function readPackageJson(packageJsonPath: string): { scripts?: Record<string, string> } | null {
  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as { scripts?: Record<string, string> };
  } catch {
    return null;
  }
}

function collectWorkspacePackageDirs(repoRoot: string): string[] {
  const dirs: string[] = [];

  const rootApp = path.join(repoRoot, "app");
  if (fs.existsSync(path.join(rootApp, "package.json"))) {
    dirs.push(rootApp);
  }

  for (const section of ["apps", "packages"]) {
    const sectionDir = path.join(repoRoot, section);
    if (!fs.existsSync(sectionDir)) {
      continue;
    }

    const entries = fs.readdirSync(sectionDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const packageDir = path.join(sectionDir, entry.name);
      if (fs.existsSync(path.join(packageDir, "package.json"))) {
        dirs.push(packageDir);
      }
    }
  }

  return dirs.sort();
}

export function discoverWorkspacePackages(repoRoot: string): WorkspacePackage[] {
  const dirs = collectWorkspacePackageDirs(repoRoot);

  return dirs
    .map((dir) => {
      const pkg = readPackageJson(path.join(dir, "package.json"));
      if (!pkg) {
        return null;
      }

      const scripts = Object.keys(pkg.scripts ?? {});
      return {
        name: path.relative(repoRoot, dir),
        dir,
        scripts
      };
    })
    .filter((pkg): pkg is WorkspacePackage => pkg !== null);
}

export function parseCheckWorkspaceArgs(argv: string[]): CheckWorkspaceArgs {
  return {
    includeBuild: argv.includes("--include-build")
  };
}

function runScript(pkg: WorkspacePackage, script: string): number {
  const result = spawnSync("pnpm", ["--dir", pkg.dir, "run", script], {
    stdio: "inherit"
  });
  return result.status ?? 1;
}

export function runCheckWorkspace(repoRoot: string, args: CheckWorkspaceArgs): number {
  const packages = discoverWorkspacePackages(repoRoot);
  if (packages.length === 0) {
    console.log("check:workspace: no JS workspace packages found under app/, apps/*, or packages/*");
    return 0;
  }

  const scriptOrder = ["lint", "typecheck", "test", ...(args.includeBuild ? ["build"] : [])];
  let failures = 0;

  for (const pkg of packages) {
    console.log(`check:workspace: ${pkg.name}`);
    for (const script of scriptOrder) {
      if (!pkg.scripts.includes(script)) {
        continue;
      }

      const code = runScript(pkg, script);
      if (code !== 0) {
        console.error(`check:workspace: FAIL ${pkg.name} script '${script}' exited with ${code}`);
        failures += 1;
        break;
      }
    }
  }

  if (failures > 0) {
    return 1;
  }

  console.log("check:workspace: PASS");
  return 0;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const args = parseCheckWorkspaceArgs(process.argv.slice(2));
  const code = runCheckWorkspace(process.cwd(), args);
  process.exit(code);
}

