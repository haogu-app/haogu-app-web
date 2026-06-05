'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { CareTask, RawLineSync, CareRecordRow, TaskRow } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { isCompleteRecord } from '@/lib/utils';

type ApiStatus = 'LOADING' | 'SUCCESS' | 'ERROR';

interface ApiErrorDetails {
  status?: number | string;
  message?: string;
  responseText?: string;
  scriptUrl?: string;
  callbackTriggered?: boolean;
  timeoutHappened?: boolean;
}

function rowToLineSync(row: CareRecordRow): RawLineSync {
  return {
    receivedAt: row.received_at,
    originalMessage: row.original_message,
    displayMessage: row.display_message,
    recordSummary: row.record_summary,
    replyMessage: row.reply_message ?? '',
    status: row.status ?? '',
    source: row.source ?? '',
    containsTag: row.contains_tag,
    groupId: row.group_id ?? '',
    userId: row.user_id ?? '',
    '收到時間': row.received_at,
    '原始訊息': row.display_message,
    'AI整理結果': row.record_summary,
    _dbId: row.id,
    _createdAt: row.created_at,
  };
}

function rowToCareTask(row: TaskRow): CareTask {
  return {
    id: row.id,
    time: row.time,
    title: row.title,
    type: row.type as CareTask['type'],
    completed: row.completed,
  };
}

export function useLineSync(familyId: string) {
  const [lineSyncs, setLineSyncsInternal] = useState<RawLineSync[]>([]);
  const [confirmedRecords, setConfirmedRecordsInternal] = useState<RawLineSync[]>([]);
  const [tasks, setTasksInternal] = useState<CareTask[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('LOADING');
  const [apiErrorDetails, setApiErrorDetails] = useState<ApiErrorDetails | null>(null);
  // One-way latch: flips to true after the first successful load and never reverts.
  // This prevents any flash where empty state is shown before data arrives.
  const [isDataReady, setIsDataReady] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [pendingRes, confirmedRes, tasksRes] = await Promise.all([
        supabase
          .from('care_records')
          .select('*')
          .eq('family_id', familyId)
          .eq('confirmed', false)
          .order('received_at', { ascending: false }),
        supabase
          .from('care_records')
          .select('*')
          .eq('family_id', familyId)
          .eq('confirmed', true)
          .order('received_at', { ascending: false }),
        supabase
          .from('tasks')
          .select('*')
          .eq('family_id', familyId)
          .order('time'),
      ]);

      if (pendingRes.error) throw pendingRes.error;
      if (confirmedRes.error) throw confirmedRes.error;
      if (tasksRes.error) throw tasksRes.error;

      const pending = pendingRes.data as CareRecordRow[];

      // Auto-confirm records that have subject + time + content (Make may write confirmed=false)
      const toAutoConfirm = pending.filter((row) =>
        isCompleteRecord(row.original_message || row.display_message || row.record_summary || ''),
      );

      if (toAutoConfirm.length > 0) {
        await supabase
          .from('care_records')
          .update({ confirmed: true })
          .in('id', toAutoConfirm.map((r) => r.id));
      }

      const autoIds = new Set(toAutoConfirm.map((r) => r.id));
      setLineSyncsInternal(pending.filter((r) => !autoIds.has(r.id)).map(rowToLineSync));
      setConfirmedRecordsInternal([
        ...toAutoConfirm.map(rowToLineSync),
        ...(confirmedRes.data as CareRecordRow[]).map(rowToLineSync),
      ]);
      setTasksInternal((tasksRes.data as TaskRow[]).map(rowToCareTask));
      setApiStatus('SUCCESS');
      setApiErrorDetails(null);
      setIsDataReady(true);
    } catch (err: unknown) {
      const e = err as Error;
      setApiStatus('ERROR');
      setApiErrorDetails({
        status: 'SUPABASE_ERROR',
        message: e?.message ?? String(err),
        responseText: 'Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
      });
    }
  }, [familyId]);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel(`haogu-data-${familyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'care_records', filter: `family_id=eq.${familyId}` },
        loadData,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `family_id=eq.${familyId}` },
        loadData,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  /** Mark a pending care_record as confirmed, optionally updating its summary fields */
  const confirmRecord = useCallback(async (dbId: string, summary?: string) => {
    setLineSyncsInternal((prev) => prev.filter((p) => p._dbId !== dbId));
    const patch: Record<string, unknown> = { confirmed: true, status: 'complete' };
    if (summary) {
      patch.original_message = summary;
      patch.display_message = summary;
      patch.record_summary = summary;
    }
    await supabase.from('care_records').update(patch).eq('id', dbId);
  }, []);

  /** Permanently delete a care_record */
  const deleteRecord = useCallback(async (dbId: string) => {
    setLineSyncsInternal((prev) => prev.filter((p) => p._dbId !== dbId));
    await supabase.from('care_records').delete().eq('id', dbId);
  }, []);

  // Wraps internal setter: detected deletions are persisted to Supabase
  const setLineSyncs: Dispatch<SetStateAction<RawLineSync[]>> = (action) => {
    setLineSyncsInternal((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      const deleted = prev.filter((p) => !next.some((n) => n._dbId === p._dbId));
      deleted.forEach((item) => {
        if (item._dbId) {
          supabase.from('care_records').delete().eq('id', item._dbId).then(() => {});
        }
      });
      return next;
    });
  };

  // Wraps internal setter: detected additions are persisted to Supabase
  const setTasks: Dispatch<SetStateAction<CareTask[]>> = (action) => {
    setTasksInternal((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      const added = next.filter((n) => !prev.some((p) => p.id === n.id));
      added.forEach((task) => {
        supabase
          .from('tasks')
          .insert({
            family_id: familyId,
            time: task.time,
            title: task.title,
            type: task.type,
            completed: task.completed,
          })
          .then(() => {});
      });
      return next;
    });
  };

  return {
    lineSyncs,
    setLineSyncs,
    confirmedRecords,
    setConfirmedRecords: setConfirmedRecordsInternal,
    tasks,
    setTasks,
    apiStatus,
    apiErrorDetails,
    isDataReady,
    confirmRecord,
    deleteRecord,
  };
}
