-- ============================================================================
-- SAFESPHERE AI | POSTGRESQL DATABASE SCHEMA v1.0
-- For: Phase 1-5 working demo + extensible foundation for future AI features
-- Compatible with PostgreSQL 14+ (gen_random_uuid() built in).
--
-- HOW TO RUN IN pgAdmin 4:
--   1. Create an EMPTY database named: safesphere_ai
--   2. Open Query Tool while connected to THAT database.
--   3. Open this file and press Execute (F5).
--   4. Refresh Schemas > public > Tables, or use the verification query below.
--
-- NOTE: PostgreSQL cannot switch databases in the middle of a Query Tool script.
--       This file creates the STRUCTURE in your selected database, not the database.
--       It does NOT insert dummy users or sensitive data.
--       It does NOT retrieve real Facebook comments or run AI.
--       It does NOT drop existing tables or data.
--
-- Application rules:
--   * Every customer-facing query MUST be scoped to workspace_id in the backend.
--   * Facebook tokens must be encrypted by the backend BEFORE they reach the DB.
--   * Fake comments / accounts must have is_demo = TRUE and demo-prefixed IDs.
--   * A simulated scan must be clearly labeled in the UI.
--   * Use Alembic migrations for all subsequent schema changes.
-- ============================================================================

BEGIN;

-- ====================== SECTION A: CURRENT DEMO =============================

-- 01. SafeSphere registered users (password_hash = Argon2id/bcrypt hash only)
CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               TEXT NOT NULL CHECK (length(btrim(email)) BETWEEN 3 AND 320),
    password_hash       TEXT NOT NULL,
    display_name        TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified_at   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (lower(email));

-- 02. Workspaces: begin with one workspace per user; supports teams later
CREATE TABLE IF NOT EXISTS workspaces (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name                TEXT NOT NULL CHECK (length(btrim(name)) > 0),
    timezone            TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','suspended','closed')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 03. Future-ready role-based access; registration must insert the owner row
CREATE TABLE IF NOT EXISTS workspace_memberships (
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role                TEXT NOT NULL DEFAULT 'owner'
                        CHECK (role IN ('owner','admin','moderator','viewer')),
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','invited','revoked')),
    joined_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (workspace_id, user_id)
);

-- 04. One-time Facebook OAuth state; store a HASH of the random state, not raw state
CREATE TABLE IF NOT EXISTS oauth_states (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    provider            TEXT NOT NULL CHECK (provider IN ('facebook','instagram')),
    state_hash          TEXT NOT NULL UNIQUE,
    redirect_after      TEXT,
    expires_at          TIMESTAMPTZ NOT NULL,
    consumed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (workspace_id, user_id)
        REFERENCES workspace_memberships(workspace_id, user_id) ON DELETE CASCADE,
    CHECK (expires_at > created_at)
);

-- 05. Facebook Page connection now; Instagram Professional account later
CREATE TABLE IF NOT EXISTS social_connections (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    provider            TEXT NOT NULL CHECK (provider IN ('facebook','instagram')),
    provider_account_id TEXT NOT NULL,
    display_name        TEXT NOT NULL,
    username            TEXT,
    profile_url         TEXT,
    status              TEXT NOT NULL DEFAULT 'connected'
                        CHECK (status IN ('connected','limited','expired',
                                         'reauth_required','disconnected','error')),
    is_demo             BOOLEAN NOT NULL DEFAULT FALSE,
    granted_scopes      TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    capabilities        JSONB NOT NULL DEFAULT '{}'::JSONB,
    encrypted_token     TEXT,      -- ONLY Fernet-encrypted token, never plaintext
    token_expires_at    TIMESTAMPTZ,
    last_synced_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_social_connection UNIQUE (workspace_id, provider, provider_account_id),
    CONSTRAINT uq_social_connection_scope UNIQUE (id, workspace_id),
    CHECK (NOT is_demo OR encrypted_token IS NULL),
    CHECK (jsonb_typeof(capabilities) = 'object')
);

-- 06. Posts returned by Graph API OR explicit fictional demo fixtures
CREATE TABLE IF NOT EXISTS social_posts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL,
    connection_id       UUID NOT NULL,
    provider_post_id    TEXT NOT NULL,
    caption             TEXT,
    post_type           TEXT NOT NULL DEFAULT 'unknown'
                        CHECK (post_type IN ('text','image','video','reel','link',
                                            'carousel','unknown')),
    thumbnail_url       TEXT,
    permalink           TEXT,
    published_at        TIMESTAMPTZ,
    comment_count       BIGINT CHECK (comment_count IS NULL OR comment_count >= 0),
    is_demo             BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_social_post_provider UNIQUE (connection_id, provider_post_id),
    CONSTRAINT uq_social_post_scope UNIQUE (id, workspace_id, connection_id),
    FOREIGN KEY (connection_id, workspace_id)
        REFERENCES social_connections(id, workspace_id) ON DELETE CASCADE
);

