import test from 'node:test';
import assert from 'node:assert/strict';
import { generateBatchIdentifier, validateBatchInput } from './batch-tracker';

test('generateBatchIdentifier creates standardized unique lot identifier', () => {
  const lotId = generateBatchIdentifier('Dairy & Eggs', '2026-11-09', 14);
  assert.equal(lotId, 'LOT-DAI-20261109-0014');
});

test('generateBatchIdentifier handles bakery and meat category codes correctly', () => {
  const bakeryLot = generateBatchIdentifier('Bakery', '2026-11-15', 3);
  assert.equal(bakeryLot, 'LOT-BAK-20261115-0003');

  const meatLot = generateBatchIdentifier('Fresh Meat & Seafood', '2026-11-20', 105);
  assert.equal(meatLot, 'LOT-MEA-20261120-0105');
});

test('generateBatchIdentifier differentiates identical items arriving on different dates', () => {
  const batch1 = generateBatchIdentifier('Dairy & Eggs', '2026-11-01', 1);
  const batch2 = generateBatchIdentifier('Dairy & Eggs', '2026-11-09', 1);
  assert.notEqual(batch1, batch2);
  assert.equal(batch1, 'LOT-DAI-20261101-0001');
  assert.equal(batch2, 'LOT-DAI-20261109-0001');
});

test('validateBatchInput validates required operational fields without requiring price', () => {
  const invalid = validateBatchInput({});
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.some(e => e.includes('Nama produk') || e.includes('Product name')));
  assert.ok(invalid.errors.some(e => e.includes('SKU')));
  assert.ok(invalid.errors.some(e => e.includes('Tanggal masuk')));

  const valid = validateBatchInput({
    productName: 'Organic Whole Milk 1L',
    sku: 'SKU-DAI-001',
    receivedDate: '2026-11-09',
    expirationDate: '2026-11-25',
    initialQuantity: 50,
    currentQuantity: 50,
  });
  assert.equal(valid.isValid, true);
  assert.equal(valid.errors.length, 0);
});

test('validateBatchInput rejects expiration date earlier than arrival date', () => {
  const result = validateBatchInput({
    productName: 'Greek Yogurt 500g',
    sku: 'SKU-DAI-002',
    receivedDate: '2026-11-10',
    expirationDate: '2026-11-05',
    initialQuantity: 20,
    currentQuantity: 20,
  });
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('tidak boleh lebih awal')));
});
