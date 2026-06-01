-- 好顧 App — Seed Data
-- Development seed: Wang family (王家照顧群)
-- NEXT_PUBLIC_FAMILY_ID should match the ID below

INSERT INTO families (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', '王家照顧群')
ON CONFLICT (id) DO NOTHING;

INSERT INTO family_members (family_id, name, role, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', '大女兒', '主要照顧者', '線上'),
  ('00000000-0000-0000-0000-000000000001', '二兒子', '家屬',     '已讀'),
  ('00000000-0000-0000-0000-000000000001', '媽媽',   '眷屬',     '未加入'),
  ('00000000-0000-0000-0000-000000000001', '姑姑',   '家屬',     '已讀');

INSERT INTO elderly_profiles (family_id, name)
VALUES ('00000000-0000-0000-0000-000000000001', '王阿嬤')
ON CONFLICT DO NOTHING;

-- 3 筆待確認 LINE 同步記錄（confirmed = false → 顯示在 LineSyncView）
INSERT INTO care_records (id, family_id, received_at, original_message, display_message, record_summary, source, contains_tag, confirmed)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '2 hours',
    '阿嬤今天早上 8 點吃了血壓藥，血壓量測 138/85 #好顧',
    '阿嬤今天早上 8 點吃了血壓藥，血壓量測 138/85',
    '用藥記錄：早上 08:00 服用血壓藥，血壓 138/85',
    'line',
    TRUE,
    FALSE
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '1 hour',
    '下午要帶阿嬤去回診，預約時間 14:30 新光醫院心臟科 #好顧',
    '下午要帶阿嬤去回診，預約時間 14:30 新光醫院心臟科',
    '回診提醒：14:30 新光醫院心臟科',
    'line',
    TRUE,
    FALSE
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '30 minutes',
    '阿嬤中午吃了半碗稀飯配醬菜，食慾比昨天好一些 #好顧',
    '阿嬤中午吃了半碗稀飯配醬菜，食慾比昨天好一些',
    '飲食記錄：午餐半碗稀飯，食慾良好',
    'line',
    TRUE,
    FALSE
  )
ON CONFLICT (id) DO NOTHING;

-- 2 筆已確認任務（顯示在 DashboardView / TasksView）
INSERT INTO tasks (id, family_id, time, title, type, completed)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '08:00',
    '早上服用降血壓藥 Amlodipine 5mg',
    '用藥',
    TRUE
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '14:30',
    '回診新光醫院心臟科，攜帶健保卡與藥袋',
    '回診',
    FALSE
  )
ON CONFLICT (id) DO NOTHING;
