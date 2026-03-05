import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lintDocs } from "./lint-docs.js";

export function runDocGardener(repoRoot: string = process.cwd(), strict: boolean = false): number {
  const result = lintDocs({ repoRoot, staleDays: 30, silent: true });
  const reportPath = path.join(repoRoot, "artifacts", "doc-garden-report.md");

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  const lines = [
    "# Doc Gardening Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Issues: ${result.issues.length}`,
    ""
  ];

  if (result.issues.length === 0) {
    lines.push("No stale or structural documentation issues found.");
  } else {
    lines.push("## Findings");
    lines.push("");

    for (const issue of result.issues) {
      lines.push(`- [${issue.code}] ${issue.file}: ${issue.message}`);
      lines.push(`  - Remediation: ${issue.remediation}`);
    }
  }

  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);
  console.log(`doc-gardener: wrote ${path.relative(repoRoot, reportPath)}`);

  if (strict && result.issues.length > 0) {
    return 1;
  }

  return 0;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const strict = process.argv.includes("--strict");
  process.exit(runDocGardener(process.cwd(), strict));
}
