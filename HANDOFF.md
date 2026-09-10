# Project Handoff

## Current state

- Repository: `D:\drone-mapping\oil-palm-1.5-gui`; upstream: <https://github.com/vjk7989/oil-palm-1.5-gui>; branch: `main`.
- Mapped POC contains exactly Survey Areas 001, 002, and 003. Areas 004–005 remain retired.
- Survey Area 003 now starts empty: zero active trees, zero pins, an empty selector, and 64 black cells in its 8×8 grid. Its capacity records are inactive `TREE-0201…TREE-0264` layout records; there are no Area 003 copied captures or fixed markers.
- After its rectangle is explicitly saved, Area 003 accepts up to 64 independently saved Red/Infected, Yellow/Suspected, or Green/Healthy markers. The editor retains add/remove, undo, cancel, atomic save, containment protection, lowest-ID reuse, synchronized map/grid/selector/details, and status-specific deterministic scores.
- Area 003 Infected and Suspected additions may use the nearest repository-owned Area 001 image with the non-exact-tree disclosure; Healthy additions show no image. Area 001 and Area 002 data, editors, and browser state remain unchanged.
- Browser-local state is version 9. Migration preserves valid Area 001/002 state and deliberately clears all legacy Area 003 markers and geofence state so Area 003 begins empty.
- Fresh Mapped POC state contains 62 fixed Infected trees; full capacity remains 192 trees across the three surveys.
- Automated and manual acceptance gates are green. This increment is still pending commit, push, and successful GitHub Pages deployment.

## Authoritative references

Use these artifacts instead of reconstructing the change from scattered files:

- Decisions, constraints, migration, and verification: `docs/ARCHITECTURE_RECORD.md`.
- Runtime behavior and browser-local state: `index.html`.
- Deterministic capacity data: `data/mapped-poc-data.js`.
- Snapshot derivation and invariants: `scripts/build_mapped_poc_snapshot.py`.
- Executable regression contract: `tests/static-check.mjs`.
- Persistent delivery rules: `docs/architecture/0001-project-context-and-agent-workflow.md`.
- GitHub Pages deployment: `.github/workflows/deploy-pages.yml`.

## Release handoff

- Preserve unrelated user work and confirm the intended patch with `git status` and `git diff`.
- Rerun `npm test`, `npm run build`, and `git diff --check`, then scan the tracked patch for credentials without printing any secret values.
- Commit the verified Area 003/version-9 increment, push `main`, and verify both the Pages workflow and live behavior before calling it released.
- Never commit, document, log, or repeat the Google Maps key. Local development uses ignored `config/maps.local.js`; hosted builds receive the key from the repository secret.

## Continuation rules

- Follow `AGENTS.md` and use the codebase-memory graph first for discovery.
- Apply YAGNI and deterministic processing. Split material changes into the smallest independently testable units.
- Keep generated artifacts, caches, temporary files, and test output inside this repository on `D:`. External source folders are read-only; the browser must not depend on `C:`, `G:`, `D:\hio01`, or `D:\frm02` at runtime.
- Use separate subagents for test authoring and independent execution. If a gate fails, obtain a minimal repair plan from a separate failure-analysis agent before changing code, and continue only when the affected gate is green.
- After green verification, update the architecture record and this handoff with separate context agents.
- Preserve the distinction between user-designated status, modelled Ganoderma score, operational marker coordinates, confirmed diagnosis, and surveyed/legal boundaries.
- Keep Tree IDs globally unique. Area 003 no longer permits duplicate capture UUIDs because it contains no copied-capture records.
- Do not modify or delete external imagery. Healthy trees show no image; any nearest-image association for Infected or Suspected additions must retain its disclosure.

## Suggested skills

- `understand-anything:understand-chat` for targeted graph-backed codebase questions.
- `understand-anything:understand-explain` for the version-9 migration or marker-only Area 003 flow.
- `understand-anything:understand-diff` for pre-release regression review.
- `impeccable` for map-editor accessibility and responsive UI work.
- `computer-use:computer-use` for Google Maps and live Pages acceptance testing.
- `spreadsheets:Spreadsheets` only when workbook-derived risk data changes.

## Next session

Read `AGENTS.md`, this file, and `docs/ARCHITECTURE_RECORD.md`; inspect the working tree; complete the release handoff above; then take the user's next goal through the same deterministic test and context workflow.
