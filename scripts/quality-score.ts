import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lintDocs } from "./lint-docs.js";
import { lintArchitecture } from "./lint-architecture.js";

const START_MARKER = "<!-- quality-score:start -->";
const END_MARKER = "<!-- quality-score:end -->";

function grade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function hasPath(repoRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function renderManagedTable(repoRoot: string): string {
  const docsResult = lintDocs({ repoRoot, silent: true });
  const archResult = lintArchitecture({ repoRoot, silent: true });

  const docsScore = Math.max(0, 100 - docsResult.issues.length * 8);
  const archScore = Math.max(0, 100 - archResult.issues.length * 12);

  const legibilitySignals = [
    hasPath(repoRoot, "scripts/worktree-dev.ts"),
    hasPath(repoRoot, "scripts/verify-ui.ts"),
    hasPath(repoRoot, "scripts/verify-obs.ts")
  ].filter(Boolean).length;

  const reviewSignals = [
    hasPath(repoRoot, "docs/REVIEW_LOOP.md"),
    hasPath(repoRoot, ".github/workflows/review-loop-check.yml")
  ].filter(Boolean).length;

  const enablementSignals = [
    hasPath(repoRoot, "skills/pr-ready-change/SKILL.md"),
    hasPath(repoRoot, "skills/safe-refactor-migration/SKILL.md"),
    hasPath(repoRoot, "scripts/quickstart.ts")
  ].filter(Boolean).length;

  const runtimeScore = 60 + legibilitySignals * 13;
  const reviewScore = 60 + reviewSignals * 20;
  const enablementScore = 60 + enablementSignals * 13;

  const rows = [
    {
      domain: "Documentation Integrity",
      score: docsScore,
      evidence: `${docsResult.checkedFiles} docs checked; ${docsResult.issues.length} issues`,
      next: "Reduce orphan/stale docs to zero"
    },
    {
      domain: "Architecture Guards",
      score: archScore,
      evidence: `${archResult.checkedFiles} source files checked; ${archResult.issues.length} issues`,
      next: "Keep layer-direction and cross-domain issues at zero"
    },
    {
      domain: "Runtime Legibility",
      score: runtimeScore,
      evidence: `${legibilitySignals}/3 legibility scripts present`,
      next: "Attach evidence outputs in every app-affecting PR"
    },
    {
      domain: "Review Loop Maturity",
      score: reviewScore,
      evidence: `${reviewSignals}/2 review controls present`,
      next: "Use low-risk automerge only when review checks pass"
    },
    {
      domain: "Enablement Readiness",
      score: enablementScore,
      evidence: `${enablementSignals}/3 core enablement assets present`,
      next: "Expand scaffolding templates and publish additional starter recipes"
    }
  ];

  const lines = ["| Domain | Score | Grade | Evidence | Next Action |", "| --- | ---: | --- | --- | --- |"];

  for (const row of rows) {
    lines.push(`| ${row.domain} | ${row.score} | ${grade(row.score)} | ${row.evidence} | ${row.next} |`);
  }

  return lines.join("\n");
}

export function updateQualityScore(repoRoot: string = process.cwd()): void {
  const filePath = path.join(repoRoot, "docs", "QUALITY_SCORE.md");
  const content = fs.readFileSync(filePath, "utf8");
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER);

  if (start === -1 || end === -1 || end < start) {
    throw new Error("QUALITY_SCORE.md missing managed markers.");
  }

  const before = content.slice(0, start + START_MARKER.length);
  const after = content.slice(end);
  const table = renderManagedTable(repoRoot);
  const next = `${before}\n${table}\n${after}`;

  fs.writeFileSync(filePath, next);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  updateQualityScore();
  console.log("quality-score: updated docs/QUALITY_SCORE.md managed section");
}
