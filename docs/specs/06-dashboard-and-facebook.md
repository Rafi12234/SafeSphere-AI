# Spec 06: App Shell, Dashboard & Facebook Connection

## 1. App Shell Layout
- **Sidebar (`components/dashboard/Sidebar.tsx`):**
  - Navigation links: Dashboard, Posts, Scans, Cases (mock), Reports (mock), Settings.
  - Collapsible on tablet/mobile with sheet overlay.
  - SafeSphere AI wordmark + shield at top.
  - Workspace selector / active workspace name display.
- **TopBar (`components/dashboard/TopBar.tsx`):**
  - Fixed sticky blurred header behavior.
  - Dynamic route breadcrumb / title.
  - Small persistent "Demo data" pill badge whenever mock data is displayed.
  - Theme toggle (Sun/Moon icon).
  - User avatar dropdown menu (Name, email, role, Logout button).

## 2. Dashboard States (`/dashboard`)

### State A: No Connection
- Card informing the user that no Facebook Page is currently linked.
- Explains permissions: read-only access to published posts, zero write/delete capability.
- Primary CTA: "Connect Facebook" (`size="default"`, `variant="default"`) -> initiates `window.location.assign("/api/facebook/connect")`.
- If `demo_available === true`, display outline button: "Use demo Page" (`size="default"`, `variant="outline"`) -> calls `POST /api/facebook/demo-connect`.

### State B: Multiple Pages Returned (Selection Needed)
- When Facebook returns multiple administered Pages, show a Page selection list.
- Radio card or dropdown showing Page name and tasks.
- "Select Page" button calls `POST /api/facebook/select-page`.

### State C: Connected Page
- Status card showing:
  - Page Name, connection status badge ("Connected"), demo indicator if mock.
  - "Disconnect" button (`variant="outline"`, `size="sm"`) with a confirmation dialog triggering `DELETE /api/facebook/connection?connection_id=...`.
- Summary statistics card from latest scan (Comments Scanned, Flagged, Repeat Accounts, Top Severity).
- Recent Scans table (Last 5 scans with status, timestamp, and link to view details).
- Primary Action Card: "Select posts to scan" with button linking to `/posts`.

## 3. OAuth Return Outcome Handling
- When Meta redirects to `/dashboard?facebook={outcome}`, display an informational banner:
  - `connected`: "Facebook Page successfully connected."
  - `cancelled`: "Facebook authorization was cancelled or denied."
  - `no_pages`: "No Facebook Pages with required permissions were found."
  - `invalid_state`: "Security verification failed. Please try again."
  - `session_expired`: "Session expired during authorization. Please log in again."
  - `error`: "Facebook connection failed. Please retry."
