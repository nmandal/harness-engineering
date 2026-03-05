import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { walkFiles } from "./lib/fs-walk.js";
import { extractMarkdownLinks, resolveMarkdownPath } from "./lib/markdown.js";

const METADATA_OWNER = /^Owner:\s+.+$/m;
const METADATA_LAST_VERIFIED = /^Last Verified:\s+(\d{4}-\d{2}-\d{2})$/m;
const METADATA_STATUS = /^Status:\s+(Active|Draft|Deprecated)$/m;

export interface LintIssue {
  code: string;
  file: string;
  message: string;
  remediation: string;
}

export interface DocsLintResult {
  issues: LintIssue[];
  checkedFiles: number;
}

interface DocsLintOptions {
  repoRoot?: string;
  staleDays?: number;
  now?: Date;
  silent?: boolean;
}

function isDocsFile(file: string): boolean {
  return file.endsWith(".md");
}

function normalize(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function lintDocs(options: DocsLintOptions = {}): DocsLintResult {
  const repoRoot = options.repoRoot ?? process.cwd();
  const staleDays = options.staleDays ?? 45;
  const now = options.now ?? new Date();
  const docsDir = path.join(repoRoot, "docs");

  const files = walkFiles(docsDir, isDocsFile);
  const issues: LintIssue[] = [];

  const indexFiles = files.filter((file) => file.endsWith("/index.md") || normalize(file).endsWith("docs/index.md"));
  const linkedFromIndexes = new Set<string>();

  for (const indexFile of indexFiles) {
    const markdown = fs.readFileSync(indexFile, "utf8");
    const links = extractMarkdownLinks(markdown);

    for (const link of links) {
      const resolved = resolveMarkdownPath(indexFile, link);
      if (resolved) {
        linkedFromIndexes.add(path.resolve(resolved));
      }
    }
  }

  for (const file of files) {
    const relative = normalize(path.relative(repoRoot, file));
    const markdown = fs.readFileSync(file, "utf8");
    const isIndex = file.endsWith("/index.md") || normalize(file).endsWith("docs/index.md");
    const isGenerated = normalize(file).includes("/docs/generated/");

    const links = extractMarkdownLinks(markdown);
    for (const link of links) {
      const resolved = resolveMarkdownPath(file, link);
      if (!resolved) {
        continue;
      }

      if (!fs.existsSync(resolved)) {
        issues.push({
          code: "broken-link",
          file: relative,
          message: `Broken markdown link '${link}'.`,
          remediation: "Fix or remove the link target so docs cross-links remain machine-checkable."
        });
      }
    }

    if (!isIndex && !isGenerated) {
      if (!METADATA_OWNER.test(markdown)) {
        issues.push({
          code: "missing-owner",
          file: relative,
          message: "Missing required metadata field 'Owner:'.",
          remediation: "Add an Owner line near the top of the document."
        });
      }

      const verifiedMatch = markdown.match(METADATA_LAST_VERIFIED);
      if (!verifiedMatch) {
        issues.push({
          code: "missing-last-verified",
          file: relative,
          message: "Missing required metadata field 'Last Verified: YYYY-MM-DD'.",
          remediation: "Add Last Verified with an ISO date so freshness checks can run."
        });
      } else {
        const verifiedAt = new Date(`${verifiedMatch[1]}T00:00:00Z`);
        const ageMs = now.getTime() - verifiedAt.getTime();
        const staleMs = staleDays * 24 * 60 * 60 * 1000;

        if (Number.isFinite(ageMs) && ageMs > staleMs) {
          issues.push({
            code: "stale-doc",
            file: relative,
            message: `Document freshness exceeded ${staleDays} days.`,
            remediation: "Re-verify content and update Last Verified to today's date."
          });
        }
      }

      if (!METADATA_STATUS.test(markdown)) {
        issues.push({
          code: "missing-status",
          file: relative,
          message: "Missing required metadata field 'Status: Active|Draft|Deprecated'.",
          remediation: "Add a Status line to make lifecycle state explicit."
        });
      }

      if (!linkedFromIndexes.has(path.resolve(file))) {
        issues.push({
          code: "orphan-doc",
          file: relative,
          message: "Document is not linked from any docs index.",
          remediation: "Add this document to the closest docs/index.md file for discoverability."
        });
      }
    }
  }

  if (!options.silent) {
    if (issues.length === 0) {
      console.log(`lint-docs: PASS (${files.length} files checked)`);
    } else {
      console.error(`lint-docs: FAIL (${issues.length} issues)`);
      for (const issue of issues) {
        console.error(`- [${issue.code}] ${issue.file}: ${issue.message}`);
        console.error(`  Remediation: ${issue.remediation}`);
      }
    }
  }

  return {
    issues,
    checkedFiles: files.length
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const result = lintDocs();
  process.exit(result.issues.length > 0 ? 1 : 0);
}
