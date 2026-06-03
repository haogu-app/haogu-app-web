'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { XCircle } from 'lucide-react';
import { NavBar } from '@/components/NavBar';
import { QuickRecordModal } from '@/components/QuickRecordModal';
import { DashboardView } from '@/components/views/DashboardView';
import { LineSyncView } from '@/components/views/LineSyncView';
import { RecordsView } from '@/components/views/RecordsView';
import { TasksView } from '@/components/views/TasksView';
import { SettingsView } from '@/components/views/SettingsView';
import { useLineSync } from '@/hooks/useLineSync';
import type { CareTask, RawLineSync, View } from '@/lib/types';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
  const [isLineSyncOpen, setIsLineSyncOpen] = useState(false);

  // Auto-close sheet when all pending records are gone (e.g. after confirming the last one)
  useEffect(() => {
    if (isLineSyncOpen && lineSyncs.length === 0) {
      setIsLineSyncOpen(false);
    }
  }, [isLineSyncOpen, lineSyncs.length]);

  const {
    lineSyncs,
    setLineSyncs,
    confirmedRecords,
    setConfirmedRecords,
    tasks,
    setTasks,
    apiStatus,
    apiErrorDetails,
    confirmRecord,
    deleteRecord,
  } = useLineSync();

  const handleRecordDeleted = (dbId: string) => {
    setConfirmedRecords((prev) => prev.filter((r) => r._dbId !== dbId));
  };

  const handleRecordSaved = (dbId: string, summary: string) => {
    setConfirmedRecords((prev) =>
      prev.map((r) =>
        r._dbId === dbId
          ? { ...r, recordSummary: summary, displayMessage: summary, originalMessage: summary }
          : r,
      ),
    );
  };

  const addTask = (t: Omit<CareTask, 'id'>) => {
    const newTask: CareTask = { ...t, id: Date.now().toString() };
    setTasks((prev) => [...prev, newTask].sort((a, b) => a.time.localeCompare(b.time)));
  };

  const confirmLineSync = (idx: number, summary: string) => {
    const item = lineSyncs[idx];
    if (!item?._dbId) return;
    const updatedItem: RawLineSync = {
      ...item,
      recordSummary: summary,
      displayMessage: summary,
      originalMessage: summary,
    };
    setConfirmedRecords((prev) => [updatedItem, ...prev]);
    confirmRecord(item._dbId, summary);
  };

  const deleteLineSync = (idx: number) => {
    const item = lineSyncs[idx];
    if (!item?._dbId) return;
    deleteRecord(item._dbId);
  };

  const renderContent = () => {
    if (apiStatus === 'ERROR') {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white min-h-[400px] m-6 rounded-3xl border border-red-100 shadow-sm">
          <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
            <XCircle size={36} />
          </div>
          <h3 className="font-bold text-slate-700 text-lg">資料讀取失敗</h3>
          <p className="text-xs text-slate-400 mt-2">請確認您的網路連線或 Apps Script 位置是否有效</p>
        </div>
      );
    }

    switch (view) {
      case 'dashboard':
        return <DashboardView setView={setView} lineSyncs={lineSyncs} confirmedRecords={confirmedRecords} onQuickRecord={() => setIsQuickRecordOpen(true)} onRecordDeleted={handleRecordDeleted} onRecordSaved={handleRecordSaved} careTargetName="阿嬤" isLoading={apiStatus === 'LOADING'} onOpenLineSync={() => setIsLineSyncOpen(true)} />;
      case 'lineSync':
        return (
          <LineSyncView
            onBack={() => setView('dashboard')}
            lineSyncs={lineSyncs}
            onConfirm={confirmLineSync}
            onDelete={deleteLineSync}
          />
        );
      case 'records':
        return <RecordsView records={confirmedRecords} />;
      case 'tasks':
        return <TasksView lineSyncs={lineSyncs} />;
      case 'settings':
        return <SettingsView />;
    }
  };

  return (
    <div className="relative min-h-screen bg-neutral-50 w-full max-w-[480px] mx-auto overflow-hidden shadow-2xl flex flex-col">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <NavBar currentView={view} setView={setView} onQuickRecord={() => setIsQuickRecordOpen(true)} />

      <AnimatePresence>
        {isQuickRecordOpen && (
          <QuickRecordModal
            isOpen={isQuickRecordOpen}
            onClose={() => setIsQuickRecordOpen(false)}
            onSubmit={addTask}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLineSyncOpen && (
          <div className="fixed inset-0 z-[80] flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/30"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-[480px] mx-auto bg-neutral-50 rounded-t-3xl overflow-y-auto"
              style={{ maxHeight: '92dvh' }}
            >
              <LineSyncView
                onBack={() => setIsLineSyncOpen(false)}
                lineSyncs={lineSyncs}
                onConfirm={confirmLineSync}
                onDelete={deleteLineSync}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 to-transparent pointer-events-none -z-10"></div>
    </div>
  );
}