-- 07. Provider author identities; missing IDs must NOT be guessed from usernames
CREATE TABLE IF NOT EXISTS social_authors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL,
    connection_id       UUID NOT NULL,
    provider_author_id  TEXT,       -- NULL if provider did not supply a stable ID
    username            TEXT,
    display_name        TEXT,
    avatar_url          TEXT,
    identity_quality    TEXT NOT NULL DEFAULT 'insufficient'
                        CHECK (identity_quality IN ('provider_id','insufficient','demo')),
    is_demo             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_social_author_scope UNIQUE (id, workspace_id, connection_id),
    FOREIGN KEY (connection_id, workspace_id)
        REFERENCES social_connections(id, workspace_id) ON DELETE CASCADE,
    CHECK (NOT is_demo OR identity_quality = 'demo'),
    CHECK (NOT is_demo OR provider_author_id IS NULL
           OR provider_author_id LIKE 'demo:%')
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_social_author_provider
    ON social_authors(connection_id, provider_author_id)
    WHERE provider_author_id IS NOT NULL;

-- 08. Comments are demo fixtures now; genuine permitted comments can use same table later
CREATE TABLE IF NOT EXISTS social_comments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL,
    connection_id       UUID NOT NULL,
    post_id             UUID NOT NULL,
    author_id           UUID,
    parent_comment_id   UUID,
    provider_comment_id TEXT,       -- demo IDs should begin with 'demo:'
    comment_text        TEXT,
    content_type        TEXT NOT NULL DEFAULT 'text'
                        CHECK (content_type IN ('text','image','gif','video','mixed','unknown')),
    language_hint       TEXT,
    permalink           TEXT,
    published_at        TIMESTAMPTZ,
    captured_at         TIMESTAMPTZ,
    source_status       TEXT NOT NULL DEFAULT 'available'
                        CHECK (source_status IN ('available','deleted','unavailable','unknown')),
    is_demo             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_comment_scope UNIQUE (id, workspace_id),
    CONSTRAINT uq_comment_post_scope UNIQUE (id, workspace_id, connection_id, post_id),
    FOREIGN KEY (post_id, workspace_id, connection_id)
        REFERENCES social_posts(id, workspace_id, connection_id) ON DELETE CASCADE,
    FOREIGN KEY (author_id, workspace_id, connection_id)
        REFERENCES social_authors(id, workspace_id, connection_id),
    FOREIGN KEY (parent_comment_id, workspace_id, connection_id, post_id)
        REFERENCES social_comments(id, workspace_id, connection_id, post_id),
    CHECK (NOT is_demo OR provider_comment_id IS NULL
           OR provider_comment_id LIKE 'demo:%')
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_comment_provider
    ON social_comments(connection_id, provider_comment_id)
    WHERE provider_comment_id IS NOT NULL;

