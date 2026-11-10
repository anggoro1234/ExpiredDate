import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { calculateExpiration } from '../logic/expiration';
import { CountdownBadge } from './CountdownBadge';
import { StatsOverview } from './StatsOverview';
import {
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  Tag,
  MapPin,
  Layers,
  Printer,
  Info,
} from 'lucide-react';

export const PageMasterInventory: React.FC = () => {
  const {
    batches,
    referenceTime,
    thresholdBatches,
    setIsAlertModalOpen,
    setActivePage,
    setIsReceivingModalOpen,
    setSelectedBatchForPrint,
    setHighlightedBatchId,
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState<'all' | 'safe' | 'threshold' | 'critical' | 'expired'>('all');
  const [selectedStorage, setSelectedStorage] = useState('all');
  const [sortField, setSortField] = useState<'expiration' | 'arrival' | 'quantity'>('expiration');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [copiedBatchId, setCopiedBatchId] = useState<string | null>(null);

  const handleCopyLot = (lotNumber: string) => {
    navigator.clipboard.writeText(lotNumber);
    setCopiedBatchId(lotNumber);
    setTimeout(() => setCopiedBatchId(null), 2000);
  };

  // Filter & Sort Logic
  const filteredBatches = useMemo(() => {
    return batches.filter(batch => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          batch.batchNumber.toLowerCase().includes(q) ||
          batch.productName.toLowerCase().includes(q) ||
          batch.sku.toLowerCase().includes(q) ||
          batch.supplier.toLowerCase().includes(q) ||
          batch.location.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedCategory !== 'all' && batch.category !== selectedCategory) {
        return false;
      }

      if (selectedStorage !== 'all' && batch.storage !== selectedStorage) {
        return false;
      }

      if (selectedUrgency !== 'all') {
        const exp = calculateExpiration(batch.expirationDate, referenceTime);
        if (selectedUrgency === 'safe' && exp.status !== 'fresh') return false;
        if (selectedUrgency === 'threshold' && !exp.isWithin30Days) return false;
        if (selectedUrgency === 'critical' && !exp.isCritical) return false;
        if (selectedUrgency === 'expired' && !exp.isExpired) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'expiration') {
        comparison = new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
      } else if (sortField === 'arrival') {
        comparison = new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime();
      } else if (sortField === 'quantity') {
        comparison = a.currentQuantity - b.currentQuantity;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [batches, searchTerm, selectedCategory, selectedStorage, selectedUrgency, sortField, sortDirection, referenceTime]);

  const handleNavigateToClearance = (batchId?: string) => {
    if (batchId) {
      setHighlightedBatchId(batchId);
    }
    setActivePage('page2_clearance');
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 1-Month Threshold Alert Banner on Page 1 */}
      {thresholdBatches.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/40 border-2 border-emerald-500/70 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0 shadow-md">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Pemberitahuan Ambang Batas 1 Bulan
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-900 text-amber-200">
                  ≤ 30 Hari Sisa Masa Simpan
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                {thresholdBatches.length} Batch Memerlukan Tinjauan Rotasi Rak & Penanganan
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Pastikan rotasi FIFO berjalan: tempatkan lot ini di bagian depan display pelanggan agar keluar lebih dahulu.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsAlertModalOpen(true)}
              className="flex-1 md:flex-none px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/50 transition-colors"
            >
              Buka Popup Peringatan
            </button>
            <button
              type="button"
              onClick={() => handleNavigateToClearance()}
              aria-label="Buka Halaman 2 Antrean Rotasi"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <span>Buka Halaman 2: Tindakan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Operational Metrics */}
      <StatsOverview />

      {/* FIFO Differentiation Notice */}
      <div className="p-3 bg-slate-900 border border-emerald-900/40 rounded-xl flex items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-emerald-300">Pelacakan Kunci Lot Unik:</strong> Item identik yang tiba pada tanggal berbeda otomatis memiliki nomor lot berbeda (misal: <code className="text-emerald-300 font-mono">LOT-DAI-20261025-0001</code> vs <code className="text-emerald-300 font-mono">LOT-DAI-20261102-0002</code>) untuk memastikan stok lama selalu dikeluarkan lebih dulu.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsReceivingModalOpen(true)}
          className="shrink-0 text-emerald-400 hover:text-emerald-300 font-bold underline hidden sm:inline"
        >
          + Terima Batch Baru
        </button>
      </div>

      {/* Search, Filter & Sorters */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari Nomor Lot, SKU, Nama Barang, Lokasi Rak..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Hapus Pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Urgency Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setSelectedUrgency('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedUrgency === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua Lot ({batches.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedUrgency('threshold')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                selectedUrgency === 'threshold'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-800/50 hover:bg-amber-950/60'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>≤30 Hari Ambang</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedUrgency('critical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedUrgency === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-950/40 text-red-300 border border-red-800/50 hover:bg-red-950/60'
              }`}
            >
              Kritis (≤7 Hari)
            </button>
            <button
              type="button"
              onClick={() => setSelectedUrgency('safe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedUrgency === 'safe'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Aman (&gt;30 Hari)
            </button>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="filter-cat" className="text-slate-400 font-medium flex items-center gap-1">
                <Filter className="w-3 h-3 text-emerald-400" /> Kategori:
              </label>
              <select
                id="filter-cat"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Kategori</option>
                <option value="Dairy & Eggs">Susu & Telur</option>
                <option value="Bakery">Bakery / Roti</option>
                <option value="Fresh Meat & Seafood">Daging & Ikan</option>
                <option value="Prepared & Deli">Makanan Siap Saji</option>
                <option value="Produce & Salads">Sayur & Buah</option>
                <option value="Beverages & Juices">Minuman & Jus</option>
                <option value="Packaged Grocery">Sembako Kering</option>
                <option value="Health & Personal Care">Kesehatan</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="filter-storage" className="text-slate-400 font-medium">Suhu:</label>
              <select
                id="filter-storage"
                value={selectedStorage}
                onChange={e => setSelectedStorage(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Suhu</option>
                <option value="chilled">Chilled Dingin</option>
                <option value="ambient">Suhu Ruang</option>
                <option value="frozen">Frozen Beku</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-by" className="text-slate-400 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-emerald-400" /> Urutkan:
            </label>
            <select
              id="sort-by"
              value={sortField}
              onChange={e => setSortField(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="expiration">Kedaluwarsa Terdekat (Prioritas FIFO)</option>
              <option value="arrival">Tanggal Masuk Barang</option>
              <option value="quantity">Jumlah Kuantitas Stok</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              title={sortDirection === 'asc' ? 'Menaik' : 'Menurun'}
            >
              {sortDirection === 'asc' ? '↑ Naik' : '↓ Turun'}
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Presentation: Desktop Table & Mobile Cards */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Daftar Batch Inventaris & Pemantauan Kedaluwarsa Live
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
              {filteredBatches.length} Lot
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono hidden sm:inline">
            ● Real-Time Countdown Aktif
          </span>
        </div>

        {filteredBatches.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <p className="text-sm">Tidak ada batch yang sesuai dengan filter pencarian.</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedUrgency('all');
                setSelectedStorage('all');
              }}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              Reset semua filter
            </button>
          </div>
        ) : (
          <>
            {/* 1. Mobile Cards View (< md screens) */}
            <div className="block md:hidden divide-y divide-slate-800">
              {filteredBatches.map(batch => {
                const exp = calculateExpiration(batch.expirationDate, referenceTime);
                const isCopied = copiedBatchId === batch.batchNumber;

                return (
                  <div key={batch.id} className="p-4 space-y-2.5 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-emerald-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                            {batch.batchNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyLot(batch.batchNumber)}
                            className="p-1 text-slate-400 hover:text-white"
                            aria-label={`Salin nomor lot ${batch.batchNumber}`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="text-sm font-bold text-white mt-1">
                          {batch.productName}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          SKU: {batch.sku} • {batch.category}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <CountdownBadge expirationDate={batch.expirationDate} referenceTime={referenceTime} compact />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Tgl Kedaluwarsa</span>
                        <span className="font-bold text-emerald-300">
                          {new Date(batch.expirationDate).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Stok Fisik</span>
                        <span className="font-bold text-white">
                          {batch.currentQuantity} {batch.unit}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{batch.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedBatchForPrint(batch)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" /> Label
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavigateToClearance(batch.id)}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1"
                      >
                        <span>Tindak di P2</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Desktop & Tablet Table (>= md screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Nomor Lot Unik</th>
                    <th className="py-3 px-4">Nama Produk & SKU</th>
                    <th className="py-3 px-4">Lokasi Rak & Suhu</th>
                    <th className="py-3 px-4">Tgl Masuk</th>
                    <th className="py-3 px-4">Tgl Kedaluwarsa</th>
                    <th className="py-3 px-4">Live Countdown</th>
                    <th className="py-3 px-4">Kuantitas</th>
                    <th className="py-3 px-4 text-right">Aksi Operasional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredBatches.map(batch => {
                    const exp = calculateExpiration(batch.expirationDate, referenceTime);
                    const isThresholdItem = exp.isWithin30Days;
                    const isCopied = copiedBatchId === batch.batchNumber;

                    return (
                      <tr
                        key={batch.id}
                        className={`hover:bg-slate-800/50 transition-colors ${
                          isThresholdItem ? 'bg-amber-950/15' : ''
                        }`}
                      >
                        {/* Lot Primary Identifier */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-emerald-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-700/80">
                              {batch.batchNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyLot(batch.batchNumber)}
                              title="Salin Nomor Lot"
                              className="p-1 text-slate-500 hover:text-slate-200 rounded transition-colors"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            Supplier: {batch.supplier}
                          </span>
                        </td>

                        {/* Product Name & SKU */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-semibold text-slate-100 text-xs">
                            {batch.productName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                            <span>SKU: {batch.sku}</span>
                            <span>•</span>
                            <span className="text-slate-500">{batch.category}</span>
                          </div>
                        </td>

                        {/* Storage & Location */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate max-w-[150px]" title={batch.location}>
                              {batch.location}
                            </span>
                          </div>
                          <span className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
                            batch.storage === 'chilled' ? 'bg-teal-950 text-teal-300 border border-teal-800' :
                            batch.storage === 'frozen' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {batch.storage}
                          </span>
                        </td>

                        {/* Arrival Date */}
                        <td className="py-3.5 px-4 align-top font-mono text-slate-300">
                          {batch.receivedDate}
                        </td>

                        {/* Expiration Date */}
                        <td className="py-3.5 px-4 align-top font-mono">
                          <span className={`font-bold ${
                            exp.isExpired ? 'text-rose-400' :
                            exp.isCritical ? 'text-red-400' :
                            exp.isWithin30Days ? 'text-amber-300' :
                            'text-emerald-300'
                          }`}>
                            {new Date(batch.expirationDate).toLocaleDateString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(batch.expirationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        {/* Real-Time Countdown Badge */}
                        <td className="py-3.5 px-4 align-top">
                          <CountdownBadge expirationDate={batch.expirationDate} referenceTime={referenceTime} />
                        </td>

                        {/* Quantity */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-bold text-slate-100 text-sm">
                            {batch.currentQuantity} <span className="text-xs text-slate-400 font-normal">{batch.unit}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 align-top text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedBatchForPrint(batch)}
                            title="Cetak Stiker Label Lot"
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {isThresholdItem ? (
                            <button
                              type="button"
                              onClick={() => handleNavigateToClearance(batch.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm cursor-pointer"
                            >
                              <span>Tindak (P2)</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleNavigateToClearance(batch.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <span>Periksa</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
