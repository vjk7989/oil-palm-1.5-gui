# Project Handoff

## Current status

- Repository: `D:\drone-mapping\oil-palm-1.5-gui`; upstream: <https://github.com/vjk7989/oil-palm-1.5-gui>.
- The Dynamic Survey Area 001 Marker-to-Tree Workflow is implemented and independently green. `npm test`, `npm run build`, and `git diff --check` pass; line-ending messages are warnings only.
- Hosted fix commit `0f6fdab` was pushed. The GitHub Pages Actions workflow completed successfully, and the deployed Survey Area 001 now reports **Google Satellite map ready**.
- Mapped POC Tree Details shows each source-backed record's own repository evidence. A positioned Area 001 layout-capacity tree shows one deterministic nearest repository image selected only from `TREE-0001` through `TREE-0019`, with explicit copy that the nearby image does not depict the exact added tree. The per-tree camera-position map remains removed; metadata, coordinates, indicators, provenance, and observation/history content remain.
- The feature is intentionally limited to `MPOC-SURVEY-001`. Areas 002–005 retain their existing Leaflet maps and camera-footprint geofences.
- The implementation is pushed; this handoff refresh may remain as a local documentation change. Inspect `git status --short` and preserve unrelated user work before any future commit.
- The implementation change set is `data/mapped-poc-data.js`, `scripts/build_mapped_poc_snapshot.py`, `index.html`, and `tests/static-check.mjs`; context is maintained separately in this handoff and `docs/ARCHITECTURE_RECORD.md`.
- Implementation, automated tests, and manual Google Maps/browser acceptance are complete. The remaining release action, if not already performed for this working tree, is to commit, push, and verify the resulting GitHub Pages deployment live.

## Authoritative references

- Decisions, implementation boundaries, map-loading behavior, caveats, and verification record: `docs/ARCHITECTURE_RECORD.md`.
- Runtime integration and browser-local state: `index.html`.
- Deterministic Mapped POC records: `data/mapped-poc-data.js`.
- Snapshot generation boundary: `scripts/build_mapped_poc_snapshot.py`.
- Geofence, marker-placement, configuration, migration, isolation, and regression contracts: `tests/static-check.mjs`.
- GitHub Pages secret injection and deployment: `.github/workflows/deploy-pages.yml`.
- Persistent project workflow: `docs/architecture/0001-project-context-and-agent-workflow.md`.

Read those artifacts directly rather than duplicating their detailed contracts here.

## Continuation facts

