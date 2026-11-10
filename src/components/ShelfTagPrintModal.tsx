import React from 'react';
import { InventoryBatch } from '../types';
import { calculateExpiration } from '../logic/expiration';
import { X, Printer, Tag, Clock, MapPin, Calendar, CheckCircle } from 'lucide-react';

interface ShelfTagPrintModalProps {
  batch: InventoryBatch | null;
  onClose: () => void;
  referenceTime?: Date;
}

export const ShelfTagPrintModal: React.FC<ShelfTagPrintModalProps> = ({
  batch,
  onClose,
  referenceTime = new Date(),
}) => {
  if (!batch) return null;

  const expCalc = calculateExpiration(batch.expirationDate, referenceTime);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shelf-tag-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-slate-900 border border-emerald-600/50 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-950 px-5 sm:px-6 py-4 border-b border-emerald-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Tag className="w-5 h-5 text-emerald-400" />
            <h2 id="shelf-tag-title" className="text-base font-bold text-white">
              Cetak Label Lot Operasional & Tanggal Kedaluwarsa
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Pratinjau Label"
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operational Shelf Tag Visual Preview */}
        <div className="p-6 bg-slate-950 flex flex-col items-center flex-1 overflow-y-auto">
          <div className="w-full max-w-sm bg-white text-slate-950 p-5 rounded-xl border-4 border-emerald-600 shadow-2xl font-sans relative">
            {/* Top Label Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-950 pb-2 mb-3">
              <span className="font-black text-xs uppercase tracking-widest bg-emerald-700 text-white px-2 py-0.5 rounded">
                LABEL LOT FIFO
              </span>
              <span className="font-mono text-xs font-black tracking-tight text-slate-900">
                {batch.batchNumber}
              </span>
            </div>

            {/* Product Title */}
            <div className="font-black text-base sm:text-lg leading-tight mb-1 text-slate-950">
              {batch.productName}
            </div>
            <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center justify-between">
              <span>SKU: {batch.sku}</span>
              <span>{batch.category}</span>
            </div>

            {/* Operational Expiration Date Box */}
            <div className="bg-emerald-50 border-2 border-emerald-600 p-3 rounded-lg mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase text-emerald-900 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" /> TANGGAL KEDALUWARSA:
                </span>
                <span className="font-mono text-xs font-bold text-emerald-800">
                  {expCalc.status.toUpperCase()}
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-900 font-mono tracking-tight">
                {new Date(batch.expirationDate).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <span className="text-[11px] font-medium text-emerald-800 block mt-0.5">
                Hitungan Mundur: {expCalc.formattedCountdown}
              </span>
            </div>

            {/* Warehouse & Display Shelf Placement */}
            <div className="bg-slate-100 p-2 rounded text-xs text-slate-800 mb-3 border border-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-slate-600" /> Lokasi Rak:
              </span>
              <span className="font-bold font-mono">
                {batch.location}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium mb-3">
              <span>Tgl Terima: {batch.receivedDate}</span>
              <span>Kuantitas: {batch.currentQuantity} {batch.unit}</span>
            </div>

            {/* Barcode Mock */}
            <div className="pt-2 border-t border-slate-300 flex flex-col items-center">
              <div className="h-9 w-full bg-[repeating-linear-gradient(90deg,#000_0px,#000_2px,#fff_2px,#fff_4px,#000_4px,#000_7px,#fff_7px,#fff_9px)] rounded-sm opacity-90"></div>
              <span className="font-mono text-[10px] tracking-widest text-slate-800 font-bold mt-1">
                {batch.batchNumber.replace(/-/g, '')}
              </span>
            </div>
          </div>
          <span className="text-xs text-slate-400 mt-3 text-center">
            Format stiker rak 3&quot; x 2&quot; untuk printer barcode retail operasional.
          </span>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-900 border-t border-emerald-950 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => {
              window.print();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Stiker Lot</span>
          </button>
        </div>
      </div>
    </div>
  );
};
