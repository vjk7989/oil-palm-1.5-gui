# Project Handoff

## Current state

- Repository: `D:\drone-mapping\oil-palm-1.5-gui`; upstream: <https://github.com/vjk7989/oil-palm-1.5-gui>; branch: `main`.
- Mapped POC contains exactly Survey Areas 001, 002, and 003. Areas 004–005 are retired. Fresh browser state has 62 trees: 27 fixed Infected trees in Area 001, 35 fixed Infected trees in Area 002, and an empty Area 003. Browser-local marker edits can change the active total, so every page derives counts from current state rather than assuming 62.
- Browser-local survey state remains version 9. Area 001 and Area 002 retain their independent saved geofences and optional markers; Area 003 starts with 64 inactive capacity records (`TREE-0201…TREE-0264`) and creates trees only from saved markers.
- The Mapped POC overview now uses the existing restricted Google Maps JavaScript API integration in Satellite mode. It draws each current geofence and current survey totals, combines colocated Areas 001 and 003 into one marker with separate open actions, and retains the accessible survey list and Table view when Google Maps is unavailable.
- All Mapped POC sidebar routes now use the active three-survey portfolio. Other companies retain their existing AP farm behavior.
- Automated and manual acceptance gates for this increment are green. The current increment is pending commit, push, GitHub Pages workflow verification, and live-site verification.

## Route behavior

- **Overview:** live metrics, Google Satellite survey map, current geofences, combined Area 001/003 choice, separate Area 002 marker, current survey list/table, and existing survey/tree navigation.
- **Survey Areas** (the Mapped POC label for the existing `New Farm` route): lists the three current survey workspaces with live Infected, Suspected, Healthy, and total counts; opens the selected survey editor and deliberately does not create a fourth area.
- **Alerts:** derives one alert from each currently flagged survey area, supports read/read-all state, and opens the exact current tree selected for that alert. Healthy-only or empty areas produce no alert.
- **Reports:** six report/export views are derived from current areas, markers, statuses, coordinates, cases, and treatments. The printable survey summary and company-scoped browser-local export history use current totals.
- **Cases & Treatments:** derives one stable workflow per currently flagged survey area, links to an active tree, and preserves the existing role-authorized browser-local case/treatment transitions. Workflows disappear when an area has no flagged active tree.
- **Administration:** shows current survey-area and active-tree access totals, current accounts, and direct links to each survey; existing account activation/reset actions remain browser-local.
- **Settings:** shows current Mapped POC access totals and preferences. Reset clears workflow preferences, read alerts, case actions, account changes, and report history while preserving saved geofences and tree markers.

## Authoritative references

Use these artifacts instead of reconstructing decisions from scattered files:

- Decisions, constraints, data semantics, and verification: `docs/ARCHITECTURE_RECORD.md`.
- Runtime behavior, Google overview, routes, and browser-local state: `index.html`.
- Executable regression contract: `tests/static-check.mjs`.
- Deterministic survey data: `data/mapped-poc-data.js` and `data/survey-002-farm-data.js`.
- Snapshot derivation and invariants: `scripts/build_mapped_poc_snapshot.py`.
- Persistent delivery rules: `docs/architecture/0001-project-context-and-agent-workflow.md`.
- GitHub Pages deployment: `.github/workflows/deploy-pages.yml`.

## Working tree and release handoff

- Expected feature patch: `index.html` and `tests/static-check.mjs`, plus context updates to `docs/ARCHITECTURE_RECORD.md` and this file when the context agents finish. Inspect `git status` because those agents may complete asynchronously.
- Do not rewrite or discard unrelated user changes. Review the final patch, then run `npm test`, `npm run build`, and `git diff --check` once more before release if any file changed after the green gate.
- Scan the tracked patch for credentials without printing secret values. Never commit, document, log, or repeat the Google Maps key. Local development uses ignored `config/maps.local.js`; hosted builds receive the key from the repository secret.
- Commit the verified increment, push `main`, verify the Pages workflow, then verify the live overview and at least one navigation route before calling it released.

## Continuation rules

- Follow `AGENTS.md` and use the codebase-memory graph first for discovery.
- Apply YAGNI and deterministic processing. Split material changes into the smallest independently testable units.
- Keep generated artifacts, caches, temporary files, and test output inside this repository on `D:`. External source folders are read-only; the browser must not depend on `C:`, `G:`, `D:\hio01`, or `D:\frm02` at runtime.
- Use separate subagents for test authoring and independent execution. If a gate fails, obtain a minimal repair plan from a separate failure-analysis agent before changing code, and continue only when the affected gate is green.
- After green verification, update the architecture record and this handoff with separate context agents.
- Preserve the distinction between user-designated status, modelled Ganoderma score, operational marker coordinates, confirmed diagnosis, and surveyed/legal boundaries.
- Keep Tree IDs globally unique. Healthy trees show no image; any nearest-image association for an Infected or Suspected added marker must retain its disclosure.
- Preserve Google failure fallbacks and the existing editors while changing overview or route code. Workflow reset must continue to preserve survey geofences and markers.

## Suggested skills

- `understand-anything:understand-chat` for graph-backed questions about route/data flow.
- `understand-anything:understand-explain` for browser-state migration, map initialization, or derived workflow records.
- `understand-anything:understand-diff` for pre-release regression review.
- `impeccable` for dashboard, responsive, and accessibility changes.
- `computer-use:computer-use` for Google Maps and live GitHub Pages acceptance testing.
- `spreadsheets:Spreadsheets` only when workbook-derived risk data changes.

## Next session

Read `AGENTS.md`, this file, and `docs/ARCHITECTURE_RECORD.md`; inspect the working tree; complete the release handoff above; then take the user's next goal through the same deterministic test and context workflow.
