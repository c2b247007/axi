import { homedir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { installSessionStartHooks } = vi.hoisted(() => ({
  installSessionStartHooks: vi.fn(),
}));

vi.mock("../src/hooks.js", async () => {
  const actual =
    await vi.importActual<typeof import("../src/hooks.js")>("../src/hooks.js");
  return {
    ...actual,
    installSessionStartHooks,
  };
});

import { runAxiCli } from "../src/cli.js";
import { AxiError } from "../src/errors.js";

describe("runAxiCli", () => {
  const originalArgv = [...process.argv];
  const stdout = { write: vi.fn(() => true) };
  const initialize = vi.fn();
  const home = vi.fn(async () => "home output");
  const issue = vi.fn(async () => "issue output");

  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    process.argv = [...originalArgv];
  });

  afterEach(() => {
    process.exitCode = undefined;
    process.argv = [...originalArgv];
  });

  it("runs initializer before dispatch", async () => {
    await runAxiCli({
      argv: [],
      description: "Manage GitHub state",
      topLevelHelp: "top help",
      initialize,
      home,
      commands: { issue },
      stdout,
    });

    expect(initialize).toHaveBeenCalledTimes(1);
    expect(home).toHaveBeenCalledTimes(1);
  });

  it("shows top-level help for --help", async () => {
    await runAxiCli({
      argv: ["--help"],
      description: "Manage GitHub state",
      topLevelHelp: "top help",
      home,
      commands: { issue },
      stdout,
    });

    expect(stdout.write).toHaveBeenCalledWith("top help");
    expect(home).not.toHaveBeenCalled();
  });

  it("routes command help through getCommandHelp", async () => {
    await runAxiCli({
      argv: ["issue", "--help"],
      description: "Manage GitHub state",
      topLevelHelp: "top help",
      getCommandHelp: (command) =>
        command === "issue" ? "issue help" : undefined,
      home,
      commands: { issue },
      stdout,
    });

    expect(stdout.write).toHaveBeenCalledWith("issue help");
    expect(issue).not.toHaveBeenCalled();
  });

  it("routes to the matching command handler", async () => {
    await runAxiCli({
      argv: ["issue", "list"],
      description: "Manage GitHub state",
      topLevelHelp: "top help",
      home,
      commands: { issue },
      stdout,
    });

    expect(issue).toHaveBeenCalledWith(["list"], undefined);
    expect(stdout.write).toHaveBeenCalledWith("issue output\n");
  });

  it("defaults argv from process.argv", async () => {
    process.argv = ["node", "tool", "issue", "list"];

    await runAxiCli({
      description: "Manage GitHub state",
      topLevelHelp: "top help",
      home,
      commands: { issue },
      stdout,
    });

    expect(issue).toHaveBeenCalledWith(["list"], undefined);
  });

  it("serializes structured handler output at the boundary", async () => {
    issue.mockResolvedValueOnce({
      issues: [{ number: 1, title: "Fix auth", state: "open" }],
      help: ["Run tool issue view 1 for details"],
    });

    await runAxiCli({
      argv: ["issue", "list"],
      description: "Manage GitHub state",
      topLevelHelp: "top help",
      home,
      commands: { issue },
      stdout,
    });

    expect(String(stdout.write.mock.calls[0]?.[0])).toContain("issues[1]");
    expect(String(stdout.write.mock.calls[0]?.[0])).toContain("Fix auth");
    expect(String(stdout.write.mock.calls[0]?.[0])).toContain("help[1]:");
  });

  it("adds bin and description to the home view automatically", async () => {
    process.argv = ["node", `${homedir()}/.local/bin/axi-tool`];
    home.mockResolvedValueOnce({ browser: "no active session" });

    await runAxiCli({
      argv: [],
      description: "Manage browser state in the current workspace",
      topLevelHelp: "top help",
      home,
      commands: { issue },
      stdout,
    });

    expect(String(stdout.write.mock.calls[0]?.[0])).toContain(
      "bin: ~/.local/bin/axi-tool",
    );
    expect(String(stdout.write.mock.calls[0]?.[0])).toContain(
      "description: Manage browser state in the current workspace",
    );
    expect(String(stdout.write.mock.calls[0]?.[0])).toContain(
      "browser: no active session",
    );
  });

  it("installs hooks automatically from the executable path", async () => {
    process.argv = ["node", "/Users/me/src/gh-axi/dist/bin/gh-axi.js"];

    await runAxiCli({
      argv: [],
      description: "Manage GitHub state",
      topLevelHelp: "top help",
      home,
      commands: { issue },
      stdout,
    });

    expect(installSessionStartHooks).toHaveBeenCalledTimes(1);
    expect(installSessionStartHooks).toHaveBeenCalledWith(
      expect.objectContaining({
        marker: "gh-axi",
        execPath: "/Users/me/src/gh-axi/dist/bin/gh-axi.js",
      }),
    );

    const options = installSessionStartHooks.mock.calls[0]?.[0];
    expect(
      options.shouldInstall("/Users/me/src/gh-axi/dist/bin/gh-axi.js"),
    ).toBe(true);
    expect(options.shouldInstall("/Users/me/src/gh-axi/bin/gh-axi.ts")).toBe(
      false,
    );
  });

  it("allows automatic hook installation to be disabled", async () => {
    process.argv = ["node", "/Users/me/src/gh-axi/dist/bin/gh-axi.js"];

    await runAxiCli({
      argv: [],
      description: "Manage GitHub state",
      topLevelHelp: "top help",
      hooks: false,
      home,
      commands: { issue },
      stdout,
    });

    expect(installSessionStartHooks).not.toHaveBeenCalled();
  });

  it("supports preprocessing argv and context", async () => {
    await runAxiCli({
      argv: ["--repo", "owner/name", "issue", "list"],
      description: "Manage GitHub state",
      topLevelHelp: "top help",
      home,
      commands: { issue },
      resolve: (argv) => ({
        argv: argv.slice(2),
        context: { repo: argv[1] },
      }),
      stdout,
    });

    expect(issue).toHaveBeenCalledWith(["list"], { repo: "owner/name" });
  });

  it("writes structured unknown-command errors and usage exit code", async () => {
    await runAxiCli({
      argv: ["wat"],
      description: "Manage GitHub state",
      topLevelHelp: "top help",
      home,
      commands: { issue },
      stdout,
    });

    expect(String(stdout.write.mock.calls[0]?.[0])).toContain(
      "Unknown command: wat",
    );
    expect(process.exitCode).toBe(2);
  });

  it("maps validation errors to exit code 2", async () => {
    issue.mockRejectedValueOnce(
      new AxiError("Missing title", "VALIDATION_ERROR", [
        'Run `tool issue create --title "..."`',
      ]),
    );

    await runAxiCli({
      argv: ["issue", "create"],
      description: "Manage GitHub state",
      topLevelHelp: "top help",
      home,
      commands: { issue },
      stdout,
    });

    expect(String(stdout.write.mock.calls[0]?.[0])).toContain("Missing title");
    expect(process.exitCode).toBe(2);
  });
});
