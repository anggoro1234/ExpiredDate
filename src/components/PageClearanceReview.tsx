import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { calculateExpiration, getOperationalRecommendation } from '../logic/expiration';
import { CountdownBadge } from './CountdownBadge';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Trash2,
  RotateCcw,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowRight,
  MoveRight,
  Layers,
  AlertTriangle,
  Boxes,
} from 'lucide-react';

export const PageClearanceReview: React.FC = () => {
  const {
    batches,
    referenceTime,
    setActivePage,
    applyDisposition,
    setSelectedBatchForPrint,
    highlightedBatchId,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'all_review' | 'critical' | 'expired'>('all_review');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter batches for clearance review: items <= 30 days or expired
  const reviewBatches = batches.filter(b => {
    if (b.status === 'disposed' || b.status === 'returned') return false;
    const exp = calculateExpiration(b.expirationDate, referenceTime);
    if (activeTab === 'critical') return exp.isCritical;
    if (activeTab === 'expired') return exp.isExpired;
    return exp.isWithin30Days || exp.isExpired;
  }).sort((a, b) => {
    // FIFO: earliest expiration first
    return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
  });

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleRelocateFront = async (batchId: string) => {
    await applyDisposition(batchId, 'relocated_front', 'Dipindahkan ke rak depan kasir untuk prioritas pengeluaran FIFO', 'Rak Depan Kasir / Endcap Display');
    showToast('Batch berhasil dipindahkan ke Rak Depan Kasir!');
  };

  const handleRelocateClearance = async (batchId: string) => {
    await applyDisposition(batchId, 'relocated_clearance', 'Dipindahkan ke rak khusus rotasi stok terbatas', 'Rak Rotasi Cepat Bay 1');
    showToast('Batch dipindahkan ke Rak Rotasi Cepat!');
  };

  const handleQuarantine = async (batchId: string) => {
    await applyDisposition(batchId, 'quarantined', 'Ditarik dari display publik dan dipindahkan ke karantina', 'Gudang Karantina');
    showToast('Batch berhasil ditarik & dikarantina.');
  };

  const handleWriteOff = async (batchId: string) => {
    await applyDisposition(batchId, 'written_off', 'Pemusnahan stok yang telah kedaluwarsa');
    showToast('Batch berhasil dimusnahkan (Write-off).');
  };

  const handleVendorReturn = async (batchId: string) => {
    await applyDisposition(batchId, 'vendor_returned', 'Retur barang kedaluwarsa ke supplier');
    showToast('Retur ke supplier berhasil diproses.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Page Header with Back to Page 1 CTA */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-600/40 rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActivePage('page1_master')}
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Halaman 1: Master Stok
            </button>
            <span className="text-slate-600">•</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Antrean Tindakan Operasional
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Halaman 2: Disposisi & Tindakan Rotasi Kedaluwarsa
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Tinjau lot barang yang memasuki batas simpan ≤30 hari atau status kritis. Lakukan tindakan operasional lapangan: relokasi rak depan, rotasi cepat, karantina, cetak stiker, atau retur supplier.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all_review')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center ${
              activeTab === 'all_review'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua (≤30H) ({reviewBatches.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('critical')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center ${
              activeTab === 'critical'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kritis (≤7H)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expired')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center ${
              activeTab === 'expired'
                ? 'bg-rose-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kedaluwarsa
          </button>
        </div>
      </div>

      {/* Review Cards List */}
      {reviewBatches.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Tidak Ada Lot di Antrean Ini</h3>
          <p className="text-xs max-w-md mx-auto">
            Semua lot barang memiliki sisa masa simpan aman di atas 30 hari, atau tindakan operasional sudah selesai diproses.
          </p>
          <button
            type="button"
            onClick={() => setActivePage('page1_master')}
            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
          >
            Kembali ke Master Stok (Halaman 1)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reviewBatches.map(batch => {
            const exp = calculateExpiration(batch.expirationDate, referenceTime);
            const recommendation = getOperationalRecommendation(exp.daysRemaining);
            const isHighlighted = highlightedBatchId === batch.id;

            return (
              <div
                key={batch.id}
                className={`p-4 sm:p-5 bg-slate-900 rounded-2xl border transition-all ${
                  isHighlighted
                    ? 'border-2 border-emerald-400 shadow-xl shadow-emerald-500/10'
                    : exp.isExpired
                    ? 'border-rose-800/80 bg-rose-950/20'
                    : exp.isCritical
                    ? 'border-amber-600/60 bg-amber-950/20'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Product & Lot Metadata */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-950 text-emerald-300 border border-emerald-900/60">
                        {batch.batchNumber}
                      </span>
                      <span className="text-xs text-slate-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {batch.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        SKU: {batch.sku}
                      </span>
                      {batch.status === 'relocated' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          Telah Direlokasi
                        </span>
                      )}
                      {batch.status === 'quarantined' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Terkarantina
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {batch.productName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                        <span>Penerimaan: <strong className="text-slate-300">{batch.receivedDate}</strong></span>
                        <span>Kedaluwarsa: <strong className="text-slate-200">{new Date(batch.expirationDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
                        <span>Stok Tersedia: <strong className="text-emerald-400 font-semibold">{batch.currentQuantity} {batch.unit}</strong></span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{batch.location}</span>
                        </span>
                      </div>
                    </div>

                    {/* Live Dynamic Countdown */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-slate-400 font-medium">Hitung Mundur:</span>
                      <CountdownBadge expirationDate={batch.expirationDate} referenceTime={referenceTime} />
                    </div>
                  </div>

                  {/* Operational Recommendation Box */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between shrink-0 lg:max-w-xs xl:max-w-sm">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Rekomendasi Operasional:</span>
                    </div>

                    <div className="my-1">
                      <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold border ${recommendation.badgeColor}`}>
                        {recommendation.urgencyTier}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-2 border-t border-slate-800/80 pt-2 leading-relaxed">
                      {recommendation.recommendedAction}
                    </p>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 justify-center">
                    {!exp.isExpired && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRelocateFront(batch.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm cursor-pointer"
                        >
                          <MoveRight className="w-3.5 h-3.5" />
                          <span>Pindahkan ke Rak Depan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRelocateClearance(batch.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-900/40 transition-colors cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Rotasi Area Khusus</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedBatchForPrint(batch)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Cetak Stiker Lot</span>
                        </button>
                      </>
                    )}

                    {exp.isExpired && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleQuarantine(batch.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-colors shadow-sm cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Karantina dari Display</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWriteOff(batch.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-sm cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Pemusnahan (Write-Off)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleVendorReturn(batch.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Retur ke Supplier</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
