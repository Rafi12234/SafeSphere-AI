# Spec 08: Scan Creation & Live Progress (`/scans/[id]`)

## 1. Scan Initiation Flow
1. User selects 1-20 posts on `/posts` and clicks "Start scan".
2. Client calls `POST /api/scans` with payload `{ post_ids: string[] }`.
3. Backend returns `{ id: UUID, status: "running" }`.
4. Client navigates immediately to `/scans/{id}`.

## 2. Running State Presentation (`status === "running"`)
- The page renders a central progress card with live polling (`refetchInterval: 1500`).
- **Progress Bar:** Animated percentage bar reflecting `progress_percent` (0% to 100%).
- **Counters:** Displays animated counts: `"{animated_demo_comments_processed} of {estimated_demo_comments} comments scanned"`.
- **Four Animation Stages:**
  - Stage 1: **Fetching comments** (0% - 25%)
  - Stage 2: **Analyzing text** (25% - 60%)
  - Stage 3: **Analyzing media** (60% - 85%)
  - Stage 4: **Grouping repeat accounts** (85% - 100%)
- Each stage shows status icon (Pending circle, Active spinner, Completed checkmark).
- Accessibility: Container wrapped with `aria-live="polite"`.

## 3. Completion Transition
- When the backend polling returns `status === "completed"`:
  - Stop polling interval.
  - Automatically fade out the progress bar card (200ms).
  - Reveal the completed results view (Overview, Flagged comments, Repeat accounts) in the same route without a page reload or flash.
