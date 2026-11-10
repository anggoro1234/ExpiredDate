import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { InventoryBatch, ProductCatalogItem, BatchActionLog, InventoryStats } from '../types';
import { INITIAL_BATCHES, INITIAL_PRODUCTS } from '../data/seed-data';
import { calculateExpiration, is1MonthThresholdAlertTriggered } from '../logic/expiration';

interface InventoryContextType {
  batches: InventoryBatch[];
  products: ProductCatalogItem[];
  actionLogs: BatchActionLog[];
  activePage: 'page1_master' | 'page2_clearance' | 'analytics';
  setActivePage: (page: 'page1_master' | 'page2_clearance' | 'analytics') => void;
  referenceTime: Date;
  simulatedDaysOffset: number;
  setSimulatedDaysOffset: (days: number | ((prev: number) => number)) => void;
  resetSimulatedTime: () => void;
  isAlertModalOpen: boolean;
  setIsAlertModalOpen: (open: boolean) => void;
  thresholdBatches: InventoryBatch[];
  stats: InventoryStats;
  isReceivingModalOpen: boolean;
  setIsReceivingModalOpen: (open: boolean) => void;
  receiveNewBatch: (batchData: Partial<InventoryBatch>) => Promise<{ success: boolean; data?: InventoryBatch; errors?: string[] }>;
  applyDisposition: (batchId: string, action: string, notes?: string, location?: string, quantity?: number) => Promise<boolean>;
  resetToSeedData: () => Promise<void>;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedBatchForPrint: InventoryBatch | null;
  setSelectedBatchForPrint: (batch: InventoryBatch | null) => void;
  highlightedBatchId: string | null;
  setHighlightedBatchId: (id: string | null) => void;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [batches, setBatches] = useState<InventoryBatch[]>(INITIAL_BATCHES);
  const [products, setProducts] = useState<ProductCatalogItem[]>(INITIAL_PRODUCTS);
  const [actionLogs, setActionLogs] = useState<BatchActionLog[]>([]);
  const [activePage, setActivePage] = useState<'page1_master' | 'page2_clearance' | 'analytics'>('page1_master');
  
  // Real-time live date/time update continuously every second
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [simulatedDaysOffset, setSimulatedDaysOffset] = useState<number>(0);
  
  // Modals & Navigation
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [hasAlertBeenShownThisSession, setHasAlertBeenShownThisSession] = useState<boolean>(false);
  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState<boolean>(false);
  const [selectedBatchForPrint, setSelectedBatchForPrint] = useState<InventoryBatch | null>(null);
  const [highlightedBatchId, setHighlightedBatchId] = useState<string | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live second and day continuous ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Effective reference time combining real-time clock and optional test fast-forward
  const referenceTime = useMemo(() => {
    if (simulatedDaysOffset === 0) return currentTime;
    return new Date(currentTime.getTime() + simulatedDaysOffset * 24 * 60 * 60 * 1000);
  }, [currentTime, simulatedDaysOffset]);

