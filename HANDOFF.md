# Project Handoff

## Current state

- Repository: `D:\drone-mapping\oil-palm-1.5-gui`; upstream: <https://github.com/vjk7989/oil-palm-1.5-gui>; branch: `main`.
- Mapped POC now contains exactly Survey Areas 001, 002, and 003. Areas 004–005 are removed from runtime data, navigation, totals, provenance, generation, tests, and repository evidence assets.
- Survey Area 003 is an independent editable copy of Area 001 at the same location. It has 27 immutable Infected records (`TREE-0201…TREE-0227`) linked to the corresponding Area 001 records and 37 optional IDs (`TREE-0228…TREE-0264`). It shares Area 001 images without duplicating files.
- Area 003 has its own Google Satellite rectangle, saved geofence, three-colour marker workflow, selector, 8×8 grid, Tree Details routing, and version-8 browser-local state. Area 001 and Area 002 state and behavior remain independent.
- Areas 001 and 003 share one overview map pin with separate actions to open either survey; list/table entries remain separate.
- Fresh browser state contains 89 fixed Infected trees. The maximum across all three editors is 192 active trees.
- Automated gates are green: `npm test`, `npm run build`, `git diff --check`, deterministic data invariants, and credential scan. Deployment is pending; do not describe this increment as released until `main` is pushed and GitHub Pages succeeds.

## Authoritative references

Read these artifacts instead of reconstructing the implementation from many files:

- Decisions, constraints, provenance, state migration, and verification record: `docs/ARCHITECTURE_RECORD.md`.
- Runtime UI, editors, totals, routing, and local-state version 8: `index.html`.
- Deterministic Mapped POC snapshot: `data/mapped-poc-data.js`.
- Snapshot regeneration and invariants: `scripts/build_mapped_poc_snapshot.py`.
- Executable regression contract: `tests/static-check.mjs`.
- Area 002 source snapshot/generator: `data/survey-002-farm-data.js` and `scripts/build_survey_two_farm_snapshot.py`.
- Persistent project workflow: `docs/architecture/0001-project-context-and-agent-workflow.md`.
- GitHub Pages key injection and deployment: `.github/workflows/deploy-pages.yml`.

## Working tree and release

The unreleased implementation currently includes:

- Modified: `data/mapped-poc-data.js`, `index.html`, `scripts/build_mapped_poc_snapshot.py`, and `tests/static-check.mjs`.
- Deleted: `assets/mapped-poc/evidence/TREE-0093.webp` through `TREE-0112.webp` (20 retired Area 004–005 derivatives).
- Context updates: `docs/ARCHITECTURE_RECORD.md` and this file may also be modified when the context agents finish.

Before release, rerun the three gates, scan the final tracked patch for credentials, commit only the intended files, push `main`, and verify the GitHub Pages workflow and live site.

## Non-negotiable continuation rules

- Follow `AGENTS.md`; use the codebase-memory graph first for code discovery.
- Apply YAGNI and deterministic processing. Break work into the smallest independently testable tasks.
- Keep all generated artifacts, caches, temporary files, and test output inside this repository on `D:`. Treat external source folders as read-only and add no runtime dependency on `C:`, `G:`, `D:\hio01`, or `D:\frm02`.
- For material changes, use separate subagents for test authoring and independent test execution. If a gate fails, use a separate failure-analysis subagent to produce the smallest repair plan before changing code. Continue only after the affected gate is green.
- After green verification, use separate context agents for the architecture record and this handoff.
- Preserve the distinction between user-designated status, modelled Ganoderma score, camera/display coordinates, and field/laboratory diagnosis or surveyed/legal boundaries.
- Preserve globally unique Tree IDs. Duplicate capture UUIDs are valid only for the explicit Area 001 → Area 003 copied-record links documented in the data snapshot.
- Never place a Google Maps credential in tracked code, generated data, tests, documentation, logs, commits, or final messages. The local key belongs only in ignored `config/maps.local.js`; hosted builds receive it from the repository secret.
- Do not alter or delete external source imagery. Healthy trees show no image; exact and nearest-image behavior for non-Healthy records must retain its provenance disclosure.

## Suggested skills

- `understand-anything:understand-chat` for targeted codebase questions using the graph.
- `understand-anything:understand-explain` for the version-8 state migration or Area 003 editor flow.
- `understand-anything:understand-diff` for regression-impact review before release.
- `impeccable` for future map-editor responsiveness, accessibility, and visual polish.
- `computer-use:computer-use` for Google Maps and live GitHub Pages acceptance testing.
- `spreadsheets:Spreadsheets` only when workbook-derived risk data must change.

## Next session

1. Read `AGENTS.md`, this handoff, and `docs/ARCHITECTURE_RECORD.md`.
2. Inspect the current status and preserve unrelated user work.
3. Complete the final gates and credential scan.
4. Commit, push `main`, watch the Pages workflow, and verify the live three-survey behavior before marking the increment released.
5. Receive the user's next goal and repeat the deterministic subagent test workflow for any material change.
