import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExpiration,
  is1MonthThresholdAlertTriggered,
  getOperationalRecommendation,
} from './expiration';

test('calculateExpiration detects fresh item (> 30 days)', () => {
  const reference = new Date('2026-11-09T12:00:00Z');
  const expiration = new Date('2026-12-25T12:00:00Z'); // 46 days later
  const calc = calculateExpiration(expiration, reference);

  assert.equal(calc.status, 'fresh');
  assert.equal(calc.severityLevel, 'safe');
  assert.equal(calc.isWithin30Days, false);
  assert.equal(calc.isExpired, false);
  assert.ok(calc.daysRemaining >= 45);
});

test('calculateExpiration detects item entering 1-month threshold (<= 30 days and > 7 days)', () => {
  const reference = new Date('2026-11-09T12:00:00Z');
  const expiration = new Date('2026-11-29T12:00:00Z'); // 20 days later
  const calc = calculateExpiration(expiration, reference);

  assert.equal(calc.status, 'nearing_expiry');
  assert.equal(calc.severityLevel, 'warning');
  assert.equal(calc.isWithin30Days, true);
  assert.equal(calc.isCritical, false);
  assert.equal(calc.daysRemaining, 20);
});

test('calculateExpiration detects critical item (< 7 days)', () => {
  const reference = new Date('2026-11-09T12:00:00Z');
  const expiration = new Date('2026-11-13T12:00:00Z'); // 4 days later
  const calc = calculateExpiration(expiration, reference);

  assert.equal(calc.status, 'critical');
  assert.equal(calc.severityLevel, 'urgent');
  assert.equal(calc.isWithin30Days, true);
  assert.equal(calc.isCritical, true);
  assert.equal(calc.daysRemaining, 4);
});

test('calculateExpiration detects expired item (<= 0 days)', () => {
  const reference = new Date('2026-11-09T12:00:00Z');
  const expiration = new Date('2026-11-08T12:00:00Z'); // 1 day in past
  const calc = calculateExpiration(expiration, reference);

  assert.equal(calc.status, 'expired');
  assert.equal(calc.severityLevel, 'danger');
  assert.equal(calc.isExpired, true);
  assert.equal(calc.isWithin30Days, false);
});

test('is1MonthThresholdAlertTriggered accurately triggers modal condition', () => {
  const reference = '2026-11-09T12:00:00Z';
  // 15 days left: should trigger
  assert.equal(is1MonthThresholdAlertTriggered('2026-11-24T12:00:00Z', reference), true);
  // 60 days left: should NOT trigger
  assert.equal(is1MonthThresholdAlertTriggered('2027-01-08T12:00:00Z', reference), false);
  // already expired: should NOT trigger threshold alert (it is expired)
  assert.equal(is1MonthThresholdAlertTriggered('2026-11-01T12:00:00Z', reference), false);
});

test('getOperationalRecommendation provides operational guidance without pricing', () => {
  const rec25 = getOperationalRecommendation(25);
  assert.equal(rec25.actionType, 'standard_rotation');
  assert.ok(rec25.urgencyTier.includes('1 Bulan'));

  const rec5 = getOperationalRecommendation(5);
  assert.equal(rec5.actionType, 'front_shelf_relocation');
  assert.ok(rec5.urgencyTier.includes('Kritis'));

  const rec1 = getOperationalRecommendation(1);
  assert.equal(rec1.actionType, 'priority_dispense');

  const recExpired = getOperationalRecommendation(0);
  assert.equal(recExpired.actionType, 'quarantine_disposal');
  assert.ok(recExpired.recommendedAction.includes('Karantina'));
});