  // Initial fetch from backend
  useEffect(() => {
    fetch('/api/batches')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setBatches(json.data);
        }
      })
      .catch(() => {});

    fetch('/api/products')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setProducts(json.data);
        }
      })
      .catch(() => {});

    fetch('/api/logs')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setActionLogs(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // Batches within the 1-month (≤30 days) threshold
  const thresholdBatches = useMemo(() => {
    return batches.filter(b => {
      if (b.status === 'disposed' || b.status === 'returned') return false;
      return is1MonthThresholdAlertTriggered(b.expirationDate, referenceTime);
    });
  }, [batches, referenceTime]);

  // Auto trigger the 1-month threshold alert modal on Page 1 if near-expiry batches are detected
  useEffect(() => {
    if (activePage === 'page1_master' && !hasAlertBeenShownThisSession && thresholdBatches.length > 0) {
      const timer = setTimeout(() => {
        setIsAlertModalOpen(true);
        setHasAlertBeenShownThisSession(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [activePage, hasAlertBeenShownThisSession, thresholdBatches.length]);

  // Purely operational stats without price fields
  const stats: InventoryStats = useMemo(() => {
    let totalUnits = 0;
    let safeBatchesCount = 0;
    let thresholdBatchesCount = 0;
    let criticalBatchesCount = 0;
    let expiredBatchesCount = 0;

    const activeBatches = batches.filter(b => b.status !== 'disposed' && b.status !== 'returned');

    for (const b of activeBatches) {
      totalUnits += b.currentQuantity;
      const exp = calculateExpiration(b.expirationDate, referenceTime);
      if (exp.isExpired) {
        expiredBatchesCount += 1;
      } else if (exp.isCritical) {
        criticalBatchesCount += 1;
        thresholdBatchesCount += 1;
      } else if (exp.isWithin30Days) {
        thresholdBatchesCount += 1;
      } else {
        safeBatchesCount += 1;
      }
    }

    return {
      totalActiveBatches: activeBatches.length,
      totalUnits,
      safeBatchesCount,
      thresholdBatchesCount,
      criticalBatchesCount,
      expiredBatchesCount,
      urgentActionNeededCount: thresholdBatchesCount + expiredBatchesCount,
    };
  }, [batches, referenceTime]);

  // Receive New Inbound Batch
  const receiveNewBatch = useCallback(async (batchData: Partial<InventoryBatch>) => {
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setBatches(prev => [data.data, ...prev]);
        return { success: true, data: data.data };
      }
      return { success: false, errors: data.errors || [data.message || 'Gagal menerima batch'] };
    } catch {
      return { success: false, errors: ['Koneksi gagal'] };
    }
  }, []);

  // Apply Operational Disposition (Relocate front, Move clearance, Quarantine, Write-off, Return)
  const applyDisposition = useCallback(async (
    batchId: string,
    action: string,
    notes?: string,
    location?: string,
    quantity?: number
  ) => {
    try {
      const res = await fetch(`/api/batches/${batchId}/disposition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes, newLocation: location, quantity }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setBatches(prev => prev.map(b => b.id === batchId ? data.data : b));
        return true;
      }
    } catch {}

    // Optimistic local update
    setBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        const affectedQty = quantity ? Math.min(quantity, b.currentQuantity) : b.currentQuantity;
        let newStatus = b.status;
        let newLoc = b.location;
        let newQty = b.currentQuantity;

        if (action === 'relocated_front') {
          newLoc = location || 'Rak Depan Kasir / Endcap Display';
          newStatus = 'relocated';
        } else if (action === 'relocated_clearance') {
          newLoc = location || 'Rak Khusus Masa Simpan Terbatas';
          newStatus = 'relocated';
        } else if (action === 'quarantined') {
          newLoc = 'Gudang Karantina';
          newStatus = 'quarantined';
        } else if (action === 'written_off') {
          newStatus = 'disposed';
          newQty = Math.max(0, b.currentQuantity - affectedQty);
        } else if (action === 'vendor_returned') {
          newStatus = 'returned';
          newQty = Math.max(0, b.currentQuantity - affectedQty);
        }

        return {
          ...b,
          status: newStatus,
          location: newLoc,
          currentQuantity: newQty,
          actionTaken: action as any,
          actionNotes: notes,
          actionTimestamp: new Date().toISOString(),
          reviewedInClearanceQueue: true,
        };
      }
      return b;
    }));
    return true;
  }, []);

  const resetToSeedData = useCallback(async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch {}
    setBatches(JSON.parse(JSON.stringify(INITIAL_BATCHES)));
    setProducts(JSON.parse(JSON.stringify(INITIAL_PRODUCTS)));
    setActionLogs([]);
    setSimulatedDaysOffset(0);
    setHasAlertBeenShownThisSession(false);
  }, []);

  const resetSimulatedTime = useCallback(() => {
    setSimulatedDaysOffset(0);
  }, []);

  const value = {
    batches,
    products,
    actionLogs,
    activePage,
    setActivePage,
    referenceTime,
    simulatedDaysOffset,
    setSimulatedDaysOffset,
    resetSimulatedTime,
    isAlertModalOpen,
    setIsAlertModalOpen,
    thresholdBatches,
    stats,
    isReceivingModalOpen,
    setIsReceivingModalOpen,
    receiveNewBatch,
    applyDisposition,
    resetToSeedData,
    filterCategory,
    setFilterCategory,
    searchQuery,
    setSearchQuery,
    selectedBatchForPrint,
    setSelectedBatchForPrint,
    highlightedBatchId,
    setHighlightedBatchId,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
