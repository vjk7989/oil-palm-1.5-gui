# PalmWatch AP-Only Buckleson-Style UI

This repository contains a functional static PalmWatch UI inspired by the supplied `Buckleson Portal.dc.html` reference.

## What It Does

- Uses the Buckleson reference visual system: pink OKLCH palette, compact sidebar, metric cards, Map/Table toggle, rail list, farm grid, and tree detail pattern.
- Limits operational data to Andhra Pradesh only.
- Preserves role responsibilities for System Administrator, CEO/GM, Plantation Head, Area Manager, and Field Staff.
- Shows realistic deterministic demo data for AP districts, mandals, villages, farms, tree layouts, alerts, reports, cases, treatments, disease analytics, administration, and settings.
- Keeps public Godrej oil palm context separate from role-scoped demo operational totals.
- Provides a coordinate-based AP map using real latitude/longitude marker positions.
- Keeps New Farm preview-only: it renders a layout preview and does not write farm, tree, audit, notification, seed, mock, or browser-storage records.

## Open Locally

Open `index.html` in a browser, or serve the folder with any static file server.

## Deferred

- Automatic tree detection.
- Image-derived NDVI/NDRE/diagnosis/confidence.
- Backend persistence.
