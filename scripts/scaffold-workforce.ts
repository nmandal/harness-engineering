import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

interface WorkforceArgs {
  web: string;
  api: string;
  includeNext: boolean;
  includeFastApi: boolean;
  force: boolean;
  runChecks: boolean;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeName(value: string, fallback: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-");
  if (!normalized || !/^[a-z][a-z0-9-]*$/.test(normalized)) {
    return fallback;
  }

  return normalized;
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

function appendProductSpecIndex(repoRoot: string, title: string, targetPath: string): void {
  const indexPath = path.join(repoRoot, "docs", "product-specs", "index.md");
  if (!fs.existsSync(indexPath)) {
    return;
  }

  const line = `- [${title}](./${targetPath})`;
  const current = fs.readFileSync(indexPath, "utf8");
  if (current.includes(line)) {
    return;
  }

  fs.writeFileSync(indexPath, `${current.trimEnd()}\n${line}\n`);
}

function ensureWorkspacePatterns(repoRoot: string): void {
  const workspacePath = path.join(repoRoot, "pnpm-workspace.yaml");
  if (!fs.existsSync(workspacePath)) {
    return;
  }

  const required = ["  - apps/*", "  - packages/*", "  - services/*", "  - app"];
  const current = fs.readFileSync(workspacePath, "utf8");
  const lines = current.split("\n").filter((line) => line.length > 0);
  const set = new Set(lines);

  for (const line of required) {
    set.add(line);
  }

  const next = ["packages:", ...Array.from(set).filter((line) => line.startsWith("  - ")).sort()].join("\n");
  fs.writeFileSync(workspacePath, `${next}\n`);
}

function scaffoldNextApp(repoRoot: string, web: string, force: boolean): string[] {
  const created: string[] = [];
  const appRoot = path.join(repoRoot, "apps", web);
  const webPascal = toPascalCase(web);

  const files: Array<[string, string]> = [
    [
      path.join(appRoot, "package.json"),
      `{
  "name": "@harness/${web}",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hookform/resolvers": "latest",
    "@tanstack/react-query": "latest",
    "@tanstack/react-query-devtools": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "framer-motion": "latest",
    "lucide-react": "latest",
    "next": "latest",
    "next-themes": "latest",
    "react": "latest",
    "react-dom": "latest",
    "react-hook-form": "latest",
    "tailwind-merge": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "autoprefixer": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "postcss": "latest",
    "tailwindcss": "latest",
    "typescript": "latest"
  }
}
`
    ],
    [
      path.join(appRoot, "tsconfig.json"),
      `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`
    ],
    [
      path.join(appRoot, "next-env.d.ts"),
      `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`
    ],
    [
      path.join(appRoot, "next.config.mjs"),
      `/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
`
    ],
    [
      path.join(appRoot, "postcss.config.mjs"),
      `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
`
    ],
    [
      path.join(appRoot, "tailwind.config.ts"),
      `import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      }
    }
  },
  plugins: []
};

export default config;
`
    ],
    [
      path.join(appRoot, "components.json"),
      `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib"
  }
}
`
    ],
    [
      path.join(appRoot, ".eslintrc.json"),
      `{
  "extends": ["next/core-web-vitals"]
}
`
    ],
    [
      path.join(appRoot, "lib", "utils.ts"),
      `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
`
    ],
    [
      path.join(appRoot, "app", "globals.css"),
      `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.75rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}

* {
  @apply border-border;
}

body {
  @apply bg-background text-foreground min-h-screen antialiased;
  font-family: "SF Pro Text", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
}
`
    ],
    [
      path.join(appRoot, "components", "ui", "button.tsx"),
      `"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);

Button.displayName = "Button";
`
    ],
    [
      path.join(appRoot, "components", "ui", "card.tsx"),
      `import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return <div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>): React.ReactElement {
  return <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>): React.ReactElement {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}
`
    ],
    [
      path.join(appRoot, "components", "ui", "badge.tsx"),
      `import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): React.ReactElement {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
`
    ],
    [
      path.join(appRoot, "components", "ui", "input.tsx"),
      `import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>): React.ReactElement {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  );
}
`
    ],
    [
      path.join(appRoot, "app", "providers.tsx"),
      `"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }): React.ReactElement {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
`
    ],
    [
      path.join(appRoot, "components", "workforce-launchpad.tsx"),
      `import { ArrowRight, Rocket, ShieldCheck, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    title: "Ship Faster",
    description: "Generate domains, services, and checks with one command.",
    icon: Rocket
  },
  {
    title: "Keep Guardrails",
    description: "Architecture and docs constraints stay enforceable from day one.",
    icon: ShieldCheck
  },
  {
    title: "Orchestrate Teams",
    description: "Run multiple apps and APIs with explicit evidence contracts.",
    icon: Workflow
  }
];

export function WorkforceLaunchpad(): React.ReactElement {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="space-y-4">
        <Badge variant="secondary">Agent Workforce Starter</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">Launch a monorepo that is ready for real delivery.</h1>
        <p className="max-w-3xl text-muted-foreground">
          This Next.js workspace is prewired for a harness-first workflow: strong defaults, shared UI primitives, and
          service-friendly boundaries.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button>
            Start Building
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="ghost">Open Architecture Map</Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <Card key={pillar.title} className="border-border/70">
            <CardHeader>
              <pillar.icon className="h-6 w-6" />
              <CardTitle className="text-xl">{pillar.title}</CardTitle>
              <CardDescription>{pillar.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Wire this pillar into your team standards and keep the rules machine-checkable.
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
`
    ],
    [
      path.join(appRoot, "app", "layout.tsx"),
      `import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "${webPascal} Workforce",
  description: "Monorepo workforce starter powered by harness engineering."
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`
    ],
    [
      path.join(appRoot, "app", "page.tsx"),
      `import { WorkforceLaunchpad } from "@/components/workforce-launchpad";

export default function Page(): React.ReactElement {
  return <WorkforceLaunchpad />;
}
`
    ],
    [
      path.join(appRoot, "README.md"),
      `# ${webPascal} App

Generated by \`pnpm scaffold:workforce\`.

## Run

\`\`\`bash
pnpm --dir apps/${web} dev
\`\`\`

## Key Stack

- Next.js App Router
- shadcn-style UI primitives (\`components/ui\`)
- Tailwind + CSS variables
- React Query and typed utility scaffolding
`
    ]
  ];

  for (const [filePath, content] of files) {
    writeFileSafely(filePath, content, force);
    created.push(path.relative(repoRoot, filePath));
  }

  return created;
}

function scaffoldFastApiService(repoRoot: string, api: string, force: boolean): string[] {
  const created: string[] = [];
  const serviceRoot = path.join(repoRoot, "services", api);
  const apiPascal = toPascalCase(api);

  const files: Array<[string, string]> = [
    [
      path.join(serviceRoot, "pyproject.toml"),
      `[project]
name = "${api.replace(/-/g, "_")}"
version = "0.1.0"
description = "FastAPI service scaffolded by harness workforce starter"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
  "fastapi>=0.115.0",
  "uvicorn[standard]>=0.30.0",
  "pydantic-settings>=2.0.0"
]

[project.optional-dependencies]
dev = [
  "pytest>=8.0.0",
  "httpx>=0.27.0"
]

[build-system]
requires = ["setuptools>=68.0.0"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
include = ["app*"]
`
    ],
    [
      path.join(serviceRoot, "app", "__init__.py"),
      ""
    ],
    [
      path.join(serviceRoot, "app", "main.py"),
      `from fastapi import FastAPI

app = FastAPI(title="${apiPascal} Service", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "${api}", "message": "Harness-ready FastAPI service"}
`
    ],
    [
      path.join(serviceRoot, "tests", "__init__.py"),
      ""
    ],
    [
      path.join(serviceRoot, "tests", "test_health.py"),
      `from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
`
    ],
    [
      path.join(serviceRoot, "README.md"),
      `# ${apiPascal} Service

Generated by \`pnpm scaffold:workforce\`.

## Run

\`\`\`bash
cd services/${api}
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
\`\`\`
`
    ]
  ];

  for (const [filePath, content] of files) {
    writeFileSafely(filePath, content, force);
    created.push(path.relative(repoRoot, filePath));
  }

  return created;
}

function writeProductSpecs(
  repoRoot: string,
  web: string,
  api: string,
  includeNext: boolean,
  includeFastApi: boolean,
  force: boolean
): string[] {
  const created: string[] = [];
  const date = todayIso();
  if (includeNext) {
    const webTitle = `${toPascalCase(web)} App Spec`;
    const webSpecPath = `${web}-app.md`;
    const webSpecAbsolute = path.join(repoRoot, "docs", "product-specs", webSpecPath);

    writeFileSafely(
      webSpecAbsolute,
      `# ${webTitle}

Owner: Nick
Last Verified: ${date}
Status: Draft

## Problem

Define the user jobs this app should satisfy.

## Scope

- In scope:
- Out of scope:

## Acceptance Criteria

1.
2.
3.
`,
      force
    );
    created.push(path.relative(repoRoot, webSpecAbsolute));
    appendProductSpecIndex(repoRoot, webTitle, webSpecPath);
  }

  if (includeFastApi) {
    const apiTitle = `${toPascalCase(api)} Service Spec`;
    const apiSpecPath = `${api}-service.md`;
    const apiSpecAbsolute = path.join(repoRoot, "docs", "product-specs", apiSpecPath);

    writeFileSafely(
      apiSpecAbsolute,
      `# ${apiTitle}

Owner: Nick
Last Verified: ${date}
Status: Draft

## Problem

Define the core API capabilities and service-level goals.

## Scope

- In scope:
- Out of scope:

## Acceptance Criteria

1.
2.
3.
`,
      force
    );
    created.push(path.relative(repoRoot, apiSpecAbsolute));
    appendProductSpecIndex(repoRoot, apiTitle, apiSpecPath);
  }

  return created;
}

function runChecksIfEnabled(runChecks: boolean): void {
  if (!runChecks) {
    return;
  }

  const docs = spawnSync("pnpm", ["lint:docs"], { stdio: "inherit" });
  if (docs.status !== 0) {
    throw new Error("pnpm lint:docs failed. Update docs metadata/index links and retry.");
  }

  const architecture = spawnSync("pnpm", ["lint:architecture"], { stdio: "inherit" });
  if (architecture.status !== 0) {
    throw new Error("pnpm lint:architecture failed. Fix guardrails and retry.");
  }
}

export function parseWorkforceArgs(argv: string[]): WorkforceArgs {
  let web = "web";
  let api = "api";
  let includeNext = true;
  let includeFastApi = true;
  let force = false;
  let runChecks = true;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--web") {
      web = argv[i + 1] ?? web;
      i += 1;
      continue;
    }

    if (token === "--api") {
      api = argv[i + 1] ?? api;
      i += 1;
      continue;
    }

    if (token === "--no-next") {
      includeNext = false;
      continue;
    }

    if (token === "--no-fastapi") {
      includeFastApi = false;
      continue;
    }

    if (token === "--force") {
      force = true;
      continue;
    }

    if (token === "--skip-check") {
      runChecks = false;
      continue;
    }
  }

