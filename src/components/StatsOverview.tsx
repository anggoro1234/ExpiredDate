import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { Package, ShieldCheck, AlertTriangle, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export const StatsOverview: React.FC = () => {
  const { stats, setActivePage, setIsAlertModalOpen } = useInventory();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5 mb-6">
      {/* Total Active Batches */}
      <div className="p-3 sm:p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-medium">Total Batch Aktif</span>
          <Package className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-white tracking-tight">{stats.totalActiveBatches}</span>
          <span className="text-xs text-slate-400">Lot</span>
        </div>
        <span className="text-[11px] text-slate-500 block mt-0.5">Tercatat di gudang & rak</span>
      </div>

      {/* Total Units */}
      <div className="p-3 sm:p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-medium">Total Unit Fisik</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-emerald-300 tracking-tight">{stats.totalUnits}</span>
          <span className="text-xs text-slate-400">Unit</span>
        </div>
        <span className="text-[11px] text-slate-500 block mt-0.5">Jumlah kuantitas item</span>
      </div>

      {/* Safe Batches */}
      <div className="p-3 sm:p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl shadow-sm hover:border-emerald-700 transition-colors">
        <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
          <span className="font-semibold">Aman / Fresh</span>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">{stats.safeBatchesCount}</span>
          <span className="text-xs text-emerald-400/80">Lot</span>
        </div>
        <span className="text-[11px] text-emerald-400/70 block mt-0.5">&gt; 30 hari masa simpan</span>
      </div>

      {/* 1-Month Threshold Alert */}
      <div
        onClick={() => setIsAlertModalOpen(true)}
        className="p-3 sm:p-3.5 bg-amber-950/25 border border-amber-600/50 rounded-xl shadow-sm cursor-pointer hover:bg-amber-950/45 transition-colors group"
      >
        <div className="flex items-center justify-between text-amber-300 text-xs mb-1">
          <span className="font-semibold">≤30 Hari Ambang</span>
          <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-amber-200 tracking-tight">{stats.thresholdBatchesCount}</span>
          <span className="text-xs text-amber-300/80">Lot</span>
        </div>
        <span className="text-[11px] text-amber-400 block mt-0.5 underline decoration-amber-400/40">
          Klik buka modal popup
        </span>
      </div>

      {/* Critical Expiry (<=7 Days) */}
      <div
        onClick={() => setActivePage('page2_clearance')}
        className="p-3 sm:p-3.5 bg-red-950/30 border border-red-600/60 rounded-xl shadow-sm cursor-pointer hover:bg-red-950/50 transition-colors group"
      >
        <div className="flex items-center justify-between text-red-300 text-xs mb-1">
          <span className="font-semibold">Kritis (≤7 Hari)</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-red-200 tracking-tight">{stats.criticalBatchesCount}</span>
          <span className="text-xs text-red-300/80">Lot</span>
        </div>
        <span className="text-[11px] text-red-300/80 block mt-0.5">Prioritas tindakan cepat</span>
      </div>

      {/* Expired Batches */}
      <div
        onClick={() => setActivePage('page2_clearance')}
        className="p-3 sm:p-3.5 bg-rose-950/30 border border-rose-800/60 rounded-xl shadow-sm cursor-pointer hover:bg-rose-950/50 transition-colors"
      >
        <div className="flex items-center justify-between text-rose-400 text-xs mb-1">
          <span className="font-semibold">Kedaluwarsa</span>
          <AlertCircle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-rose-300 tracking-tight">{stats.expiredBatchesCount}</span>
          <span className="text-xs text-rose-400/80">Lot</span>
        </div>
        <span className="text-[11px] text-rose-400/80 block mt-0.5">Tarik dari rak display</span>
      </div>
    </div>
  );
};
