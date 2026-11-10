import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import amanmartLogo from '../assets/amanmart-logo.png';
import {
  Layers,
  CalendarDays,
  Clock,
  RotateCcw,
  FastForward,
  Building2,
  ShieldAlert,
  PlusCircle,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activePage,
    setActivePage,
    referenceTime,
    simulatedDaysOffset,
    setSimulatedDaysOffset,
    resetSimulatedTime,
    setIsReceivingModalOpen,
    resetToSeedData,
    thresholdBatches,
    setIsAlertModalOpen,
    batches,
  } = useInventory();

  const [logoSrc, setLogoSrc] = useState<string>(amanmartLogo);
  const [logoError, setLogoError] = useState<boolean>(false);

  const handleLogoError = () => {
    if (logoSrc !== '/amanmart-logo.png') {
      setLogoSrc('/amanmart-logo.png');
    } else {
      setLogoError(true);
    }
  };

  const handleSimulateFastForward = (days: number) => {
    setSimulatedDaysOffset(prev => prev + days);
  };

  const formattedDate = referenceTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = referenceTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-emerald-900/50 shadow-lg">
      {/* Top Operational Ribbon */}
      <div className="bg-slate-950 px-3 sm:px-6 py-2 border-b border-emerald-950 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Operasional Retail • Toko #104</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">•</span>
          {/* Live Date and Time updating every day/second */}
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-200 font-medium">
            <CalendarDays className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{formattedDate}</span>
            <span className="text-emerald-500">•</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono font-bold text-white tracking-wider">{formattedTime}</span>
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          {simulatedDaysOffset > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60 text-[11px] font-bold">
              +{simulatedDaysOffset} Hari Simulasi
            </span>
          )}
        </div>

        {/* Date Fast-Forward / Time Travel Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-slate-400 text-[11px] hidden md:inline flex items-center gap-1">
            <FastForward className="w-3 h-3 text-emerald-400" /> Uji Waktu Kedaluwarsa:
          </span>
          <button
            type="button"
            onClick={() => handleSimulateFastForward(7)}
            aria-label="Majukan tanggal simulasi 7 hari"
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-emerald-900/40 text-slate-200 border border-slate-700 hover:border-emerald-700 transition-colors text-[11px]"
          >
            +7 Hari
          </button>
          <button
            type="button"
            onClick={() => handleSimulateFastForward(15)}
            aria-label="Majukan tanggal simulasi 15 hari"
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-emerald-900/40 text-slate-200 border border-slate-700 hover:border-emerald-700 transition-colors text-[11px]"
          >
            +15 Hari
          </button>
          <button
            type="button"
            onClick={() => handleSimulateFastForward(30)}
            aria-label="Majukan tanggal simulasi 30 hari"
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-emerald-900/40 text-slate-200 border border-slate-700 hover:border-emerald-700 transition-colors text-[11px]"
          >
            +30 Hari
          </button>
          {simulatedDaysOffset !== 0 && (
            <button
              type="button"
              onClick={resetSimulatedTime}
              aria-label="Reset tanggal ke waktu live saat ini"
              className="px-2 py-1 rounded-md bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors text-[11px]"
            >
              Reset Hari
            </button>
          )}
          <span className="text-slate-700 mx-1">|</span>
          <button
            type="button"
            onClick={resetToSeedData}
            title="Reset ke data awal"
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Theme */}
        <div className="flex items-center gap-3">
          {!logoError ? (
            <div className="bg-white px-3 py-1.5 rounded-xl shadow-md shadow-emerald-950/50 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <img
                src={logoSrc}
                alt="Amanmart - Halal Terjangkau"
                onError={handleLogoError}
                className="h-8 sm:h-9 w-auto object-contain select-none"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-600/25 shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                Amanmart
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                ED TRACKER
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Sistem Tracking Kedaluwarsa & Manajemen Batch Lot
            </p>
          </div>
        </div>

        {/* Page Switcher Tabs */}
        <nav aria-label="Navigasi Utama" className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActivePage('page1_master')}
            aria-current={activePage === 'page1_master' ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activePage === 'page1_master'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Halaman 1: Master Stok</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-emerald-300 border border-slate-700">
              {batches.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('page2_clearance')}
            aria-current={activePage === 'page2_clearance' ? 'page' : undefined}
            className={`relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activePage === 'page2_clearance'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Halaman 2: Tindakan & Rotasi</span>
            {thresholdBatches.length > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                {thresholdBatches.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActivePage('analytics')}
            aria-current={activePage === 'analytics' ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activePage === 'analytics'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>Ringkasan Rotasi FIFO</span>
          </button>
        </nav>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {thresholdBatches.length > 0 && activePage === 'page1_master' && (
            <button
              type="button"
              onClick={() => setIsAlertModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 transition-colors shadow-sm"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">Peringatan 1 Bulan</span> ({thresholdBatches.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsReceivingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Terima Batch Masuk</span>
          </button>
        </div>
      </div>
    </header>
  );
};
