# MCP-Compressor Benchmark: Compressed Tool Schemas for AI Agents

## Overview

This study extends the [baseline AXI benchmark](https://axi.md) by adding [mcp-compressor](https://github.com/atlassian-labs/mcp-compressor/) as a new interface category. MCP-compressor is a proxy that replaces N MCP tools with 2-3 wrapper tools (`github_list_tools`, `github_get_tool_schema`, `github_invoke_tool`), compressing tool schemas to reduce upfront token usage.

We tested all four compression levels (`low`, `medium`, `high`, `max`) plus the new **CLI mode** (`--cli-mode`), which replaces MCP tool calling entirely with a generated shell script:

| Level    | What the agent sees upfront                                |
| -------- | ---------------------------------------------------------- |
| `low`    | Full descriptions visible, can call `invoke_tool` directly |
| `medium` | First-sentence descriptions only                           |
| `high`   | Only tool/parameter names, no descriptions                 |
| `max`    | Nothing loaded — must call `list_tools` first              |
| `cli`    | One MCP help tool + `github` CLI via bash                  |

**Agent**: Claude Sonnet 4.6 (`claude-sonnet-4-6`)
**Judge**: Claude Sonnet 4.6
**Repeats**: 5 per condition x task
**Total runs**: 425 (5 conditions x 17 tasks x 5 repeats)
**Date**: 2026-03-24

## Results: All 10 Conditions Compared

Combined with the 5 baseline conditions (425 runs from STUDY.md), sorted by success rate:

| Condition             | Success% | Avg Cost   | Total Cost | Avg Duration | Avg Turns |
| --------------------- | -------- | ---------- | ---------- | ------------ | --------- |
| **axi**               | **100%** | **$0.050** | **$4.26**  | **15.7s**    | 3         |
| mcp-no-toolsearch     | 87%      | $0.148     | $12.59     | 34.2s        | 6         |
| cli                   | 86%      | $0.054     | $4.58      | 17.4s        | 3         |
| mcp-with-code-mode    | 84%      | $0.101     | $8.54      | 43.4s        | 7         |
| mcp-with-toolsearch   | 82%      | $0.147     | $12.45     | 41.1s        | 8         |
| mcp-compressed-medium | 72%      | $0.136     | $11.57     | 64.9s        | 6         |
| mcp-compressed-max    | 71%      | $0.142     | $12.09     | 48.4s        | 6         |
| mcp-compressed-cli    | 71%      | $0.096     | $8.19      | 55.9s        | 5         |
| mcp-compressed-low    | 69%      | $0.140     | $11.88     | 61.9s        | 6         |
| mcp-compressed-high   | 69%      | $0.146     | $12.38     | 65.8s        | 6         |

## Findings

### 1. Compression hurts reliability without saving cost

All five compressed conditions have **lower success rates (69-72%)** than every baseline condition, including the direct MCP conditions they're meant to improve (82-87%). Cost for the wrapper-based modes is nearly identical to direct MCP (~$0.14/task vs ~$0.15), and duration is actually worse (49-66s vs 34-41s).

The wrapper tool indirection (`list_tools` -> `get_tool_schema` -> `invoke_tool`) adds a failure mode without delivering the expected token savings. The agent still needs multiple turns to discover and invoke tools, and the extra abstraction layer confuses it.

### 2. CLI mode saves cost but not reliability

The new CLI mode (`--cli-mode`) replaces MCP wrapper tools with a generated shell script. Instead of calling `invoke_tool` with JSON arguments, the agent runs bash commands like `github list-issues --owner X --repo Y`.

| Mode           | Success% | Avg Cost | Total Cost | Avg Duration | Avg Turns |
| -------------- | -------- | -------- | ---------- | ------------ | --------- |
| compressed-cli | 71%      | $0.096   | $8.19      | 55.9s        | 5         |
| compressed-med | 72%      | $0.136   | $11.57     | 64.9s        | 6         |
| compressed-max | 71%      | $0.142   | $12.09     | 48.4s        | 6         |
| compressed-low | 69%      | $0.140   | $11.88     | 61.9s        | 6         |
| compressed-hi  | 69%      | $0.146   | $12.38     | 65.8s        | 6         |

CLI mode is **~30% cheaper** ($0.096 vs $0.136-0.146) with fewer tokens (141K vs 175-188K) and fewer turns (5 vs 6). But the success rate is unchanged at 71% — the same tier as wrapper-based compression.

The cost savings come from eliminating the verbose MCP tool schemas. The agent sees a single `github_help` MCP tool description with a compact subcommand listing, then invokes commands via bash (which is already available). However, the underlying problem persists: the agent must still discover tool names and guess parameter formats from help text.

### 3. Compression level doesn't matter

All four wrapper-based levels cluster tightly together in both success rate and cost:

| Level  | Success% | Avg Cost | Avg Duration |
| ------ | -------- | -------- | ------------ |
| medium | 72%      | $0.136   | 64.9s        |
| max    | 71%      | $0.142   | 48.4s        |
| low    | 69%      | $0.140   | 61.9s        |
| high   | 69%      | $0.146   | 65.8s        |

Whether the agent sees full descriptions (low) or nothing at all (max), the bottleneck is the wrapper tool pattern itself — not how much information is available upfront.

### 4. The wrapper/CLI layer compounds failure modes

All compressed conditions (including CLI mode) fail on the same tasks that challenge direct MCP, plus tasks that direct MCP handles fine:

| Task                     | Direct MCP (best) | Wrapper (best) | CLI mode |
| ------------------------ | ----------------- | -------------- | -------- |
| list_releases            | 5/5               | 0/5            | 0/5      |
| run_then_jobs            | 4/5               | 0/5            | 0/5      |
| ci_failure_investigation | 2/5               | 1/5            | 1/5      |
| merged_pr_ci_audit       | 3/5               | 1/5            | 2/5      |
| list_labels              | 0/5               | 0/5            | 0/5      |
| weekly_catchup           | 5/5               | 4/5            | 3/5      |

CLI mode matches or slightly beats the wrapper modes on `merged_pr_ci_audit` (2/5 vs 0-1/5), but performs worse on `weekly_catchup` (3/5 vs 4-5/5). The indirection — whether through `invoke_tool` or a CLI bridge — adds a meta-reasoning requirement that introduces confusion and premature abandonment.

### 5. Comparison with ToolSearch

MCP-compressor and ToolSearch solve the same problem (too many tool schemas in context) with different approaches:

|               | ToolSearch        | mcp-compressor (wrapper) | mcp-compressor (CLI) |
| ------------- | ----------------- | ------------------------ | -------------------- |
| Mechanism     | Lazy search/load  | Wrapper tools            | Shell script         |
| Tools visible | All names, search | 2-3 wrappers             | 1 help tool          |
| Schema access | Load on demand    | `get_tool_schema`        | `--help` flag        |
| Invocation    | Direct tool call  | `invoke_tool` proxy      | Bash command         |
| Success rate  | 82%               | 69-72%                   | 71%                  |
| Avg cost      | $0.147            | $0.136-0.146             | $0.096               |

ToolSearch wins on reliability because once a tool is discovered and loaded, the agent calls it directly with full schema support. CLI mode has the best cost profile of the compressed options, but shares the same reliability ceiling.

## Example: Wrapper Confusion on `run_then_jobs`

The `run_then_jobs` task asks the agent to look up a recent workflow run and its jobs. All four compressed conditions score 0/5 on this task, while `cli` and `axi` score 5/5.

Here is the trajectory from `mcp-compressed-medium`, run 1:

### Turn 2: Wrong starting point

```
TOOL CALL: github_invoke_tool
  tool_name: "list_issues"
  tool_input: { owner: "openclaw", repo: "openclaw", state: "open", perPage: 1 }
```

The agent starts with `list_issues` — the wrong tool entirely. It hasn't discovered what tools are available yet.

### Turn 3: Realizes it needs different tools

```
ASSISTANT: "I need to find workflow run tools. Let me check what's available"
```

### Turn 4: Wrapper confusion

```
TOOL CALL: github_invoke_tool
  tool_name: "github_list_tools"
```

**This is the critical error.** The agent passes `github_list_tools` as a `tool_name` argument to `github_invoke_tool`, trying to invoke a wrapper tool _through_ the wrapper. `github_list_tools` is a top-level MCP tool, not an underlying GitHub API tool — but the agent confuses the two layers.

### Turn 5: Gets schema for wrong tool

```
TOOL CALL: github_get_tool_schema
  tool_name: "list_issues"
```

Retrieves the schema for `list_issues`, which doesn't help with the workflow run task.

### Turn 7: Premature conclusion

```
ASSISTANT: "The available tools don't list workflow run tools, but let me try
calling one directly via github_invoke_tool"
```

### Turns 8-9: Guessing tool names

```
TOOL CALL: github_invoke_tool → tool_name: "list_workflow_runs"    (doesn't exist)
TOOL CALL: github_invoke_tool → tool_name: "get_workflow_runs"     (doesn't exist)
```

The agent guesses plausible tool names, but neither matches the actual name in the GitHub MCP server.

### Turn 10: Gives up

```
ASSISTANT: "There's no way to complete this task with the current toolset.
You'd need a GitHub MCP server that includes the Actions API endpoints."
```

The tools _do_ exist in the underlying server — the agent just never successfully listed them. The wrapper confusion in Turn 4 (calling `github_list_tools` through `github_invoke_tool` instead of directly) prevented tool discovery, leading to a cascade of guesses and ultimately abandonment.

This pattern — **meta-layer confusion causing discovery failure** — is the dominant failure mode across all compressed conditions. The agent has to reason about two APIs simultaneously (wrapper interface + underlying tool names) and frequently confuses which layer it's operating at.

## Methodology

- Same as [baseline study](https://axi.md): fresh shallow clone, Claude agent, LLM judge
- MCP-compressor runs as a stdio server via `uvx mcp-compressor` proxying the GitHub Copilot MCP endpoint
- All four compression levels tested with `--server-name github` (prefixing wrapper tools as `github_*`)
- CLI mode tested with `--cli-mode --server-name github`, which exposes a single `github_help` MCP tool and generates a `github` shell script that the agent calls via bash
- ToolSearch disabled for all compressed conditions

## Files

- `results.jsonl` — Combined raw results (850 runs: 425 baseline + 425 compressed)
- `report.md` — Summary tables with per-task breakdowns
- `report.csv` — Full CSV export for analysis
- `STUDY.md` — Original 5-condition baseline study
- `STUDY-mcp-compressor.md` — This file
