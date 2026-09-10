# Project Agent Operating Rules

These rules apply to every task in this repository.

## Workspace boundary

- Keep all project work, generated artifacts, caches, temporary files, test outputs, and context documents inside `D:\drone-mapping\oil-palm-1.5-gui`.
- Do not create project artifacts on `C:`. Reading installed tools or skills from `C:` is allowed only when required to operate them.
- Before running a tool that may use a global cache or temporary directory, redirect its project-specific cache/temp output into this repository when the tool supports it.

## Engineering principles

- Apply YAGNI: implement only behavior required by the current task and its verified acceptance criteria.
- Divide each task into the smallest independently verifiable subtasks practical.
- Do not begin a dependent subtask until tests covering the completed area pass.
- Prefer deterministic commands, fixed inputs, explicit paths, and reproducible outputs.
- Avoid speculative abstractions, unrelated refactors, or premature extensibility.

## Required coding workflow

For every coding change:

1. Define small subtasks and acceptance criteria.
2. Assign a subagent to write tests and test cases, including relevant boundary conditions and edge cases.
3. Assign a different subagent to run the tests independently.
4. If any test fails or execution goes wrong, assign another subagent to diagnose the evidence and write a fix plan.
5. Apply the smallest justified fix.
6. Repeat independent test execution. Continue only when all tests for the affected area pass.

If concurrency limits prevent all roles from running simultaneously, run the roles sequentially while preserving role separation.

## Context management

- Maintain an architecture decision/context record under `docs/architecture/`. Record decisions, constraints, affected components, important caveats, and pointers to the codebase map or changed files. Do not duplicate full specs, diffs, or test output; link to their paths.
- Maintain `HANDOFF.md` as a compact continuation document for a fresh agent. It must summarize current status, remaining work, and suggested skills, while referencing existing ADRs, plans, issues, commits, diffs, and maps rather than duplicating them.
- Keep the codebase map at `.understand-anything/knowledge-graph.json` and reference it from context documents.

## Code discovery

Prefer the codebase knowledge-graph tools in this order:

1. `search_graph`
2. `trace_path`
3. `get_code_snippet`
4. `query_graph`
5. `get_architecture`

Run `index_repository` when the repository is not indexed. Fall back to direct text/file search only for literals, configuration, non-code files, or insufficient graph results.