-- 09. Scan job. For this demo, scan_mode must be 'simulated' in application code.
--     GET /scans/{id} derives visible progress from started_at + demo_duration_seconds.
CREATE TABLE IF NOT EXISTS scans (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            UUID NOT NULL,
    connection_id           UUID NOT NULL,
    initiated_by            UUID NOT NULL,
    scan_mode               TEXT NOT NULL DEFAULT 'simulated'
                            CHECK (scan_mode IN ('simulated','ai_assisted')),
    status                  TEXT NOT NULL DEFAULT 'running'
                            CHECK (status IN ('pending','running','completed','failed','cancelled')),
    demo_duration_seconds   INTEGER NOT NULL DEFAULT 20
                            CHECK (demo_duration_seconds BETWEEN 1 AND 86400),
    estimated_comment_count BIGINT NOT NULL DEFAULT 0
                            CHECK (estimated_comment_count >= 0),
    processed_comment_count BIGINT NOT NULL DEFAULT 0
                            CHECK (processed_comment_count >= 0),
    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at            TIMESTAMPTZ,
    failure_reason          TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_scan_scope UNIQUE (id, workspace_id, connection_id),
    CONSTRAINT uq_scan_workspace UNIQUE (id, workspace_id),
    FOREIGN KEY (connection_id, workspace_id)
        REFERENCES social_connections(id, workspace_id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id, initiated_by)
        REFERENCES workspace_memberships(workspace_id, user_id),
    CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- 10. Multiple selected posts belonging to the same connected account
CREATE TABLE IF NOT EXISTS scan_posts (
    scan_id             UUID NOT NULL,
    post_id             UUID NOT NULL,
    workspace_id        UUID NOT NULL,
    connection_id       UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (scan_id, post_id),
    CONSTRAINT uq_scan_post_scope
        UNIQUE (scan_id, post_id, workspace_id, connection_id),
    FOREIGN KEY (scan_id, workspace_id, connection_id)
        REFERENCES scans(id, workspace_id, connection_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id, workspace_id, connection_id)
        REFERENCES social_posts(id, workspace_id, connection_id) ON DELETE CASCADE
);

-- 11. Fake flagged results now; real AI classifications later
--     One finding per scanned comment in a scan. Future re-runs go in ai_model_runs.
CREATE TABLE IF NOT EXISTS scan_findings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL,
    connection_id       UUID NOT NULL,
    scan_id             UUID NOT NULL,
    post_id             UUID NOT NULL,
    comment_id          UUID NOT NULL,
    primary_label       TEXT NOT NULL
                        CHECK (primary_label IN ('safe','uncertain','bullying',
                           'harassment','sexual_harassment','threat','hate',
                           'body_shaming','intimidation','spam_scam','other')),
    labels              TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    severity            TEXT NOT NULL DEFAULT 'low'
                        CHECK (severity IN ('none','low','medium','high','critical')),
    language_code       TEXT NOT NULL DEFAULT 'unknown'
                        CHECK (language_code IN ('bn','en','banglish','mixed','unknown')),
    reason_code         TEXT,
    explanation         TEXT,
    source_type         TEXT NOT NULL DEFAULT 'demo_fixture'
                        CHECK (source_type IN ('demo_fixture','ai','human')),
    model_name          TEXT,       -- NULL for fake analysis
    model_version       TEXT,
    confidence          NUMERIC(5,4) CHECK (confidence BETWEEN 0 AND 1),
    review_status       TEXT NOT NULL DEFAULT 'unreviewed'
                        CHECK (review_status IN ('unreviewed','confirmed','dismissed')),
    reviewed_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_scan_comment_finding UNIQUE (scan_id, comment_id),
    CONSTRAINT uq_scan_finding_scope UNIQUE (id, workspace_id, scan_id, connection_id),
    FOREIGN KEY (scan_id, post_id, workspace_id, connection_id)
        REFERENCES scan_posts(scan_id, post_id, workspace_id, connection_id)
        ON DELETE CASCADE,
    FOREIGN KEY (comment_id, workspace_id, connection_id, post_id)
        REFERENCES social_comments(id, workspace_id, connection_id, post_id)
        ON DELETE CASCADE,
    CHECK (source_type <> 'demo_fixture' OR model_name IS NULL)
);

