-- 好顧 App — Initial Schema
-- Phase 2: Replace Google Apps Script JSONP with Supabase data layer

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE families (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE family_members (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  role         TEXT        NOT NULL DEFAULT '家屬',
  status       TEXT        NOT NULL DEFAULT '未加入',
  last_seen_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE elderly_profiles (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name      TEXT        NOT NULL,
  notes     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incoming LINE messages / manual entries pending user confirmation
CREATE TABLE care_records (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  received_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  original_message TEXT        NOT NULL DEFAULT '',
  display_message  TEXT        NOT NULL DEFAULT '',
  record_summary   TEXT        NOT NULL DEFAULT '',
  reply_message    TEXT                 DEFAULT '',
  status           TEXT                 DEFAULT '',
  source           TEXT                 DEFAULT 'line',
  contains_tag     BOOLEAN     NOT NULL DEFAULT TRUE,
  group_id         TEXT                 DEFAULT '',
  user_id          TEXT                 DEFAULT '',
  confirmed        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Confirmed care events (from confirmed care_records or manual quick-record)
CREATE TABLE tasks (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  care_record_id UUID                 REFERENCES care_records(id) ON DELETE SET NULL,
  time           TEXT        NOT NULL,
  title          TEXT        NOT NULL,
  type           TEXT        NOT NULL CHECK (type IN ('用藥', '回診', '血壓', '飲食')),
  completed      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_care_records_family_confirmed ON care_records(family_id, confirmed);
CREATE INDEX idx_tasks_family_time             ON tasks(family_id, time);
CREATE INDEX idx_family_members_family         ON family_members(family_id);

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Enable realtime for the tables the client subscribes to

ALTER PUBLICATION supabase_realtime ADD TABLE care_records;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
