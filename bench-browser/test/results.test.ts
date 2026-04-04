import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clearResults } from "../src/results.js";

describe("clearResults", () => {
  it("creates results.jsonl when the results directory does not exist", () => {
    const resultsDir = mkdtempSync(join(tmpdir(), "axi-bench-results-"));
    const nestedResultsDir = join(resultsDir, "missing", "results");

    clearResults(nestedResultsDir, ["dev-browser"]);

    const resultsPath = join(nestedResultsDir, "results.jsonl");
    expect(existsSync(resultsPath)).toBe(true);
    expect(readFileSync(resultsPath, "utf-8")).toBe("");
  });
});
