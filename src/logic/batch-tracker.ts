import { ProductCategory, InventoryBatch } from '../types';

const CATEGORY_CODE_MAP: Record<ProductCategory, string> = {
  'Dairy & Eggs': 'DAI',
  'Bakery': 'BAK',
  'Fresh Meat & Seafood': 'MEA',
  'Prepared & Deli': 'DEL',
  'Produce & Salads': 'PRO',
  'Beverages & Juices': 'BEV',
  'Packaged Grocery': 'GRO',
  'Health & Personal Care': 'HEA',
};

/**
 * Generates a unique primary tracking key or batch/lot identifier system
 * to differentiate identical items arriving on different dates with different expiration dates.
 * Format: LOT-[CAT3]-[YYYYMMDD]-[SEQ4] e.g. LOT-DAI-20261109-0012
 */
export function generateBatchIdentifier(
  category: ProductCategory | string,
  arrivalDateString: string,
  sequence: number
): string {
  const catCode = (CATEGORY_CODE_MAP[category as ProductCategory] || 'GEN').toUpperCase();
  const cleanedDate = arrivalDateString.replace(/[^0-9]/g, '').slice(0, 8);
  const formattedDate = cleanedDate.length === 8 ? cleanedDate : new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seqPadded = String(Math.max(1, sequence)).padStart(4, '0');
  
  return `LOT-${catCode}-${formattedDate}-${seqPadded}`;
}

export interface BatchValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateBatchInput(data: Partial<InventoryBatch>): BatchValidationResult {
  const errors: string[] = [];

  if (!data.productName || data.productName.trim().length === 0) {
    errors.push('Nama produk wajib diisi (Product name is required).');
  }

  if (!data.sku || data.sku.trim().length === 0) {
    errors.push('SKU / Barcode wajib diisi.');
  }

  if (!data.receivedDate) {
    errors.push('Tanggal masuk wajib diisi (Arrival date is required).');
  }

  if (!data.expirationDate) {
    errors.push('Tanggal kedaluwarsa wajib diisi (Expiration date is required).');
  } else if (data.receivedDate && new Date(data.expirationDate) < new Date(data.receivedDate)) {
    errors.push('Tanggal kedaluwarsa tidak boleh lebih awal dari tanggal masuk.');
  }

  if (data.initialQuantity === undefined || data.initialQuantity <= 0) {
    errors.push('Jumlah unit masuk harus lebih dari 0.');
  }

  if (data.currentQuantity === undefined || data.currentQuantity < 0) {
    errors.push('Jumlah stok saat ini tidak boleh bernilai negatif.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
