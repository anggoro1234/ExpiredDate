import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { ProductCategory, StorageCondition } from '../types';
import { generateBatchIdentifier, validateBatchInput } from '../logic/batch-tracker';
import { calculateExpiration } from '../logic/expiration';
import { X, PlusCircle, Calendar, Hash, Check, MapPin, Truck } from 'lucide-react';

export const ReceiveBatchModal: React.FC = () => {
  const {
    isReceivingModalOpen,
    setIsReceivingModalOpen,
    products,
    receiveNewBatch,
    referenceTime,
    batches,
  } = useInventory();

  const [selectedProductId, setSelectedProductId] = useState<string>('custom');
  const [productName, setProductName] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [category, setCategory] = useState<ProductCategory>('Dairy & Eggs');
  const [storage, setStorage] = useState<StorageCondition>('chilled');
  const [receivedDate, setReceivedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [expirationDate, setExpirationDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 16);
  });
  const [quantity, setQuantity] = useState<number>(30);
  const [unit, setUnit] = useState<string>('pcs');
  const [location, setLocation] = useState<string>('Chiller Display A1 - Rak 1');
  const [supplier, setSupplier] = useState<string>('Distributor Segar Mandiri');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const previewBatchNumber = generateBatchIdentifier(category, receivedDate, batches.length + 1);

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    if (prodId === 'custom') {
      setProductName('');
      setSku('');
      return;
    }
    const found = products.find(p => p.id === prodId);
    if (found) {
      setProductName(found.name);
      setSku(found.sku);
      setCategory(found.category);
      setStorage(found.storage);
      setUnit(found.unit);

      const expD = new Date(receivedDate);
      expD.setDate(expD.getDate() + found.standardShelfLifeDays);
      setExpirationDate(expD.toISOString().slice(0, 16));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    const batchPayload = {
      batchNumber: previewBatchNumber,
      productId: selectedProductId === 'custom' ? `PROD-${Date.now()}` : selectedProductId,
      productName,
      sku,
      category,
      storage,
      receivedDate,
      expirationDate: new Date(expirationDate).toISOString(),
      initialQuantity: Number(quantity),
      currentQuantity: Number(quantity),
      unit,
      location,
      supplier,
    };

    const validation = validateBatchInput(batchPayload);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    const result = await receiveNewBatch(batchPayload);
    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsReceivingModalOpen(false);
      }, 1000);
    } else {
      setValidationErrors(result.errors || ['Gagal menyimpan batch']);
    }
  };

  if (!isReceivingModalOpen) return null;

  const expCalc = calculateExpiration(new Date(expirationDate).toISOString(), referenceTime);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receive-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-emerald-600/50 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-950 px-5 sm:px-6 py-4 border-b border-emerald-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="receive-modal-title" className="text-base sm:text-lg font-bold text-white">
                Penerimaan Batch Masuk (Inbound Lot)
              </h2>
              <p className="text-xs text-slate-400">
                Pencatatan nomor lot unik untuk identifikasi kedaluwarsa tiap batch barang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsReceivingModalOpen(false)}
            aria-label="Tutup Modal Penerimaan Batch"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {validationErrors.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs space-y-1">
              <span className="font-bold block">Mohon perbaiki data berikut:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Primary Key Callout */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" /> Kunci Lacak Lot Unik (Otomatis)
              </span>
              <span className="font-mono text-sm sm:text-base font-black text-white tracking-wide">
                {previewBatchNumber}
              </span>
              <span className="text-[11px] text-emerald-300/80 block mt-0.5">
                Membedakan item identik yang masuk di tanggal berbeda dengan tanggal ED berbeda.
              </span>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="text-[11px] text-slate-400 block">Status Awal</span>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                expCalc.isCritical ? 'bg-red-950 text-red-300 border border-red-700' :
                expCalc.isWithin30Days ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                'bg-emerald-950 text-emerald-300 border border-emerald-700'
              }`}>
                {expCalc.status.toUpperCase()} ({expCalc.formattedCountdown})
              </span>
            </div>
          </div>

          {/* Preset Item & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="prod-select" className="text-xs font-semibold text-slate-300">
                Pilih Produk dari Katalog (Opsional)
              </label>
              <select
                id="prod-select"
                value={selectedProductId}
                onChange={e => handleProductSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="custom">+ Isi Produk Kustom / Baru</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="prod-sku" className="text-xs font-semibold text-slate-300">
                SKU / Kode Barcode <span className="text-rose-400">*</span>
              </label>
              <input
                id="prod-sku"
                type="text"
                required
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="Contoh: SKU-DAI-101"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-1">
            <label htmlFor="prod-name" className="text-xs font-semibold text-slate-300">
              Nama Produk <span className="text-rose-400">*</span>
            </label>
            <input
              id="prod-name"
              type="text"
              required
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="Contoh: Horizon Organic Whole Milk 1 Gal"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category & Storage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="prod-category" className="text-xs font-semibold text-slate-300">
                Kategori Produk
              </label>
              <select
                id="prod-category"
                value={category}
                onChange={e => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Dairy & Eggs">Dairy & Eggs (Susu & Telur)</option>
                <option value="Bakery">Bakery (Roti & Pastry)</option>
                <option value="Fresh Meat & Seafood">Daging & Ikan Segar</option>
                <option value="Prepared & Deli">Makanan Siap Saji / Deli</option>
                <option value="Produce & Salads">Sayur & Buah Segar</option>
                <option value="Beverages & Juices">Minuman & Jus</option>
                <option value="Packaged Grocery">Sembako & Kemasan Kering</option>
                <option value="Health & Personal Care">Kesehatan & Perawatan</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="prod-storage" className="text-xs font-semibold text-slate-300">
                Kondisi Suhu Penyimpanan
              </label>
              <select
                id="prod-storage"
                value={storage}
                onChange={e => setStorage(e.target.value as StorageCondition)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="chilled">Chilled Dingin (2°C - 4°C)</option>
                <option value="ambient">Suhu Ruangan (Ambient)</option>
                <option value="frozen">Beku / Freezer (-18°C)</option>
              </select>
            </div>
          </div>

          {/* Dates: Arrival Date & Expiration Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="arrival-date" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Tanggal Masuk (Inbound) <span className="text-rose-400">*</span>
              </label>
              <input
                id="arrival-date"
                type="date"
                required
                value={receivedDate}
                onChange={e => setReceivedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="expiration-date" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Tanggal Kedaluwarsa (ED) <span className="text-rose-400">*</span>
              </label>
              <input
                id="expiration-date"
                type="datetime-local"
                required
                value={expirationDate}
                onChange={e => setExpirationDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="batch-qty" className="text-xs font-semibold text-slate-300">
                Jumlah Kuantitas Masuk <span className="text-rose-400">*</span>
              </label>
              <input
                id="batch-qty"
                type="number"
                min="1"
                required
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="batch-unit" className="text-xs font-semibold text-slate-300">
                Satuan Kemasan
              </label>
              <input
                id="batch-unit"
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="pcs, botol, pack, cup"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Shelf Location & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="batch-location" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Lokasi Rak / Display Penyimpanan
              </label>
              <input
                id="batch-location"
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Contoh: Chiller Display A1 - Rak 2"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="batch-supplier" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-400" /> Supplier / Vendor Pengirim
              </label>
              <input
                id="batch-supplier"
                type="text"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                placeholder="Contoh: Horizon Dairy Direct"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsReceivingModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Batch Berhasil Terdaftar!</span>
                </>
              ) : isSubmitting ? (
                <span>Menyimpan Lot...</span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Simpan Batch Masuk</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
