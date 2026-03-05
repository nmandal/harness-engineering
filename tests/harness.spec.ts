import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { lintDocs } from "../scripts/lint-docs.js";
import { lintArchitecture } from "../scripts/lint-architecture.js";
import { computeWorktreePorts } from "../scripts/lib/worktree.js";
import { updateQualityScore } from "../scripts/quality-score.js";
import { validateReviewLoop } from "../scripts/check-review-loop.js";

function withTempRepo(fn: (repoRoot: string) => void): void {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-eng-"));
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

describe("docs lint", () => {
  it("fails when a doc is not indexed", () => {
    withTempRepo((repoRoot) => {
      writeFile(
        path.join(repoRoot, "docs/index.md"),
        `# Index\n\nOwner: Nick\nLast Verified: 2026-03-05\nStatus: Active\n`
      );
      writeFile(
        path.join(repoRoot, "docs/product-specs/orphan.md"),
        `# Orphan\n\nOwner: Nick\nLast Verified: 2026-03-05\nStatus: Active\n`
      );

      const result = lintDocs({ repoRoot, silent: true, now: new Date("2026-03-05T00:00:00Z") });
      expect(result.issues.some((issue) => issue.code === "orphan-doc")).toBe(true);
    });
  });

  it("fails when Last Verified is missing", () => {
    withTempRepo((repoRoot) => {
      writeFile(
        path.join(repoRoot, "docs/index.md"),
        `# Index\n\nOwner: Nick\nLast Verified: 2026-03-05\nStatus: Active\n- [Policy](./policy.md)\n`
      );
      writeFile(path.join(repoRoot, "docs/policy.md"), `# Policy\n\nOwner: Nick\nStatus: Active\n`);

      const result = lintDocs({ repoRoot, silent: true, now: new Date("2026-03-05T00:00:00Z") });
      expect(result.issues.some((issue) => issue.code === "missing-last-verified")).toBe(true);
    });
  });
});

describe("architecture lint", () => {
  it("fails on forbidden layer import", () => {
    withTempRepo((repoRoot) => {
      writeFile(path.join(repoRoot, "app/src/domains/a/types/model.ts"), "export const x = 1;\n");
      writeFile(path.join(repoRoot, "app/src/domains/a/runtime/useRuntime.ts"), "export const y = 1;\n");
      writeFile(
        path.join(repoRoot, "app/src/domains/a/types/illegal.ts"),
        'import { y } from "../runtime/useRuntime";\nexport const z = y;\n'
      );

      const result = lintArchitecture({ repoRoot, silent: true });
      expect(result.issues.some((issue) => issue.code === "layer-direction")).toBe(true);
    });
  });
});

describe("worktree ports", () => {
  it("is deterministic for a path and differs across paths", () => {
    const first = computeWorktreePorts("/tmp/repo-a");
    const second = computeWorktreePorts("/tmp/repo-a");
    const third = computeWorktreePorts("/tmp/repo-b");

    expect(first.appPort).toBe(second.appPort);
    expect(first.obsPort).toBe(second.obsPort);
    expect(first.appPort).not.toBe(third.appPort);
  });
});

describe("quality score updater", () => {
  it("updates managed block and preserves manual notes", () => {
    withTempRepo((repoRoot) => {
      writeFile(
        path.join(repoRoot, "docs/index.md"),
        `# Docs\n\nOwner: Nick\nLast Verified: 2026-03-05\nStatus: Active\n- [Quality](./QUALITY_SCORE.md)\n`
      );
      writeFile(path.join(repoRoot, "app/src/domains/a/types/model.ts"), "export const x = 1;\n");
      writeFile(
        path.join(repoRoot, "docs/QUALITY_SCORE.md"),
        `# Quality\n\nManual note stays.\n\n<!-- quality-score:start -->\nold\n<!-- quality-score:end -->\n\nMore manual notes.\n`
      );

      updateQualityScore(repoRoot);
      const content = fs.readFileSync(path.join(repoRoot, "docs/QUALITY_SCORE.md"), "utf8");

      expect(content.includes("Manual note stays.")).toBe(true);
      expect(content.includes("More manual notes.")).toBe(true);
      expect(content.includes("| Domain | Score | Grade | Evidence | Next Action |")).toBe(true);
    });
  });
});

describe("review loop and skill contracts", () => {
  it("flags missing review evidence tokens", () => {
    const missing = validateReviewLoop("## Summary\nNo evidence here\n");
    expect(missing).toEqual(["UI Evidence:", "OBS Evidence:", "Rollback Plan:"]);
  });

  it("skills include required frontmatter fields", () => {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const skills = [
      "skills/pr-ready-change/SKILL.md",
      "skills/safe-refactor-migration/SKILL.md",
      "skills/ci-flake-wrangler/SKILL.md"
    ];

    for (const skillPath of skills) {
      const content = fs.readFileSync(path.join(repoRoot, skillPath), "utf8");
      expect(content.startsWith("---")).toBe(true);
      expect(/\nname:\s+.+/.test(content)).toBe(true);
      expect(/\ndescription:\s+.+/.test(content)).toBe(true);
    }
  });
});
