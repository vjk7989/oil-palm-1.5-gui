# ADR 0001: Project Context and Agent Workflow

- Status: Accepted
- Date: 2026-09-10

## Context

PalmWatch is a browser-delivered operational demo for oil-palm monitoring. The base operational portfolio is limited to Andhra Pradesh, uses deterministic fixture data, and applies role scope for System Administrator, CEO / General Manager, Plantation Head, Area Manager, and Field Staff. Public company context and company-selection data are distinct from the role-scoped AP operational portfolio.

The repository is intentionally small. There is no application server, build pipeline, or package dependency tree in the current implementation.

## Verified architecture

- `index.html` is the runtime entry point and contains the application markup, CSS, deterministic data model, browser state, rendering functions, and event binding.
- The central inline `render()` flow dispatches the current role-scoped page. Geography, portfolio metrics, tables, maps, farm grids, tree evidence, reports, cases, treatments, administration, settings, and the preview-only New Farm workflow are rendered from the same embedded application model.
- Leaflet 1.9.4 is loaded from unpkg with Subresource Integrity. OpenStreetMap supplies map tiles; the UI also contains a fallback state.
- Browser-local versioned demo state supports selected operational UI actions and preferences. The active New Farm workflow is deliberately preview-only and does not persist farms or trees.
- Static images under `assets/` provide company logos and tree-evidence derivatives.
- `tests/static-check.mjs` is the verification entry point. It reads `index.html` and assets and checks UI contracts, deterministic model totals and geography, role scope, accessibility/responsiveness invariants, state migration, evidence metadata, and New Farm boundaries and edge cases.
- `npm test` and `npm run build` both execute `node tests/static-check.mjs`; there is no separate compilation step.

Product and visual intent are defined in `README.md`, `PRODUCT.md`, and `DESIGN.md`. Those files remain the source of truth for their respective concerns and are not repeated here.

## Working decisions

1. Keep every project artifact, cache, temporary file, test output, and context document inside `D:\drone-mapping\oil-palm-1.5-gui`. Do not create project artifacts on `C:`.
2. Apply YAGNI: implement only the current task and verified acceptance criteria. Avoid speculative abstractions, unrelated refactors, and premature extensibility.
3. Split coding work into the smallest practical independently verifiable subtasks. A dependent subtask starts only after tests for the completed area pass.
4. Use deterministic commands, fixed inputs, explicit paths, and reproducible outputs.
5. For every coding change, preserve role separation: one subagent writes tests and edge cases, another independently runs them, and a third diagnoses failures and proposes the smallest fix plan when needed. Re-run independently until the affected test gate is green.
6. Maintain this architecture/context record as decisions and component boundaries change. Reference source files, plans, diffs, and test output instead of copying them.
7. Maintain `HANDOFF.md` as a compact continuation document with current status, remaining work, and suggested skills. It should reference this ADR and other artifacts rather than duplicate them.

## Codebase maps

- `.codebase-memory/graph.db.zst` is the current compressed shared code graph. Use the codebase-memory graph tools first for code discovery and impact tracing, following the order in `AGENTS.md`.
- `.understand-anything/knowledge-graph.json` is the completed and validated interactive codebase map. Its baseline contains 16 analyzed files, 23 nodes, 21 edges, four layers, and seven guided-tour steps.
- The four map layers are `PalmWatch Application UI`, `Tree Evidence Assets`, `Verification and Tooling`, and `Product and Architecture Documentation`.
- Baseline fingerprint: SHA-256 `84977DFCD19E294887F049B7D0BAC3A4F09A1D962C6B450F350ED9F7281FB71D`.
- Validation has one warning: `document:AGENTS.md` is an orphan node. No other validation warning is recorded for this baseline.
- Automatic dashboard launch was skipped because it could create project-related state outside the required `D:\drone-mapping\oil-palm-1.5-gui` workspace boundary. The JSON map remains the authoritative generated artifact.

## Decision update: fourth company portfolio (2026-09-10)

- Add a fourth company with stable ID `mappedpoc` and exact display label `Mapped POC`. Its portfolio contains four deterministic POC farms and uses a local `assets/company-logos/mapped-poc.svg` logo.
- Keep the existing data-driven company-card renderer and CSS/layout unchanged; the new profile and dataset flow through the same selector and portfolio-opening path as the three existing companies.
- Make provenance profile-driven: Mapped POC discloses deterministic proof-of-concept data, while the existing companies retain workbook-derived provenance. Static contract tests cover the fourth profile, dataset, portfolio, logo, shared renderer/layout, identity isolation, and provenance behavior.
- Independent verification passed: `npm test` exited 0 and `git diff --check` exited 0. Visual checks at desktop width and 375 px confirmed the card is visible and loads, selection opens the Mapped POC portfolio, the opened dashboard has `scrollWidth` 360 within the 375 px viewport, and the subtitle correctly identifies deterministic proof-of-concept data.

## Consequences

- Changes normally remain localized to the single-page application and its static contract test unless a task explicitly requires a structural change.
- The test harness is the current release gate for both test and build commands.
- Any new architecture or persistence layer requires an explicit task and a separate recorded decision; it must not be introduced pre-emptively.
