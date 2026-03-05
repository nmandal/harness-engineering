import { describe, expect, it } from "vitest";
import { parseQuickstartArgs } from "../scripts/quickstart.js";

describe("quickstart args", () => {
  it("uses defaults", () => {
    expect(parseQuickstartArgs([])).toEqual({
      name: "starter",
      wire: true,
      runChecks: true
    });
  });

  it("parses custom options", () => {
    expect(parseQuickstartArgs(["--name", "billing", "--no-wire", "--skip-check"])).toEqual({
      name: "billing",
      wire: false,
      runChecks: false
    });
  });
});
