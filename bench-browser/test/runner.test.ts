import { describe, it, expect } from "vitest";
import { renderAgentsMd } from "../src/runner.js";
import type { ConditionDef, RunSpec } from "../src/types.js";

describe("renderAgentsMd", () => {
  it("renders a per-run dev-browser command placeholder", () => {
    const spec: RunSpec = {
      condition: "dev-browser",
      task: "navigate_404",
      run: 2,
      model: "claude-sonnet-4-6",
    };
    const condition: ConditionDef = {
      id: "dev-browser",
      name: "Dev Browser",
      tool: "dev-browser",
      agents_md: "Run `__AXI_BENCH_DEV_BROWSER_CMD__ run step.js`.",
      daemon: "explicit",
      daemon_start: "dev-browser status",
      daemon_stop: "dev-browser stop",
    };

    expect(renderAgentsMd(spec, condition)).toContain(
      "dev-browser --headless --browser axi-bench-dev-browser-navigate_404-run2 run step.js",
    );
  });
});