-- 12. Repeat harassment / critical threat incidents (private review, not accusations)
CREATE TABLE IF NOT EXISTS incidents (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            UUID NOT NULL,
    connection_id           UUID NOT NULL,
    scan_id                 UUID NOT NULL,
    author_id               UUID,
    incident_type           TEXT NOT NULL
                            CHECK (incident_type IN ('repeat_harassment',
                                'critical_threat','manual_review','other')),
    status                  TEXT NOT NULL DEFAULT 'flagged'
                            CHECK (status IN ('observing','flagged','in_review',
                                             'dismissed','resolved')),
    max_severity            TEXT NOT NULL DEFAULT 'medium'
                            CHECK (max_severity IN ('low','medium','high','critical')),
    flagged_comment_count   INTEGER NOT NULL DEFAULT 0
                            CHECK (flagged_comment_count >= 0),
    affected_post_count     INTEGER NOT NULL DEFAULT 0
                            CHECK (affected_post_count >= 0),
    summary                 TEXT,
    is_demo                 BOOLEAN NOT NULL DEFAULT TRUE,
    first_seen_at           TIMESTAMPTZ,
    last_seen_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_incident_scope UNIQUE (id, workspace_id, scan_id, connection_id),
    CONSTRAINT uq_incident_workspace UNIQUE (id, workspace_id),
    FOREIGN KEY (scan_id, workspace_id, connection_id)
        REFERENCES scans(id, workspace_id, connection_id) ON DELETE CASCADE,
    FOREIGN KEY (author_id, workspace_id, connection_id)
        REFERENCES social_authors(id, workspace_id, connection_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_incident_author_type_per_scan
    ON incidents(scan_id, author_id, incident_type)
    WHERE author_id IS NOT NULL;

-- 13. Evidence trail connecting an incident to the exact classified comments
CREATE TABLE IF NOT EXISTS incident_findings (
    incident_id         UUID NOT NULL,
    finding_id          UUID NOT NULL,
    workspace_id        UUID NOT NULL,
    scan_id             UUID NOT NULL,
    connection_id       UUID NOT NULL,
    added_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (incident_id, finding_id),
    FOREIGN KEY (incident_id, workspace_id, scan_id, connection_id)
        REFERENCES incidents(id, workspace_id, scan_id, connection_id)
        ON DELETE CASCADE,
    FOREIGN KEY (finding_id, workspace_id, scan_id, connection_id)
        REFERENCES scan_findings(id, workspace_id, scan_id, connection_id)
        ON DELETE CASCADE
);

-- 14. Audit events for login, OAuth, scan creation, decisions, and future actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    actor_user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type          TEXT NOT NULL,
    object_type         TEXT,
    object_id           UUID,
    metadata            JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (jsonb_typeof(metadata) = 'object')
);

-- ================= SECTION B: FUTURE-READY EXTENSIONS ======================
-- These tables are not needed for simulated scanning today. They are included
-- to avoid redesign when genuine AI/media, reports, moderation or billing arrive.
-- Do NOT populate them with invented evidence or submit demo cases externally.

-- 15. Actual permitted media attachments (image, GIF, video, audio)
CREATE TABLE IF NOT EXISTS comment_media (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL,
    comment_id          UUID NOT NULL,
    media_type          TEXT NOT NULL CHECK (media_type IN ('image','gif','video','audio','other')),
    source_url          TEXT,
    storage_key         TEXT,
    mime_type           TEXT,
    file_size_bytes     BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
    duration_seconds    NUMERIC(12,3) CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    sha256_hex          TEXT CHECK (sha256_hex IS NULL OR sha256_hex ~ '^[0-9a-fA-F]{64}$'),
    captured_at         TIMESTAMPTZ,
    retention_until     TIMESTAMPTZ,
    is_demo             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_media_workspace UNIQUE (id, workspace_id),
    FOREIGN KEY (comment_id, workspace_id)
        REFERENCES social_comments(id, workspace_id) ON DELETE CASCADE
);

-- 16. AI calls and token accounting; supports several model calls per comment
CREATE TABLE IF NOT EXISTS ai_model_runs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    scan_id             UUID,
    comment_id          UUID,
    agent_role          TEXT NOT NULL,       -- text, vision, incident, report, copilot...
    provider            TEXT NOT NULL,       -- e.g. openai, self_hosted
    model_name          TEXT NOT NULL,
    model_version       TEXT,
    prompt_version      TEXT,
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','running','succeeded','failed','skipped')),
    input_tokens        INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
    output_tokens       INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
    estimated_cost_usd  NUMERIC(14,6) CHECK (estimated_cost_usd IS NULL OR estimated_cost_usd >= 0),
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at         TIMESTAMPTZ,
    error_code          TEXT,
    metadata            JSONB NOT NULL DEFAULT '{}'::JSONB,
    FOREIGN KEY (scan_id, workspace_id)
        REFERENCES scans(id, workspace_id) ON DELETE NO ACTION,
    FOREIGN KEY (comment_id, workspace_id)
        REFERENCES social_comments(id, workspace_id) ON DELETE NO ACTION,
    CHECK (jsonb_typeof(metadata) = 'object')
);

