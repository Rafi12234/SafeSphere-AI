# Spec 07: Facebook Posts Grid & Selection (`/posts`)

## 1. Page Header & Actions
- Page title: "Facebook Page Posts"
- Active connected Page indicator badge.
- Sync controls:
  - "Refresh latest" button (`variant="outline"`, `size="sm"`) calls `POST /api/posts/sync` with `{ mode: "latest" }`.
  - "Load older posts" button (`variant="outline"`, `size="sm"`) calls `POST /api/posts/sync` with `{ mode: "older" }` when older posts are available on Meta.
- Error handling: Friendly toast or banner if sync fails (e.g. token expired, reconnection required).

## 2. Posts Grid
- Responsive grid (1 col mobile, 2 col tablet, 3 col desktop).
- **Post Card Elements:**
  - Thumbnail image with fallback icon for text-only posts.
  - Post type badge ("Photo", "Text", "Status").
  - Published timestamp formatted in local time.
  - Caption text snippet (truncated at 3-4 lines with tooltip or expand).
  - Comment count display (or "Simulated on scan" badge).
  - Selection checkbox in upper right corner.
  - Card click toggles checkbox selection.

## 3. Selection Controls & Sticky Scan Bar
- "Select all on page" / "Deselect all" button.
- **Sticky Scan Bar:**
  - Appears fixed at the bottom of the viewport when 1 or more posts are selected.
  - Displays selected count: `"{count} post(s) selected"`.
  - Primary button: "Start scan" (`size="default"`, `variant="default"`) -> disabled if count === 0.
  - Clicking "Start scan" issues `POST /api/scans` with `{ post_ids: [...] }` and navigates to `/scans/{scan_id}`.
  - "Clear selection" ghost button.

## 4. Pagination
- Pagination footer (`limit=24`, `offset`).
- Previous / Next buttons with current range (`Showing 1-24 of 86`).
