export type View = 'dashboard' | 'lineSync' | 'records' | 'tasks' | 'settings';

export interface CareTask {
  id: string;
  time: string;
  title: string;
  type: '用藥' | '飲食' | '血壓' | '其他';
  completed: boolean;
}

export interface FamilyTask {
  id: string;
  member: string;
  title: string;
  time: string;
  completed: boolean;
}

export interface RawLineSync {
  receivedAt: string;
  originalMessage: string;
  displayMessage: string;
  recordSummary: string;
  replyMessage?: string;
  status?: string;
  source?: string;
  containsTag?: boolean;
  groupId?: string;
  userId?: string;
  eventTime?: string | null;
  '收到時間': string;
  '原始訊息': string;
  'AI整理結果': string;
  /** Supabase care_records.id — used for DB delete operations */
  _dbId?: string;
  /** Supabase care_records.created_at — used to determine the most recently added record */
  _createdAt?: string;
  /** Client-side ISO timestamp set when this record is confirmed in the current session */
  _confirmedAt?: string;
}

// ─── Supabase row types ───────────────────────────────────────────────────────

export interface CareRecordRow {
  id: string;
  family_id: string;
  received_at: string;
  original_message: string;
  display_message: string;
  record_summary: string;
  reply_message: string | null;
  status: string | null;
  source: string | null;
  contains_tag: boolean;
  group_id: string | null;
  user_id: string | null;
  confirmed: boolean;
  created_at: string;
  event_time: string | null;
}

export interface TaskRow {
  id: string;
  family_id: string;
  care_record_id: string | null;
  time: string;
  title: string;
  type: string;
  completed: boolean;
  created_at: string;
}