- Area 001 opens with Google Satellite imagery and an editable, draggable rectangle. Its deterministic default is south `16.912209794`, west `81.169804433`, north `16.912805551`, east `81.169912437`.
- `Edit geofence`, `Save`, `Cancel`, and `Reset default` are available to every built-in demo role. The map displays 27 infected camera-position markers. The rectangle is an operational display geofence, not a surveyed or legal property boundary.
- Area 001 provides a native, keyboard-operable selector containing infected trees only. Selecting a tree pans and zooms the Google map to its exact camera position; the matching red marker becomes larger, gains a stronger outline and check mark, and is identified in adjacent status text rather than by colour alone. **Open selected tree** opens that tree's evidence page. Direct marker clicks continue to open the exact corresponding tree record.
- The snapshot reserves a complete 64-cell Area 001 capacity: 27 immutable source-backed infected trees and 37 optional layout-capacity records (`TREE-0113` through `TREE-0149`). Fresh browser state activates only the 27 source records and leaves the remaining grid cells black.
- Add Marker is available after Area 001 has a saved valid geofence. Editing starts from the current saved optional collection, supports adding or removing individual optional markers, Undo and Cancel, and an accessible dynamic total. Stable Tree IDs may contain gaps after removal.
- Save accepts any valid collection from zero through 37 optional markers, rejects unknown IDs, non-finite/out-of-geofence/duplicate/source-overlapping positions, and atomically replaces `areaOneTreePositions` in version `5` browser-local state. Active grid cells, marker labels, selector entries, totals, and drill-down records derive from the synchronized saved collection.
- Every Area 001 tree carries an infected-range deterministic/modelled Ganoderma score above 65%. Optional trees gain coordinates when positioned but never gain fabricated capture metadata or exact-tree image provenance; their nearest-image presentation is derived at runtime from the approved repository evidence subset.
- The saved Area 001 rectangle remains under `geofenceOverrides[MPOC-SURVEY-001]`. Geofence changes cannot exclude saved tree positions, and Areas 002–005 receive no Add Marker state or controls.
- The Google rectangle is non-clickable during normal map use so it cannot intercept Add Marker clicks. It becomes clickable, editable, and draggable only while explicit geofence edit mode is active, then returns to the locked non-clickable state on Save, Cancel, or Reset.
- GitHub Actions receives `GOOGLE_MAPS_API_KEY` from a repository secret during Pages deployment. The local key remains only in ignored, untracked `config/maps.local.js`, while the tracked example contains an empty placeholder. Never copy either credential value into tracked code, tests, documentation, logs, generated data, or future handoffs.
- The application has no runtime dependency on `D:\hio01`, and no source file from that location is copied into the repository. Only existing repository-owned evidence is eligible for the deterministic nearest-image presentation.
- Missing, rejected, disabled-API, billing, timeout, and network failures produce targeted guidance while leaving the Area 001 tree grid usable.
- Independent final verification passed `npm test`, `npm run build`, and `git diff --check`. Tests cover capacity versus active state, version-5 migration, partial/gapped collections, add/remove/undo/cancel/save, atomic persistence, validation failures, dynamic counts and labels, exact drill-down identity, deterministic nearest-image selection and disclosure, no per-tree map, unchanged Areas 002–005, and the rectangle's edit-mode-only clickability. The local Maps key remains ignored and untracked.
- Local Google Satellite acceptance passed the complete add/remove/undo/save/reload flow, including exact saved coordinates, the added-tree nearby-image disclosure, retained exact source-tree imagery, and cleanup back to a clean 27-tree browser state with no optional positions saved. Areas 002–005 remain unchanged.

## Continuation rules

- Follow `AGENTS.md`; prefer codebase-memory graph tools for code discovery.
- Apply YAGNI and deterministic processing. Keep generated artifacts, caches, temporary files, and test output under this repository on `D:` because `C:` has limited space.
- Treat source files on `C:` and `G:` as read-only and introduce no runtime dependency on those drives.
- Split requested changes into the smallest independently testable tasks.
- Use separate subagents for test authoring, independent test execution, and failure analysis. Do not continue past an affected-area gate until it is green. Keep architecture-record and handoff updates as separate context-management tasks.
- Preserve the Mapped POC distinction between user-designated infection, modelled suspected risk, healthy layout-only trees, camera exposure coordinates, and actual diagnoses or surveyed palm positions.

## Next session

1. Read `AGENTS.md`, this file, and the relevant Google geofence section of `docs/ARCHITECTURE_RECORD.md`.
2. Preserve repository-secret injection for hosted builds and keep the local Maps key ignored and untracked.
3. Commit and push the dynamic marker workflow, then verify the resulting GitHub Pages build live before calling the increment released.
4. Receive the user's next goal normally. Retain the Area 001-only map/editing boundary unless explicitly expanded, and repeat the independent green gate after material changes.

## Suggested skills

- `understand-anything:understand-chat` for targeted questions against the codebase graph.
- `understand-anything:understand-explain` for the dynamic marker-to-tree synchronization, Google Maps editor, or version-5 browser-state migration path.
- `understand-anything:understand-diff` for regression-impact review after future changes.
- `impeccable` for future map-editor layout, responsiveness, or interaction polish.
- `computer-use:computer-use` for hosted GitHub Pages acceptance after push and any future Google Maps or tree-detail visual verification.
