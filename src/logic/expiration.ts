import { ExpirationCalculation, OperationalRecommendation } from '../types';

export const THRESHOLD_1_MONTH_DAYS = 30;
export const THRESHOLD_CRITICAL_DAYS = 7;

/**
 * Calculates dynamic real-time expiration countdown and status
 * comparing expiration date against current reference timestamp.
 * Live-updates continuously based on the running clock.
 */
export function calculateExpiration(
  expirationDateInput: string | Date,
  referenceDateInput: string | Date = new Date()
): ExpirationCalculation {
  const expTime = new Date(expirationDateInput).getTime();
  const refTime = new Date(referenceDateInput).getTime();

  if (isNaN(expTime)) {
    return {
      status: 'expired',
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      totalSecondsRemaining: 0,
      isWithin30Days: false,
      isCritical: false,
      isExpired: true,
      formattedCountdown: 'Tanggal Tidak Valid',
      severityLevel: 'danger',
    };
  }

  const diffMs = expTime - refTime;
  const isExpired = diffMs <= 0;
  const totalSecondsRemaining = Math.max(0, Math.floor(diffMs / 1000));

  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60));
  const remainingSeconds = Math.floor((Math.abs(diffMs) % (1000 * 60)) / 1000);

  // Urgency categories
  let status: 'fresh' | 'nearing_expiry' | 'critical' | 'expired';
  let severityLevel: 'safe' | 'warning' | 'urgent' | 'danger';

  if (isExpired) {
    status = 'expired';
    severityLevel = 'danger';
  } else if (totalDays < THRESHOLD_CRITICAL_DAYS) {
    status = 'critical';
    severityLevel = 'urgent';
  } else if (totalDays <= THRESHOLD_1_MONTH_DAYS) {
    status = 'nearing_expiry';
    severityLevel = 'warning';
  } else {
    status = 'fresh';
    severityLevel = 'safe';
  }

  const isWithin30Days = !isExpired && totalDays <= THRESHOLD_1_MONTH_DAYS;
  const isCritical = !isExpired && totalDays < THRESHOLD_CRITICAL_DAYS;

  // Formatted countdown string (indonesian & universal operational terms)
  let formattedCountdown = '';
  if (isExpired) {
    const expiredDaysAgo = Math.abs(totalDays);
    formattedCountdown = expiredDaysAgo === 0 ? 'Kedaluwarsa Hari Ini' : `Lewat ${expiredDaysAgo} hari lalu`;
  } else if (totalDays > 0) {
    formattedCountdown = `${totalDays}h ${remainingHours}j ${remainingMinutes}m ${remainingSeconds}d`;
  } else {
    formattedCountdown = `${remainingHours}j ${remainingMinutes}m ${remainingSeconds}d`;
  }

  return {
    status,
    daysRemaining: isExpired ? totalDays : Math.max(0, totalDays),
    hoursRemaining: remainingHours,
    minutesRemaining: remainingMinutes,
    secondsRemaining: remainingSeconds,
    totalSecondsRemaining,
    isWithin30Days,
    isCritical,
    isExpired,
    formattedCountdown,
    severityLevel,
  };
}

/**
 * Checks if an item has entered the 1-month (30 days) threshold
 * and is not yet expired.
 */
export function is1MonthThresholdAlertTriggered(
  expirationDateInput: string | Date,
  referenceDateInput: string | Date = new Date()
): boolean {
  const calc = calculateExpiration(expirationDateInput, referenceDateInput);
  return calc.isWithin30Days;
}

/**
 * Operational action recommendation engine based purely on shelf life urgency.
 * (No price values - purely operational rotation and quarantine management).
 */
export function getOperationalRecommendation(daysRemaining: number): OperationalRecommendation {
  if (daysRemaining <= 0) {
    return {
      urgencyTier: 'Kedaluwarsa (Expired)',
      recommendedAction: 'Karantina segera dari rak display. Pisahkan untuk pemusnahan atau retur supplier.',
      actionType: 'quarantine_disposal',
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
    };
  } else if (daysRemaining <= 3) {
    return {
      urgencyTier: 'Sangat Kritis (≤3 Hari)',
      recommendedAction: 'Prioritas tertinggi! Pindahkan ke rak kasir / display depan untuk pengeluaran instan.',
      actionType: 'priority_dispense',
      badgeColor: 'bg-red-950 text-red-300 border-red-700',
    };
  } else if (daysRemaining <= 7) {
    return {
      urgencyTier: 'Kritis (≤7 Hari)',
      recommendedAction: 'Tarik ke depan rak (front shelf placement) dan beri label prioritas FIFO.',
      actionType: 'front_shelf_relocation',
      badgeColor: 'bg-orange-950 text-orange-300 border-orange-700',
    };
  } else if (daysRemaining <= THRESHOLD_1_MONTH_DAYS) {
    return {
      urgencyTier: 'Ambang Batas 1 Bulan (≤30 Hari)',
      recommendedAction: 'Pantau perputaran stok. Pastikan batch baru berada di belakang lot ini.',
      actionType: 'standard_rotation',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-700',
    };
  }

  return {
    urgencyTier: 'Aman / Fresh (>30 Hari)',
    recommendedAction: 'Kondisi stok normal. Lanjutkan rotasi FIFO standar gudang dan display.',
    actionType: 'standard_rotation',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  };
}
