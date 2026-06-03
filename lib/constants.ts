export const FAMILY_MEMBERS = [
  { name: '大女兒', role: '主要照顧者', status: '線上', lastSeen: '剛剛' },
  { name: '二兒子', role: '家屬', status: '已讀', lastSeen: '1小時前' },
  { name: '媽媽', role: '眷屬', status: '未加入', lastSeen: '-' },
  { name: '姑姑', role: '家屬', status: '已讀', lastSeen: '3小時前' },
];

/** Default family — matches supabase/seed.sql and NEXT_PUBLIC_FAMILY_ID. */
export const FAMILY_ID =
  process.env.NEXT_PUBLIC_FAMILY_ID ?? '00000000-0000-0000-0000-000000000001';

/** URL ?family= slug → fixed UUID mapping for multi-tester isolation. */
export const FAMILY_MAP: Record<string, string> = {
  'test-a': '00000000-0000-0000-0000-0000000000a1',
  'test-b': '00000000-0000-0000-0000-0000000000b1',
  'test-c': '00000000-0000-0000-0000-0000000000c1',
};

/** LINE Official Account link — update here when OA changes. */
export const LINE_OA_URL = 'https://lin.ee/ZQwOK4e';
