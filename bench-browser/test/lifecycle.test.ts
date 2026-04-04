import { describe, it, expect, vi, beforeEach } from "vitest";
import { startDaemon, stopDaemon, checkHealth } from "../src/lifecycle.js";
import * as child_process from "node:child_process";
import type { ConditionDef } from "../src/types.js";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

const mockedExecSync = vi.mocked(child_process.execSync);

function makeCondition(overrides: Partial<ConditionDef> = {}): ConditionDef {
  return {
    id: "agent-browser",
    name: "Test Condition",
    tool: "test",
    agents_md: "# Test",
    daemon: "auto",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("startDaemon", () => {
  it("runs install command for auto daemon", () => {
    const condition = makeCondition({
      daemon: "auto",
      install_command: "agent-browser install",
    });

    startDaemon(condition);

    expect(mockedExecSync).toHaveBeenCalledWith(
      "agent-browser install",
      expect.objectContaining({ timeout: 300_000 }),
    );
  });

  it("warms up auto daemon even without install command", () => {
    const condition = makeCondition({ daemon: "auto" });

    startDaemon(condition);

    // Should have called the warm-up command (agent-browser navigate about:blank)
    expect(mockedExecSync).toHaveBeenCalledWith(
      "agent-browser navigate about:blank",
      expect.objectContaining({ timeout: 15_000 }),
    );
  });

  it("runs daemon_start for explicit daemon", () => {
    // Health check succeeds immediately so waitForHealth exits fast
    mockedExecSync.mockReturnValue("");

    const condition = makeCondition({
      id: "chrome-devtools-axi",
      daemon: "explicit",
      daemon_start: "chrome-devtools-axi start",
      daemon_stop: "chrome-devtools-axi stop",
    });

    startDaemon(condition);

    expect(mockedExecSync).toHaveBeenCalledWith(
      "chrome-devtools-axi start",
      expect.objectContaining({ timeout: 15_000 }),
    );
  });

  it("runs install command before starting an explicit daemon", () => {
    mockedExecSync.mockReturnValue("");

    const condition = makeCondition({
      id: "dev-browser",
      daemon: "explicit",
      install_command: "dev-browser install",
      daemon_start: "dev-browser status",
      daemon_stop: "dev-browser stop",
    });

    startDaemon(condition);

    expect(mockedExecSync).toHaveBeenCalledWith(
      "dev-browser install",
      expect.objectContaining({ timeout: 300_000 }),
    );
    expect(mockedExecSync).toHaveBeenCalledWith(
      "dev-browser status",
      expect.objectContaining({ timeout: 15_000 }),
    );
  });

  it("throws when a strict explicit daemon never becomes healthy", () => {
    let now = 0;
    const dateNowSpy = vi.spyOn(Date, "now").mockImplementation(() => {
      now += 11_000;
      return now;
    });
    mockedExecSync.mockImplementation((cmd: string) => {
      if (cmd === "dev-browser install") return "";
      if (cmd === "dev-browser status") throw new Error("command not found");
      if (cmd.startsWith("sleep ")) return "";
      throw new Error(`unexpected command: ${cmd}`);
    });

    const condition = makeCondition({
      id: "dev-browser",
      daemon: "explicit",
      install_command: "dev-browser install",
      daemon_start: "dev-browser status",
      daemon_stop: "dev-browser stop",
      require_healthy_start: true,
    });

    expect(() => startDaemon(condition)).toThrow(/failed health check/i);
    dateNowSpy.mockRestore();
  });

  it("does nothing for none daemon", () => {
    const condition = makeCondition({
      id: "chrome-devtools-mcp",
      daemon: "none",
    });

    startDaemon(condition);

    expect(mockedExecSync).not.toHaveBeenCalled();
  });

  it("handles install command failure gracefully", () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error("already installed");
    });

    const condition = makeCondition({
      daemon: "auto",
      install_command: "agent-browser install",
    });

    // Should not throw
    expect(() => startDaemon(condition)).not.toThrow();
  });
});

describe("stopDaemon", () => {
  it("runs daemon_stop for explicit daemon", () => {
    mockedExecSync.mockReturnValue("");

    const condition = makeCondition({
      id: "chrome-devtools-axi",
      daemon: "explicit",
      daemon_stop: "chrome-devtools-axi stop",
    });

    stopDaemon(condition);

    expect(mockedExecSync).toHaveBeenCalledWith(
      "chrome-devtools-axi stop",
      expect.objectContaining({ timeout: 10_000 }),
    );
  });

  it("does nothing for none daemon (except orphan cleanup)", () => {
    mockedExecSync.mockReturnValue("");

    const condition = makeCondition({
      id: "chrome-devtools-mcp",
      daemon: "none",
    });

    stopDaemon(condition);

    // Only the orphan cleanup command should be called
    expect(mockedExecSync).toHaveBeenCalledTimes(1);
    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining("pkill"),
      expect.any(Object),
    );
  });

  it("handles daemon_stop failure gracefully", () => {
    mockedExecSync.mockImplementation((cmd: string) => {
      if (typeof cmd === "string" && cmd.includes("axi stop")) {
        throw new Error("not running");
      }
      return "";
    });

    const condition = makeCondition({
      id: "chrome-devtools-axi",
      daemon: "explicit",
      daemon_stop: "chrome-devtools-axi stop",
    });

    expect(() => stopDaemon(condition)).not.toThrow();
  });
});

describe("checkHealth", () => {
  it("returns true when health command succeeds", () => {
    mockedExecSync.mockReturnValue("");

    const condition = makeCondition({ id: "agent-browser" });
    expect(checkHealth(condition)).toBe(true);
  });

  it("returns false when health command fails", () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error("connection refused");
    });

    const condition = makeCondition({ id: "agent-browser" });
    expect(checkHealth(condition)).toBe(false);
  });

  it("returns true for MCP condition (no health check needed)", () => {
    const condition = makeCondition({ id: "chrome-devtools-mcp", daemon: "none" });
    expect(checkHealth(condition)).toBe(true);
    expect(mockedExecSync).not.toHaveBeenCalled();
  });

  it("uses dev-browser status as the health check", () => {
    mockedExecSync.mockReturnValue("");

    const condition = makeCondition({
      id: "dev-browser",
      daemon: "explicit",
      daemon_start: "dev-browser status",
      daemon_stop: "dev-browser stop",
    });

    expect(checkHealth(condition)).toBe(true);
    expect(mockedExecSync).toHaveBeenCalledWith(
      "dev-browser status",
      expect.objectContaining({ timeout: 5_000 }),
    );
  });
});
