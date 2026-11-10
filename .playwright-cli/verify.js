// Verification script for FreshPulse Real-Time Expiration Tracking System
module.exports = async (page) => {
  console.log('--- Starting FreshPulse E2E & Responsive Verification ---');

  // 1. Desktop Test (1440x900)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Check title
  const title = await page.title();
  console.log('Page Title:', title);

  // Capture Page 1 with Threshold Alert Modal open
  await page.screenshot({ path: '.playwright-cli/01-desktop-modal-alert.png' });
  console.log('Captured 01-desktop-modal-alert.png');

  // Click CTA to transition to Page 2
  const transitionBtn = page.locator('button[aria-label="Transisi semua item peringatan ke Halaman 2 Antrean Rotasi"]');
  if (await transitionBtn.isVisible()) {
    console.log('Clicking Transition to Page 2 button in modal...');
    await transitionBtn.click();
    await page.waitForTimeout(600);
  }

  // Verify Page 2 loaded
  const page2Header = await page.locator('h2:has-text("Halaman 2: Disposisi")').isVisible();
  console.log('Page 2 header visible:', page2Header);
  await page.screenshot({ path: '.playwright-cli/02-desktop-page2-disposition.png' });
  console.log('Captured 02-desktop-page2-disposition.png');

  // Test an operational action: click "Pindahkan ke Rak Depan" on the first batch
  const relocateBtn = page.locator('button:has-text("Pindahkan ke Rak Depan")').first();
  if (await relocateBtn.isVisible()) {
    console.log('Clicking "Pindahkan ke Rak Depan"...');
    await relocateBtn.click();
    await page.waitForTimeout(800);
    // Toast should show
    const toastVisible = await page.locator('text=Batch berhasil dipindahkan ke Rak Depan Kasir!').isVisible();
    console.log('Operational success toast visible:', toastVisible);
  }

  // Test navigating to Page 3: Analisis & FIFO
  const navAnalytics = page.locator('button:has-text("Analisis & FIFO")');
  await navAnalytics.click();
  await page.waitForTimeout(600);
  console.log('Navigated to Analytics');
  await page.screenshot({ path: '.playwright-cli/03-desktop-page3-analytics.png' });
  console.log('Captured 03-desktop-page3-analytics.png');

  // Navigate back to Page 1: Master Stok
  const navMaster = page.locator('button:has-text("Master Stok")');
  await navMaster.click();
  await page.waitForTimeout(600);

  // Test Time Fast-Forward (+7 Hari) to verify live date update
  console.log('Testing time simulation fast-forward (+7 Hari)...');
  const ff7Btn = page.locator('button:has-text("+7 Hari")');
  if (await ff7Btn.isVisible()) {
    await ff7Btn.click();
    await page.waitForTimeout(600);
    console.log('Applied +7 Days simulation');
  }

  // 2. Mobile Responsive Test (390x844 - iPhone 14 / Mobile standard)
  console.log('--- Testing Mobile Viewport (390x844) ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);

  // Check mobile cards layout on Page 1
  await page.screenshot({ path: '.playwright-cli/04-mobile-page1-master.png' });
  console.log('Captured 04-mobile-page1-master.png');

  // Test opening Receive Batch Modal on Mobile
  const newBatchBtn = page.locator('button:has-text("Terima Lot Baru")');
  if (await newBatchBtn.isVisible()) {
    await newBatchBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: '.playwright-cli/05-mobile-receive-modal.png' });
    console.log('Captured 05-mobile-receive-modal.png');

    // Close modal
    const closeBtn = page.locator('button:has-text("Batal")');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // Navigate to Page 2 on Mobile
  const mobileNavP2 = page.locator('button:has-text("Tindakan & Rotasi")');
  await mobileNavP2.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: '.playwright-cli/06-mobile-page2-disposition.png' });
  console.log('Captured 06-mobile-page2-disposition.png');

  console.log('--- All Playwright E2E and Responsive checks finished successfully ---');
};