  return {
    web: normalizeName(web, "web"),
    api: normalizeName(api, "api"),
    includeNext,
    includeFastApi,
    force,
    runChecks
  };
}

export function scaffoldWorkforce(repoRoot: string, args: WorkforceArgs): string[] {
  if (!args.includeNext && !args.includeFastApi) {
    throw new Error("At least one target must be enabled. Remove --no-next or --no-fastapi.");
  }

  ensureWorkspacePatterns(repoRoot);

  const created: string[] = [];
  if (args.includeNext) {
    created.push(...scaffoldNextApp(repoRoot, args.web, args.force));
  }

  if (args.includeFastApi) {
    created.push(...scaffoldFastApiService(repoRoot, args.api, args.force));
  }

  created.push(...writeProductSpecs(repoRoot, args.web, args.api, args.includeNext, args.includeFastApi, args.force));
  runChecksIfEnabled(args.runChecks);
  return created;
}

function printNextSteps(args: WorkforceArgs): void {
  console.log("\nscaffold-workforce: SUCCESS");
  console.log("\nNext steps:");
  console.log("1) Install workspace dependencies: pnpm install");
  if (args.includeNext) {
    console.log(`2) Start Next app: pnpm --dir apps/${args.web} dev`);
  } else {
    console.log("2) Next.js generation was skipped (--no-next).");
  }
  if (args.includeFastApi) {
    console.log(`3) Start FastAPI: cd services/${args.api} && python -m venv .venv && source .venv/bin/activate && pip install -e \".[dev]\" && uvicorn app.main:app --reload --port 8000`);
    console.log(`4) Define service contract: docs/product-specs/${args.api}-service.md`);
  } else {
    console.log("3) FastAPI generation was skipped (--no-fastapi).");
  }
  if (args.includeNext) {
    console.log(`5) Define app contract: docs/product-specs/${args.web}-app.md`);
  } else {
    console.log("5) App spec generation skipped because --no-next was provided.");
  }
  console.log("6) Run harness checks: pnpm check:all");
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  try {
    const args = parseWorkforceArgs(process.argv.slice(2));
    const created = scaffoldWorkforce(process.cwd(), args);
    console.log(`scaffold-workforce: created ${created.length} files`);
    for (const file of created) {
      console.log(`- ${file}`);
    }
    printNextSteps(args);
  } catch (error: unknown) {
    console.error(`scaffold-workforce: FAIL: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
