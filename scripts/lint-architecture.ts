import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { walkFiles } from "./lib/fs-walk.js";

const LAYERS = ["types", "config", "repo", "providers", "service", "runtime", "ui"] as const;

export interface ArchitectureIssue {
  code: string;
  file: string;
  message: string;
  remediation: string;
}

export interface ArchitectureLintResult {
  issues: ArchitectureIssue[];
  checkedFiles: number;
}

interface LayerLocation {
  domain: string;
  layer: (typeof LAYERS)[number];
}

interface ArchitectureOptions {
  repoRoot?: string;
  silent?: boolean;
}

function normalize(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function parseLayerLocation(absoluteFile: string, repoRoot: string): LayerLocation | null {
  const relative = normalize(path.relative(repoRoot, absoluteFile));
  const match = relative.match(/^app\/src\/domains\/([^/]+)\/([^/]+)\//);

  if (!match) {
    return null;
  }

  const layer = match[2] as (typeof LAYERS)[number];
  if (!LAYERS.includes(layer)) {
    return null;
  }

  return {
    domain: match[1],
    layer
  };
}

function resolveImport(sourceFile: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) {
    return null;
  }

  const base = path.resolve(path.dirname(sourceFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx")
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function extractImports(source: string): string[] {
  const imports: string[] = [];
  const patterns = [/import\s+[^"']*["']([^"']+)["']/g, /from\s+["']([^"']+)["']/g, /import\(["']([^"']+)["']\)/g];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      imports.push(match[1]);
    }
  }

  return imports;
}

export function lintArchitecture(options: ArchitectureOptions = {}): ArchitectureLintResult {
  const repoRoot = options.repoRoot ?? process.cwd();
  const sourceDir = path.join(repoRoot, "app", "src");
  const files = walkFiles(sourceDir, (absolute) => absolute.endsWith(".ts") || absolute.endsWith(".tsx"));
  const issues: ArchitectureIssue[] = [];

  for (const file of files) {
    const sourceLocation = parseLayerLocation(file, repoRoot);
    if (!sourceLocation) {
      continue;
    }

    const content = fs.readFileSync(file, "utf8");
    const imports = extractImports(content);

    for (const specifier of imports) {
      const targetFile = resolveImport(file, specifier);
      if (!targetFile) {
        continue;
      }

      const targetLocation = parseLayerLocation(targetFile, repoRoot);
      if (!targetLocation) {
        continue;
      }

      const relativeSource = normalize(path.relative(repoRoot, file));

      if (sourceLocation.domain !== targetLocation.domain && targetLocation.layer !== "providers") {
        issues.push({
          code: "cross-domain-import",
          file: relativeSource,
          message: `Illegal cross-domain import from '${sourceLocation.domain}' to '${targetLocation.domain}/${targetLocation.layer}'.`,
          remediation: "Route cross-domain dependencies through provider boundaries instead of direct imports."
        });
      }

      if (sourceLocation.domain === targetLocation.domain) {
        const sourceIndex = LAYERS.indexOf(sourceLocation.layer);
        const targetIndex = LAYERS.indexOf(targetLocation.layer);

        if (targetIndex > sourceIndex) {
          issues.push({
            code: "layer-direction",
            file: relativeSource,
            message: `Dependency direction violation: ${sourceLocation.layer} cannot import ${targetLocation.layer}.`,
            remediation: `Move dependencies toward foundational layers (${LAYERS.join(" -> ")}), or extract shared logic.`
          });
        }
      }
    }
  }

  if (!options.silent) {
    if (issues.length === 0) {
      console.log(`lint-architecture: PASS (${files.length} files checked)`);
    } else {
      console.error(`lint-architecture: FAIL (${issues.length} issues)`);
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
  const result = lintArchitecture();
  process.exit(result.issues.length > 0 ? 1 : 0);
}
