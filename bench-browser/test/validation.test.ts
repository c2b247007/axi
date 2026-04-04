import { describe, it, expect } from "vitest";
import { validateCommandPolicy } from "../src/validation.js";
import type { ConditionDef } from "../src/types.js";

function makeCondition(overrides: Partial<ConditionDef> = {}): ConditionDef {
  return {
    id: "dev-browser",
    name: "Dev Browser",
    tool: "dev-browser",
    agents_md: "# Tools",
    daemon: "explicit",
    ...overrides,
  };
}

describe("validateCommandPolicy", () => {
  it("fails when no required command prefix was used", () => {
    const condition = makeCondition({
      command_policy: {
        require_any_prefix: ["dev-browser", "npx dev-browser"],
      },
    });

    const result = validateCommandPolicy(condition, [
      "which dev-browser",
      "agent-browser open https://example.com",
    ]);

    expect(result).toContain("required command prefix");
  });

  it("fails when a forbidden browser tool appears in the command log", () => {
    const condition = makeCondition({
      command_policy: {
        require_any_prefix: ["dev-browser", "npx dev-browser"],
        forbid_any_prefix: ["agent-browser", "chrome-devtools-axi"],
      },
    });

    const result = validateCommandPolicy(condition, [
      "dev-browser --headless run step1.js",
      "agent-browser eval \"document.title\"",
    ]);

    expect(result).toContain("forbidden browser command");
    expect(result).toContain("agent-browser");
  });

  it("passes when the command log matches the policy", () => {
    const condition = makeCondition({
      command_policy: {
        require_any_prefix: ["dev-browser"],
        forbid_any_prefix: ["agent-browser", "chrome-devtools-axi"],
      },
    });

    const result = validateCommandPolicy(condition, [
      "dev-browser --headless --browser axi run step1.js",
    ]);

    expect(result).toBeNull();
  });

  it("matches required prefix inside heredoc compound commands", () => {
    const condition = makeCondition({
      command_policy: { require_any_prefix: ["dev-browser"] },
    });

    const result = validateCommandPolicy(condition, [
      "cat << 'EOF' > /tmp/script.js\nconsole.log('hello');\nEOF\ndev-browser --headless run /tmp/script.js",
    ]);

    expect(result).toBeNull();
  });

  it("matches required prefix after && or ; separators", () => {
    const condition = makeCondition({
      command_policy: { require_any_prefix: ["dev-browser"] },
    });

    expect(validateCommandPolicy(condition, [
      "cd /tmp && dev-browser run script.js",
    ])).toBeNull();

    expect(validateCommandPolicy(condition, [
      "echo start; dev-browser run script.js",
    ])).toBeNull();
  });

  it("matches required prefix after leading env var assignments", () => {
    const condition = makeCondition({
      command_policy: { require_any_prefix: ["dev-browser"] },
    });

    expect(validateCommandPolicy(condition, [
      "NODE_ENV=test dev-browser run script.js",
    ])).toBeNull();
  });

  it("passes when required prefix appears in sub-agent prompt (rawOutput fallback)", () => {
    const condition = makeCondition({
      command_policy: { require_any_prefix: ["agent-browser"] },
    });
    const rawOutput = '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Agent","input":{"prompt":"Use the agent-browser CLI to visit https://example.com"}}]}}';

    expect(validateCommandPolicy(condition, ["tail -f /tmp/log"], rawOutput)).toBeNull();
  });

  it("still fails when rawOutput has no evidence of required prefix", () => {
    const condition = makeCondition({
      command_policy: { require_any_prefix: ["agent-browser"] },
    });
    const rawOutput = '{"type":"assistant","message":{"content":[{"type":"text","text":"done"}]}}';

    expect(validateCommandPolicy(condition, ["tail -f /tmp/log"], rawOutput)).toContain("required command prefix");
  });

  it("accepts npx invocations for the same tool family", () => {
    const condition = makeCondition({
      command_policy: {
        require_any_prefix: ["chrome-devtools-axi"],
        forbid_any_prefix: ["agent-browser"],
      },
    });

    const result = validateCommandPolicy(condition, [
      "npx chrome-devtools-axi open https://example.com",
    ]);

    expect(result).toBeNull();
  });
});
