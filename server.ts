import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_BATCHES, INITIAL_PRODUCTS } from './src/data/seed-data';
import { InventoryBatch, ProductCatalogItem, BatchActionLog, OperationalAction } from './src/types';
import { generateBatchIdentifier, validateBatchInput } from './src/logic/batch-tracker';
import { calculateExpiration } from './src/logic/expiration';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory state for server runtime
let batches: InventoryBatch[] = JSON.parse(JSON.stringify(INITIAL_BATCHES));
let products: ProductCatalogItem[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
let actionLogs: BatchActionLog[] = [];
let batchSequenceCounter = 20;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get all inventory batches
  app.get('/api/batches', (_req: Request, res: Response) => {
    res.json({ success: true, count: batches.length, data: batches });
  });

  // Get single batch
  app.get('/api/batches/:id', (req: Request, res: Response) => {
    const item = batches.find(b => b.id === req.params.id || b.batchNumber === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Batch tidak ditemukan' });
    }
    return res.json({ success: true, data: item });
  });

  // Receive new batch / lot with unique primary tracking key (NO price needed)
  app.post('/api/batches', (req: Request, res: Response) => {
    const body = req.body;
    const validation = validateBatchInput(body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    batchSequenceCounter += 1;
    const batchNumber = body.batchNumber || generateBatchIdentifier(
      body.category || 'Packaged Grocery',
      body.receivedDate || new Date().toISOString().slice(0, 10),
      batchSequenceCounter
    );

    const newBatch: InventoryBatch = {
      id: `b-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      batchNumber,
      productId: body.productId || `PROD-${Date.now()}`,
      productName: body.productName,
      sku: body.sku,
      category: body.category || 'Dairy & Eggs',
      storage: body.storage || 'chilled',
      receivedDate: body.receivedDate,
      manufactureDate: body.manufactureDate || undefined,
      expirationDate: body.expirationDate,
      initialQuantity: Number(body.initialQuantity),
      currentQuantity: Number(body.currentQuantity ?? body.initialQuantity),
      unit: body.unit || 'pcs',
      location: body.location || 'Area Penerimaan / Rak Transit',
      supplier: body.supplier || 'Distributor Utama',
      status: 'fresh',
    };

    // Calculate initial status
    const expCalc = calculateExpiration(newBatch.expirationDate);
    newBatch.status = expCalc.status;

    batches.unshift(newBatch);

    actionLogs.unshift({
      id: `log-${Date.now()}`,
      batchId: newBatch.id,
      batchNumber: newBatch.batchNumber,
      productName: newBatch.productName,
      action: 'relocated_front',
      details: `Penerimaan batch masuk baru dengan nomor lot ${newBatch.batchNumber}`,
      quantityAffected: newBatch.initialQuantity,
      timestamp: new Date().toISOString(),
      performedBy: 'Petugas Gudang / Penerimaan',
    });

    return res.status(201).json({ success: true, data: newBatch });
  });

  // Record Operational Disposition (Relocate to front, Move to clearance, Quarantine, Write-off, Return)
  app.patch('/api/batches/:id/disposition', (req: Request, res: Response) => {
    const { id } = req.params;
    const { action, notes, newLocation, operator, quantity } = req.body;

    const batch = batches.find(b => b.id === id || b.batchNumber === id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch tidak ditemukan' });
    }

    const affectedQty = quantity ? Math.min(Number(quantity), batch.currentQuantity) : batch.currentQuantity;

    if (action === 'relocated_front') {
      batch.location = newLocation || 'Rak Depan Kasir / Endcap Display';
      batch.actionTaken = 'relocated_front';
      batch.actionNotes = notes || 'Dipindahkan ke rak depan untuk prioritas pengeluaran FIFO';
      batch.reviewedInClearanceQueue = true;
    } else if (action === 'relocated_clearance') {
      batch.location = newLocation || 'Rak Khusus Masa Simpan Terbatas';
      batch.actionTaken = 'relocated_clearance';
      batch.actionNotes = notes || 'Dipindahkan ke area rotasi cepat';
      batch.reviewedInClearanceQueue = true;
    } else if (action === 'quarantined') {
      batch.status = 'quarantined';
      batch.location = 'Gudang Karantina (Tarik dari Rak)';
      batch.actionTaken = 'quarantined';
      batch.actionNotes = notes || 'Ditarik dari display untuk karantina';
      batch.reviewedInClearanceQueue = true;
    } else if (action === 'written_off') {
      batch.status = 'disposed';
      batch.actionTaken = 'written_off';
      batch.currentQuantity = Math.max(0, batch.currentQuantity - affectedQty);
      batch.actionNotes = notes || 'Pemusnahan barang kedaluwarsa';
      batch.reviewedInClearanceQueue = true;
    } else if (action === 'vendor_returned') {
      batch.status = 'returned';
      batch.actionTaken = 'vendor_returned';
      batch.currentQuantity = Math.max(0, batch.currentQuantity - affectedQty);
      batch.actionNotes = notes || `Retur ke supplier ${batch.supplier}`;
      batch.reviewedInClearanceQueue = true;
    }

    batch.actionTimestamp = new Date().toISOString();

    actionLogs.unshift({
      id: `log-${Date.now()}`,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      productName: batch.productName,
      action: action as OperationalAction,
      details: notes || `Tindakan operasional: ${action}`,
      quantityAffected: affectedQty,
      timestamp: new Date().toISOString(),
      performedBy: operator || 'Staf Operasional',
    });

    return res.json({ success: true, data: batch });
  });

  // Get products catalog
  app.get('/api/products', (_req: Request, res: Response) => {
    res.json({ success: true, data: products });
  });

  // Get action audit logs
  app.get('/api/logs', (_req: Request, res: Response) => {
    res.json({ success: true, count: actionLogs.length, data: actionLogs });
  });

  // Reset database state to seed
  app.post('/api/reset', (_req: Request, res: Response) => {
    batches = JSON.parse(JSON.stringify(INITIAL_BATCHES));
    products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    actionLogs = [];
    batchSequenceCounter = 20;
    res.json({ success: true, message: 'Reset data berhasil ke kondisi awal' });
  });

  // Vite middleware in development
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FreshPulse ED Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
