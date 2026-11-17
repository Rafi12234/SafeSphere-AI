# Spec 09: Scan Results, Cases, and Reports

## 1. Scan Results View (`/scans/[id]` completed state)

### Header & Metadata
- Title: "Scan Results" with small persistent "Demo data" badge.
- Selected posts pills, completion timestamp, total comments analyzed, flagged comment count.

### Tab 1: Overview
- **Summary Metric Cards:**
  - Total comments analyzed (animated count-up).
  - Flagged remarks.
  - Critical / high severity threats.
  - Repeat offender accounts detected.
- **Charts:**
  - Severity Breakdown: Donut or Bar chart displaying distribution (Critical, High, Medium, Low).
  - Flagged Comments per Post: Horizontal bar chart showing which posts received the highest abuse volume.

### Tab 2: Flagged Comments
- **Data Table:**
  - Columns: Checkbox/ID, Author, Comment Text (blurred by default), Category/Label, Severity Badge, Language (Bangla, Banglish, English), Post Link, Actions.
  - Filters: Severity dropdown (All, Critical, High, Medium, Low), Category dropdown (Harassment, Bullying, Threat, Hate), Language filter, Free text search.
  - **Blurred Text Safeguard:** Abusive text is blurred (`filter: blur(5px)`) by default. Each row features a small "Reveal" ghost button (`size="sm"`).
  - Global "Reveal all" toggle switch in table header.
  - Pagination (10 or 25 rows per page).

### Tab 3: Repeat Accounts
- Grid of repeat offender account cards:
  - Account alias (`Demo Account A`, etc.).
  - Total flagged comments across posts.
  - Distinct posts targeted.
  - Highest severity level reached.
  - Action button: "View incidents" opens filtered comment view or detail sheet.

### Comment Detail Drawer (Sheet)
- Opening a comment opens a side drawer displaying:
  - Full comment text (with reveal toggle).
  - Author alias & incident history.
  - Original post caption snippet & link.
  - AI Safety classification label, severity score, and explanation reason code.
  - Detected language / script.

## 2. Scan History (`/scans`)
- Table of previous workspace scans:
  - Scan ID & Date/time.
  - Scanned posts count.
  - Status badge (Completed, Running).
  - Flagged comment count.
  - "View Results" button linking to `/scans/{id}`.

## 3. Mock Screens: Cases (`/cases`) & Reports (`/reports`)

### Cases (`/cases`)
- Table of mock cases grouped by repeat accounts.
- Status chips: `Detected`, `In review`, `Confirmed for draft`.
- Case detail drawer showing timeline of mock incidents across multiple dates.

### Reports (`/reports`)
- Mock report draft preview.
- Title: "Community Safety & Incident Summary Report".
- Executive summary, incident breakdown, source-referenced evidence items.
- Status stepper: `Draft` -> `Revision` -> `Ready for approval` -> `Approved`.
- Disabled "Submit / Approve" button with tooltip: *"Not available in the demo"*.
