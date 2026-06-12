-- 好顧 App — Add event_time for explicit care event time
ALTER TABLE care_records ADD COLUMN IF NOT EXISTS event_time TEXT DEFAULT NULL;
