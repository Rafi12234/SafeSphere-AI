# SafeSphere AI — Hackathon Demo (Phases 1–3)

**Official repo:** https://github.com/Rafi12234/SafeSphere-AI

This package contains the **existing Phase 1 starter with Phase 2 changes** (retain your existing `frontend/package-lock.json`), designed for the `SafeSphere_AI_Database_Schema_v1.sql` PostgreSQL database that was imported into pgAdmin4.

## Implemented

- **Phase 1:** registration, login/logout, JWT HttpOnly cookie session, user + workspace + owner membership, protected Next.js dashboard, FastAPI health endpoints.
- **Phase 2:** server-side Facebook Login for Business authorization (configured via `config_id`), one-time hashed OAuth state, authorization code exchange, `/me/accounts` Page discovery, encrypted Page-token storage, Page selection, disconnect, and frontend connection status.
- **CI:** `.github/workflows/ci.yml` runs mocked-backend unit tests and a Next.js build on push / pull request.
- **Phase 2 test fallback:** optional `FACEBOOK_MOCK=true` exposes **Try Demo Connection**. This creates a **fictional** Page record (`is_demo=true`) with **no Facebook token**; the UI clearly labels it **Demo Data**.
- **Phase 3:** read-only authorized published Facebook Page post retrieval via Graph API, secure backend token decryption, PostgreSQL post caching, cursor-based older-post sync, pagination, and a multi-select posts dashboard. The selected posts are not yet scanned.
- **Future Phase 4:** clearly labeled *simulated* comment scans, fake flagged comments, statistics, and repeat authors. No AI or real comment ingestion in this hackathon scope.
- **Future Phase 5:** deployment and end-to-end acceptance testing.

**Not implemented:** Instagram, actual comments ingestion, AI models, media analysis, evidence generation, WhatsApp/Telegram, billing, cybercrime complaint submission, Meta App Review, and any moderation/write actions.

## Setup instructions

Read **[docs/PHASE2_SETUP.md](docs/PHASE2_SETUP.md)** for Facebook connection setup, then **[docs/PHASE3_SETUP.md](docs/PHASE3_SETUP.md)** for post retrieval, required local steps, Meta permission caveats and acceptance tests.

## Important database notes

- The existing PostgreSQL schema is authoritative. The source SQL is included at `database/SafeSphere_AI_Database_Schema_v1.sql` for future reproducibility.
- If you already created the database in pgAdmin, **do not rerun the SQL**.
- Phases 2–3 map existing `oauth_states`, `social_connections`, `audit_logs` and `social_posts` tables. **No new database migration is required.**
- The current Alembic `0001_baseline` is intentionally empty because the initial schema was imported with pgAdmin. Before deployment to a fresh server, apply the full SQL once and then `alembic stamp head`.
- **Do not run Alembic `--autogenerate`** until all 22 existing tables are mapped; otherwise it may propose dropping unmapped tables.

## Security

- Never commit `.env`, `.env.local`, OAuth codes, Graph API access tokens, JWT secrets, PostgreSQL passwords, or Fernet keys.
- Production: use HTTPS, `COOKIE_SECURE=true`, correct `APP_ORIGIN`, exact Meta redirect URI, and controlled Meta app access. Restrict runtime log configuration so callback query codes and token-bearing Graph URLs never appear in access/request logs.
- We use backend-only Meta Graph API calls; access tokens are Fernet-encrypted **before** writing to the database and **never** returned by application endpoints.
- Existing authentication remains intentionally minimal for hackathon use. Complete rate limiting, CSRF hardening, email verification, password recovery, security review, CI, monitoring, deauthorization/data-deletion policies, and Meta App Review remain needed for a publicly available product.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | API health |
| GET | `/health/db` | PostgreSQL check |
| POST | `/auth/register` | Register and create workspace |
| POST | `/auth/login` | Log in |
| POST | `/auth/logout` | Log out |
| GET | `/auth/me` | Current user/workspace |
| GET | `/facebook/connect` | Redirect to Meta authorization |
| GET | `/facebook/callback` | Verify state, exchange code, save authorized Pages |
| GET | `/facebook/connection` | List Page connections (never returns tokens) |
| POST | `/facebook/select-page` | Choose a Page for Phase 3 |
| DELETE | `/facebook/connection?connection_id=UUID` | Clear a Page's locally stored token |
| POST | `/facebook/demo-connect` | Optional fictional Page (only with `FACEBOOK_MOCK=true`) |
| GET | `/posts?limit=24&offset=0` | List cached posts for the selected Page/workspace |
| POST | `/posts/sync` with `{"mode":"latest"}` | Read newest Page-owned published posts from Meta and cache them |
| POST | `/posts/sync` with `{"mode":"older"}` | Fetch an older batch using the server's stored Graph cursor |

The frontend calls these through `/api/*` using `frontend/next.config.ts` rewrites.
