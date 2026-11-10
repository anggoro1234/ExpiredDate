import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { calculateExpiration } from '../logic/expiration';
import {
  TrendingUp,
  AlertOctagon,
  CheckCircle,
  FileText,
  PieChart,
  ShieldCheck,
  History,
  Boxes,
  AlertTriangle,
} from 'lucide-react';

export const PageAnalytics: React.FC = () => {
  const { batches, actionLogs, referenceTime, stats } = useInventory();

  // Category Risk Matrix
  const categorySummary = React.useMemo(() => {
    const summary: Record<string, { totalBatches: number; totalUnits: number; thresholdCount: number; expiredCount: number }> = {};

    batches.forEach(b => {
      if (!summary[b.category]) {
        summary[b.category] = { totalBatches: 0, totalUnits: 0, thresholdCount: 0, expiredCount: 0 };
      }
      summary[b.category].totalBatches += 1;
      summary[b.category].totalUnits += b.currentQuantity;

      const exp = calculateExpiration(b.expirationDate, referenceTime);
      if (exp.isExpired) {
        summary[b.category].expiredCount += 1;
      } else if (exp.isWithin30Days) {
        summary[b.category].thresholdCount += 1;
      }
    });

    return Object.entries(summary).sort((a, b) => (b[1].thresholdCount + b[1].expiredCount) - (a[1].thresholdCount + a[1].expiredCount));
  }, [batches, referenceTime]);

  const fifoScore = Math.min(100, Math.round(((stats.safeBatchesCount + stats.thresholdBatchesCount) / Math.max(1, stats.totalActiveBatches)) * 100));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 sm:p-6 bg-slate-900 border border-emerald-900/30 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">
            Analisis Rotasi Stok & Kepatuhan Masa Simpan (FIFO)
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Pantau efektivitas pencegahan barang kedaluwarsa, rotasi batch First-In First-Out, dan log tindakan operasional gudang.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-slate-950 rounded-xl border border-emerald-950/60">
            <span className="text-xs text-slate-400 block mb-1">Indeks Kepatuhan FIFO</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">{fifoScore}%</span>
              <span className="text-xs text-emerald-500 font-medium">Rotasi Optimal</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">Pengeluaran barang teratur sesuai tanggal kedaluwarsa</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-amber-950/60">
            <span className="text-xs text-slate-400 block mb-1">Lot Memasuki Batas ≤30 Hari</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-300 font-mono">{stats.thresholdBatchesCount}</span>
              <span className="text-xs text-amber-400">Lot Aktif</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">Perlu rotasi display ke rak depan / clearance</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-rose-950/60">
            <span className="text-xs text-slate-400 block mb-1">Tindakan Kritis / Kedaluwarsa</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400 font-mono">{stats.criticalBatchesCount + stats.expiredBatchesCount}</span>
              <span className="text-xs text-rose-400">Lot Mendesak</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">Wajib segera dikarantina atau dimusnahkan</span>
          </div>
        </div>
      </div>

      {/* Category Risk Breakdown */}
      <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              Matriks Masa Simpan per Kategori Produk
            </h3>
            <p className="text-xs text-slate-400">
              Distribusi status kedaluwarsa per departemen ritel untuk kontrol rotasi berkala
            </p>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {categorySummary.map(([cat, data]) => {
            const isHighRisk = data.thresholdCount + data.expiredCount > 1;
            return (
              <div key={cat} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{cat}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isHighRisk ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    {isHighRisk ? 'Perlu Perhatian' : 'Terkendali'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Lot</span>
                    <span className="font-semibold text-slate-200">{data.totalBatches} ({data.totalUnits} unit)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">≤30 Hari</span>
                    <span className="font-semibold text-amber-400">{data.thresholdCount} Lot</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Kedaluwarsa</span>
                    <span className="font-semibold text-rose-400">{data.expiredCount} Lot</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-2.5 px-3">Kategori Produk</th>
                <th className="py-2.5 px-3">Total Lot</th>
                <th className="py-2.5 px-3">Total Unit</th>
                <th className="py-2.5 px-3">≤30 Hari (Ambang Batas)</th>
                <th className="py-2.5 px-3">Kedaluwarsa</th>
                <th className="py-2.5 px-3 text-right">Status Risiko</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {categorySummary.map(([cat, data]) => {
                const isHighRisk = data.thresholdCount + data.expiredCount > 1;
                return (
                  <tr key={cat} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-semibold text-slate-200">{cat}</td>
                    <td className="py-3 px-3 text-slate-400">{data.totalBatches} Lot</td>
                    <td className="py-3 px-3 text-slate-300 font-medium">{data.totalUnits} Unit</td>
                    <td className="py-3 px-3 font-semibold text-amber-400">{data.thresholdCount}</td>
                    <td className="py-3 px-3 font-semibold text-rose-400">{data.expiredCount}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isHighRisk ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {isHighRisk ? 'Perlu Perhatian' : 'Terkendali'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Logs & Audit Trail */}
      <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">
            Log Riwayat Tindakan Operasional
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Catatan berstempel waktu (timestamp) untuk penerimaan lot, relokasi rak display, karantina, dan pemusnahan.
        </p>

        {actionLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 italic">
            Belum ada log tindakan disposisi tercatat pada sesi ini.
          </p>
        ) : (
          <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            {actionLogs.map(log => (
              <div key={log.id} className="p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-300">{log.batchNumber}</span>
                    <span className="text-slate-300 font-semibold">{log.productName}</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">{log.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-slate-500 block text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID')} oleh {log.performedBy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
