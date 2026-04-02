<h1 align="center">axi-sdk-js</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/axi-sdk-js"><img alt="npm" src="https://img.shields.io/npm/v/axi-sdk-js?style=flat-square" /></a>
  <a href="https://github.com/kunchenguid/axi/actions/workflows/axi-sdk-js-ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/kunchenguid/axi/axi-sdk-js-ci.yml?style=flat-square&label=ci" /></a>
  <a href="https://github.com/kunchenguid/axi/actions/workflows/axi-sdk-js-release-please.yml"><img alt="Release" src="https://img.shields.io/github/actions/workflow/status/kunchenguid/axi/axi-sdk-js-release-please.yml?style=flat-square&label=release" /></a>
  <a href="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue?style=flat-square"><img alt="Platform" src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue?style=flat-square" /></a>
  <a href="https://x.com/kunchenguid"><img alt="X" src="https://img.shields.io/badge/X-@kunchenguid-black?style=flat-square" /></a>
  <a href="https://discord.gg/Wsy2NpnZDu"><img alt="Discord" src="https://img.shields.io/discord/1439901831038763092?style=flat-square&label=discord" /></a>
</p>

<h3 align="center">Ship AXIs without rewriting the boring parts.</h3>

Every Node-based AXI ends up redoing the same work: top-level dispatch, structured errors, TOON output, and hook installation for a few agents.

`axi-sdk-js` pulls those shared runtime pieces into one package. Your AXI can stay focused on business logic, work with plain JavaScript objects, and let the runtime handle official TOON serialization and session hook plumbing.

## Quick Start

```sh
$ npm install axi-sdk-js
added 1 package
```

```ts
import { runAxiCli } from "axi-sdk-js";

await runAxiCli({
  description: "Manage GitHub state in the current repository",
  topLevelHelp: TOP_LEVEL_HELP,
  home: async () => ({
    issues: [{ number: 12, title: "Fix auth bug", state: "open" }],
    help: ["Run `gh-axi issue view <number>` for details"],
  }),
  commands: {
    issue: issueCommand,
    pr: prCommand,
  },
});
```

## Reference

`axi-sdk-js` is a library package. In normal use, `runAxiCli()` should be the main entry point.

| API           | Description                                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runAxiCli()` | Shared runtime for argv handling, command dispatch, home header injection, TOON serialization, standardized errors, and automatic best-effort hook installation |

### Advanced Exports

Most AXI authors should not need these directly.

| API                                      | Description                                                    |
| ---------------------------------------- | -------------------------------------------------------------- |
| `AxiError`                               | Throw structured AXI errors from command handlers              |
| `installSessionStartHooks()`             | Install or repair Claude Code and Codex session hooks directly |
| `shouldInstallHooksForNodeAxiExecPath()` | Check whether an executable path should self-install hooks     |

## Development

```sh
cd packages/axi-sdk-js && npm ci # Install dependencies
npm test # Run tests
npm run build # Build dist output
```
