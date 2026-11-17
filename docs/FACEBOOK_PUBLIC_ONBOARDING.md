# SafeSphere AI — Public Facebook Page Onboarding and Meta App Approval

## Publish the legal-information site before App Review

The project includes four legal-information Markdown pages in `docs/` plus `docs/_config.yml` for GitHub Pages:

- `docs/index.md`
- `docs/privacy-policy.md`
- `docs/terms-of-service.md`
- `docs/data-deletion.md`

**The files being in GitHub does not make them live webpages.** The repository owner must open [GitHub repository Pages settings](https://github.com/Rafi12234/SafeSphere-AI/settings/pages), choose **Deploy from a branch → main → /docs**, and save. After the published site builds, **personally open and verify** these expected HTTPS URLs:

- `https://rafi12234.github.io/SafeSphere-AI/privacy-policy.html`
- `https://rafi12234.github.io/SafeSphere-AI/terms-of-service.html`
- `https://rafi12234.github.io/SafeSphere-AI/data-deletion.html`

They are **expected paths**, not proof of a live site. GitHub Pages may remain disabled or deployment may fail. Do not enter unverified URLs into Meta.

Confirm the email on these pages is a **working, regularly monitored support inbox** and the team can fulfill verified data-deletion requests; there is currently no self-service account-deletion endpoint. An email contact that the team cannot service is not adequate.

Once verified, copy the links into **Meta App Settings → Basic** under **Privacy Policy URL**, **Terms of Service URL**, and **User Data Deletion Instructions URL**. Submit only truthful operational information.

## Goal: one SafeSphere service, many independent Page-owning customers

SafeSphere operates **one Meta Developer App** that belongs to the SafeSphere team. The app's App ID and App Secret stay on our backend. Customers never need to register as Meta developers or create their own Meta apps. Each customer registers **in SafeSphere**, signs in to **Facebook as a person**, authorizes only the Facebook Pages they are permitted to manage, and then chooses one connected Page to retrieve its published posts.

A Facebook *personal profile* is not a Facebook *Page*. There is no way to "log in as a Page" via Facebook OAuth; the personal login establishes the Page manager's identity. We only use Meta's authenticated `/me/accounts` Page list and Page access tokens; we do not store the person's profile as a Page or read their personal timeline. When Meta returns zero eligible Pages, SafeSphere returns a no-Pages warning and doesn't create a connection. Pages with no authorization must not appear. The selection and saved tokens remain workspace-scoped.

**Existing scope:** real OAuth and published Facebook Page posts. The Phase 4 scan uses scripted **Demo Data**, not real Facebook comments or AI inference.

## Why teammates see "App not active"

The message is shown on Meta's own Facebook authorization page *before* SafeSphere receives a callback. The SafeSphere backend or database configuration cannot override it.

1. Sign into [Meta App Dashboard](https://developers.facebook.com/apps/) **as the owner of the one SafeSphere Meta app**. Check that the app exists, is accessible, is not disabled or policy restricted, and verify the current app mode and permissions. Do not assume "App not active" proves only one specific cause: Development mode can restrict non-role users, but a disabled or misconfigured app can also cause access problems.
2. For immediate teammate testing **before public approval**, add the teammate's Facebook identity as an **app Tester** (or another appropriate app role). They must accept the invitation. Testers do **not** need to manage your Meta app or create a separate Meta app.
3. Have the teammate authenticate using **that invited Facebook account**, which must have appropriate access to its **own Facebook Page**. If they have only a personal timeline with no managed Page, SafeSphere will show the no-eligible-Page warning.
4. If a tester still sees "App not active", confirm the **same account** accepted the role, verify app status and restrictions in Meta, and look for alerts or policy issues in the app dashboard. This is a Meta-side block; do not try to bypass it by coding a fake login or placing app credentials in the browser.

Meta's Development mode is for developers and invited testers—not unrestricted public Facebook Page onboarding.

## How to support any eligible customer after review

1. **Deploy one centralized SafeSphere installation** with HTTPS, a backend, and a shared multi-tenant PostgreSQL database. Customers visit the website and register; they do NOT clone the repository or configure a local `.env`.
2. In **Meta App Dashboard**, configure the product/use case **Facebook Login for Business**, add the exact production OAuth callback URL, configure allowed domains, and provide the required privacy policy and account/data deletion instructions. Make sure the domain and app configuration comply with Meta's current requirements.
3. Request **Advanced Access** for the permissions required by Page discovery and published-post read, ordinarily `pages_show_list` and `pages_read_engagement`. If the precise `/{page_id}/published_posts` access or additional fields demand `pages_read_user_content` or another Meta permission, request and justify that separately; don't broaden permissions without need.
4. Complete **App Review** and any required business verification, data use and policy checks. Show a reviewer a working login, Page authorization and real Page-post display. Some apps or permissions have extra verification steps. Meta controls approval; code changes cannot force an approval.
5. When Meta permits it, enable the app's **Live/public** status. Check each requested permission is approved for general users—not merely configured with Standard Access for test roles.
6. Set production environment variables such as `APP_ORIGIN=https://yourdomain.example`, `FACEBOOK_REDIRECT_URI=https://yourdomain.example/api/facebook/callback`, `COOKIE_SECURE=true`, and backend database secrets in your host's secret manager. Keep `FACEBOOK_APP_SECRET`, `FACEBOOK_TOKEN_ENCRYPTION_KEY`, `JWT_SECRET`, and `DATABASE_URL` on the backend only. Register the exact callback URL with Meta.
7. Perform a final acceptance test using **two independent ordinary Facebook accounts** with no app role, each managing their own Page. Confirm each sees only their own Page and Page posts; verify profile-only users get the no-Pages warning. If Meta still blocks non-role users, public access is *not* ready.

## Security note after sending another developer your .env file

A backend `.env` usually contains much more than the Meta App ID: it can contain the Meta App Secret, JWT signing secret, Facebook token encryption key, and database credentials.

- Stop copying the entire file. Share only the variable **names** and per-developer instructions, or use a proper team secret manager.
- Give each developer separate local **database credentials and JWT secret**. For separate databases, use a separate Fernet key as well, but remember that previously encrypted Page tokens cannot be decrypted if the key is blindly replaced. Reconnect Pages or migrate encrypted tokens deliberately.
- If a credential was sent insecurely, exposed beyond trusted developers, or committed to Git, rotate the exposed credential and invalidate/reauthorize impacted tokens as needed. Coordinate Fernet key changes carefully.
- An App ID is public; the **App Secret** must stay confidential. No regular SafeSphere user should receive it.

## Current SafeSphere user experience

**A. Eligible Meta app user who manages a Page:** SafeSphere registration → SafeSphere login → Connect Facebook → Meta authenticates their personal profile → user grants Page access → SafeSphere lists ONLY authorized Pages → user selects Page → view published Page posts.

**B. Someone with only a personal profile:** Meta authenticates them (once public access is approved), but `/me/accounts` returns no authorized Page token → SafeSphere redirects to dashboard with a prominent **Facebook Pages only — personal profiles are not supported** message. No personal timeline is connected.

**C. Unauthorized user while app is in Development mode:** Meta itself may show **App not active** before the app gets any callback. The app cannot display case B until Meta grants them permission to authenticate.

**D. Hackathon visitor without app access:** If the backend operator enables `FACEBOOK_MOCK=true`, **Try Demo Connection** creates a fictional demo Page and sample posts. This is intentionally separate from actual Meta connectivity and all generated content is labeled Demo Data.

## Official documentation

- Meta, [Managing Development Cycles](https://developers.facebook.com/docs/apps/managing-development-cycle)
- Meta, [App Review introduction](https://developers.facebook.com/docs/resp-plat-initiatives/app-review/introduction)
- Meta, [Business pre-App-Review development](https://developers.facebook.com/docs/business-management-apis/2tier-bm-solution/pre-app-review-development/)
- Meta, [Graph API User Accounts /me/accounts](https://developers.facebook.com/docs/graph-api/reference/user/accounts/)
- Meta, [FAQ: Standard vs. Advanced Access](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/data-handling-questions/faqs/)
