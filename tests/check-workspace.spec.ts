import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverWorkspacePackages, parseCheckWorkspaceArgs } from "../scripts/check-workspace.js";

function withTempRepo(fn: (repoRoot: string) => void): void {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-checkws-"));
  try {
    fn(repoRoot);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

describe("check-workspace args", () => {
  it("defaults includeBuild to false", () => {
    expect(parseCheckWorkspaceArgs([])).toEqual({ includeBuild: false });
  });

  it("parses --include-build", () => {
    expect(parseCheckWorkspaceArgs(["--include-build"])).toEqual({ includeBuild: true });
  });
});

describe("discoverWorkspacePackages", () => {
  it("discovers packages under app/, apps/* and packages/*", () => {
    withTempRepo((repoRoot) => {
      writeFile(path.join(repoRoot, "app", "package.json"), JSON.stringify({ scripts: { dev: "vite" } }, null, 2));
      writeFile(
        path.join(repoRoot, "apps", "studio", "package.json"),
        JSON.stringify({ scripts: { dev: "next dev", lint: "next lint" } }, null, 2)
      );
      writeFile(
        path.join(repoRoot, "packages", "ui", "package.json"),
        JSON.stringify({ scripts: { build: "tsc -b" } }, null, 2)
      );

      const packages = discoverWorkspacePackages(repoRoot);
      const names = packages.map((pkg) => pkg.name).sort();
      expect(names).toEqual(["app", "apps/studio", "packages/ui"]);
    });
  });
});

