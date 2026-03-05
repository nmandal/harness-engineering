import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scaffoldDomain } from "./scaffold-domain.js";

interface QuickstartArgs {
  name: string;
  wire: boolean;
  runChecks: boolean;
}

export function parseQuickstartArgs(argv: string[]): QuickstartArgs {
  let name = "starter";
  let wire = true;
  let runChecks = true;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--name") {
      name = argv[i + 1] ?? name;
      i += 1;
      continue;
    }

    if (token === "--no-wire") {
      wire = false;
      continue;
    }

    if (token === "--skip-check") {
      runChecks = false;
      continue;
    }

    if (!token.startsWith("-") && name === "starter") {
      name = token;
    }
  }

  return {
    name,
    wire,
    runChecks
  };
}

function runChecks(): void {
  const result = spawnSync("pnpm", ["check:all"], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    throw new Error("pnpm check:all failed; fix validation errors before continuing.");
  }
}

function printNextSteps(name: string, wired: boolean): void {
  const pascal = name
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");

  console.log("\nquickstart: SUCCESS");
  console.log("\nNext steps:");
  console.log("1) Start dev server: pnpm dev");
  console.log(`2) Edit product spec: docs/product-specs/${name}.md`);
  console.log(`3) Implement behavior in: app/src/domains/${name}/service/${name}Service.ts`);

  if (!wired) {
    console.log(`4) Wire panel in app shell: import { ${pascal}Panel } from \"./domains/${name}/ui/${pascal}Panel\" in app/src/App.tsx`);
  } else {
    console.log(`4) UI panel is already wired in app/src/App.tsx as <${pascal}Panel />`);
  }

  console.log("5) Re-run checks after edits: pnpm check:all");
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  try {
    const args = parseQuickstartArgs(process.argv.slice(2));
    const created = scaffoldDomain(process.cwd(), {
      name: args.name,
      force: false,
      wire: args.wire
    });

    console.log(`quickstart: scaffolded domain '${args.name}' (${created.length} files touched)`);

    if (args.runChecks) {
      runChecks();
    }

    printNextSteps(args.name, args.wire);
  } catch (error: unknown) {
    console.error(`quickstart: FAIL: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
