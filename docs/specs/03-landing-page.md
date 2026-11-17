# Spec 03: Landing Page Specification (`/`)

## 1. Page Structure & Section Breakdown

### Section 1: Hero
- **Headline:** "Know who is targeting your comments, before it wears you down."
- **Supporting Copy:** "SafeSphere AI detects targeted harassment, hate speech, and repeat harassment accounts across your Facebook Page posts — keeping you in full control."
- **CTAs:**
  - Primary button: "Get started" (`size="default"`, `variant="default"`) -> links to `/register`.
  - Secondary button: "See how it works" (`size="default"`, `variant="outline"`) -> smooth scrolls to `#how-it-works`.
- **Badge:** Small "Demo build · Simulated findings" badge.
- **Product Preview:** Stylized mock dashboard card showing comment safety analytics with subtle scroll parallax.

### Section 2: What It Does (Core Capabilities)
4 cards in a 2x2 grid:
1. **Connect your Page:** Secure read-only access. We never post, edit, or delete on your behalf.
2. **Find abusive comments:** Natural language safety detection tuned for Bangla, Banglish, and English abuse patterns.
3. **Spot repeat accounts across posts:** Automatically group accounts that appear persistently across 3 or more posts.
4. **Review before you act:** Human review at every step. Content is blurred by default to protect mental well-being.

### Section 3: Who It's For (Audience Cards)
3 cards in a 3-column row:
1. **Public Figures:** Focus on your community without being overwhelmed by coordinated hostility.
2. **Creators & Artists:** Protect your comment section and identify persistent harassment campaigns.
3. **Page Admins & Community Teams:** Streamline moderation with organized severity tiers and evidence export.

### Section 4: How It Works (Sticky Scroll Flow)
Sticky stage pinning during a 5-step narrative scroll:
- **Step 1:** Connect Facebook (Read-only OAuth, encrypted token).
- **Step 2:** Select Posts (Choose specific posts or select all recent publications).
- **Step 3:** Start the Scan (Simulated progress through comment, text, media, and repeat account stages).
- **Step 4:** Review Findings (Explore flagged remarks, inspect severity, view repeat author profiles).
- **Step 5:** Prepare Review Draft (Organize findings into a structured, exportable report).

### Section 5: Built to Be Careful (Trust & Privacy)
Trust points highlighted with calm iconography:
- **Human Verification First:** Flagged does not mean guilty; AI recommendations are advisory.
- **Sensitive Content Shield:** Abusive text is blurred by default with explicit reveal actions.
- **Zero Token Persistence in Browser:** Session keys and Page tokens are Fernet-encrypted server-side.
- **No Public Blacklists:** SafeSphere does not publish or share offender lists.

### Section 6: Frequently Asked Questions (FAQ)
shadcn `Accordion` with 6 questions:
1. *What permissions does SafeSphere require?* (Read-only access to view published Page posts).
2. *Will SafeSphere post, delete, or ban anything automatically?* (Never. We have zero write permissions).
3. *Which languages and dialects are supported?* (Standard Bangla, Banglish phonetic text, and English).
4. *Is this a replacement for legal advice?* (No. It helps organize factual records for community or legal review).
5. *How are credentials and Facebook tokens stored?* (Encrypted at rest using AES-128-CBC Fernet keys; never exposed to clients).
6. *How much does running a scan cost?* (The demo is free; live AI tiers will offer per-scan and subscription tiers).

### Section 7: Closing CTA
- Text: "Take back control of your community's conversation."
- Button: "Create free account" (`size="default"`, `variant="default"`) -> `/register`.

### Section 8: Footer
- Brand wordmark: **SafeSphere AI** with shield icon.
- Short mission statement.
- Links: Product, Docs, Legal.
- Contact placeholders from `lib/site.ts` (`TODO` placeholders only).
- Copyright notice.