-- 17. Human-controlled incident evidence cases
CREATE TABLE IF NOT EXISTS evidence_cases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    incident_id         UUID,
    created_by          UUID NOT NULL REFERENCES users(id),
    title               TEXT NOT NULL,
    summary             TEXT,
    status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','under_review','approved','closed')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_evidence_case_scope UNIQUE (id, workspace_id),
    FOREIGN KEY (incident_id, workspace_id)
        REFERENCES incidents(id, workspace_id) ON DELETE NO ACTION
);

-- 18. Provenance-aware evidence items; NOT automatically proof of wrongdoing
CREATE TABLE IF NOT EXISTS evidence_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL,
    case_id             UUID NOT NULL,
    comment_id          UUID,
    media_id            UUID,
    origin_type         TEXT NOT NULL CHECK (origin_type IN
                            ('platform_capture','user_upload','derived_render','ai_summary')),
    source_permalink    TEXT,
    text_snapshot       TEXT,
    storage_key         TEXT,
    sha256_hex          TEXT CHECK (sha256_hex IS NULL OR sha256_hex ~ '^[0-9a-fA-F]{64}$'),
    captured_at         TIMESTAMPTZ,
    retention_until     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (case_id, workspace_id)
        REFERENCES evidence_cases(id, workspace_id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id, workspace_id)
        REFERENCES social_comments(id, workspace_id) ON DELETE NO ACTION,
    FOREIGN KEY (media_id, workspace_id)
        REFERENCES comment_media(id, workspace_id) ON DELETE NO ACTION
);

-- 19. Editable report versions; only verified owner-approved reports may be submitted
CREATE TABLE IF NOT EXISTS report_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL,
    case_id             UUID NOT NULL,
    version_number      INTEGER NOT NULL CHECK (version_number > 0),
    report_body         TEXT,
    document_storage_key TEXT,
    document_sha256     TEXT CHECK (document_sha256 IS NULL OR document_sha256 ~ '^[0-9a-fA-F]{64}$'),
    status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','pending_review','approved','superseded')),
    created_by          UUID NOT NULL REFERENCES users(id),
    approved_by         UUID REFERENCES users(id),
    approved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_case_report_version UNIQUE (case_id, version_number),
    FOREIGN KEY (case_id, workspace_id)
        REFERENCES evidence_cases(id, workspace_id) ON DELETE CASCADE,
    CHECK ((approved_at IS NULL AND approved_by IS NULL)
            OR (approved_at IS NOT NULL AND approved_by IS NOT NULL))
);

-- 20. Future notification delivery (email / Telegram / WhatsApp)
CREATE TABLE IF NOT EXISTS notification_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    case_id             UUID,
    channel             TEXT NOT NULL CHECK (channel IN ('in_app','email','telegram','whatsapp')),
    event_type          TEXT NOT NULL,
    delivery_status     TEXT NOT NULL DEFAULT 'pending'
                        CHECK (delivery_status IN ('pending','sent','failed','cancelled')),
    provider_message_id TEXT,
    sent_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (case_id, workspace_id)
        REFERENCES evidence_cases(id, workspace_id) ON DELETE NO ACTION
);

