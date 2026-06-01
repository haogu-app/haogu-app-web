export const FAMILY_MEMBERS = [
  { name: '大女兒', role: '主要照顧者', status: '線上', lastSeen: '剛剛' },
  { name: '二兒子', role: '家屬', status: '已讀', lastSeen: '1小時前' },
  { name: '媽媽', role: '眷屬', status: '未加入', lastSeen: '-' },
  { name: '姑姑', role: '家屬', status: '已讀', lastSeen: '3小時前' },
];

/** Hardcoded until auth is implemented (Phase 3). Must match supabase/seed.sql. */
export const FAMILY_ID =
  process.env.NEXT_PUBLIC_FAMILY_ID ?? '00000000-0000-0000-0000-000000000001';
