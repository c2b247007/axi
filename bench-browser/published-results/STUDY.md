# Browser Benchmark Study: Agent Interface Comparison

## Overview

This study compares how AI agents perform browser automation tasks across different interface paradigms: CLI tools, MCP servers, code execution, and compressed MCP wrappers. All conditions target the same set of public websites and are graded by an LLM judge.

**Agent**: Claude Sonnet 4.6 (`claude-sonnet-4-6`)
**Judge**: Claude Sonnet 4.6
**Repeats**: 5 per condition x task
**Total runs**: 560 (7 conditions x 16 tasks x 5 repeats)
**Total cost**: ~$97
**Date**: 2026-03-26

## Conditions

| Condition                            | Interface             | Description                                                                                                                   |
| ------------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `agent-browser`                      | Bash CLI (Rust)       | Vercel's Agent Browser. Agent runs `agent-browser navigate`, `agent-browser snapshot`, etc.                                   |
| `agent-browser-axi`                  | Bash CLI (AXI)        | AXI wrapper around agent-browser. Combined operations (action + snapshot in one call), TOON metadata, contextual suggestions. |
| `pinchtab`                           | Bash CLI (Go)         | PinchTab CLI. Agent runs `pinchtab nav`, `pinchtab snap`, etc.                                                                |
| `chrome-devtools-mcp`                | MCP (no ToolSearch)   | Chrome DevTools MCP server. All ~30 tool schemas loaded upfront. Agent calls tools directly.                                  |
| `chrome-devtools-mcp-search`         | MCP (with ToolSearch) | Same server, but tools discovered on-demand via ToolSearch.                                                                   |
| `chrome-devtools-mcp-code`           | TypeScript scripts    | Agent writes `.ts` scripts calling `callTool(name, args)` which forwards to chrome-devtools-mcp via a persistent MCP bridge.  |
| `chrome-devtools-mcp-compressed-cli` | MCP Compressor (CLI)  | mcp-compressor CLI mode generates a `chrome-devtools` shell command wrapping the MCP server. Agent uses Bash.                 |

All MCP-based conditions use the same backend: `chrome-devtools-mcp@latest --headless --isolated`.

## Key Results

| Condition                          | Success% | Avg Cost   | Total Cost | Avg Duration | Avg Turns |
| ---------------------------------- | -------- | ---------- | ---------- | ------------ | --------- |
| **agent-browser-axi**              | **100%** | **$0.148** | **$11.83** | **24.5s**    | **4.6**   |
| agent-browser                      | 100%     | $0.162     | $12.95     | 24.6s        | 6.3       |
| chrome-devtools-mcp-compressed-cli | 100%     | $0.171     | $13.64     | 28.1s        | 6.2       |
| chrome-devtools-mcp                | 99%      | $0.172     | $13.75     | 26.1s        | 5.3       |
| chrome-devtools-mcp-code           | 99%      | $0.218     | $17.46     | 42.4s        | 8.1       |
| chrome-devtools-mcp-search         | 88%      | $0.185     | $14.81     | 33.3s        | 7.3       |
| pinchtab                           | 86%      | $0.159     | $12.72     | 50.1s        | 5.9       |

## Findings

### 1. AXI wrapper matches 100% success at lowest cost and fewest turns

The AXI wrapper (`agent-browser-axi`) achieves 100% success at $0.148/task — 9% cheaper than raw `agent-browser` (100%, $0.162) with 27% fewer turns (4.6 vs 6.3). Both conditions now hit perfect success across all 16 tasks, so the story is no longer about a success gap but about efficiency. The primary mechanism is **combined operations**: every action command (click, fill, scroll, etc.) automatically returns a page snapshot, eliminating the separate `snapshot` call the agent would otherwise need. This reduces the number of Bash tool calls, which compounds across multi-step tasks.

| Metric           | agent-browser | agent-browser-axi | Delta |
| ---------------- | ------------- | ----------------- | ----- |
| Success          | 100%          | 100%              | 0pp   |
| Avg cost         | $0.162        | $0.148            | -9%   |
| Avg turns        | 6.3           | 4.6               | -27%  |
| Avg duration     | 24.6s         | 24.5s             | ~0%   |
| Avg input tokens | 211K          | 155K              | -26%  |

The cost advantage is smaller than the previous run (9% vs 48%) because the agent model's cache hit rate now dominates costs — both conditions benefit heavily from prompt caching (86% vs 79%), narrowing the absolute cost difference even as AXI uses 26% fewer input tokens. The turn reduction remains substantial and would amplify cost savings on models with lower cache rates.

This mirrors the GitHub benchmark finding where AXI achieved 100% success at 7% lower cost vs raw `gh` CLI. The browser benchmark confirms that combined operations consistently reduce turns without sacrificing success.

### 2. CLI tools and MCP Compressor outperform raw MCP

Three conditions achieve perfect 100% success: `agent-browser-axi`, `agent-browser`, and `chrome-devtools-mcp-compressed-cli`. The MCP Compressor CLI mode matches dedicated CLI tools by giving the agent a familiar Bash interface over the chrome-devtools-mcp backend. Raw MCP (`chrome-devtools-mcp`) is close at 99%, with its only failure on `httpbin_page_read` (4/5).

### 3. ToolSearch hurts browser automation