-- 21. Future Meta moderation actions; human approval must be checked by backend
CREATE TABLE IF NOT EXISTS moderation_actions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL,
    connection_id       UUID NOT NULL,
    comment_id          UUID NOT NULL,
    action_type         TEXT NOT NULL CHECK (action_type IN ('hide','unhide','delete')),
    execution_status    TEXT NOT NULL DEFAULT 'proposed'
                        CHECK (execution_status IN ('proposed','approved','executing',
                                                    'succeeded','failed','cancelled')),
    proposed_by         UUID NOT NULL REFERENCES users(id),
    approved_by         UUID REFERENCES users(id),
    approved_at         TIMESTAMPTZ,
    provider_response   JSONB,
    executed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (connection_id, workspace_id)
        REFERENCES social_connections(id, workspace_id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id, workspace_id)
        REFERENCES social_comments(id, workspace_id) ON DELETE CASCADE,
    CHECK ((approved_by IS NULL AND approved_at IS NULL)
            OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);

-- 22. Metered usage. Stable source_key prevents duplicate charging on retries.
CREATE TABLE IF NOT EXISTS usage_ledger (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    scan_id             UUID,
    metric              TEXT NOT NULL CHECK (metric IN ('text_comment','image_analysis',
                                       'gif_analysis','video_analysis','report','other')),
    source_key          TEXT NOT NULL,
    units               INTEGER NOT NULL CHECK (units > 0),
    credits             INTEGER NOT NULL CHECK (credits >= 0),
    recorded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_usage_idempotency UNIQUE (workspace_id, metric, source_key),
    FOREIGN KEY (scan_id, workspace_id)
        REFERENCES scans(id, workspace_id) ON DELETE NO ACTION
);

-- =================== SECTION C: PERFORMANCE INDEXES =========================
CREATE INDEX IF NOT EXISTS idx_memberships_user
    ON workspace_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expiry
    ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_connections_workspace
    ON social_connections(workspace_id, provider, status);
