import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseWorkforceArgs, scaffoldWorkforce } from "../scripts/scaffold-workforce.js";

function withTempRepo(fn: (repoRoot: string) => void): void {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-workforce-"));
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

describe("scaffold-workforce args", () => {
  it("parses defaults", () => {
    expect(parseWorkforceArgs([])).toEqual({
      web: "web",
      api: "api",
      includeFastApi: true,
      force: false,
      runChecks: true
    });
  });

  it("parses custom options", () => {
    expect(parseWorkforceArgs(["--web", "studio", "--api", "core", "--no-fastapi", "--force", "--skip-check"])).toEqual(
      {
        web: "studio",
        api: "core",
        includeFastApi: false,
        force: true,
        runChecks: false
      }
    );
  });
});

describe("scaffold-workforce output", () => {
  it("creates monorepo starter files and updates docs index", () => {
    withTempRepo((repoRoot) => {
      writeFile(path.join(repoRoot, "pnpm-workspace.yaml"), "packages:\n  - app\n");
      writeFile(
        path.join(repoRoot, "docs", "product-specs", "index.md"),
        "# Product Specs Index\n\nOwner: Nick\nLast Verified: 2026-03-07\nStatus: Active\n"
      );
      writeFile(path.join(repoRoot, "docs", "index.md"), "# Docs Index\n");

      const created = scaffoldWorkforce(repoRoot, {
        web: "studio",
        api: "core",
        includeFastApi: true,
        force: false,
        runChecks: false
      });

      expect(created.some((file) => file === "apps/studio/package.json")).toBe(true);
      expect(created.some((file) => file === "services/core/pyproject.toml")).toBe(true);
      expect(created.some((file) => file === "docs/product-specs/studio-app.md")).toBe(true);
      expect(created.some((file) => file === "docs/product-specs/core-service.md")).toBe(true);

      expect(fs.existsSync(path.join(repoRoot, "apps", "studio", "app", "page.tsx"))).toBe(true);
      expect(fs.existsSync(path.join(repoRoot, "services", "core", "app", "main.py"))).toBe(true);

      const workspace = fs.readFileSync(path.join(repoRoot, "pnpm-workspace.yaml"), "utf8");
      expect(workspace.includes("  - apps/*")).toBe(true);
      expect(workspace.includes("  - services/*")).toBe(true);

      const specIndex = fs.readFileSync(path.join(repoRoot, "docs", "product-specs", "index.md"), "utf8");
      expect(specIndex.includes("[Studio App Spec](./studio-app.md)")).toBe(true);
      expect(specIndex.includes("[Core Service Spec](./core-service.md)")).toBe(true);
    });
  });
});

