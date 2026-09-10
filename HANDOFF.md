# Project Handoff

## Current status

- Repository: `D:\drone-mapping\oil-palm-1.5-gui`; upstream: <https://github.com/vjk7989/oil-palm-1.5-gui>.
- The Survey Area 001 Google Satellite geofence editor is implemented and independently verified. `npm test`, `npm run build`, and `git diff --check` pass; line-ending messages are warnings only.
- The feature is intentionally limited to `MPOC-SURVEY-001`. Areas 002–005 retain their existing Leaflet maps and camera-footprint geofences.
- Changes are uncommitted. Inspect `git status --short` and preserve unrelated user work before any future commit.
- No implementation work remains for this request. Wait for the user's next concrete goal and avoid speculative expansion.

## Authoritative references

- Decisions, implementation boundaries, map-loading behavior, caveats, and verification record: `docs/ARCHITECTURE_RECORD.md`.
- Runtime integration and browser-local state: `index.html`.
- Geofence, configuration, migration, isolation, and regression contracts: `tests/static-check.mjs`.
- Persistent project workflow: `docs/architecture/0001-project-context-and-agent-workflow.md`.

Read those artifacts directly rather than duplicating their detailed contracts here.

## Continuation facts

- Area 001 opens with Google Satellite imagery and an editable, draggable rectangle. Its deterministic default is south `16.912209794`, west `81.169804433`, north `16.912805551`, east `81.169912437`.
- `Edit geofence`, `Save`, `Cancel`, and `Reset default` are available to every built-in demo role. The map displays 27 infected camera-position markers. The rectangle is an operational display geofence, not a surveyed or legal property boundary.
- A valid saved Area 001 rectangle is stored under `geofenceOverrides[MPOC-SURVEY-001]` in version `3` of the existing browser-local demo state. Migration preserves supported prior state and accepts no override for Areas 002–005. Reset restores the exact deterministic bounds.
- The Google Maps browser key lives only in ignored `config/maps.local.js`; the tracked example contains an empty placeholder. The temporary test key must be rotated/replaced and restricted to Maps JavaScript API plus approved HTTP origins. Never copy the key into tracked code, tests, documentation, logs, generated data, or future handoffs.
- Missing, rejected, disabled-API, billing, timeout, and network failures produce targeted guidance while leaving the Area 001 tree grid usable.
- Live acceptance confirmed Google Satellite loading, exact default coordinate display, 27 infected markers, editable handles, Cancel/Save/Reset status transitions, Reset restoring exact defaults, Field Staff access to edit controls, and Area 002 remaining on Leaflet. Reload persistence is covered by the static state contract; it was not manually exercised in this pass.

## Continuation rules

- Follow `AGENTS.md`; prefer codebase-memory graph tools for code discovery.
- Apply YAGNI and deterministic processing. Keep generated artifacts, caches, temporary files, and test output under this repository on `D:` because `C:` has limited space.
- Treat source files on `C:` and `G:` as read-only and introduce no runtime dependency on those drives.
- Split requested changes into the smallest independently testable tasks.
- Use separate subagents for test authoring, independent test execution, and failure analysis. Do not continue past an affected-area gate until it is green. Keep architecture-record and handoff updates as separate context-management tasks.
- Preserve the Mapped POC distinction between user-designated infection, modelled suspected risk, healthy layout-only trees, camera exposure coordinates, and actual diagnoses or surveyed palm positions.

## Next session

1. Read `AGENTS.md`, this file, and the relevant Google geofence section of `docs/ARCHITECTURE_RECORD.md`.
2. Rotate or replace the temporary Google Maps key before further deployment-oriented work.
3. Receive the user's next goal, locate only the affected code through graph-first discovery, and retain the Area 001-only boundary unless the user explicitly expands it.
4. Repeat the independent green gate and refresh the two context artifacts after material changes.

## Suggested skills

- `understand-anything:understand-chat` for targeted questions against the codebase graph.
- `understand-anything:understand-explain` for the Google Maps loader, geofence editor, or browser-state migration path.
- `understand-anything:understand-diff` for regression-impact review after future changes.
- `impeccable` for future map-editor layout, responsiveness, or interaction polish.
- `computer-use:computer-use` for live browser acceptance of Google Maps, editing controls, and role-specific behavior.