CREATE INDEX IF NOT EXISTS idx_posts_connection_date
    ON social_posts(connection_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_authors_connection
    ON social_authors(connection_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_date
    ON social_comments(post_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_author_date
    ON social_comments(connection_id, author_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_workspace_date
    ON scans(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_connection_status
    ON scans(connection_id, status);
CREATE INDEX IF NOT EXISTS idx_scan_posts_post
    ON scan_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_findings_scan_filters
    ON scan_findings(scan_id, severity, primary_label, language_code);
CREATE INDEX IF NOT EXISTS idx_findings_review
    ON scan_findings(workspace_id, review_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_findings_comment
    ON scan_findings(comment_id);
CREATE INDEX IF NOT EXISTS idx_incidents_scan_status
    ON incidents(scan_id, status, max_severity);
CREATE INDEX IF NOT EXISTS idx_incidents_author
    ON incidents(connection_id, author_id);
CREATE INDEX IF NOT EXISTS idx_incident_findings_finding
    ON incident_findings(finding_id);
CREATE INDEX IF NOT EXISTS idx_audit_workspace_time
    ON audit_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_comment
    ON comment_media(comment_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_scan
    ON ai_model_runs(scan_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_cases_workspace
    ON evidence_cases(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_items_case
    ON evidence_items(case_id);
CREATE INDEX IF NOT EXISTS idx_reports_case
    ON report_versions(case_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_workspace
    ON notification_events(workspace_id, delivery_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_workspace_time
    ON usage_ledger(workspace_id, recorded_at DESC);

-- ================ SECTION D: UPDATED-AT TRIGGERS ===========================
CREATE OR REPLACE FUNCTION safesphere_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_touch ON users;
CREATE TRIGGER trg_users_touch BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION safesphere_touch_updated_at();

DROP TRIGGER IF EXISTS trg_workspaces_touch ON workspaces;
CREATE TRIGGER trg_workspaces_touch BEFORE UPDATE ON workspaces
FOR EACH ROW EXECUTE FUNCTION safesphere_touch_updated_at();

DROP TRIGGER IF EXISTS trg_connections_touch ON social_connections;
CREATE TRIGGER trg_connections_touch BEFORE UPDATE ON social_connections
FOR EACH ROW EXECUTE FUNCTION safesphere_touch_updated_at();

DROP TRIGGER IF EXISTS trg_scans_touch ON scans;
CREATE TRIGGER trg_scans_touch BEFORE UPDATE ON scans
FOR EACH ROW EXECUTE FUNCTION safesphere_touch_updated_at();

DROP TRIGGER IF EXISTS trg_findings_touch ON scan_findings;
CREATE TRIGGER trg_findings_touch BEFORE UPDATE ON scan_findings
FOR EACH ROW EXECUTE FUNCTION safesphere_touch_updated_at();

DROP TRIGGER IF EXISTS trg_incidents_touch ON incidents;
CREATE TRIGGER trg_incidents_touch BEFORE UPDATE ON incidents
FOR EACH ROW EXECUTE FUNCTION safesphere_touch_updated_at();

DROP TRIGGER IF EXISTS trg_cases_touch ON evidence_cases;
CREATE TRIGGER trg_cases_touch BEFORE UPDATE ON evidence_cases
FOR EACH ROW EXECUTE FUNCTION safesphere_touch_updated_at();

-- =================== SECTION E: READ-ONLY DEMO VIEWS =======================
-- Derive dashboard results from persisted fixture findings. For simulated scans,
-- estimated_comment_count is a SHOWCASE estimate, not actual ingested comments.
CREATE OR REPLACE VIEW v_scan_overview AS
SELECT
    s.id AS scan_id,
    s.workspace_id,
    s.connection_id,
    s.scan_mode,
    s.status,
    s.estimated_comment_count,
    s.processed_comment_count,
    s.started_at,
    COUNT(f.id) FILTER (
        WHERE f.primary_label NOT IN ('safe', 'uncertain')
          AND f.review_status <> 'dismissed'
    ) AS flagged_comments,
    COUNT(f.id) FILTER (
        WHERE f.severity = 'critical' AND f.review_status <> 'dismissed'
    ) AS critical_findings,
    COUNT(DISTINCT sp.post_id) AS selected_posts
FROM scans s
LEFT JOIN scan_posts sp ON sp.scan_id = s.id
LEFT JOIN scan_findings f ON f.scan_id = s.id
    AND f.post_id = sp.post_id
GROUP BY s.id;

-- Repeat accounts only when a stable permitted author ID (or explicit demo ID)
-- exists and >=3 different posts have non-dismissed, harmful findings.
CREATE OR REPLACE VIEW v_scan_repeat_accounts AS
SELECT
    f.scan_id,
    f.workspace_id,
    f.connection_id,
    a.id AS author_id,
    a.provider_author_id,
    a.username,
    a.display_name,
    COUNT(*)::BIGINT AS flagged_comments,
    COUNT(DISTINCT f.post_id)::BIGINT AS affected_posts,
    MAX(CASE f.severity
        WHEN 'critical' THEN 4 WHEN 'high' THEN 3
        WHEN 'medium' THEN 2 WHEN 'low' THEN 1 ELSE 0 END) AS severity_rank
FROM scan_findings f
JOIN social_comments c ON c.id = f.comment_id
JOIN social_authors a ON a.id = c.author_id
WHERE f.primary_label NOT IN ('safe','uncertain')
  AND f.review_status <> 'dismissed'
  AND a.provider_author_id IS NOT NULL
  AND a.identity_quality IN ('provider_id','demo')
  AND a.connection_id = f.connection_id
  AND a.workspace_id = f.workspace_id
GROUP BY f.scan_id, f.workspace_id, f.connection_id,
         a.id, a.provider_author_id, a.username, a.display_name
HAVING COUNT(DISTINCT f.post_id) >= 3;

COMMIT;

-- ======================= VERIFICATION (READ ONLY) ===========================
-- Expect: 22 tables and 2 views in the public schema on a fresh database.
SELECT
    (SELECT count(*) FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS public_tables,
    (SELECT count(*) FROM information_schema.views
     WHERE table_schema = 'public' AND table_name LIKE 'v_scan_%') AS safesphere_views;

-- END OF FILE
