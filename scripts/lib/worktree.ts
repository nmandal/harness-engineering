import crypto from "node:crypto";

export interface WorktreePorts {
  appPort: number;
  obsPort: number;
  hash: number;
  worktreePath: string;
}

export function computeWorktreePorts(worktreePath: string = process.cwd()): WorktreePorts {
  const hash = crypto.createHash("sha256").update(worktreePath).digest().readUInt16BE(0);
  const appPort = 4100 + (hash % 300);
  const obsPort = appPort + 1000;

  return {
    appPort,
    obsPort,
    hash,
    worktreePath
  };
}
