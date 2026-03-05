import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface Args {
  name: string;
  force: boolean;
  wire: boolean;
}

export function parseArgs(argv: string[]): Args {
  let name = "";
  let force = false;
  let wire = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--name") {
      name = argv[i + 1] ?? "";
      i += 1;
      continue;
    }

    if (token === "--force") {
      force = true;
      continue;
    }

    if (token === "--wire") {
      wire = true;
      continue;
    }

    if (!token.startsWith("-") && !name) {
      name = token;
    }
  }

  if (!name) {
    throw new Error("Missing domain name. Usage: pnpm scaffold:domain --name billing");
  }

  const normalized = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-");
  if (!/^[a-z][a-z0-9-]*$/.test(normalized)) {
    throw new Error("Domain name must start with a letter and contain only letters, numbers, or dashes.");
  }

  return { name: normalized, force, wire };
}

function toPascalCase(input: string): string {
  return input
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

function writeFileSafely(filePath: string, content: string, force: boolean): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  if (fs.existsSync(filePath) && !force) {
    throw new Error(`File already exists: ${filePath}. Use --force to overwrite.`);
  }

  fs.writeFileSync(filePath, content);
}

function appendProductSpecIndex(repoRoot: string, domain: string): void {
  const indexPath = path.join(repoRoot, "docs", "product-specs", "index.md");
  if (!fs.existsSync(indexPath)) {
    return;
  }

  const line = `- [${toPascalCase(domain)} Spec](./${domain}.md)`;
  const current = fs.readFileSync(indexPath, "utf8");
  if (current.includes(line)) {
    return;
  }

  fs.writeFileSync(indexPath, `${current.trimEnd()}\n${line}\n`);
}

function wirePanelIntoAppShell(repoRoot: string, domain: string, force: boolean): string | null {
  const pascal = toPascalCase(domain);
  const appPath = path.join(repoRoot, "app", "src", "App.tsx");

  if (!fs.existsSync(appPath)) {
    return null;
  }

  let source = fs.readFileSync(appPath, "utf8");
  const importLine = `import { ${pascal}Panel } from "./domains/${domain}/ui/${pascal}Panel";`;
  const panelLine = `      <${pascal}Panel />`;

  if (!source.includes(importLine)) {
    const importMatch = source.match(/(import .+\n)+/);
    if (!importMatch) {
      if (!force) {
        throw new Error(`Could not find import block in ${appPath}. Use --force and wire manually if needed.`);
      }
    } else {
      source = source.replace(importMatch[0], `${importMatch[0]}${importLine}\n`);
    }
  }

  if (!source.includes(panelLine)) {
    if (source.includes("      <SettingsDashboard />")) {
      source = source.replace("      <SettingsDashboard />", `      <SettingsDashboard />\n${panelLine}`);
    } else if (source.includes("</main>")) {
      source = source.replace("</main>", `${panelLine}\n    </main>`);
    } else if (!force) {
      throw new Error(`Could not find insertion point in ${appPath}. Use --force and wire manually if needed.`);
    }
  }

  fs.writeFileSync(appPath, source);
  return path.relative(repoRoot, appPath);
}

