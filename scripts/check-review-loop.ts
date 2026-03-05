import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED_TOKENS = ["UI Evidence:", "OBS Evidence:", "Rollback Plan:"];

function extractPrBody(): string {
  if (process.env.PR_BODY) {
    return process.env.PR_BODY;
  }

  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    return "";
  }

  const payload = JSON.parse(fs.readFileSync(eventPath, "utf8"));
  return payload.pull_request?.body ?? "";
}

export function validateReviewLoop(body: string): string[] {
  const missing = REQUIRED_TOKENS.filter((token) => !body.includes(token));
  return missing;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const body = extractPrBody();

  if (!body) {
    console.log("review-loop-check: skipped (no PR body found in current context)");
    process.exit(0);
  }

  const missing = validateReviewLoop(body);

  if (missing.length > 0) {
    console.error("review-loop-check: FAIL");
    for (const token of missing) {
      console.error(`- Missing token: ${token}`);
    }
    console.error("Remediation: include UI Evidence, OBS Evidence, and Rollback Plan in PR description.");
    process.exit(1);
  }

  console.log("review-loop-check: PASS");
}
