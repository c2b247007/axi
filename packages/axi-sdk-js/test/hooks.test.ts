import { describe, expect, it } from "vitest";
import {
  computeCodexConfigUpdate,
  computeSessionStartHookUpdate,
  shouldInstallHooksForNodeAxiExecPath,
} from "../src/hooks.js";

describe("computeSessionStartHookUpdate", () => {
  it("installs a managed hook when no hooks exist", () => {
    const [updated, changed] = computeSessionStartHookUpdate(
      {},
      {
        marker: "gh-axi",
        command: "/usr/local/bin/gh-axi",
      },
    );

    expect(changed).toBe(true);
    expect(updated.hooks?.SessionStart).toEqual([
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: "/usr/local/bin/gh-axi",
            timeout: 10,
          },
        ],
      },
    ]);
  });

  it("preserves unrelated hook groups while adding a managed hook", () => {
    const [updated, changed] = computeSessionStartHookUpdate(
      {
        hooks: {
          SessionStart: [
            {
              matcher: "",
              hooks: [{ type: "command", command: "/usr/local/bin/other" }],
            },
          ],
        },
      },
      {
        marker: "gh-axi",
        command: "/usr/local/bin/gh-axi",
      },
    );

    expect(changed).toBe(true);
    expect(updated.hooks?.SessionStart).toHaveLength(2);
    expect(updated.hooks?.SessionStart?.[0]?.hooks?.[0]?.command).toBe(
      "/usr/local/bin/other",
    );
    expect(updated.hooks?.SessionStart?.[1]?.hooks?.[0]?.command).toBe(
      "/usr/local/bin/gh-axi",
    );
  });

  it("repairs a stale managed hook path in place", () => {
    const [updated, changed] = computeSessionStartHookUpdate(
      {
        hooks: {
          SessionStart: [
            {
              matcher: "",
              hooks: [
                {
                  type: "command",
                  command: "/old/path/gh-axi",
                  timeout: 10,
                },
              ],
            },
          ],
        },
      },
      {
        marker: "gh-axi",
        command: "/new/path/gh-axi",
        timeoutSeconds: 15,
      },
    );

    expect(changed).toBe(true);
    expect(updated.hooks?.SessionStart?.[0]?.hooks?.[0]).toEqual({
      type: "command",
      command: "/new/path/gh-axi",
      timeout: 15,
    });
  });

  it("removes managed legacy codex hooks when migrating to SessionStart", () => {
    const [updated, changed] = computeSessionStartHookUpdate(
      {
        hooks: {
          session_start: [
            { type: "command", command: "/old/path/gh-axi" },
            { type: "command", command: "/usr/local/bin/other" },
          ],
        },
      },
      {
        marker: "gh-axi",
        command: "/new/path/gh-axi",
      },
    );

    expect(changed).toBe(true);
    expect(updated.hooks?.session_start).toEqual([
      { type: "command", command: "/usr/local/bin/other" },
    ]);
    expect(updated.hooks?.SessionStart?.[0]?.hooks?.[0]?.command).toBe(
      "/new/path/gh-axi",
    );
  });

  it("is a no-op when the managed hook is already correct", () => {
    const settings = {
      hooks: {
        SessionStart: [
          {
            matcher: "",
            hooks: [
              {
                type: "command" as const,
                command: "/usr/local/bin/gh-axi",
                timeout: 10,
              },
            ],
          },
        ],
      },
    };

    const [updated, changed] = computeSessionStartHookUpdate(settings, {
      marker: "gh-axi",
      command: "/usr/local/bin/gh-axi",
    });

    expect(changed).toBe(false);
    expect(updated).toBe(settings);
  });
});

describe("computeCodexConfigUpdate", () => {
  it("creates a features section for empty config", () => {
    expect(computeCodexConfigUpdate("")).toEqual([
      "[features]\ncodex_hooks = true\n",
      true,
    ]);
  });

  it("adds codex_hooks inside an existing features section", () => {
    const [updated, changed] = computeCodexConfigUpdate(
      "[features]\nother = true\n",
    );

    expect(changed).toBe(true);
    expect(updated).toBe("[features]\nother = true\ncodex_hooks = true\n");
  });

  it("repairs codex_hooks when it is disabled", () => {
    const [updated, changed] = computeCodexConfigUpdate(
      "[features]\ncodex_hooks = false\n",
    );

    expect(changed).toBe(true);
    expect(updated).toBe("[features]\ncodex_hooks = true\n");
  });

  it("is a no-op when codex_hooks is already enabled", () => {
    const original = "[features]\ncodex_hooks = true\n";
    expect(computeCodexConfigUpdate(original)).toEqual([original, false]);
  });
});

describe("shouldInstallHooksForNodeAxiExecPath", () => {
  it("rejects development TypeScript entrypoints", () => {
    expect(
      shouldInstallHooksForNodeAxiExecPath(
        "/Users/me/src/gh-axi/bin/gh-axi.ts",
        {
          marker: "gh-axi",
          binaryNames: ["gh-axi"],
          distEntrypoints: ["dist/bin/gh-axi.js"],
        },
      ),
    ).toBe(false);
  });

  it("accepts packaged dist entrypoints", () => {
    expect(
      shouldInstallHooksForNodeAxiExecPath(
        "/Users/me/src/gh-axi/dist/bin/gh-axi.js",
        {
          marker: "gh-axi",
          binaryNames: ["gh-axi"],
          distEntrypoints: ["dist/bin/gh-axi.js"],
        },
      ),
    ).toBe(true);
  });
});
