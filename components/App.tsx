'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { XCircle } from 'lucide-react';
import { NavBar } from '@/components/NavBar';
import { DebugPanel } from '@/components/DebugPanel';
import { QuickRecordModal } from '@/components/QuickRecordModal';
import { DashboardView } from '@/components/views/DashboardView';
import { LineSyncView } from '@/components/views/LineSyncView';
import { RecordsView } from '@/components/views/RecordsView';
import { TasksView } from '@/components/views/TasksView';
import { SettingsView } from '@/components/views/SettingsView';
import { useLineSync } from '@/hooks/useLineSync';
import { formatTime, getRecordSummary } from '@/lib/utils';
import type { CareTask, View } from '@/lib/types';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [showDebug, setShowDebug] = useState(false);
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);

  const {
    lineSyncs,
    setLineSyncs,
    confirmedRecords,
    tasks,
    setTasks,
    apiStatus,
    apiErrorDetails,
    confirmRecord,
    deleteRecord,
  } = useLineSync();

  const addTask = (t: Omit<CareTask, 'id'>) => {
    const newTask: CareTask = { ...t, id: Date.now().toString() };
    setTasks((prev) => [...prev, newTask].sort((a, b) => a.time.localeCompare(b.time)));
  };

  const confirmLineSync = (idx: number) => {
    const item = lineSyncs[idx];
    if (!item?._dbId) return;
    confirmRecord(item._dbId);
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
        return <DashboardView setView={setView} tasks={tasks} lineSyncs={lineSyncs} confirmedRecords={confirmedRecords} />;
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
        return <SettingsView showDebug={showDebug} setShowDebug={setShowDebug} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-neutral-50 max-w-md mx-auto overflow-hidden shadow-2xl flex flex-col">
      {showDebug && (
        <DebugPanel apiStatus={apiStatus} apiErrorDetails={apiErrorDetails} lineSyncs={lineSyncs} />
      )}

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

      <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 to-transparent pointer-events-none -z-10"></div>
    </div>
  );
}
