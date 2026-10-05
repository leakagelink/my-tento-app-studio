# Desktop-optimized admin panel

## Goal
Make the admin panel feel like a true desktop operations dashboard while preserving the current mobile experience and all live data/actions.

## Changes
- Replace the desktop horizontal tab strip with a persistent left navigation sidebar.
- Add a desktop workspace header with the current section title and useful live context.
- Widen the content area and use desktop-friendly grids, tables, and aligned action columns for services, providers, bookings, users, payments, offers, vehicles, and banners.
- Keep compact cards and horizontal-safe controls on phones and tablets.
- Improve the overview with a stronger metrics grid and two-column operational sections.
- Keep all existing add, edit, pause, delete, verify, and database behavior unchanged.
- Verify desktop and mobile layouts for overflow, readability, and working navigation.

## Technical details
- Update only the authenticated admin presentation in `src/routes/_authenticated/admin.tsx`, reusing the existing design tokens, `BrandLogo`, and button components.
- Use responsive breakpoints so the sidebar/table layout appears only on large screens; mobile retains touch-friendly navigation and stacked rows.
- Preserve the existing route, queries, permissions, and service dialog.
