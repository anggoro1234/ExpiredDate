export type ProductCategory = 
  | 'Dairy & Eggs'
  | 'Bakery'
  | 'Fresh Meat & Seafood'
  | 'Prepared & Deli'
  | 'Produce & Salads'
  | 'Beverages & Juices'
  | 'Packaged Grocery'
  | 'Health & Personal Care';

export type StorageCondition = 'ambient' | 'chilled' | 'frozen';

export type BatchStatus = 
  | 'fresh'
  | 'nearing_expiry'
  | 'critical'
  | 'expired'
  | 'relocated'
  | 'quarantined'
  | 'disposed'
  | 'returned';

export type OperationalAction = 
  | 'relocated_front'
  | 'relocated_clearance'
  | 'quarantined'
  | 'written_off'
  | 'vendor_returned'
  | 'donated';

export interface ProductCatalogItem {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  brand: string;
  unit: string;
  storage: StorageCondition;
  standardShelfLifeDays: number;
  barcode: string;
}

export interface InventoryBatch {
  id: string; // Internal unique identifier
  batchNumber: string; // Primary unique tracking key: LOT-[CAT]-[YYYYMMDD]-[SEQ]
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  storage: StorageCondition;
  receivedDate: string; // ISO date YYYY-MM-DD
  manufactureDate?: string;
  expirationDate: string; // ISO date or datetime YYYY-MM-DDTHH:mm:ss
  initialQuantity: number;
  currentQuantity: number;
  unit: string;
  location: string; // e.g. "Aisle 4 - Chiller Bay 2"
  supplier: string;
  status: BatchStatus;
  actionTaken?: OperationalAction;
  actionNotes?: string;
  actionTimestamp?: string;
  reviewedInClearanceQueue?: boolean;
}

export interface ExpirationCalculation {
  status: 'fresh' | 'nearing_expiry' | 'critical' | 'expired';
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  totalSecondsRemaining: number;
  isWithin30Days: boolean;
  isCritical: boolean; // <= 7 days
  isExpired: boolean; // <= 0
  formattedCountdown: string;
  severityLevel: 'safe' | 'warning' | 'urgent' | 'danger';
}

export interface OperationalRecommendation {
  urgencyTier: string;
  recommendedAction: string;
  actionType: 'standard_rotation' | 'front_shelf_relocation' | 'priority_dispense' | 'quarantine_disposal';
  badgeColor: string;
}

export interface BatchActionLog {
  id: string;
  batchId: string;
  batchNumber: string;
  productName: string;
  action: OperationalAction;
  details: string;
  quantityAffected: number;
  timestamp: string;
  performedBy: string;
}

export interface InventoryStats {
  totalActiveBatches: number;
  totalUnits: number;
  safeBatchesCount: number;
  thresholdBatchesCount: number; // <= 30 days
  criticalBatchesCount: number; // <= 7 days
  expiredBatchesCount: number; // <= 0 days
  urgentActionNeededCount: number;
}
