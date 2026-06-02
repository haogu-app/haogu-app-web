-- 好顧 App — Add care_target_name for MVP single care target
ALTER TABLE families ADD COLUMN IF NOT EXISTS care_target_name TEXT DEFAULT NULL;
