# AXI Benchmark Study: Agent Interface Comparison

## Overview

This study compares five different interfaces that AI agents use to interact with GitHub. All tasks target the same repository (`openclaw/openclaw`) and are graded by an LLM judge.

**Agent**: Claude Sonnet 4.6 (`claude-sonnet-4-6`)
**Judge**: Claude Sonnet 4.6
**Repeats**: 5 per condition × task
**Total runs**: 425 (5 conditions × 17 tasks × 5 repeats)
**Date**: 2026-03-21

## Conditions

| Condition             | Interface            | Description                                                                                                                                                                                  |
| --------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cli`                 | `gh` CLI             | Raw GitHub CLI — the baseline. Agent runs `gh issue list`, `gh pr view`, etc.                                                                                                                |
| `axi`                 | `gh-axi`             | AXI-compliant wrapper. Same subcommands as `gh` but with structured TOON output, pre-computed summaries (counts, check results), contextual suggestions, and progressive content disclosure. |
| `mcp-with-toolsearch` | GitHub MCP           | Remote MCP server (`api.githubcopilot.com/mcp/`). Agent discovers tools via ToolSearch, then invokes them.                                                                                   |
| `mcp-no-toolsearch`   | GitHub MCP (eager)   | Same MCP server but ToolSearch disabled — all tool schemas loaded into context upfront.                                                                                                      |
| `mcp-with-code-mode`  | TypeScript wrappers  | Agent writes `.ts` scripts that call typed functions wrapping GitHub operations, then runs them with `npx tsx`.                                                                              |
| `mcp-compressed-cli`  | mcp-compressor (CLI) | [mcp-compressor](https://github.com/atlassian-labs/mcp-compressor/) `--cli-mode`: generates a `github` shell script the agent calls via bash. One MCP help tool for discovery.               |

## Key Results (averages across 85 runs per condition)

| Condition           | Success% | Avg Cost   | Total Cost | Avg Duration | Avg Turns |
| ------------------- | -------- | ---------- | ---------- | ------------ | --------- |
| **axi**             | **100%** | **$0.050** | **$4.26**  | **15.7s**    | 3         |
| mcp-no-toolsearch   | 87%      | $0.148     | $12.59     | 34.2s        | 6         |
| cli                 | 86%      | $0.054     | $4.58      | 17.4s        | 3         |
| mcp-with-code-mode  | 84%      | $0.101     | $8.54      | 43.4s        | 7         |
| mcp-with-toolsearch | 82%      | $0.147     | $12.45     | 41.1s        | 8         |
| mcp-compressed-cli  | 71%      | $0.096     | $8.19      | 55.9s        | 5         |

## Findings

### 1. AXI achieves 100% reliability at lowest cost

AXI is the only condition that passes all 85 runs (17 tasks × 5 repeats) and does so at 7% lower total cost than CLI ($4.26 vs $4.58). AXI's structured output with pre-computed summaries guides the agent to correct answers in fewer turns.

### 2. AXI is faster with fewer input tokens

AXI averages 15.7s and 46K input tokens per task vs CLI's 17.4s and 47K. AXI's pre-computed summaries (counts, check results) eliminate follow-up calls that CLI agents must make, reducing both token usage and wall-clock time.

### 3. MCP conditions are 2–3× more expensive

All three MCP conditions cost $0.10–0.15/task vs $0.05 for CLI/AXI ($8.54–12.59 total vs $4.26–4.58). The MCP tool schemas consume significant context (137K–176K avg input tokens vs 46K–47K for CLI/AXI).

### 4. ToolSearch saves upfront tokens but spends them on extra turns

ToolSearch and eager-loading (no-toolsearch) end up at similar average cost (~$0.15/task) despite very different strategies:

|                  | mcp-no-toolsearch | mcp-with-toolsearch |
| ---------------- | ----------------- | ------------------- |
| Avg input tokens | 175,757           | 153,621             |
| Avg turns        | 6                 | 8                   |
| Total cost       | $12.59            | $12.45              |
| Success rate     | 87%               | 82%                 |

ToolSearch starts with a smaller context (~50K tokens, no schemas loaded upfront) compared to eager-loading (~83K+). But it needs ~1–2 extra turns per task to discover tools before using them. Each extra turn re-sends the entire growing context, so the savings from a smaller initial context are consumed by the accumulation across additional turns.

On complex tasks the pattern compounds. For `merged_pr_ci_audit`, ToolSearch spirals to 22 turns and $0.47/task — the agent repeatedly searches for the right tool, tries variations, and backtracks — while eager-loading completes in 15 turns at $0.34.

ToolSearch's lower success rate (87% vs 98%) stems from tool discovery failures:

- `list_labels` (0/5): agent can't find a dedicated label-listing tool via search
- `merged_pr_ci_audit` (1/5): spirals through tool discovery instead of doing the actual work
- `weekly_catchup` (3/5): wastes turns on discovery, leaving fewer turns for the multi-part task

The takeaway: lazy tool loading is a net negative when the agent needs most of the tools anyway. The 2-turn discovery overhead per task exceeds the context savings, and the indirection introduces a new failure mode (can't find the right tool). Eager-loading pays a fixed upfront cost but gives the agent immediate access to every tool, which is more reliable and no more expensive in practice.

### 5. Code-mode is cheapest among MCP conditions but still 2× CLI/AXI

Writing TypeScript scripts adds overhead (43.4s avg, 7 turns) but amortizes MCP schema costs by composing multiple operations in a single script: $0.101/task vs $0.147–0.148 for direct MCP. Still 2× more expensive than CLI/AXI.

### 6. mcp-compressor CLI mode: cheaper than MCP, less reliable than everything

[mcp-compressor](https://github.com/atlassian-labs/mcp-compressor/) `--cli-mode` generates a shell script (`github`) that the agent calls via bash instead of MCP tool calls. At $0.096/task it sits between CLI/AXI ($0.05) and direct MCP ($0.15), but its 71% success rate is the lowest of all conditions.

|                  | axi    | cli    | mcp-compressed-cli | mcp-no-toolsearch |
| ---------------- | ------ | ------ | ------------------ | ----------------- |
| Success%         | 100%   | 86%    | 71%                | 87%               |
| Avg cost         | $0.050 | $0.054 | $0.096             | $0.148            |
| Avg input tokens | 46K    | 47K    | 141K               | 176K              |
| Avg turns        | 3      | 3      | 5                  | 6                 |

The dominant failure modes (from trajectory analysis of failed runs):
- **CLI flag guessing** (4/5 failures): The compressor auto-generates non-standard flags from MCP schema parameter names (`--perPage`, `--method get_comments`, `--labels` not `--label`). The agent's prior on `gh` CLI conventions leads it to guess wrong on the first try, burning a turn on each error-recovery cycle.
- **Premature surrender** (3/5 failures): When a subcommand is missing, the agent gives up instead of trying `--help` on related commands or falling back to `gh`/`curl`. It sometimes invents restrictions ("CLAUDE.md prohibits `gh`/`curl`") to justify quitting.
- **Shallow data extraction** (2/5 failures): The agent uses `grep` on paginated CLI output and gets page-size counts (30) instead of reading the structured `totalCount` field from the same response. The compressor's toonified output includes metadata, but the agent doesn't parse it.
- **Missing tool surface** (2/5 failures): The GitHub Copilot MCP server doesn't expose workflow runs or list-labels through the compressor's CLI bridge, causing 0/5 on `run_then_jobs` and `list_labels`.
- **Over-extending past the answer** (1/5 failures): The agent finds the correct answer but keeps searching for a "better" one, producing a muddled multi-part response that the judge grades as incorrect.

See [STUDY-mcp-compressor.md](STUDY-mcp-compressor.md) for full analysis across all 5 compression modes.

### 7. Key AXI advantages by task type

- **Simple lookups** (list_open_issues, view_pr): AXI and CLI perform similarly. AXI's structured output offers marginal benefit.
- **Count-dependent tasks** (list_labels): AXI wins decisively (5/5 vs CLI 0/5) because it includes `totalCount` in output. CLI agents can't determine if they've seen all items.
- **Multi-step investigations** (ci_failure_investigation, merged_pr_ci_audit): AXI's contextual suggestions guide agents through the workflow in fewer turns. CLI agents discover the path through trial and error.
- **Error recovery** (invalid_issue, nonexistent_repo): All conditions handle these well. AXI's structured error messages are marginally more helpful.

## Methodology

- Each run creates a fresh shallow clone of `openclaw/openclaw`
- The agent receives a task prompt and condition-specific `CLAUDE.md` describing available tools
- Agent output is captured as stream-json and parsed for usage metrics
- A separate judge LLM evaluates the trajectory against task-specific criteria
- All trajectories and grades are archived in this directory

## Files

- `results.jsonl` — Raw results (one JSON object per run)
- `report.md` — Summary tables with per-task breakdowns
- `report.csv` — Full CSV export for analysis
- `{condition}/{task}/run{N}/` — Per-run artifacts:
  - `agent_output.txt` — Raw agent stream-json output
  - `grade.json` — Judge verdict (`{task_success, details}`)
  - `judge_output.txt` — Full judge response
