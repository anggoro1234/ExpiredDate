/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Header } from './components/Header';
import { PageMasterInventory } from './components/PageMasterInventory';
import { PageClearanceReview } from './components/PageClearanceReview';
import { PageAnalytics } from './components/PageAnalytics';
import { ThresholdAlertModal } from './components/ThresholdAlertModal';
import { ReceiveBatchModal } from './components/ReceiveBatchModal';
import { ShelfTagPrintModal } from './components/ShelfTagPrintModal';

const AppContent: React.FC = () => {
  const { activePage, selectedBatchForPrint, setSelectedBatchForPrint, referenceTime } = useInventory();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Application Header */}
      <Header />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activePage === 'page1_master' && <PageMasterInventory />}
        {activePage === 'page2_clearance' && <PageClearanceReview />}
        {activePage === 'analytics' && <PageAnalytics />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500">
        FreshPulse Retail Inventory & Real-Time Expiration Tracking System • Dynamic Countdown Engine & 30-Day Alert Protocol
      </footer>

      {/* Global Interactive Modals */}
      <ThresholdAlertModal />
      <ReceiveBatchModal />
      <ShelfTagPrintModal
        batch={selectedBatchForPrint}
        onClose={() => setSelectedBatchForPrint(null)}
        referenceTime={referenceTime}
      />
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}