export function scaffoldDomain(repoRoot: string, args: Args): string[] {
  const domain = args.name;
  const pascal = toPascalCase(domain);
  const created: string[] = [];

  const domainRoot = path.join(repoRoot, "app", "src", "domains", domain);

  const files: Array<[string, string]> = [
    [
      path.join(domainRoot, "types", `${domain}Types.ts`),
      `export interface ${pascal}Snapshot {\n  status: "ok" | "warning";\n  updatedAt: string;\n}\n`
    ],
    [
      path.join(domainRoot, "config", `${domain}Config.ts`),
      `export interface ${pascal}Config {\n  enabled: boolean;\n}\n\nexport function get${pascal}Config(): ${pascal}Config {\n  return { enabled: true };\n}\n`
    ],
    [
      path.join(domainRoot, "repo", `${domain}Repo.ts`),
      `import type { ${pascal}Snapshot } from "../types/${domain}Types";\n\nexport async function load${pascal}Snapshot(): Promise<${pascal}Snapshot> {\n  return {\n    status: "ok",\n    updatedAt: new Date().toISOString()\n  };\n}\n`
    ],
    [
      path.join(domainRoot, "providers", `${domain}Provider.ts`),
      `export interface ${pascal}Provider {\n  nowIso(): string;\n}\n\nexport function create${pascal}Provider(): ${pascal}Provider {\n  return { nowIso: () => new Date().toISOString() };\n}\n`
    ],
    [
      path.join(domainRoot, "service", `${domain}Service.ts`),
      `import { get${pascal}Config } from "../config/${domain}Config";\nimport { create${pascal}Provider } from "../providers/${domain}Provider";\nimport { load${pascal}Snapshot } from "../repo/${domain}Repo";\nimport type { ${pascal}Snapshot } from "../types/${domain}Types";\n\nexport async function get${pascal}Snapshot(): Promise<${pascal}Snapshot> {\n  const config = get${pascal}Config();\n  const provider = create${pascal}Provider();\n  const snapshot = await load${pascal}Snapshot();\n\n  if (!config.enabled) {\n    return { ...snapshot, status: "warning", updatedAt: provider.nowIso() };\n  }\n\n  return snapshot;\n}\n`
    ],
    [
      path.join(domainRoot, "runtime", `use${pascal}Runtime.ts`),
      `import { useEffect, useState } from "react";\nimport { get${pascal}Snapshot } from "../service/${domain}Service";\nimport type { ${pascal}Snapshot } from "../types/${domain}Types";\n\nexport function use${pascal}Runtime(): { snapshot: ${pascal}Snapshot | null; loading: boolean } {\n  const [snapshot, setSnapshot] = useState<${pascal}Snapshot | null>(null);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    get${pascal}Snapshot()\n      .then((data) => setSnapshot(data))\n      .finally(() => setLoading(false));\n  }, []);\n\n  return { snapshot, loading };\n}\n`
    ],
    [
      path.join(domainRoot, "ui", `${pascal}Panel.tsx`),
      `import type { ReactElement } from "react";\nimport { use${pascal}Runtime } from "../runtime/use${pascal}Runtime";\n\nexport function ${pascal}Panel(): ReactElement {\n  const { snapshot, loading } = use${pascal}Runtime();\n\n  if (loading) {\n    return <section><h3>${pascal}</h3><p>Loading...</p></section>;\n  }\n\n  return (\n    <section>\n      <h3>${pascal}</h3>\n      <p>Status: {snapshot?.status ?? "unknown"}</p>\n      <p>Updated: {snapshot?.updatedAt ?? "n/a"}</p>\n    </section>\n  );\n}\n`
    ],
    [
      path.join(repoRoot, "docs", "product-specs", `${domain}.md`),
      `# ${pascal} Spec\n\nOwner: Nick\nLast Verified: 2026-03-05\nStatus: Draft\n\n## Problem\n\nDescribe the user and business problem for ${domain}.\n\n## Scope\n\n- In scope:\n- Out of scope:\n\n## Acceptance Criteria\n\n1.\n2.\n3.\n`
    ]
  ];

  for (const [filePath, content] of files) {
    writeFileSafely(filePath, content, args.force);
    created.push(path.relative(repoRoot, filePath));
  }

  appendProductSpecIndex(repoRoot, domain);

  if (args.wire) {
    const appPath = wirePanelIntoAppShell(repoRoot, domain, args.force);
    if (appPath) {
      created.push(appPath);
    }
  }

  return created;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const created = scaffoldDomain(process.cwd(), args);

    console.log(`scaffold-domain: created ${created.length} files`);
    for (const file of created) {
      console.log(`- ${file}`);
    }
    if (args.wire) {
      console.log("Scaffold complete with app-shell wiring. Next: run pnpm check:all");
    } else {
      console.log("Next: import your new UI panel into app/src/App.tsx (or rerun with --wire) and run pnpm check:all");
    }
  } catch (error: unknown) {
    console.error(`scaffold-domain: FAIL: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
