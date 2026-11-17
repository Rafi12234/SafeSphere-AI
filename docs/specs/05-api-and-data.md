# Spec 05: API Client, Generated Types, and Data Layer

## 1. Endpoint Reference Table

| Method | Endpoint | Payload / Params | Return Type / Model | Notes |
|---|---|---|---|---|
| GET | `/health`, `/health/db` | None | `{ status: string }` | Backend status checks |
| POST | `/auth/register` | `RegisterInput` | `MeResponse` | Sets session cookie |
| POST | `/auth/login` | `LoginInput` | `MeResponse` | Sets session cookie |
| POST | `/auth/logout` | None | `{ ok: true }` | Clears cookie |
| GET | `/auth/me` | None | `MeResponse` | User & active workspace |
| GET | `/facebook/connect` | None | 303 Redirect | Starts Meta OAuth flow |
| GET | `/facebook/callback` | `?state=&code=&error=` | 303 Redirect | Meta OAuth return |
| GET | `/facebook/connection` | None | `ConnectionResponse` | Page list, ready & mock flags |
| POST | `/facebook/select-page`| `{"connection_id": UUID}` | `{"selected_connection_id": UUID}` | Active Page choice |
| DELETE| `/facebook/connection` | `?connection_id=UUID` | `{"ok": true}` | Disconnects Page |
| POST | `/facebook/demo-connect`| None | `{"ok": true, "connection_id": UUID}` | Demo mock connection |
| GET | `/posts` | `?limit=24&offset=0` | `PostsResponse` | List cached posts |
| POST | `/posts/sync` | `{"mode": "latest" \| "older"}` | `SyncResponse` | Synchronizes posts |
| POST | `/scans` | `{"post_ids": [UUID]}` | `{"id": UUID, "status": "running"}` | Initiates timed demo scan |
| GET | `/scans` | None | `list[ScanSummary]` | Workspace recent scans |
| GET | `/scans/{scan_id}` | Path `scan_id` | `ScanDetail` | Progress & completed results |

## 2. Generated Types & Adapter Layer
- Run `npx openapi-typescript backend/openapi.json -o src/lib/api/types.generated.ts`.
- `src/lib/api/adapters.ts` translates generated DTOs into clean domain ViewModels:
  - `UserViewModel`
  - `PageConnectionViewModel`
  - `PostViewModel`
  - `ScanViewModel` (with normalized `FindingViewModel`, `RepeatAccountViewModel`, `IncidentViewModel`)
- Components consume only the ViewModels, insulating UI from backend schema nuances.

## 3. Seed Fallback Mechanism
- If `NEXT_PUBLIC_FORCE_SEED="true"` is set, or if `GET /scans/{id}` returns empty findings/analytics after completion, the adapter merges deterministic seed fixtures from `src/lib/seed/`.
- Seed data uses the `scan_id` and `post_id` as random seeds so that repeated views of the same scan produce identical comments and findings.

## 4. TanStack Query Keys & Polling
- `['me']`: Current user and workspace context.
- `['facebook', 'connection']`: Active and available Page connections.
- `['posts', { limit, offset }]`: Paginated post listing.
- `['scans']`: Recent scan history.
- `['scan', id]`: Single scan detail.
  - While `status === "running"`, poll with `refetchInterval: 1500`.
  - Automatically stops polling once `status === "completed"` or error is encountered.
