# Spec 04: Authentication & Session Specification

## 1. Endpoints
- `POST /api/auth/register`: `{ email, password, display_name, workspace_name? }` -> creates user & workspace, sets `safesphere_session` cookie, returns `MeResponse`.
- `POST /api/auth/login`: `{ email, password }` -> sets `safesphere_session` cookie, returns `MeResponse`.
- `POST /api/auth/logout`: `{}` -> deletes session cookie, returns `{ ok: true }`.
- `GET /api/auth/me`: returns current user, workspace ID, role, or 401 if unauthorized.

## 2. Form Implementation
- Built with `react-hook-form` and `@hookform/resolvers/zod`.
- **Validation Schemas:**
  - Login: email required and valid, password required.
  - Register: email valid, display_name 2-120 chars, password minimum 12 characters.
- **UI Elements:**
  - Centered card (`max-w-md`), clean borders.
  - Inline field validation errors under inputs (`text-destructive text-xs`).
  - Server error banner for API rejections (e.g. 409 Conflict: "Email already registered").
  - Password visibility toggle (Eye / EyeOff icon).
  - Submit button: `size="default"`, `variant="default"`, `w-auto self-start` or aligned. Shows loading spinner and disables during request.
  - Navigation links between `/login` and `/register`.

## 3. Route Protection & Middleware
- Next.js middleware in `src/middleware.ts`:
  - Protects routes: `/dashboard`, `/posts`, `/scans`, `/cases`, `/reports`, `/settings`.
  - Redirects unauthenticated users (missing `safesphere_session` cookie) to `/login`.
  - Redirects authenticated users accessing `/login` or `/register` to `/dashboard`.
- Global query cache invalidation on login/logout.
- Unified 401 interceptor in the API client automatically clears cache and pushes to `/login`.
