# Spec 10: Deterministic Seed Data & Safety Rules

## 1. Principles
- **Safety First:** Sample abusive comments must read as clearly flagged for harassment or hostility, but must **never** contain explicit slurs, graphic violence, graphic sexual content, or real individuals' names.
- **Multilingual Support:** High-quality sample distribution across:
  - Standard Bangla (বাংলা)
  - Banglish (English alphabet phonetic Bangla, e.g., "Toke online e shanti te thakte dibo na")
  - English
- **Determinism:** Seed generator uses pseudo-random algorithms seeded by `scan_id` and `post_id` (e.g. Mulberry32 or simple hash PRNG) so that identical IDs consistently produce the exact same sequence of comments and findings.

## 2. Seed Generator Volume & Categories
- **Per post:** 40 to 80 simulated comments when seed fallback is engaged.
- **Category Labels:**
  - `harassment` (Hostile or degrading personal attacks)
  - `bullying` (Belittling or silencing remarks)
  - `intimidation` / `threat` (Direct or implied intimidation)
  - `body_shaming` (Unsolicited degrading physical remarks)
  - `hate` (Dehumanizing identity-based remarks)
  - `safe` (Constructive, neutral, or supportive community comments)
- **Severity Tiers:** `critical`, `high`, `medium`, `low`, `none`.
- **Reason Codes:** `HARASS_DIRECT`, `BULLY_SILENCE`, `THREAT_IMPLIED`, `BODY_SHAME`, `BANGLISH_HOSTILE`, `CONSTRUCTIVE`.

## 3. Repeat Accounts Distribution
- 4 to 6 fictitious persistent accounts (e.g., `Demo Account Alpha`, `Demo Account Beta`, etc.) engineered to appear across 3 or more posts with multiple flagged remarks, satisfying the repeat account incident threshold.