ToolSearch (88%) drops 11 percentage points vs eager-loading (99%). Chrome DevTools MCP exposes ~30 tools, and ToolSearch forces the agent to discover them on-demand. Key failures:

| Task                     | No ToolSearch | With ToolSearch |
| ------------------------ | ------------- | --------------- |
| `github_repo_stars`      | 5/5           | 0/5             |
| `navigate_404`           | 5/5           | 2/5             |
| `httpbin_page_read`      | 4/5           | 4/5             |
| `wikipedia_search_click` | 5/5           | 4/5             |

The agent wastes turns searching for tools (e.g., querying for "navigate" when the tool is `navigate_page`), and the discovery overhead compounds on multi-step tasks where each step requires finding a new tool. The `github_repo_stars` task is a total failure under ToolSearch — the agent never finds the right tools to get started.

This mirrors the GitHub benchmark finding: ToolSearch is a net negative when the agent needs most of the tools. The upfront context cost of loading all schemas (~30 tools) is far cheaper than the cumulative cost of discovery turns.

### 4. PinchTab struggles with specific task patterns

PinchTab (86%) has the lowest success rate in this run, driven by failures on several tasks:

| Task                     | PinchTab |
| ------------------------ | -------- |
| `wikipedia_search_click` | 0/5      |
| `wikipedia_infobox_hop`  | 3/5      |
| `multi_site_research`    | 3/5      |
| `navigate_404`           | 4/5      |
| `wikipedia_link_follow`  | 4/5      |

The `wikipedia_search_click` task is a complete failure — PinchTab's timeouts during Wikipedia search interactions cause the agent to give up. The multi-step Wikipedia tasks (`infobox_hop`, `link_follow`) also show brittleness, suggesting PinchTab's interaction model struggles with dynamic page content.

### 5. Code mode is competitive but adds latency

Code execution (99%) nearly matches raw MCP (99%) in success but is 63% slower (42.4s vs 26.1s). The agent spends time writing scripts, and each `npx tsx` invocation has startup overhead. However, code mode's `callTool(name, args)` interface is nearly identical to raw MCP — the comparison isolates the "write and execute code" paradigm from the tool interface itself.

### 6. `github_navigate_to_file` task redesigned — now universally solved

The previous version of this task asked the agent to navigate to `torvalds/linux` and read the 3.4MB MAINTAINERS file. GitHub cannot fully render files that large, making the task dependent on GitHub's UI implementation rather than the agent's browsing ability. All conditions scored poorly (0-2 out of 5).

The task was redesigned to navigate to `torvalds/linux` and read the Makefile (extracting VERSION and PATCHLEVEL values). All 7 conditions now score 5/5, confirming the previous failures were a task design issue, not a tool limitation.

### 7. Simple tasks are solved by all conditions

Single-step tasks (`read_static_page`, `wikipedia_fact_lookup`, `wikipedia_table_read`) achieve near-100% success across all conditions including ToolSearch. The browser automation tools are all capable — the differences emerge on complex multi-step workflows and edge cases.

## Task Categories

### Single-step (5 tasks): Navigate + read one page

All conditions score 90%+ except PinchTab on some edge cases. Tasks use stable targets (example.com, Wikipedia, httpbin.org).

### Multi-step (5 tasks): Navigate + interact + follow links

Conditions with 100% success (agent-browser, agent-browser-axi, chrome-devtools-mcp-compressed-cli) handle these cleanly. PinchTab and ToolSearch show the most failures here.

### Investigation (4 tasks): Complex multi-page extraction

Success ranges from 88% (ToolSearch) to 100% (agent-browser, agent-browser-axi). These tasks require maintaining context across many page navigations.

### Error recovery (2 tasks): Handle failures gracefully

Most conditions handle 404s and missing elements well (90%+). ToolSearch struggles with 404 detection (2/5), and PinchTab has occasional failures (4/5 on navigate_404).

## Methodology

- Each run creates a fresh workspace with condition-specific `CLAUDE.md`
- Agent isolation via `--strict-mcp-config` (prevents local MCP server leakage)
- All MCP conditions use `--headless --isolated` Chrome (no UI popups, clean profile per run)
- Code-mode uses a persistent MCP bridge (supergateway -> chrome-devtools-mcp) for cross-script state
- Agent output captured as stream-json and parsed for usage metrics (tokens, cost, duration, turns)
- A separate judge LLM evaluates the trajectory against task-specific grading hints

### Changes from previous run

- **`github_navigate_to_file` task redesigned**: Changed from reading the 3.4MB MAINTAINERS file (which GitHub cannot fully render) to reading VERSION/PATCHLEVEL from the Makefile
- **Parallel mode bug fix**: Fixed `killOrphanedBrowsers` in `lifecycle.ts` that was killing sibling conditions' browser daemons during parallel matrix runs. Added `BENCH_PARALLEL_CHILD` env var to prevent orphan cleanup in child processes
- **Cleanup improvement**: Added proper cleanup after `Promise.all` in parallel matrix execution

## Files

- `results.jsonl` — Raw results (one JSON object per run)
- `report.md` — Summary tables with per-task breakdowns
- `report.csv` — Full CSV export for analysis
- `{condition}/{task}/run{N}/` — Per-run artifacts:
  - `agent_output.txt` — Raw agent stream-json output
  - `grade.json` — Judge verdict (`{task_success, details}`)
  - `judge_output.txt` — Full judge response
