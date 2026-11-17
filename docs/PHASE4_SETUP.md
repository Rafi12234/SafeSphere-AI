# SafeSphere AI — Phase 4: Simulated harassment demo

**The only genuine Meta data is your authorized Facebook Page and its posts (Phases 2–3).** Phase 4 never downloads real Facebook comments, identifies real Facebook commenters, or calls AI. All displayed comments, demo authors, classifications, severity labels, progress numbers, repeat accounts and incidents are **scripted DEMO DATA**.

## What you need to set up manually

**No new API keys, environment variables, SQL migrations, tables or permissions are required.**

1. Keep your already-working Phase 2 Facebook App credentials and Fernet encryption key in backend/.env; do **not** recreate or rotate them. Keep your frontend/.env.local pointing at http://127.0.0.1:8000.
2. In Windows PowerShell from your local project root:
   ~~~powershell
   git status
   git switch main
   git pull origin main
   ~~~
   Commit or stash any local uncommitted changes before switching branches/pulling. Do not overwrite your local .env files.
3. Install and start the backend:
   ~~~powershell
   cd backend
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --no-access-log
   ~~~
4. In a second PowerShell window, start the frontend:
   ~~~powershell
   cd frontend
   npm ci
   npm run dev
   ~~~
5. Open http://localhost:3000/dashboard, choose **View Facebook Posts**, select 1–20 cached posts and click **Start Simulated Scan**. You already have two real posts cached from Phase 3.
6. The app opens a results page at /scans/{id}. Observe the approximately **18-second scripted progress animation** and the entirely **fictional** results and analytics. Use **Scan history** to revisit results. No additional Meta authorization should be needed.

Do NOT re-import database/SafeSphere_AI_Database_Schema_v1.sql or run Alembic autogeneration on a database that already contains your 22 tables. Phase 4 maps the existing tables rather than creating new ones.

## Implemented API routes

- **POST /scans** body: {"post_ids":["uuid1","uuid2"]} — owner/admin-only, validates every selected post belongs to the active workspace and selected Facebook Page, creates a demo scan and fictional fixture findings/incident entries in a single PostgreSQL transaction.
- **GET /scans** — the 20 newest simulated scans scoped to the user's active workspace.
- **GET /scans/{scan_id}** — simulated time-based progress. Results are hidden until the scripted timeline completes, then returns only fictional findings, statistics, repeat-account indicators and demo incidents.
- **GET /posts** and **POST /posts/sync** — unchanged real Page-post functionality from Phase 3.

The frontend calls these via the existing /api/* Next.js proxy. Every write requires the signed-in owner's/admin's active workspace and the configured frontend origin. Read APIs check workspace membership and do not expose tokens.

## Scripted fixture design

- Ten fixed comments **per selected post**, in Bangla, English and Banglish. This is a *demonstration count*, not a prediction or measured Facebook comment count.
- Only fictional author identities such as **Demo Account A** are used. Their provider IDs begin with **demo:**. All fictional comments likewise have a **demo:** provider ID and **is_demo=true**.
- Each finding has **source_type=demo_fixture**, **model_name=NULL**, and no AI confidence score.
- Classifications include safe, harassment, bullying, intimidation and threat, with low to critical severity. They are manually preassigned examples.
- Recurring fictional author indicators appear when the same fixture author has flagged examples across **at least two** different selected posts.
- The existing SQL schema uses a stricter threshold of **at least three distinct posts** for a **repeat-harassment incident**. With only your two existing real Facebook posts, you can demonstrate the recurring-author indicators but should NOT expect a repeat-harassment incident. Fictional critical-threat incidents can appear with one or more posts.
- No real Facebook author identity is compared across posts; no external incident, complaint, evidence report or moderation action is created.

## Verify in pgAdmin without exposing private data

~~~sql
SELECT id, scan_mode, status, estimated_comment_count,
       processed_comment_count, started_at, completed_at
FROM scans
ORDER BY created_at DESC LIMIT 10;

SELECT f.source_type, f.primary_label, f.severity, f.language_code,
       COUNT(*) AS fictional_findings
FROM scan_findings f
GROUP BY f.source_type, f.primary_label, f.severity, f.language_code
ORDER BY fictional_findings DESC;

SELECT COUNT(*) AS fictional_comments
FROM social_comments WHERE is_demo = TRUE;

SELECT COUNT(*) AS fictional_incidents
FROM incidents WHERE is_demo = TRUE;
~~~

The API marks a scan completed when the results page or history endpoint is read after the 18-second duration. No worker or cron service is required.

## Automated checks

~~~powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest -q
cd ../frontend
npm ci
npm run build
~~~

GitHub Actions runs backend unit tests **and a PostgreSQL-backed end-to-end integration test** against a disposable PostgreSQL service initialized from the original SQL schema; its frontend job builds Next.js. The tests use fictional data and fake Meta tokens. CI does **not** connect to or change your own local PostgreSQL database, so you should still test the full browser flow locally.

## Hackathon/demo presentation and scope

Describe SafeSphere as **real Facebook Page authorization + real Page-post listing + simulated harassment scanning**. Make the fictional nature of comments, labels, repeat accounts, and statistics explicit to judges. Avoid screenshots or claims that imply SafeSphere detected actual people making threats. Do not upload demo findings as legal evidence or submit complaints.

Production SaaS features (real authorized comment access, AI moderation, data deletion, permissions, subscriptions, incident validation, etc.) are beyond this hackathon demo, and Meta App Review will be needed before enabling general public Facebook Page connections.
