import path from "node:path";

export function repoRoot(start: string = process.cwd()): string {
  return start;
}

export function resolveFromRepo(...segments: string[]): string {
  return path.resolve(repoRoot(), ...segments);
}
