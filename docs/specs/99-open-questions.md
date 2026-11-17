# Spec 99: Open Questions, API Mismatches & TODO Placeholders

## 1. Backend API Observations & Mismatches
1. **`GET /scans/{scan_id}` Schema in OpenAPI:**
   - In FastAPI, `GET /scans/{scan_id}` returns a generic schema dictionary `{}` in OpenAPI instead of a strict Pydantic model.
   - **Resolution:** We inspected the actual response dictionary constructed in `backend/app/scans.py` lines 282-380 and built our TypeScript definitions and adapter layer to explicitly match all runtime fields (`selected_posts`, `statistics`, `findings`, `incidents`).
2. **Comment Counts on Posts:**
   - The backend explicitly returns `"comment_count": null` in Phase 3 because Meta comment ingestion is not performed in Phase 3.
   - **Resolution:** In the post grid cards, we display `"Simulated on scan"` or `"—"` when comment count is null.
3. **Cases & Reports Endpoints:**
   - The backend does not have REST endpoints for `/cases` or `/reports` (they are planned for future phases).
   - **Resolution:** As instructed in Section 6.8 of the master prompt, `/cases` and `/reports` are built as UI-only mock preview screens marked with the persistent "Demo data" badge and disabled action buttons.

## 2. TODO Placeholders (`src/lib/site.ts`)
The following placeholder values are required per Section 6.1 (Footer) and must not be invented with fake real-looking addresses:
- `siteConfig.contact.email`: `TODO: team@example.com`
- `siteConfig.contact.phone`: `TODO: +880-1XXX-XXXXXX`
- `siteConfig.contact.address`: `TODO: Dhaka, Bangladesh`
- `siteConfig.contact.social`: Twitter, LinkedIn, Facebook links marked as `TODO`
- `siteConfig.legal.companyName`: `SafeSphere AI Inc. (TODO)`
