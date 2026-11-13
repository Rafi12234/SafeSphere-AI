# SafeSphere AI — Phase 1 Starter

A runnable foundation aligned with the **SafeSphere AI Demo Scope of Work** and `SafeSphere_AI_Database_Schema_v1.sql`.

**What works:** registration, login/logout, sessions in HttpOnly cookies, workspace creation and membership, basic Next.js dashboard, FastAPI health checks.

**What is deliberately NOT implemented:** Facebook OAuth, real post retrieval, simulated scans, AI agents, media processing, evidence reports, WhatsApp/Telegram, payment integration. Those are later phases.

## Prerequisites
Windows PowerShell, Python 3.12+, Node.js 20.9+, npm, PostgreSQL. Import the existing schema through pgAdmin **before** starting. The FastAPI code never creates tables.

## 1. Place in repository
Unzip into your local clone of `Rafi12234/SafeSphere-AI` so `frontend/` and `backend/` are at the root.

## 2. Backend
```powershell
cd backend
Copy-Item .env.example .env
# Edit .env: PostgreSQL password in DATABASE_URL (URL-encode special characters) and strong JWT_SECRET
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```
In a browser: http://127.0.0.1:8000/health and http://127.0.0.1:8000/health/db . API docs: http://127.0.0.1:8000/docs .

Generate a random JWT secret with:
```powershell
py -3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

## 3. Frontend (another PowerShell terminal)
```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```
Browse http://localhost:3000/register . Register an account (password 12+ characters), then refresh the dashboard, log out, and log back in.

## 4. Confirm rows in pgAdmin
```sql
SELECT id, email, created_at FROM users ORDER BY created_at DESC;
SELECT id, owner_user_id, name FROM workspaces ORDER BY created_at DESC;
SELECT workspace_id, user_id, role FROM workspace_memberships;
```
Passwords are hashed. Never share `.env` or credentials.

## 4a. Record the already-imported schema in Alembic (one-time)
After you confirm your existing 22 tables, from `backend/` run:
```powershell
.\.venv\Scripts\python.exe -m alembic stamp head
.\.venv\Scripts\python.exe -m alembic current
```
This adds only Alembic's version tracking. It does **not** recreate your pgAdmin tables.
**Do not use `alembic revision --autogenerate` yet:** Phase 1 maps only three tables and autogenerate could incorrectly propose dropping the other 19. Future changes require reviewed manual migrations until the full schema is mapped.


## 5. Commit
```powershell
git add .
git status
git commit -m "Phase 1: Next.js FastAPI PostgreSQL authentication foundation"
git push origin main
```
Check that `.env` files and `.venv/` are NOT staged.

## Security / future work
- Backend validates signed session tokens; cookie presence in Next.js `proxy.ts` is **only an optimistic UI redirect**, not authorization.
- Frontend API traffic is proxied through the Next.js domain; when deploying, set `BACKEND_INTERNAL_URL` to your Railway backend, `APP_ORIGIN` to the public frontend origin, and `COOKIE_SECURE=true` on HTTPS.
- Password reset, email verification, rate limiting, MFA, additional sessions and CSRF hardening are **production follow-up work**; do not claim they are implemented.
- Existing schema is the baseline; use **Alembic migrations** for future changes, not `create_all()` or re-running table creation.
