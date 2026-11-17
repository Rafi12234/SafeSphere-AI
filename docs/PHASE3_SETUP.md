# SafeSphere AI — Phase 3: Real Facebook Page Posts

Phase 3 adds **read-only retrieval of authorized Page-owned published posts** via Meta Graph API, caching into the *existing* PostgreSQL **social_posts** table, and a multi-select posts dashboard. It does **not** fetch comments, run AI models, or perform Page write/moderation actions. Simulated scanning is a separate implemented Phase 4 workflow.

## What you need to do manually

1. **Pull the latest main branch** into your existing local project:
   ~~~powershell
   git status
   git switch main
   git pull origin main
   ~~~
   Before switching, commit or stash your uncommitted changes. Keep the same backend/.env, frontend/.env.local, and Facebook encryption key you used in Phase 2.
2. **No new environment variables, database tables, or migrations** are needed if your existing Phase 2 connection works and you previously imported database/SafeSphere_AI_Database_Schema_v1.sql. Do NOT re-import this schema into a database containing your user accounts.
3. Install the already-listed dependencies (if needed) and start both servers:
   ~~~powershell
   cd backend
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --no-access-log
   ~~~
   In a second PowerShell terminal from the project root:
   ~~~powershell
   cd frontend
   npm ci
   npm run dev
   ~~~
4. Open http://localhost:3000/dashboard, verify that your **real Facebook Page is selected**, then click **View Facebook Posts**. Click **Refresh latest posts**.
5. **Your Facebook Page must have at least one published post** for Meta to return anything. If the Page has no posts, create a normal harmless test post *manually on Facebook*, then refresh. SafeSphere AI does not create Facebook posts.

## Important: Meta permissions

The backend requests **GET /{page-id}/published_posts** using the encrypted Page token obtained in Phase 2. The request is read-only; it does not use pages_manage_posts. The initial Meta configuration pages_show_list + pages_read_engagement may be sufficient for your own test Page, but Meta may require **additional Page permissions or Page Public Content Access** depending on the Page, API behavior, and review status.

If refreshing shows **"Your Facebook account lacks the required Page permissions"** or a Meta API error:
- Open Meta's [Page Published Posts reference](https://developers.facebook.com/docs/graph-api/reference/page/published_posts/) and check the required permissions for your Page/app.
- If Meta explicitly requires it, add pages_read_user_content to the existing Facebook Login for Business configuration (and the app's Manage Pages use case), then click **Connect Facebook** again to grant the new scope. Do not add publish/manage permissions solely for post retrieval.
- For public customers, the app still needs appropriate Meta App Review / Advanced Access and possibly business verification. Development-mode testing with the app admin does not equal public access.
- Check that the Meta app uses your authorized test Page and its selected Page token.

**Do not paste access tokens, App Secrets, private database passwords, or your Fernet key into GitHub issues, screenshots or ChatGPT.**

## APIs (through Next.js /api/* proxy)

- **GET /posts?limit=24&offset=0** — cached posts for **only the selected Page in the current user's workspace**. No external Meta request.
- **POST /posts/sync**, body {"mode":"latest"} — fetch the first batch of up to **25** published posts from Meta, upsert into social_posts and update last-sync time.
- **POST /posts/sync**, body {"mode":"older"} — fetch the next page using a **server-stored** opaque Graph cursor (if one exists).
- **GET /facebook/connection** — select Page state from Phase 2.
- **POST /facebook/select-page** — choose a different connected Page, then reopen the posts dashboard.

Example read-only verification in pgAdmin:
~~~sql
SELECT c.display_name AS page, p.provider_post_id, p.is_demo,
       p.published_at, p.last_synced_at
FROM social_posts AS p
JOIN social_connections AS c ON c.id = p.connection_id
ORDER BY p.last_synced_at DESC
LIMIT 20;
~~~
No token data is selected.

## Demo mode

If you intentionally set FACEBOOK_MOCK=true and chose **Try Demo Connection** in Phase 2, **Load Demo Posts** populates clearly marked **fictional** post fixtures with IDs beginning demo:. This flow makes **no Graph API request** and never pretends to fetch real posts. Keep the environment variable false when testing genuine Facebook connectivity.

## User acceptance checks

- Dashboard links to /posts, and signed-out browsers cannot reach it.
- The selected real Page appears on /posts.
- Refresh retrieves real published posts; captions, dates, available images and links render.
- Refreshing twice doesn't duplicate rows (unique key: connection_id, provider_post_id).
- **Fetch older from Facebook** appears if Meta provides another page, and stored posts remain on reload.
- **Load more cached posts** paginates when there are more than 24 entries.
- Multiple posts can be checked, including select-all on the current filtered/loaded list. **Start Simulated Scan** is enabled for owners/admins with 1–20 selected posts; it opens the explicitly fictional Phase 4 workflow.
- Switching to another connected Page shows **only that Page's cached posts**.
- Meta token-expiry or missing permission displays a safe, actionable error; tokens are never sent to the frontend.
- Demo posts show "Demo Data" and never intermingle with real Page posts.

## Automated checks

~~~powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest -q
cd ../frontend
npm ci
npm run build
~~~

GitHub Actions runs Python tests/compilation and the Next.js build on pushes to main.

## Scope and boundaries

This is a **hackathon demo**. Graph API returned pictures are shown as remote URLs but not downloaded or analyzed. The comment_count in the API is deliberately null, not invented; no comment fetch calls are made. Your post selection is temporary in the page UI until the user starts a simulated Phase 4 scan, which persists the selected post IDs with the scan.

The current SQL schema remains authoritative. No Alembic migration or re-import is required for Phase 3. All API access checks use the signed-in user's active workspace. Before a public SaaS launch, complete Meta App Review, HTTPS deployment, token lifecycle management, privacy/data deletion processes, rate limiting, CSRF hardening and multi-tenant end-to-end testing.
