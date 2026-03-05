import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseArgs, scaffoldDomain } from "../scripts/scaffold-domain.js";

function withTempRepo(fn: (repoRoot: string) => void): void {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-scaffold-"));
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

describe("scaffold-domain", () => {
  it("parses args with wire and force", () => {
    const args = parseArgs(["--name", "billing", "--wire", "--force"]);
    expect(args).toEqual({ name: "billing", wire: true, force: true });
  });

  it("creates layered domain files and product spec", () => {
    withTempRepo((repoRoot) => {
      writeFile(
        path.join(repoRoot, "docs", "product-specs", "index.md"),
        "# Product Specs Index\n\nOwner: Nick\nLast Verified: 2026-03-05\nStatus: Active\n"
      );
      writeFile(
        path.join(repoRoot, "app", "src", "App.tsx"),
        'import { SettingsDashboard } from "./domains/settings/ui/SettingsDashboard";\n\nexport function App() {\n  return (\n    <main>\n      <SettingsDashboard />\n    </main>\n  );\n}\n'
      );

      const created = scaffoldDomain(repoRoot, { name: "billing", wire: true, force: false });

      expect(created.some((file) => file.includes("app/src/domains/billing/ui/BillingPanel.tsx"))).toBe(true);
      expect(created.some((file) => file === "docs/product-specs/billing.md")).toBe(true);

      const appSource = fs.readFileSync(path.join(repoRoot, "app", "src", "App.tsx"), "utf8");
      expect(appSource).toContain('import { BillingPanel } from "./domains/billing/ui/BillingPanel";');
      expect(appSource).toContain("<BillingPanel />");

      const specIndex = fs.readFileSync(path.join(repoRoot, "docs", "product-specs", "index.md"), "utf8");
      expect(specIndex).toContain("- [Billing Spec](./billing.md)");
    });
  });
});
