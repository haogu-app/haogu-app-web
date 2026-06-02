'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FAMILY_ID } from '@/lib/constants';

/**
 * undefined = still loading
 * null      = not set yet → show setup screen
 * string    = set
 */
export function useCareTarget() {
  const [careTargetName, setCareTargetNameState] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    supabase
      .from('families')
      .select('care_target_name')
      .eq('id', FAMILY_ID)
      .single()
      .then(({ data }) => {
        setCareTargetNameState((data as { care_target_name: string | null } | null)?.care_target_name ?? null);
      });
  }, []);

  const updateCareTargetName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await supabase.from('families').update({ care_target_name: trimmed }).eq('id', FAMILY_ID);
    setCareTargetNameState(trimmed);
  };

  return { careTargetName, updateCareTargetName };
}
