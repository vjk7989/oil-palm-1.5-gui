# PalmWatch AP Design System

## Overview

PalmWatch is a compact operational dashboard. Its visual direction is inherited from the approved Buckleson reference: a light rose sidebar, white working surfaces, restrained pink interaction color, and green/amber/red health semantics.

## Color

The application uses OKLCH tokens defined in `index.html`. Pink is reserved for navigation, selection, and primary actions. Green, amber, red, and charcoal communicate healthy, suspected, danger, and no-tree states with matching text labels.

## Typography

Use the system sans-serif stack for UI and the system monospace stack for identifiers, compact labels, coordinates, and tabular figures. Headings remain compact; this is a working dashboard, not a marketing surface.

## Layout

Desktop uses a fixed left sidebar and scrollable content area. Tablet collapses navigation labels. Mobile uses a horizontal navigation rail. The Overview pairs a geographic map with an equivalent scoped record rail or table, while Farm Detail makes the 8×8 tree layout the principal visualization.

## Components

- Sidebar navigation uses one consistent item shape and strong selected state.
- Metric strips show derived scoped totals and their units.
- The geographic map supports pan/zoom and uses markers at public-place or simulated farm coordinates.
- Tables and rails are the accessible equivalent of map markers.
- Health uses color plus explicit text.
- Empty farm-grid cells are black, disabled, and carry no Tree ID.

## Data presentation

Public Godrej figures are displayed only as sourced context. Operational records are deterministic demo data. Farm points are approximate simulated locations near named public villages and do not indicate farm ownership or surveyed property boundaries.
