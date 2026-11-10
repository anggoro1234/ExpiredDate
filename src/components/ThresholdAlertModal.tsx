import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { calculateExpiration } from '../logic/expiration';
import { CountdownBadge } from './CountdownBadge';
import { AlertTriangle, ArrowRight, X, ShieldAlert, Package, Clock, MapPin } from 'lucide-react';

export const ThresholdAlertModal: React.FC = () => {
  const {
    isAlertModalOpen,
    setIsAlertModalOpen,
    thresholdBatches,
    setActivePage,
    referenceTime,
    setHighlightedBatchId,
  } = useInventory();

  if (!isAlertModalOpen || thresholdBatches.length === 0) {
    return null;
  }

  const totalUnits = thresholdBatches.reduce((sum, b) => sum + b.currentQuantity, 0);

  const handleProceedToPage2 = (targetBatchId?: string) => {
    setIsAlertModalOpen(false);
    if (targetBatchId) {
      setHighlightedBatchId(targetBatchId);
    }
    setActivePage('page2_clearance');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border-2 border-emerald-500/80 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 px-5 sm:px-6 py-4 text-white flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black/25 rounded-xl border border-white/20 shrink-0">
              <ShieldAlert className="w-6 h-6 text-emerald-200 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-950/70 text-emerald-200 border border-emerald-400/40">
                  Notifikasi Ambang Batas 1 Bulan
                </span>
                <span className="text-xs text-emerald-100 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" /> Live Expiry Ticker
                </span>
              </div>
              <h2 id="alert-modal-title" className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
                Peringatan: {thresholdBatches.length} Batch Memasuki Ambang Kedaluwarsa (≤30 Hari)
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Batch berikut membutuhkan tinjauan operasional: rotasi ke rak depan (FIFO) atau persiapan karantina.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAlertModalOpen(false)}
            aria-label="Tutup Peringatan Ambang Batas 1 Bulan"
            className="p-1.5 text-white/80 hover:text-white hover:bg-black/20 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operational Overview Bar */}
        <div className="grid grid-cols-2 gap-3 px-5 sm:px-6 py-3 bg-slate-950 border-b border-slate-800 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[11px]">Total Batch Perhatian</span>
              <span className="font-bold text-white text-sm">{thresholdBatches.length} Nomor Lot</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[11px]">Total Unit Fisik</span>
              <span className="font-bold text-emerald-300 text-sm">{totalUnits} Unit Barang</span>
            </div>
          </div>
        </div>

        {/* Scrollable Batches List */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-3 min-h-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Daftar Batch Mendekati Kedaluwarsa (Urutan FIFO)</span>
            <span className="text-emerald-400 font-mono text-[11px]">Prioritas Pengeluaran Pertama</span>
          </div>

          <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            {thresholdBatches.map(batch => {
              const exp = calculateExpiration(batch.expirationDate, referenceTime);
              return (
                <div
                  key={batch.id}
                  className="p-3.5 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-emerald-300 border border-emerald-800/60">
                        {batch.batchNumber}
                      </span>
                      <span className="text-[11px] text-slate-300 px-1.5 py-0.2 bg-slate-800 rounded">
                        {batch.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        SKU: {batch.sku}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-white truncate">
                      {batch.productName}
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Masuk: <strong className="text-slate-300">{batch.receivedDate}</strong></span>
                      <span>Kedaluwarsa: <strong className="text-emerald-300">{new Date(batch.expirationDate).toLocaleDateString('id-ID')}</strong></span>
                      <span>Stok: <strong className="text-white">{batch.currentQuantity}</strong> {batch.unit}</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{batch.location}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end">
                    <CountdownBadge expirationDate={batch.expirationDate} referenceTime={referenceTime} />
                    <button
                      type="button"
                      onClick={() => handleProceedToPage2(batch.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
                    >
                      <span>Tindak di P2</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            Buka Halaman 2 untuk merotasi posisi ke rak depan atau mencetak label lot operasional.
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsAlertModalOpen(false)}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
            >
              Tutup Sementara
            </button>
            <button
              type="button"
              onClick={() => handleProceedToPage2()}
              aria-label="Transisi semua item peringatan ke Halaman 2 Antrean Rotasi"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <span>Buka Halaman 2: Tindakan & Rotasi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
