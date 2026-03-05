import fs from "node:fs";
import path from "node:path";

export function walkFiles(rootDir: string, predicate: (absolutePath: string) => boolean): string[] {
  const results: string[] = [];

  function walk(current: string): void {
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolute = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
          continue;
        }

        walk(absolute);
        continue;
      }

      if (predicate(absolute)) {
        results.push(absolute);
      }
    }
  }

  if (fs.existsSync(rootDir)) {
    walk(rootDir);
  }

  return results.sort();
}
