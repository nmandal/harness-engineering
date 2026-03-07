import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverDevTargets, parseDevAllArgs } from "../scripts/dev-all.js";

function withTempRepo(fn: (repoRoot: string) => void): void {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-devall-"));
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

describe("dev-all args", () => {
  it("parses defaults", () => {
    expect(parseDevAllArgs([])).toEqual({
      basePort: 3000,
      dryRun: false
    });
  });

  it("parses custom options", () => {
    expect(parseDevAllArgs(["--base-port", "4100", "--dry-run"])).toEqual({
      basePort: 4100,
      dryRun: true
    });
  });
});

describe("discoverDevTargets", () => {
  it("discovers app and apps/* packages with dev scripts", () => {
    withTempRepo((repoRoot) => {
      writeFile(path.join(repoRoot, "app", "package.json"), JSON.stringify({ scripts: { dev: "vite" } }, null, 2));
      writeFile(
        path.join(repoRoot, "apps", "studio", "package.json"),
        JSON.stringify({ scripts: { dev: "next dev" } }, null, 2)
      );
      writeFile(
        path.join(repoRoot, "apps", "internal", "package.json"),
        JSON.stringify({ scripts: { build: "tsc -b" } }, null, 2)
      );

      const targets = discoverDevTargets(repoRoot, 3200);
      expect(targets).toHaveLength(2);
      expect(targets[0]).toMatchObject({ name: "app", port: 3200 });
      expect(targets[1]).toMatchObject({ name: "apps/studio", port: 3201 });
    });
  });
});

