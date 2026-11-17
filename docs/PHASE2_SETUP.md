# SafeSphere AI — Phase 2 setup and validation

Phase 2 provides **real Facebook Page OAuth authorization, encrypted Page token storage, Page selection, and disconnection**. Phase 3 retrieves real published Page posts; Phase 4 now provides explicitly simulated scanning and fictional results.

## Before starting
- Use the existing PostgreSQL database created with `database/SafeSphere_AI_Database_Schema_v1.sql`. Do not rerun the file on an existing populated database.
- Use the existing Meta app's Facebook Login for Business **User Access Token** configuration with `pages_show_list` and `pages_read_engagement`.
- For local development, use `localhost:3000` consistently; the OAuth callback is `http://localhost:3000/api/facebook/callback`. Confirm Meta permits the exact localhost redirect under the Facebook Login for Business configuration; localhost authorization does **not** bypass Development-mode app-role restrictions.
- Do **not** commit `backend/.env`, `frontend/.env.local`, tokens, app secrets or encryption keys.

## Local setup

In `backend/.env`, retain your Phase 1 `DATABASE_URL` and `JWT_SECRET`, and set:
```dotenv
APP_ORIGIN=http://localhost:3000
COOKIE_SECURE=false
FACEBOOK_APP_ID=YOUR_APP_ID
FACEBOOK_APP_SECRET=YOUR_APP_SECRET
FACEBOOK_CONFIG_ID=YOUR_CONFIGURATION_ID
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/facebook/callback
FACEBOOK_GRAPH_VERSION=v27.0
FACEBOOK_MOCK=false
FACEBOOK_TOKEN_ENCRYPTION_KEY=YOUR_FERNET_KEY
```
Generate a Fernet key once:
```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```
Store the key securely: changing it later without rotation will make existing stored Page tokens undecryptable.

Run backend (disable access logs to avoid logging OAuth callback codes):
```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --no-access-log
```
Run frontend in a separate terminal:
```powershell
cd frontend
npm ci
npm run dev
```
Ensure `frontend/.env.local` has `BACKEND_INTERNAL_URL=http://127.0.0.1:8000`.

## End-to-end acceptance checks
1. `http://127.0.0.1:8000/health/db` returns `{"status":"ok","database":"connected"}`; `/docs` displays Facebook routes.
2. Log in at `http://localhost:3000/login`, open the dashboard and click **Connect Facebook**.
3. Authorize your test Page; the dashboard should show the real Page as **Connected**. Refresh; selection must persist.
4. If multiple Pages are authorized, **Select Page** must work; **Disconnect** removes the locally stored token. Verify cancelled/denied OAuth and missing-session behavior.
5. In pgAdmin, verify without displaying secrets:
```sql
SELECT provider, display_name, status, is_demo,
       encrypted_token IS NOT NULL AS has_token,
       capabilities->>'selected' AS selected
FROM social_connections ORDER BY created_at DESC;
```
6. Run tests:
```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest -q
cd ../frontend
npm ci
npm run build
```

## Demo mode
`FACEBOOK_MOCK=true` enables a clearly labeled fictional Page, without Meta authorization or genuine post/comment data. It is for judges without Meta app roles; do not present it as a real Facebook connection. For approved access by ordinary Page owners, follow [Public Facebook Onboarding](FACEBOOK_PUBLIC_ONBOARDING.md).

## Public-launch requirements (not completed by Phase 2)
Before allowing arbitrary customers to connect: deploy HTTPS, register the exact production OAuth redirect URI, enable secure cookies, complete required Meta App Review and business verification, implement deauthorization/data deletion and privacy policy endpoints, add rate limiting and comprehensive CSRF protection, validate multi-tenant isolation, handle token revocation and expiry, and rotate any previously exposed credentials.

Your Alembic baseline is intentionally empty: for a **new** database import the full schema first and stamp the baseline. Do not autogenerate migrations from partially mapped SQLAlchemy models.
